# Test Plan

**Change:** {Change title}
**Date:** {YYYY-MM-DD}
**Author:** Automation Engineer
**BRD Reference:** {Link to business_requirements.md}
**DD Reference:** {Link to detailed_design.md}
**Status:** Draft | Under Review | Approved

---

## 1. Test Scope

**In scope:**
- {What will be tested}

**Out of scope:**
- {What will NOT be tested and why}

**Test type:** Regression | Progression | Both

## 2. Test Environment

- **Browser:** Chromium (desktop viewport)
- **Framework:** Playwright + TypeScript
- **Fixture:** Shared-page (read-only) | Standard (mutations)
- **Target file:** `trip_full_{LANG}.html`

## 3. Test Cases

### TC-{NNN}: {Test case title}

**Traces to:** REQ-{NNN} → AC-{N}
**Type:** Progression | Regression
**Spec file:** `{spec-file-name}.spec.ts`
**Priority:** Critical | High | Medium

**Preconditions:**
- {Setup required}

**Steps:**
1. {Step 1}
2. {Step 2}

**Expected result:**
- {Assertion 1}
- {Assertion 2}

**Implementation notes:**
- {Fixture type, soft assertions, batching strategy}

---

*(Repeat TC block for each test case)*

## 4. Coverage Matrix

| BRD Requirement | Acceptance Criterion | Test Case(s) | Assertion Type |
|---|---|---|---|
| REQ-{NNN} | AC-1 | TC-{NNN} | Hard / Soft |

## 5. Test Data Dependencies

| Data Source | What's Used | Update Needed? |
|---|---|---|
| {e.g., manifest.json} | {Day count} | {Yes — after new trip generation} |
| {e.g., day_XX.md} | {POI section count} | {Dynamic — read at runtime} |

## 6. Risk & Mitigation

| Risk | Mitigation |
|---|---|
| {e.g., POI count changes between trips} | {Read count dynamically from markdown, don't hardcode} |

## 7. Estimated Impact

- **New test count:** {N}
- **Estimated runtime increase:** {N seconds}
- **Files added/modified:** {List}
