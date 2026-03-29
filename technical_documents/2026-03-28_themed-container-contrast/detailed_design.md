# Detailed Design

**Change:** Themed Container Contrast Rule & Regression Test
**Date:** 2026-03-28
**Author:** Development Team
**HLD Reference:** `technical_documents/2026-03-28_themed-container-contrast/high_level_design.md`
**Status:** Draft

---

## 1. File Changes

### 1.1 `rendering-config.md`

**Action:** Modify

**Current state:**
```markdown
### Banner Titles
- Use emoji in `day-card__banner-title` (e.g., `День 1 — Остров Маргит 🏊`)

### SVG Requirements (Consolidated)
```

**Target state:**
```markdown
### Banner Titles
- Use emoji in `day-card__banner-title` (e.g., `День 1 — Остров Маргит 🏊`)

### Themed Container Rule (Mandatory)

A **themed container** is any element that meets BOTH conditions:
1. It has a gradient background, solid colored background, or any background that is visually distinct from the default page background.
2. It sets an explicit `color` on itself (or inherits a non-default text color from its parent) that differs from `var(--color-text-primary)`.

**Known themed containers:** `.day-card__banner` (gradient background + `color: var(--color-text-inverse)`).

**Rule:** Every child element inside a themed container that uses a semantic HTML tag (`h1`-`h6`, `p`, `a`, `span` containing visible text) **MUST** have an explicit `color` declaration in its own CSS class. Do NOT rely on CSS `color` inheritance inside themed containers.

**Reason:** Global CSS resets (e.g., `h1, h2, h3, h4, h5, h6 { color: var(--color-text-primary) }`) target semantic tags with higher specificity than inherited `color` from a parent class. This causes child text to silently revert to the default dark color on a colored/gradient background, producing unreadable text.

**Canonical example — `.day-card__banner`:**

```css
/* Parent sets color on the container */
.day-card__banner {
  background: linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-accent-alt));
  color: var(--color-text-inverse);
}

/* REQUIRED: children must set color explicitly */
.day-card__banner-title {
  color: var(--color-text-inverse);  /* Explicit — survives global h2 reset */
}

.day-card__banner-date {
  /* Inherits from .day-card__banner — safe because <span> is not targeted by the heading reset */
  /* But if this were an <h3> or <p>, it would need explicit color */
}
```

**When adding new themed containers:** Apply this rule to all child text elements. Add the new container to the "Known themed containers" list above, and extend the pre-regression validation gate (item 12 in `development_rules.md` Section 3) to include the new container's child classes.

### SVG Requirements (Consolidated)
```

**Rationale:** Satisfies REQ-001 AC-1 — defines what qualifies as a "themed container," which children need explicit color, why, and provides the canonical `.day-card__banner` example. The rule is fully language-agnostic (references CSS class names only).

---

### 1.2 `coding_standards.md`

**Action:** Modify

**Current state (Section 4.4 CSS Architecture, after the last bullet):**
```markdown
- **Responsive** — Mobile breakpoint at `768px`. Sidebar hidden on mobile, pill nav shown instead.
```

**Target state:**
```markdown
- **Responsive** — Mobile breakpoint at `768px`. Sidebar hidden on mobile, pill nav shown instead.
- **Themed container contrast** — Inside any container with a gradient or colored background that sets a non-default text `color` (e.g., `.day-card__banner`), every child element using a semantic tag (`h1`-`h6`, `p`, `a`) MUST have an explicit `color` declaration. Never rely on `color` inheritance — global tag resets override it. See `rendering-config.md` → "Themed Container Rule" for the full specification.

  ```css
  /* Allowed — explicit color on child */
  .day-card__banner-title {
    color: var(--color-text-inverse);
  }

  /* Forbidden — relying on inheritance from .day-card__banner */
  .day-card__banner-title {
    /* no color declaration — global h1-h6 reset overrides inherited color */
  }
  ```
```

**Rationale:** Satisfies REQ-001 AC-2 — adds the rule to Section 4.4 with concrete "Allowed / Forbidden" examples. Cross-references rendering-config.md for the full specification. Language-agnostic (satisfies AC-3).

---

### 1.3 `development_rules.md`

**Action:** Modify

**Current state (Section 3 validation checklist, ends at item 11):**
```
11. Activity label links:      POI-referencing .activity-label elements are <a> with href matching a .poi-card id
```

**Target state:**
```
11. Activity label links:      POI-referencing .activity-label elements are <a> with href matching a .poi-card id
12. Themed container contrast: For known themed containers (.day-card__banner), verify that child text-bearing
    classes (.day-card__banner-title, .day-card__banner-date) have an explicit `color:` declaration in the
    inlined <style> block. Regex: for each class, search the <style> content for
    `\.day-card__banner-title\s*\{[^}]*color\s*:` and `\.day-card__banner-date\s*\{[^}]*color\s*:`
    (or confirm the parent rule's color is inherited for non-semantic-tag elements like <span>).
    When new themed containers are added, extend this check with their child class names —
    see rendering-config.md "Themed Container Rule" for the maintained list.
```

**Rationale:** Satisfies REQ-003 AC-1 (new item 12 in the checklist), AC-2 (described as a grep/regex on `<style>`), and AC-3 (includes guidance on extending for future containers).

---

### 1.4 `automation/code/tests/utils/color-utils.ts`

**Action:** Create

**Target state:**
```typescript
/**
 * Color utility functions for contrast validation.
 *
 * Provides sRGB relative luminance calculation per WCAG 2.1 specification.
 * No Playwright dependency — pure math functions.
 */

/**
 * Parse an `rgb(R, G, B)` or `rgba(R, G, B, A)` string into [R, G, B] (0-255).
 * Throws if the format is unrecognized.
 */
export function parseRgb(colorString: string): [number, number, number] {
  const match = colorString.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/
  );
  if (!match) {
    throw new Error(
      `Cannot parse color string "${colorString}". ` +
      `Expected format: rgb(R, G, B) or rgba(R, G, B, A).`
    );
  }
  return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
}

/**
 * Linearize an sRGB channel value (0-255) to the 0-1 linear range.
 * Applies the sRGB inverse companding function.
 */
function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Calculate relative luminance of an sRGB color per WCAG 2.1.
 *
 * Formula: L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 * where R, G, B are linearized sRGB values.
 *
 * @returns Luminance in [0, 1]. White (#FFFFFF) = 1.0, Black (#000000) = 0.0.
 */
export function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}
```

**Rationale:** Extracted as a shared utility (not inlined in the spec) following the `tests/utils/` kebab-case naming convention. Pure functions with no Playwright dependency. The `parseRgb` function handles the `rgb(R, G, B)` format returned by Playwright's `evaluate(el => getComputedStyle(el).color)`. Satisfies REQ-002 AC-3 (standard sRGB luminance formula).

---

### 1.5 `automation/code/tests/pages/TripPage.ts`

**Action:** Modify

**Current state:**
The POM already has `getDayBannerTitle(dayNumber)` and `getDayBannerDate(dayNumber)` methods that return locators for `.day-card__banner-title` and `.day-card__banner-date` scoped to `#day-{N}`.

**Target state:**
No POM changes needed for locators -- the existing methods return exactly the locators needed. However, the spec also needs a locator for all `.day-card__banner` elements to iterate over banners generically. The existing `dayBanners` property (`this.page.locator('.day-card__banner')`) already provides this.

Add one new convenience method for the contrast test to get the banner element scoped to a specific day:

```typescript
// --- Banner (contrast validation) ---

getDayBanner(dayNumber: number): Locator {
  return this.page.locator(`#day-${dayNumber} .day-card__banner`);
}
```

**Insertion point:** After the `getDayBannerDate` method (currently line 118), add the new method.

**Rationale:** Satisfies REQ-002 AC-7 -- all DOM selectors used by the spec are defined in TripPage.ts. The spec will use `getDayBannerTitle(n)`, `getDayBannerDate(n)`, and `getDayBanner(n)` -- all POM methods.

---

### 1.6 `automation/code/tests/regression/banner-contrast.spec.ts`

**Action:** Create

**Target state:**
```typescript
import { test, expect } from '../fixtures/shared-page';
import { loadTripConfig } from '../utils/trip-config';
import { parseRgb, relativeLuminance } from '../utils/color-utils';

const tripConfig = loadTripConfig();

/**
 * Minimum relative luminance threshold for banner text elements.
 * Value 0.7 ensures text is visibly light/white on the dark gradient background.
 * White (#FAFAFA) has luminance ~0.95; the global reset dark color (#1C1C1E) has ~0.012.
 */
const MIN_LUMINANCE = 0.7;

test.describe('Banner Contrast — Themed Container Validation', () => {
  for (let i = 0; i < tripConfig.dayCount; i++) {
    test(`Day ${i} banner text should have light color (luminance > ${MIN_LUMINANCE})`, async ({ tripPage }) => {
      // Validate banner title computed color
      const titleElement = tripPage.getDayBannerTitle(i);
      const titleCount = await titleElement.count();

      if (titleCount > 0) {
        const titleColor = await titleElement.evaluate(
          (el) => getComputedStyle(el).color
        );
        const [tr, tg, tb] = parseRgb(titleColor);
        const titleLuminance = relativeLuminance(tr, tg, tb);
        expect.soft(
          titleLuminance,
          `Day ${i}: banner title color ${titleColor} luminance should be > ${MIN_LUMINANCE}`
        ).toBeGreaterThan(MIN_LUMINANCE);
      }

      // Validate banner date computed color
      const dateElement = tripPage.getDayBannerDate(i);
      const dateCount = await dateElement.count();

      if (dateCount > 0) {
        const dateColor = await dateElement.evaluate(
          (el) => getComputedStyle(el).color
        );
        const [dr, dg, db] = parseRgb(dateColor);
        const dateLuminance = relativeLuminance(dr, dg, db);
        expect.soft(
          dateLuminance,
          `Day ${i}: banner date color ${dateColor} luminance should be > ${MIN_LUMINANCE}`
        ).toBeGreaterThan(MIN_LUMINANCE);
      }
    });
  }
});
```

**Rationale:**
- Satisfies REQ-002 AC-1: New spec in `regression/` directory, iterates over every `.day-card__banner`.
- Satisfies REQ-002 AC-2: Asserts computed `color` luminance > 0.7 for both `.day-card__banner-title` and `.day-card__banner-date`.
- Satisfies REQ-002 AC-3: Uses `relativeLuminance` from `color-utils.ts` (standard sRGB formula).
- Satisfies REQ-002 AC-4: Uses `expect.soft()` with descriptive messages including day number.
- Satisfies REQ-002 AC-5: Imports from `shared-page` fixture (read-only DOM inspection).
- Satisfies REQ-002 AC-6: No hardcoded natural language strings -- elements identified by CSS class selectors only.
- Satisfies REQ-002 AC-7: All selectors via POM (`getDayBannerTitle`, `getDayBannerDate`).
- Satisfies REQ-002 AC-8: On the fixed HTML, `color: var(--color-text-inverse)` resolves to `#FAFAFA` (luminance ~0.95) -- passes. On pre-fix HTML, the heading reset would produce `#1C1C1E` (luminance ~0.012) -- fails.

---

## 2. Markdown Format Specification

N/A -- this change does not introduce new markdown sections or modify the trip day file format.

---

## 3. HTML Rendering Specification

N/A -- this change does not modify HTML output. The CSS fix is already applied. The new rule documents existing behavior to prevent regression.

---

## 4. Rule File Updates

| Rule File | Section | Change |
|---|---|---|
| `rendering-config.md` | Component Usage Rules, after "Banner Titles" | New "Themed Container Rule (Mandatory)" subsection |
| `coding_standards.md` | Section 4.4 CSS Architecture | New bullet "Themed container contrast" with Allowed/Forbidden examples |
| `development_rules.md` | Section 3 Validation Checklist | New item 12 "Themed container contrast" grep check |

---

## 5. Implementation Checklist

- [ ] Add "Themed Container Rule (Mandatory)" subsection to `rendering-config.md` after "Banner Titles"
- [ ] Add "Themed container contrast" bullet to `coding_standards.md` Section 4.4
- [ ] Add item 12 to `development_rules.md` Section 3 validation checklist
- [ ] Create `automation/code/tests/utils/color-utils.ts` with `parseRgb` and `relativeLuminance`
- [ ] Add `getDayBanner(dayNumber)` method to `TripPage.ts`
- [ ] Create `automation/code/tests/regression/banner-contrast.spec.ts`
- [ ] Run the new spec against current HTML to confirm it passes
- [ ] Verify the spec would fail by temporarily removing the explicit color from `.day-card__banner-title` (manual verification during development)
- [ ] Update `automation/code/release_notes.md` with the change

---

## 6. BRD Traceability

| Requirement | Acceptance Criterion | Implemented in |
|---|---|---|
| REQ-001 | AC-1: rendering-config.md themed container subsection | `rendering-config.md` : "Themed Container Rule (Mandatory)" subsection (Section 1.1) |
| REQ-001 | AC-2: coding_standards.md Section 4.4 rule | `coding_standards.md` : Section 4.4, new "Themed container contrast" bullet (Section 1.2) |
| REQ-001 | AC-3: Language-agnostic rule text | Both rule additions reference CSS class names only, no natural language content |
| REQ-002 | AC-1: New spec in regression/ | `automation/code/tests/regression/banner-contrast.spec.ts` (Section 1.6) |
| REQ-002 | AC-2: Luminance assertion for title and date | `banner-contrast.spec.ts` : `expect.soft(titleLuminance, ...).toBeGreaterThan(0.7)` per day (Section 1.6) |
| REQ-002 | AC-3: Standard sRGB luminance formula | `automation/code/tests/utils/color-utils.ts` : `relativeLuminance()` (Section 1.4) |
| REQ-002 | AC-4: Soft assertions with day context | `banner-contrast.spec.ts` : `expect.soft(value, 'Day ${i}: ...')` (Section 1.6) |
| REQ-002 | AC-5: shared-page fixture | `banner-contrast.spec.ts` : `import { test, expect } from '../fixtures/shared-page'` (Section 1.6) |
| REQ-002 | AC-6: No hardcoded language strings | `banner-contrast.spec.ts` : CSS selectors only, no text matching (Section 1.6) |
| REQ-002 | AC-7: All selectors in TripPage.ts | Uses `getDayBannerTitle(n)`, `getDayBannerDate(n)` from POM (Sections 1.5, 1.6) |
| REQ-002 | AC-8: Passes on fixed HTML, fails on pre-fix | `#FAFAFA` luminance ~0.95 > 0.7 (pass); `#1C1C1E` luminance ~0.012 < 0.7 (fail) (Section 1.6) |
| REQ-003 | AC-1: New checklist item 12 | `development_rules.md` : Section 3, item 12 (Section 1.3) |
| REQ-003 | AC-2: Grep/regex based check | Item 12 specifies regex patterns on `<style>` block (Section 1.3) |
| REQ-003 | AC-3: Extensibility guidance | Item 12 includes note: "When new themed containers are added, extend this check" (Section 1.3) |
