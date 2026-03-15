# Architecture Review

**Change:** Language-Independence Refactor — Eliminate Hardcoded Language & Trip Content from Automation Tests
**Date:** 2026-03-15
**Reviewer:** Software Architect
**Documents Reviewed:** `high_level_design.md`, `detailed_design.md`, `business_requirements.md`
**Verdict:** Approved with Changes

---

## 1. Review Summary

The design is strong overall. The "structural over textual" principle (HLD §1) is the right call — it eliminates the largest class of violations without adding configuration complexity. The `<a>` vs `<span>` insight for activity labels is particularly elegant: it deletes 50+ lines of fragile Russian text parsing and replaces them with a selector that already exists in the POM.

The `trip-config.ts` utility is well-scoped and correctly separates from the existing `language-config.ts`. The `LANGUAGE_LABELS` map is the right abstraction for reporting-language-dependent values, and deriving text direction from the language's script is architecturally correct.

However, there are issues that must be addressed before implementation:

- The `LANGUAGE_LABELS` map introduces a **centralized coupling risk** — it's the new single point of failure and needs validation safeguards
- The Playwright config's direction-based branching (DD §1.3) is **over-engineered** for the current use case and contains a structural code issue
- The `data-sub-venue` attribute (DD §3.2) scope definition is too vague for reliable rendering pipeline implementation
- The `EUR` hardcoded in overview-budget (DD §1.9) contradicts the "no hardcoded content" principle
- `loadTripConfig()` is called multiple times across spec files with no caching — performance concern for a file I/O operation

## 2. Architecture Principles Checklist

| Principle | Status | Notes |
|---|---|---|
| Content / presentation separation | Pass | Tests shift from content-matching to structural queries — correct direction |
| Easy to extend for new requirements | Pass | New language = one `LANGUAGE_LABELS` entry. New data attribute = one POM locator |
| Consistent with existing patterns | Pass | Follows `language-config.ts` pattern (read `trip_details.md`, derive values). Data attributes follow `id="poi-day-{D}-{N}"` precedent |
| No unnecessary coupling | Pass with caveats | See FB-1: `LANGUAGE_LABELS` is new coupling. See FB-2: Playwright config over-engineered |
| Regeneration performance | Pass | No impact on trip generation. Test execution adds one `fs.readFileSync` per worker |

## 3. Feedback Items

### FB-1: Add Validation to `LANGUAGE_LABELS` — Fail-Fast on Missing Keys

**Severity:** Blocking
**Affected document:** DD §1.1
**Section:** `loadTripConfig()` function

**Issue:** The `LANGUAGE_LABELS` map is the new single point of failure. If someone adds a new language to `trip_details.md` but forgets to add the corresponding `LANGUAGE_LABELS` entry, all tests crash at runtime with a generic error. Worse, if a label entry exists but has a typo in a section name (e.g., `sectionPlanB: 'Запасной плaн'` with a Latin 'a'), the tests silently fail to match.

**Suggestion:**
1. The `loadTripConfig()` function already throws on missing language — good. But add a **compile-time completeness check**: export the `LanguageLabels` interface and add a type test that verifies all required fields are present (TypeScript already does this, but make the error message explicit).
2. Add a **smoke test** in the test suite: a dedicated test that validates `loadTripConfig()` returns a complete, non-empty config for the current trip. This catches typos in section names before they cascade into cryptic failures across 10 spec files.
3. Consider making `LANGUAGE_LABELS` a `ReadonlyMap` or `as const` to prevent accidental mutation.

---

### FB-2: Simplify Playwright Config Direction Logic

**Severity:** Blocking
**Affected document:** DD §1.3
**Section:** Playwright config target state

**Issue:** The `if/else` branching on `tripConfig.direction` has two problems:

1. **Scoping bug:** `const ltrPath` and `const LTR_HTML` are declared inside `if` blocks — they won't be visible at module scope where `defineConfig` needs them. This code won't compile as written.

2. **Over-engineering:** The `RTL_SUFFIXES = ['he', 'ar', 'fa']` scan loop is the same pattern we're trying to eliminate — a hardcoded list of language codes. If the secondary HTML doesn't exist (common case: single-language trip), the RTL project should simply be disabled rather than scanning for arbitrary files.

**Suggestion:** Flatten the logic. Always resolve the main HTML from `tripConfig.htmlFilename`. For the secondary direction project, use the env var override or gracefully disable:

```typescript
const tripConfig = loadTripConfig();

// Main regression target — always the reporting language's HTML
const mainPath = process.env.TRIP_HTML_OVERRIDE
  ? path.resolve(process.env.TRIP_HTML_OVERRIDE).replace(/\\/g, '/')
  : resolveLatestTrip(projectRoot, tripConfig.htmlFilename);
const MAIN_HTML = `file:///${mainPath}`;

// Secondary direction HTML (optional — may not exist for single-language trips)
let secondaryHtml: string | null = null;
const secondaryEnv = tripConfig.direction === 'ltr'
  ? process.env.TRIP_RTL_HTML
  : process.env.TRIP_LTR_HTML;
if (secondaryEnv) {
  secondaryHtml = `file:///${path.resolve(secondaryEnv).replace(/\\/g, '/')}`;
}

// Projects
const projects = [
  {
    name: tripConfig.direction === 'ltr' ? 'desktop-chromium' : 'desktop-chromium-rtl',
    use: { ...devices['Desktop Chrome'], baseURL: MAIN_HTML },
    testIgnore: tripConfig.direction === 'ltr' ? /rtl-/ : undefined,
    testMatch: tripConfig.direction === 'rtl' ? /rtl-/ : undefined,
  },
];

// Add secondary direction project only if HTML is available
if (secondaryHtml) {
  projects.push({
    name: tripConfig.direction === 'ltr' ? 'desktop-chromium-rtl' : 'desktop-chromium',
    use: { ...devices['Desktop Chrome'], baseURL: secondaryHtml },
    testMatch: tripConfig.direction === 'ltr' ? /rtl-/ : undefined,
    testIgnore: tripConfig.direction === 'rtl' ? /rtl-/ : undefined,
  });
}
```

This is simpler, has no scoping bug, no hardcoded suffix list, and gracefully handles single-language trips.

---

### FB-3: Tighten `data-sub-venue` Scope Definition

**Severity:** Recommendation
**Affected document:** DD §3.2
**Section:** Sub-venue POI attribute spec

**Issue:** The DD says `data-sub-venue` is applied to "POI cards that are sub-venue entries inside a parent attraction." But the current `SUB_VENUE_POIS` list contains much more than sub-venues: grocery stores, along-the-way stops, playgrounds, quick-view stops, bridges, fountains, street food stands, and restaurants. These are not sub-venues — they are POIs with legitimately fewer than 3 external links.

If we only mark true sub-venues, we'll still need a large exclusion list for the other categories. If we mark all of them, we're overloading the attribute's semantics.

**Suggestion:** Replace `data-sub-venue` with a more general `data-link-exempt` boolean attribute. The semantic is: "this POI card is not expected to have all 3 link types (Maps, Site, Photo) and should be excluded from the 3-link completeness check." This covers sub-venues, grocery stores, bridges, fountains, and any other category that legitimately has fewer links.

The rendering pipeline determines link-exemption at render time based on the source markdown (e.g., POIs with fewer than 3 links in the markdown get the attribute automatically). This eliminates the need for any name-based exclusion list — the attribute is a rendering-time fact, not a test-time guess.

Alternatively, consider DD Option B (relaxed assertion: "at least 1 link") more seriously. It's simpler and doesn't require a rendering pipeline change. The 3-link rule was never formally specified — it was an aspirational check.

---

### FB-4: `EUR` Hardcoded in Budget Test

**Severity:** Recommendation
**Affected document:** DD §1.9
**Section:** Overview-budget target state

**Issue:** The target state still contains:
```typescript
await expect(tripPage.budgetSection).toContainText('EUR');
```
`EUR` is trip-specific (derived from the destination's currency), not a universal constant. A Japan trip would use `JPY`; a UK trip `GBP`.

**Suggestion:** Either:
1. Add a `currency` field to `TripConfig` extracted from the generated markdown's budget section, or
2. Replace with a structural check: budget section contains at least one `<td>` or `<span>` with a recognized currency pattern (`/[A-Z]{3}/` or a numeric value).

Option 2 is more consistent with the "structural over textual" principle and doesn't require parsing the currency from markdown.

---

### FB-5: Cache `loadTripConfig()` Result

**Severity:** Recommendation
**Affected document:** DD §1.1
**Section:** `loadTripConfig()` function

**Issue:** The function reads and parses `trip_details.md` via `fs.readFileSync` on every call. With 10 spec files each calling `loadTripConfig()` in `beforeAll` or at module scope, that's 10 redundant file reads per worker. While not a performance blocker (it's a small file), it's unnecessary I/O and sets a bad precedent.

**Suggestion:** Add module-level caching:
```typescript
let _cached: TripConfig | null = null;

export function loadTripConfig(): TripConfig {
  if (_cached) return _cached;
  // ... existing logic ...
  _cached = Object.freeze(result) as TripConfig;
  return _cached;
}
```

`Object.freeze` prevents accidental mutation by any consumer. This is a standard pattern for config loaders.

---

### FB-6: Approve `data-section-type` — Reject Naming Inconsistency in HLD

**Severity:** Observation
**Affected document:** HLD §3 (structural path diagram)
**Section:** Alternative path diagram

**Issue:** The HLD diagram uses `data-type="plan-b"` but the DD uses `data-section-type="plan-b"`. These must be consistent. `data-section-type` is the better name — it's more specific and avoids collision with potential future `data-type` attributes on other elements.

**Suggestion:** Fix the HLD diagram to use `data-section-type` consistently.

---

### FB-7: Progression Test Design — Don't Remove All Trip-Specific Content

**Severity:** Recommendation
**Affected document:** DD §1.11
**Section:** Progression test refactoring

**Issue:** The DD recommends removing `NOTABLE_POIS` and `EXPECTED_POI_COUNTS` entirely, arguing that `poi-parity.spec.ts` covers them. This is partially true but misses the purpose of progression tests.

Progression tests serve as a **known-good snapshot** — they verify that a specific regeneration didn't lose content. POI parity validates structural counts (markdown vs HTML), but progression validates that specific high-value POIs actually made it through the generation pipeline. These are different failure modes.

**Suggestion:** Keep progression tests' spirit but make them data-driven:
1. Remove `NOTABLE_POIS` as a hardcoded constant — agreed, this violates language independence.
2. Replace with a **dynamic extraction**: parse the markdown for `### ` headings that represent main POIs (not excluded sections), pick the first N per day, and verify they appear as rendered POI cards. This preserves the "did we lose a POI?" regression signal without hardcoding names.
3. `EXPECTED_POI_COUNTS` can be safely removed — poi-parity already covers this dynamically.

---

## 4. Best Practice Recommendations

1. **Test the config utility itself.** Add a small spec file (`trip-config.spec.ts`) that validates `loadTripConfig()` returns sane values — non-empty destination, positive day count, labels object with all required fields, direction matching expectations. This is your canary: if the config parser breaks, this test fails first with a clear message, instead of 50 cryptic failures across 10 spec files.

2. **Implementation order matters.** The DD's checklist (§5) has the right sequence: utility first, then config, then POM, then specs. Do not parallelize spec refactoring — each file should pass regression before moving to the next. A big-bang refactor of 10 files is the fastest way to create an un-debuggable mess.

3. **Rendering pipeline changes (data attributes) must land before test refactoring.** Steps 10 and 15 in the DD checklist have a dependency: `poi-cards.spec.ts` can't use `data-link-exempt` until the HTML actually has it. Reorder: rendering pipeline change → HTML regeneration → then refactor tests that depend on new attributes.

4. **Document the `LANGUAGE_LABELS` contract.** Add a comment block above the map explaining: (a) when to add a new entry, (b) how section names must exactly match the rendering pipeline's output, (c) that `fileSuffix` must match the `trip_full_{suffix}.html` naming convention in `content_format_rules.md`.

## 5. Sign-off

| Role | Date | Verdict |
|---|---|---|
| Software Architect | 2026-03-15 | Approved with Changes |

**Conditions for approval:**
- [ ] FB-1: Add smoke test for `loadTripConfig()` completeness + `Object.freeze` on cached result
- [ ] FB-2: Rewrite Playwright config direction logic per simplified pattern (fix scoping bug, remove suffix scan loop)
- [ ] FB-3: Rename `data-sub-venue` to `data-link-exempt` or adopt Option B (relaxed "at least 1 link" assertion) — Dev + QA-A decide
- [ ] FB-4: Remove hardcoded `EUR` from budget test — use structural check or config-driven currency
- [ ] FB-5: Add module-level caching to `loadTripConfig()`
- [ ] FB-6: Fix `data-type` → `data-section-type` inconsistency in HLD diagram
