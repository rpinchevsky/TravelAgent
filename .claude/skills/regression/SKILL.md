---
name: regression
description: "Run Playwright regression tests against generated trip HTML. Use when: run regression, validate HTML, test trip output, check quality, run automation, run tests, playwright, check regression, verify trip."
---

# Regression Test Skill

Run the full Playwright regression suite against a trip HTML file with pre-validation, execution, and reporting.

## Argument Parsing

- If the user provides an HTML file path as argument, use it as the LTR test target.
- If no argument is provided, the config auto-discovers the latest `generated_trips/trip_YYYY-MM-DD_HHmm/` folder containing `trip_full_ru.html`.
- RTL tests always auto-discover the latest folder containing `trip_full_he.html` unless `TRIP_RTL_HTML` is set.

## Workflow

### Step 1: Pre-Regression Validation Gate

Before running Playwright, perform these structural checks on the HTML file (per `development_rules.md` Section 3). Use Grep/Read tools on the HTML. If ANY check fails, report it and stop — do NOT proceed to test execution.

1. **Section IDs exist:** `#overview`, `#budget`, `#day-0` through `#day-N`
2. **Day IDs on correct element:** `.day-card[id^="day-"]` (not `<section>`)
3. **Required classes present:** `.pro-tip`, `.poi-card`, `.poi-card__name`, `.poi-card__link`
4. **Advisory class uniqueness:** `.advisory--warning` appears only in Holiday Advisory
5. **Sidebar SVGs:** `.sidebar__link` elements contain `<svg>`
6. **Inlined CSS:** `<style>` tag in `<head>`, no `<link>` to `rendering_style_config.css` (Google Fonts OK)
7. **SVG attributes:** All `<svg>` have explicit `width` and `height`
8. **POI parity:** Count of `.poi-card` per day matches markdown `###` POI count
9. **Navigation completeness:** `sidebar__link` count matches `mobile-nav__pill` count
10. **POI card anchors:** Every `.poi-card` has `id="poi-day-{D}-{N}"`
11. **Activity label links:** POI-referencing `.activity-label` are `<a>` with `href` matching a `.poi-card` id

### Step 2: Execute Tests

Set the environment variable and run from `automation/code/`:

```bash
# With explicit path (from argument):
TRIP_LTR_HTML="<resolved_path>" rtk npx playwright test

# Without argument (auto-discovery):
cd automation/code && rtk npx playwright test
```

The config reads `TRIP_LTR_HTML` if set; otherwise auto-discovers the latest trip folder.

### Step 3: Report Results

After execution:
1. Report pass/fail counts from test output
2. Provide the Playwright HTML report path: `automation/Reports/automation_report_{timestamp}/`
3. If failures exist, classify each as:
   - **Real bug:** HTML output does not match structural contract — fix HTML and re-run
   - **Test data sync issue:** Hardcoded values in tests don't match new trip data — update tests per `development_rules.md` Section 4

### Step 4: Failure Triage (if needed)

Consult the Change Impact Matrix (`development_rules.md` Section 6) to determine which tests are affected by the type of change. Do NOT auto-update hardcoded test values — warn the user and let them decide.

## Reference Files

- `development_rules.md` — Quality gates, pre-regression checks, test data sync rules
- `automation/code/automation_rules.md` — Test engineering standards (zero-flakiness, POM, shared fixture)
- `automation/code/tests/pages/TripPage.ts` — Page Object Model (structural contract)
- `automation/code/release_notes.md` — Change history and test data sync records

## Important

- All commands MUST use `rtk` prefix per global CLAUDE.md rules
- Never skip pre-validation — it catches 80%+ of failures instantly
- Never auto-fix hardcoded test values — that's a developer decision
