# Coding Standards

This document defines coding standards for the Budapest Travel Planner project. All code contributions — whether by humans or AI agents — must follow these standards. Code reviews validate compliance.

For domain-specific rules, each section references its **authoritative source** — the file where the canonical definition lives. This file provides TypeScript conventions, code examples, and review checklists that supplement those sources.

---

## 1. Language Independence

> **Authoritative source:** `automation_rules.md` §7 (full specification: §7.1–7.4, enforcement, exceptions)

All code must be language-agnostic. The trip generator produces output in multiple languages. No logic may depend on a specific language.

**Quick reference — allowed vs. forbidden:**

| Layer | Allowed | Forbidden |
|---|---|---|
| Test selectors | CSS classes, IDs, `data-*` attributes | `hasText('Запасной план')`, text-based filtering |
| Test assertions | Values from `trip-config.ts` / `language-config.ts` | Hardcoded strings in any human language |
| Page Object (TripPage.ts) | `.locator('.poi-card')`, `#day-${n}` | `.locator(':has-text("Day 1")')` |
| HTML generation | `data-section-type="plan-b"`, class-based semantics | Language-specific `id` or class names |
| File naming | `day_01_${langCode}.md`, `trip_full_${suffix}.html` | `day_01_russian.md`, `trip_full.html` |

**Localized strings** live in exactly two files: `trip-config.ts` (`LANGUAGE_LABELS`) and `language-config.ts` (`SCRIPT_MAP`). To add a new language: add one entry to `LANGUAGE_LABELS` — no spec files change.

**Automated enforcement:** `language-independence.spec.ts` lint guard runs as part of regression. Violations fail the build.

---

## 2. TypeScript Standards

### 2.1 General Style

- **Strict typing** — Use explicit types for function signatures, interfaces, and exported values. Avoid `any`.
- **`const` by default** — Use `const` for all declarations unless reassignment is necessary; then use `let`. Never use `var`.
- **Named exports** — Prefer named exports over default exports for discoverability.
- **Readonly properties** — Mark class fields that are assigned once as `readonly` (see TripPage pattern).

```typescript
// ✅ Good
export interface TripConfig {
  readonly destination: string;
  readonly dayCount: number;
}

// ❌ Bad
export default function loadConfig(): any { ... }
```

### 2.2 Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Files | `kebab-case.ts` | `trip-config.ts`, `shared-page.ts` |
| Spec files | `kebab-case.spec.ts` | `day-cards.spec.ts`, `poi-cards.spec.ts` |
| Interfaces | `PascalCase` | `TripConfig`, `LanguageLabels`, `LanguageValidator` |
| Classes | `PascalCase` | `TripPage`, `IntakePage` |
| Functions | `camelCase` | `loadTripConfig()`, `getDaySection()` |
| Constants (module-level) | `UPPER_SNAKE_CASE` | `LANGUAGE_LABELS`, `SCRIPT_MAP`, `ALLOWED_FILES` |
| Local variables | `camelCase` | `tripConfig`, `dayCount`, `bannerTitle` |
| Test IDs | `TC-###` prefix when tracking | `TC-154: non-exempt POI cards should have 3 or 4 link types` |
| Environment variables | `UPPER_SNAKE_CASE` | `TRIP_DETAILS_FILE`, `TRIP_HTML_OVERRIDE` |

### 2.3 Imports

- Group imports in order: (1) external packages, (2) project utilities, (3) page objects, (4) fixtures.
- Use `type` imports when importing only types.

```typescript
// ✅ Good
import { test, expect } from '../fixtures/shared-page';
import { type Page, type Locator } from '@playwright/test';
import { loadTripConfig } from '../utils/trip-config';
```

### 2.4 Error Handling

- **Fail fast with clear messages** — When config is missing or invalid, throw with actionable context:

```typescript
// ✅ Good — says what's wrong AND how to fix it
if (!labels) {
  throw new Error(
    `No label mapping for reporting language "${reportingLanguage}". ` +
    `Add an entry to LANGUAGE_LABELS in trip-config.ts. ` +
    `Supported: ${Object.keys(LANGUAGE_LABELS).join(', ')}`
  );
}

// ❌ Bad — opaque
if (!labels) throw new Error('Invalid language');
```

- **No silent fallbacks for required data** — If a field is mandatory (arrival date, departure date, POI languages), throw rather than defaulting to a placeholder.

### 2.5 Comments

- **JSDoc** on exported functions and classes — describe purpose, not implementation.
- **Section markers** (`// --- Header ---`) in classes with many properties to aid navigation.
- **Contract comments** at top of utility files explaining the module's invariants.
- **Inline comments** only for non-obvious logic. If code needs a comment to explain *what* it does, consider renaming instead.
- **No trailing summaries** — Don't comment what the next line obviously does.

```typescript
// ✅ Good — explains the WHY
// Uses data-section-type attribute — language-independent, no name-based exclusion list.
const planB = sharedPage.locator(`#day-${i} .advisory--info[data-section-type="plan-b"]`);

// ❌ Bad — restates the code
// Get the plan B locator
const planB = sharedPage.locator(`#day-${i} .advisory--info[data-section-type="plan-b"]`);
```

---

## 3. Playwright Test Standards

> **Authoritative source for policies:** `automation_rules.md` §3 (zero-flakiness), §5 (POM, technology stack), §6 (performance optimization), §7 (language independence), §8 (test resilience)
>
> This section provides practical code examples and file organization conventions that supplement those policies.

### 3.1 File Organization

```
tests/
├── fixtures/         # Custom Playwright fixtures (shared-page, etc.)
├── pages/            # Page Object Model classes
├── utils/            # Shared utilities (trip-config, language-config, markdown-pois)
├── regression/       # Trip HTML regression specs
├── intake/           # Trip intake form specs
└── code-quality/     # Meta-tests (lint guards on test source code)
```

### 3.2 Page Object Model (POM) — Code Examples

```typescript
// ✅ Good — parameterized, language-independent
getDaySection(dayNumber: number): Locator {
  return this.page.locator(`#day-${dayNumber}`);
}

getDayPoiCards(dayNumber: number): Locator {
  return this.page.locator(`#day-${dayNumber} .poi-card`);
}

// ❌ Bad — selector in spec file
test('check POIs', async ({ page }) => {
  const pois = page.locator('#day-1 .poi-card');  // Selector belongs in POM
});
```

**Selector priority** (highest to lowest preference):
1. `id` attributes — `#day-0`, `#overview`, `#budget`
2. `data-*` attributes — `data-section-type="plan-b"`, `data-link-exempt`
3. CSS class selectors — `.poi-card`, `.day-card__banner-title`
4. Structural selectors — `.pricing-grid .pricing-cell`
5. **Never** — text-based selectors (`:has-text()`, `hasText:`)

### 3.3 Fixture Usage — Code Examples

| Fixture | Use When | Import From |
|---|---|---|
| `shared-page` | Read-only DOM assertions (no clicks, scrolls, or navigation) | `../fixtures/shared-page` |
| Standard Playwright `test` | Interactive tests (click, scroll, type, navigate) | `@playwright/test` |

```typescript
// ✅ Read-only test — uses shared fixture (page loaded once per worker)
import { test, expect } from '../fixtures/shared-page';
test('should render all day sections', async ({ tripPage }) => {
  await expect(tripPage.daySections).toHaveCount(tripConfig.dayCount);
});

// ✅ Interactive test — uses standard Playwright (fresh page per test)
import { test, expect } from '@playwright/test';
test('should scroll to section on sidebar click', async ({ page }) => {
  await page.locator('.sidebar__link[href="#day-1"]').click();
  // ...
});
```

### 3.4 Assertions — Code Examples

```typescript
// ✅ Soft assertions for batched per-day validation
for (let i = 0; i < tripConfig.dayCount; i++) {
  test(`Day ${i} should have complete card structure`, async ({ tripPage }) => {
    await expect.soft(bannerTitle, `Day ${i}: banner title visible`).toBeVisible();
    await expect.soft(bannerDate, `Day ${i}: banner date visible`).toBeVisible();
  });
}
```

### 3.5 Data-Driven Tests — Code Examples

```typescript
// ✅ Good — dynamic
const tripConfig = loadTripConfig();
for (let i = 0; i < tripConfig.dayCount; i++) {
  test(`Day ${i} should ...`, async ({ tripPage }) => { ... });
}

// ❌ Bad — hardcoded
for (let i = 0; i < 4; i++) {  // Why 4? What if the trip changes?
  test(`Day ${i} should ...`, async ({ tripPage }) => { ... });
}
```

### 3.6 Test Naming

```
test.describe('Category — Subcategory', () => {
  test('should [expected behavior]', ...);
  test('TC-###: should [expected behavior]', ...);  // When tracking a specific test case
});
```

Pattern: `test.describe` groups by feature area. Individual tests use `should` phrasing. Include `TC-###` prefix only when the test maps to a tracked test case ID.

---

## 4. HTML Generation Standards

> **Authoritative sources:**
> - `development_rules.md` §1 — DOM contract (CSS class/ID → HTML element mapping from TripPage.ts locators)
> - `rendering-config.md` — Design system, component structure, themed container rule, SVG requirements
> - `rendering-config.md` §2.5 — Agent Prompt Contract (9-item checklist for delegated HTML generation)

**Key code examples** (supplementing the authoritative sources):

```html
<!-- ✅ Good — machine-readable, language-independent -->
<div class="advisory advisory--info" data-section-type="plan-b">

<!-- ❌ Bad — relies on text content for identification -->
<div class="advisory">🅱️ Запасной план</div>
```

Use `data-link-exempt` on POI cards that legitimately have fewer than the standard link count (e.g., grocery stores, along-the-way stops).

**Accessibility checklist:**
- `lang` attribute on `<html>` matching `langCode` from trip config
- `dir="rtl"` on `<html>` for RTL languages
- `aria-current="page"` on active navigation link
- `role="img"` + `aria-label` on semantic SVGs (e.g., country flags)
- Inline SVG icons — use Feather-style SVGs, never emoji for icons that need to render consistently

**Self-contained output:** Generated `trip_full_*.html` files must embed all CSS in `<style>` and all icons as inline SVGs. No external `<link>` or `<script src>` — **exception:** Google Fonts `<link>` tags are allowed.

---

## 5. File & Folder Conventions

> **Authoritative source for trip folders:** `content_format_rules.md` §Trip Folder Structure (naming rules, language suffixes, manifest schema)

### Test File Organization

| Path | Purpose | Naming |
|---|---|---|
| `tests/regression/*.spec.ts` | Trip HTML regression tests | `{feature}.spec.ts` |
| `tests/intake/*.spec.ts` | Intake form tests | `intake-{feature}.spec.ts` |
| `tests/code-quality/*.spec.ts` | Meta-tests / lint guards | `{guard-name}.spec.ts` |
| `tests/pages/*.ts` | Page Object classes | `{PageName}.ts` (PascalCase) |
| `tests/utils/*.ts` | Shared utilities | `{utility-name}.ts` (kebab-case) |
| `tests/fixtures/*.ts` | Playwright fixtures | `{fixture-name}.ts` (kebab-case) |

### Config / Rule Files

| File | Governs |
|---|---|
| `trip_planning_rules.md` | Trip content generation logic |
| `content_format_rules.md` | Output file format, phase A/B, assembly |
| `development_rules.md` | HTML generation contract, test sync, change impact |
| `rendering-config.md` | Design tokens, component specs, rendering pipeline |
| `rendering_style_config.css` | CSS source of truth (design tokens, component styles) |
| `automation_rules.md` | Test automation policies, flakiness rules |
| `base_layout.html` | HTML template shell |

**Rule files are not documentation** — they are executable specifications. Changes to rule files trigger the development cycle.

---

## 6. Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `TRIP_DETAILS_FILE` | Override trip details filename | `trip_details.md` |
| `TRIP_HTML_OVERRIDE` | Override HTML file path for regression | Auto-discovered latest |
| `TRIP_RTL_HTML` / `TRIP_LTR_HTML` | Secondary direction HTML | None (project omitted) |
| `CI` | CI environment flag (affects retries, workers) | Not set |

---

## 7. Code Review Checklist

Every code review (human or AI) must verify:

### Language Independence (see `automation_rules.md` §7)
- [ ] No hardcoded strings in any human language (outside `trip-config.ts` / `language-config.ts`)
- [ ] No text-based selectors (`hasText`, `:has-text()`) in POM or spec files
- [ ] No hardcoded filenames (`trip_full_ru.html`) — derive from config
- [ ] New language support requires changes in `LANGUAGE_LABELS` only

### Test Quality (see `automation_rules.md` §3, §5, §6)
- [ ] All selectors defined in Page Object classes, not in spec files
- [ ] Read-only tests use `shared-page` fixture; interactive tests use standard `@playwright/test`
- [ ] Soft assertions include descriptive failure messages with context (day number, POI name)
- [ ] No `page.waitForTimeout()` (except justified IntersectionObserver settle, max 300ms)
- [ ] Data-driven tests use `tripConfig` values, not hardcoded counts or strings
- [ ] New spec file would pass the language-independence lint guard

### HTML Output (see `rendering-config.md`, `development_rules.md` §1)
- [ ] All testable elements have correct CSS classes and IDs per DOM contract
- [ ] Semantic `data-*` attributes used for classification (not text content)
- [ ] HTML is self-contained (no external links/scripts except Google Fonts)
- [ ] Dark mode works (`prefers-color-scheme: dark` overrides are complete)
- [ ] RTL layout works when `dir="rtl"` is set

### Code Style (see §2 above)
- [ ] `readonly` on class fields assigned only in constructor
- [ ] `const` by default, `let` only when reassignment needed
- [ ] Explicit types on exported functions and interfaces
- [ ] Error messages are actionable (state what's wrong + how to fix)
- [ ] No dead code, commented-out blocks, or `TODO` without a linked issue

### Architecture
- [ ] Changes to rule files trigger the development cycle
- [ ] New test utility files follow kebab-case naming
- [ ] Config values that differ per language go in `LANGUAGE_LABELS`, not in spec files
- [ ] Manifest updated when trip content changes

---

## 8. Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Do Instead |
|---|---|---|
| Hardcoded day count (`for i < 4`) | Breaks when trip length changes | Use `tripConfig.dayCount` |
| Selector in spec file | Duplicates POM, drifts over time | Add method to `TripPage.ts` |
| `page.waitForTimeout(5000)` | Flaky, wastes time | Web-first assertion (`await expect(...).toBeVisible()`) |
| `hasText('День')` in POM | Fails for non-Russian trips | Use `data-*` attribute or CSS class |
| External CSS `<link>` in HTML | Trip file not portable | Inline all CSS in `<style>` |
| `any` type | Defeats TypeScript safety | Define proper interface |
| Emoji for functional icons | Renders inconsistently cross-platform | Inline SVG with `role="img"` |
| Silent fallback for missing data | Hides bugs, produces wrong output | `throw new Error(...)` with context |
| Amending POM for one test | Pollutes shared class | Consider if test is asserting the right thing |
| Hardcoded file path in test | Breaks with different trip or env | Use `loadTripConfig()` + auto-discovery |
