# Business Requirements Document

**Change:** Language-Independence Refactor — Eliminate Hardcoded Language & Trip Content from Automation Tests
**Date:** 2026-03-15
**Author:** Product Manager
**Status:** Draft

---

## 1. Background & Motivation

An architectural audit of the automation test suite revealed systemic language-specific and trip-specific hardcoding across 10 of 14 spec files, the Page Object Model, and the Playwright config. The current tests are structurally coupled to:

1. **Russian as the reporting language** — 44 generic action prefixes, section names (`Запасной план`, `Логистика`, `Стоимость`), day titles (`День 0`...`День 11`), month names (`августа`), page title, and content assertions are all hardcoded in Russian.
2. **This specific Budapest trip** — traveler names (`Роберт`, `Анна`, `Тамир`), budget amounts (`1 887 EUR`), POI counts per day, holiday names (`Иштвана`), 69 SUB_VENUE_POI entries, and 15 NOTABLE_POI entries are all embedded as constants.
3. **Russian HTML filename** — `trip_full_ru.html` and `trip_full_ru.md` hardcoded in config and test files.

**Impact:** If the system generates a trip in English, Hebrew, French, or any other language — or for a different destination — the majority of regression tests will fail not because of bugs, but because the tests themselves are language-bound. This violates the project's core principle that `trip_details.md` drives all language and content decisions.

**Irony:** The infrastructure for language-independent testing already exists. `language-config.ts` dynamically reads `trip_details.md` and supports 30+ languages with script detection. But only 2 of 14 spec files use it. The remaining 12 bypass it entirely.

**This was a design-level failure that should have been caught during architecture review.** Both SA and QA-A are expected to enforce separation of content and test logic. This BRD formalizes the fix as a full-cycle change requiring review from all stakeholders.

### Audit Summary

| Severity | File Count | Description |
|---|---|---|
| CRITICAL | 8 spec files + config + POM | Hardcoded Russian strings, Russian filenames, trip-specific constants |
| GOOD | 4 spec files + language-config.ts + shared-page.ts | Already language-independent (structural/layout tests) |
| N/A | 1 spec file (visual.spec.ts) | Screenshot tests are inherently content-bound — acceptable |

---

## 2. Scope

**In scope:**
- All automation test files (`automation/code/tests/regression/*.spec.ts`)
- Page Object Model (`automation/code/tests/pages/TripPage.ts`)
- Playwright config (`automation/code/playwright.config.ts`)
- Test utilities (`automation/code/tests/utils/language-config.ts` — extend)
- New test utility for trip-content config extraction

**Out of scope:**
- Trip generation logic (no changes to trip planning or content format rules)
- HTML rendering logic (no changes to rendering-config.md or templates)
- Visual regression snapshots (inherently language-bound; will be regenerated per-trip but not refactored)
- The `trip_details.md` format itself (already language-independent)

**Affected rule files:**
- `automation_rules.md` — add language-independence enforcement rule
- `development_rules.md` §4 — update test data sync rules to reference config utility instead of manual constants

---

## 3. Requirements

### REQ-001: Dynamic Trip Configuration Utility

**Description:** Create a `trip-config.ts` utility that extracts all trip-specific and language-specific values from `trip_details.md` and the generated trip output (markdown/HTML), providing a single source of truth for all test files.

**Acceptance Criteria:**
- [ ] AC-1: Utility reads `trip_details.md` to extract: reporting language, POI languages, destination, trip dates, traveler names, number of days
- [ ] AC-2: Utility derives language-dependent labels (day titles, month names, section names, page title pattern) from reporting language — not from hardcoded strings
- [ ] AC-3: Utility auto-discovers the latest trip folder (existing pattern) and extracts the correct HTML/markdown filename based on reporting language
- [ ] AC-4: Utility is the ONLY place where language-to-label mappings exist — no spec file may define its own language-specific constants
- [ ] AC-5: Adding a new reporting language requires updating ONLY the utility, not any spec file

**Priority:** Must-have

**Affected components:**
- `automation/code/tests/utils/trip-config.ts` (new)
- `automation/code/tests/utils/language-config.ts` (extend or merge)

---

### REQ-002: Eliminate Hardcoded Russian from Activity Label Tests

**Description:** Replace all Russian-specific constants in `activity-label-languages.spec.ts` with language-driven configuration.

**Acceptance Criteria:**
- [ ] AC-1: `GENERIC_PREFIXES` (44 Russian words) are replaced with a config-driven lookup keyed by reporting language, or derived dynamically from the HTML (e.g., by identifying `<span class="activity-label">` elements that are NOT `<a>` links)
- [ ] AC-2: `GENERIC_FULL_PATTERNS` are replaced with the same mechanism
- [ ] AC-3: Test passes for Russian, English, and Hebrew reporting languages without code changes
- [ ] AC-4: Zero Russian string literals remain in the spec file

**Priority:** Must-have

**Affected components:**
- `automation/code/tests/regression/activity-label-languages.spec.ts`

---

### REQ-003: Eliminate Hardcoded Russian from POI Parity Tests

**Description:** Replace Russian section names and filename in `poi-parity.spec.ts` with config-driven values.

**Acceptance Criteria:**
- [ ] AC-1: `EXCLUDED_SECTIONS` (`Логистика`, `Стоимость`, `Запасной план`, etc.) are derived from reporting language config
- [ ] AC-2: Markdown filename (`trip_full_ru.md`) is derived from reporting language
- [ ] AC-3: Day heading regex (`День`) is derived from reporting language
- [ ] AC-4: Test passes for Russian, English, and Hebrew without code changes

**Priority:** Must-have

**Affected components:**
- `automation/code/tests/regression/poi-parity.spec.ts`

---

### REQ-004: Eliminate Hardcoded Russian from Day Card Tests

**Description:** Replace Russian day titles and month names in `day-cards.spec.ts` with config-driven values.

**Acceptance Criteria:**
- [ ] AC-1: `DAY_TITLES` array (`День 0`...`День 11`) is generated from reporting language + day count
- [ ] AC-2: `DAY_DATES` array (`20 августа`...`31 августа`) is generated from trip dates + reporting language locale
- [ ] AC-3: `'Запасной план'` text selector is derived from reporting language config
- [ ] AC-4: Test passes for Russian, English, and Hebrew without code changes

**Priority:** Must-have

**Affected components:**
- `automation/code/tests/regression/day-cards.spec.ts`

---

### REQ-005: Eliminate Hardcoded Russian from Structure Tests

**Description:** Replace Russian page title, family names, and `lang` attribute assertion in `structure.spec.ts` with config-driven values.

**Acceptance Criteria:**
- [ ] AC-1: Page title assertion (`'Budapest 2026 — Семейный маршрут'`) is derived from destination + year + reporting language
- [ ] AC-2: Traveler name assertions (`'Роберт'`, `'Анна'`, etc.) are derived from `trip_details.md` traveler list
- [ ] AC-3: `lang="ru"` assertion is derived from reporting language config
- [ ] AC-4: Test passes for any destination, language, and traveler set without code changes

**Priority:** Must-have

**Affected components:**
- `automation/code/tests/regression/structure.spec.ts`

---

### REQ-006: Eliminate Hardcoded Russian from Overview & Budget Tests

**Description:** Replace Russian content assertions in `overview-budget.spec.ts` with config-driven or structural alternatives.

**Acceptance Criteria:**
- [ ] AC-1: Holiday advisory assertion (`'Иштвана'`) is replaced with a structural check (advisory exists and has content) or a config-driven holiday name lookup
- [ ] AC-2: `'закрыт'` assertion is replaced with structural presence check
- [ ] AC-3: Budget amount (`'1 887'`) is either derived from the source markdown or validated structurally (numeric content exists in budget table)
- [ ] AC-4: Date format assertions (`'20.08'`) are derived from trip dates

**Priority:** Must-have

**Affected components:**
- `automation/code/tests/regression/overview-budget.spec.ts`

---

### REQ-007: Eliminate Hardcoded Content from POI Card Tests

**Description:** Replace trip-specific POI exclusion lists in `poi-cards.spec.ts` with a dynamic mechanism.

**Acceptance Criteria:**
- [ ] AC-1: `SUB_VENUE_POIS` (69 entries) is either eliminated entirely by using a structural approach (e.g., CSS class or data attribute on sub-venue POIs) or derived from the source markdown
- [ ] AC-2: The test validates link presence without needing to know POI names in advance
- [ ] AC-3: If structural markers (CSS classes/data attributes) are needed in the HTML, document this as a dev requirement for the rendering pipeline

**Priority:** Must-have

**Affected components:**
- `automation/code/tests/regression/poi-cards.spec.ts`
- Potentially `rendering-config.md` (if new CSS classes/data attributes are needed)

---

### REQ-008: Eliminate Hardcoded Content from Progression Tests

**Description:** Replace trip-specific constants in `progression.spec.ts` with config-derived or structurally validated alternatives.

**Acceptance Criteria:**
- [ ] AC-1: `EXPECTED_POI_COUNTS` per-day map is derived from the source markdown (same mechanism as poi-parity)
- [ ] AC-2: `NOTABLE_POIS` list is either derived from source markdown or validated by checking POI card existence structurally
- [ ] AC-3: Russian content assertions (`'Иштван'`, `'Итого'`) are replaced with config-driven or structural checks
- [ ] AC-4: Budget amounts (`'1 887'`, `'749 100'`) are derived from source markdown

**Priority:** Must-have

**Affected components:**
- `automation/code/tests/regression/progression.spec.ts`

---

### REQ-009: Language-Independent Playwright Configuration

**Description:** Replace hardcoded Russian/Hebrew filenames in `playwright.config.ts` with config-driven resolution. Text direction (LTR/RTL) must be derived automatically from the reporting language's script — it is an inherent property of the language, not a trip preference.

**Acceptance Criteria:**
- [ ] AC-1: LTR/RTL HTML filename is derived from reporting language in `trip_details.md` (e.g., `trip_full_{lang}.html`)
- [ ] AC-2: Text direction (`ltr`/`rtl`) is derived from the language's script (e.g., Russian → `ltr`, Hebrew → `rtl`, Arabic → `rtl`) — not from `trip_details.md` or any separate configuration
- [ ] AC-3: The Playwright config auto-detects which project (desktop-chromium vs desktop-chromium-rtl) targets the main trip HTML based on direction
- [ ] AC-4: The secondary direction's HTML file is auto-discovered if present in the trip folder
- [ ] AC-5: No language code (`ru`, `he`) appears as a string literal in the config

**Priority:** Must-have

**Affected components:**
- `automation/code/playwright.config.ts`
- `automation/code/tests/utils/trip-config.ts` (direction field)

---

### REQ-010: Language-Independent Page Object Model

**Description:** Remove language-specific text selectors from `TripPage.ts`.

**Acceptance Criteria:**
- [ ] AC-1: `getDayLogistics()` method no longer uses `hasText: 'Логистика'` — uses CSS class or data attribute instead
- [ ] AC-2: No Russian (or any language) string literals remain in `TripPage.ts`
- [ ] AC-3: If new CSS classes or data attributes are needed, document as dev requirement for rendering pipeline

**Priority:** Must-have

**Affected components:**
- `automation/code/tests/pages/TripPage.ts`
- Potentially `rendering-config.md` (if new CSS classes are needed)

---

### REQ-011: Enforcement Rule in Automation Standards

**Description:** Add a permanent rule to `automation_rules.md` prohibiting hardcoded language or trip-specific content in test code.

**Acceptance Criteria:**
- [ ] AC-1: New section in `automation_rules.md` titled "Language Independence" that defines the rule
- [ ] AC-2: Rule states: "No spec file, page object, or fixture may contain hardcoded text in any natural language (Russian, English, Hebrew, etc.) for content assertions. All language-dependent values must come from `trip-config.ts` or `language-config.ts`."
- [ ] AC-3: Rule states: "No spec file may contain trip-specific constants (POI names, budget amounts, traveler names, day counts) as literals. These must be derived from `trip_details.md` or the generated markdown."
- [ ] AC-4: QA-A and SA are jointly responsible for enforcing this rule during Phase 3 and Phase 4 reviews

**Priority:** Must-have

**Affected components:**
- `automation_rules.md`

---

## 4. Dependencies & Risks

| Dependency / Risk | Mitigation |
|---|---|
| Some structural checks may require new CSS classes or data attributes in rendered HTML (REQ-007, REQ-010) | SA will evaluate in architecture review; rendering pipeline changes follow the same dev cycle |
| Generic action detection (REQ-002) may need a fundamentally different approach if we can't maintain per-language prefix lists | Design phase will evaluate DOM-based detection (element type) vs. config-based lookup |
| Progression tests (REQ-008) exist specifically to snapshot a known-good state — making them fully dynamic may reduce their regression value | Design phase will define which progression assertions remain trip-specific (with clear comments) vs. which become structural |
| `trip-config.ts` becomes a critical shared dependency — bugs there break all tests | Covered by unit tests for the utility itself; QA-A reviews during Phase 4 |
| Refactoring 10 spec files simultaneously is high-risk for introducing regressions | Implementation will be done file-by-file with regression run after each; no big-bang merge |

## 5. Acceptance Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| PM | | | |
| SA | | | Pending — architecture_review.md |
| QA-A | | | Pending — qa_architecture_review.md |
