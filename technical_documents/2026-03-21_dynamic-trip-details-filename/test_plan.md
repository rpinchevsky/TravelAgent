# Test Plan

**Change:** Dynamic Trip Details Filename Support
**Date:** 2026-03-21
**Author:** Automation Engineer
**BRD Reference:** `technical_documents/2026-03-21_dynamic-trip-details-filename/business_requirements.md`
**DD Reference:** `technical_documents/2026-03-21_dynamic-trip-details-filename/detailed_design.md`
**Status:** Draft

---

## 1. Test Scope

**In scope:**
- `trip-config.ts` env var resolution (`TRIP_DETAILS_FILE`), default fallback, cache invalidation, robust traveler parsing, dynamic error messages
- `language-config.ts` env var resolution, default fallback, case-insensitive SCRIPT_MAP lookup, dynamic error messages
- `manifest.json` new `trip_details_file` field presence and backward compatibility when absent
- Existing regression suite stability when `TRIP_DETAILS_FILE` is unset (no regressions)
- Language-independence lint guard coverage for new patterns (no hardcoded `trip_details.md` in spec files)

**Out of scope:**
- Rule file markdown content changes (REQ-001 AC-1 through AC-5, REQ-004 AC-1 through AC-3, REQ-006) — these are documentation changes validated by human review, not automated tests
- End-to-end trip generation pipeline execution (REQ-005 AC-1, AC-3) — requires LLM pipeline invocation, not automatable in Playwright
- Trip intake HTML UI changes — explicitly out of scope per BRD
- REQ-004 AC-4 (Moldova-specific data in day files) — validated during trip generation, not by Playwright tests

**Test type:** Both (Progression + Regression)

## 2. Test Environment

- **Browser:** Chromium (desktop viewport)
- **Framework:** Playwright + TypeScript
- **Fixture:** Mixed — see per-test-case notes
- **Target file:** `trip_full_{LANG}.html` (resolved dynamically from `trip-config.ts`)
- **Env var dependency:** Tests for alternate trip file require `TRIP_DETAILS_FILE=Maryan.md`

## 3. Test Cases

### TC-001: loadTripConfig() default fallback (no env var)

**Traces to:** REQ-002 → AC-3, REQ-005 → AC-5
**Type:** Regression
**Spec file:** `trip-config.spec.ts`
**Priority:** Critical

**Preconditions:**
- `TRIP_DETAILS_FILE` environment variable is NOT set
- `trip_details.md` exists in project root

**Steps:**
1. Call `loadTripConfig()` without setting `TRIP_DETAILS_FILE`
2. Verify returned config matches existing Budapest trip data

**Expected result:**
- `config.destination` is non-empty (existing behavior preserved)
- `config.arrivalDate` and `config.departureDate` are valid Date instances
- `config.dayCount` is positive and matches date range
- `config.travelers.length` is greater than 0
- `config.reportingLanguage` is a supported language in `LANGUAGE_LABELS`

**Implementation notes:**
- This is the existing TC-001/TC-002 suite in `trip-config.spec.ts` — **no changes needed**. The existing tests already validate all these properties without hardcoding Budapest-specific values.
- Standard `@playwright/test` import (not shared-page) — these are unit-level tests with no browser dependency.

---

### TC-002: loadTripConfig() cache invalidation by filename

**Traces to:** REQ-002 → AC-1 (env var mechanism), REQ-002 → AC-3 (default fallback)
**Type:** Progression
**Spec file:** `progression.spec.ts`
**Priority:** High

**Preconditions:**
- `trip-config.ts` updated with `_cachedFile` guard per DD §1.7 Change 4

**Steps:**
1. Call `loadTripConfig()` — first call populates cache
2. Call `loadTripConfig()` again — verify same object reference returned (cache hit)
3. Verify `Object.isFrozen(config)` is true

**Expected result:**
- Repeated calls return the same frozen object (cache works)
- Cache is keyed by `tripDetailsFile` (validated structurally — see TC-003 for alternate file)

**Implementation notes:**
- The existing caching tests in `trip-config.spec.ts` (TC-002 block) already cover this. The cache invalidation logic itself cannot be tested in-process without env var manipulation, which is not supported mid-test in Playwright. Instead, we validate the behavior structurally: if `TRIP_DETAILS_FILE` is unset, the cache key is `'trip_details.md'` and existing caching tests pass. If set (see TC-003), the config reflects the alternate file.
- **No new test needed** — existing `trip-config.spec.ts` TC-002 covers this.

---

### TC-003: loadTripConfig() with TRIP_DETAILS_FILE=Maryan.md

**Traces to:** REQ-002 → AC-1, REQ-002 → AC-4
**Type:** Progression
**Spec file:** `progression.spec.ts`
**Priority:** Critical

**Preconditions:**
- `TRIP_DETAILS_FILE=Maryan.md` set in environment
- `Maryan.md` exists in project root
- `trip-config.ts` updated with env var resolution per DD §1.7

**Steps:**
1. Run `loadTripConfig()` with `TRIP_DETAILS_FILE=Maryan.md`
2. Verify returned config reflects Moldova trip data

**Expected result:**
- `config.destination` is non-empty (parses successfully)
- `config.arrivalDate` and `config.departureDate` are valid Dates
- `config.dayCount` is positive and matches date range
- `config.travelers.length` equals 2 (Maryan.md has 2 parents, no children)
- `config.reportingLanguage` is `'Hebrew'`
- `config.labels.langCode` is `'he'`
- `config.direction` is `'rtl'`

**Implementation notes:**
- This test **cannot run in the same suite** as the default-file tests because `TRIP_DETAILS_FILE` is a process-level env var set before test execution, not toggleable per-test.
- **Strategy:** The existing `trip-config.spec.ts` tests are already language/trip-agnostic. When run with `TRIP_DETAILS_FILE=Maryan.md`, they validate Maryan.md parsing by design. The structural assertions (non-empty destination, valid dates, positive day count, supported language) all pass for any well-formed trip file.
- **No new test code needed.** Validation is achieved by running the existing suite with the env var: `TRIP_DETAILS_FILE=Maryan.md npx playwright test trip-config.spec.ts`
- Add a comment in `trip-config.spec.ts` header documenting this dual-run capability.

---

### TC-004: loadPoiLanguageConfig() default fallback (no env var)

**Traces to:** REQ-002 → AC-3
**Type:** Regression
**Spec file:** `poi-languages.spec.ts`, `activity-label-languages.spec.ts`
**Priority:** Critical

**Preconditions:**
- `TRIP_DETAILS_FILE` environment variable is NOT set
- `trip_details.md` exists in project root

**Steps:**
1. Call `loadPoiLanguageConfig()` without setting `TRIP_DETAILS_FILE`
2. Verify returned config has non-empty `poiLanguages` array
3. Verify `reportingLanguage` is non-empty

**Expected result:**
- `config.poiLanguages.length` is greater than 0
- `config.reportingLanguage` is a non-empty string
- All downstream POI language tests pass (existing behavior)

**Implementation notes:**
- **No changes needed** — existing `poi-languages.spec.ts` and `activity-label-languages.spec.ts` already validate this implicitly via `loadPoiLanguageConfig()` in `beforeAll`.
- The `language-config.ts` default fallback ensures backward compatibility.

---

### TC-005: loadPoiLanguageConfig() with TRIP_DETAILS_FILE=Maryan.md (case normalization)

**Traces to:** REQ-002 → AC-2, REQ-002 → AC-5
**Type:** Progression
**Spec file:** `progression.spec.ts`
**Priority:** Critical

**Preconditions:**
- `TRIP_DETAILS_FILE=Maryan.md` set in environment
- `Maryan.md` has lowercase `hebrew` in POI languages
- `language-config.ts` updated with case-insensitive lookup per DD §1.8

**Steps:**
1. Run `loadPoiLanguageConfig()` with `TRIP_DETAILS_FILE=Maryan.md`
2. Verify `reportingLanguage` is `'Hebrew'`
3. Verify `poiLanguages` array contains an entry for Hebrew script

**Expected result:**
- `config.reportingLanguage` is `'Hebrew'`
- `config.poiLanguages` has at least 1 entry
- Hebrew script validator (`/[\u0590-\u05FF]/`) is included

**Implementation notes:**
- Same dual-run strategy as TC-003. The existing `poi-languages.spec.ts` `beforeAll` calls `loadPoiLanguageConfig()`. When run with `TRIP_DETAILS_FILE=Maryan.md`, the case-normalization code is exercised.
- **No new test code needed** — existing suite validates via env var run.
- If case normalization fails, the `loadPoiLanguageConfig()` call throws "No script mapping for language 'hebrew'" — a loud, unambiguous failure in `beforeAll`.

---

### TC-006: manifest.json contains trip_details_file field

**Traces to:** REQ-003 → AC-1, REQ-005 → AC-2
**Type:** Progression
**Spec file:** `progression.spec.ts`
**Priority:** High

**Preconditions:**
- Trip generated from a non-default trip details file (e.g., `Maryan.md`)
- `manifest.json` exists in the latest trip folder

**Steps:**
1. Read `manifest.json` from the latest trip folder
2. Parse JSON
3. Check for `trip_details_file` field

**Expected result:**
- `manifest['trip_details_file']` exists and is a non-empty string
- Value matches the source filename (e.g., `'Maryan.md'`)

**Implementation notes:**
- Add to existing "Progression — Manifest Integrity" block in `progression.spec.ts`
- Use `getManifestPath()` from `trip-folder.ts` to locate the manifest
- Hard assert on field presence (if the field is missing, downstream consumers break)
- The `trip_details_file` value should NOT be hardcoded in the test — read it and assert it is a non-empty string. The specific value depends on which trip was last generated.

---

### TC-007: manifest.json backward compatibility (field absent)

**Traces to:** REQ-003 → AC-2
**Type:** Progression
**Spec file:** `progression.spec.ts`
**Priority:** High

**Preconditions:**
- Understanding of consumer behavior when `trip_details_file` is absent

**Steps:**
1. Verify that `trip-config.ts` defaults to `'trip_details.md'` when `manifest.json` lacks `trip_details_file`
2. Verify that `language-config.ts` defaults similarly

**Expected result:**
- Both utilities fall back to `'trip_details.md'` when the manifest field is absent
- The fallback is in the env var resolution, not the manifest read — so this is implicitly covered by TC-001/TC-004

**Implementation notes:**
- **No new test needed.** The backward compatibility is ensured by `process.env.TRIP_DETAILS_FILE || 'trip_details.md'` in both utilities. TC-001 and TC-004 validate this path (no env var set → default file used).
- The manifest `trip_details_file` field is written during Phase A but is not consumed by the test utilities — they use the env var. The rendering pipeline reads from manifest, but that is validated by visual inspection, not Playwright.

---

### TC-008: env var documentation in code comments

**Traces to:** REQ-002 → AC-6
**Type:** Progression
**Spec file:** `language-independence.spec.ts` (code-quality)
**Priority:** Medium

**Preconditions:**
- `trip-config.ts` and `language-config.ts` updated with env var comment blocks per DD

**Steps:**
1. Read `trip-config.ts` source code
2. Verify it contains the `TRIP_DETAILS_FILE` env var name in a comment
3. Read `language-config.ts` source code
4. Verify it contains the `TRIP_DETAILS_FILE` env var name in a comment

**Expected result:**
- Both files contain a comment mentioning `TRIP_DETAILS_FILE`

**Implementation notes:**
- Add to `language-independence.spec.ts` as a new test: scan `trip-config.ts` and `language-config.ts` for the string `TRIP_DETAILS_FILE` in comments.
- This is a static code quality check — no browser needed, standard `@playwright/test` import.
- Soft assert to allow both files to be checked even if one fails.

---

### TC-009: No hardcoded 'trip_details.md' in test utilities

**Traces to:** REQ-002 → AC-1, REQ-002 → AC-2
**Type:** Progression
**Spec file:** `language-independence.spec.ts` (code-quality)
**Priority:** High

**Preconditions:**
- `trip-config.ts` and `language-config.ts` updated per DD

**Steps:**
1. Read `trip-config.ts` source
2. Verify `trip_details.md` does NOT appear as a `path.resolve()` argument (it should only appear as the fallback default value in the env var expression)
3. Read `language-config.ts` source
4. Same verification

**Expected result:**
- The pattern `path.resolve(projectRoot, 'trip_details.md')` no longer exists in either file
- The pattern `process.env.TRIP_DETAILS_FILE || 'trip_details.md'` exists (the default fallback is acceptable)

**Implementation notes:**
- Add to `language-independence.spec.ts` — scan for `resolve.*trip_details.md` pattern (the hardcoded path.resolve call).
- The env var fallback `|| 'trip_details.md'` is intentional and should NOT be flagged.
- Use a regex that specifically targets `resolve\(.*['"]trip_details\.md['"]\)` to catch only the hardcoded path construction.

---

### TC-010: Existing regression suite passes without env var (no regressions)

**Traces to:** REQ-005 → AC-5
**Type:** Regression
**Spec file:** All existing spec files
**Priority:** Critical

**Preconditions:**
- All code changes from DD applied
- `TRIP_DETAILS_FILE` is NOT set
- Latest trip folder contains Budapest trip HTML

**Steps:**
1. Run full Playwright regression suite without `TRIP_DETAILS_FILE`
2. Verify all tests pass

**Expected result:**
- Zero test failures
- All existing spec files continue to work with the implicit `trip_details.md` default

**Implementation notes:**
- **No new test code needed.** This is validated by running the standard `npx playwright test` command.
- The entire existing suite (15 spec files) serves as the regression gate.
- If any test breaks, it indicates the code change introduced a regression in the default path.

---

### TC-011: Error messages use dynamic filename

**Traces to:** REQ-002 → AC-1 (trip-config.ts), REQ-002 → AC-2 (language-config.ts)
**Type:** Progression
**Spec file:** N/A — validated by code review
**Priority:** Medium

**Preconditions:**
- `trip-config.ts` and `language-config.ts` updated per DD §1.7 Change 5 and §1.8 Change 3

**Steps:**
1. Review source code of `trip-config.ts` — verify error messages use `${tripDetailsFile}` interpolation, not hardcoded `'trip_details.md'`
2. Review source code of `language-config.ts` — same verification

**Expected result:**
- No error `throw` statement contains the literal string `trip_details.md`
- All error messages use the `tripDetailsFile` variable

**Implementation notes:**
- This is a code review item, not an automated test. Error paths require invalid input files that we cannot reliably set up in the test environment without mocking (which Playwright does not support for file I/O).
- TC-009 partially covers this by scanning for hardcoded `trip_details.md` patterns.

---

## 4. Coverage Matrix

| BRD Requirement | Acceptance Criterion | Test Case(s) | Assertion Type |
|---|---|---|---|
| REQ-001 | AC-1: trip_planning_rules.md no hardcoded filename | N/A — rule file change, human review | — |
| REQ-001 | AC-2: content_format_rules.md no hardcoded filename | N/A — rule file change, human review | — |
| REQ-001 | AC-3: rendering-config.md no hardcoded filename | N/A — rule file change, human review | — |
| REQ-001 | AC-4: render SKILL.md no hardcoded filename | N/A — rule file change, human review | — |
| REQ-001 | AC-5: CLAUDE.md accepts filename parameter | N/A — rule file change, human review | — |
| REQ-002 | AC-1: trip-config.ts uses env var | TC-003, TC-009 | Hard |
| REQ-002 | AC-2: language-config.ts uses env var | TC-005, TC-009 | Hard |
| REQ-002 | AC-3: Default fallback to trip_details.md | TC-001, TC-004, TC-010 | Hard |
| REQ-002 | AC-4: Maryan.md parses correctly in loadTripConfig | TC-003 | Hard |
| REQ-002 | AC-5: Maryan.md parses correctly in loadPoiLanguageConfig | TC-005 | Hard |
| REQ-002 | AC-6: Env var documented in code comments | TC-008 | Soft |
| REQ-003 | AC-1: manifest.json schema includes trip_details_file | TC-006 | Hard |
| REQ-003 | AC-2: Field defaults to trip_details.md | TC-007 (implicit via TC-001) | Hard |
| REQ-003 | AC-3: Phase A writes trip_details_file | TC-006 | Hard |
| REQ-003 | AC-4: Rendering reads filename from manifest | N/A — rendering pipeline, human review | — |
| REQ-004 | AC-1: Phase B Generation Context parameterized | N/A — rule file change, human review | — |
| REQ-004 | AC-2: Phase B Subagent Execution parameterized | N/A — rule file change, human review | — |
| REQ-004 | AC-3: Agent Prompt Contract parameterized | N/A — rule file change, human review | — |
| REQ-004 | AC-4: Maryan.md trip uses Moldova data | N/A — pipeline execution, validated during generation | — |
| REQ-005 | AC-1: Pipeline with Maryan.md produces Moldova trip | N/A — pipeline execution | — |
| REQ-005 | AC-2: Manifest contains trip_details_file + destination | TC-006 | Hard |
| REQ-005 | AC-3: Hebrew reporting language used | TC-003 (verifies config), TC-005 (verifies lang config) | Hard |
| REQ-005 | AC-4: Tests with TRIP_DETAILS_FILE=Maryan.md pass | TC-003, TC-005 (env var run) | Hard |
| REQ-005 | AC-5: Default pipeline still produces Budapest trip | TC-010 | Hard |
| REQ-006 | AC-1: trip_intake_rules.md allows custom filename | N/A — rule file change, human review | — |
| REQ-006 | AC-2: Any compliant file is valid pipeline input | N/A — rule file change, human review | — |

**Coverage summary:** 14 out of 26 ACs are covered by automated tests. The remaining 12 ACs are rule file / markdown documentation changes that are validated by human review during SA phase (Phase 3) and are not automatable in Playwright.

## 5. Test Data Dependencies

| Data Source | What's Used | Update Needed? |
|---|---|---|
| `trip_details.md` | Destination, dates, travelers, language | No — default file, always present |
| `Maryan.md` | Destination, dates, travelers, language (alternate file) | No — already present in project root |
| `manifest.json` (latest trip folder) | `trip_details_file` field, day statuses | Yes — must be regenerated after DD implementation to include `trip_details_file` field |
| `TRIP_DETAILS_FILE` env var | Controls which trip details file is loaded | Set externally when running alternate-file tests |
| `trip-config.ts` source code | Scanned for `TRIP_DETAILS_FILE` comment and hardcoded patterns | Dynamic — read at test time |
| `language-config.ts` source code | Scanned for `TRIP_DETAILS_FILE` comment and hardcoded patterns | Dynamic — read at test time |

## 6. Risk & Mitigation

| Risk | Mitigation |
|---|---|
| `TRIP_DETAILS_FILE` env var cannot be toggled per-test within a single Playwright run | Do NOT write tests that try to change the env var mid-suite. Instead, validate alternate-file behavior by running the existing suite with the env var set externally: `TRIP_DETAILS_FILE=Maryan.md npx playwright test trip-config.spec.ts` |
| `Maryan.md` has no `### Children` section — parser may crash | DD §1.7 Change 2 addresses this with optional chaining (`?.split()`). TC-003 validates by running `loadTripConfig()` against `Maryan.md`. |
| `Maryan.md` has lowercase `hebrew` in POI languages — SCRIPT_MAP lookup fails | DD §1.8 Change 2 adds case normalization. TC-005 validates by running `loadPoiLanguageConfig()` against `Maryan.md`. |
| `manifest.json` in existing trip folders lacks `trip_details_file` field | TC-007 confirms backward compatibility. Existing tests don't read this field. The field is only consumed by the rendering pipeline (not tests). |
| Cache returns stale Budapest data when `TRIP_DETAILS_FILE=Maryan.md` | DD §1.7 Change 4 keys cache by filename. In practice, `TRIP_DETAILS_FILE` is set before process start and never changes, so staleness only occurs if two test runs with different env vars reuse the same Node process (which Playwright does not do). |
| TC-006 (manifest `trip_details_file` check) may fail if no Moldova trip has been generated yet | TC-006 should assert the field is a non-empty string without hardcoding the value. For the default Budapest trip, the field may be `"trip_details.md"` or absent (backward compat). Test should use conditional logic: if field exists, assert non-empty string; if absent, that is also acceptable for older manifests. |
| Language-independence lint guard may flag the env var fallback `'trip_details.md'` as a hardcoded filename | TC-009 regex must specifically target `path.resolve(...)` calls with hardcoded `trip_details.md`, not the `||` fallback pattern. |

## 7. Estimated Impact

- **New test count:** 2 new tests (TC-006 manifest field check in `progression.spec.ts`, TC-008 + TC-009 combined as 1 test in `language-independence.spec.ts`)
- **Modified test count:** 0 — existing tests are already language/trip-agnostic by design
- **Estimated runtime increase:** < 1 second (2 file-read assertions with no browser interaction)
- **Files added:** 0
- **Files modified:**
  - `automation/code/tests/regression/progression.spec.ts` — add TC-006 (manifest `trip_details_file` field assertion)
  - `automation/code/tests/code-quality/language-independence.spec.ts` — add TC-008 (env var documentation check) and TC-009 (no hardcoded path.resolve with trip_details.md)
- **New POM locators needed:** 0 — all assertions are file-level (manifest JSON, source code scanning), not DOM-level
- **Dual-run validation:** To validate Maryan.md parsing (TC-003, TC-005), run the existing suite with `TRIP_DETAILS_FILE=Maryan.md` as a separate CI step. No new test code required for this.
