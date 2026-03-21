# QA Architecture Review

**Change:** Parallelize Overview and Budget Fragment Generation with Day Batches
**Date:** 2026-03-21
**Reviewer:** QA Architect
**Documents Reviewed:**
- `technical_documents/2026-03-21_parallel-shell-fragments/business_requirements.md`
- `technical_documents/2026-03-21_parallel-shell-fragments/test_plan.md`
- `automation/code/automation_rules.md`
- `automation/code/tests/pages/TripPage.ts`
- `automation/code/tests/regression/overview-budget.spec.ts` (existing spec)
- `automation/code/tests/regression/progression.spec.ts` (existing spec)
- `automation/code/tests/regression/structure.spec.ts` (existing spec)
- `automation/code/tests/utils/trip-config.ts`
- `automation/code/tests/utils/trip-folder.ts`

**Verdict:** Approved with Changes

---

## 1. Review Summary

The test plan is well-scoped, correctly identifies which ACs are testable through rendered output versus internal pipeline behavior, and shows strong automation standards awareness. The author has correctly read existing spec coverage to avoid duplicating tests, used the right fixture (shared-page for all DOM tests, standalone `fs` check for TC-008), and referenced POM locators accurately.

Three concerns are raised. Two are blocking: a count inconsistency in Section 7 that creates an implementation ambiguity, and a fixture import strategy for TC-008 that could create test infrastructure conflicts. One is a recommendation about duplicate coverage for TC-001, TC-002, TC-003, and TC-006 that should be clarified to avoid unnecessary maintenance overhead.

Overall output-observable AC coverage is complete. The test plan correctly marks the untestable ACs (internal pipeline execution order, rule-file text) as N/A with sound justification grounded in the BRD's own Out of Scope section.

---

## 2. QA Architecture Checklist

| Principle | Status | Notes |
|---|---|---|
| Full BRD coverage | Pass | All output-observable ACs are covered. Non-observable ACs (pipeline execution order, rule-file text content) are correctly marked N/A with justification. No coverage gap for testable requirements. |
| No duplicate tests | Conditional Pass | TC-001, TC-002, TC-003, TC-006, TC-007 are described as "already covered" by existing specs, with explicit notes saying "No code change required." The plan is coherent — these act as existing regression guards, not new tests — but Section 7's new test count is inconsistent (see QF-1). |
| Correct fixture usage | Conditional Pass | Shared-page fixture is correct for TC-001 through TC-007. TC-008 correctly avoids the shared-page fixture. However, the aliased import strategy described in the TC-008 risk item (`fsTest`, `fsExpect`) is non-standard and potentially conflict-prone (see QF-2). |
| POM compliance | Pass | All DOM locators reference `TripPage.ts` properties (`overviewSection`, `budgetSection`, `overviewTable`, `overviewTableRows`, `daySections`). No inline selectors in new tests. The `getDaySection(n)` method provides the per-day locator needed by TC-005. Fragment filename construction in TC-008 is not a DOM locator — POM compliance does not apply. |
| Assertion best practices | Pass | TC-004, TC-005, TC-008 specify `expect.soft()` with descriptive messages. TC-005 implementation note correctly uses `page.evaluate()` returning a computed boolean rather than a raw bitmask. Existing tests (TC-001 through TC-003, TC-006, TC-007) already use appropriate assertion hardness. |
| Performance impact | Pass | Estimated runtime increase is sub-1 second. TC-005 uses `page.evaluate()` with no extra navigation. TC-008 uses synchronous `fs.existsSync()`. No additional page loads. Consistent with automation rule §6. |
| Reliability | Pass | No hard sleeps. TC-005 uses `compareDocumentPosition()` via `page.evaluate()` — deterministic for a static HTML page. TC-008 uses synchronous filesystem check on a file written before the test suite starts. No race conditions identified. |

---

## 3. Coverage Analysis

| BRD Requirement | Acceptance Criterion | Covered by Test Case | Gap? |
|---|---|---|---|
| REQ-001 | AC-1: Step 2a lists only PAGE_TITLE, NAV_LINKS, NAV_PILLS | TC-001, TC-002 (HTML output confirms overview/budget were generated, proving pipeline completed; shell fragments' correctness already in `navigation.spec.ts`) | None — correctly treated as output-observable proxy |
| REQ-001 | AC-2: Step 2a heading no longer references Overview/Budget | Not testable via HTML output | N/A — justified |
| REQ-001 | AC-3: SKILL.md Step 2a matches shell-only | Not testable via HTML output | N/A — justified |
| REQ-002 | AC-1: Step 2c spawns all subagents in one response block | Not observable in HTML | N/A — justified; BRD explicitly out of scope |
| REQ-002 | AC-2: Overview subagent defined with correct input/output | TC-001, TC-003, TC-005 | None |
| REQ-002 | AC-3: Budget subagent defined with correct input/output | TC-002, TC-004, TC-005 | None |
| REQ-002 | AC-4: No inter-subagent dependencies within block | Not observable in HTML | N/A — justified |
| REQ-002 | AC-5: SKILL.md references overview/budget in Step 2c | Not testable via HTML output | N/A — justified |
| REQ-003 | AC-1: Step 2.5 defines overview subagent context | TC-001, TC-003, TC-006 (content verifies context was correctly supplied) | None |
| REQ-003 | AC-2: Step 2.5 defines budget subagent context | TC-002, TC-004, TC-007 (content verifies context was correctly supplied) | None |
| REQ-003 | AC-3: Overview/budget subagents must not modify others | TC-003, TC-004 (isolation: not nested in day-cards; existing day structure checks confirm day cards unaffected) | None |
| REQ-003 | AC-4: Gate statement updated | Not testable via HTML output | N/A — justified |
| REQ-004 | AC-1: Step 2d lists overview and budget fragments as required | TC-008 (fragment files exist on disk after render) | None |
| REQ-004 | AC-2: Missing overview → retry overview only | Not testable via Playwright (pipeline retry behavior) | N/A — justified |
| REQ-004 | AC-3: Missing budget → retry budget only | Not testable via Playwright (pipeline retry behavior) | N/A — justified |
| REQ-004 | AC-4: All fragments present before assembly proceeds | TC-008 (both files present proves verification gating succeeded) | None |
| REQ-005 | AC-1: Step 3 assembles from fragment files | TC-001, TC-002, TC-005, TC-008 | None |
| REQ-005 | AC-2: Step 3 no longer uses inline/embedded content | TC-008 (fragment files on disk = file-based assembly path used) | None |
| REQ-005 | AC-3: Concatenation order unchanged (overview → days → budget) | TC-005 | None |
| REQ-006 | AC-1: Incremental section has no overview/budget subagent refs | Not testable via HTML output | N/A — justified |
| REQ-006 | AC-2: Incremental exception note states full-generation-only | Not testable via HTML output | N/A — justified |
| REQ-006 | AC-3: No change to "full rebuild" criteria | Not testable via HTML output | N/A — justified |

**Coverage summary:** 9 of 22 ACs are output-observable and fully covered. 13 ACs are correctly classified as N/A (internal pipeline execution order, rule-file text). No testable AC is left uncovered.

---

## 4. Feedback Items

### QF-1: New Test Count in Section 7 Is Inconsistent

**Severity:** Blocking
**Section:** Section 7 (Estimated Impact)
**Issue:** Section 7 states "New test count: 2 new tests (TC-004: budget not nested in day-card; TC-005: assembly order; TC-008: fragment files on disk)" but enumerates three items (TC-004, TC-005, TC-008). This is a direct contradiction: the count says 2, the parenthetical lists 3. This ambiguity will cause the implementing AE to make an incorrect judgment about which tests to write. If the intent is that TC-004 is only a new assertion (not a new `test()` block), then the count and the parenthetical are reconcilable — but the plan must state this explicitly to avoid implementation error.

Additionally, Section 7 says "New assertions added to existing tests: 1 soft assertion (TC-004)" while TC-004 is also listed in the new test count parenthetical. The plan must clearly distinguish: is TC-004 a new `test()` block or a new `expect.soft()` call appended inside an existing test block?

**Suggestion:** Revise Section 7 to explicitly state:
- TC-004: new `expect.soft()` assertion added to existing "Budget Section" `test('should have budget section visible')` block — not a new `test()` call.
- TC-005: new `test()` block in new "Assembly Order" `test.describe` — counts as 1 new test.
- TC-008: new `test()` block in new "Fragment File Existence" `test.describe` — counts as 1 new test.
- Total new `test()` blocks: 2. Total new assertions: 3 (TC-004 soft assertion + TC-005 two soft assertions + TC-008 two soft assertions).

---

### QF-2: TC-008 Fixture Import Strategy Is Ambiguous and Risk-Prone

**Severity:** Blocking
**Section:** TC-008 implementation notes and Section 6 (Risk & Mitigation)
**Issue:** The test plan proposes two alternative strategies for TC-008's `test` import in the same spec file that also uses the shared-page fixture: (a) use `import { test as fsTest, expect as fsExpect } from '@playwright/test'` aliased import, or (b) use a top-level `test()` call without a fixture parameter. Both strategies carry real risk:

- Strategy (a): Mixing two `test` imports in one file (`shared-page.ts` and `@playwright/test`) is non-standard. Playwright processes `test.describe` blocks at load time and two different `test` functions in the same file can cause worker-level fixture resolution conflicts or produce confusing test IDs.
- Strategy (b): A `test()` call at top-level (outside `test.describe`) is valid but the plan does not specify which `test` import to use for it, leaving ambiguity.

The risk mitigation section acknowledges this concern but does not resolve it — it lists both options with "or" without recommending one.

Automation rule §6.2 specifies: "Import `test` and `expect` from `tests/fixtures/shared-page.ts` for tests that only read DOM state." TC-008 does not read DOM state, so the shared-page fixture is inappropriate. However, Playwright allows `test.describe` blocks using the base `test` import from `@playwright/test` to coexist in a file that also imports from a custom fixture — the key requirement is that the base `test` is used for the non-fixture describe block, and they must not be mixed in the same describe block.

**Suggestion:** Resolve the ambiguity by prescribing exactly one strategy: TC-008 must be placed in its own `test.describe('Fragment File Existence', () => { ... })` block using the standard `test` import from `@playwright/test`, aliased as a distinct import name (e.g., `import { test as baseTest, expect as baseExpect } from '@playwright/test'`). The spec file's top-level `test` and `expect` imports remain from `shared-page.ts` for the DOM test blocks. This is a well-established Playwright pattern and avoids fixture resolution ambiguity. The plan must specify this exact import pattern — not leave it as an option.

---

### QF-3: TC-003 Nesting Check Steps Are Redundant

**Severity:** Recommendation
**Section:** TC-003 (Steps)
**Issue:** TC-003 lists four steps: (1) locate `#overview .day-card`, (2) assert count is 0, (3) locate `.day-card #overview` or `#overview` whose ancestor is `.day-card`, (4) assert `#overview` ancestor chain does not include `.day-card`. Steps 1–2 and steps 3–4 assert the same structural invariant from two directions. A CSS selector like `#overview .day-card` (overview containing day-card) and `.day-card #overview` (day-card containing overview) are both nesting-detection patterns, but a correct HTML structure would fail either one if nesting occurs — there is no scenario where one passes and the other fails for a valid document. Running both doubles the assertion count without adding coverage.

Furthermore, step 3 as written (`".day-card #overview" or "#overview whose ancestor is .day-card"`) conflates two different selector patterns into one step description, creating ambiguity in implementation.

**Suggestion:** Simplify TC-003 to two steps: (1) locate `#overview .day-card`, (2) assert count is 0. This is the pattern already used by `progression.spec.ts` → "overview should be standalone with itinerary-table" and is sufficient to confirm the isolation requirement. If a richer structural check is desired, add a single `page.evaluate()` that checks `document.querySelector('#overview')?.closest('.day-card') === null`, but not both patterns.

---

## 5. Best Practice Recommendations

**TC-005 evaluate() return type:** The implementation note correctly proposes computing and returning a boolean from within `page.evaluate()` rather than the raw `compareDocumentPosition()` bitmask. Confirm that the evaluate callback returns separate named properties (e.g., `{ overviewBeforeDay0: boolean, budgetAfterLastDay: boolean }`) rather than a single compound boolean, so that each `expect.soft()` call can produce a distinct failure message pointing to which ordering failed.

**TC-008 path construction:** The plan correctly uses `getManifestPath()` from `trip-folder.ts` to derive the trip folder path, and `tripConfig.labels.langCode` for the language suffix. Verify that the path construction uses `path.join(tripFolderPath, 'fragment_overview_' + langCode + '.html')` rather than string concatenation with hardcoded separators, to remain platform-agnostic per automation rule §7.2.

**Overview table "arrival row" test in overview-budget.spec.ts:** `overview-budget.spec.ts` line 26 uses `.toContainText(dates[0])` to find the arrival date by text. This is a date-string check, not a language-string check, and is compatible with automation rule §7.1 (date format is trip-config-derived). No action needed — noted for awareness that this existing test also exercises TC-006's coverage path.

**Spec file organization:** Adding three new blocks (TC-004 assertion, TC-005 describe, TC-008 describe) to `overview-budget.spec.ts` is the correct call — all concern overview/budget structural integrity. Keep `test.describe` labels consistent with the existing naming style (title-case nouns, e.g., "Assembly Order", "Fragment File Existence") to maintain readability uniformity across the file.

---

## 6. Sign-off

| Role | Date | Verdict |
|---|---|---|
| QA Architect | 2026-03-21 | Approved with Changes |

**Conditions for approval:**
- [x] QF-1 resolved: Section 7 explicitly clarifies that TC-004 is a new `expect.soft()` assertion within an existing test block (not a new `test()` call), and the new test count is corrected to 2 (TC-005 and TC-008).
- [x] QF-2 resolved: TC-008 import strategy is resolved to a single prescribed pattern — `import { test as baseTest, expect as baseExpect } from '@playwright/test'` used exclusively within the "Fragment File Existence" `test.describe` block, with the shared-page fixture imports unchanged for all DOM test blocks.

---

## 7. Re-Review (v2)

**Re-Review Date:** 2026-03-21
**Reviewer:** QA Architect
**Test Plan Version:** Revised v2 — addresses QF-1, QF-2, QF-3

---

### 7.1 Blocking Item Resolution

**QF-1 — New Test Count Inconsistency:** Resolved.

Section 7 (Estimated Impact) now explicitly delineates between new `test()` blocks and new assertions appended to existing test blocks:
- TC-004: described as "a single `expect.soft()` call appended inside the existing `test('should have budget section visible')` block — not a new `test()` call." This is consistent with the TC-004 step description (line: "This is **not** a new `test()` block").
- TC-005 and TC-008: each correctly designated as one new `test()` block.
- Total new `test()` blocks: 2. This matches the enumeration. No count ambiguity remains.
- Total new assertions (5 soft): 1 (TC-004) + 2 (TC-005) + 2 (TC-008) — calculation is now explicit and internally consistent.

QF-1 is fully resolved. No residual ambiguity.

**QF-2 — TC-008 Import Strategy Ambiguity:** Resolved.

TC-008 implementation notes now prescribe exactly one strategy with no "or" alternative: `import { test as baseTest, expect as baseExpect } from '@playwright/test'`, used exclusively within the "Fragment File Existence" `test.describe` block. The notes state explicitly: "this is the **only** prescribed import strategy. No alternative import approach is permitted." The risk mitigation row for TC-008 (Section 6) also removes the prior dual-option presentation and prescribes the same single pattern unambiguously. The coexistence rationale is sound: a `test.describe` using `baseTest`/`baseExpect` from `@playwright/test` alongside describe blocks using the shared-page fixture import is a well-established Playwright pattern, and the plan correctly scopes each import to its respective describe block only.

QF-2 is fully resolved. No residual ambiguity.

---

### 7.2 QF-3 Recommendation — Disposition

QF-3 (TC-003 redundant nesting assertion steps) was a recommendation, not blocking. The revised plan does not address it — TC-003 retains two steps: (1) locate `#overview .day-card`, (2) assert count is 0. This is actually the simplified form recommended in QF-3: two steps, `#overview .day-card` selector, count-is-0 assertion. The redundant steps 3 and 4 from the original plan (`.day-card #overview` ancestor check) are absent in the revised plan. The plan now matches the recommendation.

QF-3 recommendation has been satisfied by the revised plan.

---

### 7.3 Full QA Architecture Checklist Re-evaluation

| Principle | Status | Notes |
|---|---|---|
| Full BRD coverage | Pass | Unchanged from v1 review. All output-observable ACs covered. Non-observable ACs correctly marked N/A with BRD-grounded justification. 9 of 22 ACs testable; all 9 covered. |
| No duplicate tests | Pass | TC-001, TC-002, TC-003, TC-006, TC-007 explicitly identified as existing regression guards with no new code. TC-004 is a new assertion appended to an existing test block — not a new test — which is the correct deduplication pattern for additive assertions. TC-005 and TC-008 are genuinely new test blocks covering previously unasserted behaviors (assembly order, fragment file existence). |
| Correct fixture usage | Pass | QF-2 resolved. TC-001 through TC-007 use shared-page fixture per automation rule §6.2. TC-008 uses `baseTest`/`baseExpect` from `@playwright/test` in an isolated describe block with no shared-page fixture — correct for a non-DOM filesystem check. No fixture mixing within any single describe block. |
| POM compliance | Pass | Unchanged from v1 review. All DOM locators use `TripPage.ts` properties. TC-008 is a filesystem check — no DOM locators apply. No inline CSS selectors introduced in new tests. |
| Assertion best practices | Pass | TC-004, TC-005, and TC-008 all use `expect.soft()` with descriptive messages. TC-005 correctly returns a named-property object from `page.evaluate()` rather than a raw bitmask. Each soft assertion message is independently actionable. |
| Performance impact | Pass | Estimated runtime increase under 1 second. No additional page loads. TC-005 uses `page.evaluate()` (sub-10ms). TC-008 uses synchronous `fs.existsSync()` (sub-1ms). All DOM tests share existing shared-page fixture load. |
| Reliability | Pass | No hard sleeps. TC-005 uses `compareDocumentPosition()` — deterministic on a static pre-loaded HTML page. TC-008 uses synchronous filesystem check on files guaranteed to exist before test suite starts (pipeline pre-condition). No race conditions. |
| Language independence (automation rule §7.1) | Pass | TC-008 fragment filename construction uses `tripConfig.labels.langCode` as the language suffix — no hardcoded language strings. TC-005 uses numeric day indices via `tripConfig.dayCount - 1`. No natural language text in any new assertion. |
| Trip independence (automation rule §7.2) | Pass | TC-008 derives trip folder path from `getManifestPath()`, not a hardcoded path. Day indices derived from `tripConfig.dayCount`. Path construction uses `path.join()` — platform-agnostic per §7.2. No hardcoded trip-specific constants. |

All 9 checklist items pass. No conditional passes remain.

---

### 7.4 Residual Concerns

None. The two blocking items (QF-1, QF-2) are resolved with precision. The recommendation (QF-3) is satisfied. No new concerns were identified during re-evaluation. The best practice recommendations from Section 5 of the original review are fully addressed in the revised plan's implementation notes (TC-005 named-property evaluate return, TC-008 `path.join()` construction, `langCode` single source of truth).

---

### 7.5 Final Sign-off

| Role | Date | Verdict |
|---|---|---|
| QA Architect | 2026-03-21 | **Approved** |

**Approval is unconditional.** No further changes required before AE implementation.
