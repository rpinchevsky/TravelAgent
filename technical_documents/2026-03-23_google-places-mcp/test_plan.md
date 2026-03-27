# Test Plan

**Change:** Google Places MCP Integration — POI Enrichment, Phone/Rating Fields, Wheelchair Accessibility Question
**Date:** 2026-03-23
**Author:** Automation Engineer
**BRD Reference:** business_requirements.md
**DD Reference:** detailed_design.md
**Status:** Draft

---

## 1. Test Scope

**In scope:**
- Structural validation of new POI card elements (phone `tel:` links, `.poi-card__rating` elements, `.poi-card__accessible` badges) in generated trip HTML
- Link order validation (phone link position in the link row)
- Wheelchair accessibility question visibility, structure, default state, selection behavior, and markdown output on the trip intake page
- i18n key presence for wheelchair question across all 12 locale files

**Out of scope:**
- MCP server configuration and connectivity (REQ-001) — infrastructure concern, not testable via Playwright
- Markdown format correctness (REQ-002, REQ-004) — tested indirectly through HTML structural validation
- Pipeline behavior and data flow (REQ-007, REQ-008) — runtime orchestration, not static HTML/DOM
- Google Places API data accuracy — external service, not under test control
- Visual regression screenshots for new elements — deferred to visual.spec.ts update if needed

**Test type:** Both Progression and Regression

---

## 2. Test Environment

- **Browser:** Chromium (desktop viewport)
- **Framework:** Playwright + TypeScript
- **Fixture (trip HTML tests):** Shared-page (`tests/fixtures/shared-page.ts`) — read-only DOM assertions
- **Fixture (intake tests):** Standard `@playwright/test` — tests require clicks and navigation (mutations)
- **Target file (trip):** `trip_full_{LANG}.html` (auto-discovered via `resolveLatestTrip`)
- **Target file (intake):** `http://localhost:3456/trip_intake.html` (via `trip_bridge.js` web server)
- **Project:** `desktop-chromium` (single project, no viewport duplication)

---

## 3. Test Cases

### TC-142: POI cards with phone numbers use valid `tel:` links

**Traces to:** REQ-009 → AC-1, AC-3; REQ-003 → AC-2, AC-3, AC-4
**Type:** Progression
**Spec file:** `poi-cards.spec.ts` (append to existing "POI Cards — Content & Links" describe block)
**Priority:** Critical
**Preconditions:** Trip HTML generated with Google Places enrichment; at least some POIs have phone numbers.
**Steps:**
1. Query all `.poi-card .poi-card__link[href^="tel:"]` elements across the page.
2. For each phone link found, extract the `href` attribute.
3. Validate the `href` matches the pattern `^tel:\+?[\d\s\-()]+$`.
**Expected result:** Every phone link has a well-formed `tel:` href. Zero phone links is acceptable (phone is "when available"), but if any exist, each must be structurally valid.
**Implementation notes:**
- Use `expect.soft()` for per-link assertions with descriptive messages (`Phone link ${i}: valid tel: href`).
- Do NOT assert a minimum count — phone numbers are optional per BRD.
- Use `tripPage.page.locator()` with the CSS selector; no text-based matching.
- New POM method needed: `getPoiCardPhoneLink(poiCard)` in `TripPage.ts`.

---

### TC-143: Phone links appear in the correct link-row position (after Photo)

**Traces to:** REQ-003 → AC-2; REQ-009 → AC-1
**Type:** Progression
**Spec file:** `poi-cards.spec.ts` (append)
**Priority:** High
**Preconditions:** Trip HTML with at least one POI card containing a phone link.
**Steps:**
1. For each non-exempt POI card (`.poi-card:not([data-link-exempt])`), collect all `.poi-card__link` elements in DOM order.
2. If a `tel:` link exists among them, verify it is the last link in the row (index = linkCount - 1), consistent with the mandated order: Maps, Site, Photo, Phone.
**Expected result:** Phone link, when present, is the final link in the `.poi-card__links` row.
**Implementation notes:**
- Use a single `page.evaluate()` to batch DOM queries for performance.
- Soft-assert per POI card: `expect.soft(phoneIndex, 'POI ${name}: phone link should be last')`.
- Language-independent: identifies phone by `href^="tel:"`, not by link text.

---

### TC-144: POI cards with ratings have `.poi-card__rating` elements with numeric content

**Traces to:** REQ-009 → AC-2, AC-3; REQ-005 → AC-1, AC-2, AC-3, AC-5
**Type:** Progression
**Spec file:** `poi-cards.spec.ts` (append)
**Priority:** Critical
**Preconditions:** Trip HTML generated; some POIs have ratings from Google Places.
**Steps:**
1. Query all `.poi-card__rating` elements across the page.
2. For each, extract `textContent`.
3. Validate the text contains at least one digit (language-independent numeric check via `/\d/`).
**Expected result:** Every `.poi-card__rating` element contains numeric content. Zero rating elements is acceptable (ratings are "when available").
**Implementation notes:**
- Use `tripPage.poiCardRatings` (new global locator in TripPage.ts).
- Use `expect.soft()` with message `Rating ${i}: should contain a numeric value`.
- Do NOT assert specific rating format (e.g., "4.5/5") — that would be language-dependent.
- New POM locator needed: `poiCardRatings` and method `getPoiCardRating(poiCard)` in `TripPage.ts`.

---

### TC-145: Rating elements are positioned near POI name (not in link row)

**Traces to:** REQ-005 → AC-2
**Type:** Progression
**Spec file:** `poi-cards.spec.ts` (append)
**Priority:** High
**Preconditions:** Trip HTML with at least one `.poi-card__rating` element.
**Steps:**
1. For each POI card containing a `.poi-card__rating`, verify the rating element is inside `.poi-card__body` but NOT inside `.poi-card__links`.
2. Verify the rating is a sibling of `.poi-card__name` within the card body.
**Expected result:** Rating elements are structurally placed in the card body area near the name, not in the link row.
**Implementation notes:**
- Use `page.evaluate()` to check DOM ancestry: `rating.closest('.poi-card__links')` should be null, `rating.closest('.poi-card__body')` should exist.
- Soft-assert per card.

---

### TC-146: Accessibility badge elements use correct class

**Traces to:** REQ-005 → AC-4 (structural analog for accessibility indicator); REQ-007 → AC-2
**Type:** Progression
**Spec file:** `poi-cards.spec.ts` (append)
**Priority:** Medium
**Preconditions:** Trip HTML; wheelchair accessibility may or may not be active for this trip.
**Steps:**
1. Query all `.poi-card__accessible` elements.
2. For each, verify it is inside `.poi-card__body` (same structural check as rating).
3. Verify it is NOT inside `.poi-card__links`.
**Expected result:** Accessibility badges, when present, are positioned in the card body. Zero badges is acceptable if the trip does not require wheelchair accessibility.
**Implementation notes:**
- Use `expect.soft()` with count-aware message.
- New POM method needed: `getPoiCardAccessibleBadge(poiCard)` in `TripPage.ts`.
- This is a low-frequency test — most trips will have zero badges.

---

### TC-147: Wheelchair question visible on Step 6 regardless of depth

**Traces to:** REQ-010 → AC-1; REQ-006 → AC-1, AC-2
**Type:** Progression
**Spec file:** `intake-wheelchair.spec.ts` (new file)
**Priority:** Critical
**Preconditions:** Intake page loaded.
**Steps:**
1. Complete Steps 0-1 (prerequisite).
2. Select depth 10 (Quick Scan — minimal depth), confirm.
3. Navigate forward to Step 6.
4. Assert `[data-question-key="wheelchairAccessible"]` is visible.
5. Assert the question contains exactly 2 `.q-card` elements.
6. Repeat for depth 20 (Standard) and depth 30 (Deep Dive).
**Expected result:** The wheelchair question is visible on Step 6 at all three depth levels and always has exactly 2 option cards.
**Implementation notes:**
- Use standard `@playwright/test` import (mutations: clicks and navigation).
- Use `IntakePage.setupWithDepth()` + `navigateToStep(6)`.
- Data-driven loop over `[10, 20, 30]` depth values.
- Assert by DOM structure, not text.
- New POM locator needed: `wheelchairQuestion` in `IntakePage.ts`.

---

### TC-148: Wheelchair question defaults to "No Requirement" selected

**Traces to:** REQ-006 → AC-3; REQ-010 → AC-3
**Type:** Progression
**Spec file:** `intake-wheelchair.spec.ts`
**Priority:** High
**Preconditions:** Intake page loaded, navigated to Step 6.
**Steps:**
1. Complete setup with depth 20, navigate to Step 6.
2. Within `[data-question-key="wheelchairAccessible"]`, locate `.q-card.is-selected`.
3. Assert exactly 1 card is selected.
4. Assert the selected card has `data-value="no"`.
**Expected result:** The "No Requirement" card (data-value="no") is pre-selected by default.
**Implementation notes:**
- Language-independent: asserts `data-value` attribute, not card text.

---

### TC-149: Selecting wheelchair "yes" option deselects "no" and vice versa

**Traces to:** REQ-006 → AC-3; REQ-010 → AC-3
**Type:** Progression
**Spec file:** `intake-wheelchair.spec.ts`
**Priority:** High
**Preconditions:** Intake page on Step 6.
**Steps:**
1. Complete setup with depth 20, navigate to Step 6.
2. Click the `.q-card[data-value="yes"]` within the wheelchair question.
3. Assert "yes" card has `is-selected` class.
4. Assert only 1 card in the question has `is-selected`.
5. Click the `.q-card[data-value="no"]` to toggle back.
6. Assert "no" card has `is-selected` class and is the only selected card.
**Expected result:** Radio-style selection: clicking one option deselects the other.
**Implementation notes:**
- Use `expect(card).toHaveClass(/is-selected/)` web-first assertion.
- No hard sleeps.

---

### TC-150: Wheelchair "yes" selection produces field in markdown output

**Traces to:** REQ-010 → AC-2; REQ-006 → AC-4
**Type:** Progression
**Spec file:** `intake-wheelchair.spec.ts`
**Priority:** Critical
**Preconditions:** Intake page; can navigate through all steps to Step 7 (Review).
**Steps:**
1. Complete setup with depth 10 (minimal depth for fastest traversal).
2. Navigate to Step 6.
3. Click the wheelchair "yes" card (`[data-value="yes"]`).
4. Navigate to Step 7 (Review).
5. Extract raw markdown from the preview (`previewContent.dataset.rawMd`).
6. Assert the markdown contains `Wheelchair accessible` (English key, used in markdown output per DD §1.6).
7. Assert the value after the key is `yes`.
**Expected result:** The generated markdown includes `- **Wheelchair accessible:** yes`.
**Implementation notes:**
- Use `intake.getRawMarkdown()` to get the data-rawMd attribute.
- The field label `Wheelchair accessible` is the markdown output key (English-only in output, per DD §1.6 `generateMarkdown()` which uses English labels).
- This is the one exception to "no English text" rule: the markdown output key is always English regardless of UI language, matching existing patterns (e.g., `Accessibility needs`).

---

### TC-151: Wheelchair "no" selection (default) produces field in markdown output

**Traces to:** REQ-010 → AC-2; REQ-006 → AC-4
**Type:** Progression
**Spec file:** `intake-wheelchair.spec.ts`
**Priority:** High
**Preconditions:** Intake page.
**Steps:**
1. Complete setup with depth 10 (minimal depth).
2. Navigate directly to Step 7 (Review) without changing wheelchair default.
3. Extract raw markdown.
4. Assert the markdown contains `Wheelchair accessible` with value `no`.
**Expected result:** The generated markdown includes `- **Wheelchair accessible:** no` when the default "No Requirement" card is selected.
**Implementation notes:**
- Validates the default value flows through to output.
- Same approach as TC-150.

---

### TC-152: Wheelchair i18n keys present in all 12 locale files

**Traces to:** REQ-006 → AC-5
**Type:** Progression
**Spec file:** `intake-wheelchair.spec.ts`
**Priority:** High
**Preconditions:** All 12 locale files exist on disk.
**Steps:**
1. For each locale file (`ui_en.json` through `ui_ar.json`), read and parse JSON.
2. Assert the following 5 keys exist and have non-empty string values:
   - `s6_wheelchair`
   - `s6_wheelchair_no`
   - `s6_wheelchair_no_desc`
   - `s6_wheelchair_yes`
   - `s6_wheelchair_yes_desc`
**Expected result:** All 12 files contain all 5 keys with non-empty values.
**Implementation notes:**
- Static file analysis (no browser needed), but keep in spec file for consistency with existing `intake-mix-options.spec.ts` pattern (TC-138).
- Use `expect.soft()` per file/key pair.
- Use data-driven approach: array of locale codes, array of required keys.

---

### TC-153: Wheelchair question has correct i18n data-i18n attributes on DOM elements

**Traces to:** REQ-006 → AC-5
**Type:** Progression
**Spec file:** `intake-wheelchair.spec.ts`
**Priority:** Medium
**Preconditions:** Intake page loaded.
**Steps:**
1. Setup with depth 20, navigate to Step 6.
2. Within `[data-question-key="wheelchairAccessible"]`, verify:
   - Label element has `data-i18n="s6_wheelchair"`.
   - "No" card title has `data-i18n="s6_wheelchair_no"`.
   - "No" card description has `data-i18n="s6_wheelchair_no_desc"`.
   - "Yes" card title has `data-i18n="s6_wheelchair_yes"`.
   - "Yes" card description has `data-i18n="s6_wheelchair_yes_desc"`.
**Expected result:** All 5 i18n data attributes are present and correct.
**Implementation notes:**
- Single `page.evaluate()` call to batch all attribute queries.
- Language-independent: validates attribute values (i18n keys), not displayed text.

---

### TC-154: Non-exempt POI cards should have 3 or 4 link types (Maps, Site, Photo, optional Phone)

**Traces to:** REQ-003 → AC-2, AC-4; REQ-009 → AC-3
**Type:** Regression (modification of existing test)
**Spec file:** `poi-cards.spec.ts` (modify existing test "non-exempt POI cards should have all 3 link types")
**Priority:** Critical
**Preconditions:** Trip HTML with enriched POI cards.
**Steps:**
1. For each non-exempt POI card, count `.poi-card__link` elements.
2. Assert link count is 3 (Maps, Site, Photo) or 4 (Maps, Site, Photo, Phone).
3. Validate Maps, Site, Photo are always present (existing logic).
4. If a 4th link exists, validate it has `href^="tel:"`.
**Expected result:** Non-exempt POI cards have exactly 3 or 4 links. The 4th link, if present, is a phone link.
**Implementation notes:**
- This is a **modification** to the existing test, not a new test. The current test asserts exactly 3 links; it must be relaxed to allow 3 or 4.
- The existing structural checks (Maps via href pattern, Site via SVG path, Photo via SVG path) remain unchanged.
- Add a soft assertion for the 4th link: if present, `href` starts with `tel:`.

---

## 4. Coverage Matrix

| BRD Requirement | Acceptance Criterion | Test Case(s) | Assertion Type |
|---|---|---|---|
| REQ-003 | AC-2: Phone link in link row after Photo | TC-143 | Soft |
| REQ-003 | AC-3: Phone link uses poi-card__link class | TC-142 | Soft |
| REQ-003 | AC-4: No phone = no link rendered | TC-142, TC-154 | Soft |
| REQ-005 | AC-1: rendering-config.md specifies rating | (rule file — not automatable) | — |
| REQ-005 | AC-2: Rating near POI name, not link row | TC-145 | Soft |
| REQ-005 | AC-3: Star icon with numeric value | TC-144 | Soft |
| REQ-005 | AC-4: No rating = no element rendered | TC-144 | Soft |
| REQ-005 | AC-5: Review count in parentheses | TC-144 | Soft |
| REQ-006 | AC-1: wheelchairAccessible question exists, always visible | TC-147 | Hard |
| REQ-006 | AC-2: Question on Step 6 | TC-147 | Hard |
| REQ-006 | AC-3: Two options (No Req / Wheelchair) | TC-147, TC-148, TC-149 | Hard |
| REQ-006 | AC-4: Value in markdown output | TC-150, TC-151 | Hard |
| REQ-006 | AC-5: i18n keys in 12 locale files | TC-152, TC-153 | Soft |
| REQ-006 | AC-6: Works in LTR and RTL | (covered by existing RTL test suite) | — |
| REQ-006 | AC-7: trip_intake_rules.md updated | (rule file — not automatable) | — |
| REQ-009 | AC-1: Structural test for tel: links | TC-142 | Soft |
| REQ-009 | AC-2: Structural test for .poi-card__rating | TC-144 | Soft |
| REQ-009 | AC-3: Validate when present, not always | TC-142, TC-144 | Soft |
| REQ-009 | AC-4: Language-independent, shared-page, expect.soft | TC-142, TC-143, TC-144, TC-145, TC-146 | Soft |
| REQ-010 | AC-1: Wheelchair visible on Step 6 regardless of depth | TC-147 | Hard |
| REQ-010 | AC-2: Selection produces markdown field | TC-150, TC-151 | Hard |
| REQ-010 | AC-3: Language-independent DOM assertions | TC-147–TC-153 | Mixed |

**Not automatable (out of scope):**

| BRD Requirement | Acceptance Criterion | Reason |
|---|---|---|
| REQ-001 | AC-1, AC-2, AC-3 | MCP server infrastructure — not testable via Playwright |
| REQ-002 | AC-1, AC-2, AC-3 | Rule file / markdown format — validated indirectly via HTML tests |
| REQ-004 | AC-1, AC-2, AC-3 | Rule file / markdown format — validated indirectly via HTML tests |
| REQ-007 | AC-1, AC-2, AC-3, AC-4 | Pipeline runtime behavior — not static HTML |
| REQ-008 | AC-1, AC-2, AC-3 | Pipeline data flow — not static HTML |

---

## 5. Test Data Dependencies

| Data Source | What's Used | Update Needed? |
|---|---|---|
| Generated trip HTML (`trip_full_{LANG}.html`) | POI cards with phone links, ratings, accessibility badges | Yes — trip must be regenerated with Google Places enrichment before running TC-142 through TC-146 |
| `trip_details.md` | Trip config (day count, language, destination) | No change needed |
| `trip_intake.html` | Wheelchair question DOM structure | Yes — DD §1.6 HTML addition must be implemented first |
| `locales/ui_*.json` (12 files) | i18n keys for wheelchair question | Yes — DD §1.9 keys must be added first |
| `TripPage.ts` | New locators: `poiCardRatings`, `getPoiCardPhoneLink()`, `getPoiCardRating()`, `getPoiCardAccessibleBadge()` | Yes — DD §1.10 additions needed |
| `IntakePage.ts` | New locator: `wheelchairQuestion` | Yes — DD §1.11 addition needed |

---

## 6. Risk & Mitigation

| Risk | Mitigation |
|---|---|
| No trip HTML with phone/rating data available yet (Google Places not configured during test development) | TC-142, TC-144 are designed to pass with zero elements ("when available" pattern). Tests validate structure only when elements exist. Regression run after first enriched trip generation will activate assertions. |
| Existing 3-link test (`poi-cards.spec.ts` line 37) will fail when phone links are added | TC-154 modifies the existing test to accept 3 or 4 links. This modification must happen atomically with the phone link implementation. |
| Intake wheelchair question navigation — reaching Step 6 requires completing Steps 0-5 | Use `IntakePage.setupWithDepth(10)` + `navigateToStep(6)` — proven pattern from existing intake tests (TC-056, TC-057). |
| Markdown output assertion uses English text (`Wheelchair accessible`) | This matches the existing pattern in `generateMarkdown()` where field labels are always English regardless of UI language. Documented as acceptable exception. |
| Rate of change in `poi-cards.spec.ts` — appending 5 new tests to a file with 7 existing tests | New tests follow identical patterns (shared-page, expect.soft, structural selectors). No architectural risk. |
| `intake-wheelchair.spec.ts` is a new file — must be included in project routing | File matches the default `testMatch` pattern for `desktop-chromium` project. No config change needed unless the file requires HTTP transport (it does not — `file://` is sufficient for intake functional tests using `trip_bridge.js`). |

---

## 7. Estimated Impact

- **New test count:** 13 tests across 2 spec files
  - `poi-cards.spec.ts`: 5 new tests (TC-142 through TC-146) + 1 modified test (TC-154)
  - `intake-wheelchair.spec.ts`: 7 new tests (TC-147 through TC-153)
- **Estimated runtime increase:** ~4-6 seconds
  - Trip HTML tests (TC-142–TC-146): ~1-2 seconds (read-only, shared-page fixture, no page load overhead)
  - Intake tests (TC-147–TC-153): ~3-4 seconds (3 depth iterations in TC-147 require 3 full page loads; other tests share setup)
- **Files added:** 1 (`intake-wheelchair.spec.ts`)
- **Files modified:** 3
  - `poi-cards.spec.ts` — 5 new test blocks + 1 modified test block
  - `TripPage.ts` — 1 new property (`poiCardRatings`) + 3 new methods (`getPoiCardPhoneLink`, `getPoiCardRating`, `getPoiCardAccessibleBadge`)
  - `IntakePage.ts` — 1 new property (`wheelchairQuestion`)
- **New POM locators:**
  - `TripPage.poiCardRatings` — `page.locator('.poi-card__rating')`
  - `TripPage.getPoiCardPhoneLink(poiCard)` — `poiCard.locator('.poi-card__link[href^="tel:"]')`
  - `TripPage.getPoiCardRating(poiCard)` — `poiCard.locator('.poi-card__rating')`
  - `TripPage.getPoiCardAccessibleBadge(poiCard)` — `poiCard.locator('.poi-card__accessible')`
  - `IntakePage.wheelchairQuestion` — `page.locator('.depth-extra-question[data-question-key="wheelchairAccessible"]')`
