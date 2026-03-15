# QA Architecture Review

**Change:** Language-Independence Refactor — Eliminate Hardcoded Language & Trip Content from Automation Tests
**Date:** 2026-03-15
**Reviewer:** QA Architect
**Documents Reviewed:** `test_plan.md`, `business_requirements.md`, `detailed_design.md`, `architecture_review.md`
**Verdict:** Approved with Changes

---

## 1. Review Summary

The test plan is well-structured and achieves full BRD coverage with 12 test cases. The approach is sound: TC-001/TC-002 validate the new foundation (`trip-config.ts`), TC-003–TC-009 validate each refactored spec, and TC-010–TC-012 cover infrastructure and enforcement.

The plan correctly identifies the critical risk — `trip-config.ts` becoming a single point of failure — and mitigates it with a dedicated smoke test (TC-001). The phased implementation approach (DD §5) is essential and should be enforced strictly.

However, there are gaps in the test plan around negative scenarios, the `data-link-exempt` rendering contract, and a missing code-level enforcement mechanism.

## 2. QA Architecture Checklist

| Principle | Status | Notes |
|---|---|---|
| Full BRD coverage | Pass | All 11 REQs and their ACs are traced to test cases |
| No duplicate tests | Pass | Each TC covers a distinct spec file or utility; no overlap |
| Correct fixture usage | Pass | Shared-page for DOM reads, standard for unit tests, manual for rule review |
| POM compliance | Pass | All new locators go through TripPage.ts (data-section-type, data-link-exempt) |
| Assertion best practices | Pass | Hard assertions for critical paths, soft for per-day batches |
| Performance impact | Pass | +2 unit tests, ~0.5s. Net line count decreases. No new browser sessions |
| Reliability | Pass | Structural selectors are more reliable than text matching (reduces flakiness) |

## 3. Coverage Analysis

| BRD Requirement | Acceptance Criterion | Covered by Test Case | Gap? |
|---|---|---|---|
| REQ-001 | AC-1 | TC-001 | None |
| REQ-001 | AC-2 | TC-001 | None |
| REQ-001 | AC-3 | TC-001 | None |
| REQ-001 | AC-4 | TC-002 | None |
| REQ-001 | AC-5 | TC-001 | See QF-1: missing negative case |
| REQ-002 | AC-1–4 | TC-003 | None |
| REQ-003 | AC-1–4 | TC-004 | None |
| REQ-004 | AC-1–4 | TC-005 | None |
| REQ-005 | AC-1–4 | TC-006 | None |
| REQ-006 | AC-1–4 | TC-007 | None |
| REQ-007 | AC-1–3 | TC-008 | See QF-2: rendering contract |
| REQ-008 | AC-1–4 | TC-009 | None |
| REQ-009 | AC-1–5 | TC-011 | None |
| REQ-010 | AC-1–3 | TC-010 | None |
| REQ-011 | AC-1–4 | TC-012 | See QF-3: automated enforcement |

## 4. Feedback Items

### QF-1: Add Negative Test for Unsupported Language

**Severity:** Recommendation
**Section:** TC-001 / TC-002

**Issue:** TC-001 validates the happy path — `loadTripConfig()` returns correct data for the current `trip_details.md`. But REQ-001 AC-5 states "adding a new language requires updating ONLY the utility." There is no test that verifies what happens when `trip_details.md` contains an **unsupported** language (one not in `LANGUAGE_LABELS`).

**Suggestion:** Add a test case TC-001b:
```typescript
test('should throw a clear error for unsupported reporting language', () => {
  // Mock trip_details.md with "Reporting language: Klingon"
  // Verify loadTripConfig() throws with message containing "Klingon" and "Supported:"
});
```

This is a unit test — it validates the fail-fast behavior that SA mandated in FB-1. If someone adds a new language to `trip_details.md` without updating `LANGUAGE_LABELS`, the error message should tell them exactly what to do.

Note: This requires either a mock/override mechanism in `loadTripConfig()` (e.g., accept an optional path parameter) or a separate test that directly tests the language lookup logic.

---

### QF-2: Add Dedicated Test for `data-link-exempt` Rendering Contract

**Severity:** Recommendation
**Section:** TC-008

**Issue:** TC-008 tests that `poi-cards.spec.ts` correctly skips link-exempt cards. But there is no test that validates the **rendering contract** itself — i.e., that POI cards with fewer than 3 links in the markdown actually receive `data-link-exempt` in the HTML, and that POI cards with 3+ links do NOT have it.

Without this, a rendering pipeline bug could add `data-link-exempt` to all POI cards (making the test trivially pass) or miss it entirely (making the test fail with cryptic errors).

**Suggestion:** Add a test case TC-008b in `poi-cards.spec.ts`:
```typescript
test('POI cards without data-link-exempt should have all 3 link types', async ({ tripPage }) => {
  // Already covered by TC-008 main test
});

test('POI cards with data-link-exempt should have fewer than 3 link types', async ({ tripPage }) => {
  const exemptCards = tripPage.page.locator('.poi-card[data-link-exempt]');
  const count = await exemptCards.count();
  expect(count).toBeGreaterThan(0); // Sanity: at least some exempt cards exist
  for (let i = 0; i < count; i++) {
    const links = tripPage.getPoiCardLinks(exemptCards.nth(i));
    const linkCount = await links.count();
    expect.soft(linkCount, `Exempt POI #${i+1}`).toBeLessThan(3);
  }
});
```

This validates the rendering contract from both sides: non-exempt cards must have 3 links, exempt cards must have fewer than 3. If the renderer ever misattributes the flag, this catches it.

---

### QF-3: Add Automated Language-Independence Lint Check

**Severity:** Recommendation
**Section:** TC-012

**Issue:** TC-012 validates the enforcement rule exists in `automation_rules.md` — but this is a manual review checkpoint. Rules written in a document are only enforced if someone reads them during review. Given that this exact problem (hardcoded Russian) went undetected across 10 spec files, manual enforcement alone is insufficient.

**Suggestion:** Add a code-level lint test (`language-independence.spec.ts`) that scans all spec files for violations:

```typescript
test('no spec file should contain Cyrillic string literals', () => {
  // Scan all .spec.ts files for Cyrillic characters outside comments
  // Flag any match as a potential language-dependent string
});

test('no spec file should contain hardcoded trip_full_ filename', () => {
  // Scan for 'trip_full_ru', 'trip_full_he', etc.
});

test('TripPage.ts should not contain hasText filters', () => {
  // Scan POM for .filter({ hasText: patterns
});
```

This is a "meta-test" — it tests the test code itself. It runs in seconds (pure file scanning, no browser) and catches violations automatically, regardless of whether a reviewer reads the rules.

This is a should-have, not a must-have. But given the history of this violation, an automated guardrail is strongly recommended.

---

### QF-4: Clarify TC-009 Matching Strategy for Dynamic POI Names

**Severity:** Observation
**Section:** TC-009

**Issue:** The test plan says TC-009 uses "first-word matching" for dynamic POI presence, and the DD shows `name.includes(firstPoiName.split('/')[0].trim())`. This works for bilingual names like `Palatinus Strand / Палатинус` (splits on `/`, takes first part). But it may produce false positives for short names or names that are substrings of other POI names.

**Suggestion:** Document the matching strategy explicitly in the test plan:
- Split on `/` to get the first-language portion of the POI name
- Trim whitespace and emoji prefixes
- Match against `poi-card__name` text content using `includes()`
- Accept partial match — the regression signal is "did the day lose a major POI?", not "is the exact name character-for-character identical?"

This is acceptable for a regression signal but should be documented as intentionally fuzzy.

---

## 5. Best Practice Recommendations

1. **Run TC-001 first in CI.** If the config smoke test fails, skip all other tests — they'll all cascade-fail with unhelpful errors. Playwright's `test.describe.configure({ mode: 'serial' })` or project dependencies can enforce this.

2. **The meta-lint test (QF-3) should be a separate spec file, not part of the regression suite.** It scans source code, not HTML. Running it in the same suite adds confusion to reports. Consider a standalone `code-quality/` test directory.

3. **Document the `data-link-exempt` rendering rule in `rendering-config.md` BEFORE implementing the test.** The test validates a contract — the contract must be documented first. This is the same principle as "test plan before test code."

4. **After the full refactor, do a grep audit.** Run `grep -rn '[А-Яа-я]' automation/code/tests/` and verify the only hits are in `trip-config.ts` (the `LANGUAGE_LABELS` map) and `language-config.ts` (the `SCRIPT_MAP`). Any other hit is a missed violation.

## 6. Sign-off

| Role | Date | Verdict |
|---|---|---|
| QA Architect | 2026-03-15 | Approved with Changes |

**Conditions for approval:**
- [ ] QF-1: Add negative test for unsupported language (or add optional path param to `loadTripConfig()` to enable mocking)
- [ ] QF-2: Add bidirectional `data-link-exempt` contract test (exempt cards have <3 links, non-exempt have 3)
- [ ] QF-3: Add automated Cyrillic/filename lint check as a code-quality test (strongly recommended given violation history)
