# High-Level & Detailed Design

**Change:** Move Hotel & Car Rental Sections Before Detailed Day Overview
**Date:** 2026-04-03
**BRD:** `business_requirements.md`

---

## 1. Design Overview

Hotel and car rental recommendation content moves from anchor day files to standalone top-level files. The content format is unchanged — only the container (file) and assembly position change.

### New Trip Folder Structure

```
generated_trips/trip_YYYY-MM-DD_HHmm/
  manifest.json
  overview_LANG.md               # Phase A
  accommodation_LANG.md          # NEW — standalone hotel recommendations
  car_rental_LANG.md             # NEW — standalone car rental recommendations (optional)
  day_00_LANG.md                 # Day files — NO longer contain 🏨/🚗 sections
  day_01_LANG.md
  ...
  budget_LANG.md
  trip_full_LANG.md
  trip_full_LANG.html
```

### New Assembly Order

```
overview → accommodation (if exists) → car_rental (if exists) → days → budget
```

## 2. File Changes

### 2.1 content_format_rules.md

| Section | Change |
|---|---|
| Trip Folder Structure | Add `accommodation_LANG.md` and `car_rental_LANG.md` to file listing |
| Phase A Output | Remove "Car rental details: see Day {N}" note — no longer needed |
| Per-Day File Format template | Remove `## 🏨` and `## 🚗` lines from the template |
| Section placement order | Remove items 3 (accommodation) and 4 (car rental) from anchor day order |
| Accommodation Section | Change from "Anchor Day Only" to "Standalone File" — same content, new container |
| Car Rental Section | Change from "Anchor Day Only" to "Standalone File" — same content, new container |
| Trip Assembly command | Insert conditional cat of accommodation + car_rental between overview and days |
| Manifest schema | Add `accommodation_complete` and `car_rental_complete` fields under language |

### 2.2 content_format_rules_phaseB.md

| Section | Change |
|---|---|
| Per-Day File Format template | Remove `## 🏨` and `## 🚗` lines |
| Section placement order | Remove accommodation and car rental items |
| Accommodation Section | Remove entirely (no longer generated in day files) |
| Car Rental Section | Remove entirely (no longer generated in day files) |
| Anchor Day Budget Integration | Keep budget line items — only the recommendation cards move |
| Generation Context note | Update to note that hotel/car are generated as standalone files, not in day subagents |

### 2.3 rendering-config.md

| Section | Change |
|---|---|
| Accommodation Section & Card Layout | Update: `## 🏨` now renders as top-level `<div class="accommodation-section">`, not inside day-card |
| Car Rental Section & Card Layout | Update: `## 🚗` now renders as top-level `<div class="car-rental-section">`, not inside day-card |

## 3. Generation Flow Change

### Current Flow (Phase B)
- Day subagents generate accommodation/car on anchor days as part of the day file

### New Flow (Phase B)
- Day subagents generate days WITHOUT accommodation/car sections
- After all day batches complete, the main agent (or a dedicated step) generates:
  1. `accommodation_LANG.md` — using Hotel Assistance preferences + Google Places
  2. `car_rental_LANG.md` — using Car Rental Assistance preferences + web search
- These files are generated BEFORE the budget step (budget still references accommodation/car costs)

### Standalone File Generation

The accommodation and car rental files are generated as a **separate Phase B step** after all day batches complete but before budget aggregation. The main agent generates these directly (not as subagents — they are single files with focused scope).

**Context needed:**
- Trip details file (Hotel Assistance / Car Rental Assistance sections)
- Manifest (stay blocks, rental blocks, dates)
- Content format rules (card format, booking link format)

## 4. Assembly Command (New)

```bash
cd <trip_folder> && {
  cat overview_LANG.md
  [ -f accommodation_LANG.md ] && { printf '\n---\n\n'; cat accommodation_LANG.md; }
  [ -f car_rental_LANG.md ] && { printf '\n---\n\n'; cat car_rental_LANG.md; }
  for f in day_[0-9][0-9]_LANG.md; do printf '\n---\n\n'; cat "$f"; done
  printf '\n---\n\n'
  cat budget_LANG.md
} > trip_full_LANG.md
```

## 5. What Does NOT Change

- Hotel card content format (property name, rating, booking link, etc.)
- Car rental table format (company, rate, total, booking link)
- Budget file structure and aggregation
- Anchor day budget table line items for accommodation/car rental
- Manifest accommodation/car_rental block schemas (stays, blocks arrays)
- Trip planning rules (trip_planning_rules.md untouched)
