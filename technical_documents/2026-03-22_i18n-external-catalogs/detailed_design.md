# Detailed Design

**Change:** Extract intake page i18n data into external JSON catalog files
**Date:** 2026-03-22
**Author:** Development Team
**HLD Reference:** `technical_documents/2026-03-22_i18n-external-catalogs/high_level_design.md`
**Status:** Revised (v2 — addresses SA feedback FB-1 through FB-5)

---

## 1. File Changes

### 1.1 `locales/ui_en.json` (NEW)

**Action:** Create

**Structure:** Flat key-value JSON object. Keys match the existing `data-i18n` attribute values. Values are English strings. Array values (e.g., `months`, `days_short`) are preserved as JSON arrays. A reserved `_items` key contains item translations (merged from the former `ITEM_I18N` object) — see rationale below.

**Example (representative subset):**
```json
{
  "hero_title": "Your perfect trip starts here",
  "hero_subtitle": "Answer a few questions and we'll design the perfect itinerary",
  "vp_custom_title": "Custom-Made Itinerary",
  "vp_custom_desc": "Every trip is built from scratch for your group — no cookie-cutter templates",
  "sb_destination": "Destination",
  "sb_destination_placeholder": "Where are you going?",
  "sb_dates": "Dates",
  "sb_letsgo": "Let's Go →",
  "months": ["January","February","March","April","May","June","July","August","September","October","November","December"],
  "days_short": ["Su","Mo","Tu","We","Th","Fr","Sa"],
  "step_trip": "Trip",
  "step_travelers": "Travelers",
  "s0_title": "What's Your Travel Rhythm?",
  "s1_title": "Who's Traveling?",
  "s1_parent": "Parent / Adult",
  "q_rhythm": "What's your ideal daily rhythm?",
  "q_setting": "What kind of setting do you prefer?",
  "s7_post_title": "Profile Saved!",
  "s7_post_instruction": "Paste the command below into Claude Code to generate your trip:",
  "...": "... (all ~400 keys from TRANSLATIONS.en)",
  "_items": {
    "Local Food Markets & Street Food": "Local Food Markets & Street Food",
    "Wine Tasting & Vineyard Tours": "Wine Tasting & Vineyard Tours",
    "National Parks & Nature Reserves": "National Parks & Nature Reserves",
    "Historical Landmarks & Architecture": "Historical Landmarks & Architecture",
    "Casual & relaxed": "Casual & relaxed",
    "...": "... (all ~150 entries — English values are identity mappings)"
  }
}
```

**Key count:** Must exactly match the number of keys in `TRANSLATIONS.en` (approximately 400 keys, including `months` and `days_short` arrays) plus the `_items` key containing all ~150 item entries.

**`_items` key:** Contains item name translations merged from the former `ITEM_I18N` object. For `ui_en.json`, values are identity mappings (English name -> English name). For `ui_ru.json` and `ui_he.json`, values are the translated names. For the 9 fallback language files, values are identity mappings (same as English). This eliminates `items_i18n.json` as a separate file, reducing cold-load requests to exactly 2 for non-English users (satisfies BRD REQ-005 AC-3). Trade-off: ~5KB larger per-language files, item translations duplicated across 12 files.

**Rationale:** EN is the fallback language. It is eagerly loaded on page init and serves as the emergency fallback if other catalogs fail to load.

---

### 1.2 `locales/ui_ru.json` (NEW)

**Action:** Create

**Structure:** Same flat key-value format as `ui_en.json`. Keys are identical. Values are Russian translations from `TRANSLATIONS.ru`. Includes `_items` key with Russian item translations (from former `ITEM_I18N[*].ru`).

**Example (representative subset):**
```json
{
  "hero_title": "Ваше идеальное путешествие начинается здесь",
  "hero_subtitle": "Ответьте на несколько вопросов, и мы составим идеальный маршрут",
  "vp_custom_title": "Индивидуальный маршрут",
  "sb_destination": "Направление",
  "sb_letsgo": "Поехали →",
  "months": ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"],
  "days_short": ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"],
  "...": "... (all ~400 keys from TRANSLATIONS.ru)",
  "_items": {
    "Local Food Markets & Street Food": "Местные рынки и стрит-фуд",
    "Wine Tasting & Vineyard Tours": "Дегустация вин и виноградники",
    "National Parks & Nature Reserves": "Национальные парки и заповедники",
    "Historical Landmarks & Architecture": "Исторические достопримечательности",
    "Casual & relaxed": "Непринуждённая атмосфера",
    "...": "... (all ~150 entries with Russian translations)"
  }
}
```

**Key count:** Must exactly match `TRANSLATIONS.ru` plus `_items` key with all ~150 item entries.

---

### 1.3 `locales/ui_he.json` (NEW)

**Action:** Create

**Structure:** Same flat key-value format. Values are Hebrew translations from `TRANSLATIONS.he`. Includes `_items` key with Hebrew item translations (from former `ITEM_I18N[*].he`).

**Example (representative subset):**
```json
{
  "hero_title": "הטיול המושלם שלכם מתחיל כאן",
  "hero_subtitle": "ענו על כמה שאלות ונעצב עבורכם את המסלול המושלם",
  "vp_custom_title": "מסלול בהתאמה אישית",
  "sb_destination": "יעד",
  "sb_letsgo": "→ יאללה",
  "months": ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"],
  "days_short": ["א׳","ב׳","ג׳","ד׳","ה׳","ו׳","ש׳"],
  "...": "... (all ~400 keys from TRANSLATIONS.he)",
  "_items": {
    "Local Food Markets & Street Food": "שווקי אוכל מקומיים ואוכל רחוב",
    "Wine Tasting & Vineyard Tours": "טעימות יין וסיורי כרמים",
    "National Parks & Nature Reserves": "פארקים לאומיים ושמורות טבע",
    "Historical Landmarks & Architecture": "אתרים היסטוריים וארכיטקטורה",
    "Casual & relaxed": "אווירה נינוחה",
    "...": "... (all ~150 entries with Hebrew translations)"
  }
}
```

---

### 1.4 `locales/ui_es.json` through `locales/ui_ar.json` (9 files, NEW)

**Action:** Create

**Structure:** Same flat key-value format. Since the current `TRANSLATIONS` object has no blocks for these 9 languages (es, fr, de, it, pt, zh, ja, ko, ar), their JSON files are **copies of `ui_en.json`** — all English values, including the `_items` key with English identity mappings. This preserves the existing fallback behavior identically.

**Rationale:** Having a per-language file for all 12 languages simplifies the fetch logic (`fetch('locales/ui_' + lang + '.json')` always works) and eliminates the need for a runtime "does this language have translations?" check. Future translators can edit these files directly without touching HTML.

---

### 1.5 ~~`locales/items_i18n.json`~~ — ELIMINATED (merged into `ui_{lang}.json`)

**Action:** None — this file is no longer created as a separate artifact.

**SA feedback (FB-1):** The original design had `items_i18n.json` as a separate file, which caused non-English cold loads to make 3 requests (ui_en.json + items_i18n.json + ui_{lang}.json), violating BRD REQ-005 AC-3 ("at most 2"). Per SA Option A, item translations are now merged into each `ui_{lang}.json` file under a reserved `_items` key. This reduces cold-load requests to exactly 2 for non-English users (1 for English users).

**Migration of content:** The `ITEM_I18N` data is distributed as follows:
- `ui_en.json._items`: English name -> English name (identity mapping)
- `ui_ru.json._items`: English name -> Russian translation
- `ui_he.json._items`: English name -> Hebrew translation
- `ui_{fallback}.json._items` (9 files): English name -> English name (identity mapping)

**Entry count per `_items` key:** Must exactly match the number of keys in `ITEM_I18N` (~150 entries covering interests, avoids, food experiences, and dining vibes).

---

### 1.6 `trip_intake.html` — Remove `TRANSLATIONS` const

**Action:** Modify (lines 3056–4273)

**Current state:**
```javascript
const TRANSLATIONS = {
  en: {
    hero_title: "Your perfect trip starts here",
    // ... ~400 keys
  },
  ru: {
    hero_title: "Ваше идеальное путешествие начинается здесь",
    // ... ~400 keys
  },
  he: {
    hero_title: "הטיול המושלם שלכם מתחיל כאן",
    // ... ~400 keys
  },
};
```

**Target state:**
```javascript
// i18n catalogs loaded from external JSON files (locales/ui_{lang}.json)
// Each catalog includes UI strings + item translations (under _items key)
const _uiCache = {};    // { lang: { key: value, ..., _items: { "English Name": "Translated Name" } } } — populated by fetchUiCatalog()
let _langRequestId = 0; // Sequence counter for race condition guard on rapid language switching (SA FB-2)
```

**Rationale:** The ~1,217 lines of inline translation data (TRANSLATIONS) and ~237 lines of item translations (ITEM_I18N) are replaced by 1 cache variable declaration. All translation content now lives in `locales/ui_{lang}.json` files. The `_langRequestId` counter prevents stale fetches from overwriting the user's final language choice.

---

### 1.7 `trip_intake.html` — Remove `ITEM_I18N` const

**Action:** Modify (lines 4275–4517)

**Current state:**
```javascript
const ITEM_I18N = {
  'Local Food Markets & Street Food': { ru: 'Местные рынки и стрит-фуд', he: '...' },
  // ... ~150 entries
};
```

**Target state:** Removed entirely. Item translations are now accessed via `_uiCache[lang]._items` (the `_items` key inside each fetched UI catalog, see §1.1).

---

### 1.8 `trip_intake.html` — New `fetchUiCatalog()` function

**Action:** Create (new function, placed after cache declarations)

**Target state:**
```javascript
// Fetch and cache a UI translation catalog.
// Returns the cached catalog object, or null on failure.
async function fetchUiCatalog(lang) {
  if (_uiCache[lang]) return _uiCache[lang];
  try {
    const resp = await fetch(`locales/ui_${lang}.json`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    _uiCache[lang] = data;
    return data;
  } catch (e) {
    console.warn(`[i18n] Failed to load ui_${lang}.json:`, e.message);
    return null;
  }
}
```

**Rationale:** Centralizes fetch + cache + error handling for UI catalogs. Returns `null` on failure, allowing callers to implement their own fallback logic.

---

### 1.9 ~~`trip_intake.html` — `fetchItemsCatalog()` function~~ — ELIMINATED

**Action:** None — this function is no longer needed. Item translations are merged into each `ui_{lang}.json` file under the `_items` key (see §1.1, §1.5). The `fetchUiCatalog()` function (§1.8) loads both UI strings and item translations in a single fetch.

---

### 1.10 `trip_intake.html` — Modify `t()` function

**Action:** Modify (line 4532–4535)

**Current state:**
```javascript
function t(key) {
  const tr = TRANSLATIONS[currentLang];
  return (tr && tr[key] !== undefined) ? tr[key] : (TRANSLATIONS.en[key] || key);
}
```

**Target state:**
```javascript
function t(key) {
  const tr = _uiCache[currentLang];
  return (tr && tr[key] !== undefined) ? tr[key] : (_uiCache.en && _uiCache.en[key] !== undefined ? _uiCache.en[key] : key);
}
```

**Rationale:** Same fallback chain (current lang -> English -> raw key), but reads from `_uiCache` instead of `TRANSLATIONS`. Added defensive check on `_uiCache.en` for the case where English catalog hasn't loaded yet (edge case during initialization).

---

### 1.11 `trip_intake.html` — Modify `tItem()` function

**Action:** Modify (line 4520–4524)

**Current state:**
```javascript
function tItem(name) {
  if (currentLang === 'en') return name;
  const entry = ITEM_I18N[name];
  return (entry && entry[currentLang]) ? entry[currentLang] : name;
}
```

**Target state:**
```javascript
function tItem(name) {
  if (currentLang === 'en') return name;
  // Item translations are merged into ui_{lang}.json under the _items key
  const items = _uiCache[currentLang] && _uiCache[currentLang]._items;
  if (items && items[name]) return items[name];
  // Fallback: try English items catalog
  const enItems = _uiCache.en && _uiCache.en._items;
  return (enItems && enItems[name]) ? enItems[name] : name;
}
```

**Rationale:** Reads from `_uiCache[currentLang]._items` instead of `ITEM_I18N[name][currentLang]`. The `_items` values in each `ui_{lang}.json` are flat mappings (English name -> translated name for that language), so no nested language key is needed. Fallback chain: target lang `_items` -> English `_items` -> raw English name. Same observable behavior as before.

---

### 1.12 `trip_intake.html` — Modify `setLanguage()` function

**Action:** Modify (lines 4537–4579)

**Current state (synchronous):**
```javascript
function setLanguage(lang) {
  const meta = LANG_META[lang] || LANG_META['en'];
  const originalLang = lang;
  if (!TRANSLATIONS[lang]) lang = 'en';
  currentLang = originalLang;
  const tr = TRANSLATIONS[lang];
  // ... apply translations synchronously
}
```

**Target state (async with sync fast-path and race guard):**
```javascript
async function setLanguage(lang) {
  const meta = LANG_META[lang] || LANG_META['en'];
  currentLang = lang;

  // Race condition guard: increment sequence counter (SA FB-2).
  // If user switches language again before this fetch completes,
  // the stale result is discarded.
  const requestId = ++_langRequestId;

  // Fast path: catalog already cached — apply synchronously
  let tr = _uiCache[lang];
  if (!tr) {
    // Fetch the catalog
    tr = await fetchUiCatalog(lang);
    // Check if this request was superseded by a newer setLanguage() call
    if (requestId !== _langRequestId) return; // superseded — abort
    if (!tr) {
      // Fallback to English
      tr = _uiCache.en || _EMERGENCY_CATALOG;
    }
  }

  // Set direction
  document.documentElement.dir = meta.dir;
  document.documentElement.lang = lang;

  // Translate all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (tr[key] !== undefined) el.textContent = tr[key];
    else if (_uiCache.en && _uiCache.en[key] !== undefined) el.textContent = _uiCache.en[key];
  });

  // Translate placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (tr[key] !== undefined) el.placeholder = tr[key];
    else if (_uiCache.en && _uiCache.en[key] !== undefined) el.placeholder = _uiCache.en[key];
  });

  // Update language selector display
  const langCurrent = document.getElementById('langCurrent');
  if (langCurrent) langCurrent.textContent = meta.name;

  // Update active state in dropdown
  document.querySelectorAll('.lang-selector__item').forEach(item => {
    item.classList.toggle('is-active', item.dataset.lang === lang);
  });

  // Sync report language dropdown
  const langToReport = { en:'English', ru:'Russian', he:'Hebrew', es:'Spanish', fr:'French', de:'German', it:'Italian', pt:'Portuguese', zh:'Chinese', ja:'Japanese', ko:'Korean', ar:'Arabic' };
  const reportSelect = document.getElementById('reportLang');
  if (reportSelect && langToReport[lang]) reportSelect.value = langToReport[lang];

  // Persist
  try { localStorage.setItem('tripIntakeLang', lang); } catch(e) {}

  // Dispatch event
  window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang, translations: tr } }));
}
```

**Key changes:**
1. Function becomes `async` (returns a Promise)
2. Reads from `_uiCache` instead of `TRANSLATIONS`
3. Fetches catalog on cache miss before applying
4. Falls back to English cache, then emergency catalog
5. Per-element fallback: if key missing in target catalog, falls back to English value
6. Removed the `originalLang` / swapped `lang` pattern — `currentLang` is always the user's chosen language; the translation data is the catalog (which may be English content for unsupported languages)
7. **Race condition guard (SA FB-2):** Increments `_langRequestId` at entry; after async fetch, checks if the captured `requestId` still matches. If another `setLanguage()` call was made during the fetch, this call aborts without applying stale translations. This fully addresses the BRD risk "Race condition: user switches language before catalog loads" without introducing debounce delays.

**Callers updated:** All callers of `setLanguage()` must `await` the result or use `.then()`. Identified callers:
- Language selector click handler (line 4599): add `await`
- Init block (lines 4610, 4613): already inside an async IIFE (see §1.13)
- These are all event handlers, so making them async is safe

---

### 1.13 `trip_intake.html` — Modify initialization block

**Action:** Modify (lines 4582–4615, the `initLangSelector` IIFE)

**Current state:**
```javascript
(function initLangSelector() {
  // ... event handlers ...
  const saved = (() => { try { return localStorage.getItem('tripIntakeLang'); } catch(e) { return null; } })();
  if (saved && TRANSLATIONS[saved]) {
    setLanguage(saved);
  } else {
    const browserLang = (navigator.language || '').slice(0, 2).toLowerCase();
    if (TRANSLATIONS[browserLang]) setLanguage(browserLang);
  }
})();
```

**Target state:**
```javascript
(async function initLangSelector() {
  // SA FB-3: file:// detection MUST be the very first statement in this function,
  // before any DOM manipulation or fetch calls, to guarantee clean UX on file://.
  if (window.location.protocol === 'file:') {
    document.body.classList.remove('i18n-loading');
    // ... show file:// error overlay (see §1.15) ...
    return; // Stop initialization entirely
  }

  // ... event handlers (unchanged) ...

  // Phase 1: Eagerly load English catalog (includes _items for item translations)
  await fetchUiCatalog('en');

  // Phase 2: Detect and load user's preferred language
  const saved = (() => { try { return localStorage.getItem('tripIntakeLang'); } catch(e) { return null; } })();
  let targetLang = 'en';
  if (saved && LANG_META[saved]) {
    targetLang = saved;
  } else {
    const browserLang = (navigator.language || '').slice(0, 2).toLowerCase();
    if (LANG_META[browserLang]) targetLang = browserLang;
  }

  // Pre-fetch target language catalog if not English (so first render is translated)
  if (targetLang !== 'en') {
    await fetchUiCatalog(targetLang);
  }

  // Apply language and show page
  await setLanguage(targetLang);
  document.body.classList.remove('i18n-loading');
})();
```

**Key changes:**
1. IIFE becomes `async`
2. **file:// detection is the very first statement (SA FB-3)** — before any DOM manipulation or `querySelectorAll` processing, preventing a flash of hidden content before the error overlay appears
3. Eagerly loads English catalog only (items are now merged into `_items` key — no separate `fetchItemsCatalog()` call). Cold load for English users = 1 request.
4. Uses `LANG_META[saved]` instead of `TRANSLATIONS[saved]` for language validation
5. Pre-fetches target language catalog before first `setLanguage()` call. Cold load for non-English users = 2 requests (EN + target lang). **Fully satisfies BRD REQ-005 AC-3.**
6. Removes `i18n-loading` class after translation is applied (FOUC prevention)

---

### 1.14 `trip_intake.html` — Add FOUC prevention CSS + emergency catalog

**Action:** Modify (add to `<style>` block and `<script>` block)

**FOUC prevention CSS (add to existing `<style>`):**
```css
/* Hide translatable content until i18n catalogs are loaded */
body.i18n-loading [data-i18n],
body.i18n-loading [data-i18n-placeholder] {
  visibility: hidden;
}
```

**Body class (add to `<body>` tag):**
```html
<body class="i18n-loading">
```

**Emergency inline catalog (add to `<script>` block, before cache declarations):**
```javascript
// Emergency fallback: minimal UI strings if all external catalogs fail to load.
// Only includes critical navigation elements to keep the page minimally usable.
// NOTE (SA FB-4): If both fetches fail for an RTL user (HE/AR), setLanguage() will
// still set dir="rtl" (from LANG_META), so these English strings render in RTL layout.
// This is cosmetically awkward but functionally tolerable — an accepted degraded state.
// Do NOT suppress RTL for emergency mode, as the user's actual catalog may load later.
const _EMERGENCY_CATALOG = {
  hero_title: "Your perfect trip starts here",
  hero_subtitle: "Answer a few questions and we'll design the perfect itinerary",
  sb_letsgo: "Let's Go →",
  sb_destination: "Destination",
  sb_dates: "Dates",
  sb_travelers: "Travelers",
  step_trip: "Trip",
  step_travelers: "Travelers",
  step_style: "Style",
  step_interests: "Interests",
  step_avoid: "Avoid",
  step_food: "Food",
  step_details: "Details",
  step_review: "Review",
  months: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  days_short: ["Su","Mo","Tu","We","Th","Fr","Sa"]
};
```

**Rationale:** The emergency catalog is intentionally tiny (~20 keys) — just enough to make navigation work if both external fetches fail. This is the only inline translation data that remains.

---

### 1.15 `trip_intake.html` — Add `file://` protocol detection

**Action:** Modify (add to initialization as the **very first statement** in `initLangSelector()` IIFE — SA FB-3)

**Placement requirement (SA FB-3):** This check MUST be the first statement in `initLangSelector()`, before `Promise.all`, before any `querySelectorAll('[data-i18n]')` processing, and before any DOM manipulation. This guarantees that `file://` users see the error overlay immediately without a flash of hidden content.

**Target state:**
```javascript
// Detect file:// protocol — fetch() won't work, show helpful message
if (window.location.protocol === 'file:') {
  document.body.classList.remove('i18n-loading');
  const msg = document.createElement('div');
  msg.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#F8F7F4;z-index:9999;padding:2rem;text-align:center;font-family:Inter,system-ui,sans-serif;';
  msg.innerHTML = `
    <div style="max-width:480px">
      <h2 style="color:#1A3C5E;margin-bottom:1rem">Local Server Required</h2>
      <p style="color:#555;line-height:1.6">This page needs to be served via HTTP to load translation files.<br><br>
      Run one of these commands in the project folder:</p>
      <code style="display:block;background:#1a1a2e;color:#c8cdd6;padding:1rem;border-radius:8px;margin:1rem 0;font-size:0.9rem">node trip_bridge.js</code>
      <p style="color:#888;font-size:0.85rem">Then open <strong>http://localhost:3456/trip_intake.html</strong></p>
    </div>`;
  document.body.appendChild(msg);
  return; // Stop initialization
}
```

**Rationale:** Clear user-facing message instead of silent failure. Suggests the bridge server command since it's the recommended workflow.

---

### 1.16 `trip_intake.html` — Update calendar/month translation references

**Action:** Modify (lines 4647–4648, 4998)

**Current state:**
```javascript
const getDaysShort = () => (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].days_short) || DAYS_SHORT_EN;
const getMonthNames = () => (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].months) || MONTH_NAMES_EN;
// ...
return (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].months) || MONTHS_EN;
```

**Target state:**
```javascript
const getDaysShort = () => (_uiCache[currentLang] && _uiCache[currentLang].days_short) || DAYS_SHORT_EN;
const getMonthNames = () => (_uiCache[currentLang] && _uiCache[currentLang].months) || MONTH_NAMES_EN;
// ...
return (_uiCache[currentLang] && _uiCache[currentLang].months) || MONTHS_EN;
```

**Rationale:** Direct replacement of `TRANSLATIONS` with `_uiCache`. Same fallback logic to English arrays.

---

### 1.17 `trip_bridge.js` — Add `/locales/*` static file route

**Action:** Modify (add new route before the 404 fallback at line 293)

**Current state (line 291–294):**
```javascript
    return;
  }

  res.writeHead(404);
  res.end('Not found');
```

**Target state:**
```javascript
    return;
  }

  // Serve locale files (locales/*.json) for i18n catalogs
  if (req.method === 'GET' && req.url.startsWith('/locales/')) {
    const relPath = decodeURIComponent(req.url.slice(1)); // "locales/ui_en.json"
    if (relPath.includes('..') || !relPath.startsWith('locales/')) {
      res.writeHead(403); res.end('Forbidden'); return;
    }
    const absPath = path.join(PROJECT_DIR, relPath);
    try {
      const content = fs.readFileSync(absPath);
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      });
      res.end(content);
    } catch (e) {
      res.writeHead(404); res.end('Locale file not found');
    }
    return;
  }

  res.writeHead(404);
  res.end('Not found');
```

**Key design decisions:**
1. Security: path traversal prevention (same pattern as `/file/*` route)
2. Restricted to `locales/` prefix only
3. `Content-Type: application/json` for all locale files
4. `Cache-Control: public, max-age=3600` — 1 hour browser cache; locale files rarely change, and the page can be reloaded if they do
5. Separate route (not extending `/file/*`) to keep the `generated_trips/` security boundary intact

---

### 1.18 `trip_bridge.js` — Add `trip_intake.html` serving route

**Action:** Modify (add new route for serving the intake page itself)

The bridge server currently doesn't serve `trip_intake.html` — users open it directly. Since the page now requires HTTP serving for `fetch()` to work, the bridge server should serve the page (and any directly-referenced assets) from the project root.

**Target state (add before the `/locales/*` route):**
```javascript
  // Serve trip_intake.html (required for fetch()-based i18n)
  // NOTE (SA FB-5): This route only serves trip_intake.html itself. If future changes
  // externalize CSS or JS files, the bridge server would need a more general static file
  // route for the project root. For now, purpose-specific routes (/locales/*, /trip_intake.html)
  // are correct for the current scope.
  if (req.method === 'GET' && (req.url === '/' || req.url === '/trip_intake.html')) {
    const absPath = path.join(PROJECT_DIR, 'trip_intake.html');
    try {
      const content = fs.readFileSync(absPath);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    } catch (e) {
      res.writeHead(404); res.end('File not found');
    }
    return;
  }
```

**Rationale:** Without this, users must use a separate static server. With this, `node trip_bridge.js` + `http://localhost:3456/` serves the full intake experience. The `/` redirect makes it the default landing page.

---

### 1.19 `trip_bridge.js` — Update help output

**Action:** Modify (lines 304–310)

**Current state:**
```javascript
  console.log('  Endpoints:');
  console.log('    GET  /health        — check server status');
  console.log('    POST /generate      — save file + start generation');
  console.log('    GET  /progress/:id  — SSE stream of generation progress');
  console.log('    GET  /latest-trip   — find latest generated trip HTML');
  console.log('    GET  /file/:path    — serve files from generated_trips/');
```

**Target state:**
```javascript
  console.log('  Endpoints:');
  console.log('    GET  /                — trip intake page');
  console.log('    GET  /health          — check server status');
  console.log('    POST /generate        — save file + start generation');
  console.log('    GET  /progress/:id    — SSE stream of generation progress');
  console.log('    GET  /latest-trip     — find latest generated trip HTML');
  console.log('    GET  /file/:path      — serve files from generated_trips/');
  console.log('    GET  /locales/:file   — serve i18n catalog JSON files');
```

---

## 2. Markdown Format Specification

No change to the generated markdown format. The extraction is purely an i18n infrastructure change. The markdown output template in `generateMarkdown()` is unaffected.

---

## 3. HTML Rendering Specification

### 3.1 FOUC Prevention

A CSS class `i18n-loading` is added to `<body>` in the HTML source. While present, all elements with `data-i18n` or `data-i18n-placeholder` have `visibility: hidden`. This prevents users from seeing raw translation keys or English text before the target language catalog loads.

The class is removed by the init function after `setLanguage()` completes, which guarantees translated content is rendered on first visible paint.

### 3.2 No Visual Changes

No HTML structure, CSS classes, or component layout changes. The page looks identical before and after the extraction.

---

## 4. Rule File Updates

| Rule File | Section | Change |
|---|---|---|
| `trip_intake_rules.md` | §Internationalization (i18n), paragraph 4 ("The `setLanguage(code)` function...") | Update to describe async fetch from `locales/ui_{lang}.json` instead of inline `TRANSLATIONS` object |
| `trip_intake_rules.md` | §Internationalization (i18n), bullet "All UI text..." about `ITEM_I18N` | Update to reference `_items` key in `locales/ui_{lang}.json` instead of inline `ITEM_I18N` map |
| `trip_intake_rules.md` | §Internationalization (i18n), bullet "When adding new UI text..." | Change "add the key to the `TRANSLATIONS` object for all 12 languages" to "add the key to all `locales/ui_{lang}.json` files" |
| `trip_intake_rules.md` | §Internationalization (i18n), bullet "When adding new items..." | Change "add RU and HE translations to the `ITEM_I18N` map" to "add translated names to the `_items` key in `locales/ui_ru.json` and `locales/ui_he.json`" |
| `trip_intake_rules.md` | §Internationalization (i18n) | Add new bullet: "The page requires HTTP serving (e.g., `node trip_bridge.js`) for catalog loading. Direct `file://` access shows an informative error." |
| `trip_intake_rules.md` | §Dependencies line | Update from "None (standalone HTML — no build step, no external JS frameworks)" to "HTTP server required for i18n catalog loading. Recommended: `node trip_bridge.js`. No build step, no external JS frameworks." |
| `trip_intake_rules.md` | §How to Modify, "Adding a new interest pool" step 4 | Add step: "5. Add translations to `_items` key in relevant `ui_{lang}.json` files" |
| `trip_intake_rules.md` | §How to Modify | Add new subsection: "Adding a new UI translation key" |
| `trip_intake_rules.md` | §How to Modify | Add new subsection: "Adding a new item to INTEREST_DB/AVOID_DB/FOOD_DB/VIBE_DB" |
| `trip_intake_design.md` | §Translation System, bullet 3 | Change "`TRANSLATIONS` object contains all strings keyed by language code" to "External JSON catalogs (`locales/ui_{lang}.json`) contain all strings keyed by translation key" |
| `trip_intake_design.md` | §Translation System, `setLanguage(code)` function description | Update steps to include async fetch, caching, fallback chain |
| `trip_intake_design.md` | §Translation System | Add new sub-section documenting the async loading mechanism, caching strategy, and fallback chain |
| `trip_intake_design.md` | §Translation System | Add note: "Page requires HTTP serving for catalog loading. `file://` shows an error message." |

### 4.1 Detailed Rule Updates

#### `trip_intake_rules.md` — §Internationalization (i18n)

**Current state of the section (summary):**
- References `data-i18n` attributes and `setLanguage(code)` function
- References `ITEM_I18N` map and `tItem(name)` helper
- Instructions to add keys to `TRANSLATIONS` and `ITEM_I18N`

**Target state additions/modifications:**

Add after existing RTL bullet and before language consistency rule:
```
- **Translation catalogs are external JSON files** in the `locales/` folder:
  - `locales/ui_{lang}.json` — one per language (12 files), flat key-value objects
  - Each `ui_{lang}.json` also contains an `_items` key with item name translations (merged from the former `ITEM_I18N` object)
- `setLanguage(code)` fetches `locales/ui_{lang}.json` via `fetch()`, caches in memory, and applies translations. Falls back to English catalog, then a minimal inline emergency catalog.
- `tItem(name)` reads from `_uiCache[currentLang]._items` with fallback to `_uiCache.en._items`. Same observable behavior as before.
- The page requires HTTP serving (e.g., `node trip_bridge.js` on `localhost:3456`) for catalog loading. Direct `file://` access shows an informative error message.
```

Modify existing bullets:
- "When adding new UI text, always include a `data-i18n` attribute and add the key to all `locales/ui_{lang}.json` files for all 12 languages."
- "When adding new items to INTEREST_DB, AVOID_DB, FOOD_DB, or VIBE_DB, also add the item's translated name to the `_items` key in `locales/ui_ru.json` and `locales/ui_he.json`, and the English identity mapping to all other `ui_{lang}.json` files."

#### `trip_intake_rules.md` — §Dependencies

**Current:** `**Dependencies:** None (standalone HTML — no build step, no external JS frameworks)`

**Target:** `**Dependencies:** HTTP server required for i18n catalog loading (recommended: `node trip_bridge.js`). No build step, no external JS frameworks.`

#### `trip_intake_rules.md` — §How to Modify

Add new subsections:

```markdown
### Adding new UI text
1. Add the `data-i18n="key"` attribute to the HTML element (or `data-i18n-placeholder` for input placeholders)
2. Add the key with the English value to `locales/ui_en.json`
3. Add the key with translated values to `locales/ui_ru.json` and `locales/ui_he.json`
4. Add the key with the English fallback value to the remaining 9 `locales/ui_{lang}.json` files
5. Update this document if the key belongs to a documented section

### Adding new items to INTEREST_DB/AVOID_DB/FOOD_DB/VIBE_DB
1. Add the item to the appropriate pool in `trip_intake.html`
2. Add the item's translated name to the `_items` key in `locales/ui_ru.json` and `locales/ui_he.json`
3. Add the item's English identity mapping to the `_items` key in all other 10 `locales/ui_{lang}.json` files
4. Update the pool tables in this document
```

Modify existing "Adding a new interest pool" to include:
```
5. Add RU and HE translations for all new items to the `_items` key in `locales/ui_ru.json` and `locales/ui_he.json`, and English identity mappings to all other `ui_{lang}.json` files
```

#### `trip_intake_design.md` — §Translation System

**Current state:**
```
### Translation System
- All static text elements have `data-i18n="key"` attribute
- Placeholders use `data-i18n-placeholder="key"`
- `TRANSLATIONS` object contains all strings keyed by language code
- `setLanguage(code)` function:
  1. Iterates all `[data-i18n]` elements and sets `textContent`
  2. Iterates all `[data-i18n-placeholder]` elements and sets `placeholder`
  3. Sets `dir="rtl"` on `<html>` for Hebrew/Arabic, `dir="ltr"` otherwise
  4. Adds `lang` attribute on `<html>`
  5. Updates `localStorage`
  6. Dispatches `languagechange` custom event for dynamic content
```

**Target state:**
```
### Translation System
- All static text elements have `data-i18n="key"` attribute
- Placeholders use `data-i18n-placeholder="key"`
- Translation data lives in external JSON catalogs under `locales/`:
  - `locales/ui_{lang}.json` — one file per language (12 total), flat key-value objects
  - Each file includes an `_items` key containing item name translations (interests, avoids, food, vibes)
- The page requires HTTP serving for catalog loading (`file://` shows an error message)
- `setLanguage(code)` function (async):
  1. Increments sequence counter to guard against race conditions on rapid language switching
  2. Checks in-memory cache for the requested language catalog
  3. On cache miss: fetches `locales/ui_{lang}.json` via `fetch()`
  4. After fetch: checks sequence counter — aborts if superseded by a newer call
  5. On fetch failure: falls back to English catalog (eagerly loaded), then inline emergency catalog
  6. Iterates all `[data-i18n]` elements and sets `textContent` (with per-key English fallback)
  7. Iterates all `[data-i18n-placeholder]` elements and sets `placeholder`
  8. Sets `dir="rtl"` on `<html>` for Hebrew/Arabic, `dir="ltr"` otherwise
  9. Adds `lang` attribute on `<html>`
  10. Updates `localStorage`
  11. Dispatches `languagechange` custom event for dynamic content
- Caching strategy: fetched catalogs stored in `_uiCache` object, keyed by language code. Subsequent switches to a previously loaded language are synchronous (instant).
- FOUC prevention: `<body class="i18n-loading">` hides `[data-i18n]` elements until first `setLanguage()` completes.
- On page init: file:// detection runs first (abort with error if file://). English UI catalog loaded eagerly (includes item translations via `_items` key). User's preferred language catalog loaded next (if not English). Page unhidden after all initial loading completes. Cold load: 1 request (EN) or 2 requests (EN + target lang).
```

---

## 5. Implementation Checklist

- [ ] Create `locales/` folder in project root
- [ ] Extract `TRANSLATIONS.en` into `locales/ui_en.json` (include `_items` key with English identity mappings from `ITEM_I18N`)
- [ ] Extract `TRANSLATIONS.ru` into `locales/ui_ru.json` (include `_items` key with Russian translations from `ITEM_I18N`)
- [ ] Extract `TRANSLATIONS.he` into `locales/ui_he.json` (include `_items` key with Hebrew translations from `ITEM_I18N`)
- [ ] Create `locales/ui_es.json` through `locales/ui_ar.json` (9 files, copies of English including `_items`)
- [ ] Validate all JSON files parse without errors
- [ ] Validate key counts: `ui_en.json` UI keys == `TRANSLATIONS.en` keys, etc.
- [ ] Validate `_items` entry count in each file == `ITEM_I18N` keys (~150)
- [ ] In `trip_intake.html`: remove `TRANSLATIONS` const (~1,217 lines)
- [ ] In `trip_intake.html`: remove `ITEM_I18N` const (~237 lines)
- [ ] In `trip_intake.html`: add `_uiCache`, `_langRequestId`, `_EMERGENCY_CATALOG` declarations
- [ ] In `trip_intake.html`: add `fetchUiCatalog()` function
- [ ] In `trip_intake.html`: update `t()` to read from `_uiCache`
- [ ] In `trip_intake.html`: update `tItem()` to read from `_uiCache[lang]._items`
- [ ] In `trip_intake.html`: update `setLanguage()` to async with fetch/cache/fallback + sequence counter (FB-2)
- [ ] In `trip_intake.html`: update `initLangSelector()` IIFE to async; file:// check as first statement (FB-3)
- [ ] In `trip_intake.html`: add FOUC prevention CSS + `i18n-loading` body class
- [ ] In `trip_intake.html`: add `file://` protocol detection (first statement in init)
- [ ] In `trip_intake.html`: add FB-4 comment to emergency catalog (RTL + English accepted state)
- [ ] In `trip_intake.html`: update calendar/month translation references (3 occurrences)
- [ ] In `trip_bridge.js`: add `/` and `/trip_intake.html` serving route (with FB-5 comment)
- [ ] In `trip_bridge.js`: add `/locales/*` serving route with cache headers
- [ ] In `trip_bridge.js`: update console help output
- [ ] Update `trip_intake_rules.md` §Internationalization (i18n)
- [ ] Update `trip_intake_rules.md` §Dependencies
- [ ] Update `trip_intake_rules.md` §How to Modify
- [ ] Update `trip_intake_design.md` §Translation System
- [ ] Post-extraction validation: count UI keys in JSON files vs original inline objects
- [ ] Post-extraction validation: count `_items` entries in each JSON file vs `ITEM_I18N`
- [ ] Post-extraction validation: count `data-i18n` attributes in HTML (unchanged)
- [ ] End-to-end test: EN, RU, HE language switch via bridge server
- [ ] End-to-end test: card rendering (interests, avoids, food, vibes) in all 3 languages
- [ ] End-to-end test: calendar month/day names in RU and HE
- [ ] End-to-end test: `file://` protocol shows error message
- [ ] End-to-end test: generated markdown output unchanged
- [ ] End-to-end test: rapid language switching (verify race condition guard)

---

## 6. BRD Traceability

| Requirement | Acceptance Criterion | Implemented in |
|---|---|---|
| REQ-001 | AC-1: `locales/` folder exists | §1.1 — new folder |
| REQ-001 | AC-2: One JSON per language for UI strings | §1.1–§1.4 — 12 `ui_{lang}.json` files |
| REQ-001 | AC-3: One shared items JSON | §1.5 — items merged into `_items` key in each `ui_{lang}.json` (no separate file; functionally equivalent — same data, same access pattern) |
| REQ-001 | AC-4: Flat key-value, keys match data-i18n | §1.1 — JSON structure spec |
| REQ-001 | AC-5: items data mirrors ITEM_I18N | §1.1–§1.4 — `_items` key in each `ui_{lang}.json` mirrors ITEM_I18N data |
| REQ-001 | AC-6: Valid JSON | §5 — validation checklist step |
| REQ-001 | AC-7: Key count matches | §5 — validation checklist step |
| REQ-002 | AC-1: setLanguage fetches via fetch() | §1.12 — async setLanguage |
| REQ-002 | AC-2: Fetched catalogs cached | §1.8 — fetchUiCatalog with _uiCache |
| REQ-002 | AC-3: Fallback chain | §1.12 — tr -> _uiCache.en -> _EMERGENCY_CATALOG |
| REQ-002 | AC-4: English eagerly loaded | §1.13 — Promise.all in init |
| REQ-002 | AC-5: data-i18n/placeholder translated correctly | §1.12 — same querySelectorAll logic |
| REQ-002 | AC-6: RTL continues to work | §1.12 — meta.dir setting unchanged |
| REQ-002 | AC-7: localStorage persistence | §1.12 — localStorage.setItem unchanged |
| REQ-002 | AC-8: Cached languages instant | §1.12 — fast path (sync) for cached |
| REQ-002 | AC-9: TRANSLATIONS const removed | §1.6 — removal spec |
| REQ-003 | AC-1: items data loaded on init | §1.13 — items loaded as part of `fetchUiCatalog('en')` (merged into `_items` key) |
| REQ-003 | AC-2: tItem returns correct translations | §1.11 — reads from `_uiCache[lang]._items` |
| REQ-003 | AC-3: tItem English fallback | §1.11 — fallback to `_uiCache.en._items` then raw name |
| REQ-003 | AC-4: Cards display correctly | §5 — end-to-end test |
| REQ-003 | AC-5: Markdown uses data-en-name | Not affected — no change to card HTML or generateMarkdown |
| REQ-003 | AC-6: ITEM_I18N const removed | §1.7 — removal spec |
| REQ-004 | AC-1: Works via trip_bridge.js | §1.17, §1.18 — locales + HTML routes |
| REQ-004 | AC-2: Works via any static HTTP server | §1.8 — standard fetch, no special server logic |
| REQ-004 | AC-3: No build step | All files are plain JSON, no transpilation |
| REQ-004 | AC-4: file:// shows error message | §1.15 — protocol detection |
| REQ-004 | AC-5: trip_bridge.js serves locales/ | §1.17 — /locales/* route |
| REQ-005 | AC-1: English loaded before first render | §1.13 — await fetchUiCatalog('en') before setLanguage |
| REQ-005 | AC-2: User's lang loaded before showing | §1.13 — pre-fetch target lang, then setLanguage |
| REQ-005 | AC-3: At most 2 requests on cold load | §1.13 — EN catalog only (1 request) for English users; EN + target lang (2 requests) for non-English users. **Fully satisfied.** |
| REQ-005 | AC-4: Cache-Control headers | §1.17 — `Cache-Control: public, max-age=3600` |
| REQ-005 | AC-5: No FOUC | §1.14 — `i18n-loading` class + visibility:hidden |
| REQ-006 | AC-1: rules.md documents locales/ structure | §4.1 — rule update spec |
| REQ-006 | AC-2: rules.md documents async fetch | §4.1 — rule update spec |
| REQ-006 | AC-3: rules.md How to Modify for UI text | §4.1 — new subsection |
| REQ-006 | AC-4: rules.md How to Modify for items | §4.1 — new subsection |
| REQ-006 | AC-5: design.md documents fetch/cache/fallback | §4.1 — Translation System update |
| REQ-006 | AC-6: design.md documents HTTP requirement | §4.1 — new note |
| REQ-006 | AC-7: Existing valid rules retained | §4.1 — only additions/modifications, no deletions of valid rules |
| REQ-007 | AC-1: EN keys match | §5 — validation checklist |
| REQ-007 | AC-2: RU keys match | §5 — validation checklist |
| REQ-007 | AC-3: HE keys match | §5 — validation checklist |
| REQ-007 | AC-4: ITEM_I18N entries match | §5 — validation checklist |
| REQ-007 | AC-5: data-i18n count unchanged | §5 — validation checklist |
| REQ-007 | AC-6: Validation step exists | §5 — explicit validation steps in checklist |

### Note on REQ-005 AC-3 (Resolved — SA FB-1)

**Original issue (v1):** Non-English cold load made 3 requests (ui_en.json + items_i18n.json + ui_{lang}.json), violating REQ-005 AC-3 "at most 2."

**Resolution (v2):** Per SA feedback FB-1 Option A, `items_i18n.json` content is merged into each `ui_{lang}.json` file under a reserved `_items` key. Cold load is now exactly 1 request for English users (ui_en.json) and exactly 2 requests for non-English users (ui_en.json + ui_{lang}.json). **REQ-005 AC-3 is fully satisfied.**

**Trade-off accepted:** ~5KB larger per-language files; item translations duplicated across 12 files. This is acceptable given the files are served locally and the duplication enables simpler fetch logic and strict BRD compliance.

### SA Feedback Resolution Summary

| FB | Severity | Status | Resolution |
|---|---|---|---|
| FB-1 | Blocking | Resolved | Merged `items_i18n.json` into `_items` key in each `ui_{lang}.json` — cold load reduced to 1-2 requests (§1.1–§1.5, §1.11, §1.13) |
| FB-2 | Recommendation | Addressed | Added `_langRequestId` sequence counter to `setLanguage()` (§1.6, §1.12) |
| FB-3 | Recommendation | Addressed | file:// detection is now explicitly the first statement in `initLangSelector()` (§1.13, §1.15) |
| FB-4 | Observation | Addressed | Added comment to `_EMERGENCY_CATALOG` noting RTL + English is accepted degraded state (§1.14) |
| FB-5 | Observation | Addressed | Added comment to bridge server HTML route noting static asset limitation (§1.18) |
