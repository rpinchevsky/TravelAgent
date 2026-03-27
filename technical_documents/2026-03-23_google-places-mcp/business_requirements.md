# Business Requirements Document

**Change:** Google Places MCP Integration — POI Enrichment, Phone/Rating Fields, Wheelchair Accessibility Question
**Date:** 2026-03-23
**Author:** Product Manager
**Status:** Approved

---

## 1. Background & Motivation

The trip generation pipeline currently relies on web search and web fetch as its sole data source for POI details (hours, prices, links). This single-source approach has two gaps:

1. **Data completeness:** Phone numbers and ratings are not collected or displayed, even though they are high-value for travelers making real-time decisions (calling ahead, comparing quality).
2. **Data reliability:** Web fetch can fail, return stale data, or miss structured fields (phone, rating, accessibility info) that are readily available via the Google Places API.

Adding Google Places as a **second-layer enrichment source** closes both gaps: it validates web-fetched data and fills in fields that web fetch cannot reliably extract. Separately, wheelchair accessibility is currently buried at depth 30 (Tier T5) — only shown to users who choose the "Deep Dive" questionnaire. The user wants a dedicated, always-visible mandatory question so that accessibility is never missed.

## 2. Scope

**In scope:**
- Configure Google Places MCP server as a new tool available to the trip generation pipeline
- Add phone number field to every POI card (markdown format + HTML rendering)
- Add rating/stars field to every POI card (markdown format + HTML rendering)
- Add a new mandatory wheelchair accessibility question to `trip_intake.html` (always visible, not gated by depth)
- Update rule files to reflect new POI fields and intake question
- Update automation tests to validate new POI fields and the new intake question
- Update i18n catalogs (12 locale files) with keys for the new question and POI field labels

**Out of scope:**
- Replacing web fetch with Google Places — Google Places is a supplementary layer, not a replacement
- Google Places billing/quota management (handled at infrastructure level)
- Modifying the existing T5 accessibility question (it remains as-is for flat routes preference)
- Using Google Places for non-POI data (weather, transit schedules, etc.)
- Changes to the trip planning algorithm or day generation logic beyond consuming new fields

**Affected rule files:**
- `trip_planning_rules.md` — section "Universal Location Standards" (add phone, rating)
- `content_format_rules.md` — section "Per-Day Content Requirements" §3 Universal Location Standards (add phone, rating to required fields)
- `rendering-config.md` — section "POI Card Structure" (add phone link, rating display to card component)
- `trip_intake_rules.md` — section "Wizard Flow", "Question Inventory & Depth Tiers", "Output Format"
- `trip_intake_design.md` — section "Step Layouts" (visual spec for new mandatory question)
- `automation/code/automation_rules.md` — section "Language Independence" (new structural assertions)

## 3. Requirements

### REQ-001: Google Places MCP Server Configuration

**Description:** Configure a Google Places MCP server so that Claude Code can call Google Places API tools (place search, place details) during trip generation. The MCP server acts as a second-layer data source: after web fetch populates POI data, Google Places is queried to validate and enrich the data. If web fetch fails or returns incomplete data for a POI, Google Places fills in the missing fields (phone, rating, website, hours, photos).

**Acceptance Criteria:**
- [ ] AC-1: An MCP configuration file exists (`.mcp.json` or equivalent) that registers the Google Places MCP server with valid connection settings
- [ ] AC-2: The MCP server exposes at minimum `search_places` and `get_place_details` tools that return structured data including phone number, rating, website, and accessibility information
- [ ] AC-3: The MCP server can be started and responds to tool calls without error when given a valid place name + location query

**Priority:** Must-have

**Affected components:**
- MCP configuration (new file)
- Trip generation pipeline (consumes MCP tools)

---

### REQ-002: Phone Number on POI Cards — Markdown Format

**Description:** Every POI card in the generated day markdown files must include a phone number field when available. The phone number is sourced from Google Places (primary) or web fetch (fallback). If no phone number is found from either source, the field is omitted (not rendered as empty).

**Acceptance Criteria:**
- [ ] AC-1: `content_format_rules.md` §3 "Universal Location Standards" lists phone number as a required field (with "when available" qualifier)
- [ ] AC-2: The markdown POI format includes a phone line using the pattern: `📞 Телефон: {phone_number}` (or equivalent in the reporting language)
- [ ] AC-3: `trip_planning_rules.md` "Universal Location Standards" section includes phone number as a data point to collect for every POI

**Priority:** Must-have

**Affected components:**
- `trip_planning_rules.md`
- `content_format_rules.md`
- Day file generation (Phase B subagents)

---

### REQ-003: Phone Number on POI Cards — HTML Rendering

**Description:** The HTML rendering pipeline must render the phone number as a clickable `tel:` link within the POI card's link row, alongside the existing Maps, Site, and Photo links.

**Acceptance Criteria:**
- [ ] AC-1: `rendering-config.md` "POI Card Structure" section specifies the phone link format: `<a href="tel:{number}">` with emoji prefix `📞` and localized label
- [ ] AC-2: The phone link appears in the POI card link row after the Photo link (order: Maps, Site, Photo, Phone)
- [ ] AC-3: Phone links use the same CSS class as other POI links (`poi-card` link styling) for visual consistency
- [ ] AC-4: If no phone number exists in the markdown source, no phone link is rendered (no empty/placeholder link)

**Priority:** Must-have

**Affected components:**
- `rendering-config.md`
- HTML fragment generation (render subagents)
- `rendering_style_config.css` (if new styles needed)

---

### REQ-004: Rating on POI Cards — Markdown Format

**Description:** Every POI card in the generated day markdown files must include a rating field when available. The rating is a numeric value (e.g., 4.5/5) sourced from Google Places. If no rating is available, the field is omitted.

**Acceptance Criteria:**
- [ ] AC-1: `content_format_rules.md` §3 "Universal Location Standards" lists rating as a required field (with "when available" qualifier)
- [ ] AC-2: The markdown POI format includes a rating line using the pattern: `⭐ {rating}/5 ({review_count} отзывов)` (or equivalent in the reporting language)
- [ ] AC-3: `trip_planning_rules.md` "Universal Location Standards" section includes rating as a data point to collect for every POI

**Priority:** Must-have

**Affected components:**
- `trip_planning_rules.md`
- `content_format_rules.md`
- Day file generation (Phase B subagents)

---

### REQ-005: Rating on POI Cards — HTML Rendering

**Description:** The HTML rendering pipeline must display the rating as a visual star indicator within the POI card, positioned prominently near the POI name/tag area (not buried in the link row).

**Acceptance Criteria:**
- [ ] AC-1: `rendering-config.md` "POI Card Structure" section specifies the rating display: a `<span class="poi-card__rating">` element showing the numeric rating and star icon
- [ ] AC-2: The rating is placed visually near the POI card name (e.g., after `<h3 class="poi-card__name">` or below the tag), not in the link row
- [ ] AC-3: Rating display uses a star icon (SVG or emoji) with the numeric value (e.g., "4.5" with a star)
- [ ] AC-4: If no rating exists in the markdown source, no rating element is rendered
- [ ] AC-5: Review count, if available, is displayed in parentheses after the rating (e.g., "4.5 (2,340)")

**Priority:** Must-have

**Affected components:**
- `rendering-config.md`
- HTML fragment generation (render subagents)
- `rendering_style_config.css` (new `.poi-card__rating` styles)

---

### REQ-006: Mandatory Wheelchair Accessibility Question in Trip Intake

**Description:** Add a new mandatory question to `trip_intake.html` that asks whether places must be wheelchair accessible. This question is always visible regardless of depth selection (not tiered). It is separate from the existing T5 `accessibility` question which covers broader mobility preferences (flat routes, etc.). The new question has a binary-style answer: "No requirement" vs. "Yes, wheelchair accessible places required." The answer feeds into the generated markdown output and is consumed by the trip planning pipeline to filter/flag POIs.

**Acceptance Criteria:**
- [ ] AC-1: A new question with key `wheelchairAccessible` (or similar) exists in `trip_intake.html` as a mandatory, always-visible field — not gated by any depth tier
- [ ] AC-2: The question appears on Step 6 (Language & Extras) alongside existing supplementary fields (photography, accessibility), since it is a supplementary always-visible field
- [ ] AC-3: The question offers two options: "No Requirement" (default) and "Wheelchair Accessible Required"
- [ ] AC-4: The selected value is included in the generated markdown output under "Additional Preferences" as a new field: `- **Wheelchair accessible:** {yes|no}`
- [ ] AC-5: All 12 locale files (`locales/ui_*.json`) contain i18n keys for the question label and option labels
- [ ] AC-6: The question renders correctly in both LTR and RTL layouts
- [ ] AC-7: `trip_intake_rules.md` documents the new field in the "Step 6" section, the "Output Format" section, and the "Supplementary Fields" table

**Priority:** Must-have

**Affected components:**
- `trip_intake.html`
- `trip_intake_rules.md`
- `trip_intake_design.md`
- `locales/ui_*.json` (12 files)
- `content_format_rules.md` (output format)

---

### REQ-007: Wheelchair Accessibility in Trip Planning Pipeline

**Description:** When the trip details file indicates wheelchair accessibility is required, the trip planning pipeline must: (a) use Google Places accessibility data to verify POI wheelchair accessibility, (b) flag or exclude POIs that are not wheelchair accessible, and (c) note accessibility status in POI cards.

**Acceptance Criteria:**
- [ ] AC-1: `trip_planning_rules.md` includes a rule that when `wheelchair accessible: yes` is set in trip details, every POI must be verified for wheelchair accessibility via Google Places data
- [ ] AC-2: POIs that are confirmed wheelchair-accessible receive an accessibility indicator in the markdown (e.g., `♿ Доступно для колясок`)
- [ ] AC-3: If a POI is not wheelchair accessible and the requirement is active, it must be replaced with an accessible alternative or explicitly flagged with a warning
- [ ] AC-4: The CEO Audit checklist in `trip_planning_rules.md` includes a wheelchair accessibility check when the requirement is active

**Priority:** Must-have

**Affected components:**
- `trip_planning_rules.md`
- Day file generation (Phase B subagents)
- Google Places MCP (data source for accessibility info)

---

### REQ-008: Google Places as Second-Layer Validation

**Description:** The Google Places MCP must act as a validation and enrichment layer on top of web fetch, not a replacement. The data flow is: (1) web search/fetch collects initial POI data, (2) Google Places validates key fields (hours, website URL, existence) and enriches with structured data (phone, rating, accessibility, place_id). If web fetch and Google Places disagree on a fact (e.g., opening hours), Google Places data takes precedence for structured fields.

**Acceptance Criteria:**
- [ ] AC-1: `trip_planning_rules.md` documents the two-layer data flow: web fetch first, Google Places second for validation/enrichment
- [ ] AC-2: Phone and rating fields in POI cards are sourced from Google Places when available, with web fetch as fallback
- [ ] AC-3: Google Places does not replace web fetch for narrative content (descriptions, pro-tips, family-specific notes) — only for structured fields

**Priority:** Must-have

**Affected components:**
- `trip_planning_rules.md`
- Day file generation workflow

---

### REQ-009: Automation Test Coverage for New POI Fields

**Description:** The regression test suite must validate the presence and structure of phone number and rating fields on POI cards in generated HTML output, following language-independent testing rules.

**Acceptance Criteria:**
- [ ] AC-1: A structural test validates that POI cards can contain `a[href^="tel:"]` elements (phone links) — asserted structurally, not by text content
- [ ] AC-2: A structural test validates that POI cards can contain `.poi-card__rating` elements (rating display) — asserted structurally, not by text content
- [ ] AC-3: Tests do not assert that every POI has phone/rating (since fields are "when available"), but validate that when present, they follow the correct HTML structure
- [ ] AC-4: Tests follow all rules in `automation_rules.md` including language independence (no hardcoded text), shared-page fixture for read-only assertions, and `expect.soft()` batching

**Priority:** Must-have

**Affected components:**
- `automation/code/tests/` (test specs)
- `automation/code/automation_rules.md` (document new assertions)
- `TripPage.ts` (add locators for new elements if needed)

---

### REQ-010: Automation Test Coverage for Wheelchair Accessibility Intake Question

**Description:** The intake test suite must validate the new mandatory wheelchair accessibility question renders correctly, is always visible, and its selection flows into the generated markdown output.

**Acceptance Criteria:**
- [ ] AC-1: A test validates that the wheelchair accessibility question is visible on Step 6 regardless of depth selection
- [ ] AC-2: A test validates that selecting "Wheelchair Accessible Required" produces the corresponding field in the generated markdown preview
- [ ] AC-3: Tests follow language-independent rules (validate by DOM structure, not by text content)

**Priority:** Should-have

**Affected components:**
- `automation/code/tests/intake/` (intake test specs)
- Intake page object (if exists)

---

## 4. Dependencies & Risks

| Dependency / Risk | Mitigation |
|---|---|
| Google Places API requires an API key with billing enabled | Document required API setup in MCP configuration. Key must be stored securely (environment variable, not committed to repo). |
| Google Places API has per-request cost (~$0.017 per Place Details call) | Batch queries: one `search_places` + one `get_place_details` per POI. Estimate ~50 POIs per trip = ~$0.85/trip. Document cost model. |
| Google Places API rate limits (QPS) | MCP server should handle rate limiting internally. Trip generation is sequential per-POI, so unlikely to hit limits. |
| Google Places may not have data for all POIs (small local shops, new venues) | Phone and rating are "when available" fields — graceful degradation by omission, not error. |
| Wheelchair accessibility data in Google Places may be incomplete or inaccurate | Use Google Places as a signal, not absolute truth. When data is missing, note "accessibility not verified" rather than assuming accessible or inaccessible. |
| New mandatory intake question changes the output format of trip details markdown | Backward compatibility: existing trip details files without the new field default to "no" (no wheelchair requirement). Pipeline must handle both old and new format files. |
| Existing T5 accessibility question overlap with new wheelchair question | Clear differentiation: T5 question covers mobility preferences (flat routes, general accessibility). New question is specifically about wheelchair-accessible venues. Both can coexist. |
| i18n effort across 12 locale files | New keys are limited (question label + 2 option labels + POI field labels). Use same translation workflow as existing questions. |

## 5. Acceptance Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| PM | Product Manager | 2026-03-23 | Approved |
