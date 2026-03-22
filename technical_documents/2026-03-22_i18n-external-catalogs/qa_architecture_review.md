# QA Architecture Review

**Change:** Extract intake page i18n data into external JSON catalog files
**Date:** 2026-03-22
**Reviewer:** QA Architect
**Documents Reviewed:** `business_requirements.md` (BRD, 7 REQs / 39 ACs), `test_plan.md` v2 (32 TCs across 2 spec files), `automation_rules.md`, `IntakePage.ts` (POM), `detailed_design.md` (DD)
**Verdict:** Approved

---

## 1. Review Summary

The test plan is thorough and well-structured. It provides 32 test cases that cover all 7 BRD requirements and all 39 acceptance criteria, with a clear coverage matrix and traceability. The author correctly identifies the need for both filesystem-level validation (data integrity) and browser-based behavioral tests (catalog loading, fallback, FOUC). Language-agnostic principles are respected throughout — no hardcoded translation strings appear in any test case. The plan correctly adapts to the DD v2 design (merged `_items` into per-language files, eliminating `items_i18n.json`).

The initial review (v1) identified four feedback items, one blocking (QF-1: `file://` protocol test feasibility) and three recommendations. All items have been addressed in v2. The plan is ready for implementation.

## 2. QA Architecture Checklist

| Principle | Status | Notes |
|---|---|---|
| Full BRD coverage | Pass | All 39 ACs mapped to at least one TC in the coverage matrix (§4). No gaps found. |
| No duplicate tests | Pass | Minor overlap exists (TC-106 and TC-131 both touch `data-i18n` attributes), but TC-106 validates count parity while TC-131 validates key mapping — they assert different things. |
| Correct fixture usage | Pass | Standard `@playwright/test` import chosen correctly. All browser tests mutate state (language switching, navigation, route interception), so shared-page fixture is inappropriate. Filesystem-only tests use `fs` module directly — compliant with §6.2 guidance. |
| POM compliance | Pass | All browser interactions route through `IntakePage.switchLanguage()`, `IntakePage.goto()`, `IntakePage.setupWithDepth()`, and `IntakePage.navigateToStep()`. No inline locators in spec descriptions. Proposed `waitForI18nReady()` helper belongs in POM — correct placement. |
| Assertion best practices | Pass | `expect.soft()` used appropriately for batched file checks (TC-100 through TC-105), per-element translation checks (TC-113), and rule file checks (TC-126, TC-127). Hard assertions used for critical single-point checks (TC-107, TC-110, TC-111). Descriptive messages specified in implementation notes. |
| Performance impact | Pass | Estimated 25-35s runtime increase is reasonable for 32 tests. Filesystem tests are instant. Browser tests reuse a single page load per spec file where possible. No unnecessary test duplication. |
| Reliability | Pass | No hard sleeps anywhere. Race condition test (TC-129) uses deterministic `page.route()` delays instead of real network timing. Network interception uses Playwright's built-in `page.route()` — synchronous and reliable. FOUC test (TC-120) uses class-based checks instead of timing-based visual comparison. TC-124 file:// simulation uses `page.route()` + `page.addInitScript()` — reliable in headless CI. |

## 3. Coverage Analysis

| BRD Requirement | Acceptance Criterion | Covered by Test Case | Gap? |
|---|---|---|---|
| REQ-001 | AC-1: `locales/` folder exists | TC-100 | None |
| REQ-001 | AC-2: 12 `ui_{lang}.json` files exist | TC-100 | None |
| REQ-001 | AC-3: Shared items file (merged into `_items`) | TC-100, TC-102 | None |
| REQ-001 | AC-4: Flat key-value, keys match `data-i18n` | TC-101, TC-106 | None |
| REQ-001 | AC-5: `_items` mirrors ITEM_I18N | TC-102, TC-104 | None |
| REQ-001 | AC-6: Valid JSON | TC-101 | None |
| REQ-001 | AC-7: Key count matches | TC-103 | None |
| REQ-002 | AC-1: `setLanguage` fetches via `fetch()` | TC-108 | None |
| REQ-002 | AC-2: Catalogs cached in memory | TC-109 | None |
| REQ-002 | AC-3: Fallback chain (target -> EN -> emergency) | TC-110, TC-111 | None |
| REQ-002 | AC-4: English eagerly loaded | TC-112 | None |
| REQ-002 | AC-5: `data-i18n`/placeholder translated | TC-113 | None |
| REQ-002 | AC-6: RTL direction | TC-114 | None |
| REQ-002 | AC-7: localStorage persistence | TC-115 | None |
| REQ-002 | AC-8: Cached switch instant (no FOUC) | TC-116 | None |
| REQ-002 | AC-9: TRANSLATIONS removed | TC-107 | None |
| REQ-003 | AC-1: Items loaded on init | TC-102, TC-112 | None |
| REQ-003 | AC-2: `tItem` correct RU/HE | TC-121, TC-128 | None |
| REQ-003 | AC-3: `tItem` EN fallback | TC-128 | None |
| REQ-003 | AC-4: Cards display correctly | TC-121 | None |
| REQ-003 | AC-5: Markdown English names | TC-122 | None |
| REQ-003 | AC-6: ITEM_I18N removed | TC-107 | None |
| REQ-004 | AC-1: Works via bridge server | TC-123 | None |
| REQ-004 | AC-2: Works via any static HTTP server | TC-123 | None (see QF-2 resolution) |
| REQ-004 | AC-3: No build step | TC-125 | None |
| REQ-004 | AC-4: `file://` shows error | TC-124 | None (see QF-1 resolution) |
| REQ-004 | AC-5: Bridge serves `locales/` | TC-108, TC-123 | None |
| REQ-005 | AC-1: EN loaded before first render | TC-112 | None |
| REQ-005 | AC-2: User's lang loaded before showing | TC-117 | None |
| REQ-005 | AC-3: At most 2 requests on cold load | TC-118 | None |
| REQ-005 | AC-4: Cache-Control headers | TC-119 | None |
| REQ-005 | AC-5: No FOUC | TC-116, TC-120 | None |
| REQ-006 | AC-1: rules.md documents locales/ structure | TC-126 | None |
| REQ-006 | AC-2: rules.md documents async fetch | TC-126 | None |
| REQ-006 | AC-3: rules.md How to Modify (UI text) | TC-126 | None |
| REQ-006 | AC-4: rules.md How to Modify (items) | TC-126 | None |
| REQ-006 | AC-5: design.md documents fetch/cache/fallback | TC-127 | None |
| REQ-006 | AC-6: design.md documents HTTP requirement | TC-127 | None |
| REQ-006 | AC-7: Existing rules retained | TC-126, TC-127 | None |
| REQ-007 | AC-1: EN keys match | TC-103 | None |
| REQ-007 | AC-2: RU keys match | TC-103 | None |
| REQ-007 | AC-3: HE keys match | TC-103 | None |
| REQ-007 | AC-4: ITEM_I18N entries match | TC-104 | None |
| REQ-007 | AC-5: `data-i18n` count unchanged | TC-106, TC-131 | None |
| REQ-007 | AC-6: Validation step exists | TC-103, TC-104, TC-131 | None |

## 4. Feedback Items

### QF-1: `file://` Protocol Test Feasibility

**Severity:** Blocking
**Section:** TC-124 (`intake-i18n-file-protocol.spec.ts`)
**Issue:** The test plan proposes navigating to `trip_intake.html` via `file:///` protocol to verify the graceful error overlay. However, Playwright's `page.goto()` with `file:///` paths has known behavioral differences from a user double-clicking an HTML file. Specifically: (1) Chromium in headless mode may block or restrict `file://` navigation differently than headed mode. (2) The page's JavaScript that detects `window.location.protocol === 'file:'` will execute, but `fetch()` calls from `file://` origin are blocked by CORS, which means the error detection may fire inconsistently depending on whether the error comes from a CORS block, a network error, or a protocol check. (3) In CI environments, the absolute filesystem path varies, making the test non-portable without dynamic path resolution.

**Suggestion:** Restructure the test to use the bridge server with a `page.route()` intercept that simulates the `file://` protocol condition. Specifically:
1. Add a helper to `IntakePage.ts`: `simulateFileProtocol()` that uses `page.addInitScript(() => { Object.defineProperty(window.location, 'protocol', { get: () => 'file:' }) })` — or more practically, use `page.route()` to block all `locales/*.json` requests to simulate what happens on `file://`.
2. Alternatively, keep the `file:///` test but mark it as `test.skip` in CI (headless) and document it as a manual verification step for headed mode only.
3. The safest approach: test the protocol detection logic directly via `page.evaluate(() => window.location.protocol)` after `file:///` navigation with a dynamically resolved absolute path using `path.resolve()`. Add a `test.fixme()` annotation if CI headless does not support it, with a tracking note.

### QF-2: REQ-004 AC-2 Coverage is Implicit

**Severity:** Recommendation
**Section:** Coverage matrix, TC-123
**Issue:** REQ-004 AC-2 states "The page loads and functions correctly when served via any static HTTP server (e.g., `npx serve`, `python -m http.server`)." The coverage matrix marks this as "TC-123 (implicit)" — the test only validates the bridge server, not a generic static server. While the bridge server is the project's standard server, the BRD explicitly calls out any static HTTP server as a separate criterion.

**Suggestion:** This is acceptable for automation since testing multiple server implementations adds complexity with low marginal value. Document in the test plan that AC-2 is validated by manual testing during Phase 6 (render + regression) and by the architectural guarantee that the page uses standard `fetch()` against relative URLs, which works with any HTTP server. No new test case needed, but add an explicit note in the coverage matrix instead of "(implicit)".

### QF-3: TC-128 Uses Hardcoded Item Name

**Severity:** Recommendation
**Section:** TC-128 (`tItem()` returns correct translations)
**Issue:** The test steps specify calling `tItem('Local Food Markets & Street Food')` — a hardcoded English item name. While this is used as a test fixture value (not a language assertion), it violates the spirit of automation_rules.md §7.2 which prohibits hardcoded trip-specific constants in spec files. If the item database changes, this test breaks.

**Suggestion:** Instead of hardcoding a specific item name, extract the first key from `_items` in the loaded catalog via `page.evaluate()`:
```
const firstItem = await page.evaluate(() => Object.keys(window._uiCache?.en?._items ?? {})[0]);
```
Then call `tItem(firstItem)` for the assertion. This makes the test data-driven from the catalog itself.

### QF-4: Spec File Organization and Naming

**Severity:** Observation
**Section:** §7 (Estimated Impact)
**Issue:** The plan proposes 3 spec files: `intake-i18n-catalogs.spec.ts` (10 tests, filesystem), `intake-i18n-catalog-loading.spec.ts` (21 tests, browser), and `intake-i18n-file-protocol.spec.ts` (1 test, file://). The third file contains a single test case. While this makes sense from a configuration perspective (different baseURL), consider whether the file:// test (after QF-1 resolution) can be a `test.describe` block within the loading spec file with a per-block `test.use({ baseURL: ... })` override, avoiding a separate file for a single test.

**Suggestion:** If the `file://` test is restructured per QF-1 (using route interception on the bridge server), it can be merged into `intake-i18n-catalog-loading.spec.ts` as a `test.describe('file:// protocol detection')` block, reducing the spec file count to 2.

---

## 5. Best Practice Recommendations

1. **`waitForI18nReady()` POM Helper:** The plan mentions adding this optionally. Make it mandatory. Every browser-based test in `intake-i18n-catalog-loading.spec.ts` should call `await intakePage.waitForI18nReady()` after `goto()` to ensure catalogs are loaded before asserting. This prevents flaky failures if catalog loading is slower than expected. Implementation: `await this.page.waitForFunction(() => !document.body.classList.contains('i18n-loading'))`.

2. **Network Request Counting Pattern:** Tests TC-108, TC-109, TC-112, TC-117, and TC-118 all set up network request monitoring. Extract a shared utility function `createRequestCounter(page, urlPattern)` that returns `{ count: number, requests: Request[] }` to avoid duplicating route/event setup logic across 5+ tests. Place it in a `tests/intake/utils/` directory or as a static method on `IntakePage`.

3. **Playwright Config — `webServer` Block:** The plan correctly identifies the need for a `webServer` config entry to auto-start `trip_bridge.js`. Ensure the config includes: `reuseExistingServer: true` (so developers running the bridge server manually are not blocked), `timeout: 10000` (bridge server starts fast), and a health check URL (e.g., `http://localhost:3456/trip_intake.html`). This prevents flaky CI failures from server startup timing.

4. **Test Ordering Consideration:** The filesystem tests (TC-100 through TC-107) are independent of the browser tests and can run in parallel. However, the browser tests depend on the catalogs existing. Consider adding a `test.describe.configure({ mode: 'serial' })` to the catalog-loading spec file if tests within it share request interception state, or ensure each test sets up its own interception cleanly.

5. **Existing Test Regression Gate:** The plan mentions (§6, Risk) that existing intake i18n tests (TC-064 through TC-069) should pass unchanged. Add an explicit regression step in the test plan: "Run existing `intake-i18n-full.spec.ts` as-is before merging. No modifications to existing tests are expected or permitted as part of this change."

## 6. Re-Review (v2)

**Date:** 2026-03-22
**Trigger:** AE updated test plan to v2 addressing all feedback items from initial review.

### QF-1 (Blocking) -- RESOLVED

TC-124 has been restructured to use a dual-simulation approach:
1. `page.route('**/locales/*.json', route => route.abort('blockedbyclient'))` blocks all locale catalog requests (simulates fetch failure on `file://`)
2. `page.addInitScript()` overrides `window.location.protocol` to return `'file:'` (simulates protocol detection logic)

The test now runs against the bridge server (`http://localhost:3456`) and is fully deterministic in headless CI. The separate `intake-i18n-file-protocol.spec.ts` file has been eliminated; TC-124 is now a `test.describe('file:// protocol detection')` block within `intake-i18n-catalog-loading.spec.ts`. This is the approach recommended in QF-1 suggestion #1 and QF-4, executed correctly.

### QF-2 (Recommendation) -- RESOLVED

Coverage matrix for REQ-004 AC-2 now includes an explicit note documenting that validation is via manual testing during Phase 6 and by architectural guarantee (standard `fetch()` with relative URLs). The "(implicit)" label is removed. Acceptable resolution.

### QF-3 (Recommendation) -- RESOLVED

TC-128 now extracts the first item key dynamically via `page.evaluate(() => Object.keys(window._uiCache?.en?._items ?? {})[0])` instead of hardcoding `'Local Food Markets & Street Food'`. The test is now data-driven from the catalog itself, fully resilient to item database changes. Implementation notes explicitly document this approach.

### QF-4 (Observation) -- RESOLVED

The third spec file (`intake-i18n-file-protocol.spec.ts`) has been eliminated. Test plan now specifies 2 spec files (10 filesystem + 22 browser). TC-124 is a `test.describe` block within the loading spec file.

### Best Practice Recommendations -- ALL INCORPORATED

1. `waitForI18nReady()` is now mandatory (documented in section 2 and referenced in every browser test's implementation notes)
2. `createRequestCounter()` shared utility is documented in section 2 and referenced by 5 test cases
3. `webServer` config includes all recommended settings (`reuseExistingServer: true`, `timeout: 10000`, health check URL)
4. Test ordering considerations addressed in risk section
5. Explicit regression gate added: "Run existing `intake-i18n-full.spec.ts` as-is before merging. No modifications to existing tests permitted."

### New Issues Introduced -- NONE

No new concerns found in v2. The total test case count remains 32 across 2 spec files (reduced from 3). All 39 BRD acceptance criteria remain fully covered. Language-agnostic principles upheld throughout.

## 7. Sign-off

| Role | Date | Verdict |
|---|---|---|
| QA Architect | 2026-03-22 | Approved with Changes (initial review) |
| QA Architect | 2026-03-22 | **Approved** (re-review) |

All blocking items resolved. All recommendations addressed. Test plan v2 is approved for implementation.
