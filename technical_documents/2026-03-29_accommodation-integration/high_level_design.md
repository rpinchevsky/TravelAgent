# High-Level Design

**Change:** Accommodation Integration — Hotel Discovery & Booking Referral Cards in Trip Output
**Date:** 2026-03-29
**Author:** Development Team
**BRD Reference:** business_requirements.md
**Status:** Revised per SA feedback

---

## 1. Overview

This feature integrates accommodation discovery and booking referral into the trip generation pipeline. The system identifies "stay blocks" (contiguous nights at the same location), queries Google Places API (`type=lodging`) for hotel options filtered by traveler preferences from the `## Hotel Assistance` intake section, constructs Booking.com affiliate deep links, and renders 2-3 accommodation option cards in the anchor day file of each stay block. Budget integration adds accommodation cost estimates to both daily and aggregate budgets. HTML rendering introduces a new `.accommodation-card` component visually distinct from `.poi-card`.

The design follows established pipeline patterns: Phase A identifies stay blocks and records them in the manifest; Phase B discovers hotels during anchor-day generation; the render pipeline maps `### 🏨` headings to `.accommodation-card` elements; regression tests validate structure language-agnostically.

## 2. Affected Components

| Component | File(s) | Type of Change |
|---|---|---|
| Trip planning rules | `trip_planning_rules.md` | Modify — add Accommodation Selection section, extend Data Source Hierarchy, extend CEO Audit checklist |
| Content format rules | `content_format_rules.md` | Modify — add Accommodation Card Template to Per-Day File Format, extend manifest.json schema, extend Budget Assembly, add accommodation section placement rules |
| HTML rendering config | `rendering-config.md` | Modify — add `.accommodation-card` and `.accommodation-section` component specs, add rendering rules for `## 🏨` / `### 🏨` headings |
| CSS styles | `rendering_style_config.css` | Modify — add `.accommodation-section`, `.accommodation-card`, `.accommodation-card__*` sub-element styles, `.booking-cta` button styles, `.price-level` indicator styles |
| Page object model | `automation/code/tests/pages/TripPage.ts` | Modify — add accommodation-specific locators and helper methods |
| Regression tests | `automation/code/tests/specs/` (new spec) | Create — accommodation validation spec |
| Automation rules | `automation/code/automation_rules.md` | Modify — document accommodation test patterns |
| Phase A logic | (pipeline behavior, no file) | Modify — add stay block identification after overview table generation |
| Phase B logic | (pipeline behavior, no file) | Modify — anchor day subagents run Google Places lodging search and generate accommodation cards |
| Budget assembly | (pipeline behavior, no file) | Modify — aggregate budget includes accommodation category |

## 3. Data Flow

```
Trip Details (## Hotel Assistance)
        │
        ▼
┌─────────────────────┐
│  Phase A: Overview   │
│  - Build summary     │
│  - Identify stay     │
│    blocks from area  │
│    changes           │
│  - Write manifest    │
│    with stays[]      │
└────────┬────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  Phase B: Day Generation (parallel batches)  │
│                                               │
│  Anchor day subagent (first day of each stay):│
│  1. Parse ## Hotel Assistance preferences     │
│     from trip details (or use defaults)       │
│  2. Google Places search: type=lodging +      │
│     area + preference filters                 │
│  3. Select 2-3 options at different price     │
│     levels                                    │
│  4. Construct Booking.com deep links          │
│  5. Write ## 🏨 section with ### 🏨 cards    │
│     in day_XX_LANG.md                         │
│  6. Include accommodation line in daily       │
│     budget table                              │
│                                               │
│  Non-anchor day subagents:                    │
│  - No accommodation logic (unchanged)         │
└────────┬────────────────────────────────────┘
         │
         ▼
┌────────────────────┐
│  Manifest Update   │
│  - Update stays[]  │
│    with options_   │
│    count and       │
│    discovery_source│
└────────┬───────────┘
         │
         ▼
┌────────────────────┐      ┌───────────────────┐
│  Budget Assembly   │      │  Trip Assembly     │
│  - New Accomm.     │      │  (concat, no LLM)  │
│    category row    │      └────────┬──────────┘
└────────┬───────────┘               │
         │                           ▼
         │                  ┌───────────────────┐
         └─────────────────►│  HTML Rendering   │
                            │  - ## 🏨 → section│
                            │  - ### 🏨 → card  │
                            │  - .accommodation-│
                            │    card styling    │
                            │  - Booking CTA btn │
                            └────────┬──────────┘
                                     │
                                     ▼
                            ┌───────────────────┐
                            │  Regression Tests │
                            │  - Structure check │
                            │  - Link validation │
                            │  - Budget check    │
                            └───────────────────┘
```

### Key Data Artifacts

1. **Trip Details input** — `## Hotel Assistance` section with 7 preference fields (accommodation_type, location_priority, quality_level, must_have_amenities, pets, daily_budget, cancellation_preference)
2. **manifest.json** — new top-level `accommodation.stays[]` array tracking stay blocks, anchor days, discovery status
3. **Anchor day file** — `## 🏨` section containing 2-3 `### 🏨` accommodation cards with Booking.com deep links
4. **Daily budget table** — accommodation line item on anchor day only
5. **Aggregate budget** — new "Accommodation" category row

## 4. Integration Points

### 4.1 Trip Details → Phase B (Preference Consumption)

The `## Hotel Assistance` section output by the intake wizard (2026-03-28_hotel-car-assistance feature) provides structured preferences. The anchor day subagent parses these fields to parameterize the Google Places search and annotate cards. If the section is absent, sensible defaults are used (mid-range, city center, no pet requirement).

### 4.2 Google Places MCP → Accommodation Discovery

Follows the existing Data Source Hierarchy pattern (Layer 2 enrichment). The same `mcp__google-places__maps_search_places` tool used for POI enrichment is reused with `type=lodging`. Results flow through the same graceful degradation path: if MCP unavailable or zero results, section is skipped and manifest records `"discovery_source": "skipped"`.

### 4.3 Phase A → Phase B (Stay Block Coordination)

Phase A writes `accommodation.stays[]` to the manifest with `anchor_day` references. Phase B subagents read the manifest to determine whether their assigned days include an anchor day. Only anchor-day subagents execute the accommodation discovery flow.

### 4.4 Content → HTML Rendering

The markdown-to-HTML mapping adds two new patterns:
- `## 🏨` → `<div class="accommodation-section">` wrapper with section heading
- `### 🏨` → `<div class="accommodation-card">` (distinct from `<div class="poi-card">`)

These are NOT counted in the POI Parity Check (they use a different CSS class and heading pattern).

### 4.5 HTML → Automation Tests

New page object locators in `TripPage.ts` expose accommodation elements. Tests validate structure, link patterns, and budget integration language-agnostically.

## 5. Impact on Existing Behavior

| Area | Impact | Backward Compatible? |
|---|---|---|
| manifest.json schema | New `accommodation` top-level key added | Yes — existing code ignores unknown keys; older manifests without `accommodation` are valid |
| Per-Day File Format | New `## 🏨` section added to anchor day files only | Yes — non-anchor days unchanged; assembly is mechanical concat |
| Daily Budget Table | Anchor day gets additional accommodation line item | Yes — additive row; existing line items unchanged |
| Aggregate Budget | New "Accommodation" category row | Yes — additive row |
| POI Parity Check | Accommodation headings (`### 🏨`) excluded from POI count | Yes — `### 🏨` is not a POI heading; parity check scopes to non-accommodation `###` headings |
| HTML rendering | New `.accommodation-card` class; existing `.poi-card` unchanged | Yes — new CSS rules are additive |
| Phase A output | Stay blocks computed; overview table unchanged | Yes — stay blocks are metadata only |
| Phase B subagent contract | Anchor day subagents get accommodation context | Yes — non-anchor subagents unchanged |
| Incremental edit | Editing an anchor day regenerates accommodation section | Yes — follows existing edit workflow |
| Trips without Hotel Assistance | Defaults used; accommodation cards still generated | Yes — graceful default behavior |

## 6. BRD Coverage Matrix

| Requirement | Addressed in HLD? | Section |
|---|---|---|
| REQ-001: Stay Block Identification | Yes | §3 (Data Flow — Phase A), §4.3 (Integration) |
| REQ-002: Accommodation Discovery via Google Places | Yes | §3 (Data Flow — Phase B), §4.2 (Integration) |
| REQ-003: Booking.com Deep Link Construction | Yes | §3 (Data Flow — Phase B step 4) |
| REQ-004: Accommodation Card Format in Markdown | Yes | §3 (Data Flow — Phase B step 5), §4.4 (Integration) |
| REQ-005: Budget Integration | Yes | §3 (Data Flow — Phase B step 6, Budget Assembly) |
| REQ-006: Preference Matching Logic | Yes | §4.1 (Integration — preference consumption) |
| REQ-007: CEO Audit Checklist Addition | Yes | §2 (Affected Components — trip_planning_rules.md) |
| REQ-008: Manifest Schema — Accommodation Metadata | Yes | §3 (Data Flow — manifest), §5 (Backward Compat) |
| REQ-009: HTML Rendering — Accommodation Card Type | Yes | §4.4 (Integration), §2 (Affected Components) |
| REQ-010: Automation Test Coverage | Yes | §4.5 (Integration), §2 (Affected Components) |
| REQ-011: Language-Agnostic Content Generation | Yes | §4.4 (rendering language-agnostic), §5 (POI parity exclusion) |
