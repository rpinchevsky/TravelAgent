# High-Level Design

**Change:** Question Depth Selector — User-Controlled Wizard Length
**Date:** 2026-03-19
**Author:** Development Team
**BRD Reference:** business_requirements.md
**Status:** Revised (SA feedback addressed)

---

## SA Feedback Addressed

This revision addresses all blocking and recommended items from the SA architecture review (2026-03-19):

- **FB-1 (Blocking):** Redistributed tiers so depth 20 = exactly 20 questions. Moved `foodExperience`, `diningVibe`, `foodNotes` from T3 to T4. All five depths now hit their target exactly: 10/15/20/25/30.
- **FB-2 (Blocking):** Verified in `trip_intake.html` — the `evening` question slide is removed (replaced by HTML comment on line 1864). Only translation keys remain as dead code. The inventory correctly lists 23 existing questions without `evening`. Dead translation keys to be cleaned up during implementation.
- **FB-4 (Blocking):** New T4/T5 question output fields are placed in a new "Additional Preferences" subsection under the existing output structure. This is additive (not a format change) and the trip generation pipeline can safely ignore unknown fields until a follow-up change consumes them. Documented exact placement in DD §5.
- **FB-3 (Recommendation):** Depth change mid-wizard now returns user to their current step (or nearest active step), not Step 2.
- **FB-5 (Recommendation):** Escape on overlay returns to Step 1 without selecting a depth. Only the "Let's Go" button confirms and advances.
- **FB-8 (Observation):** Re-entry from context bar pill pre-selects current depth, uses "Update" button label, and returns to user's current step on confirm.

---

## 1. Overview

This feature introduces a depth selector that lets users choose how many questions the trip intake wizard asks: 10, 15, 20, 25, or 30. The selector appears as a new Step 1.5 — a transitional screen between the current Step 1 (Who's Traveling) and Step 2 (Travel Style Questionnaire). Based on the selected depth, questions are assigned to priority tiers (T1–T5). Questions above the selected tier are hidden, and their defaults are injected into the markdown output. The stepper, progress bar, and sub-step dot indicators all adapt dynamically to reflect only the visible questions.

### Current Question Inventory (Actual Count from Code)

Verified against `trip_intake.html` on 2026-03-19. The actual countable questions/inputs are:

| Step | Item | Count |
|------|------|-------|
| Step 0 | Daily rhythm (4-option card) | 1 |
| Step 2 | Setting quiz, Culture quiz | 2 |
| Step 3 | Interest chip selection | 1 |
| Step 3 | Custom interests textarea | 1 |
| Step 4 | Noise quiz, Food adventure quiz, Budget quiz, Flexibility quiz | 4 |
| Step 4 | Avoid chip selection | 1 |
| Step 4 | Custom avoid textarea | 1 |
| Step 4 | Pace selection | 1 |
| Step 5 | Diet quiz, Dining style quiz, Kids/dietary quiz, Meal priority quiz, Local food quiz | 5 |
| Step 5 | Food experience cards | 1 |
| Step 5 | Dining vibe cards | 1 |
| Step 5 | Food notes textarea | 1 |
| Step 6 | Report language | 1 |
| Step 6 | POI languages | 1 |
| Step 6 | Additional notes textarea | 1 |
| **Total** | | **23** |

**Note:** Step 0 (destination/dates/travelers via search bar), Step 1 (traveler details), and Step 7 (review/download) are always present and do NOT count toward the question budget (per REQ-002 AC-4).

**Evening question status (verified):** The `evening` question (formerly Step 2 Q3) has been removed from rendering. Line 1864 of `trip_intake.html` contains only `<!-- Q3: Evening — removed, now inferred from Daily Rhythm (Step 0) -->`. Step 2 has 2 sub-dots and 2 question slides (setting, culture). Translation keys for `q_evening*` remain as dead code and should be cleaned up during implementation. The `evening` question is NOT counted in the inventory.

### Depth-to-Tier Mapping

- **10 questions → T1 only** (core profiling)
- **15 questions → T1 + T2** (moderate profiling)
- **20 questions → T1 + T2 + T3** (current default experience)
- **25 questions → T1 + T2 + T3 + T4** (enhanced: existing questions + food detail + 2 new questions)
- **30 questions → T1 + T2 + T3 + T4 + T5** (full: all existing + 7 new questions)

For 25 and 30 question tiers, new optional depth questions are added (see Detailed Design §2).

### Tier Distribution Summary

| Tier | Count | Cumulative | Target | Match |
|------|-------|------------|--------|-------|
| T1 | 10 | 10 | 10 | Exact |
| T2 | 5 | 15 | 15 | Exact |
| T3 | 5 | 20 | 20 | Exact |
| T4 | 5 | 25 | 25 | Exact |
| T5 | 5 | 30 | 30 | Exact |

All five depth levels hit their target exactly. Zero tolerance violations.

## 2. Affected Components

### 2.1 trip_intake.html (Primary)

**New components:**
- **Depth selector screen** — a new transitional view between Step 1 and Step 2, implemented as a modal/overlay that appears after Step 1's "Continue" is clicked and validated. This avoids renumbering steps 2–7 and modifying the stepper. The selector uses the same visual language as the pace selector (pill cards in a row).

- **Question visibility system** — a `QUESTION_TIERS` map and `applyDepth(level)` function that shows/hides questions based on tier
- **Dynamic sub-step dots** — existing dot indicators recalculated to reflect only visible questions
- **New optional questions** (for T4/T5) — added to Steps 4, 5, and 6
- **Default value injection** — `generateMarkdown()` reads defaults for hidden questions
- **Context bar depth pill** — shows selected depth level
- **Depth change toast** — confirms selection

**Modified systems:**
- Navigation (goToStep) — skip steps with all questions hidden
- Progress bar calculation — based on active steps only
- Stepper rendering — hide steps with no visible questions
- `generateMarkdown()` — use defaults for hidden questions

### 2.2 trip_intake_rules.md

**New section:** "Question Inventory & Depth Tiers" documenting the complete tier assignment table and default values.

**Modified sections:**
- Wizard Flow preamble — mention depth selector
- Each step description — note which questions are T1/T2/T3/T4/T5
- Output Format — clarify that output is identical regardless of depth; new "Additional Preferences" subsection for T4/T5 fields

### 2.3 trip_intake_design.md

**New section:** "Depth Selector Overlay" component spec (layout, animations, responsive behavior).

**Modified sections:**
- Progress Stepper — dynamic step count behavior
- Top Progress Bar — dynamic percentage calculation
- Context Bar — new depth pill item type

## 3. Data Flow

```
User completes Step 1 → Depth selector overlay appears
    ↓
User selects depth (or accepts default 20)
    ↓
User clicks "Let's Go" to confirm
    ↓
applyDepth(level) called:
  1. Reads QUESTION_TIERS map
  2. For each question, if tier > depthTier → hide element, mark as skipped
  3. Recalculate active steps (steps with ≥1 visible question)
  4. Update stepper to show only active steps
  5. Update progress bar denominator
  6. Update sub-step dots for each quiz step
  7. Show toast confirmation
  8. Store depth in state variable (selectedDepth)
    ↓
User proceeds through wizard (only visible questions shown)
    ↓
generateMarkdown() called:
  For each output field:
    if question was answered → use answer
    else → use QUESTION_DEFAULTS[key]
    ↓
Output: identical llm_trip_details.md regardless of depth
  (T4/T5 fields go into "Additional Preferences" subsection)
```

### State Management

- `selectedDepth` — number (10/15/20/25/30), default 20
- `QUESTION_TIERS` — static map: question_key → tier (T1=1, T2=2, T3=3, T4=4, T5=5)
- `QUESTION_DEFAULTS` — static map: question_key → default_value
- `activeSteps` — computed array of step indices that have ≥1 visible question
- `userAnswers` — preserved in memory even when questions are hidden (for depth increase)

### Depth Change Mid-Wizard (REQ-001 AC-5)

When the user navigates back to the depth selector (via context bar pill) and changes depth:
1. `applyDepth(newLevel)` re-runs
2. Questions becoming visible get their default value (or previously saved answer if one exists)
3. Questions becoming hidden retain their answer in `userAnswers` (not lost)
4. Stepper/progress recalculate
5. User is returned to **the step they were on** (or the nearest active step if their current step was hidden by the depth decrease). Only sent to Step 2 if their current step index was before Step 2.

### Overlay Dismissal Behavior

- **"Let's Go" / "Update" button:** Confirms the selected depth, closes overlay, advances to Step 2 (initial entry) or returns to current step (re-entry from pill).
- **Escape key:** Closes the overlay **without** selecting a depth. Returns user to Step 1. The user must explicitly click "Let's Go" to proceed past the depth selector.
- **Re-entry from context bar pill:** Overlay opens with current depth pre-selected, confirm button label changes to `depth_update` i18n key (e.g., "Update"). On confirm, returns to the step the user was on.

## 4. Integration Points

| Integration | Impact |
|---|---|
| Pre-selection scoring (Step 2 quiz → Step 3 chips) | If Step 2 questions are hidden (depth 10 has only setting+culture), defaults still feed into scoring. The `applyQuizToChips()` function reads from answered OR defaulted values. |
| Avoid scoring (Step 4 quiz → avoid cards) | Same pattern: hidden quiz questions use defaults for scoring. |
| Food scoring (Step 5 quiz → food/vibe cards) | Same pattern. |
| Derived values (energy from pace, food from foodadventure) | These derivations still work since pace and foodadventure have defaults. |
| Context bar | New depth pill added alongside existing destination/dates/travelers pills. |
| i18n | 5 new depth option labels + toast messages added to TRANSLATIONS for all 12 languages. |
| Evening question | Removed from rendering (confirmed). Dead `q_evening*` translation keys cleaned up during implementation. Not in inventory. |

## 5. Impact on Existing Behavior

| Aspect | Before | After |
|---|---|---|
| Question count | Fixed ~23 | Variable: 10, 15, 20, 25, or 30 |
| Default depth (20) | N/A | Matches current experience exactly (20 questions at T1+T2+T3) |
| Step visibility | All 8 steps always visible | Steps with no visible questions auto-skipped in stepper |
| Progress bar | Fixed 8-step denominator | Dynamic denominator based on active steps |
| Sub-step dots | Fixed per quiz | Dynamic: hidden questions = fewer dots |
| Markdown output | From explicit answers | From answers + defaults (structurally identical, plus "Additional Preferences" subsection for T4/T5 fields) |
| Stepper | Fixed 8 circles | Dynamic: hidden steps collapsed, circles removed |
| Back navigation | Linear back | Back respects active steps, skipping hidden ones |

**Critical invariant:** A user selecting depth 20 MUST have an experience identical to today's wizard. The only addition is the depth selector overlay appearing once after Step 1.

## 6. BRD Coverage Matrix

| REQ | AC | Design Section | Component |
|---|---|---|---|
| REQ-001 | AC-1 | §2.1 Depth selector screen | Overlay with 5 pill cards |
| REQ-001 | AC-2 | DD §4 Component Spec | Labels: "Quick — 10", "Light — 15", "Standard — 20", "Detailed — 25", "Deep Dive — 30" |
| REQ-001 | AC-3 | §3 State Management | `selectedDepth` default = 20, pre-selected pill |
| REQ-001 | AC-4 | DD §4 Component Spec | Pill-style cards matching pace selector visual language |
| REQ-001 | AC-5 | §3 Depth Change Mid-Wizard | Back navigation to selector; re-apply logic; returns to current step |
| REQ-001 | AC-6 | §4 Integration Points | i18n keys for all 12 languages |
| REQ-001 | AC-7 | DD §4 Component Spec | ARIA roles, keyboard nav, focus management |
| REQ-002 | AC-1 | DD §2 Question Inventory | Full tier table |
| REQ-002 | AC-2 | DD §2 Question Inventory | Count verification: 10/15/20/25/30 all exact |
| REQ-002 | AC-3 | DD §2 Question Inventory | T1 includes setting, culture, interests, pace, reportLang + noise, foodadventure, diet, extraNotes, rhythm |
| REQ-002 | AC-4 | §1 Overview | Steps 0, 1, 7 always present, not counted |
| REQ-002 | AC-5 | §2.2 trip_intake_rules.md | New "Question Inventory" section |
| REQ-003 | AC-1 | §3 Data Flow | `applyDepth()` hides by tier |
| REQ-003 | AC-2 | §2.1 Dynamic sub-step dots | Dots recalculated |
| REQ-003 | AC-3 | §2.1 Stepper rendering | Active steps only |
| REQ-003 | AC-4 | §2.1 Progress bar | Dynamic denominator |
| REQ-003 | AC-5 | §5 Impact | Empty steps auto-skipped |
| REQ-003 | AC-6 | §3 Depth Change Mid-Wizard | Re-adapt on change; return to current step |
| REQ-003 | AC-7 | §2.1 Navigation | Auto-advance still works with reduced sets |
| REQ-004 | AC-1 | DD §3 Default Values Table | Every skippable question documented |
| REQ-004 | AC-2 | DD §3 Default Values Table | Middle/balanced defaults |
| REQ-004 | AC-3 | §3 Data Flow → generateMarkdown | Identical output |
| REQ-004 | AC-4 | §4 Integration Points | Scoring uses defaults |
| REQ-004 | AC-5 | §3 Data Flow | Review shows complete output |
| REQ-005 | AC-1 | §2.1 Context bar depth pill | Pill in context bar |
| REQ-005 | AC-2 | §2.1 Progress bar | Dynamic fill |
| REQ-005 | AC-3 | §5 Impact | Natural transition to Step 7 |
| REQ-005 | AC-4 | §2.1 Depth change toast | Toast confirmation |
