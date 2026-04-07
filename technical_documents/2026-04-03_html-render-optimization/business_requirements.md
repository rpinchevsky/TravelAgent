# Business Requirements Document

**Change:** HTML Render Pipeline Optimization — Script-Based Shell Fragments & Template-Engine Day Generation
**Date:** 2026-04-03
**Author:** Product Manager
**Status:** Approved

---

## 1. Background & Motivation

The current `/render` skill uses LLM subagents for two categories of work that require no intelligence:

1. **Step 2a — Shell fragments (PAGE_TITLE, NAV_LINKS, NAV_PILLS):** These are pure string constructions derived from `manifest.json`. A sequential LLM subagent runs before the parallel day batches, adding latency and tokens without providing any generative value. It is a blocking step that delays the entire pipeline.

2. **Steps 2c/2d — Day/overview/budget/accommodation/car-rental fragments:** 8+ LLM subagents each load approximately 75 KB of context (`rendering-config.md` 37 KB + `rendering_style_config.css` 36 KB + `TripPage.ts` 9 KB + day files). This results in ~600 KB of input tokens per render run for a 12-day trip. HTML generation from markdown following fixed design-system rules is a deterministic transformation — LLM judgment adds no value and introduces inconsistency risk (hallucinated CSS classes, missed POI cards, wrong IDs).

**User request:** Implement Option 3 (script-based shell fragments) and Option 4 (template-engine HTML generation) together, using the abbreviated dev path. Apply a harsh principal-engineer code review, as performance-critical changes carry the highest regression risk.

**Expected outcome:** Render time drops from minutes to seconds, token usage for the render phase drops from ~600 KB to near zero, and output determinism improves (no hallucination of CSS classes or structure).

---

## 2. Scope

**In scope:**
- Replace Step 2a LLM subagent with a Bash/Node.js script that reads `manifest.json` and writes `PAGE_TITLE`, `NAV_LINKS`, and `NAV_PILLS` shell fragments
- Replace all Step 2c LLM subagents (day batches, overview, budget, accommodation, car rental) with a TypeScript/Node.js template-engine script that parses each markdown source file and produces the corresponding HTML fragment
- The script must implement 100% of the design-system rules currently enforced by `rendering-config.md` (POI cards, activity labels, accommodation cards, car rental cards, pricing grids, pro-tips, SVG rules, themed containers, etc.)
- Update `SKILL.md` (the render skill) to invoke the scripts instead of spawning LLM subagents
- Update `rendering-config.md` pipeline documentation to reflect the new deterministic execution model
- Maintain full backward compatibility: output HTML must pass all existing Playwright regression tests without modification
- Principal Engineer (PE) code review of the implementation scripts before merge — no implementation ships without PE sign-off

**Out of scope:**
- Changes to `base_layout.html` or `rendering_style_config.css` (they remain source templates)
- Changes to the Playwright test suite (tests validate the same HTML contract — no test changes needed)
- Changes to trip content generation (Phase A/B pipelines, day `.md` file format)
- Changes to the incremental rebuild path beyond what is required to route through the new scripts
- Changes to `content_format_rules.md` manifest schema
- Localization string changes (scripts must be language-agnostic)

**Affected rule files:**
- `rendering-config.md` — § HTML Generation Pipeline (Fragment Master Mode), Step 2a, Step 2b, Step 2c, Step 2d, Step 2.5 (Agent Prompt Contract)
- `.claude/skills/render/SKILL.md` — Workflow Steps 2 and onward

---

## 3. Requirements

### REQ-001: Script-Based Shell Fragment Generation (Option 3)

**Description:** A deterministic Bash or Node.js script replaces the Step 2a sequential LLM subagent. The script reads `manifest.json` (and optionally `overview_LANG.md` for title data) and produces the three shell fragments: `PAGE_TITLE`, `NAV_LINKS`, and `NAV_PILLS`. The script must handle all conditional nav entries: `#overview` always first, `#accommodation` if `accommodation_LANG.md` exists, `#car-rental` if `car_rental_LANG.md` exists, `#day-0` through `#day-N` in chronological order, `#budget` always last. The `is-active` class and `aria-current="page"` must be applied to the first navigation item only.

**Acceptance Criteria:**
- [ ] AC-1: Running the script against any valid `manifest.json` completes in under 500 ms wall-clock time
- [ ] AC-2: `NAV_LINKS` output contains exactly one `<a>` per section (`#overview`, conditional accommodation/car-rental, all days, `#budget`), in the mandatory ordering defined in `rendering-config.md`
- [ ] AC-3: `NAV_PILLS` ordering matches `NAV_LINKS` exactly (same section IDs, same order)
- [ ] AC-4: Exactly one `<a>` has `is-active` class and `aria-current="page"` — always the first link (`#overview`)
- [ ] AC-5: `#accommodation` link is present only when `accommodation_LANG.md` exists in the trip folder; absent otherwise
- [ ] AC-6: `#car-rental` link is present only when `car_rental_LANG.md` exists in the trip folder; absent otherwise
- [ ] AC-7: `PAGE_TITLE` matches the pattern `"{Destination} {Year} — Семейный маршрут"` derived from manifest destination and arrival year
- [ ] AC-8: Script exits with a non-zero code and a clear error message if `manifest.json` is missing or malformed
- [ ] AC-9: Playwright navigation tests (`navigation.spec.ts`) pass without modification

**Priority:** Must-have

**Affected components:**
- New script file (e.g., `automation/scripts/generate_shell_fragments.ts` or `.js`)
- `rendering-config.md` § Step 2a documentation
- `.claude/skills/render/SKILL.md` § Step 2 workflow

---

### REQ-002: Template-Engine HTML Fragment Generation (Option 4)

**Description:** A TypeScript/Node.js script replaces all LLM subagents in Step 2c. The script parses each markdown source file (`day_XX_LANG.md`, `overview_LANG.md`, `budget_LANG.md`, `accommodation_LANG.md`, `car_rental_LANG.md`) using a deterministic markdown parser and produces the corresponding HTML fragment file. The script must implement every structural rule currently defined in `rendering-config.md` for each fragment type, with no LLM involvement. The script runs locally in the repository; no network access is required.

**Acceptance Criteria:**
- [ ] AC-1: Script completes fragment generation for a 12-day trip in under 10 seconds wall-clock time (vs. the current ~5–10 minutes for LLM subagents)
- [ ] AC-2: Every `###` POI heading in each day file produces exactly one `.poi-card` element — no truncation, no merging (POI Parity Rule)
- [ ] AC-3: `### 🏨` headings produce `.accommodation-card` elements (not `.poi-card`); `### 🚗` headings produce `.car-rental-category` elements; neither is counted in the POI parity check
- [ ] AC-4: Each `.poi-card` has `id="poi-day-{D}-{N}"` with correct day number and 1-based POI index
- [ ] AC-5: Activity labels that reference a named POI render as `<a class="activity-label" href="#poi-day-{D}-{N}">` pointing to the correct POI card ID; generic actions render as `<span class="activity-label">`
- [ ] AC-6: POI card links render in order Maps → Site → Photo → Phone; phone link only present if phone number exists in markdown; all links have correct `data-link-type` attribute
- [ ] AC-7: All site/website links use the exact label `🌐 Сайт` regardless of destination URL (no brand-name substitution)
- [ ] AC-8: Rating `<span class="poi-card__rating">` is rendered if and only if a rating is present in the source markdown; review count uses locale-appropriate number formatting
- [ ] AC-9: Accessibility indicator `♿` renders as `<span class="poi-card__accessible">♿</span>` when present in the source markdown
- [ ] AC-10: Links block (📍 📸 🌐 📞) always renders after the description text, regardless of order in the markdown source
- [ ] AC-11: Every POI card contains a `<div class="pro-tip">` wrapper when a pro-tip is present in the source markdown
- [ ] AC-12: All SVG elements have explicit `width` and `height` HTML attributes; decorative SVGs include `aria-hidden="true"`
- [ ] AC-13: `#overview` section uses `<section id="overview">` wrapper, no `day-card` wrapper; overview table has no day-number column
- [ ] AC-14: `#budget` section uses `<section id="budget">` wrapper with total row containing `<strong>Итого</strong>` (or equivalent in other languages — structure validated by CSS selector, not text)
- [ ] AC-15: Accommodation section renders as `<div class="accommodation-section" id="accommodation">` placed outside any `day-card`; car rental section renders as `<div class="car-rental-section" id="car-rental">`
- [ ] AC-16: `<div class="day-card__banner">` children (banner title, banner date) have explicit `color` declarations (themed container rule)
- [ ] AC-17: Script is language-agnostic — produces correct structure for Russian, English, Hebrew, and any other language content without hardcoding language strings
- [ ] AC-18: Script exits with a non-zero code and clear per-file error messages if any source markdown file is missing or structurally invalid
- [ ] AC-19: Full Playwright regression suite (`/regression`) passes without any test modifications after migration to the script
- [ ] AC-20: Pre-regression 12-point structural validation (from `development_rules.md` §3) passes on all generated HTML

**Priority:** Must-have

**Affected components:**
- New script file (e.g., `automation/scripts/generate_html_fragments.ts`)
- `rendering-config.md` § Step 2c, Step 2d, Step 2.5 documentation (Agent Prompt Contract becomes script invocation contract)
- `.claude/skills/render/SKILL.md` § Step 2 workflow

---

### REQ-003: Render Skill Pipeline Update

**Description:** The `/render` skill (`SKILL.md`) must be updated to invoke the new scripts instead of spawning LLM subagents. Steps 2a, 2b, 2c, 2d, and 2.5 must be rewritten to describe script invocation, argument passing, exit-code checking, and retry/fallback behavior. The incremental rebuild path must also route through the new scripts (for the affected stale-day fragments). All other steps (Step 1 completeness validation, Step 3 assembly, Step 4 pre-regression gate) remain unchanged.

**Acceptance Criteria:**
- [ ] AC-1: `SKILL.md` Step 2a describes running the shell-fragment script with the trip folder path as argument, checking exit code, and reporting failure if non-zero
- [ ] AC-2: `SKILL.md` Step 2c describes running the fragment-generation script for each fragment type (day, overview, budget, accommodation, car rental); no LLM subagent spawning remains in this step
- [ ] AC-3: `SKILL.md` incremental rebuild section describes running the script for stale day fragments only (not full regeneration)
- [ ] AC-4: The Agent Prompt Contract section (Step 2.5) is replaced or clearly superseded by a script invocation contract (arguments, outputs, error handling)
- [ ] AC-5: `rendering-config.md` pipeline documentation is updated to reflect deterministic script execution; the "parallel subagent" model is replaced with "parallel script invocation or sequential script invocation"

**Priority:** Must-have

**Affected components:**
- `.claude/skills/render/SKILL.md`
- `rendering-config.md` § HTML Generation Pipeline

---

### REQ-004: Principal Engineer Code Review Gate

**Description:** The implementation scripts (REQ-001 and REQ-002) must undergo a synchronous principal-engineer code review before they are considered complete. The review covers correctness of every design-system rule implementation, edge cases (missing fields, zero POIs, language variants), error handling robustness, and performance characteristics. No implementation is considered done until PE sign-off is recorded.

**Acceptance Criteria:**
- [ ] AC-1: A code review artifact (inline comments or a review document) is produced covering all structural rules from `rendering-config.md`
- [ ] AC-2: All critical and major findings from the PE review are resolved before the change is merged
- [ ] AC-3: PE sign-off is recorded in the architecture review document (`architecture_review.md`) or equivalent deliverable for this abbreviated path
- [ ] AC-4: Edge cases explicitly reviewed: trip with 0 POIs in a day, trip with no accommodation file, trip with no car rental file, trip with Day 0 (arrival day), multi-language trip folder, POI with rating but no review count, POI with accessibility indicator, phone number with extensions

**Priority:** Must-have

**Affected components:**
- Implementation scripts (REQ-001 and REQ-002 deliverables)
- Architecture review document for this change

---

### REQ-005: No Regression in Output Fidelity

**Description:** The script-generated HTML must be functionally equivalent to LLM-generated HTML as validated by the existing Playwright regression suite. No new test failures are acceptable. Pre-regression validation (12-point structural check) must also pass. This requirement acts as the final acceptance gate.

**Acceptance Criteria:**
- [ ] AC-1: All tests in `smoke.spec.ts`, `navigation.spec.ts`, `accommodation.spec.ts`, `car-rental.spec.ts`, and any other regression spec files pass against script-generated HTML
- [ ] AC-2: No test is modified, skipped, or weakened to accommodate the new implementation
- [ ] AC-3: The pre-regression 12-point structural validation from `development_rules.md` §3 produces zero failures
- [ ] AC-4: POI card count per day in generated HTML matches markdown `###` POI heading count per day (parity rule)

**Priority:** Must-have

**Affected components:**
- All Playwright spec files (validation only — no changes expected)
- Generated HTML output

---

## 4. Dependencies & Risks

| Dependency / Risk | Mitigation |
|---|---|
| `rendering-config.md` is 37 KB with dense design-system rules — script must implement all of them correctly | PE code review (REQ-004) with explicit checklist against `rendering-config.md`; regression suite (REQ-005) as automated safety net |
| POI Parity Rule is the highest-risk correctness requirement — silent truncation would break tests | Explicit AC-2 in REQ-002; parity check in REQ-005 AC-4; pre-regression gate validates counts |
| Markdown parsing edge cases (nested headings, inline HTML, special emoji, multilingual content) | Language-agnostic design (REQ-002 AC-17); PE review of edge cases (REQ-004 AC-4); test against real trip data |
| Incremental rebuild path must also use new scripts | REQ-003 AC-3 explicitly covers incremental path |
| Activity label linking (POI cross-references) requires parsing both the itinerary table and POI cards in the same day | PE review of link-resolution algorithm; AC-5 in REQ-002 covers the correctness criterion |
| Script runtime environment must be available in the Claude Code shell | Node.js/TypeScript is already present (existing `TripPage.ts`); confirm `ts-node` or `npx tsx` availability before Dev-Impl |
| Abbreviated dev path skips full SA review — architecture risk is higher | Compensated by mandatory PE code review (REQ-004) and full regression gate (REQ-005) |
| Car rental and accommodation markdown formats differ from day files — separate parsers or branches needed | REQ-002 AC-3 and AC-15 cover structural correctness; PE review covers parsing logic |

---

## 5. Acceptance Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| PM | Product Manager | 2026-04-03 | Approved |
