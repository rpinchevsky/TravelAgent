# Architecture Review — Pass 2

**Change:** HTML Render Pipeline Optimization — Script-Based Shell Fragments & Template-Engine Day Generation
**Date:** 2026-04-03
**Reviewer:** Software Architect (Principal Engineer)
**Pass:** 2 (verification that all 7 blocking items from Pass 1 are resolved)
**Documents Reviewed:** `detailed_design.md` (revised), `architecture_review.md` (Pass 1), `high_level_design.md`, `business_requirements.md`, `rendering-config.md`, `TripPage.ts`
**Verdict:** Approved with Changes

---

## 1. Pass 1 Blocking Item Status

The following table resolves each of the 7 blocking items from Pass 1. Items are evaluated against the revised DD §1–§7 and specifically the "SA Review Resolution" section (§7).

| Item | Title | Status | Notes |
|---|---|---|---|
| FB-1 | PAGE_TITLE hard-codes Russian suffix | **Still Blocking** | See NB-1 below |
| FB-2 | `accommodation-card__link` missing `data-link-type` | Closed | Full template with explicit `data-link-type` on all 4 link types + `booking-cta` added to DD §1.2.3. Enumeration table included. Implementation checklist has checkbox. |
| FB-3 | `### 🛒` and `### 🎯` not confirmed as POI | Closed | DD §1.2.2 has explicit statement, parity scope clarification in §1.2.4, and checklist checkboxes for both emoji types including edge-case test requirement. |
| FB-4 | Country flag gap — silent omission | Closed | `exit(1)` on unrecognized country. Minimum required 13-country set enumerated. `COUNTRY_NAME_TO_CODE` map required. `extractCountryCode()` logic specified with correct error message. |
| FB-5 | `parseDayFile()` silently processes `### 🏨` / `### 🚗` | Closed | DD §1.2.2 specifies `exit(1)` on both. Error conditions listed in §1.2.6. FSM states scoped to correct parse functions. |
| FB-7 | Budget total row detection matches Russian `**Итого**` | Closed | Both `renderBudgetFragment()` and `renderPricingGrid()` now use last-non-empty-row structural detection. No language string matching. Explicitly labeled `FB-7 resolution — language-agnostic`. |
| FB-9 | SKILL.md Step 3 lacks mechanism to consume `shell_fragments_LANG.json` | Closed | DD §1.3 includes explicit Step 3 update block with TypeScript read logic, placeholder substitution, and error handling if JSON is missing. `rendering-config.md` §1.4 update table also includes Step 3. |

---

## 2. Detailed Assessment of FB-1 (Still Blocking)

### NB-1 (NEW BLOCKING): FB-1 Resolution Contains a Russian Fallback — Contradiction Between Pseudo-Code and Prose

**Severity:** Blocking
**Affected section:** DD §1.1, Script logic step 5

**Issue:** The "SA Review Resolution" table (§7) states FB-1 is resolved: "Derivation is always `manifest.destination + year + TITLE_SUFFIX_BY_LANG[lang]`. The `fragment_overview_LANG.html` fallback is eliminated entirely." This claim is INCORRECT as written in the actual script logic.

DD §1.1, step 5 (the specification of record for the implementation) reads:
```
suffix = TITLE_SUFFIX_BY_LANG[lang] ?? TITLE_SUFFIX_BY_LANG["ru"]
```

The `??` (nullish coalescing) operator creates a Russian fallback. If `TITLE_SUFFIX_BY_LANG[lang]` evaluates to `undefined` (e.g., for an unsupported language or a typo), the script silently uses the Russian suffix `"Семейный маршрут"`. This is the exact problem described in FB-1, re-introduced in the pseudo-code.

The prose immediately below the lookup table (lines 150–155) contradicts this: "the script MUST NOT silently fall back to Russian. It MUST exit(1)" with a clear error message. The two specifications are irreconcilable in the DD as written: the pseudo-code at step 5 falls back; the prose says never fall back.

A developer implementing from the pseudo-code (the more authoritative, code-level artifact) will implement the Russian fallback. This is a language-agnostic violation (BRD REQ-002 AC-17, project-wide `CLAUDE.md` rule) and defeats the purpose of FB-1's fix.

**Required fix:** Remove `?? TITLE_SUFFIX_BY_LANG["ru"]` from step 5. The correct implementation is:
```
if (!TITLE_SUFFIX_BY_LANG[lang]) {
  stderr "ERROR: language '{lang}' is missing from TITLE_SUFFIX_BY_LANG. Add it before proceeding."
  exit(1)
}
suffix = TITLE_SUFFIX_BY_LANG[lang]
```
This is already described in the prose — the pseudo-code must match it. The DD must be corrected so there is exactly one specification for this behavior and it is the exit(1) path.

---

## 3. New Issues Introduced by the Revisions

The following items are raised on material introduced or newly exposed by the revised DD that were not present or not fully visible in Pass 1.

---

### NB-2: `renderAccommodationFragment` Uses `<section>` Tag — Contradicts `rendering-config.md` and BRD AC-15

**Severity:** Blocking
**Affected section:** DD §1.2.3 `renderAccommodationFragment()` template

**Issue:** The revised DD template for `renderAccommodationFragment()` specifies:
```html
<section id="accommodation" class="accommodation-section">
```

However:
- `rendering-config.md` §Accommodation Section & Card Layout specifies: `<div class="accommodation-section" id="accommodation">`
- BRD REQ-002 AC-15 specifies: "Accommodation section renders as `<div class="accommodation-section" id="accommodation">`"

The DD changes `<div>` to `<section>`. This is a tag-name change from the established contract. While Playwright tests in `accommodation.spec.ts` use ID-based selectors (`#accommodation`) that are tag-agnostic, this is a divergence from the contract document. If `rendering-config.md` is not simultaneously updated to reflect this tag change, the implementation will be out of contract with the rule file — a maintenance hazard.

The same discrepancy exists for the BRD AC-15 which must also be superseded.

**Required fix:** Either (a) explicitly document in DD §1.2.3 that the tag is intentionally changed from `<div>` to `<section>` for semantic correctness, and list `rendering-config.md` Accommodation Section rule and BRD AC-15 as items to be updated accordingly in §1.4, OR (b) revert the DD template to `<div>` to match the existing contract. Silent tag divergence is not acceptable in a contract-governed system.

---

### NB-3: Language-Agnostic Schedule/Cost Heading Detection Explicitly Left as Russian-Only — No Plan Specified

**Severity:** Recommendation
**Affected section:** DD §1.2.2 "Note on language-agnostic section detection"

**Issue:** The revised DD introduces the following explicit acknowledgement:
> "`### Расписание` and `### Стоимость дня` are the Russian-language headings. For full language-agnostic operation these headings should be detected by a configurable pattern. However, since `content_format_rules.md` specifies these exact headings and does not define multilingual variants, the implementation may match these Russian strings for now."

This is an honest disclosure, but it creates a known language-agnostic violation that is not tracked anywhere. If a future trip is generated in English or Hebrew, the parser will fail to recognize `### Schedule` or `### Daily Cost` as special sections, and will instead treat them as POI headings — adding them to `day.pois` and generating incorrect `.poi-card` output. The parity check would then count extra "POIs" that are actually schedule tables.

The DD should not leave this as an acknowledged risk with no plan. At minimum, a tracking mechanism is needed.

**Suggestion:** Add an entry to the error conditions in DD §1.2.6 or the implementation checklist in §5: "KNOWN LIMITATION: `### Расписание` and `### Стоимость дня` section detection is Russian-only. Non-Russian trips with translated schedule/cost headings will produce incorrect POI cards for those sections. Resolution: `content_format_rules.md` must add language-agnostic markers (emoji-prefixed headings or standardized heading text) before multi-language support can be completed. Track as a follow-up issue."

---

### NB-4: POI Link Labels in Template Are Russian-Only — Language-Agnostic Violation in `renderPoiCard()`

**Severity:** Blocking
**Affected section:** DD §1.2.3 `renderPoiCard()` template

**Issue:** The `renderPoiCard()` HTML template specifies hardcoded Russian labels for POI links:
```html
<a ... data-link-type="maps" ...>  {SVG_ICONS.mapPin} 📍 Maps</a>
<a ... data-link-type="site" ...>  {SVG_ICONS.globe}  🌐 Сайт</a>
<a ... data-link-type="photo" ...> {SVG_ICONS.camera} 📸 Фото</a>
<a ... data-link-type="phone" ...> {SVG_ICONS.phone}  📞 Телефон</a>
```

"Maps" (English), "Сайт" (Russian), "Фото" (Russian), "Телефон" (Russian) are language-specific strings embedded directly in the template. For an English or Hebrew trip, the rendered output would contain Russian link labels in an otherwise non-Russian page. This violates BRD REQ-002 AC-17 (language-agnostic) and the project-wide language-agnostic rule.

Note that `rendering-config.md` §POI Card Structure also specifies these labels (`📍 Maps`, `🌐 Сайт`, `📸 Фото`, `📞 Телефон`) — but `rendering-config.md` was written for Russian as the primary output language. The DD must resolve this with per-language label lookup tables identical to the approach used for `TITLE_SUFFIX_BY_LANG`.

The same issue exists in `renderAccommodationCard()` which uses the same hardcoded labels.

**Required fix:** Add per-language label lookup tables for POI link labels to the script (parallel to `TITLE_SUFFIX_BY_LANG`):
```typescript
const POI_LINK_LABEL_MAPS:  Record<string, string> = { ru: "Maps", en: "Maps", he: "מפות" };
const POI_LINK_LABEL_SITE:  Record<string, string> = { ru: "Сайт", en: "Site", he: "אתר" };
const POI_LINK_LABEL_PHOTO: Record<string, string> = { ru: "Фото", en: "Photo", he: "תמונות" };
const POI_LINK_LABEL_PHONE: Record<string, string> = { ru: "Телефон", en: "Phone", he: "טלפון" };
```
The `renderPoiCard()` and `renderAccommodationCard()` template functions must accept `lang` as a parameter and use these tables. The DD implementation checklist §5 must add checkboxes for this.

Note: `rendering-config.md` §POI Card Structure rule states "all site/website links MUST use the exact label `🌐 Сайт`" — this rule is itself language-specific and must be updated alongside the DD to permit language-specific site labels.

---

### NB-5: `renderAccommodationCard()` Rating Format Divergence From `renderPoiCard()`

**Severity:** Observation
**Affected section:** DD §1.2.3 `renderAccommodationCard()` template

**Issue:** The `renderPoiCard()` template specifies rating as:
```html
<span class="poi-card__rating">⭐ {rating} [({reviewCount})]</span>
```

The `renderAccommodationCard()` template specifies:
```html
<span class="accommodation-card__rating">⭐ {rating}/5 ({reviewCount})</span>
```

The accommodation card always appends `/5` and always includes review count (no optional guard). The POI card has `[({reviewCount})]` as optional. This divergence may be intentional (accommodation always shows `/5`) but it's not documented as such. The `accommodation.spec.ts` test at TC-202 queries `.accommodation-card__rating` — if the format is wrong, the test checks text content and will fail.

**Suggestion:** Confirm whether accommodation rating always includes `/5` and always has a review count, or whether both fields are optional like POI ratings. Document the decision explicitly in DD §1.2.3.

---

### NB-6: Step 3 SKILL.md Update Shows TypeScript Code — But SKILL.md Is Markdown Prose for an LLM Agent

**Severity:** Recommendation
**Affected section:** DD §1.3, Step 3 update

**Issue:** The Step 3 update in DD §1.3 shows:
```typescript
const shellFragments = JSON.parse(
  fs.readFileSync(`${tripFolder}/shell_fragments_${lang}.json`, 'utf8')
);
```

The SKILL.md is a Markdown document read by a Claude Code agent at runtime — it is not executed TypeScript. The agent reads the SKILL.md and translates it into tool calls (Read, Bash, etc.). A TypeScript code block in SKILL.md is a specification example, not executable code. The agent must translate it into a Read tool call to load the JSON file and then string substitution.

If the developer literally copies the TypeScript snippet into SKILL.md as a "how to read the JSON" code block, the agent will interpret it correctly as an illustration. But the DD should clarify this distinction — otherwise the implementation team may add unnecessary complexity (e.g., creating a wrapper script for Step 3 assembly, or trying to execute TypeScript in SKILL.md).

**Suggestion:** DD §1.3 Step 3 update should describe the agent action in natural-language terms: "Read `{trip_folder}/shell_fragments_{lang}.json` using the Read tool, parse the JSON, substitute `PAGE_TITLE`, `NAV_LINKS`, `NAV_PILLS` into `base_layout.html` before concatenating fragments." The TypeScript snippet is fine as an illustration of the data structure, but the primary description should be in terms of agent tool calls.

---

### NB-7: `manifest.car_rental.blocks[0].id` Assumed Present — No Validation Specified

**Severity:** Recommendation
**Affected section:** DD §3 HTML Rendering Specification, Car rental section aria

**Issue:** The DD §3 specifies:
> `<section id="car-rental" class="car-rental-section" role="region" aria-labelledby="car-rental-title-{blockId}">` where `blockId` comes from `manifest.car_rental.blocks[0].id`.

There is no validation specified for the case where `manifest.car_rental` is absent or `manifest.car_rental.blocks` is empty. If a trip has a `car_rental_LANG.md` file but the manifest has not yet been updated with `car_rental.blocks`, the script will throw a runtime TypeError at `manifest.car_rental.blocks[0].id`. This is not listed in the error conditions in DD §1.2.6.

**Suggestion:** Add to error conditions (DD §1.2.6): "If `car_rental_LANG.md` exists but `manifest.car_rental.blocks` is absent or empty → error with message to update manifest.json before rendering." Alternatively, derive `blockId` from the file content directly rather than the manifest.

---

## 4. Pass 1 Recommendations & Observations — Disposition

All Pass 1 Recommendation and Observation items (FB-6, FB-8, FB-10, FB-11, FB-12, FB-13, FB-14, FB-15, FB-16, FB-17, FB-18) are adequately addressed in the revised DD. No re-opens.

Pass 1 best-practice recommendations (PE review scope, multi-language test fixture, atomic write naming, manifest-driven day enumeration) are all incorporated into DD §5 checklist and §1.2.6. No re-opens.

---

## 5. Sign-off

| Role | Date | Verdict |
|---|---|---|
| Software Architect (Principal Engineer) | 2026-04-03 | Approved with Changes |

**Final verdict: Approved with Changes.**

**Conditions for approval (all Blocking items must be resolved before implementation is considered complete):**

- [ ] **NB-1 (re-opened FB-1):** Remove `?? TITLE_SUFFIX_BY_LANG["ru"]` from DD §1.1 step 5 pseudo-code. The implementation MUST exit(1) on missing language, not fall back to Russian. Pseudo-code and prose must be consistent.
- [ ] **NB-2:** Resolve the `<section>` vs `<div>` tag discrepancy for the accommodation section wrapper: either document the intentional tag change in DD §1.2.3 and add `rendering-config.md` accommodation rule + BRD AC-15 to the §1.4 update table, OR revert to `<div>` to match the existing contract.
- [ ] **NB-4:** Add per-language label lookup tables for POI link labels (`Сайт/Site`, `Фото/Photo`, `Телефон/Phone`, `Maps/Maps`) to `generate_html_fragments.ts`. `renderPoiCard()` and `renderAccommodationCard()` must use these tables. DD §5 checklist must include explicit checkboxes.

**Recommendations (should fix, not blocking):**

- NB-3: Track the Russian-only schedule/cost heading limitation explicitly as a known issue with a plan to resolve it before non-Russian trip generation is attempted.
- NB-5: Clarify whether accommodation card rating and review count are always present (mandatory) or conditionally rendered like POI card ratings. Document the decision in DD §1.2.3.
- NB-6: Rewrite Step 3 SKILL.md update description in agent-tool-call terms rather than TypeScript code.
- NB-7: Add validation for `manifest.car_rental.blocks` presence to the error conditions list in DD §1.2.6.

**Go/No-Go Recommendation: No-Go for implementation start until NB-1, NB-2, and NB-4 are resolved in the DD.** These are one-day fixes, not a redesign. After those three items are addressed, the DD can be re-submitted for a Pass 3 desk review (no full SA cycle needed — reviewer confirms the three items are fixed and signs off).
