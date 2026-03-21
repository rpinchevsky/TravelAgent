# Detailed Design

**Change:** Question Depth Selector — User-Controlled Wizard Length
**Date:** 2026-03-19
**Author:** Development Team
**HLD Reference:** high_level_design.md
**Status:** Revised (SA feedback addressed)

---

## SA Feedback Addressed

- **FB-1 (Blocking):** Moved `foodExperience`, `diningVibe`, `foodNotes` from T3 to T4. T1+T2+T3 now equals exactly 20. Moved `snacking` and `photography` from T4 to T5. All tiers now distribute as 10/5/5/5/5, hitting targets 10/15/20/25/30 exactly.
- **FB-2 (Blocking):** Verified `trip_intake.html` line 1864 — `evening` question is removed from rendering (HTML comment only). Step 2 has 2 sub-dots and 2 question slides (setting, culture). Dead `q_evening*` translation keys remain; cleanup noted in implementation checklist. Inventory explicitly excludes `evening`.
- **FB-3 (Recommendation):** Added Step Merging Rules (§8) with formal specification for the merging threshold, target steps, DOM relocation method, and stepper behavior.
- **FB-4 (Blocking):** New T4/T5 fields placed in "Additional Preferences" subsection of the markdown output (§5.3). This is additive — not a format change. The trip generation pipeline ignores unknown fields. A follow-up change will teach the pipeline to consume them.
- **FB-5 (Recommendation):** Escape closes overlay and returns to Step 1 without selecting a depth. Only "Let's Go" confirms.
- **FB-7 (Observation):** Verified `trip_intake.html` — TRANSLATIONS object contains 12 languages (en, ru, he, es, fr, de, it, pt, zh, ja, ko, ar). All 12 are fully implemented. Phase 7 targets all 12.
- **FB-8 (Observation):** Re-entry behavior specified: same animation, current depth pre-selected, confirm button changes to "Update", returns to user's current step.

---

## 1. File Changes

### 1.1 trip_intake.html

| Area | Change Type | Description |
|------|-------------|-------------|
| HTML — after Step 1 section | Add | Depth selector overlay markup (`.depth-selector-overlay`) |
| HTML — Steps 4, 5, 6 | Add | New T4/T5 optional question slides for 25/30 depth |
| CSS — new rules | Add | `.depth-selector-overlay`, `.depth-card`, `.depth-pill`, `.context-bar__pill--depth` |
| JS — constants | Add | `QUESTION_TIERS`, `QUESTION_DEFAULTS`, `DEPTH_LEVELS` |
| JS — `applyDepth(level)` | Add | Master function: show/hide questions, update stepper/progress/dots |
| JS — `goToStep()` | Modify | Skip steps with no visible questions; update `activeSteps` array |
| JS — `nextStep()`/`prevStep()` | Modify | Navigate through `activeSteps` array instead of linear increment |
| JS — progress bar | Modify | Denominator = `activeSteps.length` instead of fixed 8 |
| JS — stepper rendering | Modify | Hide stepper circles for skipped steps |
| JS — sub-step dots | Modify | Rebuild dots based on visible questions per quiz step |
| JS — `generateMarkdown()` | Modify | For each field, use `userAnswers[key] ?? QUESTION_DEFAULTS[key]`; add "Additional Preferences" subsection |
| JS — Step 1 Continue handler | Modify | Show depth selector overlay before proceeding to Step 2 |
| JS — context bar | Modify | Add depth pill after travelers pill |
| JS — toast | Add | Show toast on depth selection/change |
| JS — TRANSLATIONS | Add | New i18n keys for depth selector labels, toast messages, context pill |
| JS — quiz auto-advance | Modify | After last visible sub-question, advance (not fixed last index) |
| JS — dead code cleanup | Remove | Remove unused `q_evening*` translation keys from all 12 language blocks |

### 1.2 trip_intake_rules.md

| Section | Change Type | Description |
|---------|-------------|-------------|
| "Wizard Flow (8 Steps)" | Modify | Add preamble about depth selector appearing after Step 1 |
| New "Question Depth Selector" subsection | Add | Between Step 1 and Step 2 descriptions |
| New "Question Inventory & Depth Tiers" section | Add | Full tier table, default values, depth-to-tier mapping |
| Steps 2–6 descriptions | Modify | Annotate each question with its tier (e.g., "(T1)" after the question name) |
| "Output Format" section | Modify | Add "Additional Preferences" subsection spec; note output is identical regardless of depth |

### 1.3 trip_intake_design.md

| Section | Change Type | Description |
|---------|-------------|-------------|
| New "Depth Selector Overlay" section | Add | Component spec, layout, animations, responsive rules |
| "Progress Stepper" section | Modify | Document dynamic step count behavior |
| "Top Progress Bar" section | Modify | Dynamic percentage calculation formula |
| "Selection Summary Strip" context bar | Modify | New depth pill item type |
| "Toast Notifications" | Modify | Add depth selection toast type |

## 2. Question Inventory & Tier Assignment

### Existing Questions (23 total)

Verified against `trip_intake.html` on 2026-03-19. The `evening` question (formerly Step 2 Q3) is confirmed removed — only an HTML comment remains at line 1864. It is NOT included in this inventory.

| # | Step | Question Key | Question | Type | Tier | Depth Levels |
|---|------|-------------|----------|------|------|-------------|
| 1 | 0 | `rhythm` | What's Your Travel Rhythm? | 4-option card | T1 | 10, 15, 20, 25, 30 |
| 2 | 2 | `setting` | Where do you feel most alive? | quiz (3-option) | T1 | 10, 15, 20, 25, 30 |
| 3 | 2 | `culture` | What draws you in? | quiz (3-option) | T1 | 10, 15, 20, 25, 30 |
| 4 | 3 | `interests` | Interest chip selection | chip grid | T1 | 10, 15, 20, 25, 30 |
| 5 | 4 | `noise` | Crowd & noise comfort? | quiz (3-option) | T1 | 10, 15, 20, 25, 30 |
| 6 | 4 | `foodadventure` | How adventurous with food? | quiz (3-option) | T1 | 10, 15, 20, 25, 30 |
| 7 | 4 | `pace` | Trip pace selection | 3-card selector | T1 | 10, 15, 20, 25, 30 |
| 8 | 5 | `diet` | What does your group eat? | quiz (4-option) | T1 | 10, 15, 20, 25, 30 |
| 9 | 6 | `reportLang` | Report language | select dropdown | T1 | 10, 15, 20, 25, 30 |
| 10 | 6 | `extraNotes` | Additional notes textarea | textarea | T1 | 10, 15, 20, 25, 30 |
| 11 | 4 | `budget` | Spending comfort? | quiz (3-option) | T2 | 15, 20, 25, 30 |
| 12 | 4 | `flexibility` | How structured? | quiz (3-option) | T2 | 15, 20, 25, 30 |
| 13 | 3 | `customInterests` | Custom interests textarea | textarea | T2 | 15, 20, 25, 30 |
| 14 | 4 | `avoidChips` | Avoid chip selection | chip grid | T2 | 15, 20, 25, 30 |
| 15 | 4 | `customAvoid` | Custom avoid textarea | textarea | T2 | 15, 20, 25, 30 |
| 16 | 5 | `diningstyle` | Where do you love eating? | quiz (3-option) | T3 | 20, 25, 30 |
| 17 | 5 | `kidsfood` | Dietary restrictions/allergies? | quiz (3-option) | T3 | 20, 25, 30 |
| 18 | 5 | `mealpriority` | Which meal matters most? | quiz (3-option) | T3 | 20, 25, 30 |
| 19 | 5 | `localfood` | How local should food be? | quiz (3-option) | T3 | 20, 25, 30 |
| 20 | 6 | `poiLangs` | POI languages | text input | T3 | 20, 25, 30 |
| 21 | 5 | `foodExperience` | Food experience cards | dynamic cards | T4 | 25, 30 |
| 22 | 5 | `diningVibe` | Dining vibe cards | chip group | T4 | 25, 30 |
| 23 | 5 | `foodNotes` | Food notes textarea | textarea | T4 | 25, 30 |

### New Questions for T4 and T5 (7 total)

| # | Step | Question Key | Question | Type | Tier | Options | Default |
|---|------|-------------|----------|------|------|---------|---------|
| 24 | 4 | `transport` | Preferred getting around? | quiz (3-option) | T4 | Walking / Public Transit (default) / Taxi & Rideshare | `transit` |
| 25 | 4 | `morningPreference` | Morning or afternoon person? | quiz (3-option) | T4 | Morning Person / No Preference (default) / Afternoon Starter | `nopref` |
| 26 | 5 | `snacking` | How important is snacking between meals? | quiz (3-option) | T5 | Skip Snacks / Occasional Nibbles (default) / Serious Snacker | `occasional` |
| 27 | 6 | `photography` | How important is photography? | quiz (3-option) | T5 | Not a Priority / Nice Bonus (default) / Major Activity | `bonus` |
| 28 | 4 | `visitDuration` | Attraction visit style? | quiz (3-option) | T5 | Quick Highlights / Moderate Exploration (default) / Deep Immersion | `moderate` |
| 29 | 4 | `shopping` | How important is shopping? | quiz (3-option) | T5 | Skip It / Browse if Convenient (default) / Dedicated Shopping Time | `browse` |
| 30 | 6 | `accessibility` | Any accessibility considerations? | quiz (3-option) | T5 | No Special Needs (default) / Prefer Flat Routes / Wheelchair Accessible | `none` |

### Tier Count Verification

| Depth | Tiers Included | Questions | Count | Target | Delta |
|-------|---------------|-----------|-------|--------|-------|
| 10 | T1 | rhythm, setting, culture, interests, noise, foodadventure, pace, diet, reportLang, extraNotes | **10** | 10 | **0** |
| 15 | T1 + T2 | +budget, flexibility, customInterests, avoidChips, customAvoid | **15** | 15 | **0** |
| 20 | T1 + T2 + T3 | +diningstyle, kidsfood, mealpriority, localfood, poiLangs | **20** | 20 | **0** |
| 25 | T1–T4 | +foodExperience, diningVibe, foodNotes, transport, morningPreference | **25** | 25 | **0** |
| 30 | T1–T5 | +snacking, photography, visitDuration, shopping, accessibility | **30** | 30 | **0** |

All five depth levels match their target exactly.

### Final Tier Table

| Tier | Questions | Count | Cumulative |
|------|-----------|-------|------------|
| T1 | rhythm, setting, culture, interests, pace, reportLang, noise, foodadventure, diet, extraNotes | 10 | 10 |
| T2 | budget, flexibility, customInterests, avoidChips, customAvoid | 5 | 15 |
| T3 | diningstyle, kidsfood, mealpriority, localfood, poiLangs | 5 | 20 |
| T4 | foodExperience, diningVibe, foodNotes, transport, morningPreference | 5 | 25 |
| T5 | snacking, photography, visitDuration, shopping, accessibility | 5 | 30 |

**Depth labels displayed to user:**

| Depth | Label | Subtext |
|-------|-------|---------|
| 10 | Quick | ~2 minutes |
| 15 | Light | ~3 minutes |
| 20 | Standard | ~5 minutes (recommended) |
| 25 | Detailed | ~7 minutes |
| 30 | Deep Dive | ~10 minutes |

## 3. Default Values Table

Every question that can be hidden (T2–T5) plus T1 questions that have pre-selected defaults:

| Question Key | Step | Tier | Default Value | Default Label (for markdown) | Rationale |
|---|---|---|---|---|---|
| `rhythm` | 0 | T1 | `balanced` | Easy Going (10:00–19:00) | Middle option |
| `setting` | 2 | T1 | `both` | A Bit of Both | Middle option |
| `culture` | 2 | T1 | `both` | Both | Middle option |
| `interests` | 3 | T1 | Pre-selected from quiz defaults | (scoring-driven) | Quiz defaults feed scoring |
| `noise` | 4 | T1 | `flexible` | Flexible | Middle option |
| `foodadventure` | 4 | T1 | `open` | Open to Try | Middle option |
| `pace` | 4 | T1 | `balanced` | Balanced (3-5 activities) | Middle option |
| `diet` | 5 | T1 | `omnivore` | Omnivore | Most common default |
| `reportLang` | 6 | T1 | `"English"` | English | Browser-detected or English fallback |
| `extraNotes` | 6 | T1 | `""` (empty) | (omitted from output) | No extra notes |
| `budget` | 4 | T2 | `balanced` | Worth the Spend | Middle option |
| `flexibility` | 4 | T2 | `loose` | Loose Framework | Middle option |
| `customInterests` | 3 | T2 | `""` (empty) | (omitted from output) | No custom interests |
| `avoidChips` | 4 | T2 | `[]` (empty) | (none) | No avoids unless user selects |
| `customAvoid` | 4 | T2 | `""` (empty) | (omitted from output) | No custom avoids |
| `diningstyle` | 5 | T3 | `casual` | Casual Restaurants | Middle option |
| `kidsfood` | 5 | T3 | `some` | Some Flexibility | Middle option |
| `mealpriority` | 5 | T3 | `dinner` | Dinner is the Event | Pre-selected default |
| `localfood` | 5 | T3 | `mix` | Mix of Both | Middle option |
| `poiLangs` | 6 | T3 | `""` (empty) | (omitted from output) | No POI languages |
| `foodExperience` | 5 | T4 | `[]` (empty) | (omitted if empty) | No food must-haves unless user selects |
| `diningVibe` | 5 | T4 | `[]` (empty) | (omitted if empty) | No vibe preference unless user selects |
| `foodNotes` | 5 | T4 | `""` (empty) | (omitted from output) | No notes |
| `transport` | 4 | T4 | `transit` | Public Transit | Middle/most common option |
| `morningPreference` | 4 | T4 | `nopref` | No Preference | Middle option |
| `snacking` | 5 | T5 | `occasional` | Occasional Nibbles | Middle option |
| `photography` | 6 | T5 | `bonus` | Nice Bonus | Middle option |
| `visitDuration` | 4 | T5 | `moderate` | Moderate Exploration | Middle option |
| `shopping` | 4 | T5 | `browse` | Browse if Convenient | Middle option |
| `accessibility` | 6 | T5 | `none` | No Special Needs | Most common default |

**Pre-selection scoring at low depth:** At depth 10, quiz answers include `setting=both`, `culture=both`, `noise=flexible`, `foodadventure=open`, `diet=omnivore`. These produce a moderate, balanced set of pre-selected interest chips (parks, gardens, outdoor markets, cultural festivals, family-friendly museums). The scoring engine uses these defaults to populate chips even when the quiz questions are hidden. This ensures the interest chip step (T1, always visible) has meaningful pre-selections.

## 4. HTML Component Specification (Depth Selector)

### Structure

```html
<div class="depth-selector-overlay" id="depthOverlay" role="dialog" aria-label="Choose question depth" aria-modal="true">
  <div class="depth-selector">
    <h3 class="depth-selector__title" data-i18n="depth_title">How much detail would you like?</h3>
    <p class="depth-selector__desc" data-i18n="depth_desc">Choose how many questions to answer. Fewer = faster, more = more personalized.</p>

    <div class="depth-selector__options" role="radiogroup" aria-label="Question depth">
      <button class="depth-card" data-depth="10" role="radio" aria-checked="false" tabindex="0">
        <span class="depth-card__number">10</span>
        <span class="depth-card__label" data-i18n="depth_10">Quick</span>
        <span class="depth-card__time" data-i18n="depth_10_time">~2 min</span>
      </button>
      <button class="depth-card" data-depth="15" role="radio" aria-checked="false" tabindex="-1">
        <span class="depth-card__number">15</span>
        <span class="depth-card__label" data-i18n="depth_15">Light</span>
        <span class="depth-card__time" data-i18n="depth_15_time">~3 min</span>
      </button>
      <button class="depth-card is-selected" data-depth="20" role="radio" aria-checked="true" tabindex="-1">
        <span class="depth-card__number">20</span>
        <span class="depth-card__label" data-i18n="depth_20">Standard</span>
        <span class="depth-card__time" data-i18n="depth_20_time">~5 min</span>
        <span class="depth-card__badge" data-i18n="depth_recommended">Recommended</span>
      </button>
      <button class="depth-card" data-depth="25" role="radio" aria-checked="false" tabindex="-1">
        <span class="depth-card__number">25</span>
        <span class="depth-card__label" data-i18n="depth_25">Detailed</span>
        <span class="depth-card__time" data-i18n="depth_25_time">~7 min</span>
      </button>
      <button class="depth-card" data-depth="30" role="radio" aria-checked="false" tabindex="-1">
        <span class="depth-card__number">30</span>
        <span class="depth-card__label" data-i18n="depth_30">Deep Dive</span>
        <span class="depth-card__time" data-i18n="depth_30_time">~10 min</span>
      </button>
    </div>

    <button class="btn btn--accent depth-selector__confirm" id="depthConfirmBtn" data-i18n="depth_confirm">Let's Go →</button>
  </div>
</div>
```

### CSS Specification

```
.depth-selector-overlay
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 500;
  display: flex; align-items: center; justify-content: center;
  animation: fadeIn 0.2s ease;

.depth-selector
  background: var(--color-surface);
  border-radius: var(--radius-container);
  box-shadow: var(--shadow-lg);
  padding: var(--space-6) var(--space-5);
  max-width: 640px; width: 90%;
  text-align: center;
  animation: sbDropIn 0.3s ease;

.depth-selector__title
  font-size: var(--text-2xl); font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-2);

.depth-selector__desc
  font-size: var(--text-sm); color: var(--color-text-muted);
  margin-bottom: var(--space-5);

.depth-selector__options
  display: flex; gap: var(--space-3); justify-content: center;
  flex-wrap: wrap; margin-bottom: var(--space-5);

.depth-card
  display: flex; flex-direction: column; align-items: center;
  padding: var(--space-4) var(--space-3);
  min-width: 100px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-container);
  background: var(--color-surface);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;

.depth-card:hover
  border-color: var(--color-brand-accent);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);

.depth-card.is-selected
  border-color: var(--color-brand-primary);
  background: rgba(26,60,94,0.05);
  box-shadow: 0 0 0 4px rgba(26,60,94,0.1);

.depth-card__number
  font-size: var(--text-3xl); font-weight: var(--font-weight-bold);
  color: var(--color-brand-primary);

.depth-card__label
  font-size: var(--text-sm); font-weight: var(--font-weight-semibold);
  margin-top: var(--space-1);

.depth-card__time
  font-size: var(--text-xs); color: var(--color-text-muted);
  margin-top: var(--space-1);

.depth-card__badge
  position: absolute; top: -10px; left: 50%; transform: translateX(-50%);
  background: var(--color-brand-accent);
  color: var(--color-text-inverse);
  font-size: 10px; font-weight: var(--font-weight-semibold);
  padding: 2px 8px; border-radius: 999px;
  white-space: nowrap;

.depth-selector__confirm
  min-width: 200px;
```

### Responsive (< 480px)

- `.depth-selector__options` becomes a 2-column + 1 grid (2x2 + centered 5th)
- `.depth-card` min-width: 120px, padding reduced
- Overlay becomes bottom sheet style on mobile (slides up from bottom, max-height 85vh)

### Keyboard Navigation

- Arrow Left/Right: move between depth cards
- Enter/Space: select focused card
- Tab: move to "Let's Go" / "Update" button
- Escape: dismiss overlay, return to Step 1 (does NOT select default, does NOT advance)

### Focus Management

- On overlay open (initial, after Step 1): focus moves to the pre-selected card (20)
- On overlay open (re-entry from pill): focus moves to the currently selected depth card
- On "Let's Go" click (initial): overlay closes, focus moves to Step 2 title
- On "Update" click (re-entry): overlay closes, focus moves to the step the user was on
- On Escape: overlay closes, focus returns to Step 1 Continue button

### Context Bar Depth Pill

```html
<span class="context-bar__pill context-bar__pill--depth" id="depthPill">
  <span class="context-bar__pill-icon">&#128202;</span>
  <span data-i18n="depth_pill">20 questions</span>
</span>
```

- Style: `var(--color-info)` bg (teal), inverse text
- Tapping the pill re-opens the depth selector overlay (re-entry mode)
- Hidden until depth is selected (always visible after Step 1)

### Re-entry Behavior (from Context Bar Pill)

When the depth selector overlay is opened from the context bar pill (not the initial post-Step-1 flow):
1. Overlay opens with the same `sbDropIn` animation
2. The user's current depth is pre-selected (highlighted card)
3. Confirm button label uses `depth_update` i18n key (e.g., "Update") instead of `depth_confirm` ("Let's Go")
4. On confirm: `applyDepth(newLevel)` re-runs, overlay closes, user returns to the step they were on (or nearest active step if their step was hidden)
5. On Escape: overlay closes, user returns to the step they were on (no changes applied)

### Toast on Depth Selection

```javascript
showToast('info', t('depth_toast_' + level));
// e.g., "Quick mode: 10 questions selected"
// e.g., "Standard: 20 questions — the full experience"
```

## 5. Rule File Updates

### 5.1 trip_intake_rules.md — New Sections

**Add after "Step 1 — Who's Traveling" and before "Step 2":**

```markdown
### Question Depth Selector (after Step 1)

After completing Step 1, an overlay presents 5 depth options: 10 (Quick), 15 (Light),
20 (Standard — default), 25 (Detailed), 30 (Deep Dive). The selected depth determines
which questions are shown. Steps 0, 1, and 7 are always fully present. The selector
can be reopened from the context bar depth pill at any point before Step 7.

See "Question Inventory & Depth Tiers" section for the full tier table.
```

**Add new top-level section after "Dynamic Interest Engine":**

```markdown
## Question Inventory & Depth Tiers

[Insert the full tier table from DD §2]

### Depth Defaults

When a question is hidden due to depth selection, its default value is used in the
generated markdown. See the default values table in the design document.

### Step Visibility Rules

- If ALL questions in a step are hidden → step is auto-skipped (stepper hides it)
- If SOME questions in a step are hidden → step is shown with reduced content
- Minimum 2 visible questions per shown step; if only 1, merge with adjacent step (see Step Merging Rules in DD §8)
- Quiz sub-step dots reflect only visible questions
```

### 5.2 trip_intake_design.md — New Section

**Add after "Pace Selector" section:**

```markdown
### Depth Selector Overlay

[Insert component spec from DD §4]
```

**Modify "Progress Stepper" section to add:**

```markdown
**Dynamic Step Count:**
- Steps with all questions hidden are removed from the stepper
- Stepper circles are renumbered to show only active steps
- Line fill recalculates: `fillPercent = (activeStepIndex / (activeSteps.length - 1)) * 100`
- Step emojis and labels are preserved for visible steps
```

**Modify "Top Progress Bar" section to add:**

```markdown
**Dynamic Calculation:**
- Denominator = number of active steps (varies by depth)
- Formula: `pct = currentActiveIndex === 0 ? 0 : Math.round((currentActiveIndex / (activeSteps.length - 1)) * 100)`
```

### 5.3 Output Format — Additional Preferences Subsection

New T4/T5 question fields are placed in a new **"Additional Preferences"** subsection within the existing markdown output structure. This subsection is appended after the "Additional Notes" section. It is additive — the trip generation pipeline can safely ignore it until a follow-up change teaches the pipeline to consume these fields.

**Exact markdown placement:**

```markdown
## Additional Notes

{free-text, only if provided}

## Additional Preferences

- **Transport preference:** {walking|public transit|taxi & rideshare}
- **Morning preference:** {morning person|no preference|afternoon starter}
- **Food experience must-haves:** {comma-separated list, omitted if empty}
- **Dining vibe:** {comma-separated list, omitted if empty}
- **Food notes:** {free-text, only if provided}
- **Snacking importance:** {skip|occasional|serious}
- **Photography importance:** {not a priority|nice bonus|major activity}
- **Visit duration style:** {quick highlights|moderate exploration|deep immersion}
- **Shopping importance:** {skip|browse if convenient|dedicated time}
- **Accessibility needs:** {none|prefer flat routes|wheelchair accessible}
```

**Scope resolution (FB-4):** The BRD says "Modifying the output format consumed by the trip generation pipeline" is out of scope. This "Additional Preferences" subsection does NOT modify any existing output sections — it is a new, appended section. The trip generation pipeline currently does not read this section, so no pipeline changes are needed for this feature. A follow-up change (separate BRD) will update the pipeline to consume these fields. Until then, the fields are present in the markdown but functionally ignored by downstream processing. Fields from existing questions that were moved between tiers (foodExperience, diningVibe, foodNotes) continue to appear in their existing output locations (Culinary Profile section) when answered, and are omitted (per existing behavior for empty values) when defaulted at lower depths.

## 6. Implementation Checklist

### Phase 1: Data Layer
- [ ] Define `QUESTION_TIERS` constant mapping each question key to tier number (per §2 Final Tier Table)
- [ ] Define `QUESTION_DEFAULTS` constant with default value for each question (per §3)
- [ ] Define `DEPTH_LEVELS` array: `[10, 15, 20, 25, 30]`
- [ ] Add `selectedDepth` state variable (default: 20)
- [ ] Add `userAnswers` object to persist all answers (even when hidden)
- [ ] Add `activeSteps` computed array
- [ ] Add `previousStep` variable to track user's current step for depth-change return

### Phase 2: Depth Selector UI
- [ ] Add depth selector overlay HTML after Step 1 section
- [ ] Add CSS for overlay, depth cards, badge, responsive layout
- [ ] Wire click handlers for depth cards (radio behavior)
- [ ] Wire "Let's Go" button to call `applyDepth()` and close overlay
- [ ] Add keyboard navigation (arrows, enter, escape — Escape returns to Step 1)
- [ ] Add ARIA attributes (role=radiogroup, role=radio, aria-checked)
- [ ] Add focus management (focus on open/close per §4)
- [ ] Implement re-entry mode: "Update" button label, return to current step

### Phase 3: Dynamic Wizard Adaptation
- [ ] Implement `applyDepth(level)` function:
  - Show/hide question elements based on tier
  - Recalculate `activeSteps` array
  - Update stepper (hide/show circles)
  - Update progress bar denominator
  - Rebuild sub-step dots for each quiz
- [ ] Modify `goToStep()` to use `activeSteps` for navigation
- [ ] Modify next/prev handlers to skip hidden steps
- [ ] Ensure auto-advance in quizzes respects visible question set
- [ ] Apply step merging rules (§8) for low-question steps

### Phase 4: New T4/T5 Questions
- [ ] Add `transport` question HTML to Step 4 (after flexibility quiz slide)
- [ ] Add `morningPreference` question HTML to Step 4
- [ ] Add `visitDuration` question HTML to Step 4
- [ ] Add `shopping` question HTML to Step 4
- [ ] Add `snacking` question HTML to Step 5 (after localfood quiz slide)
- [ ] Add `photography` question HTML to Step 6
- [ ] Add `accessibility` question HTML to Step 6
- [ ] Wire auto-advance for new quiz slides
- [ ] Add scoring integration for new questions where applicable

### Phase 5: Default Injection & Markdown
- [ ] Modify `generateMarkdown()` to read from `userAnswers` with fallback to `QUESTION_DEFAULTS`
- [ ] Add "Additional Preferences" subsection to markdown output (per §5.3)
- [ ] Existing T4 fields (foodExperience, diningVibe, foodNotes) continue in their current Culinary Profile location when answered; omitted when defaulted to empty
- [ ] Verify output at each depth level is structurally complete

### Phase 6: Feedback UI
- [ ] Add depth pill to context bar
- [ ] Wire pill click to reopen depth selector (re-entry mode per §4)
- [ ] Add toast notification on depth selection
- [ ] Verify progress bar accuracy at each depth
- [ ] Ensure smooth transitions when steps are skipped

### Phase 7: i18n
- [ ] Add all new i18n keys to TRANSLATIONS for all 12 languages (en, ru, he, es, fr, de, it, pt, zh, ja, ko, ar):
  - `depth_title`, `depth_desc`, `depth_confirm`, `depth_update`
  - `depth_10`, `depth_15`, `depth_20`, `depth_25`, `depth_30`
  - `depth_10_time`, `depth_15_time`, `depth_20_time`, `depth_25_time`, `depth_30_time`
  - `depth_recommended`
  - `depth_pill`
  - `depth_toast_10`, `depth_toast_15`, `depth_toast_20`, `depth_toast_25`, `depth_toast_30`
  - Labels for 7 new questions (3 options each = 21 title keys + 21 desc keys + 7 question label keys = 49 keys)
  - Total: ~66 new i18n keys x 12 languages
- [ ] Remove dead `q_evening*` translation keys from all 12 language blocks

### Phase 8: Step 1 Integration
- [ ] Modify Step 1 "Continue" handler to show depth overlay instead of going to Step 2
- [ ] After overlay confirms, navigate to first active step (Step 2 for depth >= 10)
- [ ] Support "Back" from Step 2 going to depth selector (or Step 1)
- [ ] Escape on overlay returns to Step 1

## 7. BRD Traceability

| REQ | AC | Design Element | Implementation Item |
|---|---|---|---|
| REQ-001 | AC-1 | §4 depth-card buttons (5 options) | Phase 2: HTML + click handlers |
| REQ-001 | AC-2 | §4 depth-card labels + time | Phase 2: "Quick — 10", "Standard — 20", etc. |
| REQ-001 | AC-3 | §4 `is-selected` on 20 card | Phase 2: pre-selected default |
| REQ-001 | AC-4 | §4 CSS spec (pill/card style) | Phase 2: CSS matching pace selector language |
| REQ-001 | AC-5 | §4 context bar pill reopens overlay (re-entry mode) | Phase 6: pill click + Phase 3: re-apply + return to current step |
| REQ-001 | AC-6 | §6 checklist Phase 7 | ~66 keys x 12 languages |
| REQ-001 | AC-7 | §4 keyboard nav + ARIA | Phase 2: role=radiogroup, arrows, focus |
| REQ-002 | AC-1 | §2 Full tier table | Phase 1: QUESTION_TIERS constant |
| REQ-002 | AC-2 | §2 Tier count verification | Verified: 10/15/20/25/30 all exact |
| REQ-002 | AC-3 | §2 T1 contents | setting, culture, interests, pace, reportLang + noise, foodadventure, diet, extraNotes, rhythm |
| REQ-002 | AC-4 | §2 "Steps 0, 1, 7 always present" | Not counted in budget |
| REQ-002 | AC-5 | §5.1 New rules section | trip_intake_rules.md update |
| REQ-003 | AC-1 | §3 applyDepth() | Phase 3: show/hide by tier |
| REQ-003 | AC-2 | §3 sub-step dots rebuild | Phase 3: dynamic dots |
| REQ-003 | AC-3 | §3 stepper update | Phase 3: hide skipped steps |
| REQ-003 | AC-4 | §3 progress bar | Phase 3: dynamic denominator |
| REQ-003 | AC-5 | §3 auto-skip empty steps | Phase 3: activeSteps navigation |
| REQ-003 | AC-6 | HLD §3 Depth Change Mid-Wizard | Phase 3: re-adapt on change; return to current step |
| REQ-003 | AC-7 | §3 quiz auto-advance | Phase 3: advance past last visible |
| REQ-004 | AC-1 | §3 Default Values Table | Phase 1: QUESTION_DEFAULTS |
| REQ-004 | AC-2 | §3 "Middle" rationale column | All defaults are middle/balanced |
| REQ-004 | AC-3 | §5 markdown generation + §5.3 Additional Preferences | Phase 5: identical output + new subsection |
| REQ-004 | AC-4 | §3 "Pre-selection scoring" note | Defaults feed scoring engine |
| REQ-004 | AC-5 | HLD §3 Data Flow | Review shows complete output |
| REQ-005 | AC-1 | §4 Context Bar Depth Pill | Phase 6: pill in context bar |
| REQ-005 | AC-2 | §5.2 progress bar formula | Phase 3: dynamic fill |
| REQ-005 | AC-3 | §3 activeSteps navigation | Phase 3: smooth skip to Step 7 |
| REQ-005 | AC-4 | §4 Toast on Depth Selection | Phase 6: toast notification |

## 8. Step Merging Rules

When `applyDepth()` results in a step having fewer than 2 visible questions, the step's content is merged into an adjacent step to avoid single-question screens that feel incomplete.

### Merging Threshold

A step is a merge candidate if it has exactly 1 visible question after tier filtering. Steps with 0 visible questions are simply hidden (auto-skipped) — no merging needed.

### Merge Scenarios by Depth

| Depth | Step | Visible Questions | Merge Target | Behavior |
|-------|------|-------------------|-------------|----------|
| 10 | Step 4 | 3 (noise, foodadventure, pace) | No merge needed | Shown normally |
| 10 | Step 5 | 1 (diet) | Merge into Step 4 | Diet question appended after pace in Step 4 |
| 10 | Step 6 | 2 (reportLang, extraNotes) | No merge needed | Shown normally |
| 15 | Step 5 | 1 (diet) | Merge into Step 4 | Diet question appended after pace in Step 4 |
| 15 | Step 6 | 2 (reportLang, extraNotes) | No merge needed | Shown normally |
| 20+ | All steps | >= 2 | No merges needed | All steps shown normally |

### DOM Relocation Method

When a question is merged into another step:
1. The question's HTML element is physically moved (DOM `appendChild`) into the target step's content area, after the last visible question in that step
2. A visual separator (`<hr class="step-divider">`) is inserted before the merged question to delineate it from the host step's content
3. The original step is marked hidden (`display: none`) and removed from `activeSteps`

### Stepper Behavior for Merged Steps

- The merged (source) step's stepper circle is hidden
- The target step's label and emoji remain unchanged (the merged question is a visual addition, not a renaming)
- Sub-step dots in the target step are recalculated to include the merged question

### Risks Identified in Design

| Risk | Severity | Mitigation |
|------|----------|------------|
| Step 5 at depth 10/15: only `diet` visible (1 question) — merged into Step 4 | Low | Clear merge rule defined in §8; diet card fits naturally after pace |
| Step 5 at depth 20: `diningstyle`, `kidsfood`, `mealpriority`, `localfood` are T3, but `foodExperience`, `diningVibe`, `foodNotes` are T4 → Step 5 has only quiz questions, no post-quiz cards | Low | Expected behavior; quiz collapses reveal the step's Continue button directly. Post-quiz cards appear only at depth 25+ |
| New T4/T5 questions add fields to markdown output | Low | Placed in "Additional Preferences" subsection (§5.3); trip generation pipeline ignores unknown sections; follow-up change to consume them |
| Escape on overlay at initial entry returns to Step 1 (user must re-click Continue) | Low | Acceptable friction — prevents accidental depth selection; matches principle of least surprise (FB-5) |
| i18n effort: ~66 keys x 12 languages = 792 translation strings | Medium | Labels are short (2-5 words); can use translation API for initial pass, then human review |
| Dead `q_evening*` translation keys | Low | Cleaned up in Phase 7; no functional impact until then |
