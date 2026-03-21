---
name: render
description: "Generate trip HTML from markdown day files. Use when: generate HTML, create HTML page, export to HTML, render trip, build HTML, rebuild HTML, html generation, incremental HTML rebuild."
---

# HTML Render Skill

Generate per-day HTML fragments from trip markdown and assemble into `trip_full_LANG.html` using the Enterprise Design System.

## Argument Parsing

- If the user provides a trip folder path, use it as the source.
- If no argument is provided, auto-discover the latest `generated_trips/trip_YYYY-MM-DD_HHmm/` folder via `manifest.json`.
- Language: use the `_LANG` suffix from existing day files, or default to `language_preference.reporting_language` from the active trip details file (read `trip_details_file` from `manifest.json`; defaults to `trip_details.md`).

## Before You Start — Load Context

Read these files (they are NOT loaded into conversation context by default):

1. **`rendering-config.md`** — Design system, component rules, Fragment Master Mode pipeline, SVG/flag rules, assembly constraints. **This is the authoritative source for all rendering rules.**
2. **`development_rules.md` §1–3 only** — HTML Generation Contract (§1), Trip Completeness Validation (§2), Pre-Regression Validation Gate (§3). Sections §4–7 are `/regression` concerns — skip them.
3. **`base_layout.html`** — Template shell with `{{PAGE_TITLE}}`, `{{NAV_LINKS}}`, `{{NAV_PILLS}}`, `{{TRIP_CONTENT}}` placeholders
4. **`rendering_style_config.css`** — Full CSS to inline into `<style>` tag (replaces the `<link>` in base_layout.html)
5. **`automation/code/tests/pages/TripPage.ts`** — Page Object Model defining the structural contract (CSS classes, IDs, locators the tests expect)

## Workflow

### Step 1: Trip Completeness Validation

Before generating HTML, validate the trip folder per `development_rules.md` §2:
1. `manifest.json` exists and all days have `status: "complete"`
2. All day files exist and match manifest
3. Each full day has >= 3 POI headings
4. Overview and budget files exist

If ANY check fails, report and stop — do NOT generate HTML from incomplete data.

### Step 2: Per-Day Fragment Generation

Follow `rendering-config.md` → "HTML Generation Pipeline (Fragment Master Mode)":

**Step 2a — Sequential shell fragments:**
1. Generate shell fragments (PAGE_TITLE, NAV_LINKS, NAV_PILLS) from `overview_LANG.md` + `manifest.json`

**Step 2b — Batch assignment:**
4. Determine batch count from the batch sizing table in `rendering-config.md` § Step 2b (same table as Phase B in `content_format_rules.md`).
5. Assign days to batches in chronological order.

**Step 2c — Parallel fragment generation:**
6. Spawn all subagents in a **single response block** (parallel execution): one overview subagent, one budget subagent, and one subagent per day batch.
7. Overview subagent: receives core contract (§ 2.5 items 14-17), reads `overview_LANG.md` + `manifest.json`, writes `fragment_overview_LANG.html` to the trip folder.
8. Budget subagent: receives core contract (§ 2.5 items 18-21), reads `budget_LANG.md` + `manifest.json`, writes `fragment_budget_LANG.html` to the trip folder.
9. Day batch subagents: each receives the 9-item core contract (§ 2.5) + batch-specific items 10-13. Reads assigned `day_XX_LANG.md` files and writes `fragment_day_XX_LANG.html` files to the trip folder.

**Step 2d — Verification:**
10. Verify all required fragments exist: `fragment_overview_LANG.html`, `fragment_day_00_LANG.html` through `fragment_day_NN_LANG.html`, and `fragment_budget_LANG.html`.
11. If any missing: re-spawn only the failed subagent (overview, budget, or the failed day batch). Single retry per subagent. If still missing after retry, report and stop.

All component rules, CSS class requirements, POI card structure, activity label linking, SVG attributes, CSS inlining, and flag rendering rules are defined in `rendering-config.md`. Follow that file — it is the single source of truth for rendering.

**Incremental rebuild exception:** When in incremental mode (stale_days), generate only the stale day fragment(s) sequentially — do not use batch parallelization.

### Step 3: Assembly & Export

1. Read `base_layout.html` (do not modify the template)
2. Assemble `{{TRIP_CONTENT}}` = overview + day fragments (in order) + budget
3. Inject all placeholders
4. Write `trip_full_LANG.html` to the trip folder
5. Update `manifest.json`: set `assembly.trip_full_html_built` timestamp

### Step 4: Pre-Regression Validation Gate

After HTML generation, run the 11-point structural validation from `development_rules.md` §3 using Grep/Read on the output HTML. This catches 80%+ of failures before Playwright runs.

If validation fails, fix the HTML and re-run validation before reporting success.

**Note:** `/regression` also runs this validation as its Step 1. This is intentional defense-in-depth — catching issues here avoids wasting time on Playwright execution against broken HTML.

### Incremental Rebuild Mode

When only specific days changed (detected via `manifest.json → assembly.stale_days`):
1. Regenerate only the HTML fragments for stale days
2. In the existing `trip_full_LANG.html`, find and replace the `<div class="day-card" id="day-{N}">` sections
3. If days were added/removed, regenerate NAV_LINKS and NAV_PILLS too
4. Run Step 4 validation on the rebuilt file

## Agent Prompt Contract

When delegating HTML generation to a sub-agent, the prompt MUST include all 9 core items defined in `rendering-config.md` §2.5. For parallel day batch subagents, items 10-13 are also mandatory. For the overview subagent, items 14-17 are mandatory. For the budget subagent, items 18-21 are mandatory. Never delegate without the full contract.

## Reference Files

- `rendering-config.md` — Design system + Fragment Master Mode pipeline
- `development_rules.md` — HTML contract (§1), completeness (§2), pre-regression gate (§3)
- `base_layout.html` — HTML template shell
- `rendering_style_config.css` — CSS to inline
- `automation/code/tests/pages/TripPage.ts` — Structural contract (POM locators)
- `content_format_rules.md` — Day file format, manifest schema

## Important

- All commands MUST use `rtk` prefix per global CLAUDE.md rules
- Never modify `base_layout.html` or `rendering_style_config.css` — they are source templates
- Always inline CSS — the output HTML must never reference external CSS files (Google Fonts `<link>` OK)
- POI parity is non-negotiable — markdown POI count must match HTML poi-card count per day
