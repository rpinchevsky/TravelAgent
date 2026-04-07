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

## Node.js Preflight

Before running any scripts, verify Node.js >= 18 is available:
```bash
node --version
```
Both scripts include an internal preflight check and will exit with a clear error if Node.js < 18.

## Workflow

### Step 1: Trip Completeness Validation

Before generating HTML, validate the trip folder per `development_rules.md` §2:
1. `manifest.json` exists and all days have `status: "complete"`
2. All day files exist and match manifest
3. Each full day has >= 3 POI headings
4. Overview and budget files exist

If ANY check fails, report and stop — do NOT generate HTML from incomplete data.

### Step 2: Fragment Generation (Script-Based)

**Step 2a — Shell fragment script:**
Run `generate_shell_fragments.ts` to produce PAGE_TITLE, NAV_LINKS, and NAV_PILLS:

```bash
rtk npx tsx automation/scripts/generate_shell_fragments.ts \
  --trip-folder "{trip_folder_path}" \
  --lang "{lang_code}"
```

Check exit code. If non-zero: report the error message from stderr and stop — do NOT proceed to Step 2c.
On success: `shell_fragments_{lang}.json` is written to the trip folder and consumed in Step 3.

**Step 2b — (Removed):** Batch assignment is no longer required. The script processes all files in a single sequential invocation.

**Step 2c — HTML fragment generation script:**
Run `generate_html_fragments.ts` to produce all fragment files:

```bash
rtk npx tsx automation/scripts/generate_html_fragments.ts \
  --trip-folder "{trip_folder_path}" \
  --lang "{lang_code}"
```

The script generates all fragment types in one invocation:
- `fragment_overview_{lang}.html`
- `fragment_accommodation_{lang}.html` (only if `accommodation_{lang}.md` exists)
- `fragment_car_rental_{lang}.html` (only if `car_rental_{lang}.md` exists)
- `fragment_day_00_{lang}.html` through `fragment_day_NN_{lang}.html`
- `fragment_budget_{lang}.html`

Check exit code. If non-zero: report the per-file error messages from stderr and stop.
No retry loop — errors require investigation (missing/malformed source files).

**Step 2d — Fragment verification:**
Verify all expected fragment files exist using Bash ls or Glob:
- `fragment_overview_{lang}.html`
- `fragment_accommodation_{lang}.html` (only if `accommodation_{lang}.md` exists)
- `fragment_car_rental_{lang}.html` (only if `car_rental_{lang}.md` exists)
- `fragment_day_00_{lang}.html` through `fragment_day_NN_{lang}.html`
- `fragment_budget_{lang}.html`

If any are missing: the script would have already exited with non-zero code and error message.
Re-running the script without fixing the underlying cause will produce the same error.
Report and stop — do NOT proceed to assembly.

### Script Invocation Contract (replaces Agent Prompt Contract)

Both scripts accept:
- `--trip-folder <path>` — absolute or relative path to the trip folder (required)
- `--lang <lang_code>` — ISO 639-1 language code matching file suffixes (required)
- `--stale-days <comma-list>` — day numbers to regenerate (incremental mode; `generate_html_fragments.ts` only)

Exit codes: 0 = success; 1 = validation or parse error (message to stderr).

Scripts are located at `automation/scripts/` and run via `npx tsx`.
Node.js >= 18 is required. Both scripts include a preflight version check and will exit
with a clear error message if the requirement is not met.

### Step 3: Assembly & Export

Read `{trip_folder}/shell_fragments_{lang}.json` (written by Step 2a):

```typescript
const shellFragments = JSON.parse(
  fs.readFileSync(`${tripFolder}/shell_fragments_${lang}.json`, 'utf8')
);
const PAGE_TITLE = shellFragments.PAGE_TITLE;
const NAV_LINKS  = shellFragments.NAV_LINKS;
const NAV_PILLS  = shellFragments.NAV_PILLS;
```

Substitute into `base_layout.html` placeholders:
- `{{PAGE_TITLE}}` → `PAGE_TITLE`
- `{{NAV_LINKS}}`  → `NAV_LINKS`
- `{{NAV_PILLS}}`  → `NAV_PILLS`

Then concatenate all fragment files in section order (overview → accommodation? → car-rental? → day-00 … day-NN → budget) to produce `{{TRIP_CONTENT}}`.

If `shell_fragments_{lang}.json` is missing: Step 2a did not complete successfully. Re-run Step 2a before proceeding.

1. Read `base_layout.html` (do not modify the template)
2. Assemble `{{TRIP_CONTENT}}` = overview + accommodation (if exists) + car-rental (if exists) + day fragments (in order) + budget
3. Inject all placeholders (PAGE_TITLE, NAV_LINKS, NAV_PILLS, TRIP_CONTENT)
4. Write `trip_full_LANG.html` to the trip folder
5. Update `manifest.json`: set `assembly.trip_full_html_built` timestamp

### Step 4: Pre-Regression Validation Gate

After HTML generation, run the 12-point structural validation from `development_rules.md` §3 using Grep/Read on the output HTML. This catches 80%+ of failures before Playwright runs.

If validation fails, fix the HTML and re-run validation before reporting success.

**Note:** `/regression` also runs this validation as its Step 1. This is intentional defense-in-depth — catching issues here avoids wasting time on Playwright execution against broken HTML.

### Incremental Rebuild Mode

When only specific days changed (detected via `manifest.json → assembly.stale_days`):

```bash
rtk npx tsx automation/scripts/generate_html_fragments.ts \
  --trip-folder "{trip_folder_path}" \
  --lang "{lang_code}" \
  --stale-days "{comma-separated day numbers}"
```

Re-run `generate_shell_fragments.ts` (which re-writes `shell_fragments_{lang}.json`) if ANY of the following structural changes occurred:
- Days added or removed from the trip
- A day title changed in `manifest.json` (update manifest first)
- `accommodation_{lang}.md` added or removed
- `car_rental_{lang}.md` added or removed

Then proceed to in-place HTML section replacement:
1. Regenerate only the HTML fragments for stale days (via `--stale-days` flag)
2. In the existing `trip_full_LANG.html`, find and replace the `<div class="day-card" id="day-{N}">` sections
3. If navigation changed (days added/removed/renamed), re-run shell fragment script and update NAV sections
4. Run Step 4 validation on the rebuilt file

## Agent Prompt Contract

**Deprecated — replaced by deterministic scripts.** HTML generation no longer uses LLM subagents. The Script Invocation Contract in Step 2.5 above is the operative contract. Both scripts (`generate_shell_fragments.ts` and `generate_html_fragments.ts`) implement all rendering rules from `rendering-config.md` deterministically. No prompt engineering is required.

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
