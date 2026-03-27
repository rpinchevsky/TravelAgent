# Architecture Review

**Change:** Google Places MCP Integration — POI Enrichment, Phone/Rating Fields, Wheelchair Accessibility Question
**Date:** 2026-03-23
**Reviewer:** Software Architect
**Documents Reviewed:** high_level_design.md, detailed_design.md
**Verdict:** Approved with Changes

---

## 1. Review Summary

The HLD and DD present a well-structured, additive change that integrates Google Places as a second-layer enrichment source, adds phone/rating fields to POI cards, and introduces a mandatory wheelchair accessibility question in the trip intake wizard. The overall design is sound: it follows established patterns, maintains backward compatibility, and properly separates content from presentation.

However, there are two blocking issues and several recommendations. The blocking items involve (1) an inconsistency in the DD regarding the placement of Photography/Accessibility questions relative to the wheelchair question (the DD references them as "Step 2" components but the rules file lists them under Step 6, creating confusion about what pattern is actually being reused), and (2) the absence of i18n keys for the new POI field labels (`poi_phone`, `poi_rating`, accessibility indicator label) despite the HLD mentioning them in section 4.4. These are straightforward to fix and do not require redesign.

## 2. Architecture Principles Checklist

| Principle | Status | Notes |
|---|---|---|
| Content / presentation separation | Pass | Phone, rating, and accessibility are defined as markdown-level content fields (content_format_rules.md) that are independently parsed into HTML components (rendering-config.md). Content can be regenerated without touching rendering rules, and vice versa. |
| Easy to extend for new requirements | Pass | Adding a future field (e.g., "opening hours badge") would follow the identical pattern: add a markdown line format, add a rendering-config component spec, add CSS class, add test locator. The two-layer data source hierarchy also extends naturally to other APIs. |
| Consistent with existing patterns | Pass (with caveats) | Phone link reuses `.poi-card__link` CSS class and the existing link row pattern. Rating introduces a new `.poi-card__rating` class following the existing `__tag`/`__name` BEM convention. Wheelchair question reuses `.depth-extra-question` + `.q-card` patterns. See FB-1 for a caveat on pattern reference accuracy. |
| No unnecessary coupling | Pass | MCP configuration is isolated to `.mcp.json`. The pipeline degrades gracefully if Google Places is unavailable. The wheelchair question is decoupled from the existing T5 accessibility question. Intake output format changes are backward-compatible (default to "no"). |
| Regeneration performance | Pass | Phone/rating are content-level fields in day markdown files. Adding or changing them triggers only the affected day's regeneration and incremental HTML rebuild. No full rebuild required for content-only changes. |

## 3. Feedback Items

### FB-1: Photography/Accessibility Question Location Mismatch
**Severity:** Blocking
**Affected document:** DD
**Section:** §1.6 (trip_intake.html)

**Issue:** The DD states the wheelchair question "uses the same `.depth-extra-question` pattern used for Photography (T4) and Accessibility (T5) in Step 2, but is placed directly in the Step 6 HTML as a supplementary always-visible field" (§4.3 in HLD). However, Photography and Accessibility are NOT `.depth-extra-question` elements in the current codebase — they are `question-slide` elements within the Step 2 one-by-one questionnaire (data-qindex 24 and 29, respectively). The `.depth-extra-question` CSS class exists in the stylesheet but has no corresponding DOM elements in the current HTML.

Meanwhile, `trip_intake_rules.md` lists Photography and Accessibility under the Step 6 table, which is a documentation artifact from a previous design iteration — they actually live in Step 2.

This mismatch creates ambiguity about what "same pattern" means. The wheelchair question is NOT reusing an existing active pattern — it is the first actual usage of `.depth-extra-question` in the DOM.

**Suggestion:** Clarify in the DD that `.depth-extra-question` is a prepared-but-unused CSS pattern and the wheelchair question is its first actual DOM usage. Remove the misleading reference to Photography/Accessibility as `.depth-extra-question` precedents. Also update `trip_intake_rules.md` Step 6 table to remove Photography (T4) and Accessibility (T5), since they are Step 2 question slides, not Step 6 supplementary fields. Alternatively, if the intent is to move Photography/Accessibility to Step 6 as `.depth-extra-question` elements (outside the Step 2 questionnaire), that is a separate change and should be called out as out of scope.

### FB-2: Missing POI Field Label i18n Keys in DD
**Severity:** Blocking
**Affected document:** DD
**Section:** §1.9 (locales/ui_*.json)

**Issue:** The HLD §4.4 mentions two POI field label i18n keys: `poi_phone` and `poi_rating`. However, the DD §1.9 only specifies the 5 wheelchair question keys (`s6_wheelchair`, `s6_wheelchair_no`, `s6_wheelchair_no_desc`, `s6_wheelchair_yes`, `s6_wheelchair_yes_desc`). The POI field label keys are not defined anywhere in the DD — no English values, no Russian/Hebrew translations, and no mention in the locale file update section.

These labels are needed for the phone link label (e.g., "Phone" / "Телефон" / "טלפון") and rating label (e.g., "reviews" / "отзывов" / "ביקורות") in the markdown format (§2.1, §2.2) and HTML rendering (§3.2). Additionally, the wheelchair accessibility indicator label (`♿ Wheelchair accessible` / `♿ Доступно для колясок`) needs an i18n key for the markdown format (§2.3).

**Suggestion:** Add the following i18n keys to §1.9 with translations for en/ru/he and English fallback for the other 9 locales:
- `poi_phone` — "Phone" / "Телефон" / "טלפון"
- `poi_rating_reviews` — "reviews" / "отзывов" / "ביקורות"
- `poi_wheelchair_accessible` — "Wheelchair accessible" / "Доступно для колясок" / "נגיש לכיסאות גלגלים"

Note: These are not intake UI keys (the intake page does not render POI cards). They are content-generation labels consumed by Phase B subagents when writing day markdown files. The DD should clarify whether these are locale file keys or inline constants in the rule files. Given the existing pattern where POI content is written in the report language (not UI language), these labels may be better served as inline examples in `content_format_rules.md` rather than locale file keys. The DD should state this decision explicitly.

### FB-3: Rating Placement — Visual Flow Concern
**Severity:** Recommendation
**Affected document:** DD
**Section:** §3.1 (Rating Display Component)

**Issue:** The DD places `.poi-card__rating` between `.poi-card__tag` and `<h3 class="poi-card__name">` in the HTML structure. This means the visual flow is: Tag → Rating → Name. In the existing card layout, the flow is Tag → Name, with the tag serving as a category label and the name as the primary identifier. Inserting the rating between them separates the tag from the name with a secondary data point, which may feel visually disjointed — especially on narrow mobile screens where inline-flex elements wrap.

The BRD (REQ-005 AC-2) says "near the POI card name (e.g., after `<h3 class="poi-card__name">` or below the tag)" — notably suggesting after the name as the primary example.

**Suggestion:** Consider placing the rating AFTER `<h3 class="poi-card__name">` instead of before it. This keeps the Tag → Name hierarchy intact and appends the rating as supplementary metadata. The visual order would be: Tag → Name → Rating. CSS can keep it visually subtle (smaller font, gold color). This matches common patterns in review sites (name first, stars underneath). If the current placement is intentional for scan-ability reasons, document the rationale.

### FB-4: `tel:` href Sanitization — Edge Cases
**Severity:** Recommendation
**Affected document:** DD
**Section:** §3.2 (Phone Link Component)

**Issue:** The DD specifies that the `href` should strip "non-digit characters (except `+`)" from the phone number: `+36 1 338 2122` becomes `tel:+3613382122`. This is correct for well-formatted international numbers, but Google Places sometimes returns phone numbers with parentheses, dots, or extensions (e.g., `+36 (1) 338-2122 ext. 100`). The regex in the test spec (`/^tel:\+?[\d\s\-()]+$/`) accounts for some of these but the rendering spec does not.

**Suggestion:** Explicitly define the sanitization rule to handle edge cases: strip all characters except digits and leading `+`. Note that extensions should be dropped (they are not supported in `tel:` URIs). This is a minor implementation detail but worth codifying to prevent inconsistencies across render subagents.

### FB-5: Intake Test Spec Uses `toContainText('Wheelchair accessible')`
**Severity:** Recommendation
**Affected document:** DD
**Section:** §1.13 (intake-wheelchair.spec.ts)

**Issue:** The third test in the wheelchair intake spec asserts `await expect(preview).toContainText('Wheelchair accessible')`. This is an English-language string assertion, which violates the language-independence rule established in `automation_rules.md`. The generated markdown uses the report language (which could be Russian, Hebrew, etc.), so the preview text might be `Доступность для колясок` or similar.

**Suggestion:** Assert structurally instead of by text content. For example, assert that the preview contains the markdown field key pattern `**Wheelchair accessible:**` (which is always in English in the Additional Preferences section of the output format — see trip_intake_rules.md Output Rules: "The generated markdown output always uses English names"). Actually, re-reading the output format spec, the field keys ARE in English regardless of report language (`- **Wheelchair accessible:** yes`). If this is indeed the case, the assertion is valid but the DD should explicitly note why this specific text assertion is acceptable despite the language-independence rule — because markdown field keys are always English.

### FB-6: MCP Server Package Name Uncertainty
**Severity:** Observation
**Affected document:** DD
**Section:** §1.1 (.mcp.json)

**Issue:** The DD acknowledges that the package name `@anthropic/google-places-mcp-server` "may differ based on what is available at implementation time" and offers a fallback of creating a "minimal wrapper." This is reasonable, but the `.mcp.json` configuration is the only new file being created, and if the package does not exist, the fallback creates significant unplanned work (building a custom MCP server).

**Suggestion:** During implementation Phase 1, verify the MCP server package early and document the actual package name. If no suitable package exists, escalate to the user before proceeding — creating a custom MCP server should be a conscious scope decision, not a silent fallback.

### FB-7: Backward Compatibility of `wheelchair accessible` Field — Pipeline Behavior
**Severity:** Observation
**Affected document:** HLD
**Section:** §5 (Impact on Existing Behavior)

**Issue:** The HLD states that "existing trip details files without the new field default to 'no' (no wheelchair requirement)." This is correct for the planning pipeline. However, neither the HLD nor DD specifies WHERE this default is enforced. Is it in `trip_planning_rules.md` (as a textual instruction to the LLM), or is it hardcoded in `trip_intake.html`'s `generateMarkdown()`, or both?

**Suggestion:** Add a sentence to the DD §1.2 (trip_planning_rules.md additions) explicitly stating: "If the trip details file does not contain a `Wheelchair accessible` field, treat as `wheelchair accessible: no`." This makes the default explicit in the planning rules where the pipeline reads the trip details.

## 4. Best Practice Recommendations

1. **Test the "no Google Places" path.** Since Google Places is a second-layer enrichment source and the pipeline must degrade gracefully, ensure that at least one end-to-end scenario validates trip generation WITHOUT the MCP server configured. This confirms that phone/rating/accessibility fields are simply omitted and no errors occur.

2. **CSS variable reuse.** The new `.poi-card__rating` style uses `var(--color-brand-accent)` for the gold color. Verify this variable exists in the current CSS and is appropriate in both light and dark themes. If the variable does not exist, it needs to be added to the design tokens.

3. **Review count formatting.** The DD specifies "locale-appropriate number formatting (e.g., comma separators)" for review counts. Since the rendering pipeline is LLM-driven (not a templating engine), this is an instruction to the render subagent. Ensure this instruction appears in the render subagent's prompt contract (Step 2.5 in rendering-config.md) so it is not missed during fragment generation.

4. **Wheelchair question click delegation.** The DD notes that "existing event delegation on `.q-card` elements" will handle the click behavior. Verify during implementation that the event delegation scope covers Step 6 (not just Step 2 where `.q-card` elements currently exist). If the delegation is scoped to a Step 2 container, the wheelchair question in Step 6 will need its own handler.

## 5. Sign-off

| Role | Date | Verdict |
|---|---|---|
| Software Architect | 2026-03-23 | Approved with Changes |

**Conditions for approval (if "Approved with Changes"):**
- [ ] FB-1: Clarify the `.depth-extra-question` pattern reference — remove misleading Photography/Accessibility precedent and note this is the first actual DOM usage
- [ ] FB-2: Add POI field label i18n keys (or explicitly state they are inline content-generation labels, not locale file keys) to the DD §1.9
