# Test Plan

**Change:** Add /render and /regression skills with deferred rule loading
**Date:** 2026-03-14
**Author:** Automation Engineer
**BRD Reference:** `business_requirements.md`
**DD Reference:** `detailed_design.md`
**Status:** Approved (retroactive)

---

## 1. Test Scope

**In scope:**
- Verify full regression suite passes after playwright.config.ts refactoring
- Verify env var overrides work for trip path targeting
- Verify auto-discovery finds the correct latest trip folder
- Verify zero stale `rendering-config.md` references in always-loaded files

**Out of scope:**
- Testing skill invocation itself (Claude Code skill system behavior)
- Testing `development_process.md` content (documentation, not code)
- New progression tests for skill behavior (skills are orchestration, not testable output)

**Test type:** Regression

## 2. Test Environment

- **Browser:** Chromium (desktop viewport)
- **Framework:** Playwright + TypeScript
- **Fixture:** Shared-page (read-only)
- **Target file:** `trip_full_ru.html` (auto-discovered or env-specified)

## 3. Test Cases

### TC-001: Full regression suite passes with refactored config

**Traces to:** REQ-001 → AC-1, REQ-002 → AC-1
**Type:** Regression
**Spec file:** All existing spec files
**Priority:** Critical

**Preconditions:**
- Generated trip HTML exists in `generated_trips/`
- `playwright.config.ts` uses new auto-discovery logic

**Steps:**
1. Run full regression suite: `npx playwright test`
2. Verify all tests pass

**Expected result:**
- All existing tests pass without modification to assertions
- Config correctly resolves trip path via auto-discovery

**Implementation notes:**
- Shared-page fixture; no new test files needed

---

### TC-002: Env var override for trip path

**Traces to:** REQ-001 → AC-1 (config flexibility)
**Type:** Regression
**Spec file:** All existing spec files
**Priority:** High

**Preconditions:**
- Known trip HTML path

**Steps:**
1. Set `TRIP_LTR_HTML` env var to a specific trip path
2. Run regression suite
3. Verify tests execute against the specified trip

**Expected result:**
- Tests run against the env-var-specified path, not auto-discovered path

---

### TC-003: Zero stale references in always-loaded files

**Traces to:** REQ-003 → AC-2
**Type:** Regression (manual verification)
**Spec file:** N/A (grep-based check)
**Priority:** High

**Steps:**
1. `grep "rendering-config.md" content_format_rules.md`
2. `grep "rendering-config.md" trip_planning_rules.md`

**Expected result:**
- Zero matches in both files

## 4. Coverage Matrix

| BRD Requirement | Acceptance Criterion | Test Case(s) | Assertion Type |
|---|---|---|---|
| REQ-001 | AC-1 | TC-001 | Hard (existing tests) |
| REQ-001 | AC-2 | Visual inspection of CLAUDE.md | Manual |
| REQ-001 | AC-3 | Visual inspection of CLAUDE.md | Manual |
| REQ-001 | AC-4 | Visual inspection of CLAUDE.md | Manual |
| REQ-002 | AC-1 | TC-001 | Hard (existing tests) |
| REQ-002 | AC-2–5 | Visual inspection of CLAUDE.md, content_format_rules.md | Manual |
| REQ-003 | AC-1 | Visual inspection of CLAUDE.md | Manual |
| REQ-003 | AC-2 | TC-003 | Manual (grep) |
| REQ-003 | AC-3 | Token count comparison | Manual |
| REQ-004 | AC-1–3 | Visual inspection | Manual |

## 5. Test Data Dependencies

| Data Source | What's Used | Update Needed? |
|---|---|---|
| `generated_trips/trip_2026-03-14_1745/` | Trip HTML for regression | No — synced in same change |
| `playwright.config.ts` | Test configuration | Yes — refactored (part of this change) |

## 6. Risk & Mitigation

| Risk | Mitigation |
|---|---|
| Auto-discovery picks wrong folder | Fallback chain: env var → sort by name → hardcoded default |
| Config refactoring breaks existing tests | Full regression run validates all paths |

## 7. Estimated Impact

- **New test count:** 0 (existing tests validate the config change)
- **Estimated runtime increase:** None
- **Files added/modified:** `playwright.config.ts` (modified), test spec files (minor path updates)
