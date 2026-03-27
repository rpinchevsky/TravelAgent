# Business Requirements Document

**Change:** Add "Mix of All" option to categorical quiz questions
**Date:** 2026-03-22
**Author:** Product Manager
**Status:** Approved

---

## 1. Background & Motivation

The Step 2 questionnaire in `trip_intake.html` contains 30 preference questions. Most spectrum-type questions already provide a middle/balanced option (e.g., "both", "mix", "flexible"). However, three questions present **distinct categories** (not a spectrum) and force the user to pick a single category, even though many travelers genuinely want a mix of all options:

| Question | Current options | Gap |
|---|---|---|
| `diningstyle` (Q9, T1) | street / casual / upscale | No way to say "I enjoy all dining styles" |
| `mealpriority` (Q11, T2) | breakfast / lunch / dinner | No way to say "every meal matters equally" |
| `transport` (Q17, T3) | walking / transit / taxi | No way to say "use whatever fits best" |

Currently, users who want variety are forced to pick one category, which skews the generated trip toward that single preference. Adding a "mix" option for these three questions aligns the questionnaire with actual traveler behavior and produces more balanced itineraries.

## 2. Scope

**In scope:**
- Add a 4th "mix" option card to `diningstyle`, `mealpriority`, and `transport` questions in `trip_intake.html`
- Add corresponding i18n keys (title + description) to all 12 locale files (`locales/ui_*.json`)
- Update `QUESTION_DEFAULTS` for the three questions if the new mix value is a better neutral default (analysis: current defaults `casual`, `dinner`, `transit` remain appropriate as they are the most common single choice; the mix option is an explicit preference, not a neutral fallback)
- Update markdown generation labels in `trip_intake.html` to include the new values (`diningStyleLabels`, `mealLabels`, `transportLabels`)
- Update `scoreFoodItem()` function to handle `diningstyle: 'mix'` (all styles get a moderate boost instead of one style getting a full match)
- Update `trip_intake_rules.md` to document the new option values and their semantics
- Update `content_format_rules.md` if it references specific allowed values for these questions

**Out of scope:**
- Adding mix options to questions that already have a middle/balanced option (22 questions)
- Adding mix options to multi-category questions where mixing is not meaningful (`diet`, `kidsfood`, `rhythm`)
- Changes to trip generation logic (Phase A/B) -- the generated markdown already flows through to trip planning; no planner changes needed
- Changes to HTML rendering or CSS -- the existing 4-card layout is already supported by the grid system

**Affected files:**
- `trip_intake.html` -- HTML cards, JS scoring, JS markdown generation, `QUESTION_DEFAULTS` constant
- `locales/ui_en.json`, `locales/ui_ru.json`, `locales/ui_he.json`, `locales/ui_es.json`, `locales/ui_fr.json`, `locales/ui_de.json`, `locales/ui_it.json`, `locales/ui_pt.json`, `locales/ui_zh.json`, `locales/ui_ja.json`, `locales/ui_ko.json`, `locales/ui_ar.json` -- new i18n keys
- `trip_intake_rules.md` -- allowed values documentation

## 3. Requirements

### REQ-001: Add "Mix of All" option to `diningstyle` question

**Description:** The `diningstyle` question (Q9, Tier 1) must gain a 4th option card with `data-value="mix"` that represents enjoying a variety of dining styles (street food, casual, and upscale) across the trip.

**Acceptance Criteria:**
- [ ] AC-1: The question slide `[data-question="diningstyle"]` contains exactly 4 `.q-card` elements
- [ ] AC-2: One `.q-card` has `data-value="mix"`
- [ ] AC-3: The mix card has a `[data-i18n]` attribute on its title element with key `q_dine_mix`
- [ ] AC-4: The mix card has a `[data-i18n]` attribute on its description element with key `q_dine_mix_desc`
- [ ] AC-5: The mix card has a `.q-card__icon` element containing an emoji
- [ ] AC-6: Selecting the mix card applies `is-selected` class and deselects other cards in the same question

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` -- question HTML block for `diningstyle`

---

### REQ-002: Add "Every Meal Counts" option to `mealpriority` question

**Description:** The `mealpriority` question (Q11, Tier 2) must gain a 4th option card with `data-value="all"` that represents treating every meal as equally important throughout the trip.

**Acceptance Criteria:**
- [ ] AC-1: The question slide `[data-question="mealpriority"]` contains exactly 4 `.q-card` elements
- [ ] AC-2: One `.q-card` has `data-value="all"`
- [ ] AC-3: The card has a `[data-i18n]` attribute on its title element with key `q_meal_all`
- [ ] AC-4: The card has a `[data-i18n]` attribute on its description element with key `q_meal_all_desc`
- [ ] AC-5: The card has a `.q-card__icon` element containing an emoji
- [ ] AC-6: Selecting the card applies `is-selected` class and deselects other cards in the same question

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` -- question HTML block for `mealpriority`

---

### REQ-003: Add "Mix It Up" option to `transport` question

**Description:** The `transport` question (Q17, Tier 3) must gain a 4th option card with `data-value="mix"` that represents using whatever transport mode is most convenient for each situation (walking, transit, or taxi as appropriate).

**Acceptance Criteria:**
- [ ] AC-1: The question slide `[data-question="transport"]` contains exactly 4 `.q-card` elements
- [ ] AC-2: One `.q-card` has `data-value="mix"`
- [ ] AC-3: The card has a `[data-i18n]` attribute on its title element with key `q_transport_mix`
- [ ] AC-4: The card has a `[data-i18n]` attribute on its description element with key `q_transport_mix_desc`
- [ ] AC-5: The card has a `.q-card__icon` element containing an emoji
- [ ] AC-6: Selecting the card applies `is-selected` class and deselects other cards in the same question

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` -- question HTML block for `transport`

---

### REQ-004: Internationalize all new option labels

**Description:** All 6 new i18n keys (title + description for each of the 3 new options) must be present in all 12 locale files under `locales/`.

**Acceptance Criteria:**
- [ ] AC-1: Each of the 12 `locales/ui_*.json` files contains keys: `q_dine_mix`, `q_dine_mix_desc`, `q_meal_all`, `q_meal_all_desc`, `q_transport_mix`, `q_transport_mix_desc`
- [ ] AC-2: No key has an empty string value
- [ ] AC-3: All locale files remain valid JSON after the update

**Priority:** Must-have

**Affected components:**
- `locales/ui_en.json`, `locales/ui_ru.json`, `locales/ui_he.json`, `locales/ui_es.json`, `locales/ui_fr.json`, `locales/ui_de.json`, `locales/ui_it.json`, `locales/ui_pt.json`, `locales/ui_zh.json`, `locales/ui_ja.json`, `locales/ui_ko.json`, `locales/ui_ar.json`

---

### REQ-005: Update markdown generation to include new values

**Description:** The markdown generation logic in `trip_intake.html` must map the new option values to human-readable labels so that the generated `trip_details.md` reflects the user's choice correctly.

**Acceptance Criteria:**
- [ ] AC-1: The `diningStyleLabels` object includes a key for `mix`
- [ ] AC-2: The `mealLabels` object includes a key for `all`
- [ ] AC-3: The `transportLabels` object includes a key for `mix`
- [ ] AC-4: When any of the three new options is selected and the trip markdown is generated, the corresponding preference line contains a non-empty label (not "undefined" or the raw value)

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` -- `generateMarkdown()` function, `diningStyleLabels`, `mealLabels`, `transportLabels` objects

---

### REQ-006: Update food scoring logic for `diningstyle: 'mix'`

**Description:** The `scoreFoodItem()` function must handle `diningstyle === 'mix'` so that food items of any dining style receive a moderate score boost (not penalized and not fully boosted), producing a balanced selection across street, casual, and upscale food experiences.

**Acceptance Criteria:**
- [ ] AC-1: When `diningstyle` is `'mix'`, no food item receives 0 points for style mismatch
- [ ] AC-2: When `diningstyle` is `'mix'`, all food items receive at least a partial style match score (>= 1 point for the style dimension)
- [ ] AC-3: The scoring for existing `diningstyle` values (`street`, `casual`, `upscale`) is unchanged

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` -- `scoreFoodItem()` function

---

### REQ-007: Update rule documentation

**Description:** The `trip_intake_rules.md` file must document the new option values for `diningstyle`, `mealpriority`, and `transport`, including their semantics and the fact that they represent a "mix of all" selection.

**Acceptance Criteria:**
- [ ] AC-1: `trip_intake_rules.md` lists `mix` as a valid value for `diningstyle`
- [ ] AC-2: `trip_intake_rules.md` lists `all` as a valid value for `mealpriority`
- [ ] AC-3: `trip_intake_rules.md` lists `mix` as a valid value for `transport`

**Priority:** Must-have

**Affected components:**
- `trip_intake_rules.md`

## 4. Dependencies & Risks

| Dependency / Risk | Mitigation |
|---|---|
| 4-card grid layout may need CSS adjustment | Existing grid already supports 4 cards (e.g., `diet` question has 4 cards); verify visual alignment during implementation |
| `scoreFoodItem()` change could shift food card rankings | Keep partial-match score (2 points) for mix, which is between mismatch (1) and exact match (3); run manual comparison |
| `QUESTION_DEFAULTS` unchanged -- mix is not used as default | Intentional: defaults represent the most common single-category choice; mix is an explicit opt-in preference |
| `mealpriority` new value is `all` vs `mix` for the other two | Semantic clarity: "all meals" is clearer than "mix of meals"; ensure all label maps and scoring handle both naming conventions |
| Locale translations must be natural in each language | Translations reviewed during implementation; keys follow existing naming convention (`q_{question}_{value}`, `q_{question}_{value}_desc`) |

## 5. Acceptance Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| PM | Product Manager | 2026-03-22 | Approved |
