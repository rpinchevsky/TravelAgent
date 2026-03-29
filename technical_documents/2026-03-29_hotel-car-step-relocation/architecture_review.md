# Architecture Review

**Change:** Relocate Hotel & Car Rental Assistance to a New Dedicated Step 2
**Date:** 2026-03-29
**Reviewer:** Software Architect
**Documents Reviewed:** `high_level_design.md` (HLD), `detailed_design.md` (DD)
**Verdict:** Approved with Changes

---

## 1. Review Summary

This is a well-scoped relocation and renumbering change with no new components, no new interaction patterns, and no structural impact on the rendering pipeline or markdown output format. The HLD correctly identifies all affected integration points, and the DD provides precise, line-referenced modification instructions for every touchpoint. The i18n key strategy (feature-scoped keys for hotel/car remain unchanged, step-scoped keys renumber) is pragmatic and minimizes risk. The design faithfully implements the UX spec's placement, layout, depth overlay sequencing, and navigation flow.

Two items require attention before implementation: an ambiguity in the depth overlay navigation sequence between the BRD and UX spec, and a missing verification step for the `generateMarkdown()` output format conditional note's code-level reference. Neither is blocking, but both should be resolved to prevent subtle navigation or documentation bugs.

## 2. Architecture Principles Checklist

| Principle | Status | Notes |
|---|---|---|
| Content / presentation separation | Pass | Hotel/car components use ID-based selectors and feature-scoped i18n keys (`s6_hotel_*`, `s6_car_*`). Relocating them to a different step container does not require any CSS, i18n, or JS behavior changes. Content is fully decoupled from step position. |
| Easy to extend for new requirements | Pass | The wizard step architecture is array-driven (`activeSteps`, `stepEmojis`, `totalSteps`). Adding a 10th step in the future would follow the same insertion + renumbering pattern. The DD's systematic approach (explicit renumbering tables, checklist) is replicable. |
| Consistent with existing patterns | Pass | New Step 2 uses the same `<section class="step">` + `.step__title` + `.step__desc` + `.btn-bar` pattern as all other steps. The stepper entry follows the same circle/emoji/label structure. No deviations from established conventions. |
| No unnecessary coupling | Pass | Hotel/car JS handlers use `toggleKey`/`bodyId` element IDs, not step numbers. `generateMarkdown()` uses IDs and `data-question-key` selectors. The only step-number coupling is in navigation logic (correctly updated in DD) and comments (cosmetic). |
| Regeneration performance | Pass | No impact on the trip rendering pipeline. This change is confined to the intake wizard (`trip_intake.html`). No CSS changes, no new classes, no rendering-config updates needed. |
| UX compliance | Pass | DD faithfully implements UX spec: Step 2 placement, hotel-first/car-second ordering, no validation gate, depth overlay fires on leaving Step 1, navigation sequence matches UX Section 6 flow detail, stepper responsive analysis acknowledged. |

## 3. Feedback Items

### FB-1: Depth Overlay Navigation Sequence — BRD/UX Ambiguity on Advance Target

**Severity:** Recommendation
**Affected document:** DD
**Section:** SS1.10 (Change 3 — Depth overlay confirm: advance target)

**Issue:** The BRD (REQ-008 AC-1) states: "Clicking Continue on Step 1 triggers the depth selector overlay (before proceeding to Step 3)." The parenthetical "before proceeding to Step 3" could be read as implying post-overlay advance goes directly to Step 3, skipping Step 2. However, the UX spec (Section 6, flow detail) clearly states: "Wizard advances to Step 2 (not Step 3)." The DD correctly follows the UX spec — `activeSteps.find(s => s > 1)` returns 2 — but the BRD parenthetical is misleading.

Additionally, REQ-008 AC-6 states the forward sequence is "0->1->depth->2->3->4->5->6->7->8", which confirms Step 2 follows depth selection. The BRD AC-1 parenthetical is simply imprecise wording, not an actual conflict.

**Suggestion:** Add a note in the DD (Section 1.10, Change 3) explicitly calling out this BRD wording discrepancy and confirming that the UX spec takes precedence: depth overlay confirm advances to Step 2, not Step 3. This prevents future implementors from misreading AC-1 and re-routing to Step 3. Optionally, request PM to amend the BRD AC-1 wording from "before proceeding to Step 3" to "before proceeding to Step 2 and then Step 3."

---

### FB-2: Output Format Conditional Note — Code-Level Verification Needed

**Severity:** Observation
**Affected document:** DD
**Section:** SS2 (Markdown Format Specification)

**Issue:** The DD states "No changes to the markdown format" and correctly identifies that `generateMarkdown()` uses element IDs. However, the `trip_intake_rules.md` output format contains the conditional note: _"they appear only when the corresponding toggle is set to Yes in Step 6."_ The DD (Section 1.16, Change 11) correctly updates this rule text to reference "Step 2." But the DD does not explicitly verify whether `generateMarkdown()` has any comments or string literals referencing "Step 6" that should also be updated for documentary consistency.

**Suggestion:** Add a verification item to the DD implementation checklist (Section 5, Phase 2): "Audit `generateMarkdown()` for comments referencing Step 6 and update to Step 2 where they refer to hotel/car logic."

---

### FB-3: i18n Key Renumbering — Execution Order Risk in Locale Files

**Severity:** Recommendation
**Affected document:** DD
**Section:** SS1.15 (locales/ui_*.json — New i18n Keys)

**Issue:** The key renumbering (s2->s3, s3->s4, ..., s7->s8) must be performed in reverse order (s7->s8 first, then s6->s7, ..., then s2->s3) to avoid key collisions during the rename. If done in forward order, renaming `s2_title` to `s3_title` would overwrite the existing `s3_title` value before it has been renamed to `s4_title`. The DD lists the renames in forward order without specifying execution order.

**Suggestion:** Add an explicit note in DD Section 1.15 stating: "Renaming must be performed in reverse order (s7->s8 first, working backward to s2->s3) to prevent key value collisions. Alternatively, perform the rename in a single atomic operation (read all values, write new keys, delete old keys)."

---

### FB-4: Step 2 Visibility in Step Visibility Rules

**Severity:** Observation
**Affected document:** DD
**Section:** SS1.16 (Change 9 and Change 12)

**Issue:** The current `trip_intake_rules.md` Step Visibility Rules list Steps 0, 1, 3, 4, 5, 6, 7 as always visible, with Step 2 conditionally visible based on depth. DD Change 12 updates this to "Steps 0, 1, 2, 3, 4, 5, 6, 7, 8." This is correct — Step 2 (hotel/car logistics) is always visible since it is a supplementary step, not depth-gated. The old conditional rule ("Step 2 visibility depends on depth") must be rewritten to reference Step 3, which DD Change 9 handles. This is correctly designed; noting it as an observation for verification that both changes are applied together.

**Suggestion:** None — just a verification note. Ensure the Step Visibility Rules section clearly states Step 2 is always visible AND Step 3 is conditionally visible based on depth.

---

### FB-5: Stepper Overflow at 9 Steps on 320px Viewports

**Severity:** Observation
**Affected document:** HLD
**Section:** SS5 (Impact on Existing Behavior)

**Issue:** The UX spec (Section 7) acknowledges that at 320px viewports, "the stepper may be tight but functional" and relies on the existing `overflow-x: auto` CSS. The DD does not mention any verification step for narrow viewport stepper rendering. While this is within the UX spec's acceptance criteria (functional, not necessarily spacious), implementors should verify during Phase 6 testing.

**Suggestion:** Add a verification item to DD Section 5, Phase 6: "Verify stepper renders without overlap or truncation at 320px viewport width. Confirm `overflow-x: auto` provides horizontal scrollability if circles overflow."

---

### FB-6: POM Method Rename — Callers Must Be Updated

**Severity:** Observation
**Affected document:** DD
**Section:** SS1.18 (Change 4 and Change 5)

**Issue:** The DD renames `skipStep2SubSteps()` to `skipStep3SubSteps()` in the POM. Any test spec that calls `skipStep2SubSteps()` directly (not just through `navigateToStep()`) must also be updated. Section 1.19 lists all affected spec files but does not explicitly mention this method rename as a search target across specs.

**Suggestion:** Add a note in DD Section 1.19: "Search all spec files for calls to `skipStep2SubSteps()` and update to `skipStep3SubSteps()`." This is likely already handled by `navigateToStep()` internally, but an explicit search prevents missed direct calls.

---

## 4. Best Practice Recommendations

1. **Atomic i18n key migration:** When renaming step-scoped i18n keys across 12 locale files, use a script or perform the rename in reverse order to prevent key collisions. Consider writing a small shell script that performs the rename atomically for all 12 files to reduce human error.

2. **Regression test execution order:** After implementation, run the intake automation tests in this order: (a) structure tests (step count, step elements), (b) navigation tests (forward/backward/depth overlay), (c) hotel/car functional tests, (d) i18n tests. This prioritizes detecting step-numbering errors early, which are the root cause of most potential failures.

3. **Comment hygiene:** The DD correctly updates code comments (e.g., "Step 2 sub-dots" -> "Step 3 sub-dots"). During implementation, do a sweep for any remaining comments referencing old step numbers in `trip_intake.html` beyond those explicitly listed. A simple search for "Step 2", "Step 3", etc. in HTML comments and JS comments will catch any stragglers.

4. **Feature-scoped vs. step-scoped key convention:** The decision to keep `s6_hotel_*` and `s6_car_*` keys unchanged is correct and sets a good precedent. Consider documenting this convention explicitly in the i18n section of `trip_intake_rules.md`: "i18n keys for section-specific content (hotel, car, wheelchair) use feature-scoped naming (`s6_hotel_*`) and do not rename when sections are relocated. Only step titles, descriptions, and navigation buttons use step-scoped naming (`sN_title`, `sN_desc`)."

## 5. Sign-off

| Role | Date | Verdict |
|---|---|---|
| Software Architect | 2026-03-29 | Approved with Changes |

**Conditions for approval (if "Approved with Changes"):**
- [ ] FB-1: Add clarifying note in DD Section 1.10 about BRD AC-1 wording discrepancy (depth overlay advances to Step 2, per UX spec)
- [ ] FB-3: Add execution order note for i18n key renumbering in DD Section 1.15 (reverse order or atomic operation)
