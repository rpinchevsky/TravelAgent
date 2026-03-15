# Test Plan

**Change:** Convert trip_details.json to trip_details.md
**Date:** 2026-03-14
**Author:** Automation Engineer
**BRD Reference:** `business_requirements.md`
**DD Reference:** `detailed_design.md`
**Status:** Approved (retroactive)

---

## 1. Test Scope

**In scope:**
- Verify `language-config.ts` correctly parses `trip_details.md` (existing tests exercise this)
- Verify all language-dependent tests continue to pass

**Out of scope:**
- New progression tests (no new behavior introduced; format change only)
- HTML rendering tests (no rendering changes)

**Test type:** Regression

## 2. Test Environment

- **Browser:** Chromium (desktop viewport)
- **Framework:** Playwright + TypeScript
- **Fixture:** Shared-page (read-only)
- **Target file:** `trip_full_ru.html`

## 3. Test Cases

### TC-001: Language config extraction from markdown

**Traces to:** REQ-002 → AC-1, AC-2
**Type:** Regression
**Spec file:** `activity-label-languages.spec.ts`, `poi-languages.spec.ts`
**Priority:** Critical

**Preconditions:**
- `trip_details.md` exists with valid language configuration

**Steps:**
1. Run existing language-dependent test specs
2. Tests invoke `language-config.ts` which reads `trip_details.md`

**Expected result:**
- All existing assertions pass without modification
- Language data extracted correctly from markdown format

**Implementation notes:**
- No new test code needed; existing regression suite covers this path
- If parser fails, language tests will fail with clear error on config read

---

### TC-002: Zero stale references

**Traces to:** REQ-003 → AC-1
**Type:** Regression (manual verification)
**Spec file:** N/A (grep-based check)
**Priority:** High

**Steps:**
1. `grep -r "trip_details.json" .` across the project (excluding `.git/`)

**Expected result:**
- Zero matches

## 4. Coverage Matrix

| BRD Requirement | Acceptance Criterion | Test Case(s) | Assertion Type |
|---|---|---|---|
| REQ-001 | AC-1 | File existence check | Manual |
| REQ-001 | AC-2 | Visual inspection of `trip_details.md` | Manual |
| REQ-001 | AC-3 | Visual inspection | Manual |
| REQ-002 | AC-1 | TC-001 | Hard (existing tests) |
| REQ-002 | AC-2 | TC-001 | Hard (existing tests) |
| REQ-003 | AC-1 | TC-002 | Manual (grep) |
| REQ-003 | AC-2 | TC-002 | Manual (grep) |

## 5. Test Data Dependencies

| Data Source | What's Used | Update Needed? |
|---|---|---|
| `trip_details.md` | Language list, traveler count | No — data content unchanged |

## 6. Risk & Mitigation

| Risk | Mitigation |
|---|---|
| Regex parser breaks on edge cases | Existing tests serve as integration check |

## 7. Estimated Impact

- **New test count:** 0 (existing tests cover the path)
- **Estimated runtime increase:** None
- **Files added/modified:** 0 test files changed (only import path updated)
