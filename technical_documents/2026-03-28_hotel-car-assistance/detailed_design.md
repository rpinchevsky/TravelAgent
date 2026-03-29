# Detailed Design

**Change:** Hotel Assistance & Car Rental Assistance — Optional Intake Sections
**Date:** 2026-03-28
**Author:** Development Team
**HLD Reference:** `technical_documents/2026-03-28_hotel-car-assistance/high_level_design.md`
**Status:** Draft

---

## 1. File Changes

### 1.1 `trip_intake.html` — CSS Additions

**Action:** Modify (append new CSS rules within the existing `<style>` block)

**Current state:** The `<style>` block ends with depth-extra-question styles (around line 1134), followed by step-divider and other styles. No assistance-section, option-grid, chip-toggle, or range-slider styles exist.

**Target state — New CSS rules to add after `.depth-extra-question .field__label { ... }` block (after line 1134):**

```css
/* === Assistance Sections (Hotel / Car collapsible toggle sections) === */
.assistance-section {
  margin-top: var(--space-5);
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-4);
}
.assistance-section__header {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-brand-accent-alt);
  margin-bottom: var(--space-3);
}
.assistance-section__body {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.4s ease, opacity 0.3s ease;
}
.assistance-section__body.is-expanded {
  max-height: 4000px; /* generous max for smooth expand */
  opacity: 1;
}

/* === Option Grid (3-4 col grid for large card sets like hotelType/carCategory) === */
.option-grid {
  display: grid;
  gap: var(--space-2);
  grid-template-columns: repeat(4, 1fr);
  max-width: 800px;
  margin: 0 auto;
}
.option-grid .q-card {
  min-height: 100px;
  padding: var(--space-2) var(--space-2);
  font-size: var(--text-sm);
}
.option-grid .q-card__icon { font-size: 1.5rem; }
.option-grid .q-card__title { font-size: var(--text-xs); }
.option-grid .q-card__desc { display: none; } /* no description in compact grid cards */
@media (max-width: 768px) {
  .option-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 480px) {
  .option-grid { grid-template-columns: repeat(2, 1fr); }
}

/* === Chip Toggle (multi-select pills for amenities/extras) === */
.chip-toggle-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  max-width: 800px;
  margin: 0 auto;
}
.chip-toggle {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border: 2px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 44px; /* touch target */
  user-select: none;
}
.chip-toggle:hover {
  border-color: var(--color-brand-primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}
.chip-toggle.is-selected {
  background: var(--color-brand-primary);
  border-color: var(--color-brand-primary);
  color: #fff;
}
.chip-toggle:focus-visible {
  outline: 2px solid var(--color-brand-accent);
  outline-offset: 2px;
}

/* === Dual-Handle Range Slider === */
.range-slider {
  max-width: 600px;
  margin: var(--space-3) auto;
  padding: var(--space-2) var(--space-3);
  user-select: none;
}
.range-slider__label {
  text-align: center;
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-3);
}
.range-slider__track {
  position: relative;
  height: 6px;
  background: var(--color-border);
  border-radius: 3px;
  margin: 20px 0;
  touch-action: none;
}
.range-slider__fill {
  position: absolute;
  height: 100%;
  background: var(--color-brand-primary);
  border-radius: 3px;
  pointer-events: none;
}
.range-slider__handle {
  position: absolute;
  top: 50%;
  width: 24px;
  height: 24px;
  background: var(--color-surface);
  border: 3px solid var(--color-brand-primary);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  cursor: grab;
  touch-action: none;
  z-index: 2;
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-fast);
  /* 44px touch target via padding */
  padding: 10px;
  margin: -10px;
  box-sizing: content-box;
}
.range-slider__handle:hover,
.range-slider__handle:active {
  box-shadow: var(--shadow-md);
  cursor: grabbing;
}
.range-slider__handle:focus-visible {
  outline: 2px solid var(--color-brand-accent);
  outline-offset: 4px;
}
[dir="rtl"] .range-slider__handle {
  transform: translate(50%, -50%);
}
```

**Rationale:** These styles introduce the four new visual patterns needed by the BRD: collapsible sections, compact card grids, multi-select chips, and the range slider. All use existing design tokens (colors, spacing, radius, shadows). The `.assistance-section__body` expand/collapse uses max-height + opacity transition (0.3-0.4s ease) per the animation spec in `trip_intake_design.md`. The `.option-grid` provides responsive columns (4 → 3 → 2) for the 12-option hotel type and 14-option car category grids.

---

### 1.2 `trip_intake.html` — Step 6 DOM Additions

**Action:** Modify (insert new sections between the wheelchair toggle `</div>` and the `<div class="btn-bar">`)

**Current state (lines 2995-2997):**
```html
        </div>  <!-- end wheelchairAccessible -->

        <div class="btn-bar">
```

**Target state — Insert the following between the wheelchair `</div>` (line 2995) and the `<div class="btn-bar">` (line 2997):**

```html
        <!-- ===== Hotel Assistance Section ===== -->
        <div class="assistance-section" id="hotelAssistanceSection">
          <div class="assistance-section__header" data-i18n="s6_hotel_header">Hotel Assistance</div>

          <!-- Hotel toggle (Yes/No) -->
          <div class="depth-extra-question" data-question-key="hotelAssistToggle">
            <label class="field__label" data-i18n="s6_hotel_toggle">Would you like help choosing accommodation?</label>
            <div class="question-options">
              <div class="q-card is-selected" tabindex="0" role="button" data-value="no" data-en-name="No">
                <div class="q-card__icon">&#10060;</div>
                <div class="q-card__title" data-i18n="s6_hotel_toggle_no">No, I'll Handle It</div>
                <div class="q-card__desc" data-i18n="s6_hotel_toggle_no_desc">I'll arrange accommodation myself</div>
              </div>
              <div class="q-card" tabindex="0" role="button" data-value="yes" data-en-name="Yes">
                <div class="q-card__icon">&#127960;</div>
                <div class="q-card__title" data-i18n="s6_hotel_toggle_yes">Yes, Help Me Choose</div>
                <div class="q-card__desc" data-i18n="s6_hotel_toggle_yes_desc">I'd like accommodation recommendations</div>
              </div>
            </div>
          </div>

          <!-- Hotel sub-questions (collapsed by default) -->
          <div class="assistance-section__body" id="hotelSubQuestions">

            <!-- H1: Accommodation Type (single-select card grid, 12 options) -->
            <div class="depth-extra-question" data-question-key="hotelType">
              <label class="field__label" data-i18n="s6_hotel_type">Accommodation Type</label>
              <div class="option-grid">
                <div class="q-card" tabindex="0" role="button" data-value="hotel" data-en-name="Hotel">
                  <div class="q-card__icon">&#127976;</div>
                  <div class="q-card__title" data-i18n="s6_hotel_type_hotel">Hotel</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="boutique" data-en-name="Boutique Hotel">
                  <div class="q-card__icon">&#127970;</div>
                  <div class="q-card__title" data-i18n="s6_hotel_type_boutique">Boutique Hotel</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="resort" data-en-name="Resort &amp; Spa">
                  <div class="q-card__icon">&#127965;</div>
                  <div class="q-card__title" data-i18n="s6_hotel_type_resort">Resort &amp; Spa</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="apartment" data-en-name="Apartment / Condo">
                  <div class="q-card__icon">&#127960;</div>
                  <div class="q-card__title" data-i18n="s6_hotel_type_apartment">Apartment / Condo</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="aparthotel" data-en-name="Apart-Hotel">
                  <div class="q-card__icon">&#127983;</div>
                  <div class="q-card__title" data-i18n="s6_hotel_type_aparthotel">Apart-Hotel</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="villa" data-en-name="Villa / House">
                  <div class="q-card__icon">&#127969;</div>
                  <div class="q-card__title" data-i18n="s6_hotel_type_villa">Villa / House</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="bnb" data-en-name="B&amp;B / Guesthouse">
                  <div class="q-card__icon">&#9749;</div>
                  <div class="q-card__title" data-i18n="s6_hotel_type_bnb">B&amp;B / Guesthouse</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="hostel" data-en-name="Hostel">
                  <div class="q-card__icon">&#128716;</div>
                  <div class="q-card__title" data-i18n="s6_hotel_type_hostel">Hostel</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="farmhouse" data-en-name="Farmhouse / Agriturismo">
                  <div class="q-card__icon">&#127806;</div>
                  <div class="q-card__title" data-i18n="s6_hotel_type_farmhouse">Farmhouse / Agriturismo</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="cabin" data-en-name="Cabin / Cottage">
                  <div class="q-card__icon">&#127956;</div>
                  <div class="q-card__title" data-i18n="s6_hotel_type_cabin">Cabin / Cottage</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="glamping" data-en-name="Glamping">
                  <div class="q-card__icon">&#9978;</div>
                  <div class="q-card__title" data-i18n="s6_hotel_type_glamping">Glamping</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="houseboat" data-en-name="Houseboat">
                  <div class="q-card__icon">&#128674;</div>
                  <div class="q-card__title" data-i18n="s6_hotel_type_houseboat">Houseboat</div>
                </div>
              </div>
            </div>

            <!-- H2: Location Priority (q-card single-select, 5 options) -->
            <div class="depth-extra-question" data-question-key="hotelLocation">
              <label class="field__label" data-i18n="s6_hotel_location">Location Priority</label>
              <div class="question-options">
                <div class="q-card" tabindex="0" role="button" data-value="center" data-en-name="City center &amp; walkable">
                  <div class="q-card__icon">&#127963;</div>
                  <div class="q-card__title" data-i18n="s6_hotel_loc_center">City Center &amp; Walkable</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="attractions" data-en-name="Near main attractions">
                  <div class="q-card__icon">&#127984;</div>
                  <div class="q-card__title" data-i18n="s6_hotel_loc_attractions">Near Main Attractions</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="quiet" data-en-name="Quiet &amp; residential">
                  <div class="q-card__icon">&#127795;</div>
                  <div class="q-card__title" data-i18n="s6_hotel_loc_quiet">Quiet &amp; Residential</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="beach" data-en-name="Beachfront or waterfront">
                  <div class="q-card__icon">&#127754;</div>
                  <div class="q-card__title" data-i18n="s6_hotel_loc_beach">Beachfront / Waterfront</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="transport" data-en-name="Near transport hub">
                  <div class="q-card__icon">&#128646;</div>
                  <div class="q-card__title" data-i18n="s6_hotel_loc_transport">Near Transport Hub</div>
                </div>
              </div>
            </div>

            <!-- H3: Quality Level (q-card single-select, 4 options) -->
            <div class="depth-extra-question" data-question-key="hotelStars">
              <label class="field__label" data-i18n="s6_hotel_stars">Quality Level</label>
              <div class="question-options">
                <div class="q-card" tabindex="0" role="button" data-value="budget" data-en-name="Budget (1-2 stars)">
                  <div class="q-card__icon">&#11088;</div>
                  <div class="q-card__title" data-i18n="s6_hotel_stars_budget">Budget (1-2 stars)</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="midrange" data-en-name="Mid-range (3 stars)">
                  <div class="q-card__icon">&#11088;&#11088;</div>
                  <div class="q-card__title" data-i18n="s6_hotel_stars_mid">Mid-range (3 stars)</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="upscale" data-en-name="Upscale (4 stars)">
                  <div class="q-card__icon">&#11088;&#11088;&#11088;</div>
                  <div class="q-card__title" data-i18n="s6_hotel_stars_upscale">Upscale (4 stars)</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="luxury" data-en-name="Luxury (5 stars)">
                  <div class="q-card__icon">&#11088;&#11088;&#11088;&#11088;</div>
                  <div class="q-card__title" data-i18n="s6_hotel_stars_luxury">Luxury (5 stars)</div>
                </div>
              </div>
            </div>

            <!-- H4: Must-Have Amenities (multi-select chips, 12 options) -->
            <div class="depth-extra-question" data-question-key="hotelAmenities">
              <label class="field__label" data-i18n="s6_hotel_amenities">Must-Have Amenities</label>
              <div class="chip-toggle-group" id="hotelAmenitiesChips">
                <button type="button" class="chip-toggle" data-en-name="Pool" data-i18n="s6_hotel_amen_pool">&#127946; Pool</button>
                <button type="button" class="chip-toggle" data-en-name="Free Parking" data-i18n="s6_hotel_amen_parking">&#127359; Free Parking</button>
                <button type="button" class="chip-toggle" data-en-name="Kitchen" data-i18n="s6_hotel_amen_kitchen">&#127859; Kitchen</button>
                <button type="button" class="chip-toggle" data-en-name="Free WiFi" data-i18n="s6_hotel_amen_wifi">&#128246; Free WiFi</button>
                <button type="button" class="chip-toggle" data-en-name="Gym" data-i18n="s6_hotel_amen_gym">&#127947; Gym</button>
                <button type="button" class="chip-toggle" data-en-name="Spa &amp; Wellness" data-i18n="s6_hotel_amen_spa">&#128134; Spa &amp; Wellness</button>
                <button type="button" class="chip-toggle" data-en-name="Air Conditioning" data-i18n="s6_hotel_amen_ac">&#10052; Air Conditioning</button>
                <button type="button" class="chip-toggle" data-en-name="Laundry" data-i18n="s6_hotel_amen_laundry">&#128090; Laundry</button>
                <button type="button" class="chip-toggle" data-en-name="Kids Play Area" data-i18n="s6_hotel_amen_kids">&#127880; Kids Play Area</button>
                <button type="button" class="chip-toggle" data-en-name="Restaurant On-site" data-i18n="s6_hotel_amen_restaurant">&#127860; Restaurant On-site</button>
                <button type="button" class="chip-toggle" data-en-name="Non-smoking Rooms" data-i18n="s6_hotel_amen_nonsmoking">&#128683; Non-smoking Rooms</button>
                <button type="button" class="chip-toggle" data-en-name="Airport Shuttle" data-i18n="s6_hotel_amen_shuttle">&#128652; Airport Shuttle</button>
              </div>
            </div>

            <!-- H5: Traveling with Pets (toggle Yes/No, default No) -->
            <div class="depth-extra-question" data-question-key="hotelPets">
              <label class="field__label" data-i18n="s6_hotel_pets">Traveling with Pets?</label>
              <div class="question-options">
                <div class="q-card is-selected" tabindex="0" role="button" data-value="no" data-en-name="No">
                  <div class="q-card__icon">&#10060;</div>
                  <div class="q-card__title" data-i18n="s6_hotel_pets_no">No</div>
                  <div class="q-card__desc" data-i18n="s6_hotel_pets_no_desc">Not bringing pets</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="yes" data-en-name="Yes">
                  <div class="q-card__icon">&#128054;</div>
                  <div class="q-card__title" data-i18n="s6_hotel_pets_yes">Yes</div>
                  <div class="q-card__desc" data-i18n="s6_hotel_pets_yes_desc">Need pet-friendly accommodation</div>
                </div>
              </div>
            </div>

            <!-- H6: Cancellation Preference (q-card single-select, 3 options) -->
            <div class="depth-extra-question" data-question-key="hotelCancellation">
              <label class="field__label" data-i18n="s6_hotel_cancellation">Cancellation Flexibility</label>
              <div class="question-options">
                <div class="q-card" tabindex="0" role="button" data-value="free" data-en-name="Free cancellation (even if pricier)">
                  <div class="q-card__icon">&#128275;</div>
                  <div class="q-card__title" data-i18n="s6_hotel_cancel_free">Free Cancellation</div>
                  <div class="q-card__desc" data-i18n="s6_hotel_cancel_free_desc">Even if it costs more</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="nonrefundable" data-en-name="Non-refundable is fine (cheaper)">
                  <div class="q-card__icon">&#128176;</div>
                  <div class="q-card__title" data-i18n="s6_hotel_cancel_cheap">Non-refundable OK</div>
                  <div class="q-card__desc" data-i18n="s6_hotel_cancel_cheap_desc">Cheaper rates are fine</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="nopref" data-en-name="No preference">
                  <div class="q-card__icon">&#129335;</div>
                  <div class="q-card__title" data-i18n="s6_hotel_cancel_nopref">No Preference</div>
                  <div class="q-card__desc" data-i18n="s6_hotel_cancel_nopref_desc">Either way is fine</div>
                </div>
              </div>
            </div>

            <!-- H7: Daily Budget per Room (dual-handle range slider) -->
            <div class="depth-extra-question" data-question-key="hotelBudget">
              <label class="field__label" data-i18n="s6_hotel_budget">Daily Budget per Room</label>
              <div class="range-slider" id="hotelBudgetSlider" data-min="30" data-max="1000" data-step="10" data-prefix="$" data-min-val="30" data-max-val="1000">
                <div class="range-slider__label" id="hotelBudgetLabel">$30 - $1,000</div>
                <div class="range-slider__track">
                  <div class="range-slider__fill"></div>
                  <div class="range-slider__handle" data-handle="min" tabindex="0" role="slider" aria-label="Minimum budget" aria-valuemin="30" aria-valuemax="1000" aria-valuenow="30"></div>
                  <div class="range-slider__handle" data-handle="max" tabindex="0" role="slider" aria-label="Maximum budget" aria-valuemin="30" aria-valuemax="1000" aria-valuenow="1000"></div>
                </div>
              </div>
            </div>

          </div> <!-- end #hotelSubQuestions -->
        </div> <!-- end #hotelAssistanceSection -->

        <!-- ===== Car Rental Assistance Section ===== -->
        <div class="assistance-section" id="carAssistanceSection">
          <div class="assistance-section__header" data-i18n="s6_car_header">Car Rental Assistance</div>

          <!-- Car toggle (Yes/No) -->
          <div class="depth-extra-question" data-question-key="carAssistToggle">
            <label class="field__label" data-i18n="s6_car_toggle">Would you like help choosing a rental car?</label>
            <div class="question-options">
              <div class="q-card is-selected" tabindex="0" role="button" data-value="no" data-en-name="No">
                <div class="q-card__icon">&#10060;</div>
                <div class="q-card__title" data-i18n="s6_car_toggle_no">No, I'll Handle It</div>
                <div class="q-card__desc" data-i18n="s6_car_toggle_no_desc">I'll arrange transport myself</div>
              </div>
              <div class="q-card" tabindex="0" role="button" data-value="yes" data-en-name="Yes">
                <div class="q-card__icon">&#128663;</div>
                <div class="q-card__title" data-i18n="s6_car_toggle_yes">Yes, Help Me Choose</div>
                <div class="q-card__desc" data-i18n="s6_car_toggle_yes_desc">I'd like car rental recommendations</div>
              </div>
            </div>
          </div>

          <!-- Car sub-questions (collapsed by default) -->
          <div class="assistance-section__body" id="carSubQuestions">

            <!-- C1: Car Category (single-select card grid, 14 options) -->
            <div class="depth-extra-question" data-question-key="carCategory">
              <label class="field__label" data-i18n="s6_car_category">Car Category</label>
              <div class="option-grid">
                <div class="q-card" tabindex="0" role="button" data-value="mini" data-en-name="Mini">
                  <div class="q-card__icon">&#128663;</div>
                  <div class="q-card__title" data-i18n="s6_car_cat_mini">Mini</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="economy" data-en-name="Economy">
                  <div class="q-card__icon">&#128664;</div>
                  <div class="q-card__title" data-i18n="s6_car_cat_economy">Economy</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="compact" data-en-name="Compact">
                  <div class="q-card__icon">&#128665;</div>
                  <div class="q-card__title" data-i18n="s6_car_cat_compact">Compact</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="intermediate" data-en-name="Intermediate">
                  <div class="q-card__icon">&#128665;</div>
                  <div class="q-card__title" data-i18n="s6_car_cat_intermediate">Intermediate</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="standard" data-en-name="Standard">
                  <div class="q-card__icon">&#128665;</div>
                  <div class="q-card__title" data-i18n="s6_car_cat_standard">Standard</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="fullsize" data-en-name="Full-size">
                  <div class="q-card__icon">&#128665;</div>
                  <div class="q-card__title" data-i18n="s6_car_cat_fullsize">Full-size</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="premium" data-en-name="Premium">
                  <div class="q-card__icon">&#128662;</div>
                  <div class="q-card__title" data-i18n="s6_car_cat_premium">Premium</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="luxury" data-en-name="Luxury">
                  <div class="q-card__icon">&#128662;</div>
                  <div class="q-card__title" data-i18n="s6_car_cat_luxury">Luxury</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="suv-compact" data-en-name="SUV Compact">
                  <div class="q-card__icon">&#128661;</div>
                  <div class="q-card__title" data-i18n="s6_car_cat_suv_compact">SUV Compact</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="suv-fullsize" data-en-name="SUV Full-size">
                  <div class="q-card__icon">&#128661;</div>
                  <div class="q-card__title" data-i18n="s6_car_cat_suv_full">SUV Full-size</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="minivan" data-en-name="Minivan / MPV">
                  <div class="q-card__icon">&#128656;</div>
                  <div class="q-card__title" data-i18n="s6_car_cat_minivan">Minivan / MPV</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="van" data-en-name="Van (7-9 seats)">
                  <div class="q-card__icon">&#128656;</div>
                  <div class="q-card__title" data-i18n="s6_car_cat_van">Van (7-9 seats)</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="convertible" data-en-name="Convertible">
                  <div class="q-card__icon">&#127966;</div>
                  <div class="q-card__title" data-i18n="s6_car_cat_convertible">Convertible</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="oversize" data-en-name="Oversize">
                  <div class="q-card__icon">&#128667;</div>
                  <div class="q-card__title" data-i18n="s6_car_cat_oversize">Oversize</div>
                </div>
              </div>
            </div>

            <!-- C2: Transmission (q-card single-select, 3 options) -->
            <div class="depth-extra-question" data-question-key="carTransmission">
              <label class="field__label" data-i18n="s6_car_transmission">Transmission</label>
              <div class="question-options">
                <div class="q-card" tabindex="0" role="button" data-value="automatic" data-en-name="Automatic">
                  <div class="q-card__icon">&#129302;</div>
                  <div class="q-card__title" data-i18n="s6_car_trans_auto">Automatic</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="manual" data-en-name="Manual">
                  <div class="q-card__icon">&#128400;</div>
                  <div class="q-card__title" data-i18n="s6_car_trans_manual">Manual</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="nopref" data-en-name="No preference">
                  <div class="q-card__icon">&#129335;</div>
                  <div class="q-card__title" data-i18n="s6_car_trans_nopref">No Preference</div>
                </div>
              </div>
            </div>

            <!-- C3: Fuel Type (q-card single-select, 5 options) -->
            <div class="depth-extra-question" data-question-key="carFuel">
              <label class="field__label" data-i18n="s6_car_fuel">Fuel Type Preference</label>
              <div class="question-options">
                <div class="q-card" tabindex="0" role="button" data-value="petrol" data-en-name="Petrol">
                  <div class="q-card__icon">&#9981;</div>
                  <div class="q-card__title" data-i18n="s6_car_fuel_petrol">Petrol</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="diesel" data-en-name="Diesel">
                  <div class="q-card__icon">&#9981;</div>
                  <div class="q-card__title" data-i18n="s6_car_fuel_diesel">Diesel</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="hybrid" data-en-name="Hybrid">
                  <div class="q-card__icon">&#127793;</div>
                  <div class="q-card__title" data-i18n="s6_car_fuel_hybrid">Hybrid</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="electric" data-en-name="Electric">
                  <div class="q-card__icon">&#9889;</div>
                  <div class="q-card__title" data-i18n="s6_car_fuel_electric">Electric</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="nopref" data-en-name="No preference">
                  <div class="q-card__icon">&#129335;</div>
                  <div class="q-card__title" data-i18n="s6_car_fuel_nopref">No Preference</div>
                </div>
              </div>
            </div>

            <!-- C4: Pickup & Return (q-card single-select, 4 options) -->
            <div class="depth-extra-question" data-question-key="carPickup">
              <label class="field__label" data-i18n="s6_car_pickup">Pickup &amp; Return</label>
              <div class="question-options">
                <div class="q-card" tabindex="0" role="button" data-value="airport" data-en-name="Airport">
                  <div class="q-card__icon">&#9992;</div>
                  <div class="q-card__title" data-i18n="s6_car_pickup_airport">Airport</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="city" data-en-name="City center office">
                  <div class="q-card__icon">&#127963;</div>
                  <div class="q-card__title" data-i18n="s6_car_pickup_city">City Center Office</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="hotel" data-en-name="Hotel or accommodation delivery">
                  <div class="q-card__icon">&#127976;</div>
                  <div class="q-card__title" data-i18n="s6_car_pickup_hotel">Hotel Delivery</div>
                </div>
                <div class="q-card" tabindex="0" role="button" data-value="train" data-en-name="Train station">
                  <div class="q-card__icon">&#128646;</div>
                  <div class="q-card__title" data-i18n="s6_car_pickup_train">Train Station</div>
                </div>
              </div>
            </div>

            <!-- C5: Additional Equipment (multi-select chips, 7 options) -->
            <div class="depth-extra-question" data-question-key="carExtras">
              <label class="field__label" data-i18n="s6_car_extras">Additional Equipment Needed</label>
              <div class="chip-toggle-group" id="carExtrasChips">
                <button type="button" class="chip-toggle" data-en-name="Child seat (infant)" data-i18n="s6_car_extra_infant">&#128118; Child Seat (Infant)</button>
                <button type="button" class="chip-toggle" data-en-name="Child seat (toddler)" data-i18n="s6_car_extra_toddler">&#128103; Child Seat (Toddler)</button>
                <button type="button" class="chip-toggle" data-en-name="Booster seat" data-i18n="s6_car_extra_booster">&#128186; Booster Seat</button>
                <button type="button" class="chip-toggle" data-en-name="GPS Navigation" data-i18n="s6_car_extra_gps">&#128225; GPS Navigation</button>
                <button type="button" class="chip-toggle" data-en-name="Roof rack" data-i18n="s6_car_extra_roof">&#127955; Roof Rack</button>
                <button type="button" class="chip-toggle" data-en-name="Snow chains" data-i18n="s6_car_extra_snow">&#10052; Snow Chains</button>
                <button type="button" class="chip-toggle" data-en-name="Additional driver" data-i18n="s6_car_extra_driver">&#128100; Additional Driver</button>
              </div>
            </div>

            <!-- C6: Daily Rental Budget (dual-handle range slider) -->
            <div class="depth-extra-question" data-question-key="carBudget">
              <label class="field__label" data-i18n="s6_car_budget">Daily Rental Budget</label>
              <div class="range-slider" id="carBudgetSlider" data-min="0" data-max="1000" data-step="10" data-prefix="$" data-min-val="0" data-max-val="1000">
                <div class="range-slider__label" id="carBudgetLabel">$0 - $1,000</div>
                <div class="range-slider__track">
                  <div class="range-slider__fill"></div>
                  <div class="range-slider__handle" data-handle="min" tabindex="0" role="slider" aria-label="Minimum budget" aria-valuemin="0" aria-valuemax="1000" aria-valuenow="0"></div>
                  <div class="range-slider__handle" data-handle="max" tabindex="0" role="slider" aria-label="Maximum budget" aria-valuemin="0" aria-valuemax="1000" aria-valuenow="1000"></div>
                </div>
              </div>
            </div>

          </div> <!-- end #carSubQuestions -->
        </div> <!-- end #carAssistanceSection -->
```

**Rationale:** The two sections are placed after the wheelchair toggle and before the button bar, maintaining the Step 6 field order specified in REQ-010 AC-1. Each section follows the `.depth-extra-question` pattern for sub-questions (compact q-cards, uppercase accent-alt labels). The toggle questions mirror the wheelchair Yes/No pattern. The `.option-grid` class is used for the 12-option and 14-option card grids. The `.chip-toggle-group` class is used for multi-select amenities/extras. Range sliders use data attributes for configuration.

---

### 1.3 `trip_intake.html` — JavaScript: Chip Toggle Click Handler

**Action:** Modify (add new JS block within the script section, after the existing q-card click delegation block around line 4424)

**Target state — New JS block:**

```javascript
// ================================================================
//  CHIP TOGGLE: Multi-select click handler for .chip-toggle buttons
// ================================================================
document.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip-toggle');
  if (!chip) return;
  chip.classList.toggle('is-selected');
});
```

**Rationale:** Simple toggle behavior for multi-select chips. Unlike q-cards (radio behavior, one selected per question), chips toggle independently. This is consistent with the interest/avoid card toggle pattern but simpler (no scoring, no badge animation).

---

### 1.4 `trip_intake.html` — JavaScript: Assistance Section Toggle Logic

**Action:** Modify (add new JS block after the chip toggle handler)

**Target state — New JS block:**

```javascript
// ================================================================
//  ASSISTANCE SECTIONS: Toggle show/hide + reset on collapse
// ================================================================
(function initAssistanceSections() {
  const sections = [
    { toggleKey: 'hotelAssistToggle', bodyId: 'hotelSubQuestions' },
    { toggleKey: 'carAssistToggle',   bodyId: 'carSubQuestions' }
  ];

  sections.forEach(({ toggleKey, bodyId }) => {
    const container = document.querySelector(`.depth-extra-question[data-question-key="${toggleKey}"]`);
    const body = document.getElementById(bodyId);
    if (!container || !body) return;

    // Use MutationObserver on q-card is-selected changes, or simpler: hook into the global click
    // We listen for clicks on q-cards within the toggle container
    container.addEventListener('click', (e) => {
      const card = e.target.closest('.q-card');
      if (!card) return;
      const val = card.dataset.value;

      if (val === 'yes') {
        body.classList.add('is-expanded');
      } else {
        body.classList.remove('is-expanded');
        // Reset all selections within the body
        body.querySelectorAll('.q-card.is-selected').forEach(c => c.classList.remove('is-selected'));
        body.querySelectorAll('.chip-toggle.is-selected').forEach(c => c.classList.remove('is-selected'));
        // Reset range sliders to full range
        body.querySelectorAll('.range-slider').forEach(slider => {
          const min = parseInt(slider.dataset.min);
          const max = parseInt(slider.dataset.max);
          slider.dataset.minVal = min;
          slider.dataset.maxVal = max;
          updateSliderUI(slider);
        });
        // Re-select default "No" for pets toggle if inside hotel section
        body.querySelectorAll('.depth-extra-question[data-question-key="hotelPets"] .q-card[data-value="no"]').forEach(c => c.classList.add('is-selected'));
      }
    });
  });
})();
```

**Rationale:** REQ-001 AC-5 and REQ-003 AC-5 require that collapsing a section clears all selections to defaults. The reset logic removes `is-selected` from all cards and chips, resets sliders to full range, and restores the pets toggle default. The `is-expanded` class triggers the CSS max-height/opacity transition.

---

### 1.5 `trip_intake.html` — JavaScript: Dual-Handle Range Slider Component

**Action:** Modify (add new JS block — the range slider initialization)

**Target state — New JS block:**

```javascript
// ================================================================
//  DUAL-HANDLE RANGE SLIDER COMPONENT
// ================================================================
function updateSliderUI(sliderEl) {
  const min = parseInt(sliderEl.dataset.min);
  const max = parseInt(sliderEl.dataset.max);
  const minVal = parseInt(sliderEl.dataset.minVal);
  const maxVal = parseInt(sliderEl.dataset.maxVal);
  const prefix = sliderEl.dataset.prefix || '';
  const range = max - min;
  const isRTL = document.documentElement.dir === 'rtl';

  const track = sliderEl.querySelector('.range-slider__track');
  const fill = sliderEl.querySelector('.range-slider__fill');
  const handleMin = sliderEl.querySelector('[data-handle="min"]');
  const handleMax = sliderEl.querySelector('[data-handle="max"]');
  const label = sliderEl.querySelector('.range-slider__label');

  const minPct = ((minVal - min) / range) * 100;
  const maxPct = ((maxVal - min) / range) * 100;

  if (isRTL) {
    fill.style.right = minPct + '%';
    fill.style.left = (100 - maxPct) + '%';
    fill.style.width = '';
    handleMin.style.right = minPct + '%';
    handleMin.style.left = '';
    handleMax.style.right = maxPct + '%';
    handleMax.style.left = '';
  } else {
    fill.style.left = minPct + '%';
    fill.style.right = '';
    fill.style.width = (maxPct - minPct) + '%';
    handleMin.style.left = minPct + '%';
    handleMin.style.right = '';
    handleMax.style.left = maxPct + '%';
    handleMax.style.right = '';
  }

  // Update ARIA
  handleMin.setAttribute('aria-valuenow', minVal);
  handleMax.setAttribute('aria-valuenow', maxVal);

  // Update label
  const fmtMin = prefix + minVal.toLocaleString();
  const fmtMax = prefix + maxVal.toLocaleString();
  if (label) label.textContent = fmtMin + ' \u2013 ' + fmtMax;
}

function initRangeSlider(sliderEl) {
  const min = parseInt(sliderEl.dataset.min);
  const max = parseInt(sliderEl.dataset.max);
  const step = parseInt(sliderEl.dataset.step) || 1;
  const track = sliderEl.querySelector('.range-slider__track');

  updateSliderUI(sliderEl);

  function getValueFromPosition(clientX) {
    const rect = track.getBoundingClientRect();
    const isRTL = document.documentElement.dir === 'rtl';
    let pct = isRTL
      ? (rect.right - clientX) / rect.width
      : (clientX - rect.left) / rect.width;
    pct = Math.max(0, Math.min(1, pct));
    let val = min + pct * (max - min);
    val = Math.round(val / step) * step;
    return Math.max(min, Math.min(max, val));
  }

  function startDrag(handle, e) {
    e.preventDefault();
    const which = handle.dataset.handle; // 'min' or 'max'

    function onMove(ev) {
      const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
      let val = getValueFromPosition(clientX);
      let curMin = parseInt(sliderEl.dataset.minVal);
      let curMax = parseInt(sliderEl.dataset.maxVal);

      if (which === 'min') {
        val = Math.min(val, curMax - step); // cannot exceed max
        sliderEl.dataset.minVal = val;
      } else {
        val = Math.max(val, curMin + step); // cannot go below min
        sliderEl.dataset.maxVal = val;
      }
      updateSliderUI(sliderEl);
    }

    function onEnd() {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    }

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }

  // Attach pointer events to handles
  sliderEl.querySelectorAll('.range-slider__handle').forEach(handle => {
    handle.addEventListener('pointerdown', (e) => startDrag(handle, e));
    handle.addEventListener('touchstart', (e) => startDrag(handle, e), { passive: false });

    // Keyboard support
    handle.addEventListener('keydown', (e) => {
      const which = handle.dataset.handle;
      let curMin = parseInt(sliderEl.dataset.minVal);
      let curMax = parseInt(sliderEl.dataset.maxVal);
      const isRTL = document.documentElement.dir === 'rtl';

      let delta = 0;
      if (e.key === 'ArrowRight') delta = isRTL ? -step : step;
      else if (e.key === 'ArrowLeft') delta = isRTL ? step : -step;
      else if (e.key === 'ArrowUp') delta = step;
      else if (e.key === 'ArrowDown') delta = -step;
      else return;

      e.preventDefault();
      if (which === 'min') {
        let newVal = Math.max(min, Math.min(curMax - step, curMin + delta));
        sliderEl.dataset.minVal = newVal;
      } else {
        let newVal = Math.max(curMin + step, Math.min(max, curMax + delta));
        sliderEl.dataset.maxVal = newVal;
      }
      updateSliderUI(sliderEl);
    });
  });

  // Click on track to move nearest handle
  track.addEventListener('pointerdown', (e) => {
    if (e.target.classList.contains('range-slider__handle')) return;
    const val = getValueFromPosition(e.clientX);
    const curMin = parseInt(sliderEl.dataset.minVal);
    const curMax = parseInt(sliderEl.dataset.maxVal);
    // Move whichever handle is closer
    if (Math.abs(val - curMin) <= Math.abs(val - curMax)) {
      sliderEl.dataset.minVal = Math.min(val, curMax - step);
    } else {
      sliderEl.dataset.maxVal = Math.max(val, curMin + step);
    }
    updateSliderUI(sliderEl);
  });
}

// Initialize both sliders
document.querySelectorAll('.range-slider').forEach(initRangeSlider);
```

**Rationale:** The range slider is a self-contained component using pointer events for cross-platform compatibility (mouse + touch). Keyboard accessibility is provided via arrow keys on each handle. RTL support reverses the slider direction. The `updateSliderUI` function is extracted as a standalone function so the assistance section reset logic can call it when collapsing. Handles cannot cross each other (min handle <= max handle - step). The `touch-action: none` CSS on the track (already in §1.1) prevents page scroll conflicts on mobile.

---

### 1.6 `trip_intake.html` — JavaScript: Markdown Generation Extension

**Action:** Modify (extend the patched `generateMarkdown()` function, adding hotel and car sections after the `## Additional Preferences` block)

**Current state (line ~6751-6757):**
```javascript
          if (prefs.length > 0) {
            md += `\n## Additional Preferences\n\n`;
            md += prefs.join('\n') + '\n';
          }
        }

        return md;
```

**Target state — Replace the above with:**
```javascript
          if (prefs.length > 0) {
            md += `\n## Additional Preferences\n\n`;
            md += prefs.join('\n') + '\n';
          }
        }

        // === Hotel Assistance (conditional) ===
        const hotelToggleEl = document.querySelector('.depth-extra-question[data-question-key="hotelAssistToggle"] .q-card.is-selected');
        if (hotelToggleEl && hotelToggleEl.dataset.value === 'yes') {
          md += `\n## Hotel Assistance\n\n`;

          // Accommodation type
          const hotelTypeEl = document.querySelector('.depth-extra-question[data-question-key="hotelType"] .q-card.is-selected');
          md += `- **Accommodation type:** ${hotelTypeEl ? hotelTypeEl.dataset.enName : 'Not specified'}\n`;

          // Location priority
          const hotelLocEl = document.querySelector('.depth-extra-question[data-question-key="hotelLocation"] .q-card.is-selected');
          md += `- **Location priority:** ${hotelLocEl ? hotelLocEl.dataset.enName : 'Not specified'}\n`;

          // Quality level
          const hotelStarsEl = document.querySelector('.depth-extra-question[data-question-key="hotelStars"] .q-card.is-selected');
          md += `- **Quality level:** ${hotelStarsEl ? hotelStarsEl.dataset.enName : 'Not specified'}\n`;

          // Amenities (multi-select)
          const hotelAmenities = Array.from(document.querySelectorAll('#hotelAmenitiesChips .chip-toggle.is-selected'))
            .map(c => c.dataset.enName);
          md += `- **Must-have amenities:** ${hotelAmenities.length > 0 ? hotelAmenities.join(', ') : 'None'}\n`;

          // Pets
          const hotelPetsEl = document.querySelector('.depth-extra-question[data-question-key="hotelPets"] .q-card.is-selected');
          md += `- **Traveling with pets:** ${hotelPetsEl && hotelPetsEl.dataset.value === 'yes' ? 'Yes' : 'No'}\n`;

          // Cancellation
          const hotelCancelEl = document.querySelector('.depth-extra-question[data-question-key="hotelCancellation"] .q-card.is-selected');
          md += `- **Cancellation preference:** ${hotelCancelEl ? hotelCancelEl.dataset.enName : 'Not specified'}\n`;

          // Budget (range slider)
          const hotelSlider = document.getElementById('hotelBudgetSlider');
          const hotelMinVal = hotelSlider ? hotelSlider.dataset.minVal : '30';
          const hotelMaxVal = hotelSlider ? hotelSlider.dataset.maxVal : '1000';
          md += `- **Daily budget per room:** $${hotelMinVal} - $${hotelMaxVal}\n`;
        }

        // === Car Rental Assistance (conditional) ===
        const carToggleEl = document.querySelector('.depth-extra-question[data-question-key="carAssistToggle"] .q-card.is-selected');
        if (carToggleEl && carToggleEl.dataset.value === 'yes') {
          md += `\n## Car Rental Assistance\n\n`;

          // Car category
          const carCatEl = document.querySelector('.depth-extra-question[data-question-key="carCategory"] .q-card.is-selected');
          md += `- **Car category:** ${carCatEl ? carCatEl.dataset.enName : 'Not specified'}\n`;

          // Transmission
          const carTransEl = document.querySelector('.depth-extra-question[data-question-key="carTransmission"] .q-card.is-selected');
          md += `- **Transmission:** ${carTransEl ? carTransEl.dataset.enName : 'Not specified'}\n`;

          // Fuel type
          const carFuelEl = document.querySelector('.depth-extra-question[data-question-key="carFuel"] .q-card.is-selected');
          md += `- **Fuel type:** ${carFuelEl ? carFuelEl.dataset.enName : 'Not specified'}\n`;

          // Pickup & return
          const carPickupEl = document.querySelector('.depth-extra-question[data-question-key="carPickup"] .q-card.is-selected');
          md += `- **Pickup & return:** ${carPickupEl ? carPickupEl.dataset.enName : 'Not specified'}\n`;

          // Extras (multi-select)
          const carExtras = Array.from(document.querySelectorAll('#carExtrasChips .chip-toggle.is-selected'))
            .map(c => c.dataset.enName);
          md += `- **Additional equipment:** ${carExtras.length > 0 ? carExtras.join(', ') : 'None'}\n`;

          // Budget (range slider)
          const carSlider = document.getElementById('carBudgetSlider');
          const carMinVal = carSlider ? carSlider.dataset.minVal : '0';
          const carMaxVal = carSlider ? carSlider.dataset.maxVal : '1000';
          md += `- **Daily rental budget:** $${carMinVal} - $${carMaxVal}\n`;
        }

        return md;
```

**Rationale:** The hotel and car sections are conditionally appended after `## Additional Preferences`, matching the BRD-specified markdown format exactly (REQ-006 AC-3, REQ-007 AC-3). All values use `data-en-name` attributes for language-agnostic English output (REQ-006 AC-4, REQ-007 AC-4). Unselected fields show "Not specified" (REQ-006 AC-5, REQ-007 AC-5). Multi-select fields with no selections show "None".

---

### 1.7 `locales/ui_*.json` — New i18n Keys (12 files)

**Action:** Modify (add new keys to each locale file)

**New keys to add (English values shown — translate for `ui_ru.json` and `ui_he.json`, use English fallback for the other 9):**

```json
{
  "s6_hotel_header": "Hotel Assistance",
  "s6_hotel_toggle": "Would you like help choosing accommodation?",
  "s6_hotel_toggle_no": "No, I'll Handle It",
  "s6_hotel_toggle_no_desc": "I'll arrange accommodation myself",
  "s6_hotel_toggle_yes": "Yes, Help Me Choose",
  "s6_hotel_toggle_yes_desc": "I'd like accommodation recommendations",
  "s6_hotel_type": "Accommodation Type",
  "s6_hotel_type_hotel": "Hotel",
  "s6_hotel_type_boutique": "Boutique Hotel",
  "s6_hotel_type_resort": "Resort & Spa",
  "s6_hotel_type_apartment": "Apartment / Condo",
  "s6_hotel_type_aparthotel": "Apart-Hotel",
  "s6_hotel_type_villa": "Villa / House",
  "s6_hotel_type_bnb": "B&B / Guesthouse",
  "s6_hotel_type_hostel": "Hostel",
  "s6_hotel_type_farmhouse": "Farmhouse / Agriturismo",
  "s6_hotel_type_cabin": "Cabin / Cottage",
  "s6_hotel_type_glamping": "Glamping",
  "s6_hotel_type_houseboat": "Houseboat",
  "s6_hotel_location": "Location Priority",
  "s6_hotel_loc_center": "City Center & Walkable",
  "s6_hotel_loc_attractions": "Near Main Attractions",
  "s6_hotel_loc_quiet": "Quiet & Residential",
  "s6_hotel_loc_beach": "Beachfront / Waterfront",
  "s6_hotel_loc_transport": "Near Transport Hub",
  "s6_hotel_stars": "Quality Level",
  "s6_hotel_stars_budget": "Budget (1-2 stars)",
  "s6_hotel_stars_mid": "Mid-range (3 stars)",
  "s6_hotel_stars_upscale": "Upscale (4 stars)",
  "s6_hotel_stars_luxury": "Luxury (5 stars)",
  "s6_hotel_amenities": "Must-Have Amenities",
  "s6_hotel_amen_pool": "Pool",
  "s6_hotel_amen_parking": "Free Parking",
  "s6_hotel_amen_kitchen": "Kitchen",
  "s6_hotel_amen_wifi": "Free WiFi",
  "s6_hotel_amen_gym": "Gym",
  "s6_hotel_amen_spa": "Spa & Wellness",
  "s6_hotel_amen_ac": "Air Conditioning",
  "s6_hotel_amen_laundry": "Laundry",
  "s6_hotel_amen_kids": "Kids Play Area",
  "s6_hotel_amen_restaurant": "Restaurant On-site",
  "s6_hotel_amen_nonsmoking": "Non-smoking Rooms",
  "s6_hotel_amen_shuttle": "Airport Shuttle",
  "s6_hotel_pets": "Traveling with Pets?",
  "s6_hotel_pets_no": "No",
  "s6_hotel_pets_no_desc": "Not bringing pets",
  "s6_hotel_pets_yes": "Yes",
  "s6_hotel_pets_yes_desc": "Need pet-friendly accommodation",
  "s6_hotel_cancellation": "Cancellation Flexibility",
  "s6_hotel_cancel_free": "Free Cancellation",
  "s6_hotel_cancel_free_desc": "Even if it costs more",
  "s6_hotel_cancel_cheap": "Non-refundable OK",
  "s6_hotel_cancel_cheap_desc": "Cheaper rates are fine",
  "s6_hotel_cancel_nopref": "No Preference",
  "s6_hotel_cancel_nopref_desc": "Either way is fine",
  "s6_hotel_budget": "Daily Budget per Room",
  "s6_car_header": "Car Rental Assistance",
  "s6_car_toggle": "Would you like help choosing a rental car?",
  "s6_car_toggle_no": "No, I'll Handle It",
  "s6_car_toggle_no_desc": "I'll arrange transport myself",
  "s6_car_toggle_yes": "Yes, Help Me Choose",
  "s6_car_toggle_yes_desc": "I'd like car rental recommendations",
  "s6_car_category": "Car Category",
  "s6_car_cat_mini": "Mini",
  "s6_car_cat_economy": "Economy",
  "s6_car_cat_compact": "Compact",
  "s6_car_cat_intermediate": "Intermediate",
  "s6_car_cat_standard": "Standard",
  "s6_car_cat_fullsize": "Full-size",
  "s6_car_cat_premium": "Premium",
  "s6_car_cat_luxury": "Luxury",
  "s6_car_cat_suv_compact": "SUV Compact",
  "s6_car_cat_suv_full": "SUV Full-size",
  "s6_car_cat_minivan": "Minivan / MPV",
  "s6_car_cat_van": "Van (7-9 seats)",
  "s6_car_cat_convertible": "Convertible",
  "s6_car_cat_oversize": "Oversize",
  "s6_car_transmission": "Transmission",
  "s6_car_trans_auto": "Automatic",
  "s6_car_trans_manual": "Manual",
  "s6_car_trans_nopref": "No Preference",
  "s6_car_fuel": "Fuel Type Preference",
  "s6_car_fuel_petrol": "Petrol",
  "s6_car_fuel_diesel": "Diesel",
  "s6_car_fuel_hybrid": "Hybrid",
  "s6_car_fuel_electric": "Electric",
  "s6_car_fuel_nopref": "No Preference",
  "s6_car_pickup": "Pickup & Return",
  "s6_car_pickup_airport": "Airport",
  "s6_car_pickup_city": "City Center Office",
  "s6_car_pickup_hotel": "Hotel Delivery",
  "s6_car_pickup_train": "Train Station",
  "s6_car_extras": "Additional Equipment Needed",
  "s6_car_extra_infant": "Child Seat (Infant)",
  "s6_car_extra_toddler": "Child Seat (Toddler)",
  "s6_car_extra_booster": "Booster Seat",
  "s6_car_extra_gps": "GPS Navigation",
  "s6_car_extra_roof": "Roof Rack",
  "s6_car_extra_snow": "Snow Chains",
  "s6_car_extra_driver": "Additional Driver",
  "s6_car_budget": "Daily Rental Budget"
}
```

**Total: 93 new keys.**

For `ui_ru.json`: provide Russian translations for all 93 keys.
For `ui_he.json`: provide Hebrew translations for all 93 keys.
For the remaining 9 files (`ui_es.json`, `ui_fr.json`, `ui_de.json`, `ui_it.json`, `ui_pt.json`, `ui_zh.json`, `ui_ja.json`, `ui_ko.json`, `ui_ar.json`): use the English values as fallback.

**Rationale:** Follows the established i18n pattern (REQ-008). Key prefix `s6_hotel_*` and `s6_car_*` follows the existing `s6_wheelchair_*` convention. All 93 keys are present in all 12 files per AC-2 through AC-5.

---

## 2. Markdown Format Specification

### 2.1 Hotel Assistance Section (Conditional)

Appears after `## Additional Preferences`, only when hotel toggle = "Yes".

```markdown
## Hotel Assistance

- **Accommodation type:** {value from hotelType data-en-name, or "Not specified"}
- **Location priority:** {value from hotelLocation data-en-name, or "Not specified"}
- **Quality level:** {value from hotelStars data-en-name, or "Not specified"}
- **Must-have amenities:** {comma-separated hotelAmenities data-en-name values, or "None"}
- **Traveling with pets:** {Yes or No}
- **Cancellation preference:** {value from hotelCancellation data-en-name, or "Not specified"}
- **Daily budget per room:** ${minVal} - ${maxVal}
```

**Example output:**
```markdown
## Hotel Assistance

- **Accommodation type:** Boutique Hotel
- **Location priority:** City center & walkable
- **Quality level:** Upscale (4 stars)
- **Must-have amenities:** Pool, Free WiFi, Air Conditioning, Restaurant On-site
- **Traveling with pets:** No
- **Cancellation preference:** Free cancellation (even if pricier)
- **Daily budget per room:** $100 - $300
```

### 2.2 Car Rental Assistance Section (Conditional)

Appears after Hotel Assistance (or after `## Additional Preferences` if no hotel section), only when car toggle = "Yes".

```markdown
## Car Rental Assistance

- **Car category:** {value from carCategory data-en-name, or "Not specified"}
- **Transmission:** {value from carTransmission data-en-name, or "Not specified"}
- **Fuel type:** {value from carFuel data-en-name, or "Not specified"}
- **Pickup & return:** {value from carPickup data-en-name, or "Not specified"}
- **Additional equipment:** {comma-separated carExtras data-en-name values, or "None"}
- **Daily rental budget:** ${minVal} - ${maxVal}
```

**Example output:**
```markdown
## Car Rental Assistance

- **Car category:** SUV Compact
- **Transmission:** Automatic
- **Fuel type:** No preference
- **Pickup & return:** Airport
- **Additional equipment:** Child seat (toddler), Booster seat, GPS Navigation
- **Daily rental budget:** $30 - $150
```

### 2.3 Section Ordering in Full Markdown

```
# Trip Details
## Trip Context
  ### Daily Schedule
  ### Universal Interests
  ### Places to Avoid
  ### Pace Preference
  ### Culinary Profile
## Travelers
  ### Parents
  ### Children
## Language Preference
## Additional Notes              (conditional — only if notes provided)
## Additional Preferences        (always present when depth patch active)
## Hotel Assistance              (NEW — conditional, only when toggle = Yes)
## Car Rental Assistance         (NEW — conditional, only when toggle = Yes)
```

---

## 3. HTML Rendering Specification

N/A — This change does not affect the trip HTML rendering pipeline (`/render` skill). The new markdown sections are consumed by the trip generation pipeline (future enhancement, out of scope per BRD §2). The trip intake page's Step 7 preview renders the raw markdown, which already handles any valid markdown structure.

---

## 4. Rule File Updates

### 4.1 `trip_intake_rules.md`

| Section | Change |
|---|---|
| Step 6 — Language & Extras field table (line ~168-176) | Add two new rows at the end: `Hotel Assistance` (toggle + 7 sub-questions, supplementary) and `Car Rental Assistance` (toggle + 6 sub-questions, supplementary) |
| Supplementary Fields table (line ~239-252) | Add rows: `hotelAssistToggle` (2-option card, Step 6), `hotelType` (card grid, Step 6), `hotelLocation` (q-card, Step 6), `hotelStars` (q-card, Step 6), `hotelAmenities` (multi-select chips, Step 6), `hotelPets` (2-option card, Step 6), `hotelCancellation` (q-card, Step 6), `hotelBudget` (range slider, Step 6), `carAssistToggle` (2-option card, Step 6), `carCategory` (card grid, Step 6), `carTransmission` (q-card, Step 6), `carFuel` (q-card, Step 6), `carPickup` (q-card, Step 6), `carExtras` (multi-select chips, Step 6), `carBudget` (range slider, Step 6) |
| Output Format section (line ~362-449) | Add `## Hotel Assistance` and `## Car Rental Assistance` sections to the markdown structure template, with a note that both are conditional (only present when toggle = Yes) |
| "Adding a new form field" section (line ~481-484) | No change needed (existing instructions apply) |

**Exact additions to Step 6 field table:**

```markdown
| Hotel Assistance (toggle) | — | 2-option card (supplementary) | Yes = show hotel sub-questions, No = hide (default). Clearing resets all hotel selections. |
| Hotel sub-questions (7) | — | Various (supplementary) | hotelType (card grid 12), hotelLocation (q-card 5), hotelStars (q-card 4), hotelAmenities (chips 12), hotelPets (toggle 2), hotelCancellation (q-card 3), hotelBudget (range slider $30-$1000) |
| Car Rental Assistance (toggle) | — | 2-option card (supplementary) | Yes = show car sub-questions, No = hide (default). Clearing resets all car selections. |
| Car sub-questions (6) | — | Various (supplementary) | carCategory (card grid 14), carTransmission (q-card 3), carFuel (q-card 5), carPickup (q-card 4), carExtras (chips 7), carBudget (range slider $0-$1000) |
```

**Exact additions to Supplementary Fields table:**

```markdown
| hotelAssistToggle | 2-option card | Step 6 |
| hotelType | Card grid (12 options) | Step 6 |
| hotelLocation | q-card (5 options) | Step 6 |
| hotelStars | q-card (4 options) | Step 6 |
| hotelAmenities | Multi-select chips (12 options) | Step 6 |
| hotelPets | 2-option card | Step 6 |
| hotelCancellation | q-card (3 options) | Step 6 |
| hotelBudget | Dual-handle range slider | Step 6 |
| carAssistToggle | 2-option card | Step 6 |
| carCategory | Card grid (14 options) | Step 6 |
| carTransmission | q-card (3 options) | Step 6 |
| carFuel | q-card (5 options) | Step 6 |
| carPickup | q-card (4 options) | Step 6 |
| carExtras | Multi-select chips (7 options) | Step 6 |
| carBudget | Dual-handle range slider | Step 6 |
```

**Exact additions to Output Format markdown template:**

```markdown
## Hotel Assistance

- **Accommodation type:** {value}
- **Location priority:** {value}
- **Quality level:** {value}
- **Must-have amenities:** {comma-separated list or "None"}
- **Traveling with pets:** {Yes/No}
- **Cancellation preference:** {value}
- **Daily budget per room:** ${min} - ${max}

## Car Rental Assistance

- **Car category:** {value}
- **Transmission:** {value}
- **Fuel type:** {value}
- **Pickup & return:** {value}
- **Additional equipment:** {comma-separated list or "None"}
- **Daily rental budget:** ${min} - ${max}
```

Add a note below the template: _"The `## Hotel Assistance` and `## Car Rental Assistance` sections are conditional — they appear only when the corresponding toggle is set to Yes in Step 6. If the toggle is No, the section is omitted entirely."_

### 4.2 `trip_intake_design.md`

| Section | Change |
|---|---|
| After "Wheelchair Accessibility Question" spec (line ~359) | Add new subsections: "Assistance Section (`.assistance-section`)", "Option Grid (`.option-grid`)", "Chip Toggle (`.chip-toggle`)", "Dual-Handle Range Slider (`.range-slider`)" |

**New subsection: Assistance Section (`.assistance-section`)**

```markdown
### Assistance Section (`.assistance-section`)
- Used for Hotel Assistance and Car Rental Assistance in Step 6
- Container: `margin-top: var(--space-5)`, `border-top: 1px solid var(--color-border)`, `padding-top: var(--space-4)`
- Header: `.assistance-section__header` — matches `.chip-section__title` styling (uppercase, xs text, semibold, accent-alt)
- Toggle: Uses `.depth-extra-question` with 2-option `.q-card` grid (same as wheelchair pattern)
- Body: `.assistance-section__body` — collapsed by default (`max-height: 0; opacity: 0; overflow: hidden`)
- Expanded state: `.is-expanded` class sets `max-height: 4000px; opacity: 1`
- Transition: `max-height 0.4s ease, opacity 0.3s ease` (per animation spec)
- Collapse resets all child selections (cards, chips, sliders) to defaults
- Two instances: `#hotelAssistanceSection` (7 sub-questions) and `#carAssistanceSection` (6 sub-questions)
- i18n: header and all child elements use `data-i18n`
```

**New subsection: Option Grid (`.option-grid`)**

```markdown
### Option Grid (`.option-grid`)
- Responsive card grid for large option sets (12+ options)
- Used for `hotelType` (12 options) and `carCategory` (14 options)
- Grid: `repeat(4, 1fr)` desktop, `repeat(3, 1fr)` at <= 768px, `repeat(2, 1fr)` at <= 480px
- Cards: `.q-card` with compact sizing — `min-height: 100px`, smaller padding and font
- No description text (`.q-card__desc { display: none }`) — icon + title only
- Radio behavior: same as standard q-card (one selected per container)
- Touch target: min 44x44px via card size
- i18n: each card title has `data-i18n`, each card has `data-en-name` for markdown output
```

**New subsection: Chip Toggle (`.chip-toggle`)**

```markdown
### Chip Toggle (`.chip-toggle`)
- Pill-shaped multi-select buttons for amenities and equipment lists
- Container: `.chip-toggle-group` — flex wrap layout, gap `var(--space-2)`
- Chip: `border-radius: 999px`, `border: 2px solid var(--color-border)`, `min-height: 44px`
- States: default (border only), hover (brand-primary border + lift), selected (brand-primary bg, white text)
- Click toggles `.is-selected` class (multi-select, not radio)
- Each chip has `data-en-name` for language-agnostic markdown output
- i18n: each chip has `data-i18n` for translated display text
- Keyboard: focusable via `<button>`, Enter/Space toggles selection
```

**New subsection: Dual-Handle Range Slider (`.range-slider`)**

```markdown
### Dual-Handle Range Slider (`.range-slider`)
- New component for budget questions (hotel $30-$1000, car $0-$1000)
- Container: `.range-slider` with `data-min`, `data-max`, `data-step`, `data-prefix` attributes
- Track: `.range-slider__track` — 6px height, border-radius 3px, border-strong bg
- Fill: `.range-slider__fill` — brand-primary bg, positioned between handles
- Handles: `.range-slider__handle` — 24px circle, surface bg, 3px brand-primary border, shadow-sm
  - Touch target: 44x44px (padding: 10px around 24px handle)
  - Cursor: grab (default), grabbing (active)
  - Focus ring: brand-accent outline, 4px offset
- Label: `.range-slider__label` — centered text showing "$min - $max", updates on drag
- Behavior:
  - Pointer events (mouse + touch) for drag
  - Handles cannot cross (min handle <= max handle - step)
  - Step increment: configurable (10 for both budget sliders)
  - Click on track moves nearest handle
  - Keyboard: Arrow Left/Right/Up/Down adjust value by step
- RTL: Track direction reverses (low values on right, high on left)
- ARIA: `role="slider"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow` on each handle
- Dark mode: inherits design system colors via CSS variables
```

### 4.3 `content_format_rules.md`

| Section | Change |
|---|---|
| Not directly modified | The trip details markdown structure is documented in `trip_intake_rules.md` (Output Format section). `content_format_rules.md` documents the trip *output* folder structure, not the intake. However, per BRD §2, add a note in the trip details consumption context. |

Add a note after the "Generation Context per Day" section (around line 99):

```markdown
> **Note:** The trip details file may contain optional `## Hotel Assistance` and `## Car Rental Assistance` sections at the end. These sections carry structured accommodation and vehicle preferences. The trip generation pipeline does not currently consume these sections (future enhancement). Their presence does not affect existing generation behavior.
```

---

## 5. Implementation Checklist

- [ ] Add CSS: `.assistance-section`, `.assistance-section__header`, `.assistance-section__body` styles
- [ ] Add CSS: `.option-grid` responsive grid with compact q-card overrides
- [ ] Add CSS: `.chip-toggle-group` and `.chip-toggle` styles
- [ ] Add CSS: `.range-slider`, `.range-slider__track`, `.range-slider__fill`, `.range-slider__handle`, `.range-slider__label` styles
- [ ] Add HTML: Hotel Assistance section in Step 6 (toggle + 7 sub-questions)
- [ ] Add HTML: Car Rental Assistance section in Step 6 (toggle + 6 sub-questions)
- [ ] Add JS: Chip toggle click handler (multi-select)
- [ ] Add JS: Assistance section toggle logic (expand/collapse + reset)
- [ ] Add JS: `initRangeSlider()` + `updateSliderUI()` functions
- [ ] Add JS: Initialize range sliders on page load
- [ ] Extend JS: Patched `generateMarkdown()` — hotel section
- [ ] Extend JS: Patched `generateMarkdown()` — car section
- [ ] Add i18n keys: 93 new keys to `locales/ui_en.json`
- [ ] Add i18n keys: 93 Russian translations to `locales/ui_ru.json`
- [ ] Add i18n keys: 93 Hebrew translations to `locales/ui_he.json`
- [ ] Add i18n keys: 93 English fallback values to remaining 9 locale files
- [ ] Update `trip_intake_rules.md`: Step 6 field table
- [ ] Update `trip_intake_rules.md`: Supplementary Fields table
- [ ] Update `trip_intake_rules.md`: Output Format markdown template
- [ ] Update `trip_intake_design.md`: New component specs (4 subsections)
- [ ] Update `content_format_rules.md`: Note about optional sections in trip details

---

## 6. BRD Traceability

| Requirement | Acceptance Criterion | Implemented in |
|---|---|---|
| REQ-001: Hotel Toggle | AC-1: Section heading visible | `trip_intake.html`: §1.2 (`.assistance-section__header`) |
| REQ-001 | AC-2: Yes/No q-card toggle | `trip_intake.html`: §1.2 (`hotelAssistToggle` container) |
| REQ-001 | AC-3: Default = No | `trip_intake.html`: §1.2 (`is-selected` on "No" card) |
| REQ-001 | AC-4: Yes reveals sub-questions | `trip_intake.html`: §1.4 (toggle logic adds `is-expanded`) |
| REQ-001 | AC-5: No collapses + clears | `trip_intake.html`: §1.4 (reset logic on collapse) |
| REQ-001 | AC-6: i18n attributes + keys | `trip_intake.html`: §1.2 (`data-i18n` on all elements); `locales/`: §1.7 |
| REQ-001 | AC-7: RTL support | `trip_intake.html`: §1.1 (CSS logical properties, RTL overrides) |
| REQ-002: Hotel Questions | AC-1: 7 questions in order | `trip_intake.html`: §1.2 (H1-H7 in DOM order) |
| REQ-002 | AC-2: hotelType card grid 12 options | `trip_intake.html`: §1.2 (`.option-grid` with 12 `.q-card`) |
| REQ-002 | AC-3: hotelLocation q-card 5 options | `trip_intake.html`: §1.2 (`.question-options` with 5 `.q-card`) |
| REQ-002 | AC-4: hotelStars q-card 4 options | `trip_intake.html`: §1.2 (`.question-options` with 4 `.q-card`) |
| REQ-002 | AC-5: hotelAmenities multi-select chips | `trip_intake.html`: §1.2 (`.chip-toggle-group` with 12 chips); §1.3 (click handler) |
| REQ-002 | AC-6: hotelPets toggle default No | `trip_intake.html`: §1.2 (`is-selected` on "No") |
| REQ-002 | AC-7: hotelCancellation q-card 3 options | `trip_intake.html`: §1.2 (`.question-options` with 3 `.q-card`) |
| REQ-002 | AC-8: hotelBudget range slider | `trip_intake.html`: §1.2 (`.range-slider` DOM); §1.5 (`initRangeSlider`) |
| REQ-002 | AC-9: data-i18n on all labels | `trip_intake.html`: §1.2 (every element has `data-i18n`) |
| REQ-002 | AC-10: i18n keys in all 12 files | `locales/`: §1.7 (93 keys × 12 files) |
| REQ-002 | AC-11: Design system compliance | `trip_intake.html`: §1.1 (CSS uses design tokens) |
| REQ-003: Car Toggle | AC-1–AC-7 | Same pattern as REQ-001, `trip_intake.html`: §1.2 (car section), §1.4 |
| REQ-004: Car Questions | AC-1–AC-10 | Same pattern as REQ-002, `trip_intake.html`: §1.2 (C1-C6) |
| REQ-005: Range Slider | AC-1: Two handles | `trip_intake.html`: §1.2 (two `.range-slider__handle` elements) |
| REQ-005 | AC-2: Highlighted fill | `trip_intake.html`: §1.1 (`.range-slider__fill` brand-primary) |
| REQ-005 | AC-3: Handles cannot cross | `trip_intake.html`: §1.5 (`Math.min`/`Math.max` guards) |
| REQ-005 | AC-4: Label shows range | `trip_intake.html`: §1.5 (`updateSliderUI` sets label text) |
| REQ-005 | AC-5: 44px touch target | `trip_intake.html`: §1.1 (handle padding: 10px around 24px) |
| REQ-005 | AC-6: Keyboard accessible | `trip_intake.html`: §1.5 (keydown handler for arrow keys) |
| REQ-005 | AC-7: Configurable step | `trip_intake.html`: §1.5 (`data-step` attribute, read in `initRangeSlider`) |
| REQ-005 | AC-8: Configurable min/max | `trip_intake.html`: §1.5 (`data-min`/`data-max` attributes) |
| REQ-005 | AC-9: RTL support | `trip_intake.html`: §1.5 (RTL direction check in position calculations) |
| REQ-005 | AC-10: Design system colors | `trip_intake.html`: §1.1 (all CSS uses `var(--color-*)` tokens) |
| REQ-005 | AC-11: Desktop + mobile | `trip_intake.html`: §1.5 (pointer events + touch events) |
| REQ-006: Hotel Markdown | AC-1: Section present when Yes | `trip_intake.html`: §1.6 (conditional `if` check) |
| REQ-006 | AC-2: Omitted when No | `trip_intake.html`: §1.6 (guard clause) |
| REQ-006 | AC-3: Exact format | `trip_intake.html`: §1.6 (matches BRD format exactly) |
| REQ-006 | AC-4: English values | `trip_intake.html`: §1.6 (`dataset.enName` for all values) |
| REQ-006 | AC-5: Default "Not specified" | `trip_intake.html`: §1.6 (ternary fallback) |
| REQ-006 | AC-6: Step 7 preview | Automatic — preview renders whatever `generateMarkdown()` returns |
| REQ-006 | AC-7: Downloaded file | Automatic — download uses same `generateMarkdown()` output |
| REQ-007: Car Markdown | AC-1–AC-7 | Same pattern as REQ-006, `trip_intake.html`: §1.6 (car section) |
| REQ-008: i18n | AC-1: data-i18n attributes | `trip_intake.html`: §1.2 (all new elements) |
| REQ-008 | AC-2: English keys in ui_en.json | `locales/ui_en.json`: §1.7 |
| REQ-008 | AC-3: Russian in ui_ru.json | `locales/ui_ru.json`: §1.7 |
| REQ-008 | AC-4: Hebrew in ui_he.json | `locales/ui_he.json`: §1.7 |
| REQ-008 | AC-5: Fallback in 9 other files | `locales/ui_*.json`: §1.7 |
| REQ-008 | AC-6: data-en-name on cards | `trip_intake.html`: §1.2 (every selectable card/chip) |
| REQ-008 | AC-7: Instant language switch | Automatic — existing `setLanguage()` handles all `[data-i18n]` |
| REQ-009: Design System | AC-1: Expand/collapse animation | `trip_intake.html`: §1.1 (max-height + opacity, 0.3-0.4s) |
| REQ-009 | AC-2: Responsive card grid | `trip_intake.html`: §1.1 (`.option-grid` 4→3→2 cols) |
| REQ-009 | AC-3: q-card compact sizing | `trip_intake.html`: §1.1 (`.depth-extra-question .q-card` min-height 140px) |
| REQ-009 | AC-4: Chip pill shape | `trip_intake.html`: §1.1 (`.chip-toggle` radius 999px) |
| REQ-009 | AC-5: Toggle Yes/No matches wheelchair | `trip_intake.html`: §1.2 (identical DOM pattern) |
| REQ-009 | AC-6: 44px touch targets | `trip_intake.html`: §1.1 (chip min-height, slider handle padding) |
| REQ-009 | AC-7: Responsive at 3 widths | `trip_intake.html`: §1.1 (media queries for 768px, 480px) |
| REQ-009 | AC-8: Dark mode | `trip_intake.html`: §1.1 (all colors via CSS variables, dark mode overrides apply) |
| REQ-010: Layout | AC-1: Field order | `trip_intake.html`: §1.2 (hotel after wheelchair, car after hotel) |
| REQ-010 | AC-2: Section headers | `trip_intake.html`: §1.2 (`.assistance-section__header`) |
| REQ-010 | AC-3: Toggle as gatekeeper | `trip_intake.html`: §1.2 (toggle is first element in each section) |
| REQ-010 | AC-4: Smooth animation | `trip_intake.html`: §1.1 (`.assistance-section__body` transitions) |
| REQ-010 | AC-5: Visual separation | `trip_intake.html`: §1.1 (`border-top` + spacing on `.assistance-section`) |
| REQ-010 | AC-6: No layout jumps | `trip_intake.html`: §1.1 (`overflow: hidden` on body, max-height transition) |
| REQ-011: Supplementary Fields | AC-1: All fields in table | `trip_intake_rules.md`: §4.1 (15 new rows) |
| REQ-011 | AC-2: No depth tier assignment | `trip_intake_rules.md`: §4.1 (all marked supplementary, no tier) |
| REQ-011 | AC-3: Visible at all depths | Automatic — supplementary fields are not depth-gated |
