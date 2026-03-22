# High-Level Design

**Change:** Extract intake page i18n data into external JSON catalog files
**Date:** 2026-03-22
**Author:** Development Team
**BRD Reference:** `technical_documents/2026-03-22_i18n-external-catalogs/business_requirements.md`
**Status:** Revised (v2 — addresses SA feedback FB-1 through FB-5)

---

## 1. Overview

The intake page (`trip_intake.html`) currently embeds two large translation data structures inline: `TRANSLATIONS` (~1,217 lines, 3 language blocks with ~400 keys each) and `ITEM_I18N` (~237 lines, ~150 entries with RU/HE translations). This change extracts both into external JSON files under a `locales/` folder. The `setLanguage()` function becomes async, fetching the appropriate JSON catalog via `fetch()` at runtime. The `tItem()` function reads from a separately loaded item catalog. The bridge server gains a new route to serve locale files with caching headers.

**Key design principle:** The extraction is purely a structural refactor. No translation content changes, no new languages, no new keys. The page's observable behavior is identical before and after.

## 2. Affected Components

| Component | File(s) | Type of Change |
|---|---|---|
| UI + item translation catalogs | `locales/ui_en.json`, `ui_ru.json`, `ui_he.json` + 9 fallback files | New — extracted from `TRANSLATIONS`; each file also contains an `_items` key with item translations (merged from `ITEM_I18N`) |
| Intake page JS | `trip_intake.html` — `TRANSLATIONS` const, `ITEM_I18N` const, `setLanguage()`, `tItem()`, `t()`, initialization block | Modified — remove inline data, add async fetch/cache logic |
| Bridge server | `trip_bridge.js` | Modified — new `/locales/*` static route |
| Intake rules | `trip_intake_rules.md` — Internationalization, How to Modify | Modified — document new architecture |
| Intake design spec | `trip_intake_design.md` — Translation System | Modified — document async fetch mechanism |

## 3. Data Flow

### 3.1 Page Initialization (Cold Load)

```
Page loads
  |
  +--> [1] file:// protocol check (must be first statement — abort if file://)
  |
  +--> [2] Eager fetch: locales/ui_en.json (English fallback + English item translations)
  |
  +--> Detect language: localStorage('tripIntakeLang') || navigator.language || 'en'
  |
  +--> If detected lang != 'en':
  |      +--> [3] Fetch locales/ui_{lang}.json (target lang UI strings + item translations)
  |      +--> Cache in memory
  |      +--> Apply translations
  |    Else:
  |      +--> Apply English translations (already cached)
  |
  +--> Unhide page content (remove FOUC guard)

Cold-load requests: exactly 1 for English users, exactly 2 for non-English users (satisfies BRD REQ-005 AC-3).
```

### 3.2 Language Switch (Runtime)

```
User clicks language in selector
  |
  +--> setLanguage(lang) called
  +--> Increment sequence counter (_langRequestId); capture as requestId
  |
  +--> Check in-memory cache for ui_{lang}.json
  |      |
  |      +--> Cache hit: apply translations synchronously (instant)
  |      |
  |      +--> Cache miss: fetch locales/ui_{lang}.json
  |             +--> If requestId != _langRequestId: abort (superseded by newer switch)
  |             +--> Success: cache + apply
  |             +--> Failure: fall back to English catalog (already cached)
  |
  +--> Apply data-i18n + data-i18n-placeholder + RTL direction
  +--> Dispatch 'languagechange' event
  +--> Persist to localStorage
```

### 3.3 Item Translation (Runtime)

```
tItem(name) called during card rendering
  |
  +--> If currentLang == 'en': return name
  +--> Look up name in _uiCache[currentLang]._items
  +--> Fallback: look up in _uiCache.en._items
  +--> Return translated name or English fallback
```

### 3.4 Bridge Server File Serving

```
Browser: GET /locales/ui_ru.json
  |
  +--> trip_bridge.js matches /locales/* route
  +--> Security: validate no '..' in path, restrict to locales/ prefix
  +--> Read file from PROJECT_DIR/locales/
  +--> Set Content-Type: application/json
  +--> Set Cache-Control: public, max-age=3600
  +--> Return file content
```

## 4. Integration Points

### 4.1 Existing `data-i18n` / `data-i18n-placeholder` Attributes
No change. All HTML elements retain their existing `data-i18n` and `data-i18n-placeholder` attributes. The translation application logic (iterating `querySelectorAll('[data-i18n]')`) remains identical — only the data source changes from inline object to fetched JSON.

### 4.2 `t()` Helper Function
Currently reads from `TRANSLATIONS[currentLang]`. After extraction, reads from `_uiCache[currentLang]` (the in-memory cache of fetched catalogs). Same signature, same fallback behavior (target lang -> English -> key).

### 4.3 `tItem()` Helper Function
Currently reads from `ITEM_I18N`. After extraction, reads from `_uiCache[currentLang]._items` with fallback to `_uiCache.en._items`. Item translations are merged into each `ui_{lang}.json` file under a reserved `_items` key (no separate items catalog file). Same signature, same fallback behavior (translated name -> English name).

### 4.4 Calendar/Month Translation References
Lines 4647-4648 and 4998 directly access `TRANSLATIONS[currentLang].days_short` and `TRANSLATIONS[currentLang].months`. These are replaced with equivalent reads from `_uiCache[currentLang]` with the same fallback to English arrays.

### 4.5 Language Detection on Init
The initialization block (lines 4607-4614) currently checks `TRANSLATIONS[saved]` to validate a saved language. After extraction, this check uses `LANG_META[saved]` instead (which already contains all 12 language codes). Validation that a catalog exists happens during fetch, with fallback to English on failure.

### 4.6 `localStorage` Persistence
No change. Language choice is persisted and restored identically.

### 4.7 `languagechange` Custom Event
No change to event dispatch. The event detail currently includes `{ lang, translations: tr }`. After extraction, it includes `{ lang, translations: _uiCache[lang] }` — same shape.

### 4.8 Bridge Server Existing Endpoints
The new `/locales/*` route is independent of existing endpoints (`/health`, `/generate`, `/progress/:id`, `/cancel/:id`, `/latest-trip`, `/file/*`). No conflicts.

## 5. Impact on Existing Behavior

| Area | Impact | Backward Compatible? |
|---|---|---|
| Existing `data-i18n` attributes in HTML | No change — attributes stay, translation application logic identical | Yes |
| Language switching UX | Functionally identical; cached languages switch synchronously | Yes |
| RTL support (HE, AR) | No change — direction logic stays in `setLanguage()` | Yes |
| Generated markdown output | No change — `data-en-name` and `generateMarkdown()` unaffected | Yes |
| Card rendering (interests, avoids, food, vibes) | No change — `tItem()` returns same values from `_uiCache[lang]._items` | Yes |
| Calendar month/day names | No change — same keys (`months`, `days_short`) accessed from cached catalog | Yes |
| `file://` protocol access | **Breaking change** — `fetch()` fails on `file://` due to CORS; page shows informative error message | No (intentional, per BRD REQ-004 AC-4) |
| Bridge server `/file/*` endpoint | No change — new `/locales/*` route is separate | Yes |
| 9 fallback languages (es, fr, de, it, pt, zh, ja, ko, ar) | Behavior identical — their `ui_{lang}.json` files contain copies of English strings; `setLanguage()` fetches and applies them | Yes |
| Report language dropdown | No change — synced in `setLanguage()` using same `langToReport` map | Yes |

## 6. BRD Coverage Matrix

| Requirement | Addressed in HLD? | Section |
|---|---|---|
| REQ-001: Create external JSON catalog file structure | Yes | §2 (new files), §3.1 (loading) |
| REQ-002: Modify `setLanguage()` to load external UI catalogs | Yes | §3.1, §3.2, §4.2, §4.4, §4.5 |
| REQ-003: Modify `tItem()` to load from merged item catalog | Yes | §3.3, §4.3 |
| REQ-004: Maintain standalone operation (no build step) | Yes | §3.4 (bridge serving), §5 (file:// impact) |
| REQ-005: Initial page load performance | Yes | §3.1 (eager load, FOUC guard); cold load exactly 1-2 requests (EN only = 1, non-EN = 2) — fully satisfies AC-3 |
| REQ-006: Update rule files | Yes | §2 (affected components) |
| REQ-007: Data integrity validation | Partial — deferred to Detailed Design | §2 (validation is an implementation concern) |
