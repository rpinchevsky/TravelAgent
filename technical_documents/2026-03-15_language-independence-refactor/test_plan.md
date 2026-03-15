# Test Plan

**Change:** Language-Independence Refactor — Eliminate Hardcoded Language & Trip Content from Automation Tests
**Date:** 2026-03-15
**Author:** Automation Engineer
**BRD Reference:** `business_requirements.md`
**DD Reference:** `detailed_design.md`
**Status:** Draft

---

## 1. Test Scope

**In scope:**
- Validate that the new `trip-config.ts` utility correctly extracts all trip metadata and language labels
- Validate that all refactored spec files produce the same pass/fail results as before (behavior-preserving refactor)
- Validate that no spec file, POM, or fixture contains hardcoded language or trip-specific strings post-refactor
- Validate that new HTML data attributes (`data-section-type`, `data-link-exempt`) are present and correctly used by tests

**Out of scope:**
- Visual regression snapshots — inherently trip-specific, explicitly exempt per BRD REQ-011
- Trip generation logic — no changes to planning or content rules
- `language-config.ts` — no changes needed, already language-independent
- RTL layout tests — already language-independent (structural CSS/layout checks)

**Test type:** Both (progression for new `trip-config.spec.ts`; regression for all refactored specs)

## 2. Test Environment

- **Browser:** Chromium (desktop viewport)
- **Framework:** Playwright + TypeScript
- **Fixture:** Shared-page (read-only) for all DOM-reading tests; standard for scroll/click tests
- **Target file:** `trip_full_{lang}.html` (resolved dynamically by `trip-config.ts`)

## 3. Test Cases

### TC-001: `trip-config.ts` smoke test — config completeness

**Traces to:** REQ-001 → AC-1, AC-2, AC-4; SA FB-1
**Type:** Progression
**Spec file:** `trip-config.spec.ts` (new)
**Priority:** Critical

**Preconditions:**
- `trip_details.md` exists at project root with valid content

**Steps:**
1. Call `loadTripConfig()`
2. Validate all returned fields are non-empty and correctly typed

**Expected result:**
- `destination` is a non-empty string
- `arrivalDate` and `departureDate` are valid Dates, arrival < departure
- `dayCount` is a positive integer matching date range
- `travelers` is a non-empty array of strings
- `reportingLanguage` matches a key in `LANGUAGE_LABELS`
- `labels` object has all required fields (langCode, direction, dayTitle, monthNames with 12 entries, all section* fields non-empty, budgetTotal non-empty, fileSuffix non-empty, dayHeadingRegex is a valid RegExp)
- `dayTitles` has `dayCount` entries, each starting with the language's day word
- `dayDates` has `dayCount` entries, each containing a month name from the labels
- `pageTitle` is a non-empty string containing destination and year
- `markdownFilename` matches `trip_full_{suffix}.md`
- `htmlFilename` matches `trip_full_{suffix}.html`
- `direction` is `'ltr'` or `'rtl'`
- `excludedSections` is a non-empty array

**Implementation notes:**
- Standard `@playwright/test` import (no shared-page needed — this is a pure unit test, no browser)
- All assertions are hard (`expect`, not `expect.soft`) — any failure here means all other tests will cascade

---

### TC-002: `trip-config.ts` caching and immutability

**Traces to:** REQ-001 → AC-4; SA FB-5
**Type:** Progression
**Spec file:** `trip-config.spec.ts`
**Priority:** High

**Preconditions:**
- Same as TC-001

**Steps:**
1. Call `loadTripConfig()` twice
2. Compare references
3. Attempt to mutate a property

**Expected result:**
- Both calls return the same object reference (caching works)
- Attempting to set a property throws or silently fails (Object.freeze)

**Implementation notes:**
- Pure unit test, no browser

---

### TC-003: Activity labels — structural POI detection replaces GENERIC_PREFIXES

**Traces to:** REQ-002 → AC-1, AC-2, AC-3, AC-4
**Type:** Regression
**Spec file:** `activity-label-languages.spec.ts` (refactored)
**Priority:** Critical

**Preconditions:**
- HTML loaded via shared-page fixture

**Steps:**
1. Count `<a class="activity-label">` elements (POI references)
2. For each, validate text contains all configured `poi_languages` scripts
3. Verify `<span class="activity-label">` elements are not checked (generic actions)

**Expected result:**
- POI-referencing labels contain all configured language scripts (same behavior as before)
- No Russian string literals in test code
- Generic action labels are identified by element type (`<span>`), not by text prefix matching

**Implementation notes:**
- Shared-page fixture
- Reuses `clickableActivityLabels` locator from TripPage.ts (already exists)
- `GENERIC_PREFIXES`, `GENERIC_FULL_PATTERNS`, `referencesPoi()`, `isGenericAction()`, `stripEmoji()` all deleted

---

### TC-004: POI parity — config-driven section exclusions

**Traces to:** REQ-003 → AC-1, AC-2, AC-3, AC-4
**Type:** Regression
**Spec file:** `poi-parity.spec.ts` (refactored)
**Priority:** Critical

**Preconditions:**
- Generated markdown and HTML exist in latest trip folder

**Steps:**
1. Load `tripConfig.excludedSections` and `tripConfig.markdownFilename`
2. Parse markdown using `tripConfig.labels.dayHeadingRegex`
3. Compare per-day POI counts: markdown sections vs HTML cards

**Expected result:**
- Same pass/fail behavior as before
- No Russian string literals in test code (section names, filename, regex all from config)

**Implementation notes:**
- Shared-page fixture
- `getExpectedPoiCountsFromMarkdown()` extracted to `markdown-pois.ts` utility

---

### TC-005: Day cards — config-driven titles and dates

**Traces to:** REQ-004 → AC-1, AC-2, AC-3, AC-4
**Type:** Regression
**Spec file:** `day-cards.spec.ts` (refactored)
**Priority:** Critical

**Preconditions:**
- HTML loaded via shared-page fixture

**Steps:**
1. Load `tripConfig.dayTitles` and `tripConfig.dayDates`
2. For each day, verify banner title contains the config-driven day title
3. For each day, verify banner date contains the config-driven date string
4. For each day, verify Plan B section exists via `data-section-type="plan-b"` selector

**Expected result:**
- Same pass/fail behavior as before
- `DAY_TITLES` and `DAY_DATES` arrays replaced with `tripConfig` properties
- `hasText: 'Запасной план'` replaced with `[data-section-type="plan-b"]`

**Implementation notes:**
- Shared-page fixture
- Uses `expect.soft()` with descriptive messages per existing §6.3 convention

---

### TC-006: Structure — config-driven page title, travelers, lang

**Traces to:** REQ-005 → AC-1, AC-2, AC-3, AC-4
**Type:** Regression
**Spec file:** `structure.spec.ts` (refactored)
**Priority:** Critical

**Preconditions:**
- HTML loaded via shared-page fixture

**Steps:**
1. Verify page title matches `tripConfig.pageTitle`
2. Verify subtitle contains each name from `tripConfig.travelers`
3. Verify `<html lang>` attribute matches `tripConfig.labels.langCode`

**Expected result:**
- Same pass/fail behavior as before
- No hardcoded Russian title, names, or `'ru'` lang code

**Implementation notes:**
- Shared-page fixture
- Traveler name loop replaces 5 individual assertions

---

### TC-007: Overview & budget — structural + config-driven

**Traces to:** REQ-006 → AC-1, AC-2, AC-3, AC-4; SA FB-4
**Type:** Regression
**Spec file:** `overview-budget.spec.ts` (refactored)
**Priority:** Critical

**Preconditions:**
- HTML loaded via shared-page fixture

**Steps:**
1. Verify overview dates derived from `tripConfig` arrival/departure
2. Verify holiday advisory exists and has non-empty title and body (structural)
3. Verify budget contains `tripConfig.labels.budgetTotal` label
4. Verify budget contains a 3-letter currency code (`/[A-Z]{3}/` pattern)

**Expected result:**
- Dates validated against config, not hardcoded
- Holiday advisory validated structurally (no `'Иштвана'` or `'закрыт'`)
- Budget validated with config-driven total label + structural currency (no hardcoded `'EUR'`)

**Implementation notes:**
- Shared-page fixture

---

### TC-008: POI cards — `data-link-exempt` replaces exclusion list

**Traces to:** REQ-007 → AC-1, AC-2, AC-3; SA FB-3
**Type:** Regression
**Spec file:** `poi-cards.spec.ts` (refactored)
**Priority:** Critical

**Preconditions:**
- HTML generated with `data-link-exempt` attribute on exempt POI cards

**Steps:**
1. For each POI card, check for `data-link-exempt` attribute
2. If exempt: skip 3-link check
3. If not exempt: validate Maps + Site + Photo links present

**Expected result:**
- `SUB_VENUE_POIS` array (69 entries) completely deleted
- Same link-validation coverage but driven by HTML attribute, not name matching
- Test title updated from `'Фото'` / `'Сайт'` to language-neutral description

**Implementation notes:**
- Shared-page fixture
- Link detection via SVG icon patterns (already language-independent in current code)

---

### TC-009: Progression — dynamic POI presence + config labels

**Traces to:** REQ-008 → AC-1, AC-2, AC-3, AC-4; SA FB-7
**Type:** Regression
**Spec file:** `progression.spec.ts` (refactored)
**Priority:** High

**Preconditions:**
- HTML and markdown in latest trip folder

**Steps:**
1. Extract first POI name per day from markdown via `markdown-pois.ts`
2. Verify each appears as a rendered POI card
3. Verify holiday advisory structurally (attached + non-empty)
4. Verify budget contains `tripConfig.labels.budgetTotal`
5. Verify structural patterns (pricing-grid, advisory--info) per day — unchanged

**Expected result:**
- `NOTABLE_POIS` and `EXPECTED_POI_COUNTS` deleted
- POI presence validated dynamically from markdown
- Russian content assertions (`'Иштван'`, `'Итого'`, `'749 100'`, `'1 887'`) eliminated

**Implementation notes:**
- Shared-page fixture for DOM reads; standard fixture for scroll test if any
- `expect.soft()` per existing convention

---

### TC-010: POM — `data-section-type` replaces Russian text filter

**Traces to:** REQ-010 → AC-1, AC-2
**Type:** Regression
**Spec file:** All specs using `getDayLogistics()` or `getDayPlanB()`
**Priority:** High

**Preconditions:**
- HTML generated with `data-section-type` attributes

**Steps:**
1. Verify `getDayLogistics()` uses `[data-section-type="logistics"]` selector
2. Verify `getDayPlanB()` uses `[data-section-type="plan-b"]` selector
3. Verify no Russian text in `TripPage.ts`

**Expected result:**
- `hasText: 'Логистика'` removed from TripPage.ts
- Locators use attribute selectors — language-independent

**Implementation notes:**
- Verified by code review + regression run

---

### TC-011: Playwright config — dynamic direction resolution

**Traces to:** REQ-009 → AC-1, AC-2, AC-3, AC-4, AC-5
**Type:** Regression
**Spec file:** N/A (config file, validated by test suite execution)
**Priority:** Critical

**Preconditions:**
- `trip_details.md` has valid reporting language

**Steps:**
1. Verify config resolves main HTML filename from `tripConfig.htmlFilename`
2. Verify direction is derived from language (not hardcoded)
3. Verify no `'ru'` or `'he'` string literals in config
4. Verify secondary direction project only added when env var provided

**Expected result:**
- Test suite starts successfully with dynamically resolved HTML path
- RTL project gracefully omitted when no RTL HTML env var set

**Implementation notes:**
- Validated by running the full test suite after config change

---

### TC-012: Enforcement rule exists

**Traces to:** REQ-011 → AC-1, AC-2, AC-3, AC-4
**Type:** Progression
**Spec file:** N/A (rule file, validated by code review)
**Priority:** Medium

**Preconditions:** None

**Steps:**
1. Verify `automation_rules.md` §7 exists with Language Independence rules
2. Verify it covers: no hardcoded text (§7.1), no trip-specific constants (§7.2), enforcement responsibility (§7.3)

**Expected result:**
- Rules documented and enforceable during Phase 3/Phase 4 reviews

**Implementation notes:**
- Manual review checkpoint

---

## 4. Coverage Matrix

| BRD Requirement | Acceptance Criterion | Test Case(s) | Assertion Type |
|---|---|---|---|
| REQ-001 | AC-1: Extract metadata | TC-001 | Hard |
| REQ-001 | AC-2: Derive language labels | TC-001 | Hard |
| REQ-001 | AC-3: Auto-discover trip folder | TC-001 (implicit — loadTripConfig succeeds) | Hard |
| REQ-001 | AC-4: Single source of truth | TC-002 (caching + immutability) | Hard |
| REQ-001 | AC-5: New language = one entry | TC-001 (label completeness check) | Hard |
| REQ-002 | AC-1: Replace GENERIC_PREFIXES | TC-003 | Hard |
| REQ-002 | AC-2: Replace GENERIC_FULL_PATTERNS | TC-003 | Hard |
| REQ-002 | AC-3: Works for 3 languages | TC-003 (structural — language-agnostic) | Hard |
| REQ-002 | AC-4: Zero Russian literals | TC-003 + code review | Hard |
| REQ-003 | AC-1–4 | TC-004 | Hard |
| REQ-004 | AC-1–4 | TC-005 | Soft (per-day batch) |
| REQ-005 | AC-1–4 | TC-006 | Hard |
| REQ-006 | AC-1–4 | TC-007 | Hard |
| REQ-007 | AC-1–3 | TC-008 | Hard |
| REQ-008 | AC-1–4 | TC-009 | Soft (per-day batch) |
| REQ-009 | AC-1–5 | TC-011 | Implicit (suite runs) |
| REQ-010 | AC-1–3 | TC-010 | Implicit (regression passes) |
| REQ-011 | AC-1–4 | TC-012 | Manual review |

## 5. Test Data Dependencies

| Data Source | What's Used | Update Needed? |
|---|---|---|
| `trip_details.md` | Destination, dates, travelers, language | Dynamic — read at runtime by `trip-config.ts` |
| Generated markdown (`trip_full_{lang}.md`) | POI section counts, POI names, budget amounts | Dynamic — read at runtime by `markdown-pois.ts` |
| Generated HTML (`trip_full_{lang}.html`) | All DOM assertions | Dynamic — resolved at runtime by Playwright config |
| `LANGUAGE_LABELS` map | Section names, day titles, month names per language | Static — updated only when adding a new language |

## 6. Risk & Mitigation

| Risk | Mitigation |
|---|---|
| `trip-config.ts` parser breaks on unusual `trip_details.md` format | TC-001 smoke test catches this first with clear error |
| `LANGUAGE_LABELS` section name doesn't match rendering output | TC-001 validates non-empty labels; integration with actual HTML caught by regression |
| `data-section-type` / `data-link-exempt` not present in HTML | Tests fail fast with clear selector-not-found error; implementation checklist ensures HTML regen before test refactor |
| Refactoring 10 spec files introduces regressions | File-by-file implementation with regression run after each (DD §5 phased approach) |
| Dynamic POI presence check (TC-009) is flaky on partial markdown matches | Use first-word matching + `expect.soft()` to allow partial failures without blocking |

## 7. Estimated Impact

- **New test count:** 1 new spec file (`trip-config.spec.ts`) with 2 test cases. Net change: +2 tests
- **Estimated runtime increase:** ~0.5 seconds (pure unit tests, no browser needed)
- **Files added:** `trip-config.ts`, `trip-config.spec.ts`, `markdown-pois.ts`
- **Files modified:** `playwright.config.ts`, `TripPage.ts`, 8 spec files, `automation_rules.md`, `rendering-config.md`, `development_rules.md`
- **Lines deleted:** ~200+ (GENERIC_PREFIXES, SUB_VENUE_POIS, NOTABLE_POIS, EXPECTED_POI_COUNTS, DAY_TITLES, DAY_DATES, EXCLUDED_SECTIONS, hardcoded strings)
- **Lines added:** ~150 (trip-config.ts utility + smoke test + markdown-pois.ts)
- **Net effect:** Fewer lines, zero hardcoded strings, same coverage
