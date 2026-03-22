# Test Plan

**Change:** Extract intake page i18n data into external JSON catalog files
**Date:** 2026-03-22
**Author:** Automation Engineer
**BRD Reference:** `technical_documents/2026-03-22_i18n-external-catalogs/business_requirements.md`
**DD Reference:** `technical_documents/2026-03-22_i18n-external-catalogs/detailed_design.md`
**Status:** v2 (updated per QA Architecture Review feedback)

**Revision history:**
| Version | Date | Changes |
|---|---|---|
| Draft | 2026-03-22 | Initial test plan — 32 TCs across 3 spec files |
| v2 | 2026-03-22 | QF-1: Restructured TC-124 to use `page.route()` + `page.addInitScript()` simulation, merged into `intake-i18n-catalog-loading.spec.ts`. QF-2: Added explicit coverage note for REQ-004 AC-2. QF-3: TC-128 uses dynamic item extraction instead of hardcoded name. QF-4: Eliminated `intake-i18n-file-protocol.spec.ts`. Best practices: `waitForI18nReady()` mandatory, shared `createRequestCounter()` utility, `webServer` config details, explicit regression gate. |

---

## 1. Test Scope

**In scope:**
- JSON catalog file existence, validity, and structural correctness (filesystem-level)
- Data integrity: key counts, value preservation, no orphaned/missing references
- Browser-based tests for catalog loading via `fetch()`, language switching, caching, fallback chain
- FOUC prevention (no flash of untranslated content during page load)
- `file://` protocol detection and graceful degradation message (simulated via route interception + init script override)
- Bridge server (`trip_bridge.js`) serving of `locales/` files and `trip_intake.html`
- Race condition guard on rapid language switching
- Item translation rendering on interest/avoid/food/vibe cards
- Calendar and DOB month/day name translations via external catalogs
- Rule file documentation updates (verified via filesystem assertions)

**Out of scope:**
- Generated trip HTML files (`trip_full_{lang}.html`) — unaffected by this change
- Adding new languages beyond the existing 12
- Completing translations for the 9 fallback languages
- Performance benchmarking (catalog file sizes are small; load time thresholds are not specified in BRD)
- Visual regression screenshots (no visual changes per DD §3.2)

**Test type:** Both (Progression for new catalog-loading behavior + Regression for unchanged intake functionality)

## 2. Test Environment

- **Browser:** Chromium (desktop viewport)
- **Framework:** Playwright + TypeScript
- **Fixture:** Standard `@playwright/test` import (tests mutate page state via language switching, navigation)
- **Target:** `trip_intake.html` served via `trip_bridge.js` on `http://localhost:3456`
- **POM:** `IntakePage.ts` (existing) — no new page object needed; new locators added to existing POM
- **Config:** Intake tests require a Playwright project with `baseURL: 'http://localhost:3456'` and `webServer` config to auto-start `trip_bridge.js`
- **Mandatory POM helper:** All browser-based tests **must** call `await intakePage.waitForI18nReady()` after `goto()` to ensure catalogs are loaded before asserting. Implementation: `await this.page.waitForFunction(() => !document.body.classList.contains('i18n-loading'))`.
- **Shared utility:** Extract `createRequestCounter(page, urlPattern)` into `tests/intake/utils/request-counter.ts`. Returns `{ count: number, requests: Request[] }`. Used by TC-108, TC-109, TC-112, TC-117, TC-118 to avoid duplicating route/event setup logic.
- **`webServer` config:** The `playwright.config.ts` `webServer` block must include:
  - `command: 'node trip_bridge.js'`
  - `port: 3456`
  - `reuseExistingServer: true` (developers running bridge server manually are not blocked)
  - `timeout: 10000` (bridge server starts fast)
  - Health check URL: `http://localhost:3456/trip_intake.html`

**Regression gate:** Run existing `intake-i18n-full.spec.ts` (TC-064 through TC-069) as-is before merging. No modifications to existing tests are expected or permitted as part of this change. Any failure in existing tests blocks the merge.

## 3. Test Cases

### TC-100: JSON catalog files exist with correct naming

**Traces to:** REQ-001 → AC-1, AC-2, AC-3
**Type:** Progression
**Spec file:** `intake-i18n-catalogs.spec.ts`
**Priority:** Critical

**Preconditions:**
- `locales/` folder exists in project root

**Steps:**
1. Use `fs.existsSync()` to check for `locales/` directory
2. For each of the 12 languages (en, ru, he, es, fr, de, it, pt, zh, ja, ko, ar), check `locales/ui_{lang}.json` exists
3. Verify no `items_i18n.json` exists as a separate file (DD §1.5 — eliminated)

**Expected result:**
- `locales/` directory exists
- All 12 `ui_{lang}.json` files exist
- No separate `items_i18n.json` file

**Implementation notes:**
- Filesystem-only test (no browser needed). Use `test.describe` with `fs` module.
- Use `expect.soft()` per file to report all missing files in one run.

---

### TC-101: JSON catalog files are valid JSON with flat key-value structure

**Traces to:** REQ-001 → AC-4, AC-6
**Type:** Progression
**Spec file:** `intake-i18n-catalogs.spec.ts`
**Priority:** Critical

**Preconditions:**
- All 12 `ui_{lang}.json` files exist

**Steps:**
1. For each `ui_{lang}.json`, read file content and parse with `JSON.parse()`
2. Verify the result is a non-null object (not array, not primitive)
3. Verify all top-level keys (except `_items`, `months`, `days_short`) have string values
4. Verify `months` is an array of 12 strings
5. Verify `days_short` is an array of 7 strings

**Expected result:**
- All files parse without error
- Top-level structure is a flat key-value object
- `months` array has 12 entries; `days_short` array has 7 entries

**Implementation notes:**
- Filesystem-only. Loop over all 12 files with `expect.soft()` per assertion.

---

### TC-102: Each catalog contains `_items` key with correct structure

**Traces to:** REQ-001 → AC-5; REQ-003 → AC-1
**Type:** Progression
**Spec file:** `intake-i18n-catalogs.spec.ts`
**Priority:** Critical

**Preconditions:**
- All 12 `ui_{lang}.json` files exist and are valid JSON

**Steps:**
1. For each `ui_{lang}.json`, verify `_items` key exists and is a non-null object
2. Verify `_items` has more than 100 entries (BRD says ~150)
3. Verify all `_items` values are non-empty strings
4. Verify `_items` entry counts are identical across all 12 files

**Expected result:**
- Every catalog has `_items` object with ~150+ entries
- All values are non-empty strings
- Entry counts are consistent across all files

**Implementation notes:**
- Filesystem-only. Single test with soft assertions per file.

---

### TC-103: Key counts match across catalogs (no keys lost)

**Traces to:** REQ-001 → AC-7; REQ-007 → AC-1, AC-2, AC-3
**Type:** Progression
**Spec file:** `intake-i18n-catalogs.spec.ts`
**Priority:** Critical

**Preconditions:**
- All 12 `ui_{lang}.json` files exist and are valid JSON

**Steps:**
1. Load `ui_en.json` and count top-level keys (excluding `_items`)
2. For each of the other 11 language files, count top-level keys (excluding `_items`)
3. Verify all files have the same UI key count as English
4. Verify UI key count is greater than 350 (BRD says ~400)

**Expected result:**
- All 12 files have identical UI key counts
- Key count exceeds 350

**Implementation notes:**
- Filesystem-only. Data-driven loop.

---

### TC-104: `_items` entries match across EN, RU, HE catalogs

**Traces to:** REQ-007 → AC-4
**Type:** Progression
**Spec file:** `intake-i18n-catalogs.spec.ts`
**Priority:** High

**Preconditions:**
- `ui_en.json`, `ui_ru.json`, `ui_he.json` exist and are valid JSON

**Steps:**
1. Load all three files and extract `_items` keys
2. Verify EN, RU, HE `_items` have identical key sets (same English item names as keys)
3. Verify EN `_items` values are identity mappings (value === key for each entry)
4. Verify RU `_items` values differ from keys for at least 50% of entries (real translations exist)
5. Verify HE `_items` values differ from keys for at least 50% of entries

**Expected result:**
- Identical key sets across EN/RU/HE
- EN has identity mappings; RU and HE have actual translations

**Implementation notes:**
- Filesystem-only. Percentage threshold avoids brittleness if some items lack translations.

---

### TC-105: Fallback language files are copies of English

**Traces to:** REQ-001 → AC-4, AC-7 (implicit: fallback languages have English content)
**Type:** Progression
**Spec file:** `intake-i18n-catalogs.spec.ts`
**Priority:** Medium

**Preconditions:**
- `ui_en.json` and 9 fallback files exist

**Steps:**
1. Load `ui_en.json` as reference
2. For each fallback language (es, fr, de, it, pt, zh, ja, ko, ar), load the file
3. Verify top-level key sets match English exactly
4. Verify `_items` key sets match English exactly
5. Verify `_items` values are identity mappings (English names)

**Expected result:**
- All 9 fallback files have same keys as English
- `_items` values are English identity mappings

**Implementation notes:**
- Filesystem-only. Soft assertions per language.

---

### TC-106: `data-i18n` attribute count in HTML is unchanged

**Traces to:** REQ-007 → AC-5
**Type:** Progression
**Spec file:** `intake-i18n-catalogs.spec.ts`
**Priority:** High

**Preconditions:**
- `trip_intake.html` is accessible via HTTP

**Steps:**
1. Navigate to intake page
2. Count all elements with `data-i18n` attribute
3. Count all elements with `data-i18n-placeholder` attribute
4. Verify `data-i18n` count matches the key count in `ui_en.json` (excluding array keys like `months`, `days_short`, and `_items`)

**Expected result:**
- `data-i18n` element count is > 0 and consistent with catalog key count
- No orphaned references (every `data-i18n` value has a corresponding key in the catalog)

**Implementation notes:**
- Browser-based. Extract all `data-i18n` values via `page.evaluate()` and cross-reference with the parsed JSON file.

---

### TC-107: TRANSLATIONS and ITEM_I18N consts are removed from HTML

**Traces to:** REQ-002 → AC-9; REQ-003 → AC-6
**Type:** Progression
**Spec file:** `intake-i18n-catalogs.spec.ts`
**Priority:** Critical

**Preconditions:**
- `trip_intake.html` file is readable

**Steps:**
1. Read `trip_intake.html` file content as string
2. Search for `const TRANSLATIONS` or `var TRANSLATIONS` or `let TRANSLATIONS`
3. Search for `const ITEM_I18N` or `var ITEM_I18N` or `let ITEM_I18N`
4. Verify `_uiCache` variable declaration exists
5. Verify `_EMERGENCY_CATALOG` variable declaration exists
6. Verify `fetchUiCatalog` function exists

**Expected result:**
- No `TRANSLATIONS` const/var/let declaration found
- No `ITEM_I18N` const/var/let declaration found
- `_uiCache`, `_EMERGENCY_CATALOG`, and `fetchUiCatalog` are present

**Implementation notes:**
- Filesystem-only. Regex search on HTML file content.

---

### TC-108: setLanguage fetches external catalog on first call

**Traces to:** REQ-002 → AC-1
**Type:** Progression
**Spec file:** `intake-i18n-catalog-loading.spec.ts`
**Priority:** Critical

**Preconditions:**
- Intake page served via bridge server

**Steps:**
1. Navigate to intake page (default language loads)
2. Set up network request interception to monitor `locales/` fetches via `createRequestCounter(page, '**/locales/**')`
3. Switch to Russian language
4. Verify a `fetch()` request was made to `locales/ui_ru.json`
5. Verify the response status is 200
6. Verify `Content-Type` header is `application/json`

**Expected result:**
- Network request to `locales/ui_ru.json` observed
- Response is 200 with `application/json` content type

**Implementation notes:**
- Use shared `createRequestCounter()` utility for network monitoring.
- Language switch triggers via `IntakePage.switchLanguage()`.
- Call `await intakePage.waitForI18nReady()` after navigation.

---

### TC-109: Fetched catalogs are cached (no duplicate fetches)

**Traces to:** REQ-002 → AC-2
**Type:** Progression
**Spec file:** `intake-i18n-catalog-loading.spec.ts`
**Priority:** High

**Preconditions:**
- Intake page served via bridge server

**Steps:**
1. Navigate to intake page
2. Set up request counter for `locales/ui_ru.json` via `createRequestCounter(page, '**/locales/ui_ru.json')`
3. Switch to Russian → verify 1 fetch to `ui_ru.json`
4. Switch to English (cached from init) → verify 0 new fetches
5. Switch back to Russian → verify no additional fetch (still 1 total for `ui_ru.json`)

**Expected result:**
- `ui_ru.json` fetched exactly once across multiple language switches
- English catalog not re-fetched (loaded eagerly on init)

**Implementation notes:**
- Use shared `createRequestCounter()` utility.
- Call `await intakePage.waitForI18nReady()` after navigation.

---

### TC-110: Fallback chain works when catalog fetch fails

**Traces to:** REQ-002 → AC-3
**Type:** Progression
**Spec file:** `intake-i18n-catalog-loading.spec.ts`
**Priority:** Critical

**Preconditions:**
- Intake page served via bridge server

**Steps:**
1. Navigate to intake page (English loads successfully)
2. Use `page.route()` to intercept `locales/ui_ru.json` and respond with 404
3. Switch to Russian language
4. Verify the page still displays translated content (falls back to English)
5. Verify no untranslated keys (raw `data-i18n` attribute values) are visible

**Expected result:**
- Page displays English content as fallback (no crash, no raw keys)
- All `data-i18n` elements have non-empty text content

**Implementation notes:**
- Use `page.route('**/locales/ui_ru.json', route => route.fulfill({ status: 404 }))`.
- Validate by checking that `data-i18n` elements have non-key-like text content.
- Call `await intakePage.waitForI18nReady()` after navigation.

---

### TC-111: Emergency catalog activates when all fetches fail

**Traces to:** REQ-002 → AC-3 (emergency fallback)
**Type:** Progression
**Spec file:** `intake-i18n-catalog-loading.spec.ts`
**Priority:** High

**Preconditions:**
- Intake page served via bridge server

**Steps:**
1. Use `page.route()` to intercept ALL `locales/*.json` requests and respond with 500
2. Navigate to intake page
3. Verify the page eventually becomes visible (not stuck in loading state)
4. Verify at least the critical navigation elements (step names, buttons) display emergency English text

**Expected result:**
- Page loads despite all catalog fetches failing
- Emergency catalog provides minimal navigation labels
- Page is not stuck in `i18n-loading` state forever

**Implementation notes:**
- Route all `**/locales/*.json` to 500 error. Check `body.i18n-loading` class is eventually removed.
- Validate a subset of critical `data-i18n` elements have non-empty text.
- Call `await intakePage.waitForI18nReady()` after navigation (will resolve once emergency catalog kicks in).

---

### TC-112: English catalog is eagerly loaded on page init

**Traces to:** REQ-002 → AC-4; REQ-005 → AC-1
**Type:** Progression
**Spec file:** `intake-i18n-catalog-loading.spec.ts`
**Priority:** Critical

**Preconditions:**
- Intake page served via bridge server

**Steps:**
1. Set up network request monitoring before navigation via `createRequestCounter(page, '**/locales/ui_en.json')`
2. Navigate to intake page
3. Verify `locales/ui_en.json` is fetched during initial page load (before any user interaction)
4. Verify the fetch completes before the page becomes visible (before `i18n-loading` class is removed)

**Expected result:**
- `ui_en.json` is among the first network requests on page load
- Page content is visible only after English catalog loads

**Implementation notes:**
- Use shared `createRequestCounter()` utility to capture request timing relative to page events.
- Verify `body` does NOT have `i18n-loading` class after load completes.
- Call `await intakePage.waitForI18nReady()` after navigation.

---

### TC-113: All data-i18n and data-i18n-placeholder elements translated correctly

**Traces to:** REQ-002 → AC-5
**Type:** Progression
**Spec file:** `intake-i18n-catalog-loading.spec.ts`
**Priority:** Critical

**Preconditions:**
- Intake page served via bridge server

**Steps:**
1. Navigate to intake page (English loads)
2. Collect all `data-i18n` attribute values and corresponding `textContent`
3. Switch to Russian
4. Re-collect all `data-i18n` attribute values and corresponding `textContent`
5. Verify that elements whose `data-i18n` keys exist in the Russian catalog show different text from English (for keys that have actual translations)
6. Verify no element displays a raw key string (e.g., `"hero_title"`)

**Expected result:**
- After switching to RU, translated elements display different text from English
- No raw translation keys visible as content

**Implementation notes:**
- Use `page.evaluate()` to extract key-value pairs. Compare EN vs RU text.
- Language-agnostic: do not hardcode expected translation strings. Just verify text differs from key names.
- Call `await intakePage.waitForI18nReady()` after navigation.

---

### TC-114: RTL direction setting works for Hebrew and Arabic

**Traces to:** REQ-002 → AC-6
**Type:** Progression
**Spec file:** `intake-i18n-catalog-loading.spec.ts`
**Priority:** High

**Preconditions:**
- Intake page served via bridge server

**Steps:**
1. Navigate to intake page (default LTR)
2. Verify `html[dir]` is `"ltr"` (or absent)
3. Switch to Hebrew
4. Verify `html[dir]` is `"rtl"`
5. Switch to Arabic
6. Verify `html[dir]` is `"rtl"`
7. Switch back to English
8. Verify `html[dir]` is `"ltr"`

**Expected result:**
- `dir="rtl"` set for Hebrew and Arabic
- `dir="ltr"` restored for LTR languages

**Implementation notes:**
- Simple attribute check via `page.locator('html').getAttribute('dir')`.
- Call `await intakePage.waitForI18nReady()` after navigation.

---

### TC-115: localStorage persistence works across reloads

**Traces to:** REQ-002 → AC-7
**Type:** Progression
**Spec file:** `intake-i18n-catalog-loading.spec.ts`
**Priority:** High

**Preconditions:**
- Intake page served via bridge server

**Steps:**
1. Navigate to intake page
2. Switch to Russian
3. Verify `localStorage.getItem('tripIntakeLang')` returns the selected language code
4. Reload the page
5. Verify the page loads in Russian (the persisted language)
6. Verify `html[lang]` attribute matches the persisted language

**Expected result:**
- Language choice persisted in `localStorage`
- Page reloads in the persisted language

**Implementation notes:**
- Use `page.evaluate(() => localStorage.getItem('tripIntakeLang'))` to read storage.
- Use `page.reload()` and verify `html[lang]`.
- Call `await intakePage.waitForI18nReady()` after navigation and after reload.

---

### TC-116: Cached language switch is visually instant (no FOUC)

**Traces to:** REQ-002 → AC-8; REQ-005 → AC-5
**Type:** Progression
**Spec file:** `intake-i18n-catalog-loading.spec.ts`
**Priority:** High

**Preconditions:**
- Intake page served via bridge server

**Steps:**
1. Navigate to intake page
2. Switch to Russian (triggers fetch + cache)
3. Switch to English (cached)
4. Switch to Russian again (cached)
5. Verify `body` never has `i18n-loading` class during cached switches
6. Verify no `data-i18n` element shows raw key text at any point during cached switches

**Expected result:**
- No `i18n-loading` class on body during cached switches
- Immediate translation without intermediate untranslated state

**Implementation notes:**
- After initial load, cached switches are synchronous. Monitor `body.classList` via `page.evaluate()`.
- Call `await intakePage.waitForI18nReady()` after navigation.

---

### TC-117: User's persisted language catalog loaded before first render

**Traces to:** REQ-005 → AC-2
**Type:** Progression
**Spec file:** `intake-i18n-catalog-loading.spec.ts`
**Priority:** Critical

**Preconditions:**
- Intake page served via bridge server

**Steps:**
1. Set `localStorage.tripIntakeLang` to `'ru'` via `page.evaluate()` before navigation
2. Set up network request monitoring via `createRequestCounter(page, '**/locales/**')`
3. Navigate to intake page
4. Verify both `ui_en.json` and `ui_ru.json` are fetched during initial load
5. Verify `body.i18n-loading` class is removed only after both catalogs load
6. Verify the page displays Russian translations on first visible render

**Expected result:**
- Two catalog requests on cold load (EN + RU)
- No flash of English content before Russian renders
- `body.i18n-loading` removed after both catalogs are fetched

**Implementation notes:**
- Use `page.addInitScript()` to set localStorage before the page loads.
- Use shared `createRequestCounter()` utility.
- Monitor request completion and class removal timing.
- Call `await intakePage.waitForI18nReady()` after navigation.

---

### TC-118: Cold load makes at most 2 network requests for catalogs

**Traces to:** REQ-005 → AC-3
**Type:** Progression
**Spec file:** `intake-i18n-catalog-loading.spec.ts`
**Priority:** Critical

**Preconditions:**
- Intake page served via bridge server

**Steps:**
1. Clear browser cache and localStorage
2. Set up network request counter for `locales/*.json` via `createRequestCounter(page, '**/locales/*.json')`
3. Navigate to intake page (English user — no persisted language)
4. Verify exactly 1 catalog request (EN only)
5. Clear cache and set `localStorage.tripIntakeLang` to `'he'`
6. Navigate again
7. Verify exactly 2 catalog requests (EN + HE)

**Expected result:**
- English user: 1 request
- Non-English user: 2 requests
- Never more than 2

**Implementation notes:**
- Use shared `createRequestCounter()` utility filtered to `locales/` URL pattern.
- Call `await intakePage.waitForI18nReady()` after each navigation.

---

### TC-119: Bridge server Cache-Control headers for locale files

**Traces to:** REQ-005 → AC-4
**Type:** Progression
**Spec file:** `intake-i18n-catalog-loading.spec.ts`
**Priority:** Medium

**Preconditions:**
- Intake page served via `trip_bridge.js`

**Steps:**
1. Navigate to intake page
2. Intercept the response for `locales/ui_en.json`
3. Verify `Cache-Control` response header contains `max-age` directive
4. Verify `Content-Type` header is `application/json`

**Expected result:**
- `Cache-Control` header present with caching directive
- Correct `Content-Type`

**Implementation notes:**
- Use `page.on('response')` to capture response headers for locale requests.
- Call `await intakePage.waitForI18nReady()` after navigation.

---

### TC-120: No flash of untranslated content on initial load

**Traces to:** REQ-005 → AC-5
**Type:** Progression
**Spec file:** `intake-i18n-catalog-loading.spec.ts`
**Priority:** Critical

**Preconditions:**
- Intake page served via bridge server

**Steps:**
1. Navigate to intake page
2. Immediately after `domcontentloaded`, check if `body` has `i18n-loading` class
3. While `i18n-loading` is active, verify `data-i18n` elements have `visibility: hidden`
4. After loading completes, verify `i18n-loading` class is removed
5. Verify all visible `data-i18n` elements have non-key text content

**Expected result:**
- `i18n-loading` class present during catalog loading
- Elements with `data-i18n` hidden until translations applied
- Class removed after translations loaded

**Implementation notes:**
- Use `page.evaluate()` immediately after `goto()` to check class state.
- Verify CSS rule `body.i18n-loading [data-i18n] { visibility: hidden }` is effective.
- Call `await intakePage.waitForI18nReady()` after navigation.

---

### TC-121: Interest/avoid/food/vibe cards display correctly in EN, RU, HE

**Traces to:** REQ-003 → AC-2, AC-3, AC-4
**Type:** Progression
**Spec file:** `intake-i18n-catalog-loading.spec.ts`
**Priority:** Critical

**Preconditions:**
- Intake page served via bridge server
- Must navigate to interest cards step (Step 3+)

**Steps:**
1. Navigate to intake page, complete Steps 0-1, select depth, reach interest cards
2. In English: verify all interest cards have visible non-empty names
3. Verify all cards have `data-en-name` attribute (English name preserved for markdown)
4. Switch to Russian: verify card names change (at least some differ from English)
5. Switch to Hebrew: verify card names change again
6. Verify `data-en-name` attribute values remain unchanged across all language switches

**Expected result:**
- Cards display translated names in RU and HE
- `data-en-name` always contains English name regardless of display language
- No empty or key-like display names

**Implementation notes:**
- Use `IntakePage.setupWithDepth(20)` then `IntakePage.navigateToStep(3)`.
- Compare display name vs `data-en-name` to verify translation occurred.
- Call `await intakePage.waitForI18nReady()` after navigation.

---

### TC-122: Card names in generated markdown output remain in English

**Traces to:** REQ-003 → AC-5
**Type:** Progression
**Spec file:** `intake-i18n-catalog-loading.spec.ts`
**Priority:** High

**Preconditions:**
- Intake page served via bridge server

**Steps:**
1. Set up intake wizard in Russian language
2. Navigate through all steps, selecting some interests
3. Reach the review/markdown step (Step 7)
4. Extract the generated markdown output
5. Verify selected interest names in the markdown are in English (matching `data-en-name`)

**Expected result:**
- Markdown output contains English interest names regardless of UI language

**Implementation notes:**
- Use `IntakePage.getRawMarkdown()` to extract output.
- Verify interest names match `data-en-name` values, not translated display names.
- Call `await intakePage.waitForI18nReady()` after navigation.

---

### TC-123: Page works via bridge server

**Traces to:** REQ-004 → AC-1, AC-5
**Type:** Progression
**Spec file:** `intake-i18n-catalog-loading.spec.ts`
**Priority:** Critical

**Preconditions:**
- `trip_bridge.js` running on `localhost:3456`

**Steps:**
1. Navigate to `http://localhost:3456/trip_intake.html`
2. Verify page loads without errors (no console errors related to catalog loading)
3. Verify language selector is functional
4. Switch to Russian and verify translations load
5. Navigate to `http://localhost:3456/locales/ui_en.json` directly and verify it returns valid JSON

**Expected result:**
- Intake page loads and functions correctly via bridge server
- Locale files accessible via `/locales/` path
- No fetch errors in browser console

**Implementation notes:**
- Use `page.on('console')` to capture and check for error-level messages related to i18n.
- Use `page.on('pageerror')` to catch unhandled exceptions.
- Call `await intakePage.waitForI18nReady()` after navigation.

---

### TC-124: `file://` protocol shows graceful error message

**Traces to:** REQ-004 → AC-4
**Type:** Progression
**Spec file:** `intake-i18n-catalog-loading.spec.ts` (within `test.describe('file:// protocol detection')` block)
**Priority:** High

**Preconditions:**
- Intake page served via bridge server (used as transport; file:// condition simulated)

**Steps:**
1. Use `page.route('**/locales/*.json', route => route.abort('blockedbyclient'))` to block ALL locale catalog requests (simulates `fetch()` failure that occurs on `file://` protocol)
2. Use `page.addInitScript(() => { Object.defineProperty(location, 'protocol', { get: () => 'file:' }) })` to override `window.location.protocol` to return `'file:'` (simulates file:// detection logic)
3. Navigate to intake page via bridge server (`http://localhost:3456/trip_intake.html`)
4. Verify an error overlay/message is displayed (the page's protocol detection logic fires due to the overridden protocol)
5. Verify the overlay has a structural selector indicating the server requirement message (e.g., `[data-i18n="file_protocol_error"]` or `.file-protocol-overlay`)
6. Verify the wizard form is NOT visible behind the overlay
7. Verify the overlay has `z-index` covering the entire viewport

**Expected result:**
- Full-page error overlay displayed when `window.location.protocol` returns `'file:'`
- Error message overlay is informative (mentions server requirement via structural element check)
- No wizard content visible behind the overlay

**Implementation notes:**
- This approach simulates the `file://` condition without actual `file://` navigation, which is unreliable in headless CI environments. The combination of `page.route()` blocking all locale requests AND `page.addInitScript()` overriding `window.location.protocol` faithfully reproduces both symptoms of `file://` access: (a) the protocol check returns `'file:'`, and (b) `fetch()` calls fail.
- Language-agnostic: verify overlay element exists with expected CSS properties (`position: fixed`, `z-index: 9999`), not text content.
- No separate spec file needed — this is a `test.describe` block within `intake-i18n-catalog-loading.spec.ts` that uses the same bridge server baseURL.

---

### TC-125: No build step required

**Traces to:** REQ-004 → AC-3
**Type:** Progression
**Spec file:** `intake-i18n-catalogs.spec.ts`
**Priority:** Medium

**Preconditions:**
- Project directory accessible

**Steps:**
1. Verify all `locales/*.json` files are plain JSON (no TypeScript, no JSX, no import statements)
2. Verify `trip_intake.html` does not reference any bundler output (no `.bundle.js`, no `dist/`, no `build/`)
3. Verify no `package.json` dependencies added for build tools

**Expected result:**
- All locale files are raw JSON parseable by `JSON.parse()`
- No build artifacts referenced

**Implementation notes:**
- Filesystem-only. Check file extensions and content.

---

### TC-126: Rule file updates — trip_intake_rules.md

**Traces to:** REQ-006 → AC-1, AC-2, AC-3, AC-4, AC-7
**Type:** Progression
**Spec file:** `intake-i18n-catalogs.spec.ts`
**Priority:** High

**Preconditions:**
- `trip_intake_rules.md` file exists

**Steps:**
1. Read `trip_intake_rules.md` content
2. Verify it contains references to `locales/` folder structure (AC-1)
3. Verify it documents `setLanguage()` fetching external JSON catalogs (AC-2)
4. Verify "How to Modify" section includes instructions for adding UI text to `ui_{lang}.json` (AC-3)
5. Verify "How to Modify" section includes instructions for adding items to `_items` key (AC-4)
6. Verify existing i18n rules (RTL, `data-i18n` convention) are still present (AC-7)

**Expected result:**
- All 5 documentation items present in the file
- Existing valid rules retained

**Implementation notes:**
- Filesystem-only. Use regex/string search on file content.
- Language-agnostic: search for structural patterns (`locales/`, `ui_{lang}.json`, `_items`), not natural language text.

---

### TC-127: Rule file updates — trip_intake_design.md

**Traces to:** REQ-006 → AC-5, AC-6, AC-7
**Type:** Progression
**Spec file:** `intake-i18n-catalogs.spec.ts`
**Priority:** High

**Preconditions:**
- `trip_intake_design.md` file exists

**Steps:**
1. Read `trip_intake_design.md` content
2. Verify it documents the async fetch mechanism and caching strategy (AC-5)
3. Verify it documents that the page requires HTTP serving (AC-6)
4. Verify existing valid rules (RTL, `data-i18n`, `setLanguage` steps) are retained (AC-7)

**Expected result:**
- Fetch/cache/fallback documentation present
- HTTP requirement documented
- Existing rules not removed

**Implementation notes:**
- Filesystem-only. Search for key terms: `fetch`, `cache`, `_uiCache`, `file://`, `HTTP`.

---

### TC-128: tItem() returns correct translations for RU and HE

**Traces to:** REQ-003 → AC-2, AC-3
**Type:** Progression
**Spec file:** `intake-i18n-catalog-loading.spec.ts`
**Priority:** High

**Preconditions:**
- Intake page served via bridge server

**Steps:**
1. Navigate to intake page
2. Extract the first item key dynamically from the loaded catalog: `const firstItem = await page.evaluate(() => Object.keys(window._uiCache?.en?._items ?? {})[0])`
3. In English: evaluate `tItem(firstItem)` → should return the same English name (identity mapping)
4. Switch to Russian: evaluate the same `tItem(firstItem)` call → should return a non-English string (different from the key)
5. Switch to Spanish (fallback): evaluate the same `tItem(firstItem)` call → should return the English name (fallback identity)

**Expected result:**
- EN: identity mapping (English name returned)
- RU: translated name (different from English)
- ES: English fallback (identity)

**Implementation notes:**
- Use `page.evaluate()` to call `tItem()` directly. Do not hardcode expected translations — just verify RU differs from EN and ES equals EN.
- Item name is extracted dynamically from the loaded catalog via `page.evaluate()`, not hardcoded. This ensures the test is data-driven and resilient to item database changes.
- Call `await intakePage.waitForI18nReady()` after navigation.

---

### TC-129: Race condition guard on rapid language switching

**Traces to:** REQ-002 → AC-8 (rapid switches); DD §1.12 (sequence counter)
**Type:** Progression
**Spec file:** `intake-i18n-catalog-loading.spec.ts`
**Priority:** High

**Preconditions:**
- Intake page served via bridge server

**Steps:**
1. Navigate to intake page
2. Add artificial network delay to `ui_ru.json` (300ms) and `ui_he.json` (100ms) via `page.route()`
3. Rapidly switch: EN → RU → HE (without waiting for RU to load)
4. Wait for all network activity to settle
5. Verify the final language displayed is Hebrew (the last selected language)
6. Verify `html[lang]` is `"he"`
7. Verify `html[dir]` is `"rtl"`

**Expected result:**
- Final displayed language matches the last user selection (Hebrew)
- Stale Russian catalog does not overwrite the Hebrew translations

**Implementation notes:**
- Use `page.route()` with `route.fulfill()` after a delay to simulate slow network.
- Switch languages programmatically via `IntakePage.switchLanguage()` without awaiting intermediate results.
- Call `await intakePage.waitForI18nReady()` after navigation.

---

### TC-130: Calendar month and day names use external catalogs

**Traces to:** REQ-002 → AC-5 (calendar translations); DD §1.16
**Type:** Regression
**Spec file:** `intake-i18n-catalog-loading.spec.ts`
**Priority:** High

**Preconditions:**
- Intake page served via bridge server
- Calendar/date picker accessible

**Steps:**
1. Navigate to intake page, open date picker
2. Verify day-of-week headers are in English
3. Switch to Russian, re-open date picker if needed
4. Verify day-of-week headers are NOT in English (translated)
5. Verify month name in calendar header is NOT in English

**Expected result:**
- Calendar day/month names translated when language switches
- Translations sourced from external catalogs (not inline)

**Implementation notes:**
- Reuses existing test pattern from `intake-i18n-full.spec.ts` TC-065.
- Validates the calendar reads from `_uiCache` instead of removed `TRANSLATIONS`.
- Call `await intakePage.waitForI18nReady()` after navigation.

---

### TC-131: Post-extraction validation — data-i18n keys map to catalog

**Traces to:** REQ-007 → AC-5, AC-6
**Type:** Progression
**Spec file:** `intake-i18n-catalogs.spec.ts`
**Priority:** Critical

**Preconditions:**
- Intake page served via bridge server; `ui_en.json` readable from filesystem

**Steps:**
1. Load `ui_en.json` and collect all non-special keys (exclude `_items`, `months`, `days_short`)
2. Navigate to intake page
3. Collect all unique `data-i18n` attribute values from the DOM
4. Collect all unique `data-i18n-placeholder` attribute values from the DOM
5. Verify every `data-i18n` value exists as a key in the English catalog
6. Verify every `data-i18n-placeholder` value exists as a key in the English catalog

**Expected result:**
- Zero orphaned `data-i18n` references (every DOM attribute has a catalog key)
- Zero orphaned `data-i18n-placeholder` references

**Implementation notes:**
- Hybrid test: filesystem read for JSON + browser DOM query.
- Report all missing keys via `expect.soft()` for detailed failure messages.

---

## 4. Coverage Matrix

| BRD Requirement | Acceptance Criterion | Test Case(s) | Assertion Type | Notes |
|---|---|---|---|---|
| REQ-001 | AC-1: `locales/` folder exists | TC-100 | Hard | |
| REQ-001 | AC-2: 12 `ui_{lang}.json` files exist | TC-100 | Soft (per file) | |
| REQ-001 | AC-3: Shared items file (merged into `_items`) | TC-100, TC-102 | Hard | |
| REQ-001 | AC-4: Flat key-value, keys match data-i18n | TC-101, TC-106 | Hard | |
| REQ-001 | AC-5: `_items` mirrors ITEM_I18N | TC-102, TC-104 | Hard | |
| REQ-001 | AC-6: Valid JSON | TC-101 | Hard | |
| REQ-001 | AC-7: Key count matches | TC-103 | Hard | |
| REQ-002 | AC-1: setLanguage fetches via fetch() | TC-108 | Hard | |
| REQ-002 | AC-2: Catalogs cached in memory | TC-109 | Hard | |
| REQ-002 | AC-3: Fallback chain (target → EN → emergency) | TC-110, TC-111 | Hard | |
| REQ-002 | AC-4: English eagerly loaded | TC-112 | Hard | |
| REQ-002 | AC-5: data-i18n/placeholder translated | TC-113 | Soft (per element) | |
| REQ-002 | AC-6: RTL direction | TC-114 | Hard | |
| REQ-002 | AC-7: localStorage persistence | TC-115 | Hard | |
| REQ-002 | AC-8: Cached switch instant | TC-116 | Hard | |
| REQ-002 | AC-9: TRANSLATIONS removed | TC-107 | Hard | |
| REQ-003 | AC-1: items loaded on init | TC-102, TC-112 | Hard | |
| REQ-003 | AC-2: tItem correct RU/HE | TC-121, TC-128 | Hard | |
| REQ-003 | AC-3: tItem EN fallback | TC-128 | Hard | |
| REQ-003 | AC-4: Cards display correctly | TC-121 | Soft (per card) | |
| REQ-003 | AC-5: Markdown English names | TC-122 | Hard | |
| REQ-003 | AC-6: ITEM_I18N removed | TC-107 | Hard | |
| REQ-004 | AC-1: Works via bridge server | TC-123 | Hard | |
| REQ-004 | AC-2: Works via any static HTTP server | TC-123 | Hard | Validated by manual testing during Phase 6 (render + regression) and by architectural guarantee: the page uses standard `fetch()` with relative URLs, which works identically on any HTTP server. No dedicated automation test needed — the bridge server test (TC-123) confirms the fetch/serve pattern works; server implementation differences are outside test scope. |
| REQ-004 | AC-3: No build step | TC-125 | Hard | |
| REQ-004 | AC-4: file:// shows error | TC-124 | Hard | Simulated via `page.route()` + `page.addInitScript()` (see TC-124 for details) |
| REQ-004 | AC-5: Bridge serves locales/ | TC-108, TC-123 | Hard | |
| REQ-005 | AC-1: EN loaded before first render | TC-112 | Hard | |
| REQ-005 | AC-2: User's lang loaded before showing | TC-117 | Hard | |
| REQ-005 | AC-3: At most 2 requests cold load | TC-118 | Hard | |
| REQ-005 | AC-4: Cache-Control headers | TC-119 | Hard | |
| REQ-005 | AC-5: No FOUC | TC-116, TC-120 | Hard | |
| REQ-006 | AC-1: rules.md documents locales/ structure | TC-126 | Soft | |
| REQ-006 | AC-2: rules.md documents async fetch | TC-126 | Soft | |
| REQ-006 | AC-3: rules.md How to Modify (UI text) | TC-126 | Soft | |
| REQ-006 | AC-4: rules.md How to Modify (items) | TC-126 | Soft | |
| REQ-006 | AC-5: design.md documents fetch/cache/fallback | TC-127 | Soft | |
| REQ-006 | AC-6: design.md documents HTTP requirement | TC-127 | Soft | |
| REQ-006 | AC-7: Existing rules retained | TC-126, TC-127 | Soft | |
| REQ-007 | AC-1: EN keys match | TC-103 | Hard | |
| REQ-007 | AC-2: RU keys match | TC-103 | Hard | |
| REQ-007 | AC-3: HE keys match | TC-103 | Hard | |
| REQ-007 | AC-4: ITEM_I18N entries match | TC-104 | Hard | |
| REQ-007 | AC-5: data-i18n count unchanged | TC-106, TC-131 | Hard | |
| REQ-007 | AC-6: Validation step exists | TC-103, TC-104, TC-131 | Hard | |

## 5. Test Data Dependencies

| Data Source | What's Used | Update Needed? |
|---|---|---|
| `locales/ui_en.json` | Key count, key names, `_items` structure | Yes — must exist after implementation |
| `locales/ui_ru.json` | Translation values, `_items` translations | Yes — must exist after implementation |
| `locales/ui_he.json` | Translation values, `_items` translations | Yes — must exist after implementation |
| `locales/ui_{fallback}.json` (9 files) | Key count, `_items` identity mappings | Yes — must exist after implementation |
| `trip_intake.html` | DOM structure, `data-i18n` attributes, removed consts | Yes — modified by implementation |
| `trip_bridge.js` | HTTP serving of `/locales/` and `/trip_intake.html` | Yes — modified by implementation |
| `trip_intake_rules.md` | Documentation content | Yes — updated by implementation |
| `trip_intake_design.md` | Documentation content | Yes — updated by implementation |
| `IntakePage.ts` | Existing locators for language switching | Yes — add mandatory `waitForI18nReady()` helper |

## 6. Risk & Mitigation

| Risk | Mitigation |
|---|---|
| Bridge server not running during test execution | Use Playwright `webServer` config to auto-start `trip_bridge.js` before tests run; config includes `reuseExistingServer: true`, `timeout: 10000`, and health check URL `http://localhost:3456/trip_intake.html` |
| Port 3456 already in use | `webServer.reuseExistingServer: true` allows tests to use an existing server instance |
| Network interception tests are timing-sensitive | Use Playwright's built-in `page.route()` (synchronous interception) instead of external proxies; avoid `waitForTimeout` — use web-first assertions |
| `file://` protocol test may not work in CI headless mode | TC-124 uses `page.route()` + `page.addInitScript()` to simulate the `file://` condition without actual `file://` navigation, ensuring reliable CI execution |
| Flakiness from race condition test (TC-129) | Use deterministic delays via `page.route()` instead of relying on real network timing; set generous assertion timeouts |
| Existing intake tests may break if inline TRANSLATIONS removed | Existing intake i18n tests (TC-064 through TC-069) validate DOM structure and behavior, not inline JS objects — they should pass unchanged. Explicit regression gate: run existing `intake-i18n-full.spec.ts` as-is before merging. No modifications to existing tests permitted. |
| Language-independence lint guard may flag new test files | Ensure new spec files use no hardcoded Cyrillic or language-specific strings. Verify translations occurred by comparing text across language switches, not by matching specific strings. |
| `waitForI18nReady()` not called leads to flaky tests | Helper is mandatory for all browser-based tests (documented in §2). Implementation review must verify every test calls it after navigation. |

## 7. Estimated Impact

- **New test count:** 32 test cases across 2 spec files
  - `intake-i18n-catalogs.spec.ts` — 10 tests (filesystem validation, data integrity, rule file checks)
  - `intake-i18n-catalog-loading.spec.ts` — 22 tests (browser-based catalog loading, language switching, fallback, caching, rendering, file:// protocol detection)
- **Progression vs Regression:** 31 progression + 1 regression (TC-130 validates existing calendar behavior still works with external catalogs)
- **New locators needed:** 0 — existing `IntakePage.ts` already has `langSelector`, `switchLanguage()`, interest/avoid/food/vibe card locators. New assertions use `page.evaluate()` and `page.route()` for network monitoring.
- **New POM methods needed:** 1 mandatory — `waitForI18nReady()` helper to `IntakePage.ts` that waits for `body.i18n-loading` to be removed. Implementation: `await this.page.waitForFunction(() => !document.body.classList.contains('i18n-loading'))`.
- **Shared utility needed:** 1 — `createRequestCounter(page, urlPattern)` in `tests/intake/utils/request-counter.ts`. Returns `{ count: number, requests: Request[] }`. Used by TC-108, TC-109, TC-112, TC-117, TC-118.
- **Estimated runtime increase:** ~25-35 seconds (filesystem tests are instant; browser tests require page loads + language switches; race condition test adds ~500ms of artificial delay)
- **Files added:** 2 new spec files under `tests/intake/`, 1 utility file under `tests/intake/utils/`
- **Files modified:** `IntakePage.ts` (add mandatory `waitForI18nReady()` helper); `playwright.config.ts` (add intake project with HTTP baseURL + webServer config including `reuseExistingServer: true`, `timeout: 10000`, health check URL)
- **Configuration changes:** Add `webServer` block to `playwright.config.ts` to auto-start `trip_bridge.js`; add new project for intake tests with `baseURL: 'http://localhost:3456'`
- **Regression gate:** Run existing `intake-i18n-full.spec.ts` (TC-064 through TC-069) unchanged before merging — no modifications permitted
