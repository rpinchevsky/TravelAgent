# Architecture Review

**Change:** Hotel/Car Multi-Select and Step Reorder
**Date:** 2026-03-29
**Reviewer:** Software Architect
**Documents Reviewed:** `high_level_design.md`, `detailed_design.md`, `ux_design.md`, `business_requirements.md`
**Verdict:** Approved with Changes

---

## 1. Review Summary

The HLD and DD present a well-scoped, minimally invasive design for converting two option grids (hotelType, carCategory) from single-select to multi-select and relocating the depth overlay trigger from Step 1 to Step 2. The design leverages the existing `data-multi-select` attribute as a behavioral discriminator, introduces only CSS-driven visual additions (checkmark badge, hint label), and confines all changes to a single file (`trip_intake.html`) plus documentation and i18n updates.

The overall approach is sound. The `data-multi-select` attribute pattern provides clean extensibility — any future option grid can become multi-select by adding a single attribute. The click handler branching is correct: multi-select grids get toggle behavior with early return, all other grids retain radio behavior unchanged. The depth overlay relocation is mechanically clean — three reference changes (intercept, confirm, escape/outside-click) correctly shift from Step 1 to Step 2.

Two minor issues require attention before implementation: (1) the `aria-label` on the multi-select option grids is hardcoded in English, which breaks accessibility for non-English UI languages, and (2) the Depth Selector Overlay section in `trip_intake_design.md` (line ~284-286) says the overlay is "shown after Step 1" and escape returns focus to "Step 1" — the DD mentions updating this, but the specific text references in the design spec update plan (DD §4.2) should also capture the Keyboard Navigation line at ~301 ("Escape: dismiss overlay, return to Step 1") and the Focus Management block at ~307-309 ("On escape: focus to Step 1 Continue button"). These are documentation completeness gaps, not code issues.

## 2. Architecture Principles Checklist

| Principle | Status | Notes |
|---|---|---|
| Content / presentation separation | Pass | Multi-select behavior is driven by the `data-multi-select` attribute on the `.option-grid` container. Content (card options, i18n keys) is unchanged. Visual indicators (checkmark badge, hint label) are CSS-only. The `generateMarkdown()` change reads DOM state, not hardcoded values. Adding/removing accommodation types requires no JS changes. |
| Easy to extend for new requirements | Pass | Adding multi-select to another option grid (e.g., a future carFuel multi-select) requires only: (1) add `data-multi-select` to the `.option-grid`, (2) add `aria-pressed` to cards, (3) add the hint div, (4) update `generateMarkdown()` to use `querySelectorAll`. The click handler, CSS, and reset logic require zero modification. |
| Consistent with existing patterns | Pass | The multi-select toggle follows the `.chip-toggle` precedent (toggle click, `aria-pressed`, no auto-advance). The checkmark badge adapts the interest card 22px badge to 20px for smaller option-grid cards. The hint label follows `.chip-section__desc` visual style. The `data-multi-select` attribute mirrors how `data-question-key` and `data-value` are used for behavioral scoping elsewhere. |
| No unnecessary coupling | Pass | The multi-select handler, depth overlay trigger, and `generateMarkdown()` are fully decoupled. The click handler detects multi-select via DOM ancestry (`card.closest('.option-grid[data-multi-select]')`), not by checking question keys or step numbers. The depth relocation only changes step index constants (`1` to `2`), not the overlay logic itself. The reset handler uses `hasAttribute('aria-pressed')` to distinguish multi-select cards, avoiding coupling to specific question keys. |
| Regeneration performance | Pass | All changes are in the intake wizard. Trip content generation, HTML rendering, and downstream pipeline are unaffected. No rebuild required for content changes. |

## 3. Feedback Items

### FB-1: `aria-label` on multi-select option grids is hardcoded English

**Severity:** Recommendation
**Affected document:** DD
**Section:** §1.2, §1.3
**Issue:** The DD specifies `aria-label="Accommodation Type"` and `aria-label="Car Category"` as static English strings on the `role="group"` containers. When the UI language is switched to Russian, Hebrew, Arabic, etc., screen readers will announce the group in English while all surrounding content is in the selected language. This violates the language consistency rule in `trip_intake_rules.md` ("Every screen the user sees during trip customization must display entirely in the selected UI language") and produces a poor assistive technology experience for non-English users.
**Suggestion:** Use `aria-labelledby` pointing to the existing `.field__label` element above each grid instead of `aria-label`. The label already has `data-i18n` and will be translated to the active language. This avoids adding a new i18n mechanism specifically for ARIA and reuses the existing translation infrastructure. Implementation: add an `id` attribute to each `.field__label` (e.g., `id="label-hotelType"`, `id="label-carCategory"`) and set `aria-labelledby="label-hotelType"` on the `.option-grid`. This is a one-line HTML change per grid.

---

### FB-2: Design spec update plan (DD §4.2) should capture all Depth Overlay references

**Severity:** Observation
**Affected document:** DD
**Section:** §4.2
**Issue:** The DD §4.2 lists the Depth Selector Overlay section (line ~284-315) as needing updates to change "shown after Step 1" to "shown after Step 2" and to update focus management. However, the Keyboard Navigation block at line ~301 explicitly says "Escape: dismiss overlay, return to Step 1" — this reference is not called out in the DD's update plan. Similarly, the Focus Management block at lines ~307-309 says "On escape: focus to Step 1 Continue button". While the DD §4.2 mentions updating "keyboard navigation section" generically, the specific line references should be enumerated to avoid an implementation miss during the doc update pass.
**Suggestion:** In DD §4.2, expand the Depth Selector Overlay row to explicitly list: (a) line ~286 description "shown after Step 1", (b) line ~301 Keyboard Navigation "Escape: dismiss overlay, return to Step 1", (c) line ~304 Focus Management "On escape: focus to Step 1 Continue button". All three must change "Step 1" to "Step 2".

---

### FB-3: Step 1 capture-phase handler retains a now-unnecessary code block

**Severity:** Observation
**Affected document:** DD
**Section:** §1.8
**Issue:** In the target state of §1.8, the Step 1 `if` block is retained with only the validation guard:
```javascript
if (e.target.closest('.btn-next') && currentStep === 1) {
    if (!validateStep1()) { e.stopImmediatePropagation(); return; }
    // Step 1 validation passed — let normal navigation proceed to Step 2
}
```
This block is functionally a no-op when validation passes — it enters the outer `if`, passes validation, executes a comment, and falls out. While this is harmless, it adds a DOM traversal (`e.target.closest('.btn-next')`) on every capture-phase click when `currentStep === 1`. The normal btn-next handler already validates Step 1 before navigating (the validation call is in the standard navigation flow). If Step 1 validation is already handled by the normal navigation handler, this capture-phase block is redundant.
**Suggestion:** Verify whether the normal btn-next click handler already calls `validateStep1()` before `goToStep(2)`. If it does, the Step 1 block in the capture-phase handler can be removed entirely, simplifying the code. If the normal handler does NOT validate, then the capture-phase block is necessary and should remain. The DD should clarify which is the case.

---

### FB-4: UX design approval sign-offs are still pending

**Severity:** Observation
**Affected document:** UX Design (`ux_design.md`)
**Section:** §13
**Issue:** The UX design document shows "Pending" for both PM and Dev Team Lead sign-offs. The conditions listed (dev confirmation of `data-multi-select` feasibility, PM confirmation of hint text wording) are addressed in the DD but not formally signed off. This is a process gap, not a code issue — the design is technically sound.
**Suggestion:** Resolve the UX sign-off conditions before implementation begins: (1) Dev team confirms `data-multi-select` approach is feasible (DD §1.4 demonstrates it), (2) PM confirms "Select one or more" hint text (i18n key `s6_multiselect_hint`). Update `ux_design.md` §13 accordingly.

---

## 4. Best Practice Recommendations

1. **Test multi-select with assistive technology.** While the `aria-pressed` pattern is correct and consistent with `.chip-toggle`, the combination of `role="group"` + `role="button"` + `aria-pressed` on option-grid cards is a new ARIA pattern in this codebase. Verify with at least one screen reader (VoiceOver or NVDA) that the toggle state announcements ("pressed" / "not pressed") work correctly when multiple cards are selected.

2. **Verify downstream markdown parsing.** The BRD §4 calls out that `trip_planning_rules.md` consumers parse the accommodation type and car category fields. While the pipeline treats these as pass-through strings, confirm that no downstream logic splits on specific delimiters or expects single values. A quick grep for `Accommodation type` and `Car category` in the rule files and generation code will confirm.

3. **Consider adding `data-multi-select` to the design spec component definition.** The DD §4.2 plans to update the Option Grid section in `trip_intake_design.md`, but the update description is generic. The component spec should formally document the `data-multi-select` attribute as an opt-in behavioral modifier, the `.option-grid__hint` element, and the `.option-grid__check` pseudo-element — making the pattern discoverable for future developers.

4. **Depth overlay integration test priority.** The step reorder changes the overlay's position in the wizard flow. The highest-risk scenario is the depth pill re-entry from Step 3+ after the reorder. Ensure automation tests cover: (a) initial overlay from Step 2, (b) re-entry from Step 3 via pill, (c) escape from initial overlay returning to Step 2, (d) backward navigation Step 3 -> Step 2 (no overlay).

## 5. Sign-off

| Role | Date | Verdict |
|---|---|---|
| Software Architect | 2026-03-29 | Approved with Changes |

**Conditions for approval (if "Approved with Changes"):**
- [ ] FB-1: Replace `aria-label` with `aria-labelledby` referencing the translated `.field__label` on both multi-select option grids (hotelType and carCategory)
