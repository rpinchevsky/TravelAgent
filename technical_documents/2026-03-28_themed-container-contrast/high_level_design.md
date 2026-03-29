# High-Level Design

**Change:** Themed Container Contrast Rule & Regression Test
**Date:** 2026-03-28
**Author:** Development Team
**BRD Reference:** `technical_documents/2026-03-28_themed-container-contrast/business_requirements.md`
**Status:** Draft

---

## 1. Overview

This change introduces a three-layer defense against CSS color-inheritance bugs inside themed containers (elements with gradient or colored backgrounds that set a non-default text `color`). The layers are:

1. **Development rules** — codified in `rendering-config.md` and `coding_standards.md` so developers and AI agents never rely on CSS `color` inheritance inside themed containers.
2. **Static pre-regression gate** — a new grep-based check in the `development_rules.md` validation checklist that catches missing explicit `color` declarations before Playwright runs.
3. **Runtime regression test** — a Playwright spec that computes the actual text color luminance of banner child elements, catching specificity overrides that survive the static check.

No CSS changes are required (the fix on `.day-card__banner-title` is already in place at line 499 of `rendering_style_config.css`). No HTML rendering pipeline changes are needed. The change is purely additive: new rule text, a new pre-regression checklist item, new POM locators, and a new spec file.

## 2. Affected Components

| Component | File(s) | Type of Change |
|---|---|---|
| Design system rules | `rendering-config.md` | Modified -- new "Themed Container Rule" subsection |
| CSS architecture standards | `coding_standards.md` | Modified -- new rule in Section 4.4 |
| Pre-regression validation | `development_rules.md` | Modified -- new item 12 in Section 3 checklist |
| Page Object Model | `automation/code/tests/pages/TripPage.ts` | Modified -- new locator methods for banner text elements |
| Regression test suite | `automation/code/tests/regression/banner-contrast.spec.ts` | New file -- banner contrast validation |
| Test utilities | `automation/code/tests/utils/color-utils.ts` | New file -- luminance calculation helper |

## 3. Data Flow

The change introduces no new data pipelines. The data flow for the regression test is:

```
Generated trip HTML (trip_full_*.html)
  |
  v
Playwright loads HTML via shared-page fixture (read-only)
  |
  v
TripPage POM provides locators for .day-card__banner child elements
  |
  v
banner-contrast.spec.ts iterates over all day banners
  |
  v
For each banner: evaluate computed `color` CSS property of title and date elements
  |
  v
Parse RGB from computed style -> linearize -> calculate sRGB relative luminance
  |
  v
Assert luminance > 0.7 (light/white text) using expect.soft() with day context
```

The pre-regression gate flow is:

```
Generated trip HTML <style> block
  |
  v
Grep/regex for themed container child classes (.day-card__banner-title, .day-card__banner-date)
  |
  v
Verify each has an explicit `color:` declaration in the <style> block
  |
  v
Pass/fail gate (static text search, no browser needed)
```

## 4. Integration Points

| Integration Point | Contract |
|---|---|
| **TripPage.ts POM** | New locator methods (`getDayBannerTitleElement`, `getDayBannerDateElement`) return `Locator` instances scoped to `#day-{N}`. Existing locators (`getDayBannerTitle`, `getDayBannerDate`) remain unchanged. The new methods target the same CSS classes but are named to clarify their use in contrast validation. Alternatively, the existing `getDayBannerTitle(n)` and `getDayBannerDate(n)` methods already return the correct locators -- the spec can reuse them directly. Design decision: **reuse existing POM methods** to avoid locator duplication. |
| **shared-page fixture** | The new spec imports `test` and `expect` from `../fixtures/shared-page` (read-only, no page mutations). |
| **trip-config.ts** | The spec reads `tripConfig.dayCount` to drive the per-day loop. No new config fields needed. |
| **luminance utility** | A new `color-utils.ts` module exports a pure `relativeLuminance(r, g, b): number` function. It has no Playwright dependency and can be unit-tested independently. |
| **rendering_style_config.css** | No modification. The existing `.day-card__banner-title { color: var(--color-text-inverse) }` declaration (line 499) is the already-applied fix that the new test validates. |
| **Pre-regression gate** | Item 12 is a manual grep command added to the checklist. It does not modify any automated validation script. |

## 5. Impact on Existing Behavior

| Area | Impact | Backward Compatible? |
|---|---|---|
| Existing HTML output | No change -- CSS fix already in place | Yes |
| Existing regression tests | No change -- new spec file is additive | Yes |
| `TripPage.ts` locators | No existing locators modified; spec reuses `getDayBannerTitle(n)` and `getDayBannerDate(n)` | Yes |
| `rendering-config.md` | New subsection added after "Banner Titles"; no existing rules modified | Yes |
| `coding_standards.md` Section 4.4 | New bullet added to CSS Architecture; no existing rules modified | Yes |
| `development_rules.md` Section 3 | New item 12 appended to checklist; items 1-11 unchanged | Yes |
| Dark mode | The luminance threshold (>0.7) validates that banner text is a light color. In dark mode, `--color-text-inverse` resolves to `#1C1C1E` (dark), so the banner gradient and text color both change. The test runs in the default (light) Playwright color scheme. Dark mode testing is documented as future enhancement (per BRD risk table). | Yes (light mode validated; dark mode deferred) |

## 6. BRD Coverage Matrix

| Requirement | Addressed in HLD? | Section |
|---|---|---|
| REQ-001 (Themed Container Rule) | Yes | §2 (rendering-config.md, coding_standards.md), §4 (no CSS changes needed), §5 (backward compatible) |
| REQ-002 (Banner Contrast Regression Test) | Yes | §2 (new spec + utility + POM), §3 (data flow), §4 (integration points) |
| REQ-003 (Pre-Regression Validation Gate Update) | Yes | §2 (development_rules.md), §3 (gate flow), §4 (manual grep) |
