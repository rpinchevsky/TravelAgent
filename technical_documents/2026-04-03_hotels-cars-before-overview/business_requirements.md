# Business Requirements Document

**Change:** Move Hotel & Car Rental Sections Before Detailed Day Overview
**Date:** 2026-04-03
**Author:** Product Manager
**Status:** Approved

---

## 1. Background & Motivation

Currently, hotel accommodation and car rental recommendation sections are embedded inside anchor day files (the first day of each stay/rental block). This means readers must scroll through the detailed day-by-day itinerary to find logistics information about where to stay and what to drive.

The user wants these sections promoted to the **beginning of the report**, before the day-by-day overview starts. This allows travelers to review and book accommodation and vehicles first, before reading the daily activity plans — matching the natural trip-planning decision order.

## 2. Scope

**In scope:**
- Extract accommodation and car rental content from anchor day files into standalone files
- New files: `accommodation_LANG.md` and `car_rental_LANG.md` in the trip folder
- Update assembly order: overview → accommodation → car rental → days → budget
- Remove `## 🏨` and `## 🚗` sections from anchor day file templates
- Update manifest schema to reflect new file structure
- Update HTML rendering to handle standalone hotel/car files as top-level sections
- Update Phase B subagent instructions (content_format_rules_phaseB.md)

**Out of scope:**
- Changing the internal format of hotel cards or car rental tables (content stays the same)
- Changing budget file structure (accommodation/car rental budget rows stay as-is)
- Changing anchor day budget table integration (line items remain on anchor day budget)
- Changing trip_planning_rules.md (planning logic unchanged)

**Affected rule files:**
- `content_format_rules.md` — folder structure, Phase B format, assembly command, anchor day format
- `content_format_rules_phaseB.md` — per-day template, accommodation/car rental section rules
- `rendering-config.md` — HTML section mapping for standalone hotel/car files

## 3. Requirements

### REQ-001: Standalone Accommodation File

**Description:** Accommodation recommendations must be generated as a standalone file `accommodation_LANG.md` in the trip folder, not embedded in anchor day files.

**Acceptance Criteria:**
- [ ] AC-1: File `accommodation_LANG.md` exists in trip folder after Phase B
- [ ] AC-2: File contains all stay blocks (multi-stay trips have all stays in one file)
- [ ] AC-3: Content format (card structure, booking links, property details) is identical to current
- [ ] AC-4: Anchor day files do NOT contain `## 🏨` sections

**Priority:** Must-have

**Affected components:**
- Markdown day files (anchor days lose hotel section)
- New standalone file (accommodation_LANG.md)
- Manifest schema (new file tracking)

---

### REQ-002: Standalone Car Rental File

**Description:** Car rental recommendations must be generated as a standalone file `car_rental_LANG.md` in the trip folder, not embedded in anchor day files.

**Acceptance Criteria:**
- [ ] AC-1: File `car_rental_LANG.md` exists in trip folder after Phase B (only if car rental preferences exist in trip details)
- [ ] AC-2: File contains all rental blocks (multi-block trips have all blocks in one file)
- [ ] AC-3: Content format (comparison tables, booking links, tips) is identical to current
- [ ] AC-4: Anchor day files do NOT contain `## 🚗` sections

**Priority:** Must-have

**Affected components:**
- Markdown day files (anchor days lose car rental section)
- New standalone file (car_rental_LANG.md)
- Manifest schema (new file tracking)

---

### REQ-003: Assembly Order — Hotels & Cars Before Days

**Description:** The trip assembly command must place accommodation and car rental files immediately after the overview and before the day-by-day content.

**Acceptance Criteria:**
- [ ] AC-1: `trip_full_LANG.md` section order is: overview → accommodation → car rental → day_00..day_NN → budget
- [ ] AC-2: Separator (`---`) between each major section
- [ ] AC-3: If accommodation file doesn't exist (no stays), it is skipped gracefully
- [ ] AC-4: If car rental file doesn't exist (no car rental), it is skipped gracefully

**Priority:** Must-have

**Affected components:**
- Assembly bash command in content_format_rules.md

---

### REQ-004: HTML Rendering of Standalone Sections

**Description:** The HTML renderer must handle standalone accommodation and car rental files as top-level report sections, not nested inside day cards.

**Acceptance Criteria:**
- [ ] AC-1: Accommodation section renders as a top-level `<div class="accommodation-section">` after the overview section, not inside any `<div class="day-card">`
- [ ] AC-2: Car rental section renders as a top-level `<div class="car-rental-section">` after accommodation, before day cards
- [ ] AC-3: All existing CSS classes and visual styling are preserved
- [ ] AC-4: Navigation/TOC (if any) includes accommodation and car rental as top-level entries

**Priority:** Must-have

**Affected components:**
- rendering-config.md
- HTML rendering logic

---

## 4. Dependencies & Risks

| Dependency / Risk | Mitigation |
|---|---|
| Phase B subagents currently generate hotel/car content within day batches | Separate generation into dedicated subagent or orchestrator step |
| Existing generated trips have hotel/car in day files | No migration needed — only affects future generations |
| Rendering logic currently expects hotel/car inside day-card divs | Update rendering-config.md to handle both top-level and legacy in-day placement |
| Anchor day budget tables still reference accommodation/car costs | Budget line items stay on anchor days — only the recommendation cards move |

## 5. Acceptance Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| PM | Auto | 2026-04-03 | Approved |
