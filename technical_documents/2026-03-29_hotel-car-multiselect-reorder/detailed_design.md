# Detailed Design

**Change:** Hotel/Car Multi-Select and Step Reorder
**Date:** 2026-03-29
**Author:** Development Team
**HLD Reference:** `technical_documents/2026-03-29_hotel-car-multiselect-reorder/high_level_design.md`
**UX Reference:** `technical_documents/2026-03-29_hotel-car-multiselect-reorder/ux_design.md`
**Status:** Draft

---

## 1. File Changes

### 1.1 `trip_intake.html` — CSS: Option Grid Multi-Select Styles

**Action:** Modify

**Location:** After the existing `.option-grid .q-card__desc` rule (line ~1176), before the `@media (max-width: 768px)` rule.

**Current state:**
```css
.option-grid .q-card__desc { display: none; }
@media (max-width: 768px) {
```

**Target state:**
```css
.option-grid .q-card__desc { display: none; }

/* Multi-select hint text */
.option-grid__hint {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-normal);
  color: var(--color-text-muted);
  margin-top: calc(-1 * var(--space-1));
  margin-bottom: var(--space-2);
}

/* Multi-select checkmark badge (CSS-only via pseudo-element) */
.option-grid[data-multi-select] .q-card {
  position: relative;
}
.option-grid[data-multi-select] .q-card::after {
  content: "\2713";
  position: absolute;
  inset-block-start: 6px;
  inset-inline-end: 6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-brand-primary);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  transform: scale(0);
  transition: transform 0.15s ease-out;
  pointer-events: none;
}
.option-grid[data-multi-select] .q-card.is-selected::after {
  transform: scale(1);
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@media (max-width: 768px) {
```

**Rationale:** The `.option-grid__hint` class provides the "Select one or more" instructional text per UX spec S5.1. The `::after` pseudo-element on `.option-grid[data-multi-select] .q-card` implements the checkmark badge per UX spec S5.2 without adding DOM elements. Uses CSS logical properties (`inset-block-start`, `inset-inline-end`) for automatic RTL support per UX spec S9. The spring easing on select and ease-out on deselect match the UX interaction timing (0.25s / 0.15s).

---

### 1.2 `trip_intake.html` — HTML: hotelType Option Grid

**Action:** Modify

**Location:** The `hotelType` depth-extra-question container (line ~2333).

**Current state:**
```html
<!-- H1: Accommodation Type (single-select card grid, 12 options) -->
<div class="depth-extra-question" data-question-key="hotelType">
  <label class="field__label" data-i18n="s6_hotel_type">Accommodation Type</label>
  <div class="option-grid">
    <div class="q-card" tabindex="0" role="button" data-value="hotel" data-en-name="Hotel">
```

**Target state:**
```html
<!-- H1: Accommodation Type (multi-select card grid, 12 options) -->
<div class="depth-extra-question" data-question-key="hotelType">
  <label class="field__label" data-i18n="s6_hotel_type">Accommodation Type</label>
  <div class="option-grid__hint" data-i18n="s6_multiselect_hint">Select one or more</div>
  <div class="option-grid" data-multi-select role="group" aria-label="Accommodation Type">
    <div class="q-card" tabindex="0" role="button" aria-pressed="false" data-value="hotel" data-en-name="Hotel">
```

**Scope of card-level changes:** Every `.q-card` inside this `option-grid` (12 cards total) must receive the `aria-pressed="false"` attribute. No other attributes on cards change.

**Rationale:** `data-multi-select` is the behavioral discriminator for the click handler. `role="group"` with `aria-label` satisfies UX spec S8 accessibility. `aria-pressed="false"` on each card enables screen reader toggle announcements. The hint `div` is placed between the label and the grid per UX spec S5.1.

---

### 1.3 `trip_intake.html` — HTML: carCategory Option Grid

**Action:** Modify

**Location:** The `carCategory` depth-extra-question container (line ~2536).

**Current state:**
```html
<!-- C1: Car Category (single-select card grid, 14 options) -->
<div class="depth-extra-question" data-question-key="carCategory">
  <label class="field__label" data-i18n="s6_car_category">Car Category</label>
  <div class="option-grid">
    <div class="q-card" tabindex="0" role="button" data-value="mini" data-en-name="Mini">
```

**Target state:**
```html
<!-- C1: Car Category (multi-select card grid, 14 options) -->
<div class="depth-extra-question" data-question-key="carCategory">
  <label class="field__label" data-i18n="s6_car_category">Car Category</label>
  <div class="option-grid__hint" data-i18n="s6_multiselect_hint">Select one or more</div>
  <div class="option-grid" data-multi-select role="group" aria-label="Car Category">
    <div class="q-card" tabindex="0" role="button" aria-pressed="false" data-value="mini" data-en-name="Mini">
```

**Scope of card-level changes:** Every `.q-card` inside this `option-grid` (14 cards total) must receive the `aria-pressed="false"` attribute.

**Rationale:** Same as 1.2.

---

### 1.4 `trip_intake.html` — JS: Q-Card Click Handler (Multi-Select Branch)

**Action:** Modify

**Location:** The global q-card click handler (line ~4950-4974).

**Current state:**
```javascript
// Question card click — radio behavior per question block + auto-advance
document.addEventListener('click', (e) => {
  const card = e.target.closest('.q-card');
  if (!card) return;
  // Support both .question-slide (Step 3) and .depth-extra-question (Step 7) containers
  const slide = card.closest('.question-slide') || card.closest('.depth-extra-question');
  if (!slide) return;
  slide.querySelectorAll('.q-card').forEach(c => c.classList.remove('is-selected'));
  card.classList.add('is-selected');

  // Auto-advance after 400ms when in Step 3 questionnaire
  if (currentStep === 3) {
    clearTimeout(questionAutoAdvanceTimer);
    questionAutoAdvanceTimer = setTimeout(() => {
      const visible = getVisibleStyleSlides();
      const curIdx = visible.indexOf(slide);
      if (curIdx < visible.length - 1) {
        goToSubQuestion(curIdx + 1);
      } else {
        // Last visible question — advance to step 4
        goToStep(4);
      }
    }, 400);
  }
});
```

**Target state:**
```javascript
// Question card click — radio behavior per question block + auto-advance
// Multi-select toggle behavior for option grids with data-multi-select attribute
document.addEventListener('click', (e) => {
  const card = e.target.closest('.q-card');
  if (!card) return;
  // Support both .question-slide (Step 3) and .depth-extra-question (Step 7) containers
  const slide = card.closest('.question-slide') || card.closest('.depth-extra-question');
  if (!slide) return;

  // Check if this card is inside a multi-select option grid
  const multiSelectGrid = card.closest('.option-grid[data-multi-select]');
  if (multiSelectGrid) {
    // Multi-select toggle: flip this card only, leave siblings untouched
    card.classList.toggle('is-selected');
    card.setAttribute('aria-pressed', card.classList.contains('is-selected'));
    return; // No auto-advance for multi-select grids
  }

  // Standard radio behavior: clear siblings, select clicked card
  slide.querySelectorAll('.q-card').forEach(c => c.classList.remove('is-selected'));
  card.classList.add('is-selected');

  // Auto-advance after 400ms when in Step 3 questionnaire
  if (currentStep === 3) {
    clearTimeout(questionAutoAdvanceTimer);
    questionAutoAdvanceTimer = setTimeout(() => {
      const visible = getVisibleStyleSlides();
      const curIdx = visible.indexOf(slide);
      if (curIdx < visible.length - 1) {
        goToSubQuestion(curIdx + 1);
      } else {
        // Last visible question — advance to step 4
        goToStep(4);
      }
    }, 400);
  }
});
```

**Rationale:** The multi-select check (`card.closest('.option-grid[data-multi-select]')`) runs before the radio clear. If the card is inside a `data-multi-select` grid, it toggles only that card's `.is-selected` class and updates `aria-pressed`, then returns early. All other q-card groups fall through to the existing radio behavior. The `return` statement prevents auto-advance from firing on multi-select grids (which are always in Step 2, not Step 3, so the auto-advance guard would also catch it — but early return is cleaner).

---

### 1.5 `trip_intake.html` — JS: Assistance Toggle Reset Handler (aria-pressed cleanup)

**Action:** Modify

**Location:** The assistance section toggle handler, inside the collapse reset block (line ~5010).

**Current state:**
```javascript
// Reset all selections within the body
body.querySelectorAll('.q-card.is-selected').forEach(c => c.classList.remove('is-selected'));
```

**Target state:**
```javascript
// Reset all selections within the body
body.querySelectorAll('.q-card.is-selected').forEach(c => {
  c.classList.remove('is-selected');
  if (c.hasAttribute('aria-pressed')) c.setAttribute('aria-pressed', 'false');
});
```

**Rationale:** When the assistance toggle collapses, the existing code already clears all `.is-selected` cards — which works for multi-select. However, the new `aria-pressed` attributes on multi-select cards must also be reset to `"false"` to keep ARIA state in sync. The `hasAttribute` check avoids modifying single-select cards that don't have `aria-pressed`.

---

### 1.6 `trip_intake.html` — JS: `generateMarkdown()` Hotel Type Output

**Action:** Modify

**Location:** Inside the patched `generateMarkdown` function, hotel assistance block (line ~7513).

**Current state:**
```javascript
// Accommodation type
const hotelTypeEl = document.querySelector('.depth-extra-question[data-question-key="hotelType"] .q-card.is-selected');
md += `- **Accommodation type:** ${hotelTypeEl ? hotelTypeEl.dataset.enName : 'Not specified'}\n`;
```

**Target state:**
```javascript
// Accommodation type (multi-select)
const hotelTypeEls = Array.from(document.querySelectorAll('.depth-extra-question[data-question-key="hotelType"] .q-card.is-selected'));
const hotelTypeNames = hotelTypeEls.map(c => c.dataset.enName);
md += `- **Accommodation type:** ${hotelTypeNames.length > 0 ? hotelTypeNames.join(', ') : 'Not specified'}\n`;
```

**Rationale:** Switches from `querySelector` (first match) to `querySelectorAll` (all matches). Maps each selected card's `data-en-name` to an array and joins with `", "`. DOM order is preserved by `querySelectorAll`, satisfying REQ-003 AC-5 (left-to-right, top-to-bottom order). Falls back to "Not specified" when the array is empty (REQ-001 AC-6).

---

### 1.7 `trip_intake.html` — JS: `generateMarkdown()` Car Category Output

**Action:** Modify

**Location:** Inside the patched `generateMarkdown` function, car assistance block (line ~7550).

**Current state:**
```javascript
// Car category
const carCatEl = document.querySelector('.depth-extra-question[data-question-key="carCategory"] .q-card.is-selected');
md += `- **Car category:** ${carCatEl ? carCatEl.dataset.enName : 'Not specified'}\n`;
```

**Target state:**
```javascript
// Car category (multi-select)
const carCatEls = Array.from(document.querySelectorAll('.depth-extra-question[data-question-key="carCategory"] .q-card.is-selected'));
const carCatNames = carCatEls.map(c => c.dataset.enName);
md += `- **Car category:** ${carCatNames.length > 0 ? carCatNames.join(', ') : 'Not specified'}\n`;
```

**Rationale:** Same pattern as 1.6. Satisfies REQ-002 and REQ-003.

---

### 1.8 `trip_intake.html` — JS: Depth Overlay Intercept (Step Reorder)

**Action:** Modify

**Location:** The `hookDepthNavigation` IIFE, capture-phase click handler (line ~7314-7323).

**Current state:**
```javascript
document.addEventListener('click', (e) => {
  // Intercept Step 1 Continue to show depth overlay
  if (e.target.closest('.btn-next') && currentStep === 1) {
    if (!validateStep1()) { e.stopImmediatePropagation(); return; }
    if (window._depthState) {
      e.stopImmediatePropagation();
      window._depthState.openDepthOverlay(false);
      return;
    }
  }
}, true); // capture phase to intercept before normal handler
```

**Target state:**
```javascript
document.addEventListener('click', (e) => {
  // Intercept Step 1 Continue — validate then proceed to Step 2 (no overlay)
  if (e.target.closest('.btn-next') && currentStep === 1) {
    if (!validateStep1()) { e.stopImmediatePropagation(); return; }
    // Step 1 validation passed — let normal navigation proceed to Step 2
  }

  // Intercept Step 2 Continue to show depth overlay
  if (e.target.closest('.btn-next') && currentStep === 2) {
    if (window._depthState) {
      e.stopImmediatePropagation();
      window._depthState.openDepthOverlay(false);
      return;
    }
  }
}, true); // capture phase to intercept before normal handler
```

**Rationale:** Step 1 Continue no longer opens the overlay — it validates and falls through to normal step navigation (goToStep(2)). Step 2 Continue now intercepts and opens the depth overlay. Step 2 has no validation gate (per BRD and existing rules), so no `validateStep2()` call is needed. The capture phase ensures the intercept fires before the normal btn-next handler.

**Note on Step 1 validation:** The Step 1 `if` block is retained but simplified. When validation fails, it stops propagation (preventing navigation). When validation passes, the handler does NOT call `e.stopImmediatePropagation()`, so the normal `btn-next` click handler fires and navigates to Step 2.

---

### 1.9 `trip_intake.html` — JS: Depth Overlay Confirm Handler

**Action:** Modify

**Location:** The depth confirm button click handler (line ~7166-7167).

**Current state:**
```javascript
} else {
  // Initial: advance to first active step after Step 1
  const firstActive = activeSteps.find(s => s > 1) || 2;
  goToStep(firstActive);
}
```

**Target state:**
```javascript
} else {
  // Initial: advance to first active step after Step 2
  const firstActive = activeSteps.find(s => s > 2) || 3;
  goToStep(firstActive);
}
```

**Rationale:** After the initial depth selection, the wizard now advances past Step 2 (which the user has already completed) to Step 3 or the next active step. The fallback changes from `2` to `3` to match.

---

### 1.10 `trip_intake.html` — JS: Depth Overlay Escape Handler

**Action:** Modify

**Location:** The keyboard escape handler inside the overlay (line ~7113-7115).

**Current state:**
```javascript
} else {
  // Return to Step 1 Continue button
  const s1Next = document.querySelector('[data-step="1"] .btn-next');
  if (s1Next) s1Next.focus();
}
```

**Target state:**
```javascript
} else {
  // Return to Step 2 Continue button
  const s2Next = document.querySelector('[data-step="2"] .btn-next');
  if (s2Next) s2Next.focus();
}
```

**Rationale:** Since the overlay is now triggered from Step 2, escape should return focus to the Step 2 Continue button per UX spec S5.4.

---

### 1.11 `trip_intake.html` — JS: Depth Overlay Outside-Click Handler

**Action:** Modify

**Location:** The click-outside handler for the overlay (line ~7177-7179).

**Current state:**
```javascript
if (!isReentry) {
  const s1Next = document.querySelector('[data-step="1"] .btn-next');
  if (s1Next) s1Next.focus();
}
```

**Target state:**
```javascript
if (!isReentry) {
  const s2Next = document.querySelector('[data-step="2"] .btn-next');
  if (s2Next) s2Next.focus();
}
```

**Rationale:** Same as 1.10 — clicking outside the overlay dismisses it and returns focus to Step 2 Continue.

---

### 1.12 `locales/ui_*.json` — i18n Key: `s6_multiselect_hint`

**Action:** Modify (12 files)

**Files:** `locales/ui_en.json`, `locales/ui_ru.json`, `locales/ui_he.json`, `locales/ui_es.json`, `locales/ui_fr.json`, `locales/ui_de.json`, `locales/ui_it.json`, `locales/ui_pt.json`, `locales/ui_zh.json`, `locales/ui_ja.json`, `locales/ui_ko.json`, `locales/ui_ar.json`

**Change:** Add the key `"s6_multiselect_hint"` to each locale file.

| Locale | Value |
|---|---|
| `en` | `"Select one or more"` |
| `ru` | `"Выберите один или несколько"` |
| `he` | `"בחרו אחד או יותר"` |
| `es` | `"Seleccione uno o más"` |
| `fr` | `"Sélectionnez un ou plusieurs"` |
| `de` | `"Wählen Sie eine oder mehrere"` |
| `it` | `"Seleziona uno o più"` |
| `pt` | `"Selecione um ou mais"` |
| `zh` | `"选择一个或多个"` |
| `ja` | `"1つ以上選択してください"` |
| `ko` | `"하나 이상 선택하세요"` |
| `ar` | `"اختر واحد أو أكثر"` |

**Rationale:** Per UX spec S5.1, the hint text must be internationalized. Per `trip_intake_rules.md` "How to Modify > Adding new UI text", the key must be added to all 12 locale files.

---

## 2. Markdown Format Specification

No new markdown sections are introduced. The existing `## Hotel Assistance` and `## Car Rental Assistance` sections change the format of two fields:

**Current format (single value):**
```markdown
- **Accommodation type:** Hotel
- **Car category:** Compact
```

**New format (comma-separated list):**
```markdown
- **Accommodation type:** Hotel, Airbnb, Resort
- **Car category:** Compact, SUV
```

**Zero-selection format:**
```markdown
- **Accommodation type:** Not specified
- **Car category:** Not specified
```

**Order:** Values appear in DOM order (left-to-right, top-to-bottom in the grid), which matches the visual card layout.

---

## 3. HTML Rendering Specification

No changes to trip HTML rendering. The multi-select and step reorder changes are confined to the intake wizard. The downstream trip generation pipeline receives the comma-separated values as plain strings in the markdown output.

---

## 4. Rule File Updates

### 4.1 `trip_intake_rules.md`

| Section | Change |
|---|---|
| **Wizard Flow** (line ~37-48) | Update the Phase 1 flow description. Current text: `- **Depth selector overlay**: Choose how many questions (10-30)` appears before Step 2. Move this line to appear AFTER Step 2 in the list. New order: Step 0, Step 1, Step 2, Depth selector overlay, Step 3. |
| **Step 2 — Plan Your Stay & Travel** field table (line ~118-124) | Change `hotelType` description from `card grid 12` to `card grid 12, multi-select`. Change `carCategory` description from `card grid 14` to `card grid 14, multi-select`. |
| **Supplementary Fields table** (line ~261-270) | Change `hotelType` entry type from `Card grid (12 options)` to `Multi-select card grid (12 options)`. Change `carCategory` entry type from `Card grid (14 options)` to `Multi-select card grid (14 options)`. |
| **Output Format — Hotel Assistance** (line ~477-486) | Change `- **Accommodation type:** {value}` description to note comma-separated values when multiple selected, "Not specified" when none. |
| **Output Format — Car Rental Assistance** (line ~489-495) | Change `- **Car category:** {value}` description to note comma-separated values when multiple selected, "Not specified" when none. |

### 4.2 `trip_intake_design.md`

| Section | Change |
|---|---|
| **Step 2 — Plan Your Stay & Travel** (line ~183-184) | Add note about multi-select behavior for hotelType and carCategory option grids. |
| **Depth Selector Overlay** (line ~284-315) | Change description from "shown after Step 1" to "shown after Step 2". Update keyboard navigation section: Escape returns to Step 2 Continue button (was: Step 1). Update focus management: on confirm advances past Step 2, on escape focuses Step 2 Continue. |
| **Option Grid** (line ~376-384) | Change "Radio behavior: same as standard q-card (one selected per container)" to describe multi-select toggle behavior for grids with `data-multi-select` attribute. Add `.option-grid__hint` and `.option-grid__check` pseudo-element to the component spec. Keep note that option grids WITHOUT `data-multi-select` retain radio behavior. |
| **Depth Extra Questions** (line ~347-352) | No change needed — the `.depth-extra-question` container is not affected; multi-select is on the nested `.option-grid`. |
| **Assistance Section** (line ~364-374) | Add note that collapse reset also resets `aria-pressed` on multi-select cards. |

---

## 5. Implementation Checklist

- [ ] Add `.option-grid__hint` CSS class (font, color, margins)
- [ ] Add `.option-grid[data-multi-select] .q-card` CSS (`position: relative`)
- [ ] Add `.option-grid[data-multi-select] .q-card::after` CSS (checkmark badge with scale animation)
- [ ] Add `.option-grid[data-multi-select] .q-card.is-selected::after` CSS (spring scale-in)
- [ ] Add `data-multi-select`, `role="group"`, `aria-label` to hotelType `.option-grid`
- [ ] Add `.option-grid__hint` div before hotelType `.option-grid`
- [ ] Add `aria-pressed="false"` to all 12 hotelType `.q-card` elements
- [ ] Add `data-multi-select`, `role="group"`, `aria-label` to carCategory `.option-grid`
- [ ] Add `.option-grid__hint` div before carCategory `.option-grid`
- [ ] Add `aria-pressed="false"` to all 14 carCategory `.q-card` elements
- [ ] Modify q-card click handler: add multi-select branch (check `data-multi-select`, toggle, update `aria-pressed`, early return)
- [ ] Modify assistance toggle reset: add `aria-pressed` reset for multi-select cards
- [ ] Modify `generateMarkdown()` hotelType: `querySelectorAll` + `map` + `join`
- [ ] Modify `generateMarkdown()` carCategory: `querySelectorAll` + `map` + `join`
- [ ] Modify depth intercept: change `currentStep === 1` to `currentStep === 2`, remove overlay trigger from Step 1 block
- [ ] Modify depth confirm handler: change `s > 1` to `s > 2`, fallback `2` to `3`
- [ ] Modify depth escape handler: focus `[data-step="2"] .btn-next`
- [ ] Modify depth outside-click handler: focus `[data-step="2"] .btn-next`
- [ ] Add `s6_multiselect_hint` key to all 12 `locales/ui_*.json` files
- [ ] Update `trip_intake_rules.md` — Wizard Flow, Step 2 field table, Supplementary Fields, Output Format
- [ ] Update `trip_intake_design.md` — Option Grid, Depth Selector Overlay, Assistance Section

---

## 6. BRD Traceability

| Requirement | Acceptance Criterion | Implemented in |
|---|---|---|
| REQ-001 | AC-1: Select 2+ accommodation types | §1.4 (click handler multi-select branch) |
| REQ-001 | AC-2: Toggle off selected type | §1.4 (`classList.toggle`) |
| REQ-001 | AC-3: Select without clearing siblings | §1.4 (no sibling clear in multi-select branch) |
| REQ-001 | AC-4: Independent visual state | §1.1 (CSS badge + existing `.is-selected` styles) |
| REQ-001 | AC-5: All 12 can be selected | §1.4 (no max limit enforced) |
| REQ-001 | AC-6: "Not specified" when none selected | §1.6 (`hotelTypeNames.length > 0` check) |
| REQ-002 | AC-1: Select 2+ car categories | §1.4 (same handler, §1.3 HTML) |
| REQ-002 | AC-2: Toggle off selected category | §1.4 |
| REQ-002 | AC-3: Select without clearing siblings | §1.4 |
| REQ-002 | AC-4: Independent visual state | §1.1 |
| REQ-002 | AC-5: All 14 can be selected | §1.4 |
| REQ-002 | AC-6: "Not specified" when none selected | §1.7 |
| REQ-003 | AC-1: Single selection output | §1.6, §1.7 (join with ", " produces single value when array length 1) |
| REQ-003 | AC-2: Multi selection comma-separated | §1.6, §1.7 |
| REQ-003 | AC-3: Zero selection "Not specified" | §1.6, §1.7 |
| REQ-003 | AC-4: Same format for car category | §1.7 |
| REQ-003 | AC-5: DOM order preserved | §1.6, §1.7 (`querySelectorAll` returns DOM order) |
| REQ-003 | AC-6: English `data-en-name` values | §1.6, §1.7 (reads `dataset.enName`) |
| REQ-004 | AC-1: Step 1 Continue -> Step 2, no overlay | §1.8 (Step 1 block falls through to normal nav) |
| REQ-004 | AC-2: Step 2 Continue -> depth overlay | §1.8 (new `currentStep === 2` intercept) |
| REQ-004 | AC-3: Depth confirm -> Step 3 | §1.9 (`activeSteps.find(s => s > 2)`) |
| REQ-004 | AC-4: Stepper shows correct sequence | No change needed — step numbers unchanged, only trigger point moved |
| REQ-004 | AC-5: Back from Step 3 -> Step 2 | No change needed — standard `goToStep(prev)` already goes to Step 2 |
| REQ-004 | AC-6: Back from Step 2 -> Step 1 | No change needed — standard back navigation |
| REQ-004 | AC-7: Depth pill re-entry works | No change to re-entry code — `openDepthOverlay(true)` with `stepBeforeOverlay` tracks current step |
| REQ-004 | AC-8: stepBeforeOverlay tracks Step 2 | §1.8, §1.9 — overlay opens from Step 2, `stepBeforeOverlay = currentStep` records 2 |
| REQ-005 | AC-1: Hotel toggle "No" clears all types | §1.5 (existing clear + `aria-pressed` reset) |
| REQ-005 | AC-2: Car toggle "No" clears all categories | §1.5 |
| REQ-005 | AC-3: Re-enable shows clean state | §1.5 (all `.is-selected` removed, `aria-pressed` reset to false) |
