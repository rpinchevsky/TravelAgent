# Test Plan

**Change:** Add "Mix of All" option to categorical quiz questions
**Date:** 2026-03-22
**Author:** Automation Engineer
**BRD Reference:** `technical_documents/2026-03-22_mix-option-questions/business_requirements.md`
**DD Reference:** `technical_documents/2026-03-22_mix-option-questions/detailed_design.md`
**Status:** Revised (QA-A feedback round 1)

---

## 1. Test Scope

**In scope:**
- DOM structure verification for 3 modified questions (`diningstyle`, `mealpriority`, `transport`) — card count, data-value, data-i18n attributes, icon presence
- Card selection behavior (click applies `is-selected`, single-select within question)
- i18n key presence across all 12 locale files (filesystem validation)
- Markdown label map completeness (`diningStyleLabels`, `mealLabels`, `transportLabels`) — verified via JS evaluation in browser
- `scoreFoodItem()` logic for `diningstyle: 'mix'` — verified via JS evaluation in browser
- Rule documentation (`trip_intake_rules.md`) — filesystem content check

**Out of scope:**
- Visual regression screenshots (existing `intake-visual-consistency.spec.ts` covers general visual; no new screenshot baselines needed for 4-card grids since the layout class `question-options--4` is already used by other questions)
- Generated trip HTML tests (no trip rendering changes in this BRD)
- CSS grid layout verification (the `question-options--4` class is pre-existing and already visually verified)
- Multi-language translation quality (only key presence is verified; translation accuracy is a content review task)

**Test type:** Progression (all tests verify newly added functionality)

## 2. Test Environment

- **Browser:** Chromium (desktop viewport) — for DOM/interaction tests
- **Framework:** Playwright + TypeScript
- **Fixture:** Standard `@playwright/test` import with `beforeEach` (selection tests mutate page state); filesystem tests need no browser
- **Target:** `http://localhost:3456/trip_intake.html` (served via `trip_bridge.js`)
- **Project:** `intake-i18n` project in `playwright.config.ts` (requires config update — see Section 7)
- **Config prerequisite:** The `intake-i18n` project's `testMatch` regex must be updated to include `intake-mix-options` so the new spec file is routed to this project (not the default `desktop-chromium` project which uses a `file:///` baseURL). The `testIgnore` arrays in the `desktop-chromium` and `desktop-chromium-rtl` projects must also exclude the new spec file. See Section 7 for exact changes.
- **POM:** `IntakePage` from `tests/pages/IntakePage.ts`

## 3. Test Cases

### TC-134: diningstyle question has 4 cards with correct data attributes

**Traces to:** REQ-001 -> AC-1, AC-2, AC-3, AC-4, AC-5
**Type:** Progression
**Spec file:** `intake-mix-options.spec.ts`
**Priority:** Critical

**Preconditions:**
- Navigate to intake page via bridge server
- Complete Steps 0/1, select depth >= 20 (diningstyle is T1, visible at all depths, but depth 20+ ensures the question slide is reachable via normal navigation)

**Steps:**
1. Locate the question slide via `IntakePage.questionByKey('diningstyle')` — targets `[data-question-key="diningstyle"]`
2. Count `.q-card` elements within it
3. Locate the card with `data-value="mix"`
4. Verify title element has `data-i18n="q_dine_mix"`
5. Verify description element has `data-i18n="q_dine_mix_desc"`
6. Verify `.q-card__icon` element exists and has non-empty text content

**Expected result:**
- `expect.soft(cardCount, 'diningstyle: 4 cards').toBe(4)`
- `expect.soft(mixCard, 'diningstyle: mix card exists').toBeTruthy()`
- `expect.soft(titleI18n, 'diningstyle: title i18n key').toBe('q_dine_mix')`
- `expect.soft(descI18n, 'diningstyle: desc i18n key').toBe('q_dine_mix_desc')`
- `expect.soft(iconText.length, 'diningstyle: icon has content').toBeGreaterThan(0)`

**Implementation notes:**
- Use `page.evaluate()` to batch all DOM queries into a single round-trip for performance
- All assertions use `expect.soft()` with descriptive messages
- No text-matching on card labels (language-independent)

---

### TC-135: mealpriority question has 4 cards with correct data attributes

**Traces to:** REQ-002 -> AC-1, AC-2, AC-3, AC-4, AC-5
**Type:** Progression
**Spec file:** `intake-mix-options.spec.ts`
**Priority:** Critical

**Preconditions:**
- Same as TC-134 (depth >= 20; mealpriority is T2, visible at depth 15+)

**Steps:**
1. Locate the question slide via `IntakePage.questionByKey('mealpriority')` — targets `[data-question-key="mealpriority"]`
2. Count `.q-card` elements within it
3. Locate the card with `data-value="all"`
4. Verify title element has `data-i18n="q_meal_all"`
5. Verify description element has `data-i18n="q_meal_all_desc"`
6. Verify `.q-card__icon` element exists and has non-empty text content

**Expected result:**
- `expect.soft(cardCount, 'mealpriority: 4 cards').toBe(4)`
- `expect.soft(allCard, 'mealpriority: all card exists').toBeTruthy()`
- `expect.soft(titleI18n, 'mealpriority: title i18n key').toBe('q_meal_all')`
- `expect.soft(descI18n, 'mealpriority: desc i18n key').toBe('q_meal_all_desc')`
- `expect.soft(iconText.length, 'mealpriority: icon has content').toBeGreaterThan(0)`

**Implementation notes:**
- Same batched `page.evaluate()` pattern as TC-134
- Note: `data-value="all"` (not `"mix"`) per BRD semantic decision

---

### TC-136: transport question has 4 cards with correct data attributes

**Traces to:** REQ-003 -> AC-1, AC-2, AC-3, AC-4, AC-5
**Type:** Progression
**Spec file:** `intake-mix-options.spec.ts`
**Priority:** Critical

**Preconditions:**
- Navigate to intake page, complete Steps 0/1, select depth >= 25 (transport is T3, visible at depth 20+)

**Steps:**
1. Locate the question slide via `IntakePage.questionByKey('transport')` — targets `[data-question-key="transport"]`
2. Count `.q-card` elements within it
3. Locate the card with `data-value="mix"`
4. Verify title element has `data-i18n="q_transport_mix"`
5. Verify description element has `data-i18n="q_transport_mix_desc"`
6. Verify `.q-card__icon` element exists and has non-empty text content

**Expected result:**
- `expect.soft(cardCount, 'transport: 4 cards').toBe(4)`
- `expect.soft(mixCard, 'transport: mix card exists').toBeTruthy()`
- `expect.soft(titleI18n, 'transport: title i18n key').toBe('q_transport_mix')`
- `expect.soft(descI18n, 'transport: desc i18n key').toBe('q_transport_mix_desc')`
- `expect.soft(iconText.length, 'transport: icon has content').toBeGreaterThan(0)`

**Implementation notes:**
- Same batched `page.evaluate()` pattern as TC-134/TC-135

---

### TC-137: Selecting a mix/all card applies is-selected and deselects siblings

**Traces to:** REQ-001 -> AC-6, REQ-002 -> AC-6, REQ-003 -> AC-6
**Type:** Progression
**Spec file:** `intake-mix-options.spec.ts`
**Priority:** High

**Preconditions:**
- Navigate to intake page, complete Steps 0/1, select depth 30 (all 3 questions visible)
- Navigate to Step 2 quiz area where diningstyle question is presented

**Steps:**
1. For each of the 3 questions (`diningstyle`, `mealpriority`, `transport`):
   a. Navigate to the question slide (the quiz auto-advances through sub-questions)
   b. Click the first (existing) card — verify it gains `is-selected`
   c. Click the new mix/all card — verify it gains `is-selected` and the previously selected card loses `is-selected`
   d. Verify exactly 1 card in the question has `is-selected`

**Expected result:**
- After clicking mix/all card: `expect.soft(selectedCount, '{question}: exactly 1 selected').toBe(1)`
- The selected card's `data-value` matches the new option value (`mix` or `all`)

**Implementation notes:**
- This test **mutates page state** (clicks), so it uses standard `@playwright/test` import with `beforeEach`
- Uses `IntakePage.questionByKey()` locator to find each question
- Due to quiz auto-advance behavior, the test must click through questions in order; alternatively, use `page.evaluate()` to programmatically trigger clicks without waiting for animations
- To avoid flakiness from animation timing, use `await expect(card).toHaveClass(/is-selected/)` which auto-waits

---

### TC-138: New i18n keys present in all 12 locale files

**Traces to:** REQ-004 -> AC-1, AC-2, AC-3
**Type:** Progression
**Spec file:** `intake-mix-options.spec.ts`
**Priority:** Critical

**Preconditions:**
- Filesystem access to `locales/` directory (no browser needed)

**Steps:**
1. Define the 6 required keys: `q_dine_mix`, `q_dine_mix_desc`, `q_meal_all`, `q_meal_all_desc`, `q_transport_mix`, `q_transport_mix_desc`
2. For each of the 12 locale files (`ui_en.json` through `ui_ar.json`):
   a. Read and parse the JSON file
   b. Verify all 6 keys exist
   c. Verify no key has an empty string value
   d. Verify the file is valid JSON (parsing succeeds)

**Expected result:**
- For each lang and key: `expect.soft(catalog[key], 'ui_${lang}.json: ${key} exists and non-empty').toBeTruthy()`
- JSON parse does not throw for any file

**Implementation notes:**
- Filesystem-only test using `fs.readFileSync` and `JSON.parse` — same pattern as existing `intake-i18n-catalogs.spec.ts` (TC-100 series)
- Uses data-driven loop over `SUPPORTED_LANGUAGES` constant (already defined in project)
- No browser fixture needed; however, this test is kept in the same spec file as browser tests (routed to `intake-i18n` project) for simplicity. The minor overhead of a browser context for filesystem-only tests is negligible compared to the maintenance cost of splitting into a separate spec file (per QA-A QF-2 recommendation).

---

### TC-139: Markdown label maps include new option values

**Traces to:** REQ-005 -> AC-1, AC-2, AC-3, AC-4
**Type:** Progression
**Spec file:** `intake-mix-options.spec.ts`
**Priority:** High

**Preconditions:**
- Navigate to intake page via bridge server
- Page fully loaded (JS objects available for evaluation)

**Steps:**
1. Use `page.evaluate()` to access the label map objects from the page's JS scope:
   - Check that `diningStyleLabels` contains key `mix` with a non-empty string value
   - Check that `mealLabels` contains key `all` with a non-empty string value
   - Check that `transportLabels` contains key `mix` with a non-empty string value
2. Verify none of the values is `undefined`, `null`, or empty string

**Expected result:**
- `expect.soft(diningMix, 'diningStyleLabels.mix is non-empty string').toBeTruthy()`
- `expect.soft(mealAll, 'mealLabels.all is non-empty string').toBeTruthy()`
- `expect.soft(transportMix, 'transportLabels.mix is non-empty string').toBeTruthy()`

**Implementation notes:**
- The label map objects are declared at function scope inside `generateMarkdown()` in `trip_intake.html`. They may not be globally accessible. Two approaches:
  - **Option A (preferred):** Parse the HTML source with `fs.readFileSync`, use regex to extract the label objects and verify the keys exist as string literals. This is a filesystem test, no browser needed.
  - **Option B:** Navigate to Step 7 (review), select the new option values, generate markdown, and verify the output contains the expected labels (not "undefined"). This is a functional/integration approach.
- Implement **Option A** as the sole approach. It is faster and deterministic. If the regex fails to match due to code refactoring, the test should fail clearly — that failure is the correct signal to update the regex pattern, not to fall back to Option B.
- Regex pattern: `/diningStyleLabels\s*=\s*\{[^}]*mix\s*:/` to verify key presence.

---

### TC-140: scoreFoodItem handles diningstyle 'mix' correctly

**Traces to:** REQ-006 -> AC-1, AC-2, AC-3
**Type:** Progression
**Spec file:** `intake-mix-options.spec.ts`
**Priority:** High

**Preconditions:**
- Filesystem access to `trip_intake.html` (source code analysis)

**Steps:**
1. Read `trip_intake.html` source
2. Extract the `scoreFoodItem` function body
3. Verify the function contains a branch for `style === 'mix'` (or equivalent)
4. Verify the mix branch assigns a score >= 1 (AC-2) and never 0 (AC-1)
5. Verify the existing `item.style === style` branch is still present and unmodified in structure (AC-3)

**Expected result:**
- `expect(hasMixBranch, 'scoreFoodItem has mix style branch').toBe(true)`
- `expect(mixScore, 'mix branch score >= 1').toBeGreaterThanOrEqual(1)`
- `expect(hasOriginalBranch, 'original style matching branch preserved').toBe(true)`

**Implementation notes:**
- This is a **static source analysis test** — parsing JS source from the HTML file
- Regex approach: `/if\s*\(\s*style\s*===?\s*['"]mix['"]\s*\)\s*s\s*\+=\s*(\d+)/` to extract the score value
- Also verify the `else if (item.style === style) s += 3` pattern still exists
- Alternative: use `page.evaluate()` to call `scoreFoodItem()` directly with mock data and assert return values. However, the function may depend on DOM state or closure variables, making direct invocation complex.
- Recommend **source analysis** as the primary approach, supplemented by a comment explaining why runtime testing is deferred.

---

### TC-141: Rule documentation lists new allowed values

**Traces to:** REQ-007 -> AC-1, AC-2, AC-3
**Type:** Progression
**Spec file:** `intake-mix-options.spec.ts`
**Priority:** Medium

**Preconditions:**
- Filesystem access to `trip_intake_rules.md`

**Steps:**
1. Read `trip_intake_rules.md` content
2. Locate the Dining style line and verify it contains `mix` (or `mix of all styles`)
3. Locate the Meal priority line and verify it contains `all` (or `every meal matters equally`)
4. Locate the Transport preference line and verify it contains `mix` (or `mix — whatever fits best`)

**Expected result:**
- `expect.soft(diningLine, 'rules: diningstyle includes mix').toMatch(/mix/i)`
- `expect.soft(mealLine, 'rules: mealpriority includes all').toMatch(/every meal|all/i)`
- `expect.soft(transportLine, 'rules: transport includes mix').toMatch(/mix/i)`

**Implementation notes:**
- Filesystem-only test using `fs.readFileSync`
- Pattern matches are case-insensitive to allow for label variations
- Same approach as existing TC-126 (rule file validation in `intake-i18n-catalogs.spec.ts`)

---

## 4. Coverage Matrix

| BRD Requirement | Acceptance Criterion | Test Case(s) | Assertion Type |
|---|---|---|---|
| REQ-001 | AC-1: 4 `.q-card` in diningstyle | TC-134 | Soft |
| REQ-001 | AC-2: card with `data-value="mix"` | TC-134 | Soft |
| REQ-001 | AC-3: title `data-i18n="q_dine_mix"` | TC-134 | Soft |
| REQ-001 | AC-4: desc `data-i18n="q_dine_mix_desc"` | TC-134 | Soft |
| REQ-001 | AC-5: `.q-card__icon` with emoji | TC-134 | Soft |
| REQ-001 | AC-6: `is-selected` single-select | TC-137 | Soft |
| REQ-002 | AC-1: 4 `.q-card` in mealpriority | TC-135 | Soft |
| REQ-002 | AC-2: card with `data-value="all"` | TC-135 | Soft |
| REQ-002 | AC-3: title `data-i18n="q_meal_all"` | TC-135 | Soft |
| REQ-002 | AC-4: desc `data-i18n="q_meal_all_desc"` | TC-135 | Soft |
| REQ-002 | AC-5: `.q-card__icon` with emoji | TC-135 | Soft |
| REQ-002 | AC-6: `is-selected` single-select | TC-137 | Soft |
| REQ-003 | AC-1: 4 `.q-card` in transport | TC-136 | Soft |
| REQ-003 | AC-2: card with `data-value="mix"` | TC-136 | Soft |
| REQ-003 | AC-3: title `data-i18n="q_transport_mix"` | TC-136 | Soft |
| REQ-003 | AC-4: desc `data-i18n="q_transport_mix_desc"` | TC-136 | Soft |
| REQ-003 | AC-5: `.q-card__icon` with emoji | TC-136 | Soft |
| REQ-003 | AC-6: `is-selected` single-select | TC-137 | Soft |
| REQ-004 | AC-1: 6 keys in all 12 locale files | TC-138 | Soft |
| REQ-004 | AC-2: no empty string values | TC-138 | Soft |
| REQ-004 | AC-3: valid JSON after update | TC-138 | Soft |
| REQ-005 | AC-1: `diningStyleLabels` has `mix` | TC-139 | Soft |
| REQ-005 | AC-2: `mealLabels` has `all` | TC-139 | Soft |
| REQ-005 | AC-3: `transportLabels` has `mix` | TC-139 | Soft |
| REQ-005 | AC-4: non-empty label in markdown | TC-139 | Soft |
| REQ-006 | AC-1: no 0 points for mix style | TC-140 | Hard |
| REQ-006 | AC-2: all items >= 1 point for mix | TC-140 | Hard |
| REQ-006 | AC-3: existing scoring unchanged | TC-140 | Hard |
| REQ-007 | AC-1: `mix` listed for diningstyle | TC-141 | Soft |
| REQ-007 | AC-2: `all` listed for mealpriority | TC-141 | Soft |
| REQ-007 | AC-3: `mix` listed for transport | TC-141 | Soft |

## 5. Test Data Dependencies

| Data Source | What's Used | Update Needed? |
|---|---|---|
| `locales/ui_*.json` (12 files) | New i18n keys: `q_dine_mix`, `q_dine_mix_desc`, `q_meal_all`, `q_meal_all_desc`, `q_transport_mix`, `q_transport_mix_desc` | Yes — keys must exist before TC-138 can pass |
| `trip_intake.html` | DOM structure (card elements), JS source (`scoreFoodItem`, label maps) | Yes — implementation must be complete before DOM/JS tests pass |
| `trip_intake_rules.md` | Allowed values for diningstyle, mealpriority, transport | Yes — documentation must be updated before TC-141 can pass |
| `trip_bridge.js` | HTTP server for intake page | No — existing server, no changes needed |
| `IntakePage.ts` | POM locators for navigation and question access | No — existing `questionByKey()` method is sufficient; no new POM locators needed |
| `playwright.config.ts` | Project routing: `testMatch` and `testIgnore` patterns | Yes — must add `intake-mix-options` to `intake-i18n` project `testMatch` and to `testIgnore` arrays in `desktop-chromium` / `desktop-chromium-rtl` projects |

## 6. Risk & Mitigation

| Risk | Mitigation |
|---|---|
| Quiz auto-advance timing may cause TC-137 to click before question slide is visible | Use `await expect(card).toBeVisible()` before clicking; rely on Playwright's auto-wait for `toHaveClass()` assertions |
| `scoreFoodItem` label map objects are function-scoped and not accessible via `page.evaluate()` | Use source-level regex analysis (filesystem test) instead of runtime evaluation |
| Depth selection prerequisite adds test setup time | Consolidate TC-134/135/136 into a single test with data-driven loop and batched `page.evaluate()` to minimize page loads |
| Existing TC-103 (key count match) will fail if implementation only partially adds keys | TC-138 is ordered to run alongside TC-103; both serve as independent guards. No mitigation needed — partial failure is the expected signal. |
| Regex-based source analysis (TC-139, TC-140) may be fragile if code formatting changes | Use flexible regex patterns that tolerate whitespace variations; include comments explaining the patterns. A failing regex test is the correct signal to update the pattern — no fallback needed. |
| New spec file not routed to correct Playwright project | Playwright config must be updated before tests are run (see Section 7). Without the `testMatch` / `testIgnore` changes, browser tests will run under `desktop-chromium` with a `file:///` baseURL and fail immediately. |

## 7. Estimated Impact

- **New test count:** 8 test cases (TC-134 through TC-141)
- **Implementation note:** TC-134/135/136 can be consolidated into 1 data-driven test (3 iterations). TC-137 is 1 test with 3 sub-iterations. TC-138/139/140/141 are filesystem tests. Effective test function count: ~5 `test()` blocks.
- **Estimated runtime increase:** ~4 seconds total (3 filesystem tests: <1s combined; 1 browser DOM test with depth setup: ~2s; 1 browser click test with depth setup: ~2s). Minimal impact — no new page loads beyond the existing intake page startup.
- **Files added:** `automation/code/tests/intake/intake-mix-options.spec.ts` (1 new spec file)
- **Files modified:** `automation/code/playwright.config.ts` (config routing — see below). Existing POM (`IntakePage.ts`) already has all needed locators (`questionByKey()`, `setupWithDepth()`). Existing `intake-i18n-catalogs.spec.ts` TC-103 (key count match) will naturally cover the new keys without modification — it asserts equal key counts across all locale files.
- **New POM locators needed:** None. The `IntakePage.questionByKey(key)` method returns a locator for `[data-question-key="${key}"]`, and `.q-card` / `data-value` sub-locators are constructed inline in the test.
- **Playwright config changes (required — QF-1 fix):**
  1. **`intake-i18n` project `testMatch`** (line 91): Update regex from `/intake-i18n-catalog|intake-i18n-key-leak|intake-step1-alignment/` to `/intake-i18n-catalog|intake-i18n-key-leak|intake-step1-alignment|intake-mix-options/`. This ensures the new spec file runs under the `intake-i18n` project with `baseURL: 'http://localhost:3456/trip_intake.html'` instead of the default `desktop-chromium` project which uses a `file:///` baseURL.
  2. **`desktop-chromium` project `testIgnore`** (line 68): Add `/intake-mix-options/` to the existing array so the main project does not also pick up the new spec file.
  3. **`desktop-chromium-rtl` project `testIgnore`** (line 82): Same addition — add `/intake-mix-options/` to exclude from the RTL project.
  - **Rationale:** The `intake-i18n` project uses an explicit `testMatch` allowlist (not a glob pattern). Any new intake spec file that requires HTTP transport must be added to this regex. Without this change, browser-based tests (TC-134/135/136, TC-137, TC-139) would navigate to the wrong page and fail.
