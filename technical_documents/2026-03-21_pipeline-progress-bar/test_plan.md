# Test Plan — Pipeline Progress Bar

**Date:** 2026-03-21
**Author:** Automation Engineer
**Feature:** Static pipeline roadmap in trip intake post-download section
**Status:** Proposed

---

## 1. Test Strategy

### 1.1 Automated vs. Manual

**Recommendation: Manual verification only. No new automated tests.**

**Rationale:**

1. **Nature of the change:** This is a purely static, informational visual element (no interactivity, no state changes, no data flow). The pipeline roadmap is a CSS/HTML addition inside an existing container (`#postDownload`) whose show/hide lifecycle is already tested implicitly by the intake test suite.

2. **Existing infrastructure scope:** The project has Playwright-based intake tests (`automation/code/tests/intake/`) with an `IntakePage` page object. These tests cover the depth selector, wizard navigation, question rendering, stepper, and i18n key verification. However, they do not currently navigate to or interact with the Step 7 post-download section because that flow requires completing all 7 wizard steps AND triggering a file download -- a heavyweight scenario that would add fragility without proportional value for a static display.

3. **Cost-benefit assessment:** Writing automated tests for this feature would require:
   - Extending `IntakePage` with pipeline roadmap locators
   - A helper to navigate through all wizard steps and trigger download
   - Multiple viewport-specific tests for responsive behavior
   - Dark mode emulation tests
   - RTL layout tests

   This effort is disproportionate for 6 static `<div>` elements with no logic. The risk of regression is near-zero: the component has no JavaScript, no event handlers, and no conditional rendering.

4. **i18n key verification exception:** The existing `intake-depth-i18n.spec.ts` test verifies i18n key presence by reading the `TRANSLATIONS` object from `window`. Adding the 8 new `s7_pipeline_*` keys to this existing test would be trivial, but it would change the ownership boundary (the existing test file covers depth selector keys, not pipeline roadmap keys). The manual checklist covers this verification instead.

---

## 2. Manual Verification Checklist

All verification is performed against `trip_intake.html` opened directly in a browser. Complete the wizard through all steps, click the download button, and verify the post-download section.

### MV-001: Structure & Content (maps to AC-001.1, AC-001.2, AC-001.3)

| # | Check | Pass |
|---|-------|------|
| 1 | `.pipeline-roadmap` container is present inside `#postDownload` | [ ] |
| 2 | Container appears after `.post-download__hint` paragraph | [ ] |
| 3 | Exactly 6 step elements (`.pipeline-roadmap__step`) are rendered | [ ] |
| 4 | Steps appear in correct order: 1-Overview, 2-Day Gen, 3-Budget, 4-Assembly, 5-HTML Render, 6-QA | [ ] |
| 5 | Each step displays a numbered circular badge (`.pipeline-roadmap__num`) with correct number 1-6 | [ ] |
| 6 | Each step displays a label (`.pipeline-roadmap__label`) with `data-i18n` attribute | [ ] |
| 7 | Header row shows title and total time ("~35 min total") | [ ] |

### MV-002: Timing Information (maps to AC-002.1, AC-002.2, AC-002.3, AC-002.5)

| # | Check | Pass |
|---|-------|------|
| 1 | Step 1 shows "~2 min" | [ ] |
| 2 | Step 2 shows "~12 min" | [ ] |
| 3 | Step 3 shows "~1 min" | [ ] |
| 4 | Step 4 shows "~1 min" | [ ] |
| 5 | Step 5 shows "~11 min" | [ ] |
| 6 | Step 6 shows "~1 min" | [ ] |
| 7 | Total time element (`.pipeline-roadmap__total`) displays "~35 min total" | [ ] |
| 8 | Bar track (`.pipeline-roadmap__bar-track`) has 6 segments with proportional widths (6%, 34%, 3%, 3%, 31%, 3%) | [ ] |

### MV-003: Major Phase Visual Emphasis (maps to AC-002.4)

| # | Check | Pass |
|---|-------|------|
| 1 | Step 2 (Day Generation) has `--major` modifier class | [ ] |
| 2 | Step 5 (HTML Rendering) has `--major` modifier class | [ ] |
| 3 | Major step badges use `--color-brand-primary` background (visually distinct from minor steps) | [ ] |
| 4 | Major bar segments have higher opacity (0.8) than minor segments (0.5) | [ ] |
| 5 | Steps 2 and 5 are visually wider than other steps (proportional flex-basis) | [ ] |

### MV-004: Show/Hide Lifecycle (maps to AC-001.4, AC-001.5)

| # | Check | Pass |
|---|-------|------|
| 1 | Pipeline roadmap is NOT visible before clicking download on Step 7 | [ ] |
| 2 | Pipeline roadmap appears when the download button is clicked (along with the rest of `#postDownload`) | [ ] |
| 3 | Navigate away from Step 7 using Back button, then return — pipeline roadmap is hidden again | [ ] |
| 4 | Click download again — pipeline roadmap reappears | [ ] |

### MV-005: Responsive Layout (maps to AC-001.6)

| # | Check | Pass |
|---|-------|------|
| 1 | **Desktop (>=1024px):** Steps are in a horizontal row; bar track is visible below steps | [ ] |
| 2 | **Tablet (768px):** Steps remain horizontal but may be slightly compressed; still readable | [ ] |
| 3 | **Mobile (<=480px):** Steps stack vertically — each step is a horizontal row (badge + label + time) | [ ] |
| 4 | **Mobile:** Steps have thin border separators between rows | [ ] |
| 5 | **Mobile:** Bar track remains at the bottom in horizontal proportional layout | [ ] |
| 6 | No horizontal overflow or clipping at any viewport width down to 320px | [ ] |

### MV-006: Dark Mode (maps to AC-001.7)

| # | Check | Pass |
|---|-------|------|
| 1 | Toggle `prefers-color-scheme: dark` in DevTools — pipeline roadmap renders correctly | [ ] |
| 2 | Border-top color uses `--color-border` (no light-mode bleed) | [ ] |
| 3 | Bar segment opacities adjust (minor: 0.6, major: 0.9) | [ ] |
| 4 | Text remains readable — badge colors, labels, and times all use token-based colors | [ ] |
| 5 | No hard-coded color values visible (everything inherits from design tokens) | [ ] |

### MV-007: RTL Layout (maps to AC-001.8)

| # | Check | Pass |
|---|-------|------|
| 1 | Set UI language to Hebrew — `html[dir="rtl"]` is applied | [ ] |
| 2 | Steps row reverses direction (Step 1 appears on the right, Step 6 on the left) | [ ] |
| 3 | Bar track segments reverse direction (matching step order) | [ ] |
| 4 | Header row reverses (title on right, total on left) | [ ] |
| 5 | **Mobile RTL:** Vertical list rows flip (badge on right, time on left) | [ ] |

### MV-008: i18n Labels (maps to AC-001.9)

| # | Check | Pass |
|---|-------|------|
| 1 | All 8 new `data-i18n` keys are present in HTML: `s7_pipeline_title`, `s7_pipeline_total`, `s7_pipeline_step1` through `s7_pipeline_step6` | [ ] |
| 2 | Switch to English — all labels display in English | [ ] |
| 3 | Switch to Russian — all labels display in Russian | [ ] |
| 4 | Switch to Hebrew — all labels display in Hebrew | [ ] |
| 5 | Code review: all 8 keys exist in `TRANSLATIONS.en`, `TRANSLATIONS.ru`, `TRANSLATIONS.he` | [ ] |
| 6 | Code review: remaining 9 languages (es, fr, de, it, pt, zh, ja, ko, ar) have the 8 keys (values may fallback to English) | [ ] |

### MV-009: Accessibility (not a BRD AC, but design spec requirement)

| # | Check | Pass |
|---|-------|------|
| 1 | Bar segments have `title` attributes providing tooltip text on hover | [ ] |
| 2 | Step numbers provide sequential ordering (1-6) | [ ] |
| 3 | Major steps are distinguishable without color alone (wider + different badge style) | [ ] |

---

## 3. BRD Acceptance Criteria Traceability

| AC | Description | Covered By |
|----|-------------|------------|
| AC-001.1 | Six steps in order, horizontal timeline | MV-001 #3, #4 |
| AC-001.2 | Each step shows name and number | MV-001 #5, #6 |
| AC-001.3 | Visual inside `.post-download`, after hint | MV-001 #1, #2 |
| AC-001.4 | Hidden by default, appears on download | MV-004 #1, #2 |
| AC-001.5 | Resets on navigate away and return | MV-004 #3, #4 |
| AC-001.6 | Responsive at <=480px | MV-005 #1-#6 |
| AC-001.7 | Dark mode support | MV-006 #1-#5 |
| AC-001.8 | RTL support | MV-007 #1-#5 |
| AC-001.9 | `data-i18n` for all text | MV-008 #1-#6 |
| AC-002.1 | Each step shows estimated duration | MV-002 #1-#6 |
| AC-002.2 | Percentage shown as visual proportion | MV-002 #8, MV-003 #5 |
| AC-002.3 | Total time summary element | MV-002 #7 |
| AC-002.4 | Phase B and HTML Render visually distinct | MV-003 #1-#5 |
| AC-002.5 | Timing as JS data constants | MV-002 (code review note) |

---

## 4. Out of Scope

- Existing regression tests (`automation/code/tests/regression/`) — these test rendered trip HTML, not the intake wizard. No changes needed.
- Existing intake tests (`automation/code/tests/intake/`) — these test depth selector and question rendering. The pipeline roadmap does not affect those features. No changes needed.
- Cross-browser testing beyond Chrome DevTools — the feature uses standard flexbox/CSS that works across all modern browsers.
- Performance testing — the addition is ~179 lines of static HTML/CSS with no JavaScript execution.
