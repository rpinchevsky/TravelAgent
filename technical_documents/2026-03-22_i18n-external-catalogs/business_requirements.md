# Business Requirements Document

**Change:** Extract intake page i18n data into external JSON catalog files
**Date:** 2026-03-22
**Author:** Product Manager
**Status:** Approved

---

## 1. Background & Motivation

The `trip_intake.html` page currently embeds all translation data directly in the HTML file: a `TRANSLATIONS` object (~1,200 lines, 12 languages, 100+ UI string keys) and an `ITEM_I18N` object (~240 lines, 150+ interest/avoid/food/vibe item translations for RU and HE). This is contrary to industry best practice — research into Booking.com and Kayak.com confirms that both platforms use external translation catalogs (JSON files) loaded at runtime, separating content from structure.

**Problems with the current inline approach:**
1. **Maintainability:** Adding or editing a translation requires editing a 5,000+ line HTML file, increasing merge conflict risk and cognitive load.
2. **Scalability:** Adding full translations for additional languages (currently only EN/RU/HE have complete UI translations; 9 languages fall back to EN) means the HTML file grows linearly.
3. **Separation of concerns:** Structure (HTML), behavior (JS), and content (translations) are conflated in a single file, making it difficult for translators or non-developers to contribute.
4. **Performance:** The browser parses ~1,400 lines of translation data on every page load, even though only one language is active at a time.

**Agreed approach (Option C — Hybrid):**
- Extract `TRANSLATIONS` and `ITEM_I18N` into external JSON files under a `locales/` folder.
- The `setLanguage()` function fetches the appropriate JSON file at runtime.
- Generated trip HTML output (static per-language files) remains unchanged — this is appropriate for narrative prose content.

## 2. Scope

**In scope:**
- Create a `locales/` folder structure with per-language JSON catalog files
- Extract the `TRANSLATIONS` object from `trip_intake.html` into external JSON files
- Extract the `ITEM_I18N` object from `trip_intake.html` into an external JSON file
- Modify `setLanguage()` to fetch JSON catalogs at runtime instead of reading inline objects
- Modify `tItem()` to read from the externally loaded item translations
- Update `trip_intake_rules.md` to document the new i18n architecture
- Update `trip_intake_design.md` to document the new translation loading mechanism
- Ensure the page still works as a standalone file (no build step) with a local file server or via the existing bridge server

**Out of scope:**
- Changing the generated trip output model (static per-language HTML files like `trip_full_ru.html` remain as-is)
- Adding new languages beyond the existing 12
- Completing translations for the 9 languages that currently fall back to English (ES, FR, DE, IT, PT, ZH, JA, KO, AR)
- Changes to `rendering-config.md` or the HTML rendering pipeline
- Changes to `content_format_rules.md` or the trip generation pipeline
- Server-side translation injection (the page remains client-side only)

**Affected rule files:**
- `trip_intake_rules.md` — §Internationalization (i18n), §How to Modify
- `trip_intake_design.md` — §Internationalization (i18n), §Translation System

## 3. Requirements

### REQ-001: Create external JSON catalog file structure

**Description:** Create a `locales/` folder in the project root containing per-language UI translation files and a shared item translation file. The folder structure must be simple, flat, and require no build step.

**Acceptance Criteria:**
- [ ] AC-1: A `locales/` folder exists in the project root
- [ ] AC-2: One JSON file per language exists for UI strings: `locales/ui_{lang}.json` (e.g., `ui_en.json`, `ui_ru.json`, `ui_he.json`) for all 12 supported languages
- [ ] AC-3: One shared JSON file exists for item translations: `locales/items_i18n.json`
- [ ] AC-4: Each `ui_{lang}.json` file contains a flat key-value object where keys match the existing `data-i18n` attribute values and values are the translated strings
- [ ] AC-5: `items_i18n.json` contains the same structure as the current `ITEM_I18N` object — keyed by English item name, with `{ ru, he }` translation objects
- [ ] AC-6: All JSON files are valid JSON (parseable by `JSON.parse()`)
- [ ] AC-7: The total key count in each `ui_{lang}.json` matches the key count in the corresponding `TRANSLATIONS[lang]` object before extraction (no keys lost)

**Priority:** Must-have

**Affected components:**
- New files: `locales/ui_en.json`, `locales/ui_ru.json`, `locales/ui_he.json`, `locales/ui_es.json`, `locales/ui_fr.json`, `locales/ui_de.json`, `locales/ui_it.json`, `locales/ui_pt.json`, `locales/ui_zh.json`, `locales/ui_ja.json`, `locales/ui_ko.json`, `locales/ui_ar.json`, `locales/items_i18n.json`

---

### REQ-002: Modify `setLanguage()` to load external UI catalogs

**Description:** Replace the inline `TRANSLATIONS` object lookup in `setLanguage()` with an async fetch of the appropriate `locales/ui_{lang}.json` file. The function must handle loading states, caching, and fallback gracefully.

**Acceptance Criteria:**
- [ ] AC-1: `setLanguage(lang)` fetches `locales/ui_{lang}.json` via `fetch()` on first call for a given language
- [ ] AC-2: Successfully fetched catalogs are cached in memory (subsequent calls to the same language do not trigger another fetch)
- [ ] AC-3: If the fetch fails (network error, 404), the function falls back to English (`ui_en.json`); if English also fails, falls back to an inline minimal emergency catalog (page title + critical navigation labels only)
- [ ] AC-4: The English catalog (`ui_en.json`) is eagerly loaded on page initialization (not deferred) to ensure instant fallback availability
- [ ] AC-5: All existing `data-i18n` and `data-i18n-placeholder` elements are translated correctly after language switch — identical behavior to the current inline approach
- [ ] AC-6: RTL direction setting (`dir="rtl"` for HE/AR) continues to work identically
- [ ] AC-7: `localStorage('tripIntakeLang')` persistence continues to work identically
- [ ] AC-8: Language switch is visually instant for cached languages (no flicker or flash of untranslated content)
- [ ] AC-9: The `TRANSLATIONS` const is removed from `trip_intake.html` after extraction

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — `setLanguage()` function, `TRANSLATIONS` const removal

---

### REQ-003: Modify `tItem()` to load external item catalog

**Description:** Replace the inline `ITEM_I18N` object in `tItem()` with a reference to the externally loaded `items_i18n.json` data. The item catalog is shared across all languages (it contains RU and HE translations keyed by English name).

**Acceptance Criteria:**
- [ ] AC-1: `items_i18n.json` is fetched once on page initialization and cached in memory
- [ ] AC-2: `tItem(name)` returns the correct translated name for RU and HE languages, identical to current behavior
- [ ] AC-3: `tItem(name)` returns the English name as fallback when no translation exists for the current language, identical to current behavior
- [ ] AC-4: Interest, avoid, food, and vibe cards display correctly in all three fully-translated languages (EN, RU, HE)
- [ ] AC-5: Card names in the generated markdown output remain in English (via `data-en-name` attribute), unchanged from current behavior
- [ ] AC-6: The `ITEM_I18N` const is removed from `trip_intake.html` after extraction

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — `tItem()` function, `ITEM_I18N` const removal

---

### REQ-004: Maintain standalone operation (no build step)

**Description:** The page must continue to work without a build system. The external JSON files are loaded via `fetch()` at runtime. This requires the page to be served via HTTP (local file server, the existing `trip_bridge.js`, or any static server) — direct `file://` protocol access will not support `fetch()` due to CORS restrictions.

**Acceptance Criteria:**
- [ ] AC-1: The page loads and functions correctly when served via `trip_bridge.js` (existing bridge server on `localhost:3456`)
- [ ] AC-2: The page loads and functions correctly when served via any static HTTP server (e.g., `npx serve`, `python -m http.server`)
- [ ] AC-3: No build step, bundler, or transpiler is required — JSON files are plain files served as-is
- [ ] AC-4: If opened via `file://` protocol, a clear user-facing message indicates that a local server is required (graceful degradation, not a silent failure)
- [ ] AC-5: `trip_bridge.js` serves files from the `locales/` folder (via its existing `GET /file/*` endpoint or a new static file route)

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — fetch error handling, protocol detection
- `trip_bridge.js` — static file serving for `locales/` folder

---

### REQ-005: Initial page load performance

**Description:** The external catalog approach must not degrade the initial page load experience. The first meaningful paint should not show untranslated keys or flash of wrong-language content.

**Acceptance Criteria:**
- [ ] AC-1: The English UI catalog is loaded before the first render of translatable content (blocking load or pre-render hidden state)
- [ ] AC-2: If the user's persisted language (from `localStorage`) is not English, both the English fallback and the user's language catalog load before showing translated content
- [ ] AC-3: Total additional network requests on cold load: at most 2 (one UI catalog + one item catalog); on subsequent loads, browser HTTP caching reduces this to 0
- [ ] AC-4: JSON catalog files include appropriate `Cache-Control` headers when served via `trip_bridge.js` (or rely on browser default caching for static files)
- [ ] AC-5: No flash of untranslated content (FOUC) — the page either shows translated content or a loading state, never raw `data-i18n` keys

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — initialization sequence, render gating
- `trip_bridge.js` — cache headers for `locales/` files

---

### REQ-006: Update rule files to document new i18n architecture

**Description:** Update `trip_intake_rules.md` and `trip_intake_design.md` to reflect the new external catalog architecture. The rules must document the file structure, how to add new translation keys, how to add new languages, and the runtime loading mechanism.

**Acceptance Criteria:**
- [ ] AC-1: `trip_intake_rules.md` §Internationalization (i18n) documents the `locales/` folder structure and file naming convention
- [ ] AC-2: `trip_intake_rules.md` §Internationalization (i18n) documents that `setLanguage()` fetches external JSON catalogs instead of reading inline objects
- [ ] AC-3: `trip_intake_rules.md` §How to Modify includes updated instructions for adding new UI text (add key to all `ui_{lang}.json` files instead of the `TRANSLATIONS` object)
- [ ] AC-4: `trip_intake_rules.md` §How to Modify includes updated instructions for adding new items to INTEREST_DB/AVOID_DB/FOOD_DB/VIBE_DB (add translations to `items_i18n.json` instead of the `ITEM_I18N` map)
- [ ] AC-5: `trip_intake_design.md` §Translation System documents the async fetch mechanism, caching strategy, and fallback chain
- [ ] AC-6: `trip_intake_design.md` §Translation System documents that the page requires HTTP serving (not `file://`) for catalog loading
- [ ] AC-7: Both rule files retain all existing i18n rules that remain valid (RTL support, language consistency rule, `data-i18n` attribute convention, markdown output in English, etc.)

**Priority:** Must-have

**Affected components:**
- `trip_intake_rules.md` — §Internationalization (i18n), §How to Modify
- `trip_intake_design.md` — §Internationalization (i18n), §Translation System

---

### REQ-007: Data integrity validation

**Description:** Provide a mechanism to verify that the extraction was lossless — no translation keys were dropped, corrupted, or duplicated during the migration from inline to external files.

**Acceptance Criteria:**
- [ ] AC-1: Every key present in the original `TRANSLATIONS.en` object has a corresponding key in `ui_en.json` with the same value
- [ ] AC-2: Every key present in the original `TRANSLATIONS.ru` object has a corresponding key in `ui_ru.json` with the same value
- [ ] AC-3: Every key present in the original `TRANSLATIONS.he` object has a corresponding key in `ui_he.json` with the same value
- [ ] AC-4: Every entry in the original `ITEM_I18N` object has a corresponding entry in `items_i18n.json` with identical `ru` and `he` values
- [ ] AC-5: The total number of `data-i18n` attributes in `trip_intake.html` does not change (no orphaned or missing references)
- [ ] AC-6: A post-extraction validation step (manual or automated) confirms the above

**Priority:** Must-have

**Affected components:**
- `locales/*.json` — all catalog files
- `trip_intake.html` — `data-i18n` attributes (unchanged, just verified)

---

## 4. Dependencies & Risks

| Dependency / Risk | Mitigation |
|---|---|
| `fetch()` does not work with `file://` protocol | REQ-004 AC-4: detect protocol and show user-facing message; document HTTP server requirement in rule files |
| `trip_bridge.js` must serve `locales/` files | REQ-004 AC-5: add static file route or extend existing endpoint; SA will review in architecture review |
| Race condition: user switches language before catalog loads | REQ-002 AC-2: cache + queue; only apply translation after fetch completes; debounce rapid switches |
| Catalog file gets corrupted or deleted | REQ-002 AC-3: fallback chain (target lang → English → inline emergency); REQ-007: validation step |
| Breaking change for users who open HTML directly via double-click | REQ-004 AC-4: graceful degradation message; this is an acceptable trade-off since the bridge server is already the recommended workflow |
| JSON parse errors from malformed catalog files | `setLanguage()` wraps `JSON.parse()` / `response.json()` in try-catch with fallback to English |
| Increased network requests on first load (2 fetches vs 0) | REQ-005 AC-3/AC-4: browser caching, eager English load, small file sizes (~15-30KB per catalog) |

## 5. Acceptance Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| PM | Product Manager | 2026-03-22 | Approved |
