# Detailed Design

**Change:** Add "Mix of All" option to categorical quiz questions
**Date:** 2026-03-22
**Author:** Development Team
**HLD Reference:** `technical_documents/2026-03-22_mix-option-questions/high_level_design.md`
**Status:** Draft

---

## 1. File Changes

### 1.1 `trip_intake.html` — diningstyle question HTML (lines 2377-2397)

**Action:** Modify

**Current state:**
```html
<!-- Q9: Dining Style (T1) -->
<div class="question-slide" data-question="diningstyle" data-qindex="9" data-question-key="diningstyle" data-tier="1">
  <div class="question-slide__label" data-i18n="q_dine">Where do you love eating?</div>
  <div class="question-options">
    <div class="q-card" tabindex="0" role="button" data-value="street">
      <div class="q-card__icon">&#127838;</div>
      <div class="q-card__title" data-i18n="q_dine_street">Street Food & Markets</div>
      <div class="q-card__desc" data-i18n="q_dine_street_desc">Local stalls, food trucks, market halls</div>
    </div>
    <div class="q-card" tabindex="0" role="button" data-value="casual">
      <div class="q-card__icon">&#127869;</div>
      <div class="q-card__title" data-i18n="q_dine_casual">Casual Restaurants</div>
      <div class="q-card__desc" data-i18n="q_dine_casual_desc">Relaxed sit-down, local favorites, family-friendly</div>
    </div>
    <div class="q-card" tabindex="0" role="button" data-value="upscale">
      <div class="q-card__icon">&#127864;</div>
      <div class="q-card__title" data-i18n="q_dine_upscale">Upscale Dining</div>
      <div class="q-card__desc" data-i18n="q_dine_upscale_desc">Fine dining, tasting menus, wine pairings</div>
    </div>
  </div>
</div>
```

**Target state:**
```html
<!-- Q9: Dining Style (T1) -->
<div class="question-slide" data-question="diningstyle" data-qindex="9" data-question-key="diningstyle" data-tier="1">
  <div class="question-slide__label" data-i18n="q_dine">Where do you love eating?</div>
  <div class="question-options question-options--4">
    <div class="q-card" tabindex="0" role="button" data-value="street">
      <div class="q-card__icon">&#127838;</div>
      <div class="q-card__title" data-i18n="q_dine_street">Street Food & Markets</div>
      <div class="q-card__desc" data-i18n="q_dine_street_desc">Local stalls, food trucks, market halls</div>
    </div>
    <div class="q-card" tabindex="0" role="button" data-value="casual">
      <div class="q-card__icon">&#127869;</div>
      <div class="q-card__title" data-i18n="q_dine_casual">Casual Restaurants</div>
      <div class="q-card__desc" data-i18n="q_dine_casual_desc">Relaxed sit-down, local favorites, family-friendly</div>
    </div>
    <div class="q-card" tabindex="0" role="button" data-value="upscale">
      <div class="q-card__icon">&#127864;</div>
      <div class="q-card__title" data-i18n="q_dine_upscale">Upscale Dining</div>
      <div class="q-card__desc" data-i18n="q_dine_upscale_desc">Fine dining, tasting menus, wine pairings</div>
    </div>
    <div class="q-card" tabindex="0" role="button" data-value="mix">
      <div class="q-card__icon">&#127860;</div>
      <div class="q-card__title" data-i18n="q_dine_mix">Mix of All</div>
      <div class="q-card__desc" data-i18n="q_dine_mix_desc">Street food one day, fine dining the next</div>
    </div>
  </div>
</div>
```

**Changes:** (1) Added `question-options--4` class to the `.question-options` container. (2) Added 4th `.q-card` with `data-value="mix"`, emoji `&#127860;` (fork and knife with plate), and i18n keys `q_dine_mix` / `q_dine_mix_desc`.

**Rationale:** Follows the exact same HTML pattern as existing cards. The `question-options--4` class activates the 4-column CSS grid (already defined at line 1286) for proper visual layout.

---

### 1.2 `trip_intake.html` — mealpriority question HTML (lines 2423-2443)

**Action:** Modify

**Current state:**
```html
<!-- Q11: Meal Priority (T2) -->
<div class="question-slide" data-question="mealpriority" data-qindex="11" data-question-key="mealpriority" data-tier="2">
  <div class="question-slide__label" data-i18n="q_meal">Which meal matters most to you?</div>
  <div class="question-options">
    <div class="q-card" tabindex="0" role="button" data-value="breakfast">
      <div class="q-card__icon">&#129370;</div>
      <div class="q-card__title" data-i18n="q_meal_breakfast">Breakfast & Brunch</div>
      <div class="q-card__desc" data-i18n="q_meal_breakfast_desc">Start the day right — cafes, pastries, lazy mornings</div>
    </div>
    <div class="q-card" tabindex="0" role="button" data-value="lunch">
      <div class="q-card__icon">&#127828;</div>
      <div class="q-card__title" data-i18n="q_meal_lunch">Lunch is King</div>
      <div class="q-card__desc" data-i18n="q_meal_lunch_desc">Midday feasts, long sit-downs, local specials</div>
    </div>
    <div class="q-card" tabindex="0" role="button" data-value="dinner">
      <div class="q-card__icon">&#127863;</div>
      <div class="q-card__title" data-i18n="q_meal_dinner">Dinner is the Event</div>
      <div class="q-card__desc" data-i18n="q_meal_dinner_desc">Evening dining is the highlight of the day</div>
    </div>
  </div>
</div>
```

**Target state:**
```html
<!-- Q11: Meal Priority (T2) -->
<div class="question-slide" data-question="mealpriority" data-qindex="11" data-question-key="mealpriority" data-tier="2">
  <div class="question-slide__label" data-i18n="q_meal">Which meal matters most to you?</div>
  <div class="question-options question-options--4">
    <div class="q-card" tabindex="0" role="button" data-value="breakfast">
      <div class="q-card__icon">&#129370;</div>
      <div class="q-card__title" data-i18n="q_meal_breakfast">Breakfast & Brunch</div>
      <div class="q-card__desc" data-i18n="q_meal_breakfast_desc">Start the day right — cafes, pastries, lazy mornings</div>
    </div>
    <div class="q-card" tabindex="0" role="button" data-value="lunch">
      <div class="q-card__icon">&#127828;</div>
      <div class="q-card__title" data-i18n="q_meal_lunch">Lunch is King</div>
      <div class="q-card__desc" data-i18n="q_meal_lunch_desc">Midday feasts, long sit-downs, local specials</div>
    </div>
    <div class="q-card" tabindex="0" role="button" data-value="dinner">
      <div class="q-card__icon">&#127863;</div>
      <div class="q-card__title" data-i18n="q_meal_dinner">Dinner is the Event</div>
      <div class="q-card__desc" data-i18n="q_meal_dinner_desc">Evening dining is the highlight of the day</div>
    </div>
    <div class="q-card" tabindex="0" role="button" data-value="all">
      <div class="q-card__icon">&#11088;</div>
      <div class="q-card__title" data-i18n="q_meal_all">Every Meal Counts</div>
      <div class="q-card__desc" data-i18n="q_meal_all_desc">Every meal is an experience — no skipping allowed</div>
    </div>
  </div>
</div>
```

**Changes:** (1) Added `question-options--4` class. (2) Added 4th `.q-card` with `data-value="all"`, emoji `&#11088;` (star), and i18n keys `q_meal_all` / `q_meal_all_desc`.

**Rationale:** Uses `data-value="all"` (not `"mix"`) per BRD §4 — semantic clarity ("all meals" > "mix of meals").

---

### 1.3 `trip_intake.html` — transport question HTML (lines 2557-2577)

**Action:** Modify

**Current state:**
```html
<!-- Q17: Transport (T3) -->
<div class="question-slide" data-question="transport" data-qindex="17" data-question-key="transport" data-tier="3">
  <div class="question-slide__label" data-i18n="q_transport">Preferred way of getting around?</div>
  <div class="question-options">
    <div class="q-card" tabindex="0" role="button" data-value="walking">
      <div class="q-card__icon">&#128694;</div>
      <div class="q-card__title" data-i18n="q_transport_walking">Walking</div>
      <div class="q-card__desc" data-i18n="q_transport_walking_desc">Explore on foot, stay within walking distance</div>
    </div>
    <div class="q-card" tabindex="0" role="button" data-value="transit">
      <div class="q-card__icon">&#128652;</div>
      <div class="q-card__title" data-i18n="q_transport_transit">Public Transit</div>
      <div class="q-card__desc" data-i18n="q_transport_transit_desc">Buses, metros, trams — like a local</div>
    </div>
    <div class="q-card" tabindex="0" role="button" data-value="taxi">
      <div class="q-card__icon">&#128661;</div>
      <div class="q-card__title" data-i18n="q_transport_taxi">Taxi & Rideshare</div>
      <div class="q-card__desc" data-i18n="q_transport_taxi_desc">Door-to-door comfort, skip the wait</div>
    </div>
  </div>
</div>
```

**Target state:**
```html
<!-- Q17: Transport (T3) -->
<div class="question-slide" data-question="transport" data-qindex="17" data-question-key="transport" data-tier="3">
  <div class="question-slide__label" data-i18n="q_transport">Preferred way of getting around?</div>
  <div class="question-options question-options--4">
    <div class="q-card" tabindex="0" role="button" data-value="walking">
      <div class="q-card__icon">&#128694;</div>
      <div class="q-card__title" data-i18n="q_transport_walking">Walking</div>
      <div class="q-card__desc" data-i18n="q_transport_walking_desc">Explore on foot, stay within walking distance</div>
    </div>
    <div class="q-card" tabindex="0" role="button" data-value="transit">
      <div class="q-card__icon">&#128652;</div>
      <div class="q-card__title" data-i18n="q_transport_transit">Public Transit</div>
      <div class="q-card__desc" data-i18n="q_transport_transit_desc">Buses, metros, trams — like a local</div>
    </div>
    <div class="q-card" tabindex="0" role="button" data-value="taxi">
      <div class="q-card__icon">&#128661;</div>
      <div class="q-card__title" data-i18n="q_transport_taxi">Taxi & Rideshare</div>
      <div class="q-card__desc" data-i18n="q_transport_taxi_desc">Door-to-door comfort, skip the wait</div>
    </div>
    <div class="q-card" tabindex="0" role="button" data-value="mix">
      <div class="q-card__icon">&#128256;</div>
      <div class="q-card__title" data-i18n="q_transport_mix">Mix It Up</div>
      <div class="q-card__desc" data-i18n="q_transport_mix_desc">Walk, ride, or taxi — whatever fits the moment</div>
    </div>
  </div>
</div>
```

**Changes:** (1) Added `question-options--4` class. (2) Added 4th `.q-card` with `data-value="mix"`, emoji `&#128256;` (shuffle/twisted arrows), and i18n keys `q_transport_mix` / `q_transport_mix_desc`.

**Rationale:** Follows existing card pattern. The shuffle emoji visually communicates flexibility.

---

### 1.4 `trip_intake.html` — `scoreFoodItem()` function (line 4434)

**Action:** Modify

**Current state (lines 4451-4453):**
```js
// Dining style match
if (item.style === style) s += 3;
else s += 1; // partial match
```

**Target state:**
```js
// Dining style match
if (style === 'mix') s += 2; // mix: moderate boost for all styles
else if (item.style === style) s += 3;
else s += 1; // partial match
```

**Rationale:** When `diningstyle` is `'mix'`, every food item receives 2 points for the style dimension (between the mismatch score of 1 and exact-match score of 3). This satisfies REQ-006 AC-1 (no item gets 0 for style mismatch — the minimum is 2) and AC-2 (all items get >= 1 point). The existing single-style branches are untouched (AC-3).

---

### 1.5 `trip_intake.html` — `diningStyleLabels` (line 5457)

**Action:** Modify

**Current state:**
```js
const diningStyleLabels = { street: 'Street food & markets', casual: 'Casual restaurants', upscale: 'Upscale dining' };
```

**Target state:**
```js
const diningStyleLabels = { street: 'Street food & markets', casual: 'Casual restaurants', upscale: 'Upscale dining', mix: 'Mix of all styles' };
```

**Rationale:** Ensures the generated markdown contains a human-readable label when `diningstyle` is `'mix'` instead of falling through to the default `'Casual restaurants'`.

---

### 1.6 `trip_intake.html` — `mealLabels` (line 5460)

**Action:** Modify

**Current state:**
```js
const mealLabels = { breakfast: 'Breakfast & brunch focused', lunch: 'Lunch as the main meal', dinner: 'Dinner is the highlight' };
```

**Target state:**
```js
const mealLabels = { breakfast: 'Breakfast & brunch focused', lunch: 'Lunch as the main meal', dinner: 'Dinner is the highlight', all: 'Every meal matters equally' };
```

**Rationale:** Maps `mealpriority: 'all'` to a descriptive label in the generated markdown.

---

### 1.7 `trip_intake.html` — `transportLabels` (line 6629)

**Action:** Modify

**Current state:**
```js
const transportLabels = { walking: 'Walking', transit: 'Public Transit', taxi: 'Taxi & Rideshare' };
```

**Target state:**
```js
const transportLabels = { walking: 'Walking', transit: 'Public Transit', taxi: 'Taxi & Rideshare', mix: 'Mix — whatever fits best' };
```

**Rationale:** Maps `transport: 'mix'` to a descriptive label in the generated markdown.

---

### 1.8 `locales/ui_en.json` — new i18n keys

**Action:** Modify

**Insert after `q_dine_upscale_desc` (line 194):**
```json
  "q_dine_mix": "Mix of All",
  "q_dine_mix_desc": "Street food one day, fine dining the next",
```

**Insert after `q_meal_dinner_desc` (line 209):**
```json
  "q_meal_all": "Every Meal Counts",
  "q_meal_all_desc": "Every meal is an experience — no skipping allowed",
```

**Insert after `q_transport_taxi_desc` (line 310):**
```json
  "q_transport_mix": "Mix It Up",
  "q_transport_mix_desc": "Walk, ride, or taxi — whatever fits the moment",
```

**Rationale:** English source values used as fallback for all other locales; grouped with their respective question keys for maintainability.

---

### 1.9 `locales/ui_ru.json` — new i18n keys (Russian translations)

**Action:** Modify

**Insert after `q_dine_upscale_desc` (line 194):**
```json
  "q_dine_mix": "Всё вперемешку",
  "q_dine_mix_desc": "Сегодня стритфуд, завтра ресторан высокой кухни",
```

**Insert after `q_meal_dinner_desc` (line 209):**
```json
  "q_meal_all": "Каждый приём пищи важен",
  "q_meal_all_desc": "Каждая трапеза — это событие, ничего не пропускаем",
```

**Insert after `q_transport_taxi_desc` (line 310):**
```json
  "q_transport_mix": "По ситуации",
  "q_transport_mix_desc": "Пешком, на транспорте или такси — как удобнее",
```

---

### 1.10 `locales/ui_he.json` — new i18n keys (Hebrew translations)

**Action:** Modify

**Insert after `q_dine_upscale_desc` (line 194):**
```json
  "q_dine_mix": "מכל סוג קצת",
  "q_dine_mix_desc": "יום אחד אוכל רחוב, למחרת מסעדת שף",
```

**Insert after `q_meal_dinner_desc` (line 209):**
```json
  "q_meal_all": "כל ארוחה חשובה",
  "q_meal_all_desc": "כל ארוחה היא חוויה — לא מדלגים על כלום",
```

**Insert after `q_transport_taxi_desc` (line 310):**
```json
  "q_transport_mix": "שילוב של הכל",
  "q_transport_mix_desc": "רגלית, תחבורה ציבורית או מונית — מה שמתאים",
```

---

### 1.11 `locales/ui_es.json`, `ui_fr.json`, `ui_de.json`, `ui_it.json`, `ui_pt.json`, `ui_zh.json`, `ui_ja.json`, `ui_ko.json`, `ui_ar.json` — new i18n keys

**Action:** Modify (9 files, same structure)

Each file receives the same 6 keys at the same insertion points. Per project convention (`trip_intake_rules.md` §How to Modify), non-RU/HE locales receive English fallback values:

**Insert after `q_dine_upscale_desc`:**
```json
  "q_dine_mix": "Mix of All",
  "q_dine_mix_desc": "Street food one day, fine dining the next",
```

**Insert after `q_meal_dinner_desc`:**
```json
  "q_meal_all": "Every Meal Counts",
  "q_meal_all_desc": "Every meal is an experience — no skipping allowed",
```

**Insert after `q_transport_taxi_desc`:**
```json
  "q_transport_mix": "Mix It Up",
  "q_transport_mix_desc": "Walk, ride, or taxi — whatever fits the moment",
```

**Rationale:** Ensures no empty keys (REQ-004 AC-2) and valid JSON (AC-3). English fallback keeps the UI functional until proper translations are added.

---

### 1.12 `trip_intake_rules.md` — Output Format section

**Action:** Modify

**Current state (line 395):**
```markdown
- **Dining style:** {street food|casual|upscale}
```

**Target state:**
```markdown
- **Dining style:** {street food|casual|upscale|mix of all styles}
```

**Current state (line 396):**
```markdown
- **Meal priority:** {breakfast|lunch|dinner focus}
```

**Target state:**
```markdown
- **Meal priority:** {breakfast|lunch|dinner focus|every meal matters equally}
```

**Current state (line 429):**
```markdown
- **Transport preference:** {walking|public transit|taxi & rideshare}
```

**Target state:**
```markdown
- **Transport preference:** {walking|public transit|taxi & rideshare|mix — whatever fits best}
```

**Rationale:** Documents the new allowed values so the trip planning pipeline and any downstream consumers know that these values are valid.

---

## 2. Markdown Format Specification

No new markdown sections are introduced. The change adds new allowed values to three existing fields in the generated markdown output:

| Field | Section | New Value | Produced When |
|---|---|---|---|
| `**Dining style:**` | Culinary Profile | `Mix of all styles` | `diningstyle === 'mix'` |
| `**Meal priority:**` | Culinary Profile | `Every meal matters equally` | `mealpriority === 'all'` |
| `**Transport preference:**` | Additional Preferences | `Mix — whatever fits best` | `transport === 'mix'` |

The field positions within the markdown output remain unchanged.

## 3. HTML Rendering Specification

No new HTML components are introduced. The change adds new `q-card` elements following the existing component specification:

**Component:** `<div class="q-card" tabindex="0" role="button" data-value="{value}">`

Structure per card (identical to existing cards):
```html
<div class="q-card" tabindex="0" role="button" data-value="{value}">
  <div class="q-card__icon">{emoji}</div>
  <div class="q-card__title" data-i18n="{title_key}">{English fallback}</div>
  <div class="q-card__desc" data-i18n="{desc_key}">{English fallback}</div>
</div>
```

New card specifications:

| Question | data-value | Emoji | Title key | Desc key |
|---|---|---|---|---|
| diningstyle | `mix` | &#127860; (`&#127860;` fork-knife-plate) | `q_dine_mix` | `q_dine_mix_desc` |
| mealpriority | `all` | &#11088; (`&#11088;` star) | `q_meal_all` | `q_meal_all_desc` |
| transport | `mix` | &#128256; (`&#128256;` shuffle arrows) | `q_transport_mix` | `q_transport_mix_desc` |

CSS layout change: Three question containers gain the `question-options--4` class to activate the 4-column grid. The class is already defined:
```css
.question-options--4 { grid-template-columns: repeat(4, 1fr); max-width: 860px; }
@media (max-width: 768px) { .question-options--4 { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .question-options--4 { grid-template-columns: repeat(2, 1fr); } }
```

## 4. Rule File Updates

| Rule File | Section | Change |
|---|---|---|
| `trip_intake_rules.md` | Output Format — Culinary Profile (line 395) | Add `mix of all styles` to `Dining style` allowed values |
| `trip_intake_rules.md` | Output Format — Culinary Profile (line 396) | Add `every meal matters equally` to `Meal priority` allowed values |
| `trip_intake_rules.md` | Output Format — Additional Preferences (line 429) | Add `mix — whatever fits best` to `Transport preference` allowed values |
| `content_format_rules.md` | N/A | No change needed — does not enumerate allowed values for these fields |

## 5. Implementation Checklist

- [ ] Add 4th card (`data-value="mix"`) to diningstyle question HTML; add `question-options--4` class to container
- [ ] Add 4th card (`data-value="all"`) to mealpriority question HTML; add `question-options--4` class to container
- [ ] Add 4th card (`data-value="mix"`) to transport question HTML; add `question-options--4` class to container
- [ ] Add `style === 'mix'` branch to `scoreFoodItem()` before the existing `item.style === style` check
- [ ] Add `mix` key to `diningStyleLabels` object
- [ ] Add `all` key to `mealLabels` object
- [ ] Add `mix` key to `transportLabels` object
- [ ] Add 6 i18n keys to `locales/ui_en.json` (English source values)
- [ ] Add 6 i18n keys to `locales/ui_ru.json` (Russian translations)
- [ ] Add 6 i18n keys to `locales/ui_he.json` (Hebrew translations)
- [ ] Add 6 i18n keys to remaining 9 locale files (English fallback values)
- [ ] Update `trip_intake_rules.md` — Dining style allowed values
- [ ] Update `trip_intake_rules.md` — Meal priority allowed values
- [ ] Update `trip_intake_rules.md` — Transport preference allowed values
- [ ] Verify `QUESTION_DEFAULTS` — confirm no changes needed (defaults remain `casual`, `dinner`, `transit`)
- [ ] Visual test: verify 4-card grid renders correctly on desktop, tablet (768px), and mobile (600px)
- [ ] Functional test: select each new option, generate markdown, verify label appears correctly

## 6. BRD Traceability

| Requirement | Acceptance Criterion | Implemented in |
|---|---|---|
| REQ-001 | AC-1: 4 `.q-card` elements in diningstyle | §1.1 — diningstyle HTML (add 4th card) |
| REQ-001 | AC-2: card with `data-value="mix"` | §1.1 — `data-value="mix"` on new card |
| REQ-001 | AC-3: title `data-i18n="q_dine_mix"` | §1.1 — `q_dine_mix` on `.q-card__title` |
| REQ-001 | AC-4: desc `data-i18n="q_dine_mix_desc"` | §1.1 — `q_dine_mix_desc` on `.q-card__desc` |
| REQ-001 | AC-5: `.q-card__icon` with emoji | §1.1 — `&#127860;` in `.q-card__icon` |
| REQ-001 | AC-6: `is-selected` single-select behavior | No code change — existing click handler on `.q-card` applies to all cards in container |
| REQ-002 | AC-1: 4 `.q-card` elements in mealpriority | §1.2 — mealpriority HTML (add 4th card) |
| REQ-002 | AC-2: card with `data-value="all"` | §1.2 — `data-value="all"` on new card |
| REQ-002 | AC-3: title `data-i18n="q_meal_all"` | §1.2 — `q_meal_all` on `.q-card__title` |
| REQ-002 | AC-4: desc `data-i18n="q_meal_all_desc"` | §1.2 — `q_meal_all_desc` on `.q-card__desc` |
| REQ-002 | AC-5: `.q-card__icon` with emoji | §1.2 — `&#11088;` in `.q-card__icon` |
| REQ-002 | AC-6: `is-selected` single-select behavior | No code change — existing click handler |
| REQ-003 | AC-1: 4 `.q-card` elements in transport | §1.3 — transport HTML (add 4th card) |
| REQ-003 | AC-2: card with `data-value="mix"` | §1.3 — `data-value="mix"` on new card |
| REQ-003 | AC-3: title `data-i18n="q_transport_mix"` | §1.3 — `q_transport_mix` on `.q-card__title` |
| REQ-003 | AC-4: desc `data-i18n="q_transport_mix_desc"` | §1.3 — `q_transport_mix_desc` on `.q-card__desc` |
| REQ-003 | AC-5: `.q-card__icon` with emoji | §1.3 — `&#128256;` in `.q-card__icon` |
| REQ-003 | AC-6: `is-selected` single-select behavior | No code change — existing click handler |
| REQ-004 | AC-1: 6 keys in all 12 locale files | §1.8–§1.11 — keys added to all 12 files |
| REQ-004 | AC-2: no empty string values | §1.8–§1.11 — all values are non-empty strings |
| REQ-004 | AC-3: valid JSON after update | Implementation must verify JSON validity after each edit |
| REQ-005 | AC-1: `diningStyleLabels` includes `mix` | §1.5 — `mix: 'Mix of all styles'` added |
| REQ-005 | AC-2: `mealLabels` includes `all` | §1.6 — `all: 'Every meal matters equally'` added |
| REQ-005 | AC-3: `transportLabels` includes `mix` | §1.7 — `mix: 'Mix — whatever fits best'` added |
| REQ-005 | AC-4: non-empty label in generated markdown | §1.5–§1.7 — all new keys have non-empty string values; fallback `||` operators remain as safety net |
| REQ-006 | AC-1: no 0 points for style when mix | §1.4 — `style === 'mix'` branch yields `s += 2` (never 0) |
| REQ-006 | AC-2: all items get >= 1 point for style | §1.4 — all items get exactly 2 points when `style === 'mix'` |
| REQ-006 | AC-3: existing scoring unchanged | §1.4 — new branch is first; existing `if/else` untouched |
| REQ-007 | AC-1: `mix` listed for diningstyle | §1.12 — `mix of all styles` added to allowed values |
| REQ-007 | AC-2: `all` listed for mealpriority | §1.12 — `every meal matters equally` added to allowed values |
| REQ-007 | AC-3: `mix` listed for transport | §1.12 — `mix — whatever fits best` added to allowed values |
