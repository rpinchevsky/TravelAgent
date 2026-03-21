# Architecture Review

**Change:** Question Depth Selector — User-Controlled Wizard Length
**Date:** 2026-03-19
**Reviewer:** Software Architect
**Documents Reviewed:** high_level_design.md (revised), detailed_design.md (revised)
**Verdict:** Approved

---

## 1. Review Summary

The revised HLD and DD resolve all three blocking items from the initial review. The tier redistribution produces exact counts at every depth level (10/15/20/25/30 with zero tolerance violations). The evening question ambiguity is resolved with explicit verification against the codebase. The T4/T5 output field placement is well-specified as an additive "Additional Preferences" subsection that does not conflict with the BRD's out-of-scope constraint on modifying the existing output format.

The design is architecturally sound and ready for implementation.

## 2. Architecture Principles Checklist

| Principle | Status | Notes |
|---|---|---|
| Content / presentation separation | Pass | Tier assignments and defaults are in static data maps (`QUESTION_TIERS`, `QUESTION_DEFAULTS`), separate from rendering logic. Adding a new question requires adding one entry to each map — no UI code changes needed for tier reassignment. |
| Easy to extend for new requirements | Pass | Adding a new question = one row in the tier table + one default entry + the HTML slide. Changing tier assignments = editing the map. Adding a 6th depth level = adding one entry to `DEPTH_LEVELS`. The pattern is straightforward. |
| Consistent with existing patterns | Pass | The overlay follows the same modal/overlay pattern used by the search bar dropdowns. Pill-card selection matches the pace selector. Toast and context bar pill follow existing component patterns. i18n uses the established `data-i18n` + `TRANSLATIONS` pattern. |
| No unnecessary coupling | Pass | The depth system is layered correctly: data layer (tiers/defaults) → adaptation layer (`applyDepth`) → UI layer (stepper/progress/dots). `generateMarkdown()` uses a simple fallback pattern (`userAnswers[key] ?? QUESTION_DEFAULTS[key]`) that does not depend on depth state. |
| Regeneration performance | Pass | Not directly applicable (this is a client-side UI change, not a content generation change). The markdown output is structurally identical regardless of depth, so downstream trip generation is unaffected. |

## 3. Blocking Item Resolution

### FB-1: Depth 20 shows 23 questions (RESOLVED)

**Original issue:** T1+T2+T3 = 23 questions, but the selector labels the option as "20."

**Resolution:** Dev moved `foodExperience`, `diningVibe`, `foodNotes` from T3 to T4. These three food detail items (post-quiz cards/textarea in Step 5) are not core profiling questions — they are enhancement-level detail that fits naturally at depth 25+. This also moved `snacking` and `photography` from T4 to T5 to maintain even distribution.

**Verification:** Counted each tier from DD §2 Final Tier Table:
- T1: rhythm, setting, culture, interests, noise, foodadventure, pace, diet, reportLang, extraNotes = **10**
- T2: budget, flexibility, customInterests, avoidChips, customAvoid = **5** (cumulative 15)
- T3: diningstyle, kidsfood, mealpriority, localfood, poiLangs = **5** (cumulative 20)
- T4: foodExperience, diningVibe, foodNotes, transport, morningPreference = **5** (cumulative 25)
- T5: snacking, photography, visitDuration, shopping, accessibility = **5** (cumulative 30)

All five depth levels hit their target exactly. Zero tolerance violations. **Accepted.**

---

### FB-2: The `evening` question ambiguity (RESOLVED)

**Original issue:** Unclear whether `evening` is still rendered as a quiz slide in Step 2.

**Resolution:** Dev verified `trip_intake.html` line 1864 — the evening question slide is replaced by an HTML comment. Step 2 has 2 sub-dots and 2 question slides (setting, culture). The inventory explicitly excludes `evening`. Dead `q_evening*` translation keys remain and are slated for cleanup in implementation Phase 7.

**Verification:** The DD now states this unambiguously in the "SA Feedback Addressed" section, in §2 heading note, and in the HLD §1 "Evening question status" paragraph. No room for implementation confusion. **Accepted.**

---

### FB-4: New T4/T5 output fields scope conflict (RESOLVED)

**Original issue:** DD said "Add new T4/T5 fields to markdown output" but BRD said modifying the output format is out of scope.

**Resolution:** Dev defined an "Additional Preferences" subsection (DD §5.3) that is appended after the existing "Additional Notes" section. This is additive — no existing output sections are modified. The trip generation pipeline ignores unknown sections, so no pipeline changes are needed. A follow-up change (separate BRD) will teach the pipeline to consume these fields. Existing T4 fields (foodExperience, diningVibe, foodNotes) continue in their current Culinary Profile location when answered and are omitted when defaulted to empty.

**Verification:** The exact markdown placement is specified in DD §5.3. The scope resolution explanation is clear and the additive approach avoids the BRD conflict. **Accepted.**

## 4. Recommendation Resolution

### FB-3: Step merging rules underspecified (ADDRESSED)

Dev added DD §8 "Step Merging Rules" with:
- Merging threshold: exactly 1 visible question
- Merge scenarios table by depth (diet merges into Step 4 at depth 10 and 15)
- DOM relocation method (appendChild + visual separator)
- Stepper behavior for merged steps

This is a complete specification. No ad-hoc decisions needed during implementation.

### FB-5: Escape key behavior (ADDRESSED)

Escape now closes the overlay and returns to Step 1 without selecting a depth. Only "Let's Go" confirms and advances. Documented in HLD §3 "Overlay Dismissal Behavior" and DD §4 "Keyboard Navigation."

### FB-8: Re-entry from context bar pill (ADDRESSED)

DD §4 "Re-entry Behavior" specifies: same animation, current depth pre-selected, "Update" button label via `depth_update` i18n key, returns to user's current step on confirm, returns to current step on Escape (no changes applied).

## 5. Best Practice Recommendations

(Carried forward from initial review — still applicable for implementation)

1. **Test depth 10 end-to-end first.** The 10-question path has the most aggressive defaults and the most step-skipping (including diet merge into Step 4). Generate `llm_trip_details.md` at depth 10 and run it through the trip generation pipeline to verify the output produces a usable itinerary.

2. **Preserve backward compatibility for depth 20.** Add an integration test that captures the current wizard output (all questions answered with defaults) and asserts that depth-20 output is byte-identical. This prevents regressions as the tier system is built.

3. **Consider storing depth selection in localStorage.** Returning users may want the same depth they chose last time. A simple `localStorage('tripIntakeDepth')` read on page load, with the default fallback to 20, improves repeat-user experience at zero cost.

4. **Keep the `QUESTION_TIERS` and `QUESTION_DEFAULTS` maps adjacent in code.** They are conceptually coupled (every tiered question needs a default). Co-locating them makes maintenance easier and reduces the risk of adding a tier entry without a matching default.

5. **Document the tier reassignment process.** When future questions are added, developers need to know how to assign a tier. Add a brief comment in the code above `QUESTION_TIERS` explaining the tier criteria (T1 = core profiling, T2 = moderate impact, T3 = current default, T4 = enhanced detail, T5 = deep dive only).

## 6. Sign-off

| Role | Date | Verdict |
|---|---|---|
| Software Architect | 2026-03-19 | Approved with Changes |
| Software Architect (re-review) | 2026-03-19 | **Approved** |

All three blocking conditions from the initial review have been resolved:
- [x] FB-1: Depth-20 count mismatch — resolved, all tiers hit exact targets (10/15/20/25/30)
- [x] FB-2: Evening question ambiguity — resolved, confirmed removed, explicitly excluded from inventory
- [x] FB-4: T4/T5 output field scope conflict — resolved, additive "Additional Preferences" subsection specified
