# Business Requirements Document

**Change:** Themed Container Contrast Rule & Regression Test
**Date:** 2026-03-28
**Author:** Product Manager
**Status:** Approved

---

## 1. Background & Motivation

A CSS specificity bug was discovered where the global heading reset (`h1, h2, h3, h4, h5, h6 { color: var(--color-text-primary) }`) in `rendering_style_config.css` (line 177-181) overrode the inherited `color: var(--color-text-inverse)` from `.day-card__banner`, causing banner titles (`.day-card__banner-title`) to appear dark/black instead of white on the gradient background.

The immediate CSS fix has been applied: `.day-card__banner-title` now has an explicit `color: var(--color-text-inverse)` declaration (line 499).

However, **no rule or automated test exists to prevent this category of bug from recurring.** Any future element added inside a color-themed container (gradient/colored background) that uses a semantic HTML tag (h1-h6, p, a) is vulnerable to the same specificity override. This change introduces:

1. A **development rule** codifying the "themed container" pattern so developers and AI agents never rely on color inheritance inside themed containers.
2. A **regression test** that programmatically validates text contrast inside themed containers, catching specificity bugs before they reach production.

---

## 2. Scope

**In scope:**
- New development rule ("Themed Container Rule") added to `rendering-config.md` and `coding_standards.md`
- New Playwright regression test ("Banner Contrast Validation") in the automation suite
- Update to pre-regression validation gate in `development_rules.md` to include a contrast/color check
- Any necessary Page Object Model (POM) additions in `TripPage.ts` to support the new test

**Out of scope:**
- Changing the existing CSS fix (already applied and working)
- Modifying the global heading reset rule itself (it serves a valid purpose for non-themed contexts)
- Contrast validation for elements outside `.day-card__banner` (future scope; this change targets the known bug area)
- WCAG full-compliance audit (existing rendering-config.md already states WCAG AA contrast requirements)

**Affected rule files:**
- `rendering-config.md` -- new "Themed Container Rule" in Component Usage Rules section
- `coding_standards.md` -- new CSS architecture sub-rule in Section 4.4
- `development_rules.md` -- new pre-regression validation check (item 12 in Section 3)
- `automation/code/automation_rules.md` -- referenced for test standards (no modification needed; tests must comply with existing rules)

---

## 3. Requirements

### REQ-001: Themed Container Rule (Development Rule)

**Description:** Codify a mandatory development rule that prevents CSS color inheritance bugs inside themed containers. The rule states: any element inside a color-themed container (gradient background, solid colored background, or any container that sets an explicit `color` different from the default text color) that uses a semantic HTML tag (`h1`-`h6`, `p`, `a`, `span` with text) MUST have an explicit `color` declaration in its own CSS class. Developers and AI agents must never rely on CSS `color` inheritance inside themed containers because global resets for semantic elements will override inherited color due to higher specificity.

**Acceptance Criteria:**
- [ ] AC-1: `rendering-config.md` contains a new "Themed Container Rule" subsection under "Component Usage Rules" that states the rule with: (a) which containers qualify as "themed" (gradient background, solid colored background with non-default text color), (b) which child elements require explicit color (any using semantic HTML tags h1-h6, p, a), (c) the reason (global resets override inherited color), (d) an example showing the `.day-card__banner` / `.day-card__banner-title` pattern as the canonical case.
- [ ] AC-2: `coding_standards.md` Section 4.4 (CSS Architecture) contains a corresponding rule or cross-reference to the themed container rule, with a concrete "Allowed / Forbidden" example showing explicit color declaration vs. relying on inheritance.
- [ ] AC-3: The rule text is language-agnostic -- it references CSS class names and patterns, not any natural language content.

**Priority:** Must-have

**Affected components:**
- `rendering-config.md` -- Component Usage Rules section
- `coding_standards.md` -- Section 4.4 CSS Architecture

---

### REQ-002: Banner Contrast Regression Test

**Description:** Add a Playwright regression test that validates the computed text color of all child text elements inside every `.day-card__banner` is a light color (relative luminance > 0.7). This catches any CSS specificity bug that silently reverts banner text to a dark color. The test must be fully language-agnostic and trip-agnostic: it validates computed CSS properties, not text content.

**Acceptance Criteria:**
- [ ] AC-1: A new test exists in `automation/code/tests/regression/` (e.g., `banner-contrast.spec.ts`) that iterates over every `.day-card__banner` in the generated HTML.
- [ ] AC-2: For each banner, the test asserts that the computed `color` CSS property of `.day-card__banner-title` and `.day-card__banner-date` elements has a relative luminance greater than 0.7 (i.e., the text is light/white, not dark).
- [ ] AC-3: The luminance calculation follows the standard sRGB relative luminance formula: `L = 0.2126 * R + 0.7152 * G + 0.0722 * B` where R, G, B are linearized from the 0-255 range.
- [ ] AC-4: The test uses `expect.soft()` with descriptive messages including the day number (e.g., `Day ${i}: banner title color should be light`), following the batched assertion pattern from `automation_rules.md` Section 6.3.
- [ ] AC-5: The test imports from the `shared-page` fixture (read-only DOM inspection, no interactions).
- [ ] AC-6: The test contains no hardcoded natural language strings -- it identifies elements by CSS class selectors only, complying with `coding_standards.md` Section 1 and `automation_rules.md` Section 7.
- [ ] AC-7: All DOM selectors used in the test are defined in `TripPage.ts` (Page Object Model), not directly in the spec file.
- [ ] AC-8: The test passes on the current (fixed) HTML and would have failed on the pre-fix HTML where `.day-card__banner-title` had dark text.

**Priority:** Must-have

**Affected components:**
- `automation/code/tests/regression/` -- new spec file
- `automation/code/tests/pages/TripPage.ts` -- new locator methods for banner text elements (if not already present)
- `automation/code/tests/utils/` -- luminance utility function (if extracted)

---

### REQ-003: Pre-Regression Validation Gate Update

**Description:** Extend the pre-regression validation checklist in `development_rules.md` Section 3 with a new check that verifies themed container elements have explicit `color` declarations in the inlined CSS. This is a static text search (grep) on the generated HTML, not a runtime Playwright check -- it catches missing declarations before the full test suite runs.

**Acceptance Criteria:**
- [ ] AC-1: `development_rules.md` Section 3 "Pre-Regression Validation Gate" contains a new checklist item (item 12) that verifies: for known themed containers (`.day-card__banner`), child text-bearing classes (`.day-card__banner-title`, `.day-card__banner-date`) have an explicit `color:` declaration in the inlined `<style>` block.
- [ ] AC-2: The check is described as a grep/regex operation on the generated HTML's `<style>` block, consistent with the existing validation approach (items 1-11 are all grep-based checks).
- [ ] AC-3: The check description includes guidance on how to extend it when new themed containers are added in the future.

**Priority:** Should-have

**Affected components:**
- `development_rules.md` -- Section 3 validation checklist

---

## 4. Dependencies & Risks

| Dependency / Risk | Mitigation |
|---|---|
| `TripPage.ts` may need new locator methods for banner child elements | Dev phase will add any missing locators; SA review validates POM contract |
| Luminance threshold (0.7) may need tuning for dark mode where `--color-text-inverse` maps to `#1C1C1E` | Test should evaluate against the actual theme context; in dark mode the banner gradient may also change. Initial implementation targets light mode; dark mode handling documented as future enhancement |
| Adding item 12 to the pre-regression gate must not break existing validation scripts | The gate is a manual checklist of grep commands, not an automated script -- adding an item has no execution risk |
| New spec file must pass the language-independence lint guard | AC-6 of REQ-002 explicitly requires no hardcoded language strings; QA-A review will verify |
| Rule must cover future themed containers beyond `.day-card__banner` | REQ-001 AC-1 requires the rule to be generic (any themed container), while REQ-002 test scope is limited to `.day-card__banner` (known risk area). Future containers can be added to the test incrementally |

---

## 5. Acceptance Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| PM | Product Manager | 2026-03-28 | Approved |
