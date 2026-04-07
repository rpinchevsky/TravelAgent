# Architecture Review

**Change:** HTML Render Pipeline Optimization — Script-Based Shell Fragments & Template-Engine Day Generation
**Date:** 2026-04-03
**Reviewer:** Software Architect (Principal Engineer)
**Documents Reviewed:** `high_level_design.md`, `detailed_design.md`, `business_requirements.md`
**Supporting files read:** `rendering-config.md`, `development_rules.md` §1 and §3, `TripPage.ts`, `content_format_rules.md`, `.claude/skills/render/SKILL.md`
**Verdict:** Approved with Changes

---

## 1. Review Summary

The overall design direction is sound: replacing LLM subagents with deterministic TypeScript scripts for mechanically rule-driven HTML generation is the correct architectural decision. The HLD is clear, the data flow is well-reasoned, and the key choices (TypeScript, custom FSM parser, two-pass activity label linking, atomic file writes, fail-fast error handling) are architecturally appropriate.

However, the detailed design contains a significant cluster of gaps that are blocking or near-blocking. The main risk areas are: (a) the PAGE_TITLE generation has a hard-coded Russian string in a language-agnostic system; (b) the FSM parser is missing several documented section types from `content_format_rules.md`; (c) the `data-link-type` attribute is missing from `accommodation-card__link` elements in the DD template; (d) the country flag gap is left explicitly open-ended with a guarantee of incompleteness; and (e) a race condition exists in the shell fragment script's PAGE_TITLE fallback logic that depends on a file the script itself is supposed to generate. Several Recommendation-level issues compound the correctness risk.

This review is conducted as a principal-engineer adversarial gate, as required by REQ-004. All Blocking items must be resolved in the implementation; Blocking items may not be deferred to post-PE-review.

---

## 2. Architecture Principles Checklist

| Principle | Status | Notes |
|---|---|---|
| Content / presentation separation | Pass | Scripts read markdown content and apply CSS class templates — content files and rendering rules are fully separated. No content strings are embedded in scripts except SVG constants and structural class names. |
| Easy to extend for new requirements | Conditional Pass | The module structure (one function per fragment type) is extensible. However, the country flag map is a named enumeration that requires code changes for every new destination. This is an expected limitation for MVP, but needs tracking. See FB-8. |
| Consistent with existing patterns | Conditional Pass | TypeScript, `automation/` folder placement, `TripPage.ts` CSS class contracts — all consistent. The new `shell_fragments_LANG.json` output artifact is a new pattern not previously used; it adds a Step 3 assembly dependency that is underspecified. See FB-9. |
| No unnecessary coupling | Pass | `generate_shell_fragments.ts` and `generate_html_fragments.ts` are independent scripts with no runtime dependency on each other. Fragment files are the only shared artifact, and they are written atomically. |
| Regeneration performance | Pass | Scripts replace a 5–10 minute LLM pipeline with < 15 seconds deterministic execution. Incremental rebuild correctly scopes to stale days only. |

---

## 3. Feedback Items

---

### FB-1: PAGE_TITLE Hard-Codes Russian Suffix — Language-Agnostic Violation

**Severity:** Blocking
**Affected document:** DD §1.1
**Section:** `generate_shell_fragments.ts` Script logic, step 3

**Issue:** The DD specifies `PAGE_TITLE = \`${city} ${year} — Семейный маршрут\`` as the primary derivation logic. The NOTE acknowledges the Russian suffix but defers resolution with: "the script must use the same pattern the overview fragment already contains." The IMPLEMENTATION NOTE then says to read `<h1 class="page-title">` from `fragment_overview_LANG.html` if it already exists.

This creates two compounding problems:

1. **Dependency inversion:** `generate_shell_fragments.ts` is supposed to run BEFORE or alongside `generate_html_fragments.ts`. The DD does not establish an ordering between the two scripts in SKILL.md. If `generate_shell_fragments.ts` attempts to read `fragment_overview_LANG.html` (produced by `generate_html_fragments.ts`), it will either find the file absent (fresh generation) and fall back to the hardcoded Russian string, or find a stale file from a previous run and read incorrect data. There is no clean ordering that avoids this race.

2. **Language-agnostic rule violated:** BRD REQ-002 AC-17 and the project-wide language-agnostic rule (`CLAUDE.md`) require the script to produce correct structure for Russian, English, Hebrew, and any other language. A fallback of `"Семейный маршрут"` for fresh English or Hebrew trips is wrong output.

**Suggestion:** The `PAGE_TITLE` suffix must come from the manifest or from a language-keyed lookup table (e.g., `{ ru: "Семейный маршрут", en: "Family Trip", he: "מסלול משפחתי" }`). `manifest.json` already stores per-language state; if the title suffix is not in the manifest, add a `title_suffix` field per language. Do NOT read from a partially-generated fragment file. Eliminate the `fragment_overview_LANG.html` fallback from the DD entirely.

---

### FB-2: `accommodation-card__link` Missing `data-link-type` — Test Contract Violation

**Severity:** Blocking
**Affected document:** DD §1.2.3
**Section:** `renderAccommodationCard()` template

**Issue:** `rendering-config.md` §POI Card Structure states: "The same attribute applies to `<a class="accommodation-card__link">` elements." `development_rules.md` §1 contracts `.accommodation-card__link` as a structural requirement. The `renderAccommodationCard()` template in the DD shows `[links in Maps → Site → Photo → Phone order, using accommodation-card__link class]` — a placeholder comment with no `data-link-type` attribute specified. The Playwright tests in `accommodation.spec.ts` query by `data-link-type` for accommodation links. Omitting this attribute will cause test failures that are not caught by the internal POI parity check.

**Suggestion:** Expand the `renderAccommodationCard()` template in the DD to show the full link HTML with explicit `data-link-type` values, identical to the POI card link pattern: `<a class="accommodation-card__link" data-link-type="maps" ...>`, `data-link-type="site"`, `data-link-type="photo"`, `data-link-type="phone"`. The implementation checklist (DD §5) must include this as an explicit checkbox.

---

### FB-3: `### 🎯` and `### 🛒` Excluded from Non-POI List but FSM May Misclassify Them

**Severity:** Blocking
**Affected document:** DD §1.2.2
**Section:** Markdown Parser Design — POI boundary detection

**Issue:** The FSM non-POI classification list is:
- `### 🏨` → accommodation card
- `### 🚗` → car rental category
- `### 🅱️` → plan B section
- `### Расписание` → schedule table
- `### Стоимость дня` → pricing table
- "All other `### `" → POI section

`rendering-config.md` §POI Card Structure explicitly states: "`### 🛒` sections MUST render as a full `poi-card`" and "`### 🎯` sections MUST render as a full `poi-card`". The FSM correctly handles these by falling through to the "All other" POI branch — this is correct in principle.

However, the FSM is specified purely by emoji prefix. `### 🛒` and `### 🎯` are not in the non-POI exclusion list, which is correct. But the FSM description gives no explicit test confirming they produce `.poi-card` output and are counted in parity. The implementation checklist (DD §5) has no explicit checkbox for grocery-store or optional-stop POI cards. Given that `rendering-config.md` calls these out as mandatory and frequently missed by LLM subagents, this must be tested explicitly.

**Suggestion:** Add to the DD §1.2.2 an explicit statement: "`### 🛒` and `### 🎯` headings are POI sections and MUST produce `.poi-card` output. They are included in the POI parity count." Add a checkbox to DD §5: `[ ] renderPoiCard() handles 🛒 and 🎯 emojis — verified with parity assertion`. Add an edge-case test in §5 Validation: run against a day file containing at least one `🛒` and one `🎯` heading.

---

### FB-4: Country Flag Gap Is a Blocking Language-Agnostic Violation for Current Multi-Language Support

**Severity:** Blocking
**Affected document:** DD §1.2.3
**Section:** `renderOverviewFragment()` — Country flag SVG

**Issue:** The DD states: "Initial implementation covers Hungary (primary use case) + a few others as placeholders." The current project supports multiple languages (`ru`, `en`, `he` confirmed in `content_format_rules.md`) and is explicitly designed as a reusable architecture for multiple destinations. The "Supported country → SVG flag map is a constant in the script. If unrecognized country, omits the flag SVG (does not error)" means every destination other than Hungary will silently produce incorrect HTML. No flag SVG is not functionally equivalent to the LLM output, which does include the correct flag.

The LLM currently produces correct flags for all destinations it has been given. Replacing it with a script that silently omits flags for unlisted countries is a regression in output fidelity (violates REQ-005). BRD AC-17 requires correct structure for any language, and the overview fragment structure includes the flag as a mandatory part of `<h1 class="page-title">`.

**Suggestion:** Either (a) require a minimum set of flags that covers all destinations in existing and planned trips before merging — minimum set should be explicitly listed in the DD, or (b) have the script error (exit 1) on unrecognized destination and require a flag SVG to be added before use, rather than silently omitting it. Silent omission of a required element is never acceptable. The flag constant map must be treated as a completeness requirement, not a "nice to have."

---

### FB-5: FSM Missing `### 🏨` Handling When Appearing in Day Files (Cross-File Boundary)

**Severity:** Blocking
**Affected document:** DD §1.2.2
**Section:** Markdown Parser Design — `parseDayFile()` POI boundary detection

**Issue:** `rendering-config.md` §Accommodation states that accommodation cards (`### 🏨`) come from `accommodation_LANG.md` — they are NOT in day files. However, the FSM state list for `parseDayFile()` includes `ACCOMMODATION_CARD` and `ACCOMMODATION_FRONT` states. If a day file ever contains `### 🏨` (e.g., due to a formatting error, or if a day's itinerary references hotel check-in as a POI), the FSM would transition to `ACCOMMODATION_CARD` state, which expects the accommodation card format. This would produce a malformed accommodation card in the day fragment, not a POI card — and it would NOT be counted in the POI parity check (since accommodation cards are excluded from parity), causing a silent content drop.

More specifically: the FSM specification says `### 🏨` is "not a POI" regardless of which file it appears in. But `parseDayFile()` and `parseAccommodationFile()` share this classification. A day file with `### 🏨` should either error (unexpected heading in day context) or be treated as a POI (rendered with a `.poi-card` and counted in parity). The DD is silent on this cross-file boundary case.

**Suggestion:** `parseDayFile()` must treat `### 🏨` in a day file as an error or as a regular POI, not as an accommodation card. Add to the error conditions list (DD §1.2.6): "Day file contains `### 🏨` heading → error, accommodation headings are only valid in `accommodation_LANG.md`." Similarly for `### 🚗` in day files.

---

### FB-6: Parity Check Counts String Occurrences in Rendered HTML — Fragile

**Severity:** Recommendation
**Affected document:** DD §1.2.4
**Section:** POI Parity Validation

**Issue:** The parity check uses `(html.match(/class="poi-card"/g) || []).length`. This is a string-count approach. It is fragile in two ways: (a) if the script ever generates a comment or escaped string containing `class="poi-card"` (e.g., in a pro-tip that quotes HTML), the count will be inflated; (b) if a future refactor changes the attribute quoting to `class='poi-card'` (single quotes), the regex silently stops matching. Both could produce false negatives or false positives.

**Suggestion:** Since the script is generating the HTML string itself via template concatenation, count the number of times `renderPoiCard()` is called for a given day, rather than post-hoc string scanning. Introduce a counter: `let renderedPoiCount = 0` before the POI rendering loop; increment after each `renderPoiCard()` call; assert `renderedPoiCount === day.pois.length` before writing. This is structurally correct and immune to string-matching artifacts.

---

### FB-7: Budget Fragment Total Row Detection Hard-Codes Russian Marker

**Severity:** Blocking
**Affected document:** DD §1.2.3
**Section:** `renderBudgetFragment()`

**Issue:** The DD specifies: "Total row detection: line where first cell is empty and third cell contains `**Итого`". `**Итого` is a Russian string. BRD REQ-002 AC-17 requires language-agnostic operation. An English or Hebrew budget file with `**Total**` or `**סה"כ**` would not trigger the total row detection, producing a budget section with no `<strong>` total row. This would fail `development_rules.md` §3 check item — the pre-regression gate searches for `#budget table tbody tr:last-child strong`.

**Suggestion:** The total row must be detected by structure, not language string. The best approach is to detect the last non-empty row in the budget table — budget files are always structured with the total as the final data row. Alternatively, add a machine-readable marker convention to `content_format_rules.md` budget format (e.g., a CSS class marker in the source markdown). At minimum, the DD must specify: "total row detection is language-agnostic — do NOT match on Russian text."

---

### FB-8: No `tsconfig.json` or Module Resolution Specified for New Scripts

**Severity:** Recommendation
**Affected document:** HLD §4.4, DD §1
**Section:** Runtime Environment

**Issue:** The HLD confirms `npx tsx` is available but does not specify whether the scripts use ES modules or CommonJS, and does not reference an existing `tsconfig.json`. The project has `TripPage.ts` in `automation/code/tests/` which uses a Playwright-specific `tsconfig`. The new scripts in `automation/scripts/` may not be covered by that `tsconfig`, and `tsx` will use its own defaults. If `tsx` defaults differ from the project's TypeScript configuration (e.g., strict null checks, target), type errors may be silently ignored at runtime. The `fs.existsSync` call pattern (DD §1.1 step 4) and the `Map<string, number>` type (DD §1.2.1) require compatible TypeScript lib settings.

**Suggestion:** Add to the implementation checklist: "Confirm `npx tsx automation/scripts/generate_shell_fragments.ts` runs without TypeScript errors against the project's `tsconfig.json` or create a dedicated `automation/scripts/tsconfig.json`." Specify in the DD that the scripts must compile cleanly with `--strict` flag.

---

### FB-9: `shell_fragments_LANG.json` Injection Into Step 3 Assembly Is Underspecified

**Severity:** Blocking
**Affected document:** HLD §3.2 / HLD §7.4, DD §1.3
**Section:** Step 3 Assembly, SKILL.md changes

**Issue:** The HLD states (§7.4): "The SKILL.md Step 3 assembly reads this JSON to inject the three placeholders into `base_layout.html`." But the current Step 3 assembly in `SKILL.md` and `rendering-config.md` §Step 3 uses the `{{PAGE_TITLE}}`, `{{NAV_LINKS}}`, `{{NAV_PILLS}}` placeholders via direct string substitution in `base_layout.html`. The DD's SKILL.md update (§1.3) describes Step 2a and Step 2c replacements in detail, but does NOT update Step 3 to describe how `shell_fragments_LANG.json` is consumed. This is a gap: the implementation will ship with Step 2a writing a JSON file and Step 3 still expecting the old subagent-provided in-memory strings.

**Suggestion:** The DD §1.3 SKILL.md changes MUST include explicit Step 3 changes: "Read `{trip_folder}/shell_fragments_{lang}.json`, extract `PAGE_TITLE`, `NAV_LINKS`, `NAV_PILLS` fields, substitute into `base_layout.html` placeholders." Without this, Step 3 has no mechanism to consume the script's output.

---

### FB-10: Incremental Mode Incompleteness — Shell Fragment Script Not Triggered for Non-Day Nav Changes

**Severity:** Recommendation
**Affected document:** HLD §4.3, DD §1.3
**Section:** Incremental rebuild

**Issue:** The DD (§1.3 incremental section) says: "If nav changed (days added/removed), also re-run `generate_shell_fragments.ts`." But the incremental rebuild path is triggered by `stale_days` in `manifest.json`. There is no explicit trigger in the DD for the case where accommodation or car rental files are added or removed between renders (which would also change the nav). For example: a trip initially rendered without accommodation, then `accommodation_LANG.md` is added — the nav must now include `#accommodation`, but `stale_days` would not be set (no day changed), so `generate_shell_fragments.ts` would not run.

**Suggestion:** The SKILL.md incremental rebuild section must specify: "Re-run `generate_shell_fragments.ts` any time the set of top-level sections changes: days added/removed, accommodation file added/removed, car rental file added/removed." This is a checklist item, not a manifest-derived condition — the operator or SKILL.md must always re-run the shell fragment script when structural section presence changes.

---

### FB-11: Windows Line Endings and BOM — Not Addressed in FSM Parser

**Severity:** Recommendation
**Affected document:** DD §1.2.2
**Section:** Markdown Parser Design

**Issue:** The development environment is Windows 11 (`CLAUDE.md` env block). Trip markdown files written by Claude Code on Windows may have `\r\n` (CRLF) line endings or, in rare cases, a UTF-8 BOM (`\xEF\xBB\xBF` at file start). The FSM parser processes files line-by-line. If line splitting is done naively (e.g., `content.split('\n')`), CRLF files will leave `\r` at the end of each line. This causes:
- `line.startsWith('### ')` → works correctly (the `\r` is at the end, not the start)
- `line.startsWith('📍')` → works correctly for the same reason
- BUT: `line.trim() === '---'` boundary detection may fail if `\r` is not trimmed
- AND: the regex `/^### /` correctly matches even with trailing `\r`, but text extraction like `line.slice(4).trim()` correctly strips `\r` via `trim()`

The more dangerous case is BOM: if the first line of the file has a BOM, `line.startsWith('# ')` for the day heading will fail (`\xEF\xBB\xBF# ` ≠ `# `), causing the FSM to never enter `FRONT_MATTER` state, producing an empty `DayData` with zero POIs — which triggers the "zero POIs in full day" error. This is a confusing failure mode.

**Suggestion:** Add to `parseDayFile()` (and all parse functions): strip BOM from the first line explicitly (`content.replace(/^\uFEFF/, '')`), and normalize line endings before splitting (`content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')`). Add this as an explicit preprocessing step in DD §1.2.2.

---

### FB-12: Activity Label Normalization Strategy Has False Positive / False Negative Risk

**Severity:** Recommendation
**Affected document:** DD §1.2.2
**Section:** Two-pass POI linking

**Issue:** Pass 2 normalization is: "lowercase, strip emojis, strip punctuation, trim." The match strategy is "check if activity text contains a POI name substring." This is under-specified and has two risks:

1. **False positive — unrelated POI match:** A POI named "Рынок" (market) will match any activity row containing the word "рынок" in a different context (e.g., "Переезд рядом с рынком"). This causes an incorrect `<a>` link to be generated for a generic action, which is wrong structure.

2. **False negative — multilingual name mismatch:** `rendering-config.md` §Activity Labels states POI names in activity labels follow `Hungarian Name / Russian Name` format. A POI heading in the day file might be `### 💦 Palatinus Strand / Палатинус`. The normalized name would be "palatinus strand  палатинус". An activity row for the same POI might say `💦 Palatinus Strand` (only Hungarian). The substring check "palatinus strand  палатинус" ⊄ "palatinus strand" → no match → rendered as `<span>` instead of `<a>`. This is a correctness failure for a common content pattern.

**Suggestion:** The DD must specify the normalization and matching strategy precisely enough that a developer can implement it unambiguously. Recommended approach: normalize POI heading to both the full name AND each slash-separated part independently; match if the activity text contains ANY of the parts. Document the chosen strategy in DD §1.2.2 with examples covering the multilingual slash pattern.

---

### FB-13: `renderBudgetFragment` Uses `itinerary-table` for Budget — Matches Current Behavior but Conflicts With Pricing Rules

**Severity:** Observation
**Affected document:** DD §1.2.3
**Section:** `renderBudgetFragment()`

**Issue:** The DD states the budget fragment renders budget tables as `<div class="itinerary-table-wrapper"><table class="itinerary-table">`. `rendering-config.md` §Pricing Display states: "MUST use `pricing-grid` with `pricing-cell` components for all daily cost sections. Do NOT use `itinerary-table` for pricing data." This rule appears to conflict with the budget section design. The distinction is: per-day cost tables inside a day card use `.pricing-grid`; the aggregate budget section (`budget_LANG.md` → `fragment_budget_LANG.html`) uses `.itinerary-table` because it is a summary table, not a per-item pricing display.

This is an existing ambiguity in `rendering-config.md` that was resolved in practice by LLM subagents using `itinerary-table` for the budget fragment. The DD correctly perpetuates this behavior. However, the rule file does not document this distinction explicitly.

**Suggestion:** No change required to the scripts for this cycle. However, note for `rendering-config.md` maintainers: document that `pricing-grid` is for day-level per-item cost tables, while `itinerary-table` is acceptable for the budget summary fragment. This prevents future confusion when the rule is read in isolation.

---

### FB-14: Day Number Derivation from `manifest.total_days` Is Off-by-One Ambiguous

**Severity:** Recommendation
**Affected document:** DD §1.1
**Section:** Section list builder, step 5

**Issue:** The section builder iterates `for d = 0 to manifest.total_days - 1`. The manifest schema (`content_format_rules.md`) shows `total_days: 11` for a trip with days `day_00` through `day_11` — that is 12 day files (day 0 = arrival + 11 trip days). The loop `d = 0 to manifest.total_days - 1` would iterate 0..10, missing `day_11`. The script already has a secondary check `if fs.existsSync(day_${pad(d,2)}_${lang}.md)`, which would silently skip `day_11`. This is a data-dependent bug: trips where `total_days` is the count of non-arrival days would be missing the last day from the nav.

The manifest example in `content_format_rules.md` shows `total_days: 11` and day keys `day_00` through `day_10` (arrival + days 1-10), which IS consistent with `d = 0 to total_days - 1` generating 0..10. But the Budapest trip (`trip_2026-04-03_0021`) should be validated against this assumption before implementation.

**Suggestion:** The DD must explicitly state: "The loop iterates `d = 0 to manifest.total_days` (inclusive of `total_days`), relying on the `fs.existsSync` guard to skip absent files. This ensures day_NN is never silently omitted even if total_days is ambiguous." Alternatively, change the approach to enumerate actual `day_NN_LANG.md` files present in the folder, derived from a glob of `day_*_{lang}.md` sorted numerically. File-system enumeration is more robust than manifest arithmetic.

---

### FB-15: No Validation That `manifest.languages[lang]` Exists Before Accessing Day Titles

**Severity:** Recommendation
**Affected document:** DD §1.1
**Section:** NAV_LINKS renderer, step 6

**Issue:** The DD specifies: "Labels ... day-N → `manifest.languages.LANG.days.day_NN.title`". If the script is run with `--lang en` but the manifest only has language state for `ru` (e.g., the trip was generated in Russian only), `manifest.languages.en` will be `undefined`, causing a runtime TypeError at `.days.day_NN.title`. This is not listed in the error conditions (DD §1.2.6) and will produce an unhandled exception rather than a clean error message.

**Suggestion:** Add to error conditions in DD §1.2.6: "Requested `--lang` not present in `manifest.languages` → stderr `ERROR: language '{lang}' not found in manifest.json. Available: {list}`; exit(1)." The validator in `parseArgs()` should check this after reading the manifest.

---

### FB-16: Pre-Regression Validation Gate (Step 4) Dependency on Script Is Unaddressed

**Severity:** Observation
**Affected document:** DD §1.3 / HLD §3.2
**Section:** SKILL.md changes — Step 4 preservation

**Issue:** The BRD REQ-003 AC-1 through AC-5 and the HLD (§1) both state: "The assembly step (Step 3) and pre-regression gate (Step 4) are unchanged." The DD confirms the pre-regression gate is preserved. However, `development_rules.md` §3 check item 12 validates themed container contrast by searching the `<style>` block for `.day-card__banner-title` and `.day-card__banner-date` with explicit `color:` declarations. The new script uses inline `style="color: var(--color-text-inverse)"` on banner children (DD §1.2.3 `renderDayFragment`) rather than CSS class rules. The pre-regression gate regex looks in the `<style>` block, not for inline styles. 

This means the themed container check (validation item 12) will PASS for the CSS class-based check (CSS classes still exist in `rendering_style_config.css`) and the inline style provides belt-and-suspenders — so this is not a failure. But the DD should note this explicitly to prevent a future developer from removing the inline styles believing the CSS class check "proves" correctness.

**Suggestion:** Add a note in DD §1.2.3 `renderDayFragment` and in §3 HTML Rendering Specification: "Inline `style` on banner children is MANDATORY and must not be removed, even though CSS class-based color also exists. The pre-regression gate validates the CSS class, not the inline style; the inline style is the operative runtime defense."

---

### FB-17: `escapeHtml()` Scope — Insufficient Specification of Where It Must Be Applied

**Severity:** Recommendation
**Affected document:** DD §1.2 module structure
**Section:** `escapeHtml()` utility

**Issue:** The DD lists `escapeHtml()` as a utility function that "Escapes &, <, >, \", ' in text content" but does not specify WHERE it must be applied. The rendered templates contain multiple places where user-provided text is interpolated: POI names, descriptions, activity text, pro-tips, accommodation descriptions, budget cell content, etc. If any interpolation point is missed, the output HTML will contain unescaped characters from markdown source content, potentially breaking HTML structure (if a POI name contains `<`) or introducing XSS-like artifacts (if a description contains `&amp;` that gets re-escaped to `&amp;amp;`).

Special concern: activity text in itinerary rows is complex — it may contain inline markdown such as `**bold**` or `_italic_`, which the current LLM output handles by rendering as plain text. The DD does not specify whether the script should support inline markdown in activity text or strip it.

**Suggestion:** Add a section to DD §1.2.2 explicitly listing every template interpolation point and whether `escapeHtml()` is applied. Mark which fields may contain inline markdown and specify the behavior (strip formatting or convert to HTML). This must be in the PE review checklist.

---

### FB-18: `--stale-days` Mode Does Not Regenerate Shell Fragments — Stale NAV Possible After Day Title Change

**Severity:** Observation
**Affected document:** DD §1.3 / HLD §4.3
**Section:** Incremental rebuild

**Issue:** In incremental rebuild mode, if a day title changes in `day_NN_LANG.md` (e.g., "День 3 — Базилика" → "День 3 — Базилика и Рыбацкий Бастион"), the `generate_html_fragments.ts --stale-days 3` run regenerates the day fragment correctly. But the NAV_LINKS and NAV_PILLS are populated from `manifest.languages.LANG.days.day_NN.title`, which is the manifest — not the day file. If the manifest title is also updated, `generate_shell_fragments.ts` should be re-run. The DD does not specify this trigger.

**Suggestion:** Document in the incremental rebuild section: "If a day title changes (title field in `manifest.json` must be updated before running the script), also re-run `generate_shell_fragments.ts` to update NAV_LINKS/NAV_PILLS."

---

## 4. Best Practice Recommendations

**PE Code Review Gate:** REQ-004 requires a PE code review of the implementation scripts. Given the number of template functions and rendering rules in `rendering-config.md`, the PE review checklist (BRD §4 AC-4) should be extended to explicitly cover: (1) all `escapeHtml()` call sites, (2) `🛒` and `🎯` POI card output, (3) accommodation `data-link-type` attributes, (4) multi-language budget total row detection, and (5) Windows CRLF/BOM handling in the parser.

**Test Against Multi-Language Trip:** The implementation checklist (DD §5) specifies testing against `generated_trips/trip_2026-04-03_0021` (Russian). Before merge, the scripts should also be validated against an English or Hebrew trip fragment to confirm language-agnostic behavior. If no such trip exists, generate a minimal test fixture with one day in a non-Russian language.

**Atomic Write Pattern:** The DD correctly specifies "write to temp file then rename." This should use a temp file name that is visually distinct (e.g., `fragment_day_01_ru.html.tmp`) so that a script crash leaving a `.tmp` file is diagnosable. Document the temp file naming convention in DD §1.2.6.

**Manifest-Driven Day Enumeration Over Arithmetic:** As noted in FB-14, enumerating day files via glob is more robust than arithmetic on `total_days`. This also correctly handles legacy trips without day-00 and trips with non-contiguous day numbers.

---

## 5. Sign-off

| Role | Date | Verdict |
|---|---|---|
| Software Architect (Principal Engineer) | 2026-04-03 | Approved with Changes |

**Conditions for approval (all Blocking items must be resolved before implementation is considered complete):**

- [ ] FB-1: PAGE_TITLE language-agnostic derivation — eliminate Russian fallback; use manifest-keyed title suffix or language lookup table
- [ ] FB-2: `accommodation-card__link` must include `data-link-type` attribute in the DD template and implementation
- [ ] FB-3: Explicit DD statement + checklist item confirming `🛒` and `🎯` produce `.poi-card` output and are counted in parity
- [ ] FB-4: Country flag gap — either enumerate a minimum required set of flags (covering all current/planned destinations) or error on unrecognized country; silent omission is not acceptable
- [ ] FB-5: `parseDayFile()` must error (not silently process) on `### 🏨` or `### 🚗` headings appearing in a day file context
- [ ] FB-7: Budget total row detection must be language-agnostic — remove `**Итого` match; use structural position or machine-readable marker
- [ ] FB-9: SKILL.md Step 3 must be explicitly updated to consume `shell_fragments_LANG.json` — the DD currently leaves Step 3 assembly without a specified mechanism for reading the script's output
