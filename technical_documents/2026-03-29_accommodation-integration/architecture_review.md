# Architecture Review

**Change:** Accommodation Integration — Hotel Discovery & Booking Referral Cards
**Date:** 2026-03-29
**Reviewer:** Software Architect
**Documents Reviewed:** high_level_design.md, detailed_design.md
**Verdict:** Approved

---

## 1. Review Summary

The HLD and DD present a well-structured design that extends the existing trip generation pipeline with accommodation discovery and booking referral capabilities. The architecture follows established patterns (Google Places enrichment, parallel subagent generation, fragment-based HTML rendering) and demonstrates strong traceability to all 11 BRD requirements with a complete acceptance-criterion mapping.

The design correctly identifies stay blocks as a first-class concept separate from days, uses the existing MCP tool infrastructure for hotel discovery, and introduces a new `.accommodation-card` component that is properly decoupled from `.poi-card`. The POI Parity Check exclusion mechanism is sound — using the `### 🏨` emoji prefix as a discriminator is consistent with the existing pattern where `### 🛒` and `### 🎯` are POI types identified by heading emoji.

Several items require attention before implementation, including a placement ordering inconsistency between the DD and existing content format rules, a missing update to the `content_format_rules.md` note that currently states accommodation preferences are unconsumed, and a Booking.com URL encoding edge case. None are architectural blockers — all are fixable without redesign.

## 2. Architecture Principles Checklist

| Principle | Status | Notes |
|---|---|---|
| Content / presentation separation | Pass | Accommodation cards are defined as markdown (content) with a separate HTML rendering mapping (presentation). Content changes (new hotel, different description) require no HTML rendering logic changes — only re-rendering through the existing pipeline. The `### 🏨` heading serves as the content-layer contract for the presentation layer. |
| Easy to extend for new requirements | Pass | The `stays[]` array in the manifest naturally supports multi-stay trips. Adding a new provider (e.g., Airbnb) would require only a new deep link constructor and a `discovery_source` value — no structural changes to cards, manifest, or rendering. The preference-to-search mapping table is extensible. |
| Consistent with existing patterns | Pass (with caveats — see FB-1) | Card structure mirrors `.poi-card` (tag, rating, name, links, pro-tip). Discovery follows the Layer 2 Google Places enrichment pattern. Graceful degradation matches POI enrichment behavior. The subagent delegation model is consistent with Phase B day generation. The section placement order has a minor inconsistency noted in FB-1. |
| No unnecessary coupling | Pass | `.accommodation-card` is fully independent of `.poi-card` — different CSS class hierarchy, different emoji prefix, excluded from POI parity counts, separate POM locators. Budget integration is additive (new row in existing table). Manifest extension uses a new top-level key, not nesting inside `languages`. |
| Regeneration performance | Pass | Content-only accommodation edits (e.g., replacing a hotel option) only regenerate the anchor day file, which triggers incremental HTML rebuild of that single day fragment. Non-anchor days are unaffected. The manifest `anchor_day` reference enables targeted regeneration without scanning all day files. |

## 3. Feedback Items

### FB-1: Section Placement Contradicts Existing Per-Day File Format
**Severity:** Blocking
**Affected document:** DD
**Section:** §1.2 — Accommodation Card Template, "Section placement order"
**Issue:** The DD specifies the accommodation section (`## 🏨`) should be placed **after** Plan B (`### 🅱️`) at position 7, with the daily budget table at position 3. However, the existing `content_format_rules.md` Per-Day File Format defines the section order as: (1) header + schedule, (2) POI cards, (3) daily budget table, (4) grocery store, (5) along-the-way stops, (6) Plan B. The DD's proposed placement puts the `## 🏨` section after Plan B, which means it appears after the daily budget table — but the budget table on the anchor day is supposed to include an accommodation line item. This creates a reading order problem: the user sees the accommodation cost in the budget table before seeing the accommodation options themselves.

Additionally, the accommodation section uses `## 🏨` (h2 level), which is a higher heading level than the surrounding `###` sections (h3). Placing a `## 🏨` heading after `### 🅱️` and `### 🛒` creates a non-standard heading hierarchy where an h2 appears inside what logically feels like a sub-section zone.

**Suggestion:** Move the accommodation section to immediately **before** the daily budget table (position 3 in the existing order). This way: (1) header + schedule, (2) POI cards, (3) **Accommodation section (## 🏨)** on anchor days, (4) daily budget table (which now naturally follows the accommodation it references), (5) grocery store, (6) along-the-way stops, (7) Plan B. This ordering ensures the reader encounters accommodation options before seeing their cost in the budget, and the h2 heading sits in a more natural position as a major section divider between POIs and operational/logistics sections.

---

### FB-2: Stale Note in `content_format_rules.md` Must Be Updated
**Severity:** Blocking
**Affected document:** DD
**Section:** §1.2 (omission)
**Issue:** The existing `content_format_rules.md` line 106 contains this note under "Generation Context per Day":

> *"Note: The trip details file may contain optional `## Hotel Assistance` and `## Car Rental Assistance` sections at the end. These sections carry structured accommodation and vehicle preferences. The trip generation pipeline does not currently consume these sections (future enhancement). Their presence does not affect existing generation behavior."*

This note explicitly tells the pipeline to ignore `## Hotel Assistance`. If this note is not updated as part of the accommodation integration, the content generation subagents will read this instruction and skip preference consumption, defeating REQ-006. The DD's file change list does not mention updating or removing this note.

**Suggestion:** Add an explicit entry in DD §1.2 to update this note. The revised note should state that `## Hotel Assistance` is now consumed by the accommodation discovery logic on anchor days, while `## Car Rental Assistance` remains a future enhancement.

---

### FB-3: Booking.com URL Encoding — Hotel Names with Special Characters
**Severity:** Recommendation
**Affected document:** DD
**Section:** §2.2 — Booking.com Deep Link Construction Algorithm
**Issue:** The DD specifies URL encoding with "spaces become `+`, special characters percent-encoded." However, hotel names in Budapest (and other destinations) frequently contain characters like accented letters (e.g., "Három Gúnár"), ampersands (e.g., "K+K Hotel Opera"), apostrophes, and parentheses. The Booking.com `ss=` parameter uses a free-text search box, which is forgiving of encoding, but the DD does not specify which encoding standard to use (RFC 3986 percent-encoding vs. `application/x-www-form-urlencoded`).

The worked example uses `+` for spaces (`Meininger+Hotel+Budapest`), which is the `application/x-www-form-urlencoded` convention. This should be explicitly stated as the encoding standard to ensure consistency. Additionally, the DD should note that Hungarian characters (á, é, ö, ü, etc.) should be percent-encoded rather than passed as raw UTF-8 in the URL, as browser behavior varies.

**Suggestion:** Add a short encoding specification note to §2.2: "Use `application/x-www-form-urlencoded` encoding for the `ss=` parameter: spaces become `+`, non-ASCII characters and reserved characters (`&`, `=`, `+`, etc.) are percent-encoded as `%XX`. Example: `K%2BK+Hotel+Opera` for the hotel name `K+K Hotel Opera`."

---

### FB-4: Missing `accommodation-section` and `accommodation-card` in development_rules.md §1 HTML Generation Contract
**Severity:** Recommendation
**Affected document:** DD
**Section:** §1.5 (omission from TripPage.ts locator table in development_rules.md)
**Issue:** `development_rules.md` §1 maintains a table of "Current structural requirements derived from TripPage.ts" that maps locators to required HTML elements. This table drives the Generation Checklist used by HTML rendering subagents. The DD adds locators to `TripPage.ts` but does not include an entry for updating the `development_rules.md` §1 table with the new accommodation locators (`.accommodation-section`, `.accommodation-card`, `.accommodation-card__rating`, `.booking-cta`).

If the table is not updated, rendering subagents that consult `development_rules.md` as part of their prompt contract will not know they must generate `.accommodation-card` elements — they only see the existing `.poi-card` contract.

**Suggestion:** Add `development_rules.md` §1 to the file change list in DD §4, with an explicit entry to extend the TripPage.ts structural requirements table with accommodation locators.

---

### FB-5: Hardcoded Amber Color Value in CSS vs. Design Token
**Severity:** Recommendation
**Affected document:** DD
**Section:** §1.4 — CSS styles
**Issue:** The `.accommodation-card__tag` background color uses the literal value `rgba(201, 151, 43, 0.12)` instead of deriving from the `--color-brand-accent` CSS variable. The `--color-brand-accent` is `#C9972B` in light mode and `#D4A83A` in dark mode. The hardcoded rgba value corresponds to the light-mode value only. In dark mode, the tag background will not adjust, creating a subtle visual inconsistency.

**Suggestion:** Use `color-mix()` or define a new token `--color-brand-accent-bg: rgba(var(--color-brand-accent-rgb), 0.12)` with an RGB intermediate variable, or simply define `.accommodation-card__tag { background-color }` separately in the `@media (prefers-color-scheme: dark)` block with the dark-mode-appropriate tint.

---

### FB-6: Accommodation Section Placement Inside `#day-N` Scope for Test Locators
**Severity:** Observation
**Affected document:** DD
**Section:** §1.5 — TripPage.ts helper `getDayAccommodationSection`
**Issue:** The helper `getDayAccommodationSection(dayNumber)` uses the locator `#day-${dayNumber} .accommodation-section`. This assumes that `.accommodation-section` is rendered **inside** the `<div class="day-card" id="day-N">` wrapper for the anchor day. The DD's HTML fragment example (§3.3) shows the accommodation section as part of the day fragment content, which confirms this. However, the `## 🏨` heading is an h2-level heading — the same level as the day's own `## Day N` title. The markdown-to-HTML mapping must ensure the `## 🏨` section is rendered inside the existing `#day-N` div, not as a sibling of it (which would happen if the rendering engine starts a new section at every `##` heading).

The HLD §4.4 and DD §3.1 do specify the mapping (`## 🏨` → `<div class="accommodation-section">` inside the day fragment), so this is correctly handled in the design. This observation is simply a note that rendering subagent prompts should emphasize that `## 🏨` within a day file does NOT start a new `#day-N` sibling section — it is a child section within the existing day fragment.

**Suggestion:** Add a brief note in the rendering-config.md accommodation section or in the DD's markdown-to-HTML mapping (§3.1) clarifying: "`## 🏨` within a day file is rendered as a `<div class="accommodation-section">` inside the parent `<div class="day-card" id="day-N">`, not as a new top-level section. The h2 heading is semantic within the day context only."

---

### FB-7: `accommodation.stays[]` — Consider Adding `nights` Field
**Severity:** Observation
**Affected document:** DD
**Section:** §1.2 — manifest.json accommodation schema
**Issue:** The `stays[]` schema includes `checkin` and `checkout` dates, from which the number of nights can be calculated. However, several consumers (budget calculation, anchor day intro line, Booking.com link description) need the night count explicitly. Calculating it each time from date strings introduces a minor risk of off-by-one errors (e.g., are the dates inclusive/exclusive?).

**Suggestion:** Consider adding a `nights` integer field to each stay object as a convenience field: `"nights": 11`. This is redundant with `checkout - checkin` but eliminates ambiguity and simplifies consumption. If not added, at minimum document the calculation rule: "nights = checkout_date - checkin_date in days."

---

### FB-8: `content_format_rules.md` Note About `## Hotel Assistance` Consumption Scope
**Severity:** Observation
**Affected document:** DD
**Section:** §1.1 — trip_planning_rules.md, Accommodation Discovery step 1
**Issue:** The DD specifies that "the subagent generating an anchor day's file" parses the `## Hotel Assistance` section. In the existing Phase B architecture, each day subagent receives only: (1) the trip details file, (2) `overview_LANG.md`, and (3) the current day's row from the Phase A table. The trip details file is already part of the standard subagent context, so parsing `## Hotel Assistance` from it requires no change to the subagent prompt contract.

This is correctly aligned with the existing design — no change needed. This observation simply confirms that the `## Hotel Assistance` section is accessible to the anchor day subagent without any contract modification, since it is part of the trip details file that every subagent already receives.

**Suggestion:** None required — this is confirmed as architecturally sound.

## 4. Best Practice Recommendations

1. **Implementation ordering:** Implement rule file changes (Phase 1 in DD §5) before any trip generation, since the rules drive subagent behavior. Pay special attention to updating the `content_format_rules.md` note about `## Hotel Assistance` consumption (FB-2) — this is the gating instruction that subagents read.

2. **Dark mode testing:** After implementing CSS changes, verify the accommodation card appearance in both light and dark modes. The `--color-brand-accent` variable correctly adjusts between modes (`#C9972B` light, `#D4A83A` dark), but the hardcoded rgba value in `.accommodation-card__tag` (FB-5) will not. Include a dark-mode visual spot-check in the Phase 4 verification.

3. **Multi-stay trip validation:** While the BRD §4 notes that MVP assumes single-base trips, the architecture correctly supports multi-stay via `stays[]`. When implementing, add a simple guard: if multiple stay blocks are detected but the feature is not yet mature, log a warning but proceed with each block independently. This prevents silent failures when the first multi-stay trip is generated.

4. **Booking.com link validation:** The Booking.com deep links are the primary user conversion path. Consider adding a URL structure assertion to the regression test spec that validates the link contains all expected query parameters (`ss`, `checkin`, `checkout`, `group_adults`, `group_children`, one or more `age`) without asserting on specific values. This ensures the link construction algorithm is not accidentally broken during future refactoring.

5. **Incremental edit of accommodation:** When a user requests replacing a specific hotel option, the incremental edit pipeline (edit anchor day → re-assemble → rebuild HTML → validate) handles this correctly. However, if the user changes the stay block dates (e.g., extending the trip by a day), the manifest `accommodation.stays[]` must also be updated. Document this edge case in the implementation notes: date changes to the overview require re-running Phase A stay block identification and potentially re-generating the anchor day.

6. **Agent Prompt Contract extension:** The DD correctly identifies that TripPage.ts locators and rendering-config.md are already part of the mandatory Agent Prompt Contract (items 1-2 of 9). The new accommodation component specs in rendering-config.md will automatically be included. Ensure that the accommodation section in rendering-config.md is placed in a location that is reliably included when the file is loaded — not in an appendix that might be truncated.

## 5. Sign-off

| Role | Date | Verdict |
|---|---|---|
| Software Architect | 2026-03-29 | Approved with Changes |
| Software Architect | 2026-03-28 | **Approved** (re-review) |

**Conditions for approval (convert to "Approved"):**
- [x] FB-1 resolved: Accommodation section placement order updated so the `## 🏨` section appears before the daily budget table, not after Plan B
- [x] FB-2 resolved: DD explicitly includes updating the `content_format_rules.md` note (line 106) to reflect that `## Hotel Assistance` is now consumed by the accommodation discovery pipeline

---

## 6. Re-Review — Blocking Items & Recommendations Verification

**Re-review date:** 2026-03-28
**Trigger:** Dev team revised DD to address SA feedback from initial review.
**New verdict:** **Approved** — both blocking items resolved, all actionable recommendations incorporated.

### Blocking Items

| ID | Status | Verification |
|---|---|---|
| FB-1 | **Resolved** | DD §1.2 now specifies accommodation section at position 3 (after POI cards, before daily budget table). The placement order is: (1) header + schedule, (2) POI cards, (3) Accommodation section `## 🏨`, (4) Daily budget table, (5) Grocery store, (6) Along-the-way stops, (7) Plan B. Rationale explicitly states the reader encounters accommodation options before seeing their cost in the budget. |
| FB-2 | **Resolved** | DD §1.2 now includes an explicit "Update Generation Context per Day note" entry with the full replacement text. The revised note states that `## Hotel Assistance` **is consumed** by the accommodation discovery logic on anchor days, while `## Car Rental Assistance` remains a future enhancement. The file change table (§4) also lists this update. |

### Recommendations

| ID | Status | Verification |
|---|---|---|
| FB-3 | **Incorporated** | DD §2.2 now specifies `application/x-www-form-urlencoded` as the encoding standard for the `ss=` parameter, with explicit rules for spaces (`+`), non-ASCII characters, and reserved characters. Includes the `K%2BK+Hotel+Opera` example. |
| FB-4 | **Incorporated** | New DD §1.7 adds all accommodation locators (`.accommodation-section`, `.accommodation-card`, `.accommodation-card__rating`, `.accommodation-card__name`, `.accommodation-card__link`, `.accommodation-card__price-level`, `.booking-cta`) to the `development_rules.md` §1 structural requirements table. Listed in the §4 file change table. |
| FB-5 | **Incorporated** | DD §1.4 CSS now includes a `@media (prefers-color-scheme: dark)` block for `.accommodation-card__tag` using `rgba(212, 168, 58, 0.15)` — derived from the dark-mode accent `#D4A83A`. Light mode retains the original `rgba(201, 151, 43, 0.12)`. |
| FB-7 | **Incorporated** | Manifest schema in DD §1.2 now includes `"nights": 11` as an integer convenience field with documentation: "Eliminates ambiguity and off-by-one risks for consumers (budget calculation, anchor day intro line, Booking.com link description)." |

### Items Not Requiring Changes (confirmed unchanged)

| ID | Status | Notes |
|---|---|---|
| FB-6 | **Observation — no action required** | DD §3.1 and §3.3 continue to correctly show `## 🏨` rendered inside `#day-N` scope. The rendering-config.md spec (§1.3) clarifies the `.accommodation-section` is a child of the day fragment. |
| FB-8 | **Observation — no action required** | Confirmed that `## Hotel Assistance` is part of the trip details file already provided to all subagents. No contract modification needed. |

### Conclusion

The revised DD addresses all feedback comprehensively. The design is ready for implementation.
