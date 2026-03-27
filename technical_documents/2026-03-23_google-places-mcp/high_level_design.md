# High-Level Design

**Change:** Google Places MCP Integration — POI Enrichment, Phone/Rating Fields, Wheelchair Accessibility Question
**Date:** 2026-03-23
**Author:** Development Team
**BRD Reference:** business_requirements.md
**Status:** Draft

---

## 1. Overview

This change introduces three interconnected capabilities:

1. **Google Places MCP Server** — A new MCP configuration that registers a Google Places API server, making `search_places` and `get_place_details` tools available to the trip generation pipeline. This acts as a second-layer enrichment source after web fetch.

2. **Phone & Rating POI Fields** — Two new structured fields on every POI card: phone number (clickable `tel:` link) and rating (star display with review count). These flow through the full pipeline: rule files define collection requirements, content format rules define the markdown syntax, and rendering config defines the HTML components.

3. **Wheelchair Accessibility Intake Question** — A new mandatory, always-visible binary question on Step 6 of the trip intake wizard. This is separate from the existing T5 accessibility question (which covers flat routes) and produces a new `wheelchair accessible` field in the generated markdown output.

## 2. Affected Components

| Component | File(s) | Type of Change |
|---|---|---|
| MCP Configuration | `.mcp.json` (new) | Create — register Google Places MCP server |
| Trip Planning Rules | `trip_planning_rules.md` | Modify — add two-layer data flow, phone/rating collection, wheelchair verification, CEO audit check |
| Content Format Rules | `content_format_rules.md` | Modify — add phone/rating to Universal Location Standards (§3) |
| Rendering Config | `rendering-config.md` | Modify — add phone link + rating display to POI Card Structure |
| Rendering CSS | `rendering_style_config.css` | Modify — add `.poi-card__rating` styles |
| Trip Intake HTML | `trip_intake.html` | Modify — add wheelchair question to Step 6, add i18n keys, update generateMarkdown |
| Trip Intake Rules | `trip_intake_rules.md` | Modify — document new wheelchair field in Step 6, Supplementary Fields, Output Format |
| Trip Intake Design | `trip_intake_design.md` | Modify — add visual spec for wheelchair question component |
| Locale Files | `locales/ui_*.json` (12 files) | Modify — add i18n keys for wheelchair question + POI field labels |
| TripPage POM | `automation/code/tests/pages/TripPage.ts` | Modify — add locators for phone links + rating elements |
| IntakePage POM | `automation/code/tests/pages/IntakePage.ts` | Modify — add locator for wheelchair question |
| POI Card Tests | `automation/code/tests/regression/poi-cards.spec.ts` | Modify — add structural tests for phone/rating |
| Intake Tests | `automation/code/tests/intake/` (new spec) | Create — wheelchair question visibility + output tests |
| Automation Rules | `automation/code/automation_rules.md` | Modify — document new structural assertions |

## 3. Data Flow

### 3.1 POI Enrichment Data Flow (Trip Generation)

```
Web Search/Fetch (Layer 1)
    → Initial POI data (name, hours, prices, description, links)
    ↓
Google Places MCP (Layer 2 — enrichment/validation)
    → search_places(name + location) → get_place_details(place_id)
    → Structured fields: phone, rating, review_count, wheelchair_accessible, website, hours
    ↓
Merge Logic (in Phase B day generation subagents)
    → Google Places structured fields take precedence for: phone, rating, hours, website
    → Web fetch retains: narrative descriptions, pro-tips, family-specific notes
    ↓
Day Markdown File (day_XX_LANG.md)
    → POI section includes: 📞 phone line, ⭐ rating line, ♿ accessibility indicator
    ↓
HTML Fragment Generation (render subagents)
    → POI card includes: tel: link in link row, .poi-card__rating near name, accessibility badge
```

### 3.2 Wheelchair Accessibility Intake Flow

```
Trip Intake Wizard (Step 6)
    → User selects "No Requirement" or "Wheelchair Accessible Required"
    ↓
generateMarkdown() in trip_intake.html
    → Adds "- **Wheelchair accessible:** yes|no" to Additional Preferences section
    ↓
Downloaded trip details markdown file
    → Consumed by trip planning pipeline (trip_planning_rules.md)
    ↓
Phase B Day Generation
    → When wheelchair=yes: Google Places wheelchair_accessible field checked per POI
    → Accessible POIs get ♿ indicator; inaccessible POIs replaced or flagged
```

## 4. Integration Points

### 4.1 MCP Server → Trip Generation Pipeline
- The MCP server is registered in `.mcp.json` at the project root (Claude Code's standard MCP config location).
- The server is invoked by Phase B day generation subagents during the "Research & Quality Control" step of `trip_planning_rules.md`.
- Two tools are used: `search_places` (find place_id by name+location) and `get_place_details` (retrieve structured fields by place_id).
- API key is stored as an environment variable (`GOOGLE_PLACES_API_KEY`), never committed to the repository.

### 4.2 New Markdown Fields → HTML Rendering Pipeline
- Phone and rating lines in day markdown files are parsed by the render subagents using pattern matching against the emoji-prefixed format.
- The rendering pipeline already handles Maps/Site/Photo links in the link row — phone is appended as the 4th link.
- Rating is a new component type (`.poi-card__rating`) placed between `.poi-card__tag` and `.poi-card__name` in the POI card body.

### 4.3 Wheelchair Question → Existing Intake Architecture
- The new question reuses the existing `.depth-extra-question` pattern used for Photography (T4) and Accessibility (T5) in Step 2, but is placed directly in the Step 6 HTML as a supplementary always-visible field.
- It uses the same `.q-card` component with 2 options (binary choice) instead of the standard 3.
- It follows the existing `data-question-key` attribute pattern for value extraction.
- The `generateMarkdown()` function (patched in the depth IIFE) reads its value and outputs it in the Additional Preferences section.

### 4.4 Locale Integration
- New i18n keys follow existing naming patterns: `s6_wheelchair_*` for the question, `poi_phone` and `poi_rating` for field labels.
- All 12 locale files are updated: full translations for en/ru/he, English fallback for the remaining 9.

## 5. Impact on Existing Behavior

| Area | Impact | Backward Compatible? |
|---|---|---|
| POI markdown format | New optional lines (phone, rating) added to POI sections | Yes — lines are "when available" and omitted when absent. Existing POIs without these fields render identically. |
| POI HTML rendering | New elements (phone link, rating span) in POI cards | Yes — conditioned on markdown source containing the fields. Existing HTML without these fields is unchanged. |
| Trip intake output format | New `wheelchair accessible` field in Additional Preferences | Yes — existing trip details files without this field default to "no" (no wheelchair requirement). Pipeline handles both formats. |
| Step 6 UI | New question block added between notes textarea and button bar | Yes — additive change, no existing elements moved or removed. |
| Existing T5 accessibility question | Unchanged — remains as-is in Step 2 questionnaire | Yes — the two questions serve different purposes (route preferences vs venue accessibility). |
| Trip planning pipeline | New enrichment layer (Google Places) and wheelchair verification rules | Yes — additive rules. Existing trip generation without Google Places MCP configured will skip enrichment gracefully. |
| CSS | New `.poi-card__rating` class added to `rendering_style_config.css` | Yes — new class, no modifications to existing selectors. |
| Test suite | New structural assertions added | Yes — new tests, no modifications to existing test logic. |

## 6. BRD Coverage Matrix

| Requirement | Addressed in HLD? | Section |
|---|---|---|
| REQ-001: Google Places MCP Server Configuration | Yes | §3.1, §4.1 |
| REQ-002: Phone Number — Markdown Format | Yes | §3.1, §4.2 |
| REQ-003: Phone Number — HTML Rendering | Yes | §3.1, §4.2 |
| REQ-004: Rating — Markdown Format | Yes | §3.1, §4.2 |
| REQ-005: Rating — HTML Rendering | Yes | §3.1, §4.2 |
| REQ-006: Wheelchair Accessibility Intake Question | Yes | §3.2, §4.3, §4.4 |
| REQ-007: Wheelchair in Trip Planning Pipeline | Yes | §3.2 |
| REQ-008: Google Places as Second-Layer Validation | Yes | §3.1, §4.1 |
| REQ-009: Automation — POI Field Tests | Yes | §2 (TripPage, poi-cards.spec.ts) |
| REQ-010: Automation — Wheelchair Intake Tests | Yes | §2 (IntakePage, new intake spec) |
