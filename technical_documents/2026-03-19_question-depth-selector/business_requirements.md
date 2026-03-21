# Business Requirements Document

**Change:** Question Depth Selector — User-Controlled Wizard Length
**Date:** 2026-03-19
**Author:** Product Manager
**Status:** Approved

---

## 1. Background & Motivation

The trip intake wizard currently has a fixed flow of 12 quiz questions (3 in Step 2, 4 in Step 4, 5 in Step 5) plus form fields, chip selections, and textareas. All users must answer the same number of questions regardless of how much time they want to invest.

Some users want a quick, streamlined experience and are happy with sensible defaults for most settings, while others want maximum customization. A one-size-fits-all approach forces casual users through unnecessary friction and doesn't reward detail-oriented users with additional depth.

By letting users choose their question depth upfront (10, 15, 20, 25, or 30 questions), we can adapt the wizard dynamically — shorter flows skip or combine less critical questions and rely on defaults, while longer flows unlock additional granularity. This improves completion rates for time-pressed users while giving power users the detail they want.

## 2. Scope

**In scope:**
- A new "Question Depth" selector UI component shown early in the wizard flow
- Definition of a question inventory with priority tiers that maps questions to each depth level
- Dynamic wizard adaptation: show/hide questions based on selected depth
- Sensible defaults for all skipped questions so the output remains complete
- i18n support for the new selector and any new/modified UI text
- Consistent `llm_trip_details.md` output regardless of depth chosen

**Out of scope:**
- Changing the existing question content or answer options themselves
- Removing or restructuring the current 8-step wizard architecture (steps remain, but some may be shortened or auto-completed)
- Modifying the output format consumed by the trip generation pipeline
- Adding new question topics beyond what currently exists (that would be a separate feature)
- Analytics or tracking of which depth level users choose

**Affected rule files:**
- `trip_intake_rules.md` — Wizard Flow section (all steps), Dynamic Interest Engine, Output Format
- `trip_intake_design.md` — New component spec for depth selector, step layout modifications

## 3. Requirements

### REQ-001: Question Depth Selector UI

**Description:** Present the user with a choice of 5 question depth levels (10, 15, 20, 25, 30) before they begin answering content questions. The selector should appear after Step 0 (Where & When) is completed and before Step 2 (Travel Style Questionnaire), since destination/dates/travelers are always required regardless of depth. The selector can be integrated into Step 0's flow (after the search bar is submitted) or as a transitional prompt between Step 1 and Step 2.

**Acceptance Criteria:**
- [ ] AC-1: A depth selector is displayed showing exactly 5 options: 10, 15, 20, 25, 30 questions
- [ ] AC-2: Each option includes a brief label conveying the trade-off (e.g., "Quick — 10 questions", "Standard — 20 questions", "Detailed — 30 questions")
- [ ] AC-3: A default option is pre-selected (20 questions — "Standard") so users can proceed without making an active choice
- [ ] AC-4: The selector uses visual card or pill-style UI consistent with the existing Booking.com design language
- [ ] AC-5: The user can change their depth selection by navigating back to the selector at any point before Step 7
- [ ] AC-6: The selector is fully translated for all 12 supported UI languages (i18n keys added to TRANSLATIONS)
- [ ] AC-7: The selector is accessible: keyboard-navigable, proper ARIA roles, focus management

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — new UI component
- `trip_intake_design.md` — component spec
- `trip_intake_rules.md` — wizard flow description

---

### REQ-002: Question Inventory with Priority Tiers

**Description:** Define a master inventory of all questions in the wizard (quiz questions, chip selections, textareas, form fields beyond the essential ones) with a priority tier for each. The priority determines which depth levels include the question. Essential items (destination, dates, travelers, review) are always present and do not count toward the question budget.

The tiering must ensure that:
- At 10 questions: only the highest-impact profiling questions are asked
- At 15 questions: adds moderate-impact questions
- At 20 questions: the current default experience (roughly equivalent to today's flow)
- At 25 questions: adds additional granularity questions
- At 30 questions: the full detailed experience with all available questions

**Acceptance Criteria:**
- [ ] AC-1: A documented question inventory exists mapping every question to a priority tier (T1 through T5, where T1 = always shown through 10-question flow, T5 = only in 30-question flow)
- [ ] AC-2: The total question count at each depth level matches the selected number (within +/- 1 tolerance to account for rounding)
- [ ] AC-3: Tier 1 (10 questions) includes at minimum: travel style questions (setting, culture, evening), interest chip selection, pace selection, and report language
- [ ] AC-4: Steps 0 (Where & When), 1 (Who's Traveling), and 7 (Review & Download) are always fully present regardless of depth — their fields do not count toward the question budget
- [ ] AC-5: The inventory is documented in `trip_intake_rules.md` for maintainability

**Priority:** Must-have

**Affected components:**
- `trip_intake_rules.md` — new Question Inventory section
- `trip_intake.html` — question visibility logic

---

### REQ-003: Dynamic Wizard Adaptation

**Description:** The wizard must dynamically show or hide questions, chip sections, and quiz sub-steps based on the selected depth level. Steps that have all their questions hidden should either be auto-skipped (progress bar jumps past them) or collapsed to show only their default state briefly. The stepper and progress bar must reflect the actual number of active steps.

**Acceptance Criteria:**
- [ ] AC-1: At each depth level, only questions at or above the corresponding tier are displayed
- [ ] AC-2: Quiz sub-step dot indicators reflect the actual number of visible questions (not the full set)
- [ ] AC-3: The progress stepper updates to reflect only active steps (skipped steps are hidden or marked complete automatically)
- [ ] AC-4: The top progress bar percentage calculation adjusts to the actual number of active steps
- [ ] AC-5: Step transitions remain smooth — no empty steps or visual glitches when questions are hidden
- [ ] AC-6: If the user changes depth selection (REQ-001 AC-5), the wizard re-adapts: newly visible questions appear with defaults, newly hidden questions retain their defaults
- [ ] AC-7: Auto-advancing quiz behavior still works correctly with reduced question sets

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — step rendering, progress bar, stepper logic
- `trip_intake_design.md` — stepper and progress bar specs for variable step counts

---

### REQ-004: Sensible Defaults for Skipped Questions

**Description:** Every question that can be skipped (tiers T2-T5) must have a defined default value. When a question is skipped due to depth selection, its default is used in the output markdown. Defaults must produce a reasonable, middle-ground trip profile — never extreme values.

**Acceptance Criteria:**
- [ ] AC-1: Every skippable question has a documented default value in the question inventory
- [ ] AC-2: Defaults use the "middle" or "balanced" option where applicable (e.g., "A Bit of Both" for setting, "Balanced" for pace, "Casual Restaurants" for dining style)
- [ ] AC-3: The generated `llm_trip_details.md` is structurally identical regardless of depth — all sections present, all fields populated (from answers or defaults)
- [ ] AC-4: The pre-selection scoring engine (interest/avoid chips) works correctly with default quiz answers for unanswered questions
- [ ] AC-5: The Review step (Step 7) preview shows the complete output including defaulted values, with no indication of which were defaults vs. explicit answers (the output is the same)

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — default value injection in markdown generation
- `trip_intake_rules.md` — default value documentation

---

### REQ-005: Depth Indicator and User Feedback

**Description:** Throughout the wizard, provide the user with context about their chosen depth — how many questions remain, which step they're on relative to their total. This maintains the Booking.com-style progressive disclosure feel and prevents users from feeling lost.

**Acceptance Criteria:**
- [ ] AC-1: The context bar (`.context-bar`) or progress stepper shows the selected depth level (e.g., a pill showing "15 questions")
- [ ] AC-2: The progress bar fill percentage accurately reflects completion relative to the selected depth
- [ ] AC-3: If the user selected a lower depth and finishes faster, the transition to Step 7 (Review) feels natural — no jarring jump
- [ ] AC-4: A toast notification confirms the depth selection (e.g., "Quick mode: 10 questions selected")

**Priority:** Should-have

**Affected components:**
- `trip_intake.html` — context bar, progress bar, toast
- `trip_intake_design.md` — context bar pill spec

---

## 4. Dependencies & Risks

| Dependency / Risk | Mitigation |
|---|---|
| Question priority assignment is subjective — wrong tiers could produce poor trip profiles at low depths | Use the current "default" answers as the baseline; validate that 10-question defaults produce a usable `llm_trip_details.md` by running it through the trip generation pipeline |
| Hiding questions mid-step may create confusing UX (e.g., Step 5 has only 2 of 5 food questions) | If a step has fewer than 2 visible questions, merge its content into the previous step or auto-skip entirely |
| Pre-selection scoring depends on quiz answers; skipped quizzes with defaults may produce bland chip selections | Ensure defaults still trigger meaningful pre-selections (test that interest chips are not empty at 10-question depth) |
| Changing depth mid-wizard could lose user answers if questions are hidden then re-shown | When depth increases and a previously-hidden question becomes visible, show it with the default value (not blank); when depth decreases, preserve the user's answer in memory in case they increase again |
| i18n complexity — 5 new labels x 12 languages | Follow existing i18n pattern; labels are short phrases, translation effort is minimal |
| Progress stepper design assumes 8 fixed steps | The stepper must become dynamic; design spec update required before implementation |

## 5. Acceptance Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| PM | Product Manager | 2026-03-19 | Approved |
