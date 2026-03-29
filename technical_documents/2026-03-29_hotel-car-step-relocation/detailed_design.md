# Detailed Design

**Change:** Relocate Hotel & Car Rental Assistance to a New Dedicated Step 2
**Date:** 2026-03-29
**Author:** Development Team
**HLD Reference:** `technical_documents/2026-03-29_hotel-car-step-relocation/high_level_design.md`
**Status:** Draft

---

## 1. File Changes

### 1.1 `trip_intake.html` — Stepper Navigation HTML (lines ~2178-2212)

**Action:** Modify

**Current state:**
```html
<nav class="stepper" id="stepper" role="tablist" aria-label="Wizard steps">
  <div class="stepper__line"><div class="stepper__line-fill" id="stepperFill"></div></div>
  <div class="stepper__step is-active" data-step="0" ...><!-- Trip --></div>
  <div class="stepper__step" data-step="1" ...><!-- Travelers --></div>
  <div class="stepper__step" data-step="2" ...><!-- Style (&#127919;) --></div>
  <div class="stepper__step" data-step="3" ...><!-- Interests --></div>
  <div class="stepper__step" data-step="4" ...><!-- Avoid --></div>
  <div class="stepper__step" data-step="5" ...><!-- Food --></div>
  <div class="stepper__step" data-step="6" ...><!-- Details --></div>
  <div class="stepper__step" data-step="7" ...><!-- Review --></div>
</nav>
```

**Target state:**
```html
<nav class="stepper" id="stepper" role="tablist" aria-label="Wizard steps">
  <div class="stepper__line"><div class="stepper__line-fill" id="stepperFill"></div></div>
  <div class="stepper__step is-active" data-step="0" role="tab" aria-selected="true">
    <div class="stepper__circle"><span>&#9992;&#65039;</span></div>
    <div class="stepper__label" data-i18n="step_trip">Trip</div>
  </div>
  <div class="stepper__step" data-step="1" role="tab" aria-selected="false">
    <div class="stepper__circle"><span>&#128101;</span></div>
    <div class="stepper__label" data-i18n="step_travelers">Travelers</div>
  </div>
  <div class="stepper__step" data-step="2" role="tab" aria-selected="false">
    <div class="stepper__circle"><span>&#127976;</span></div>
    <div class="stepper__label" data-i18n="step_stay">Stay</div>
  </div>
  <div class="stepper__step" data-step="3" role="tab" aria-selected="false">
    <div class="stepper__circle"><span>&#127919;</span></div>
    <div class="stepper__label" data-i18n="step_style">Style</div>
  </div>
  <div class="stepper__step" data-step="4" role="tab" aria-selected="false">
    <div class="stepper__circle"><span>&#10084;&#65039;</span></div>
    <div class="stepper__label" data-i18n="step_interests">Interests</div>
  </div>
  <div class="stepper__step" data-step="5" role="tab" aria-selected="false">
    <div class="stepper__circle"><span>&#128683;</span></div>
    <div class="stepper__label" data-i18n="step_avoid">Avoid</div>
  </div>
  <div class="stepper__step" data-step="6" role="tab" aria-selected="false">
    <div class="stepper__circle"><span>&#127869;</span></div>
    <div class="stepper__label" data-i18n="step_food">Food</div>
  </div>
  <div class="stepper__step" data-step="7" role="tab" aria-selected="false">
    <div class="stepper__circle"><span>&#127758;</span></div>
    <div class="stepper__label" data-i18n="step_details">Details</div>
  </div>
  <div class="stepper__step" data-step="8" role="tab" aria-selected="false">
    <div class="stepper__circle"><span>&#9989;</span></div>
    <div class="stepper__label" data-i18n="step_review">Review</div>
  </div>
</nav>
```

**Changes summary:**
- Insert new stepper entry at `data-step="2"` with hotel emoji `&#127976;` (🏨), label `step_stay`
- Old `data-step="2"` (Style) becomes `data-step="3"`, `data-step="3"` (Interests) becomes `data-step="4"`, etc.
- Old `data-step="7"` (Review) becomes `data-step="8"`
- Total: 9 stepper entries (was 8)

**Rationale:** REQ-005 requires 9 stepper circles with the new Step 2 icon at index 2.

---

### 1.2 `trip_intake.html` — New Step 2 Panel (insert after Step 1 section closing tag)

**Action:** Create (insert new section)

**Current state:** Step 1 `</section>` is immediately followed by the depth selector overlay comment and Step 2 (questionnaire).

**Target state:** Insert a new `<section class="step" data-step="2">` between Step 1's `</section>` (line ~2297) and the depth selector overlay comment (line ~2299). The new section contains the step title, description, and placeholder containers for the hotel and car sections (which will be moved here from old Step 6).

```html
      <!-- ============ STEP 2: Plan Your Stay & Travel ============ -->
      <section class="step" data-step="2">
        <h2 class="step__title" data-i18n="s2_title">Plan Your Stay & Travel</h2>
        <p class="step__desc" data-i18n="s2_desc">Need help finding accommodation or a rental car? Toggle the options below — skip if you've got it covered.</p>

        <!-- Hotel and Car sections will be moved here from old Step 6 -->

        <div class="btn-bar">
          <button type="button" class="btn btn--secondary btn-prev" data-i18n="btn_back">&larr; Back</button>
          <button type="button" class="btn btn--primary btn-next" data-i18n="btn_continue">Continue &rarr;</button>
        </div>
      </section>
```

**Rationale:** REQ-001 requires a new Step 2 with title, description, and standard navigation buttons. No validation gate (both toggles default to "No").

---

### 1.3 `trip_intake.html` — Relocate Hotel & Car Sections from Step 6 to Step 2

**Action:** Modify (cut & paste DOM blocks)

**Cut from Step 6 (currently lines ~3143-3530):** The entire `#hotelAssistanceSection` div and `#carAssistanceSection` div (including all children — toggle, sub-questions body, all 7 hotel sub-questions, all 6 car sub-questions).

**Paste into new Step 2:** Between the step description `<p>` and the `.btn-bar`, insert both assistance sections.

**What remains in old Step 6 (now Step 7):** Report Language, POI Languages hint, Extra Notes textarea, Wheelchair Accessibility question, and the btn-bar (with the Continue button text updated from "Review My Trip" to use the same label as before).

**Rationale:** REQ-002 and REQ-003 require relocating hotel and car sections to Step 2. REQ-006 requires they are absent from Step 7.

---

### 1.4 `trip_intake.html` — Renumber All Step Panels (data-step attributes)

**Action:** Modify

Every `<section class="step" data-step="N">` for N >= 2 must be renumbered. Additionally, every HTML comment labeling the step must be updated.

| Current `data-step` | Current Label | New `data-step` | New Label |
|---|---|---|---|
| 0 | Where & When | 0 | Where & When (unchanged) |
| 1 | Travelers | 1 | Travelers (unchanged) |
| — | — | **2** | **Plan Your Stay & Travel (NEW)** |
| 2 | Trip Style Questionnaire | **3** | Trip Style Questionnaire |
| 3 | Interests | **4** | Interests |
| 4 | Things to Avoid | **5** | Things to Avoid |
| 5 | Food & Dining | **6** | Food & Dining |
| 6 | Language & Extras | **7** | Language & Extras |
| 7 | Review & Download | **8** | Review & Download |

**Exact HTML elements to change:**
- Line ~2303: `<section class="step" data-step="2">` → `data-step="3"`
- Line ~3016: `<section class="step" data-step="3">` → `data-step="4"`
- Line ~3038: `<section class="step" data-step="4">` → `data-step="5"`
- Line ~3062: `<section class="step" data-step="5">` → `data-step="6"`
- Line ~3094: `<section class="step" data-step="6">` → `data-step="7"`
- Line ~3539: `<section class="step" data-step="7">` → `data-step="8"`

**Rationale:** REQ-004 requires exactly 9 step elements with `data-step` values 0-8.

---

### 1.5 `trip_intake.html` — Renumber i18n `data-i18n` Attributes on Step Titles/Descriptions

**Action:** Modify

The `data-i18n` attributes on step titles and descriptions must be renumbered to match the new step positions. This is the **HTML-side renumbering** — the i18n key values in locale files must also be updated (see section 1.11).

**Strategy:** Rename the `data-i18n` attributes in the HTML to match the new step numbers, and update the locale files to map the new keys to the correct text. This keeps the convention `sN_title` / `sN_desc` consistent with step N.

| Old key | New key | Text content |
|---|---|---|
| `s2_title` | `s2_title` (repurposed) | "Plan Your Stay & Travel" (was "What's Your Travel Style?") |
| `s2_desc` | `s2_desc` (repurposed) | "Need help finding accommodation or a rental car?..." (was "Quick questions...") |
| (old s2 values) | `s3_title` / `s3_desc` | "What's Your Travel Style?" / "Quick questions to understand your perfect trip." |
| `s3_title` / `s3_desc` | `s4_title` / `s4_desc` | (Interests step titles) |
| `s4_title` / `s4_desc` | `s5_title` / `s5_desc` | (Avoid step titles) |
| `s5_title` / `s5_desc` | `s6_title` / `s6_desc` | (Food step titles) |
| `s6_title` / `s6_desc` | `s7_title` / `s7_desc` | "Language & Extras" / "Final touches..." |
| `s7_title` / `s7_desc` | `s8_title` / `s8_desc` | "Review Your Trip Details" / "Here's the generated file..." |

**Also rename in HTML:**
- `s1_next` (Step 1 Continue button): value unchanged ("Choose Your Style") — keep as `s1_next`
- `s6_next` → `s7_next` (Step 7 Continue button: "Review My Trip")
- `s7_edit` → `s8_edit` (Step 8 Back button: "Edit")
- `s7_copy`, `s7_copy_clip`, `s7_download` → `s8_copy`, `s8_copy_clip`, `s8_download`
- `s7_post_*` → `s8_post_*` (all post-download keys)
- `s7_pipeline_*` → `s8_pipeline_*` (all pipeline roadmap keys)
- `s7_bridge_*` → `s8_bridge_*` (all bridge status keys)
- `s7_stop_*` → `s8_stop_*` (stop button key)

**Hotel/car i18n keys (`s6_hotel_*`, `s6_car_*`) do NOT change.** These keys are named after the feature, not the step number. They stay as `s6_hotel_*` and `s6_car_*` even though they now live in Step 2. Renaming ~100 keys to `s2_hotel_*` would be high-risk churn with no functional benefit.

**Rationale:** Maintains the `sN_*` naming convention for step titles/descriptions. Hotel/car keys are feature-scoped, not step-scoped, so they don't rename.

---

### 1.6 `trip_intake.html` — JavaScript: `totalSteps` and `activeSteps`

**Action:** Modify

**Current state (line ~5864):**
```js
const totalSteps = 8;
```

**Target state:**
```js
const totalSteps = 9;
```

**Current state (line ~7207):**
```js
activeSteps = [0, 1, 2, 3, 4, 5, 6, 7];
```

**Target state:**
```js
activeSteps = [0, 1, 2, 3, 4, 5, 6, 7, 8];
```

**Also (line ~7186):**
```js
let activeSteps = [0, 1, 2, 3, 4, 5, 6, 7]; // all active by default
```
→
```js
let activeSteps = [0, 1, 2, 3, 4, 5, 6, 7, 8]; // all active by default
```

**Rationale:** REQ-004, REQ-005 — wizard now has 9 steps.

---

### 1.7 `trip_intake.html` — JavaScript: `goToStep()` Step Number References

**Action:** Modify

Every hardcoded step number in `goToStep()` must shift by +1 for steps >= 2.

**Change 1 — Selection reset on leaving questionnaire (line ~5874):**
```js
// Current:
if (currentStep === 2) {
  prevInterestSel = new Set();
  prevAvoidSel = new Set();
}
// Target:
if (currentStep === 3) {
  prevInterestSel = new Set();
  prevAvoidSel = new Set();
}
```

**Change 2 — Save interest selections on leaving Step 3 (line ~5879):**
```js
// Current:
if (currentStep === 3) {
  prevInterestSel = new Set(getSelectedDynamic('interestsSections'));
}
// Target:
if (currentStep === 4) {
  prevInterestSel = new Set(getSelectedDynamic('interestsSections'));
}
```

**Change 3 — Save avoid selections on leaving Step 4 (line ~5882):**
```js
// Current:
if (currentStep === 4) {
  prevAvoidSel = new Set(getSelectedDynamic('avoidSections'));
}
// Target:
if (currentStep === 5) {
  prevAvoidSel = new Set(getSelectedDynamic('avoidSections'));
}
```

**Change 4 — Rebuild interest page on entering Step 3 (line ~5887):**
```js
// Current:
if (step === 3) { buildInterestPage(prevInterestSel); }
// Target:
if (step === 4) { buildInterestPage(prevInterestSel); }
```

**Change 5 — Rebuild avoid page on entering Step 4 (line ~5891):**
```js
// Current:
if (step === 4) { buildAvoidPage(prevAvoidSel); }
// Target:
if (step === 5) { buildAvoidPage(prevAvoidSel); }
```

**Change 6 — Build food/vibe on entering Step 5 (line ~5895):**
```js
// Current:
if (step === 5) { buildFoodPage(); buildVibePage(); }
// Target:
if (step === 6) { buildFoodPage(); buildVibePage(); }
```

**Change 7 — Reset questionnaire on entering Step 2 (line ~5901):**
```js
// Current:
if (step === 2 && currentStep !== 2) {
// Target:
if (step === 3 && currentStep !== 3) {
```

**Change 8 — Generate preview on last step (line ~5907):**
```js
// Current:
if (step === totalSteps - 1) {
// Target: (no change needed — formula uses totalSteps which is now 9, so totalSteps-1 = 8)
// This is already correct.
```

**Rationale:** REQ-004 (renumbering), REQ-010 (selection reset), REQ-009 (questionnaire reset).

---

### 1.8 `trip_intake.html` — JavaScript: `stepEmojis` Array

**Action:** Modify

**Current state (line ~5958):**
```js
const stepEmojis = ['&#9992;&#65039;', '&#128101;', '&#127919;', '&#10084;&#65039;', '&#128683;', '&#127869;', '&#127758;', '&#9989;'];
```

**Target state:**
```js
const stepEmojis = ['&#9992;&#65039;', '&#128101;', '&#127976;', '&#127919;', '&#10084;&#65039;', '&#128683;', '&#127869;', '&#127758;', '&#9989;'];
```

New entry at index 2: `&#127976;` (🏨 hotel building emoji). All subsequent entries shift right by one position.

**Rationale:** REQ-005 AC-2 — stepEmojis must have 9 entries with the new Step 2 emoji at index 2.

---

### 1.9 `trip_intake.html` — JavaScript: Auto-advance After Last Questionnaire Question

**Action:** Modify

**Current state (line ~4955):**
```js
// Last visible question — advance to step 3
goToStep(3);
```

**Target state:**
```js
// Last visible question — advance to step 4
goToStep(4);
```

**Rationale:** REQ-009 AC-3 — after the last questionnaire question, wizard advances to Step 4 (Interests, formerly Step 3).

---

### 1.10 `trip_intake.html` — JavaScript: Navigation Handlers (Continue/Back)

**Action:** Modify

**Change 1 — Back button questionnaire check (line ~6093):**
```js
// Current:
if (currentStep === 2) {
  if (currentSubQuestion > 0) {
    goToSubQuestion(currentSubQuestion - 1);
    return;
  }
}
// Target:
if (currentStep === 3) {
  if (currentSubQuestion > 0) {
    goToSubQuestion(currentSubQuestion - 1);
    return;
  }
}
```

**Change 2 — Depth overlay intercept (line ~7301):**
```js
// Current:
if (e.target.closest('.btn-next') && currentStep === 1) {
// Target: (no change — still fires on Step 1 Continue)
```
This remains unchanged. The depth overlay still fires when leaving Step 1.

**Change 3 — Depth overlay confirm: advance target (line ~7152):**
```js
// Current:
const firstActive = activeSteps.find(s => s > 1) || 2;
goToStep(firstActive);
// Target: (no change needed — finds first active step after 1, which will be 2)
```
This is already correct. After depth confirmation, `activeSteps.find(s => s > 1)` returns 2, which is now the new Step 2 (logistics). The user then sees the hotel/car step before proceeding to the questionnaire.

**Change 4 — Context bar hide condition (line ~6616):**
```js
// Current:
if (currentStep === 0 || currentStep === 7) { bar.classList.remove('is-visible'); return; }
// Target:
if (currentStep === 0 || currentStep === 8) { bar.classList.remove('is-visible'); return; }
```

**Rationale:** REQ-008 (navigation continuity), REQ-009 (sub-step auto-advance).

---

### 1.11 `trip_intake.html` — JavaScript: `rebuildStyleSubDots()` Step Reference

**Action:** Modify

**Current state (line ~7237):**
```js
const s2desc = document.querySelector('[data-step="2"] .step__desc');
```

**Target state:**
```js
const s2desc = document.querySelector('[data-step="3"] .step__desc');
```

**Rationale:** The questionnaire step moves from `data-step="2"` to `data-step="3"`.

---

### 1.12 `trip_intake.html` — JavaScript: `findNearestActiveStep()` Upper Bound

**Action:** Modify

**Current state (line ~7264):**
```js
for (let i = target; i <= 7; i++) {
```

**Target state:**
```js
for (let i = target; i <= 8; i++) {
```

**Rationale:** Upper bound must match the maximum step number (now 8).

---

### 1.13 `trip_intake.html` — JavaScript: Step 2 Sub-step Dots Update

**Action:** Modify

**Current state (line ~5173-5178):**
```js
// Update Step 2's sub-dots only
document.querySelectorAll('#styleSubDots .sub-dot').forEach((dot, i) => {
```

**Target state:**
Comment update only — the selector `#styleSubDots` is an ID selector, not step-dependent. No functional change needed, but the comment should say "Step 3" instead of "Step 2".

---

### 1.14 `trip_intake.html` — CSS Comment Update (line ~1119)

**Action:** Modify

**Current state:**
```css
/* === Depth Extra Questions (Step 6 inline q-cards) === */
```

**Target state:**
```css
/* === Depth Extra Questions (Step 2 & Step 7 inline q-cards) === */
```

**Rationale:** Comment accuracy — depth extra questions now appear in both Step 2 (hotel/car) and Step 7 (wheelchair/accessibility).

---

### 1.15 `locales/ui_*.json` — New i18n Keys (12 files)

**Action:** Modify

Add 3 new keys to all 12 locale files:

| Key | English | Russian | Hebrew |
|---|---|---|---|
| `step_stay` | "Stay" | "Проживание" | "לינה" |
| `s2_title` | "Plan Your Stay & Travel" | "Планирование проживания и транспорта" | "תכנון לינה ותחבורה" |
| `s2_desc` | "Need help finding accommodation or a rental car? Toggle the options below — skip if you've got it covered." | "Нужна помощь с жильём или арендой авто? Включите нужные опции ниже — пропустите, если уже решено." | "צריכים עזרה במציאת מלון או רכב שכור? הפעילו את האפשרויות למטה — דלגו אם כבר מסודר." |

**Renumber existing step keys in all 12 locale files:**

| Old key | New key | Action |
|---|---|---|
| `s2_title` | `s3_title` | Rename (old value: "What's Your Travel Style?") |
| `s2_desc` | `s3_desc` | Rename (old value: "Quick questions to understand your perfect trip.") |
| `s3_title` | `s4_title` | Rename |
| `s3_desc` | `s4_desc` | Rename |
| `s4_title` | `s5_title` | Rename |
| `s4_desc` | `s5_desc` | Rename |
| `s5_title` | `s6_title` | Rename |
| `s5_desc` | `s6_desc` | Rename |
| `s6_title` | `s7_title` | Rename |
| `s6_desc` | `s7_desc` | Rename |
| `s6_next` | `s7_next` | Rename |
| `s7_title` | `s8_title` | Rename |
| `s7_desc` | `s8_desc` | Rename |
| `s7_edit` | `s8_edit` | Rename |
| `s7_copy` | `s8_copy` | Rename |
| `s7_copy_clip` | `s8_copy_clip` | Rename |
| `s7_download` | `s8_download` | Rename |
| `s7_post_title` | `s8_post_title` | Rename |
| `s7_post_instruction` | `s8_post_instruction` | Rename |
| `s7_post_copy` | `s8_post_copy` | Rename |
| `s7_post_hint` | `s8_post_hint` | Rename |
| `s7_pipeline_*` | `s8_pipeline_*` | Rename (all pipeline keys) |
| `s7_bridge_*` | `s8_bridge_*` | Rename (all bridge keys) |
| `s7_stop_*` | `s8_stop_*` | Rename |

**Important:** The `s6_hotel_*` and `s6_car_*` keys (~100 keys) are NOT renamed. They are feature-scoped, not step-scoped.

The remaining 9 locale files (es, fr, de, it, pt, zh, ja, ko, ar) get English fallback values for the 3 new keys.

**Rationale:** REQ-001 AC-5 (new i18n keys), REQ-004 (step renumbering consistency).

---

### 1.16 `trip_intake_rules.md` — Wizard Flow Section

**Action:** Modify

**Change 1 — Section heading:**
```
## Wizard Flow (8 Steps)
→
## Wizard Flow (9 Steps)
```

**Change 2 — Two-phase design description:**
```
1. **Data & Questions Phase** (Steps 0-2): ...
2. **Card Selection Phase** (Steps 3-5): ...
→
1. **Data & Questions Phase** (Steps 0-3): Collect trip details, traveler info, stay/travel logistics, and all preference questions one-by-one.
2. **Card Selection Phase** (Steps 4-6): Present pre-scored card grids for the user to select/deselect POIs, avoids, and food experiences.
```

**Change 3 — Phase 1 step list:**
```
- **Step 0**: Define country and dates (search bar)
- **Step 1**: Define people in trip (traveler form)
- **Depth selector overlay**: Choose how many questions (10-30)
- **Step 2**: ALL preference questions, asked one-by-one...
→
- **Step 0**: Define country and dates (search bar)
- **Step 1**: Define people in trip (traveler form)
- **Depth selector overlay**: Choose how many questions (10-30)
- **Step 2**: Plan your stay & travel (hotel + car assistance toggles, optional)
- **Step 3**: ALL preference questions, asked one-by-one with auto-advance and sub-step dots...
```

**Change 4 — Phase 2 step list:**
```
- **Step 3**: Interests — multi-select card grid
- **Step 4**: Things to Avoid — multi-select card grid
- **Step 5**: Food & Dining — multi-select card grid + dining vibes
→
- **Step 4**: Interests — multi-select card grid (pre-scored based on Step 3 answers)
- **Step 5**: Things to Avoid — multi-select card grid (pre-scored based on Step 3 answers)
- **Step 6**: Food & Dining — multi-select card grid + dining vibes
```

**Change 5 — Finalize section:**
```
- **Step 6**: Language & extras (simple form: report language + notes)
- **Step 7**: Review & download
→
- **Step 7**: Language & extras (simple form: report language + notes)
- **Step 8**: Review & download
```

**Change 6 — Step 2 section title and content:**
Rename the existing "### Step 2 — All Preferences" section to "### Step 3 — All Preferences". Insert a new "### Step 2 — Plan Your Stay & Travel" section describing the hotel and car assistance toggles and sub-questions.

**Change 7 — Step 6 section (now Step 7):**
Remove hotel/car fields from the Step 6 table. Rename section to "### Step 7 — Language & Extras". The table retains only: Report Language, POI Languages, Additional Notes, Photography, Accessibility, Wheelchair Accessible.

**Change 8 — Supplementary Fields table:**
Change all `Step 6` references for hotel/car fields to `Step 2`.

| Field | Step (old) | Step (new) |
|---|---|---|
| hotelAssistToggle through hotelBudget | Step 6 | Step 2 |
| carAssistToggle through carBudget | Step 6 | Step 2 |
| reportLang, poiLangs, extraNotes, wheelchairAccessible | Step 6 | Step 7 |

**Change 9 — Step Visibility Rules:**
```
- Step 2 (Travel Style) visibility depends on depth...
→
- Step 3 (Travel Style) visibility depends on depth...
```

**Change 10 — Reset rule:**
```
When the user leaves the questionnaire step (Step 2), all saved interest/avoid selections are cleared...
Manual selections are only preserved when navigating between Steps 3↔4↔5...
→
When the user leaves the questionnaire step (Step 3), all saved interest/avoid selections are cleared...
Manual selections are only preserved when navigating between Steps 4↔5↔6...
```

**Change 11 — Output format conditional note:**
```
_The `## Hotel Assistance` and `## Car Rental Assistance` sections are conditional — they appear only when the corresponding toggle is set to Yes in Step 6._
→
_...set to Yes in Step 2._
```

**Change 12 — All remaining step references throughout the file:**
- "Step 3" (interests) → "Step 4"
- "Step 4" (avoids) → "Step 5"
- "Step 5" (food) → "Step 6"
- "Step 7" (review) → "Step 8"
- "Steps 3-5 quiz defaults" → "Steps 4-6 quiz defaults" (in Depth Defaults section)
- "Steps 0, 1, 3, 4, 5, 6, 7" → "Steps 0, 1, 2, 3, 4, 5, 6, 7, 8" (in Step Visibility Rules)
- "Steps 3, 4, and 5" → "Steps 4, 5, and 6" (in design consistency rule)
- "Steps 3↔4↔5" → "Steps 4↔5↔6" (in Reset rule)

**Rationale:** REQ-011 — all step number references in the rules file must be accurate.

---

### 1.17 `trip_intake_design.md` — All Step References

**Action:** Modify

**Key sections to update:**

1. **Step Layouts section:**
   - Rename "### Step 2 — All Preferences" to "### Step 3 — All Preferences"
   - Insert new "### Step 2 — Plan Your Stay & Travel" section (references existing `.assistance-section` pattern)
   - "After the last visible question, auto-advances to Step 3" → "...Step 4"
   - Rename "### Step 6 — Language & Extras" section reference as appropriate

2. **Assistance Section spec:**
   - "Used for Hotel Assistance and Car Rental Assistance in Step 6" → "...in Step 2"
   - "Two instances: `#hotelAssistanceSection` (7 sub-questions) and `#carAssistanceSection` (6 sub-questions)" → same text, just note they are in Step 2

3. **Wheelchair Accessibility spec:**
   - "Wheelchair Accessibility Question (Step 6)" → "(Step 7)"
   - `s6_wheelchair*` keys remain unchanged (feature-scoped)

4. **Depth Selector Overlay spec:**
   - "On confirm: focus to Step 2 title" → "On confirm: focus to Step 2 title" (now the logistics step — this is actually correct as-is since Step 2 is the first step after depth)

5. **Progress Stepper spec:**
   - Dynamic step count description — references 8 steps becoming 9

6. **Preview Box spec:**
   - "Tab label: Dynamic filename" — already correct, no step reference

7. **All "Step N" references throughout:** Apply the same renumbering as rule file (see 1.16 Change 12).

**Rationale:** REQ-011 AC-7 — all step references in the design spec must be updated.

---

### 1.18 `automation/code/tests/pages/IntakePage.ts` — POM Updates

**Action:** Modify

**Change 1 — Step 6 comments → Step 7:**
```ts
// --- Step 6 (extras) ---
→
// --- Step 7 (extras) ---
```

**Change 2 — Step 6: Hotel/Car comments → Step 2:**
```ts
// --- Step 6: Hotel Assistance ---
→
// --- Step 2: Hotel Assistance ---

// --- Step 6: Car Rental Assistance ---
→
// --- Step 2: Car Rental Assistance ---
```

**Change 3 — Review step locator (line ~194):**
```ts
this.reviewStep = page.locator('section.step[data-step="7"]');
→
this.reviewStep = page.locator('section.step[data-step="8"]');
```

**Change 4 — `navigateToStep()` — Step 2 sub-step skip check (line ~427):**
```ts
if (current === 2) {
  await this.skipStep2SubSteps();
→
if (current === 3) {
  await this.skipStep3SubSteps();
```

**Change 5 — `skipStep2SubSteps()` → rename to `skipStep3SubSteps()` (line ~451):**
```ts
async skipStep2SubSteps() {
  ...
  if (currentStepNum !== 2) break;
→
async skipStep3SubSteps() {
  ...
  if (currentStepNum !== 3) break;
```

**Change 6 — `getReviewContent()` (line ~397):**
```ts
const reviewStep = this.stepSection(7);
→
const reviewStep = this.stepSection(8);
```

**Rationale:** REQ-012 — automation POM must use correct step numbers.

---

### 1.19 Automation Test Specs — Step Reference Updates

**Action:** Modify

All test specs that navigate to or assert on specific step numbers must be updated. The key changes:

**`intake-hotel-car-assistance.spec.ts`:**
- All `navigateToStep(6)` calls → `navigateToStep(7)` (for Step 7 assertions about hotel/car being absent), or `navigateToStep(2)` (for Step 2 assertions about hotel/car being present)
- Step 6 assertions about hotel sections → Step 2 assertions
- The spec description "on Step 6" → "on Step 2"

**`intake-hotel-car-i18n.spec.ts`:**
- Navigation to the step containing hotel/car sections: `navigateToStep(6)` → `navigateToStep(2)` where applicable

**`intake-depth-stepper.spec.ts`:**
- Stepper count assertions: 8 visible stepper steps → 9
- Step number range assertions updated

**`intake-structure.spec.ts`:**
- Step count assertions: 8 step sections → 9

**`intake-functional.spec.ts`:**
- Context bar tests: step 7 hide condition → step 8
- Step navigation sequence updated

**`intake-wheelchair.spec.ts`:**
- Wheelchair question is in Step 7 (formerly Step 6): `navigateToStep(6)` → `navigateToStep(7)`

**`intake-depth-questions.spec.ts`:**
- Step references for questionnaire (Step 2 → Step 3)

**`intake-design-spec.spec.ts`:**
- Step references in design compliance checks

**`intake-depth-output.spec.ts`:**
- "Step 7 (Review)" → "Step 8 (Review)"

**`intake-visual-consistency.spec.ts`:**
- Card steps `[3, 4, 5]` → `[4, 5, 6]`

**`intake-depth-change.spec.ts`:**
- "Navigate forward to Step 4" → step numbers may need adjustment

**All other specs:** Audit for any hardcoded step numbers and update accordingly.

**Rationale:** REQ-012 — all automation tests must pass with the new 9-step structure.

---

## 2. Markdown Format Specification

No changes to the markdown format. The `## Hotel Assistance` and `## Car Rental Assistance` sections continue to appear in the same position in the generated markdown (after `## Additional Preferences`), controlled by the toggle state. The `generateMarkdown()` function uses element IDs and `data-question-key` attribute selectors, none of which change.

---

## 3. HTML Rendering Specification

No HTML rendering changes. The Step 2 panel uses the same `<section class="step" data-step="2">` structure as all other steps. The step title and description use the standard `.step__title` + `.step__desc` pattern. The hotel and car assistance sections retain their existing HTML structure, IDs, classes, and ARIA attributes unchanged.

**New Step 2 panel structure:**
```html
<section class="step" data-step="2">
  <h2 class="step__title" data-i18n="s2_title">Plan Your Stay & Travel</h2>
  <p class="step__desc" data-i18n="s2_desc">Need help finding accommodation or a rental car? Toggle the options below — skip if you've got it covered.</p>

  <!-- #hotelAssistanceSection (moved from old Step 6) -->
  <div class="assistance-section" id="hotelAssistanceSection">
    <!-- ... unchanged internal structure ... -->
  </div>

  <!-- #carAssistanceSection (moved from old Step 6) -->
  <div class="assistance-section" id="carAssistanceSection">
    <!-- ... unchanged internal structure ... -->
  </div>

  <div class="btn-bar">
    <button type="button" class="btn btn--secondary btn-prev" data-i18n="btn_back">&larr; Back</button>
    <button type="button" class="btn btn--primary btn-next" data-i18n="btn_continue">Continue &rarr;</button>
  </div>
</section>
```

---

## 4. Rule File Updates

| Rule File | Section | Change |
|---|---|---|
| `trip_intake_rules.md` | Wizard Flow heading | "8 Steps" → "9 Steps" |
| `trip_intake_rules.md` | Two-phase design | Phase 1: Steps 0-3, Phase 2: Steps 4-6 |
| `trip_intake_rules.md` | Phase 1 step list | Insert Step 2, renumber Step 2→3 |
| `trip_intake_rules.md` | Phase 2 step list | Steps 3→4, 4→5, 5→6 |
| `trip_intake_rules.md` | Finalize step list | Steps 6→7, 7→8 |
| `trip_intake_rules.md` | Step 2 section | New section for "Plan Your Stay & Travel" |
| `trip_intake_rules.md` | Step 6 section (→7) | Remove hotel/car fields, rename to Step 7 |
| `trip_intake_rules.md` | Step 7 section (→8) | Rename to Step 8 |
| `trip_intake_rules.md` | Supplementary Fields table | Hotel/car fields: Step 6 → Step 2; other fields: Step 6 → Step 7 |
| `trip_intake_rules.md` | Step Visibility Rules | Step 2 → Step 3 for questionnaire auto-skip |
| `trip_intake_rules.md` | Reset rule | Step 2 → Step 3; Steps 3↔4↔5 → Steps 4↔5↔6 |
| `trip_intake_rules.md` | Output format conditional note | Step 6 → Step 2 |
| `trip_intake_rules.md` | Design consistency rule | Steps 3, 4, 5 → Steps 4, 5, 6 |
| `trip_intake_rules.md` | Depth defaults | Steps 4-5 → Steps 5-6 |
| `trip_intake_rules.md` | Step Visibility Rules full list | Add Step 2 to always-visible list |
| `trip_intake_design.md` | Step Layouts | Insert Step 2 layout, renumber all |
| `trip_intake_design.md` | Assistance Section spec | Step 6 → Step 2 |
| `trip_intake_design.md` | Wheelchair spec | Step 6 → Step 7 |
| `trip_intake_design.md` | Depth Selector | Focus target description updated |
| `trip_intake_design.md` | Progress Stepper | 8 circles → 9 |
| `trip_intake_design.md` | All "Step N" references | Systematic renumbering throughout |

---

## 5. Implementation Checklist

### Phase 1: HTML Restructuring
- [ ] Create new Step 2 panel with title, description, and btn-bar in `trip_intake.html`
- [ ] Cut `#hotelAssistanceSection` and `#carAssistanceSection` from Step 6 panel
- [ ] Paste hotel and car sections into new Step 2 panel (between description and btn-bar)
- [ ] Renumber all `<section class="step" data-step="N">` attributes (2→3, 3→4, 4→5, 5→6, 6→7, 7→8)
- [ ] Update all step HTML comments to match new numbering
- [ ] Add 9th stepper entry for Step 2 (hotel emoji, `step_stay` label)
- [ ] Renumber all stepper `data-step` attributes (2→3, 3→4, ..., 7→8)
- [ ] Verify Step 7 (former 6) no longer contains hotel/car sections

### Phase 2: JavaScript Updates
- [ ] Change `totalSteps` from 8 to 9
- [ ] Update both `activeSteps` initializations to include 9 entries [0-8]
- [ ] Update `goToStep()` — all 7 step-number references shifted +1
- [ ] Update `stepEmojis` array — insert hotel emoji at index 2
- [ ] Update auto-advance target after last questionnaire question (3 → 4)
- [ ] Update Back button questionnaire check (2 → 3)
- [ ] Update context bar hide condition (7 → 8)
- [ ] Update `rebuildStyleSubDots()` selector (data-step 2 → 3)
- [ ] Update `findNearestActiveStep()` upper bound (7 → 8)
- [ ] Update sub-dot comment (Step 2 → Step 3)
- [ ] Verify `generateMarkdown()` still works (uses IDs, not step numbers — no change expected)
- [ ] Verify `initAssistanceSections()` still works (uses element IDs — no change expected)

### Phase 3: i18n Updates
- [ ] Add `step_stay`, `s2_title`, `s2_desc` to all 12 locale files (en, ru, he translated; 9 others English fallback)
- [ ] Renumber step title/description keys (s2→s3, s3→s4, ..., s7→s8) in all 12 locale files
- [ ] Renumber step button keys (s6_next→s7_next, s7_edit→s8_edit, etc.) in all 12 locale files
- [ ] Renumber post-download and pipeline keys (s7_post_*→s8_post_*, s7_pipeline_*→s8_pipeline_*, etc.)
- [ ] Update `data-i18n` attributes in HTML to match new key names
- [ ] Verify hotel/car keys (`s6_hotel_*`, `s6_car_*`) remain unchanged

### Phase 4: Rule File Updates
- [ ] Update `trip_intake_rules.md` — all changes listed in section 1.16
- [ ] Update `trip_intake_design.md` — all changes listed in section 1.17
- [ ] Verify cross-references between rule files are consistent

### Phase 5: Automation Updates
- [ ] Update `IntakePage.ts` POM — all changes listed in section 1.18
- [ ] Update all test spec files — step number references per section 1.19
- [ ] Run full test suite and verify all tests pass

### Phase 6: Verification
- [ ] Manual walkthrough: forward navigation 0→1→depth→2→3→4→5→6→7→8
- [ ] Manual walkthrough: backward navigation 8→7→6→5→4→3→2→1→0
- [ ] Verify hotel/car toggles and sub-questions work in Step 2
- [ ] Verify hotel/car sections absent from Step 7
- [ ] Verify markdown output unchanged (with and without hotel/car toggles)
- [ ] Verify stepper shows 9 circles with correct emojis and labels
- [ ] Verify progress bar reaches 100% on Step 8

---

## 6. BRD Traceability

| Requirement | Acceptance Criterion | Implemented in |
|---|---|---|
| REQ-001 | AC-1: Step 2 exists in DOM | §1.2 (new Step 2 panel) |
| REQ-001 | AC-2: Stepper icon for Step 2 | §1.1 (stepper entry with 🏨) |
| REQ-001 | AC-3: Step title has `data-i18n` | §1.2 (`data-i18n="s2_title"`) |
| REQ-001 | AC-4: Step desc has `data-i18n` | §1.2 (`data-i18n="s2_desc"`) |
| REQ-001 | AC-5: 12 locale files have new keys | §1.15 (3 new keys in all 12 files) |
| REQ-001 | AC-6: Step 2 always visible in stepper | §1.6 (`activeSteps` always includes 2) |
| REQ-002 | AC-1: Hotel section is child of Step 2 | §1.3 (DOM relocation) |
| REQ-002 | AC-2: Hotel toggle renders in Step 2 | §1.3 (moved unchanged) |
| REQ-002 | AC-3: Hotel expand works in Step 2 | Verified — `initAssistanceSections()` uses IDs |
| REQ-002 | AC-4: All 7 hotel sub-questions present | §1.3 (all children moved together) |
| REQ-002 | AC-5: Collapse resets selections | Verified — reset logic uses element IDs |
| REQ-002 | AC-6: Hotel i18n keys render correctly | §1.15 (keys unchanged, already in locale files) |
| REQ-003 | AC-1: Car section is child of Step 2 | §1.3 (DOM relocation) |
| REQ-003 | AC-2: Car toggle renders in Step 2 | §1.3 (moved unchanged) |
| REQ-003 | AC-3: Car expand works in Step 2 | Verified — `initAssistanceSections()` uses IDs |
| REQ-003 | AC-4: All 6 car sub-questions present | §1.3 (all children moved together) |
| REQ-003 | AC-5: Collapse resets selections | Verified — reset logic uses element IDs |
| REQ-003 | AC-6: Car i18n keys render correctly | §1.15 (keys unchanged) |
| REQ-004 | AC-1: 9 step elements (0-8) | §1.4 (renumbering table) |
| REQ-004 | AC-2: Step 3 = questionnaire | §1.4 (old step 2 → step 3) |
| REQ-004 | AC-3: Step 4 = interests | §1.4 (old step 3 → step 4) |
| REQ-004 | AC-4: Step 5 = avoids | §1.4 (old step 4 → step 5) |
| REQ-004 | AC-5: Step 6 = food | §1.4 (old step 5 → step 6) |
| REQ-004 | AC-6: Step 7 = language (no hotel/car) | §1.3, §1.4 (hotel/car removed, renumbered) |
| REQ-004 | AC-7: Step 8 = review | §1.4 (old step 7 → step 8) |
| REQ-004 | AC-8: All `data-step` correct | §1.1, §1.4 (stepper + panels) |
| REQ-005 | AC-1: 9 stepper circles | §1.1 |
| REQ-005 | AC-2: stepEmojis[2] = hotel emoji | §1.8 |
| REQ-005 | AC-3: Fill 100% on Step 8 | §1.6 (totalSteps=9, formula: 8/(9-1)=100%) |
| REQ-005 | AC-4: Progress bar 100% on Step 8 | §1.6 (same formula in depth navigation patch) |
| REQ-005 | AC-5: Stepper circle states | §1.1 (existing pattern, no change to logic) |
| REQ-005 | AC-6: Stepper labels correct | §1.1 (all labels defined) |
| REQ-006 | AC-1: Step 7 has no hotelAssistanceSection | §1.3 (cut from old Step 6) |
| REQ-006 | AC-2: Step 7 has no carAssistanceSection | §1.3 (cut from old Step 6) |
| REQ-006 | AC-3-7: Step 7 retains language/notes/photo/access/wheelchair | §1.3 (unchanged fields remain) |
| REQ-007 | AC-1-5: Markdown output unchanged | §2 (generateMarkdown uses IDs, not step positions) |
| REQ-008 | AC-1: Depth overlay fires leaving Step 1 | §1.10 (intercept unchanged at currentStep===1) |
| REQ-008 | AC-2: After depth, advances to Step 2 | §1.10 (firstActive finds step 2) |
| REQ-008 | AC-3: Continue on Step 2 → Step 3 | §1.10 (normal handler: goToStep(currentStep+1)) |
| REQ-008 | AC-4: Back on Step 3 → Step 2 | §1.10 (normal handler: goToStep(currentStep-1)) |
| REQ-008 | AC-5: Back on Step 2 → Step 1 | §1.10 (normal handler: goToStep(currentStep-1)) |
| REQ-008 | AC-6-7: Full forward/backward sequence | §1.6, §1.7, §1.10 (all navigation updated) |
| REQ-008 | AC-8-9: Validation gates on Steps 0,1 | Unchanged — validation logic checks currentStep===0/1 |
| REQ-009 | AC-1: Sub-dots in Step 3 | §1.11 (selector targets new step 3) |
| REQ-009 | AC-2: Auto-advance between questions | Unchanged — uses question slide selectors |
| REQ-009 | AC-3: Last question → Step 4 | §1.9 (goToStep(4)) |
| REQ-009 | AC-4: Dot count = visible questions | §1.11 (rebuildStyleSubDots targets step 3) |
| REQ-009 | AC-5: Back from Step 4 → Step 3 | §1.7 (normal handler, step 3 sub-question check) |
| REQ-010 | AC-1: Leaving Step 3 clears selections | §1.7 Change 1 (currentStep===3 triggers reset) |
| REQ-010 | AC-2: Steps 4-5-6 preserve manual selections | §1.7 Changes 2-3 (save at steps 4,5) |
| REQ-010 | AC-3: Step 2→3 no reset | §1.7 (Step 2 has no reset trigger) |
| REQ-011 | AC-1-9: Rule files updated | §1.16, §1.17 (all changes detailed) |
| REQ-012 | AC-1-5: Automation tests updated | §1.18, §1.19 (POM + all specs) |
