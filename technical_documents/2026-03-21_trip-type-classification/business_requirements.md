# Business Requirements Document

**Change:** Trip Type Classification & Type-Aware Question Bank
**Date:** 2026-03-21
**Author:** Product Manager
**Status:** Approved

---

## 1. Background & Motivation

The current intake wizard treats all trips identically: it asks the same 30 questions (tiered T1-T5) regardless of whether the travelers are a solo backpacker, a romantic couple, a young-adults group, a family with toddlers, or a multi-generational party. This produces suboptimal results:

- A solo traveler is asked about group splitting and kids' food preferences.
- A couple is asked about child-friendly dining style but never about romantic occasions.
- A multi-generational family misses accessibility and energy-management questions critical for seniors traveling with small children.
- The question depth selector (10-30) draws from a single pool, so adding more depth doesn't add *relevant* depth — it adds generic depth.

By auto-detecting the **trip type** from traveler composition (Step 1) and filtering questions from a larger, categorized bank (~70 questions), the wizard can ask fewer but more relevant questions, improving both UX and trip quality.

## 2. Scope

**In scope:**
- Trip type auto-detection logic based on traveler composition after Step 1
- Six trip types: Solo, Couple/Romantic, Young, Adults, Family, Multi-generational
- Expanded question bank (~70 questions) organized into 8 categories (A-H)
- Per-question "Applies To" mapping to trip types
- Question filtering: depth selector (10-30) draws from the type-filtered pool
- Family trip special logic: balance kids' fun vs. common interests based on age proportions
- Pre-selection scoring on Steps 3-5 factors in trip type
- Trip type displayed in the context bar (pill) and included in generated markdown output
- Preservation of all existing 30 questions (T1-T5) within the new bank
- UI indicator showing detected trip type after Step 1

**Out of scope:**
- Changes to Step 0 (destination/dates) or Step 7 (review/download)
- Changes to the bridge server or trip generation pipeline
- Destination-specific question logic (questions remain destination-agnostic)
- Changes to the output markdown structure beyond adding the trip type field
- Changes to the calendar, autocomplete, or traveler card field set
- Rewriting the trip planning rules engine (downstream consumers adapt to the new field but planning logic changes are minimal)

**Affected rule files:**
- `trip_intake_rules.md` — Wizard Flow (new detection step between Step 1 and depth selector), Question Inventory & Depth Tiers (expanded bank, new tier/category system), Dynamic Interest Engine (type-aware pool filtering), Output Format (new trip type field)
- `trip_intake_design.md` — Step 1 post-completion UI (trip type indicator), Depth Selector Overlay (updated to show type-filtered question count), Context Bar (new trip type pill), Step 2 questionnaire (variable question set)
- `trip_planning_rules.md` — Pre-Flight Setup (read trip type from input file), Strategic Planning Logic (use trip type to weight interest hierarchy, pace defaults, culinary emphasis)

## 3. Requirements

### REQ-001: Trip Type Detection Logic

**Description:** After the user completes Step 1 (all traveler cards filled with name + birth year), the system must automatically classify the trip into exactly one of six types based on traveler composition. Ages are calculated relative to the arrival date from Step 0.

Detection rules (evaluated in priority order — first match wins):
1. **Solo** — exactly 1 adult (18+), 0 children
2. **Couple/Romantic** — exactly 2 adults (18+), 0 children
3. **Young** — all travelers are adults aged 18-30, 0 children
4. **Multi-generational** — at least one senior (65+) AND at least one child (0-17)
5. **Family** — at least one adult AND at least one child, no seniors 65+
6. **Adults** — all travelers are 18+, 0 children (catch-all for groups not matching Solo/Couple/Young)

**Acceptance Criteria:**
- [ ] AC-1: Given 1 adult aged 25, 0 children, the system detects "Solo"
- [ ] AC-2: Given 2 adults aged 30 and 28, 0 children, the system detects "Couple"
- [ ] AC-3: Given 3 adults all aged 18-30, 0 children, the system detects "Young"
- [ ] AC-4: Given 2 adults aged 35 and 33, 1 child aged 5, the system detects "Family"
- [ ] AC-5: Given 2 adults aged 68 and 65, 1 adult aged 35, 1 child aged 8, the system detects "Multi-generational"
- [ ] AC-6: Given 4 adults aged 40-55, 0 children, the system detects "Adults"
- [ ] AC-7: Given 2 adults aged 28 and 29, 0 children, the system detects "Young" (not Couple, since Young is higher priority and all are 18-30) — **Clarification: Couple takes priority over Young (2 adults, 0 kids matches Couple first)**
- [ ] AC-8: Detection re-evaluates when travelers are added/removed on Step 1
- [ ] AC-9: Detection uses age at arrival date (not current date)
- [ ] AC-10: Given 1 adult aged 70, 0 children, the system detects "Solo" (Solo overrides Adults even with senior)

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — new `detectTripType()` function
- `trip_intake_rules.md` — new section "Trip Type Detection"

---

### REQ-002: Trip Type UI Indicator

**Description:** After trip type is detected, the user must see a visual indicator of the detected trip type. This appears as: (a) a brief, non-blocking announcement after Step 1 completion (e.g., toast notification or inline banner), and (b) a persistent pill in the context bar for the remainder of the wizard.

**Acceptance Criteria:**
- [ ] AC-1: After completing Step 1 with valid travelers, a trip type indicator is displayed (toast or inline banner)
- [ ] AC-2: The context bar shows a trip type pill with an appropriate icon and the type name
- [ ] AC-3: The trip type pill updates if the user navigates back to Step 1 and changes travelers
- [ ] AC-4: The trip type indicator is translated via i18n for all 12 supported languages
- [ ] AC-5: The trip type pill is tappable and navigates back to Step 1 (consistent with other context bar pills)
- [ ] AC-6: RTL layout correctly positions and displays the trip type pill

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — context bar update, toast/banner rendering
- `trip_intake_design.md` — new context bar pill spec (color, icon, position)
- `trip_intake_rules.md` — context bar section update

---

### REQ-003: Expanded Question Bank (~70 Questions, 8 Categories)

**Description:** The question bank must be expanded from the current 30 questions (T1-T5) to approximately 70 questions organized into 8 categories. All existing 30 questions are preserved and categorized. Approximately 40 new questions are added across the categories.

Categories:
- A. Pace & Energy (7 questions, 3 new)
- B. Budget & Logistics (7 questions, 4 new)
- C. Culture & Sightseeing (8 questions, 4 new)
- D. Food & Dining (13 questions, 7 new)
- E. Social & Group Dynamics (8 questions, 4 new)
- F. Nightlife & Evening (6 questions, 3 new)
- G. Activities & Adventure (14 questions, 7 new)
- H. Special & Occasion-Based (7 questions, all new)

Each question must have:
- A unique key (existing keys preserved, new keys follow naming convention)
- Category assignment (A-H)
- "Applies To" list of trip types (subset of the 6 types)
- Tier assignment (T1-T5) for depth ordering within the filtered set
- 3-4 answer options with a balanced default
- Scoring tags for pre-selection mapping (Steps 3-5)

**Acceptance Criteria:**
- [ ] AC-1: The question bank contains between 65 and 75 questions total
- [ ] AC-2: All 30 existing questions (T1-T5) are present with their original keys and answer options preserved
- [ ] AC-3: Each question has a valid category (A-H), "Applies To" list, and tier (T1-T5)
- [ ] AC-4: Every trip type has at least 15 questions that apply to it
- [ ] AC-5: Category H (Special & Occasion-Based) contains at least 7 questions, all new
- [ ] AC-6: New questions follow the same 3-4 option format as existing questions
- [ ] AC-7: The `QUESTION_DEFAULTS` constant includes defaults for all new questions

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — expanded question data structure, new question slides
- `trip_intake_rules.md` — Question Inventory section rewrite, new category/type mapping tables

---

### REQ-004: Type-Aware Question Filtering

**Description:** When the user enters Step 2, only questions whose "Applies To" list includes the detected trip type are eligible. The depth selector (10-30) then selects from this filtered pool, respecting tier priority (T1 first, then T2, etc.). If the filtered pool has fewer questions than the selected depth, all available questions are shown.

**Acceptance Criteria:**
- [ ] AC-1: A Solo trip at depth 20 shows only questions where "Applies To" includes Solo
- [ ] AC-2: A Family trip at depth 20 shows only questions where "Applies To" includes Family
- [ ] AC-3: Questions not applicable to the detected trip type are never shown in Step 2
- [ ] AC-4: Hidden (non-applicable) questions use their default values in the generated markdown
- [ ] AC-5: The depth selector overlay displays the number of available questions for the detected trip type (e.g., "Up to 45 questions available for Family trips")
- [ ] AC-6: If the filtered pool has fewer questions than the selected depth, the system shows all available questions without error
- [ ] AC-7: Tier ordering is preserved: T1 questions appear before T2, T2 before T3, etc.
- [ ] AC-8: Sub-step dots in Step 2 reflect the actual number of visible questions after filtering
- [ ] AC-9: Changing trip type (by editing travelers in Step 1) resets Step 2 question selection

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — `getVisibleQuestions()` function update, depth selector UI update
- `trip_intake_rules.md` — Question Depth Tiers section, Step 2 description

---

### REQ-005: Family Trip Balancing Logic

**Description:** For Family trip types, the system must analyze the proportion of children's ages to determine how to balance "kids' fun" questions vs. "common/adult interest" questions. A family with mostly teenagers needs different questions than a family with toddlers.

Balancing factors:
- Ratio of children to adults
- Age distribution of children (toddler 0-3, preschool 4-7, school-age 8-12, teen 13-17)
- Proportion of "kids' fun" questions increases with more/younger children
- Proportion of "common interest" questions increases with older children/teens

**Acceptance Criteria:**
- [ ] AC-1: A family with 2 adults and 1 toddler (age 2) sees more kid-safety and energy-management questions than a family with 2 adults and 1 teen (age 15)
- [ ] AC-2: A family with 2 adults, 1 toddler, and 1 teen sees a balanced mix of both kid-fun and common-interest questions
- [ ] AC-3: The balancing logic is applied within the Family trip type's filtered question pool (not across all questions)
- [ ] AC-4: The generated markdown includes a "Family balance" indicator (e.g., "kid-focused" / "balanced" / "teen-friendly") in the trip type section

**Priority:** Should-have

**Affected components:**
- `trip_intake.html` — `balanceFamilyQuestions()` function
- `trip_intake_rules.md` — new "Family Trip Balancing" subsection
- `trip_planning_rules.md` — Age-Appropriate Filter may read the family balance indicator

---

### REQ-006: Type-Aware Pre-Selection Scoring (Steps 3-5)

**Description:** The pre-selection scoring on Steps 3 (Interests), 4 (Avoids), and 5 (Food & Dining) must factor in the detected trip type in addition to Step 2 questionnaire answers. Trip type influences which cards are pre-selected and how scores are weighted.

Examples:
- Solo → pre-select safety-related avoids, social-comfort interests
- Couple → pre-select romantic experiences, couples-focused dining vibes
- Multi-generational → pre-select accessibility-friendly interests, avoid high-energy activities
- Young → pre-select nightlife, adventure activities

**Acceptance Criteria:**
- [ ] AC-1: Cards on Steps 3-5 receive a scoring bonus/penalty based on trip type
- [ ] AC-2: A Couple trip pre-selects at least 2 romantic-tagged interest cards that would not be pre-selected for an Adults trip with the same questionnaire answers
- [ ] AC-3: A Multi-generational trip pre-selects at least 1 accessibility-related avoid card
- [ ] AC-4: A Solo trip pre-selects at least 1 safety/social-comfort interest card
- [ ] AC-5: Pre-selection still respects the ~8-15 chip target range
- [ ] AC-6: The existing `analyzeGroup()` profile flags continue to work alongside trip type scoring

**Priority:** Should-have

**Affected components:**
- `trip_intake.html` — scoring functions for interest/avoid/food cards
- `trip_intake_rules.md` — Answer -> Pre-selection Mapping section update

---

### REQ-007: Trip Type in Generated Markdown Output

**Description:** The generated markdown (downloaded in Step 7) must include the detected trip type as a new field so the trip generation pipeline can use it for planning decisions.

New field location: in the `## Trip Context` section, after Departure.

Format:
```
- **Trip Type:** {Solo|Couple|Young|Adults|Family|Multi-generational}
```

For Family trips with balancing (REQ-005), an additional sub-field:
```
- **Family Balance:** {kid-focused|balanced|teen-friendly}
```

**Acceptance Criteria:**
- [ ] AC-1: The generated markdown contains a `Trip Type` field with one of the 6 valid values
- [ ] AC-2: The trip type field appears in the `## Trip Context` section
- [ ] AC-3: Family trips include the `Family Balance` sub-field
- [ ] AC-4: Non-family trips do not include the `Family Balance` field
- [ ] AC-5: The trip type value is always in English regardless of UI or report language (consistent with other identifiers)
- [ ] AC-6: The preview in Step 7 shows the trip type field

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — `generateMarkdown()` function
- `trip_intake_rules.md` — Output Format section
- `trip_planning_rules.md` — Pre-Flight Setup (read trip type from file)

---

### REQ-008: Trip Planning Pipeline Reads Trip Type

**Description:** The trip planning rules must be updated so the pipeline reads and uses the `Trip Type` field from the input file. The trip type informs: interest hierarchy weighting, pace defaults, culinary emphasis, and activity selection bias.

**Acceptance Criteria:**
- [ ] AC-1: `trip_planning_rules.md` Pre-Flight Setup lists "Trip Type" as a required field to read
- [ ] AC-2: The Interest Hierarchy section describes how trip type affects priority weighting (e.g., Couple trips weight romantic POIs higher)
- [ ] AC-3: The Age-Appropriate Filter section references trip type for Solo/Young safety considerations
- [ ] AC-4: The Culinary Selection section references trip type for dining style defaults (e.g., Couple → upscale bias, Young → street food/casual bias)
- [ ] AC-5: Backward compatibility: if `Trip Type` field is missing from the input file, the pipeline falls back to inferring type from traveler composition (same detection logic)

**Priority:** Should-have

**Affected components:**
- `trip_planning_rules.md` — Pre-Flight Setup, Interest Hierarchy, Age-Appropriate Filter, Culinary Selection

---

### REQ-009: Depth Selector Adaptation for Trip Types

**Description:** The depth selector overlay (shown after Step 1) must adapt to the detected trip type. It should display the available question count for the detected type and adjust the depth options if the filtered pool is smaller than 30.

**Acceptance Criteria:**
- [ ] AC-1: The depth selector overlay shows the detected trip type name (e.g., "Customized for your Couple trip")
- [ ] AC-2: Each depth card shows the actual number of questions that will be shown (capped by available pool)
- [ ] AC-3: If the filtered pool has only 25 questions, depth options 30 are disabled or show "25 (max)"
- [ ] AC-4: The "Recommended" badge adjusts if the standard depth (20) exceeds the available pool
- [ ] AC-5: Depth selector text is translated via i18n for all 12 languages
- [ ] AC-6: Keyboard navigation continues to work correctly with adapted depth cards

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — depth selector overlay rendering
- `trip_intake_design.md` — Depth Selector Overlay section update
- `trip_intake_rules.md` — Question Depth Selector section update

---

### REQ-010: Category-Specific Question Organization

**Description:** Questions in Step 2 should be presented in a logical order following their category grouping (A through H), not scattered randomly. Within each category, tier order (T1 first) is respected. Category transitions may optionally show a subtle category header or visual separator.

**Acceptance Criteria:**
- [ ] AC-1: Questions within the same category are grouped together in Step 2 presentation order
- [ ] AC-2: Categories appear in A-H alphabetical order
- [ ] AC-3: Within a category, lower-tier questions appear before higher-tier questions
- [ ] AC-4: The ordering is consistent across all trip types (only the set of visible questions changes, not the relative order)

**Priority:** Nice-to-have

**Affected components:**
- `trip_intake.html` — question ordering logic in Step 2
- `trip_intake_rules.md` — Question Inventory section

---

## 4. Dependencies & Risks

| Dependency / Risk | Mitigation |
|---|---|
| Expanding from 30 to ~70 questions significantly increases the HTML file size and may impact page load time | Questions are data-driven (JS objects), not individual DOM elements pre-rendered. Only the current question is rendered at a time. Lazy-build slides on demand. |
| Couple vs. Young ambiguity: 2 adults aged 18-30 could match both Couple and Young | Priority order in detection logic resolves this deterministically. Couple (2 adults, 0 kids) is checked before Young (all 18-30). Document edge case clearly. |
| Multi-generational detection relies on the 65+ threshold, which is culturally arbitrary | Make the senior age threshold configurable via a constant (default 65). Document the rationale. |
| Family balancing logic (REQ-005) adds complexity and may produce unexpected question sets | Implement as a secondary sort/weight within the Family pool, not as a separate filtering step. Validate with test cases for common family compositions. |
| Backward compatibility: existing trip_details.md files lack the Trip Type field | Trip planning rules fall back to inferring type from traveler data if the field is missing (REQ-008 AC-5). |
| i18n: 6 new trip type names must be translated into 12 languages | Use the existing TRANSLATIONS infrastructure. Trip type names are short single words — low translation burden. |
| New questions (~40) need i18n translations for titles and descriptions across 12 languages | Prioritize en/ru/he translations (fully supported). Other 9 languages fall back to English via existing `t()` fallback mechanism. |
| The existing pre-selection mapping (§Answer -> Pre-selection Mapping) may conflict with type-aware scoring | Type-aware scoring is additive (bonus/penalty), not a replacement. Existing answer-based scoring remains the primary driver. |
| Depth selector may confuse users if max available is below 30 for their trip type | Show clear messaging: "N questions available for your trip type" and disable/grey out unreachable depth levels. |
| Changing travelers after Step 2 (going back to Step 1) invalidates the filtered question set | Reset rule already exists (leaving Step 2 clears selections). Extend to also rebuild the question set from the new trip type. |

## 5. Acceptance Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| PM | Product Manager | 2026-03-21 | Approved |
