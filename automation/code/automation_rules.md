# Automation Engineering Rules & Best Practices

## 1. Lifecycle & Approval Workflow
* **Test Plan First:** No automation code shall be written before a `test_plan.md` is created.
* **QA Lead Sign-off:** The `test_plan.md` must be reviewed and approved by the QA Team Lead. It must include:
    * Scope of testing (What is and isn't covered).
    * Specific assertions for business-critical logic (e.g., pricing calculations).
    * Edge cases (e.g., mobile responsiveness, empty states).

## 2. Regression Reporting Standards
Every test run must produce a visual report split into two distinct categories:
* **Frontend (UI/E2E):** * Must use Playwright HTML Reports.
    * Must include trace files, video recordings of failures, and console log captures.
    * **Visual Testing:** Use `toHaveScreenshot()` for key UI components (Day Cards, Itinerary Tables) to catch CSS regressions.
* **Backend (Logic/API):** * Validation of data structures, status codes, and calculation logic.
    * Must provide a summary of pass/fail rates and execution time.

## 3. Zero-Flakiness Policy
We follow the "Reliability over Quantity" principle.
* **No Hard Sleeps:** The use of `page.waitForTimeout()` or `sleep()` is strictly prohibited. Use web-first assertions that auto-wait (e.g., `expect(locator).toBeVisible()`).
* **Atomic Tests:** Every test must be independent. Setup and teardown must ensure a clean state so tests can run in any order or in parallel.
* **Quarantine Protocol:** Any test that fails intermittently must be immediately moved to a `@quarantine` tag and removed from the CI gate until the root cause is fixed.
* **Retries:** Set CI retries to 1 to account for infrastructure hiccups, but a second failure constitutes a "Hard Break."

## 4. Testability & Dev Synergy (Shift-Left)
Automation is a collaborative effort between QA and Dev.
* **The "Stop & Escalate" Rule:** If an element is hard to select (e.g., lacks a unique ID, requires deep XPath, or complex CSS selectors), **do not write a brittle test.**
* **High Priority Requirements:** If changes are needed to the application code to support testing, document them in `qa_2_dev_requirements.txt`.
* **Priority Level:** Requirements in `qa_2_dev_requirements.txt` are considered **High Priority**. Developers are expected to add `data-testid` attributes or expose necessary API mocks to ensure a robust test suite.

## 5. Technology Stack Selection
* **Core Engine:** Playwright (preferred for its speed, multi-tab support, and native mobile emulation).
* **Language:** TypeScript (for type safety and better IDE support).
* **Pattern:** **Page Object Model (POM)** only. 
* **Gherkin/Cucumber:** Prohibited. Use descriptive `test('should...')` blocks in TypeScript to avoid the maintenance overhead of a translation layer.

## 6. Test Performance Optimization

Minimize test count and execution time without losing regression coverage.

### 6.1 Single-Project Rule (No Viewport Duplication)
* Run all tests on **desktop-chromium only**.
* Tests that need a specific viewport (mobile, tablet) must set it via `test.use({ viewport: {...} })` inside the spec file.
* **Never** add a separate Playwright project just for mobile — it duplicates every viewport-agnostic DOM test for zero added coverage.

### 6.2 Shared-Page Fixture for Read-Only Tests
* Import `test` and `expect` from `tests/fixtures/shared-page.ts` (not `@playwright/test`) for tests that **only read** DOM state (no clicks, scrolls, or navigation).
* The fixture loads the page **once per worker** and shares it across all tests in the file, eliminating redundant `page.goto()` calls.
* Tests that **mutate** the page (click, type, navigate) must use the standard `@playwright/test` import with `beforeEach`.

### 6.3 Batch Per-Day Assertions with `expect.soft`
* When validating the same set of properties for each day (e.g., banner, table, POI count), use **one `test()` per day** with `expect.soft()` for each assertion.
* This gives 12 tests instead of 60 (5 assertions × 12 days), with the same failure granularity via soft assertion messages.
* Always include a descriptive message: `expect.soft(value, 'Day ${i}: description')`.

### 6.4 Progression Test Consolidation
* Keep **one** `progression.spec.ts` file — never split by release date.
* When a new release adds progression checks, **append** them to the existing file.
* Use data-driven patterns (arrays/records of expectations) rather than one `test()` per item.
* Consolidate per-day loops into a single test with `expect.soft()` where possible.

## 7. Language Independence

All automation tests must be language-independent and trip-independent.

### 7.1 No Hardcoded Natural Language Text
* **Rule:** No spec file, page object, or fixture may contain hardcoded text in any natural language (Russian, English, Hebrew, etc.) for content assertions or element filtering.
* **Source of Truth:** All language-dependent values (day titles, section names, month names, page title) must come from `tests/utils/trip-config.ts`.
* **Structural Preferred:** When the DOM already encodes semantic distinctions (e.g., `<a>` vs `<span>` for activity labels, `data-section-type` for advisory boxes), use structural CSS selectors instead of text matching.

### 7.2 No Hardcoded Trip-Specific Constants
* **Rule:** No spec file may contain trip-specific constants (POI names, budget amounts, traveler names, day counts, dates) as string or number literals.
* **Source of Truth:** All trip-specific values must be derived from `trip_details.md` (via `trip-config.ts`) or extracted from the generated markdown (via `markdown-pois.ts`).
* **Exception:** Visual regression snapshot filenames are inherently trip-specific and are exempt.

### 7.3 Markdown Output Exception
* `generateMarkdown()` in `trip_intake.html` uses hard-coded English labels for all field keys (e.g., "Wheelchair accessible", "## Hotel Assistance"). Tests asserting markdown content may use English strings — this is an intentional exception. Add a comment `// Markdown uses English-only labels (QF-1)` near such assertions.

### 7.4 Enforcement
* QA-A and SA are jointly responsible for catching violations during Phase 3 (Architecture Review) and Phase 4 (Test Planning).
* Any PR that introduces hardcoded language or trip content in test code must be rejected.
* The `code-quality/language-independence.spec.ts` lint guard automatically scans for Cyrillic literals, hardcoded filenames, and `hasText` filters with string constants. It runs as part of the regression suite.

## 8. Test Resilience Best Practices

These rules ensure product changes cause minimal test breakage.

### 8.1 No Exact Option Counts
* **Rule:** Never assert exact counts for product options (cards, chips, grid items). Use `toBeGreaterThanOrEqual(MIN)` with a meaningful lower bound instead.
* **Why:** Adding a single hotel type, amenity chip, or car category would break every exact-count test.
* **Example:** `expect(chipCount).toBeGreaterThanOrEqual(5)` instead of `expect(chipCount).toBe(12)`.

### 8.2 No CSS Rule Scanning
* **Rule:** Never iterate `document.styleSheets → cssRules` to assert CSS rule existence. This is fragile to CSS reorganization, minification, and framework changes.
* **Alternative:** Use `getComputedStyle()` on the actual rendered element to assert the *behavior* (e.g., "element has RTL direction", "background differs in dark mode").
* **Example (RTL):** Instead of scanning for `[dir="rtl"] .avoid-card__x` in stylesheets, switch to Hebrew, select a card, and assert `getComputedStyle(badge).left !== 'auto'`.

### 8.3 No Exact CSS Pixel Values
* **Rule:** Do not assert exact pixel values (e.g., `top: '16px'`, `borderLeftWidth: '4px'`). Design tweaks break these silently.
* **Alternative:** Assert existence and non-zero: `parseInt(borderWidth) > 0` or positional ranges: `top is non-negative`.
* **Exception:** Tolerance-based checks are acceptable for alignment tests (e.g., "controls aligned within 5px").

### 8.4 Step Registry (Single Source of Truth)
* **Rule:** Never use hardcoded step numbers in test files. Import `STEPS`, `STEP_COUNT`, `STEPPER_LABEL_KEYS`, etc. from `tests/intake/utils/step-registry.ts`.
* **Why:** When steps are reordered or inserted (as happened with Step 2 hotel/car), updating ONE file fixes all tests.
* **Example:** `navigateToStep(STEPS.interests)` instead of `navigateToStep(4)`.

### 8.5 Centralized i18n Key Validation
* **Rule:** All i18n key presence validation must use `tests/intake/utils/i18n-required-keys.ts` as the single source of truth. When adding new i18n keys, add them to the relevant group in that file.
* **Test:** The master validation test (`intake-i18n-keys-master.spec.ts`) validates ALL required keys in one pass across all 12 locales, grouped by feature for traceability.
* **Anti-pattern:** Do not create per-feature i18n key tests in individual spec files.

### 8.6 Parameterize Symmetric Tests
* **Rule:** When hotel and car (or other symmetric features) share identical test patterns, use data-driven parameterization with a config array rather than duplicating test blocks.
* **Example:** Define `ASSISTANCE_SECTIONS` config array, loop `for (const cfg of ASSISTANCE_SECTIONS)` in one `test.describe`.
* **When to keep separate:** Tests with feature-specific assertions (e.g., hotel budget slider has different min/max from car) remain separate.

### 8.7 Delete Duplicates Aggressively
* **Rule:** If test A is a strict superset of test B, delete B. If two tests cover the same behavior from different angles, keep the more comprehensive one.
* **Checklist before adding a new test:**
  1. Does an existing test already cover this behavior?
  2. Can this be added as a soft assertion in an existing test?
  3. Can this be parameterized with an existing data-driven loop?

### 8.8 Filesystem Tests Skip Browser
* **Rule:** Tests that only read JSON files or HTML source from disk must NOT destructure `{ page }` in their callback. Use `async () =>` so Playwright skips browser launch.
* **Applies to:** Locale file validation, source code regex checks, rule file documentation checks.