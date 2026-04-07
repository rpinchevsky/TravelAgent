# High-Level Design

**Change:** HTML Render Pipeline Optimization — Script-Based Shell Fragments & Template-Engine Day Generation
**Date:** 2026-04-03
**Author:** Development Team
**BRD Reference:** `technical_documents/2026-04-03_html-render-optimization/business_requirements.md`
**Status:** Draft

---

## 1. Overview

The current `/render` skill delegates two categories of deterministic work to LLM subagents:

1. **Shell fragment generation (Step 2a):** Reads `manifest.json` and produces three string interpolations (`PAGE_TITLE`, `NAV_LINKS`, `NAV_PILLS`). These require no generative intelligence — they are pure data transformations.

2. **HTML fragment generation (Steps 2b–2d):** Spawns 4–8+ parallel LLM subagents, each loading ~75 KB of context (rendering rules + CSS + POM), to convert structured Markdown into HTML following fixed structural rules. This consumes ~600 KB of input tokens per 12-day trip render and takes 5–10 minutes.

This change replaces both categories with two deterministic TypeScript/Node.js scripts:

- **`generate_shell_fragments.ts`** — Reads `manifest.json`, outputs the three shell fragment strings in under 500 ms.
- **`generate_html_fragments.ts`** — Reads all markdown source files, applies every structural rule from `rendering-config.md` via a parser+template engine, outputs all `fragment_*.html` files in under 10 seconds.

The render SKILL.md is updated to invoke these scripts instead of spawning LLM subagents. The assembly step (Step 3) and pre-regression gate (Step 4) are unchanged.

**Expected impact:** Render time drops from 5–10 minutes to under 15 seconds. Token cost for the render phase drops from ~600 KB to near zero. Output determinism improves — no hallucination of CSS classes, missing POI cards, or structural drift.

---

## 2. Affected Components

| Component | File(s) | Type of Change |
|---|---|---|
| Shell fragment script (new) | `automation/scripts/generate_shell_fragments.ts` | New file |
| HTML fragment script (new) | `automation/scripts/generate_html_fragments.ts` | New file |
| Render skill | `.claude/skills/render/SKILL.md` | Modified — Steps 2a, 2c rewritten; 2b/2d/2.5 removed/updated |
| Render pipeline docs | `rendering-config.md` § HTML Generation Pipeline Steps 2a–2d, 2.5 | Modified — replace subagent model with script invocation model |
| Base layout template | `base_layout.html` | No change |
| CSS source | `rendering_style_config.css` | No change |
| POM contract | `automation/code/tests/pages/TripPage.ts` | No change |
| Playwright test specs | `automation/code/tests/regression/` | No change (validation only) |
| Content format rules | `content_format_rules.md` | No change |

**New files created:**

| File | Purpose |
|---|---|
| `automation/scripts/generate_shell_fragments.ts` | REQ-001: deterministic PAGE_TITLE, NAV_LINKS, NAV_PILLS from manifest |
| `automation/scripts/generate_html_fragments.ts` | REQ-002: full markdown-to-HTML template engine for all fragment types |

---

## 3. Data Flow

### 3.1 Current Flow (LLM subagent model)

```
manifest.json + overview_LANG.md
    → LLM subagent (Step 2a)
        → PAGE_TITLE, NAV_LINKS, NAV_PILLS (strings in memory)

day_XX_LANG.md (batched)
overview_LANG.md, budget_LANG.md, accommodation_LANG.md, car_rental_LANG.md
    → 4–8 parallel LLM subagents (Steps 2b–2d)
      each loading: rendering-config.md (37 KB) + CSS (36 KB) + TripPage.ts (9 KB) + day files
        → fragment_day_XX_LANG.html, fragment_overview_LANG.html,
          fragment_budget_LANG.html, fragment_accommodation_LANG.html,
          fragment_car_rental_LANG.html

All fragments + base_layout.html → Step 3 assembly → trip_full_LANG.html
```

**Token cost:** ~600 KB input tokens per 12-day render. Time: 5–10 minutes.

### 3.2 New Flow (script model)

```
manifest.json
    → generate_shell_fragments.ts (Node.js process, < 500 ms)
        → PAGE_TITLE (string)
        → NAV_LINKS (string)
        → NAV_PILLS (string)
        → written to trip folder as shell_fragments_LANG.json

day_XX_LANG.md (all days)
overview_LANG.md, budget_LANG.md, accommodation_LANG.md, car_rental_LANG.md
    → generate_html_fragments.ts (Node.js process, < 10 s for 12-day trip)
        → Parses each markdown file using structured parser
        → Applies rendering-config.md rules via TypeScript template functions
        → Writes fragment_day_XX_LANG.html (one per day)
        → Writes fragment_overview_LANG.html
        → Writes fragment_budget_LANG.html
        → Writes fragment_accommodation_LANG.html (if source exists)
        → Writes fragment_car_rental_LANG.html (if source exists)

All fragments + base_layout.html → Step 3 assembly (unchanged) → trip_full_LANG.html
```

**Token cost:** Near zero (scripts run in Node.js process, no LLM involved). Time: < 15 seconds total.

### 3.3 Script Invocation Contract

The SKILL.md invokes scripts via Bash:

```bash
# Step 2a replacement
rtk npx tsx automation/scripts/generate_shell_fragments.ts \
  --trip-folder "generated_trips/trip_YYYY-MM-DD_HHmm" \
  --lang "ru"
# Exit code 0 = success; non-zero = fail with error message to stderr

# Step 2c replacement  
rtk npx tsx automation/scripts/generate_html_fragments.ts \
  --trip-folder "generated_trips/trip_YYYY-MM-DD_HHmm" \
  --lang "ru"
# Exit code 0 = all fragments written; non-zero = fail with per-file error messages
```

---

## 4. Integration Points

### 4.1 Preserved Contracts (No Changes Required)

| Contract | Defined in | How Scripts Respect It |
|---|---|---|
| HTML CSS classes and IDs | `TripPage.ts` (POM) | Scripts hardcode identical class/ID strings; no runtime variation |
| POI card structure | `rendering-config.md` §POI Cards | Template function `renderPoiCard()` implements the spec exactly |
| Accommodation card structure | `rendering-config.md` §Accommodation | Separate `renderAccommodationCard()` function |
| Car rental structure | `rendering-config.md` §Car Rental | Separate `renderCarRentalCategory()` function |
| Activity label linking | `rendering-config.md` §Activity Labels | Two-pass algorithm: collect POI IDs in pass 1, resolve links in pass 2 |
| POI Parity Rule | `rendering-config.md` §POI Card Parity | Script counts `###` headings and asserts `.poi-card` output count matches |
| Fragment file names | `content_format_rules.md` | Scripts output `fragment_day_XX_LANG.html` etc. — identical naming |
| Navigation ordering | `rendering-config.md` §Step 2a | Shell fragment script enforces mandatory ordering in code |
| SVG requirements | `rendering-config.md` §SVG Requirements | SVG strings are constants in the script; `width`/`height`/`aria-hidden` always present |
| Themed container rule | `rendering-config.md` §Themed Container | Banner children always get explicit `color` — implemented as constants |

### 4.2 Step 3 Assembly (Unchanged)

Step 3 reads the same `fragment_*.html` files as before. The assembly logic in SKILL.md is unchanged. The scripts produce fragment files with identical content and naming, so Step 3 requires no modification.

### 4.3 Incremental Rebuild Path

The incremental rebuild path in SKILL.md uses `stale_days` from `manifest.json`. The new flow:
- Run `generate_html_fragments.ts --stale-only` with the list of stale day numbers
- Script generates only those day fragments (skips overview, budget, accommodation, car rental)
- SKILL.md replaces the stale `<div class="day-card" id="day-{N}">` sections in `trip_full_LANG.html`
- If nav changed (days added/removed), run `generate_shell_fragments.ts` to regenerate NAV_LINKS/NAV_PILLS

### 4.4 Runtime Environment

- Node.js v24.14.0 confirmed available
- `tsx` v4.21.0 confirmed available (`npx tsx`)
- No additional npm packages required (stdlib `fs`, `path` only; markdown parser is custom/built-in)
- Scripts placed in `automation/scripts/` — consistent with existing `automation/` folder structure

---

## 5. Impact on Existing Behavior

| Area | Impact | Backward Compatible? |
|---|---|---|
| HTML output structure | Scripts produce structurally identical HTML — same CSS classes, IDs, data attributes | Yes — no test changes needed |
| Token consumption for render | ~600 KB → near zero (per-render savings) | Yes — only improves |
| Render wall-clock time | 5–10 minutes → < 15 seconds | Yes — only improves |
| Playwright regression tests | All tests pass against script-generated HTML (no test modifications) | Yes |
| Incremental rebuild | Routes through `generate_html_fragments.ts --stale-only` instead of single LLM subagent | Yes — same file outputs |
| SKILL.md steps 2a/2c | Rewritten to describe script invocation | Yes — external behavior identical |
| SKILL.md step 2.5 (Agent Prompt Contract) | Replaced with Script Invocation Contract section | Yes — subagents no longer used |
| rendering-config.md pipeline docs | Steps 2a–2d, 2.5 rewritten to describe scripts | Yes — no runtime impact |
| Trip content generation (Phase A/B) | No change | Yes |
| Fragment file format | Identical to LLM output (same HTML structure) | Yes |
| Day 0 handling | Script generates day-0 fragment correctly; nav includes `#day-0` | Yes |

---

## 6. BRD Coverage Matrix

| Requirement | Addressed in HLD? | Section |
|---|---|---|
| REQ-001: Script-based shell fragment generation | Yes | §2, §3.2, §3.3 |
| REQ-002: Template-engine HTML fragment generation | Yes | §2, §3.2, §3.3 |
| REQ-003: Render skill pipeline update | Yes | §2, §3.3, §4.3 |
| REQ-004: Principal Engineer code review gate | Yes — process requirement; PE reviews implementation scripts | §4.1 (contract preservation) |
| REQ-005: No regression in output fidelity | Yes | §4.1 (all contracts preserved), §5 |

---

## 7. Architecture Decisions

### 7.1 Script Language: TypeScript via `tsx`

**Decision:** Both scripts are written in TypeScript and invoked via `npx tsx`.

**Rationale:** TypeScript is already the project's language (TripPage.ts, tsconfig.json). `tsx` v4.21.0 is confirmed available. Type safety is valuable for a correctness-critical script. No compilation step needed — `tsx` runs `.ts` directly.

**Alternative considered:** Node.js plain JavaScript — rejected because loss of type safety increases risk for a script implementing 40+ structural rules.

### 7.2 Markdown Parser: Custom Line-by-Line Parser

**Decision:** No third-party markdown parser library. Scripts implement a custom line-by-line parser tuned to the exact trip file format.

**Rationale:** The trip markdown format is highly structured and well-defined in `content_format_rules.md`. A general-purpose parser (marked, remark) would require complex AST traversal and still require custom logic for trip-specific constructs (POI card boundaries, pricing grids, plan-B sections). The custom parser is simpler, has zero dependencies, and is easier to audit during PE review.

**Risk mitigation:** PE review explicitly covers edge cases (missing fields, emoji handling, nested content).

### 7.3 SVG Strings: Inline Constants

**Decision:** All SVG icon strings (maps pin, globe, camera, phone, info circle, warning triangle) are defined as TypeScript constants in the script. They are never derived from input data.

**Rationale:** Eliminates the LLM's ability to hallucinate or vary SVG content. Every generated HTML will have identical SVG markup. This directly solves the `width`/`height` attribute drift observed with LLM output.

### 7.4 Shell Fragment Output: JSON File

**Decision:** `generate_shell_fragments.ts` writes a `shell_fragments_LANG.json` file to the trip folder containing `{"PAGE_TITLE": "...", "NAV_LINKS": "...", "NAV_PILLS": "..."}`.

**Rationale:** The SKILL.md Step 3 assembly reads this JSON to inject the three placeholders into `base_layout.html`. Writing to a file (rather than stdout) allows SKILL.md to use standard Read tool without parsing shell output. The file is an ephemeral build artifact — not tracked in manifest.

### 7.5 Two-Pass Day Parsing for Activity Label Linking

**Decision:** Each day file is parsed in two passes: pass 1 collects all POI heading names and assigns `poi-day-{D}-{N}` IDs; pass 2 generates the itinerary table HTML and resolves activity label references against the POI name index.

**Rationale:** Activity label linking requires knowing all POI IDs before rendering the itinerary table. Two-pass eliminates the need for forward-reference placeholders or post-processing string substitution.

### 7.6 Error Handling: Fail-Fast with Per-File Reporting

**Decision:** If any source markdown file fails to parse (missing required sections, unrecognized structure), the script exits with a non-zero code and prints the file path and error description to stderr. No partial output is written.

**Rationale:** Silent partial output is the most dangerous failure mode — it could produce an HTML file that looks complete but is missing POI cards. Fail-fast with clear error messages forces diagnosis before any output is used.
