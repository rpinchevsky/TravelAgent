# Detailed Design

**Change:** Parallelize per-day HTML fragment generation in the render pipeline
**Date:** 2026-03-15
**Author:** Development Team
**HLD Reference:** `technical_documents/2026-03-15_parallel-render-fragments/high_level_design.md`
**Status:** Draft

---

## 1. File Changes

### 1.1 `rendering-config.md` — § Step 2: Per-Day Fragment Generation

**Action:** Modify

**Current state:**
```markdown
### Step 2: Per-Day Fragment Generation

Generate HTML **one day at a time**. Each `day_XX.md` produces one HTML fragment containing:
- The `<div class="day-card" id="day-{N}">` wrapper with banner.
- The itinerary table for that day.
- All POI cards for that day.
- The daily budget pricing grid.
- Plan B advisory section.

This per-day approach avoids output token limits — each day's HTML is generated independently.
```

**Target state:**
```markdown
### Step 2: Per-Day Fragment Generation

Generate per-day HTML fragments using batched parallel subagents for full generation mode. Each `day_XX.md` produces one HTML fragment file containing:
- The `<div class="day-card" id="day-{N}">` wrapper with banner.
- The itinerary table for that day.
- All POI cards for that day.
- The daily budget pricing grid.
- Plan B advisory section.

This per-day approach avoids output token limits — each day's HTML is generated independently.

#### Step 2a: Shell, Overview, and Budget Fragments (Sequential)

Generate shell fragments (PAGE_TITLE, NAV_LINKS, NAV_PILLS), the overview fragment, and the budget fragment sequentially. These are fast and may provide context needed by day fragment subagents.

#### Step 2b: Batch Assignment for Day Fragments

Divide all days (day_00 through day_NN) into contiguous batches using the same sizing table as Phase B (see `content_format_rules.md` § Day Generation Protocol):

| Total Days (N) | Batch Count | Batch Size |
|---|---|---|
| 0 | 0 | — (no day fragments to generate) |
| 1 | 1 | 1 |
| 2-3 | 2 | ceil(N/2) |
| 4-11 | 3 | ceil(N/3) |
| 12+ | 4 | ceil(N/4) |

Batches are assigned in chronological order: batch 1 gets the lowest-numbered days, batch 2 the next range, etc. The last batch may contain fewer days (remainder). Every day must appear in exactly one batch — no gaps, no overlaps.

**Example:** 12 days (day_00 through day_11), 4 batches of ceil(12/4) = 3:
- Batch 1: day_00, day_01, day_02
- Batch 2: day_03, day_04, day_05
- Batch 3: day_06, day_07, day_08
- Batch 4: day_09, day_10, day_11

#### Step 2c: Parallel Subagent Execution

Spawn one subagent per batch using the Agent tool. **All subagent calls must appear in the same response block** so they execute in parallel, not sequentially.

Each subagent receives the context defined in Step 2.5 (Agent Prompt Contract) plus its batch-specific day assignment.

Each subagent:
- Reads only its assigned `day_XX_LANG.md` files from the trip folder.
- Generates one `fragment_day_XX.html` file per assigned day, written to the trip folder.
- Each fragment file contains only the `<div class="day-card" id="day-{N}">...</div>` block — no `<html>`, `<head>`, or `<body>` wrappers.
- Does NOT read or write fragment files outside its assigned day range.
- Does NOT modify `manifest.json`, shell fragments, overview, or budget.

#### Step 2d: Fragment Verification

After all subagents return, verify that every expected fragment file (`fragment_day_00.html` through `fragment_day_NN.html`) exists in the trip folder.

- **All present:** Proceed to Step 3 (Assembly).
- **Missing fragments:** Identify the failed batch(es). Re-spawn one subagent per failed batch (single retry). After retry, verify again:
  - All present: proceed to Step 3.
  - Still missing: report the missing day numbers and stop. Do NOT proceed to assembly with incomplete fragments.

Verification checks fragment file existence only — content validation happens in Step 4 (pre-regression gate).

**Incremental rebuild exception:** When operating in incremental rebuild mode (single-day edits via `stale_days`), skip batch assignment and generate only the stale fragment(s) sequentially. Parallel batching applies only to full generation mode.
```

**Rationale:** Replaces the sequential one-at-a-time generation with a parallel batch pattern that mirrors Phase B. The batch table, chronological ordering, and verification/retry logic directly satisfy REQ-001, REQ-002, REQ-004, and REQ-005. The incremental rebuild exception satisfies REQ-007.

---

### 1.2 `rendering-config.md` — § Step 2.5: Agent Prompt Contract

**Action:** Modify

**Current state:**
```markdown
### Step 2.5: Agent Prompt Contract (Mandatory)
When delegating HTML generation to a sub-agent, the prompt MUST include these 9 items:
1. The full `TripPage.ts` — defines the structural contract (CSS classes, IDs, locators)
2. The `rendering-config.md` — component structure and design system rules
3. Explicit list of required section IDs: `#overview`, `#budget`, `#day-0` (if applicable) through `#day-N`
4. Advisory class rules: `.advisory--warning` = Holiday Advisory ONLY; `.advisory--info` = Plan B + Logistics
5. Pro-tip rule: wrap in `<div class="pro-tip">`, not just `<strong>` text
6. SVG rule: sidebar links need inline `<svg>` with explicit `width`/`height`
7. CSS inlining rule: full CSS in `<style>` tag, never `<link>`
8. Activity label linking rule: POI-referencing labels use `<a class="activity-label" href="#poi-day-{D}-{N}">`, POI cards have matching `id="poi-day-{D}-{N}"`
9. **Modular source rule:** HTML is generated per-day from individual `day_XX.md` files, not from a monolithic trip file. The agent must read each day file separately and produce one HTML fragment per day.

**Gate:** Never delegate HTML generation without all 9 items in the prompt. See `development_rules.md` Rule 4.
```

**Target state:**
```markdown
### Step 2.5: Agent Prompt Contract (Mandatory)
When delegating HTML fragment generation to a sub-agent (whether for full parallel generation or single-day incremental rebuild), the prompt MUST include these items:

#### Core Contract (9 mandatory items)
1. The full `TripPage.ts` — defines the structural contract (CSS classes, IDs, locators)
2. The `rendering-config.md` — component structure and design system rules
3. Explicit list of required section IDs: `#overview`, `#budget`, `#day-0` (if applicable) through `#day-N`
4. Advisory class rules: `.advisory--warning` = Holiday Advisory ONLY; `.advisory--info` = Plan B + Logistics
5. Pro-tip rule: wrap in `<div class="pro-tip">`, not just `<strong>` text
6. SVG rule: sidebar links need inline `<svg>` with explicit `width`/`height`
7. CSS inlining rule: full CSS in `<style>` tag, never `<link>`
8. Activity label linking rule: POI-referencing labels use `<a class="activity-label" href="#poi-day-{D}-{N}">`, POI cards have matching `id="poi-day-{D}-{N}"`
9. **Modular source rule:** HTML is generated per-day from individual `day_XX.md` files, not from a monolithic trip file. The agent must read each day file separately and produce one HTML fragment file per day.

#### Batch-Specific Context (for parallel day fragment generation)
10. **Assigned day list:** Explicit list of day numbers the subagent must generate (e.g., "Generate fragments for day_03, day_04, day_05"). The subagent generates ONLY these days.
11. **Day source files:** Only the `day_XX_LANG.md` files for the assigned batch — not all day files.
12. **Shell context (read-only):** `overview_LANG.md` and `manifest.json` for cross-referencing (trip metadata, navigation structure). The subagent does NOT regenerate shell, overview, or budget fragments.
13. **Fragment output path:** The trip folder path where `fragment_day_XX.html` files must be written.

**Gate:** Never delegate HTML generation without all 9 core items in the prompt. For parallel batch subagents, items 10-13 are also mandatory. See `development_rules.md` Rule 4.
```

**Rationale:** Extends the contract with batch-specific items (10-13) so each subagent knows exactly which days to generate, where to find source files, and where to write output. The 9 core items remain unchanged to maintain backward compatibility with incremental rebuild mode. Satisfies REQ-003.

---

### 1.3 `rendering-config.md` — § Step 3: Assembly & Final Export

**Action:** Modify (minor)

**Current state:**
```markdown
### Step 3: Assembly & Final Export
1. **Read** (do not modify) `base_layout.html` to use as a template.
2. **Assemble** `{{TRIP_CONTENT}}` by concatenating: overview fragment + day fragments (in order) + budget fragment.
3. **Inject** all fragments into the placeholders.
4. **Save** the result as `trip_full.html` inside the trip folder.
5. **Validation:** Ensure the original `base_layout.html` still contains its `{{PAGE_TITLE}}`, `{{NAV_LINKS}}`, `{{NAV_PILLS}}`, `{{TRIP_CONTENT}}` placeholders for future use.
```

**Target state:**
```markdown
### Step 3: Assembly & Final Export
1. **Read** (do not modify) `base_layout.html` to use as a template.
2. **Assemble** `{{TRIP_CONTENT}}` by concatenating: overview fragment + day fragment files (read `fragment_day_00.html` through `fragment_day_NN.html` in chronological order) + budget fragment.
3. **Inject** all fragments into the placeholders.
4. **Save** the result as `trip_full_LANG.html` inside the trip folder.
5. **Validation:** Ensure the original `base_layout.html` still contains its `{{PAGE_TITLE}}`, `{{NAV_LINKS}}`, `{{NAV_PILLS}}`, `{{TRIP_CONTENT}}` placeholders for future use.
```

**Rationale:** Makes explicit that day fragments are read from `fragment_day_XX.html` files on disk (written by subagents in Step 2c) rather than held in memory. Also corrects filename to include the `_LANG` suffix per project naming conventions. Satisfies REQ-005 AC-3 and REQ-006 AC-3.

---

### 1.4 `.claude/skills/render/SKILL.md` — § Step 2: Per-Day Fragment Generation

**Action:** Modify

**Current state:**
```markdown
### Step 2: Per-Day Fragment Generation

Follow `rendering-config.md` → "HTML Generation Pipeline (Fragment Master Mode)":
1. Generate shell fragments (PAGE_TITLE, NAV_LINKS, NAV_PILLS) from `overview_LANG.md` + `manifest.json`
2. Generate one HTML fragment per `day_XX_LANG.md` — each produces a `<div class="day-card" id="day-{N}">` block
3. Generate overview fragment from `overview_LANG.md`
4. Generate budget fragment from `budget_LANG.md`

All component rules, CSS class requirements, POI card structure, activity label linking, SVG attributes, CSS inlining, and flag rendering rules are defined in `rendering-config.md`. Follow that file — it is the single source of truth for rendering.
```

**Target state:**
```markdown
### Step 2: Per-Day Fragment Generation

Follow `rendering-config.md` → "HTML Generation Pipeline (Fragment Master Mode)":

**Step 2a — Sequential fragments:**
1. Generate shell fragments (PAGE_TITLE, NAV_LINKS, NAV_PILLS) from `overview_LANG.md` + `manifest.json`
2. Generate overview fragment from `overview_LANG.md`
3. Generate budget fragment from `budget_LANG.md`

**Step 2b — Batch assignment:**
4. Determine batch count from the batch sizing table in `rendering-config.md` § Step 2b (same table as Phase B in `content_format_rules.md`).
5. Assign days to batches in chronological order.

**Step 2c — Parallel day fragment generation:**
6. Spawn one Agent-tool subagent per batch in a **single response block** (parallel execution).
7. Each subagent receives: the 9-item core contract (§ 2.5) + batch-specific items 10-13. It reads its assigned `day_XX_LANG.md` files and writes `fragment_day_XX.html` files to the trip folder.

**Step 2d — Verification:**
8. Verify all `fragment_day_XX.html` files exist (day_00 through day_NN).
9. If any missing: re-spawn failed batch subagent(s) once. If still missing after retry, report and stop.

All component rules, CSS class requirements, POI card structure, activity label linking, SVG attributes, CSS inlining, and flag rendering rules are defined in `rendering-config.md`. Follow that file — it is the single source of truth for rendering.

**Incremental rebuild exception:** When in incremental mode (stale_days), generate only the stale day fragment(s) sequentially — do not use batch parallelization.
```

**Rationale:** Updates the skill's step-by-step workflow to match the new parallel orchestration in `rendering-config.md`. Keeps the skill file as a concise workflow reference that points to `rendering-config.md` for full details. Satisfies REQ-001 through REQ-005 and REQ-007.

---

## 2. Markdown Format Specification

No new markdown sections are introduced by this change. The per-day markdown format (`day_XX_LANG.md`) is unchanged. The change affects only the HTML rendering pipeline's orchestration, not its input or output formats.

## 3. HTML Rendering Specification

### Fragment File Format

**File name:** `fragment_day_XX.html` where `XX` is the zero-padded two-digit day number.
**Location:** Inside the trip folder (e.g., `generated_trips/trip_2026-03-15_0900/fragment_day_03.html`).

**Content structure:**
```html
<div class="day-card" id="day-{N}">
  <div class="day-card__banner">
    <h2 class="day-card__banner-title">День {N} — {Title} {Emoji}</h2>
    <span class="day-card__banner-date">{Date}</span>
  </div>
  <div class="day-card__content">
    <a class="map-link" ...>...</a>
    <div class="itinerary-table-wrapper">...</div>
    <div class="itinerary-grid">
      <!-- POI cards -->
    </div>
    <div class="pricing-grid">...</div>
    <div class="advisory advisory--info">...</div>
  </div>
</div>
```

**Constraints:**
- Fragment contains ONLY the `<div class="day-card" id="day-{N}">...</div>` block.
- No `<!DOCTYPE>`, `<html>`, `<head>`, `<body>`, or `<style>` wrappers.
- No shell elements (sidebar, nav pills, page title).
- Each fragment is self-contained: all POI card IDs (`id="poi-day-{D}-{N}"`), activity label links (`href="#poi-day-{D}-{N}"`), and internal cross-references resolve within the fragment or to well-known section IDs.

This is the same HTML structure that Step 2 currently produces in memory — the only difference is that it is now written to a file on disk.

## 4. Rule File Updates

| Rule File | Section | Change |
|---|---|---|
| `rendering-config.md` | § Step 2: Per-Day Fragment Generation | Replace sequential generation with Step 2a-2d (batch assignment, parallel subagents, verification) |
| `rendering-config.md` | § Step 2.5: Agent Prompt Contract | Add items 10-13 (batch-specific context) alongside existing 9 core items |
| `rendering-config.md` | § Step 3: Assembly & Final Export | Minor: clarify that day fragments are read from `fragment_day_XX.html` files |
| `rendering-config.md` | § Incremental HTML Rebuild | No change (add note: parallel batching does not apply) |
| `.claude/skills/render/SKILL.md` | § Step 2: Per-Day Fragment Generation | Rewrite to match new Step 2a-2d workflow |

Files NOT changed:
- `content_format_rules.md` — Phase B batch table referenced but not modified
- `base_layout.html` — template unchanged
- `rendering_style_config.css` — CSS unchanged
- `TripPage.ts` — test locators unchanged (HTML structure identical)
- `development_rules.md` — pre-regression gate unchanged
- `manifest.json` schema — no new fields needed

## 5. Implementation Checklist

- [ ] Update `rendering-config.md` § Step 2 with Step 2a-2d (sequential fragments, batch assignment, parallel subagents, verification)
- [ ] Update `rendering-config.md` § Step 2.5 to add batch-specific contract items 10-13
- [ ] Update `rendering-config.md` § Step 3 to clarify fragment file reading
- [ ] Update `.claude/skills/render/SKILL.md` § Step 2 with new parallel workflow
- [ ] Verify incremental rebuild sections in both files explicitly note the parallel exclusion
- [ ] Generate a test trip HTML using the updated pipeline to confirm output equivalence
- [ ] Run `/regression` to verify no test regressions from the orchestration change

## 6. BRD Traceability

| Requirement | Acceptance Criterion | Implemented in |
|---|---|---|
| REQ-001 | AC-1: Batch count follows table | `rendering-config.md` § Step 2b (batch sizing table) |
| REQ-001 | AC-2: Chronological batch order | `rendering-config.md` § Step 2b ("Batches are assigned in chronological order") |
| REQ-001 | AC-3: Every day in exactly one batch | `rendering-config.md` § Step 2b ("no gaps, no overlaps") |
| REQ-001 | AC-4: Last batch may have fewer days | `rendering-config.md` § Step 2b ("remainder") |
| REQ-002 | AC-1: All subagents in single response block | `rendering-config.md` § Step 2c + `.claude/skills/render/SKILL.md` § Step 2c |
| REQ-002 | AC-2: Each subagent generates only its days | `rendering-config.md` § Step 2c ("Does NOT read or write fragment files outside its assigned day range") |
| REQ-002 | AC-3: Predictable output location | `rendering-config.md` § Step 2c (`fragment_day_XX.html` in trip folder) |
| REQ-002 | AC-4: 3-4x wall-clock reduction | Architectural consequence of parallel execution; verified empirically |
| REQ-003 | AC-1: All 9 mandatory items | `rendering-config.md` § Step 2.5 core contract (items 1-9 unchanged) |
| REQ-003 | AC-2: Only assigned batch day files | `rendering-config.md` § Step 2.5 item 11 |
| REQ-003 | AC-3: Shell context read-only | `rendering-config.md` § Step 2.5 item 12 |
| REQ-003 | AC-4: Explicit day number list | `rendering-config.md` § Step 2.5 item 10 |
| REQ-004 | AC-1: Verify all fragments after subagents return | `rendering-config.md` § Step 2d |
| REQ-004 | AC-2: Single retry per failed batch | `rendering-config.md` § Step 2d |
| REQ-004 | AC-3: Stop if still missing after retry | `rendering-config.md` § Step 2d |
| REQ-004 | AC-4: Existence check only | `rendering-config.md` § Step 2d ("content validation happens in Step 4") |
| REQ-005 | AC-1: One fragment file per day | `rendering-config.md` § Step 2c (`fragment_day_XX.html`) |
| REQ-005 | AC-2: Fragment contains only day-card div | `rendering-config.md` § Step 2c + DD §3 (fragment file format) |
| REQ-005 | AC-3: Read in chronological order during assembly | `rendering-config.md` § Step 3 |
| REQ-005 | AC-4: Retained for incremental rebuild | `rendering-config.md` § Step 2c ("intermediate artifacts") |
| REQ-006 | AC-1: Shell fragments before day fragments | `rendering-config.md` § Step 2a (sequential, before 2b-2c) |
| REQ-006 | AC-2: Overview/budget sequential | `rendering-config.md` § Step 2a |
| REQ-006 | AC-3: Assembly after all fragments verified | `rendering-config.md` § Step 2d → Step 3 |
| REQ-006 | AC-4: Pre-regression unchanged | No changes to Step 4 |
| REQ-006 | AC-5: Output structurally identical | Fragment content unchanged; only orchestration differs |
| REQ-007 | AC-1: Incremental mode sequential | `rendering-config.md` § Step 2 incremental exception + `.claude/skills/render/SKILL.md` |
| REQ-007 | AC-2: Full mode uses parallel batches | `rendering-config.md` § Step 2b-2c |
