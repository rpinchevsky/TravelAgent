# Detailed Design

**Change:** Google Places MCP Integration — POI Enrichment, Phone/Rating Fields, Wheelchair Accessibility Question
**Date:** 2026-03-23
**Author:** Development Team
**HLD Reference:** high_level_design.md
**Status:** Draft

---

## 1. File Changes

### 1.1 `.mcp.json` (Project Root)
**Action:** Create
**Current state:** File does not exist.
**Target state:** MCP configuration registering the Google Places MCP server.
**Rationale:** Claude Code reads `.mcp.json` from the project root to discover available MCP tool servers. This file tells Claude Code how to start the Google Places server and what environment variables it needs.

```json
{
  "mcpServers": {
    "google-places": {
      "command": "npx",
      "args": ["-y", "@anthropic/google-places-mcp-server"],
      "env": {
        "GOOGLE_PLACES_API_KEY": "${GOOGLE_PLACES_API_KEY}"
      }
    }
  }
}
```

**Notes:**
- The `GOOGLE_PLACES_API_KEY` environment variable must be set in the user's shell environment before starting Claude Code. It is never committed to the repository.
- The server package name may differ based on what is available at implementation time. The implementation phase must verify the correct package name and adjust accordingly. If no maintained MCP server package exists, a minimal wrapper can be created.
- The server must expose at minimum `search_places` and `get_place_details` tools.

### 1.2 `trip_planning_rules.md`
**Action:** Modify
**Current state:** Contains sections for Pre-Flight Setup, Strategic Planning Logic, Environmental & Event Intelligence, Research & Quality Control, and Technical Instruction. No mention of Google Places, phone numbers, ratings, or wheelchair accessibility.
**Target state:** Three additions:

#### Addition 1: New section "Data Source Hierarchy" (after "Pre-Flight Setup", before "Strategic Planning Logic")

```markdown
---

## Data Source Hierarchy

The trip generation pipeline uses a two-layer data source approach for POI details:

### Layer 1: Web Search & Fetch (Primary)
- Web search discovers POIs, gets narrative descriptions, pro-tips, and family-specific context.
- Web fetch retrieves official websites, photo galleries, and pricing.
- This layer provides the creative and contextual content that makes each POI description unique.

### Layer 2: Google Places API (Enrichment & Validation)
- After web fetch, query Google Places for each POI using `search_places(name, location)` → `get_place_details(place_id)`.
- Google Places provides structured fields: **phone number**, **rating** (with review count), **wheelchair accessibility**, verified hours, verified website URL.
- **Precedence rule:** For structured fields (hours, website URL, phone, rating), Google Places data takes precedence over web fetch when both are available.
- **Scope limitation:** Google Places does NOT replace web fetch for narrative content (descriptions, pro-tips, family-specific notes, photo gallery links) — only for structured fields.
- **Graceful degradation:** If Google Places MCP is not configured or a place is not found, the pipeline continues with web fetch data only. Phone and rating fields are omitted (not rendered as empty).
```

#### Addition 2: Update "Universal Location Standards" equivalent content (inside "Per-Day Content Requirements" if referenced, or as part of the Research section)

Add to the **Research & Quality Control → Live Verification** section, after the existing bullets:

```markdown
- **Google Places Enrichment (Mandatory per POI):** After web-fetching a POI, query Google Places to collect:
  - **Phone number:** Include in the POI card when available (see content_format_rules.md for format).
  - **Rating:** Numeric rating out of 5 with review count. Include in the POI card when available.
  - **Wheelchair accessibility:** When `wheelchair accessible: yes` is set in trip details, verify each POI's accessibility via Google Places. Accessible POIs receive a `♿` indicator. Inaccessible POIs must be replaced with accessible alternatives or explicitly flagged with a warning note.
```

#### Addition 3: Update "CEO Audit" checklist

Add after the existing POI Parity Check item:

```markdown
- [ ] If `wheelchair accessible: yes` is set in trip details: are all POIs verified for wheelchair accessibility? Are inaccessible POIs flagged or replaced?
```

### 1.3 `content_format_rules.md`
**Action:** Modify
**Current state:** Section "Per-Day Content Requirements" → "3. Universal Location Standards" lists: Google Maps link, Official Website link, Photo Gallery link.
**Target state:** Add phone number and rating as required fields (with "when available" qualifier).

#### Update §3 Universal Location Standards

Add two new bullet points after "Photo Gallery":

```markdown
- **Phone number**: When available (sourced from Google Places or web fetch). Format: `📞 {localized_label}: {phone_number}` — the label is language-dependent (e.g., "Телефон" in Russian, "Phone" in English).
- **Rating**: When available (sourced from Google Places). Format: `⭐ {rating}/5 ({review_count} {localized_reviews_label})` — e.g., `⭐ 4.5/5 (2,340 отзывов)`.
```

Additionally, add to the POI section template (inside the Per-Day File Format code block), after the photo gallery link pattern and before the description paragraph:

```markdown
📞 Телефон: +36 1 234 5678
⭐ 4.5/5 (2,340 отзывов)
♿ Доступно для колясок
```

The `♿` accessibility line appears only when `wheelchair accessible: yes` is set in the trip details AND the POI is confirmed wheelchair accessible.

### 1.4 `rendering-config.md`
**Action:** Modify
**Current state:** "POI Card Structure" section defines: tag, name, links (Maps, Site, Photo), description, pro-tip. No phone link, no rating display.
**Target state:** Add two new POI card components:

#### Addition 1: Rating display (after "Tag" rule, before "Name" rule)

Add to the POI Card Structure section:

```markdown
- Rating: `<span class="poi-card__rating">` placed between `.poi-card__tag` and `<h3 class="poi-card__name">`. Contains a star icon (⭐ emoji) followed by the numeric rating and optional review count in parentheses. Example: `<span class="poi-card__rating">⭐ 4.5 (2,340)</span>`. If no rating exists in the markdown source, this element is not rendered. The review count uses locale-appropriate number formatting (e.g., comma separators).
```

#### Addition 2: Phone link (extension of existing Links rule)

Update the Links rule to include phone as the 4th link type:

```markdown
- Links: **Emoji prefixes are MANDATORY** in the rendered `<a>` text: `📍 Maps`, `🌐 Сайт`, `📸 Фото`, `📞 Телефон`. The SVG icon is purely decorative; the emoji is part of the visible label and must always appear after the `</svg>` and before the text word.
- **Link order (Mandatory):** Maps, Site, Photo, Phone. Phone link uses `<a href="tel:{number}" class="poi-card__link">` with the phone SVG icon + `📞` emoji + localized label. If no phone number exists in the markdown source, no phone link is rendered (no empty/placeholder link).
```

#### Addition 3: Accessibility indicator

```markdown
- Accessibility indicator: When present in the markdown source (`♿`), render as `<span class="poi-card__accessible">♿</span>` placed after `.poi-card__rating` (or after `.poi-card__tag` if no rating). This is a simple inline badge, not a link.
```

### 1.5 `rendering_style_config.css`
**Action:** Modify
**Current state:** POI card styles exist for `.poi-card__tag`, `.poi-card__name`, `.poi-card__description`, `.poi-card__links`, `.poi-card__link`. No rating or accessibility styles.
**Target state:** Add new CSS rules after `.poi-card__tag svg` (line ~728) and before `.poi-card__name`:

```css
.poi-card__rating {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-brand-accent);
  margin-top: var(--space-1);
}

.poi-card__accessible {
  display: inline-block;
  font-size: var(--text-sm);
  margin-top: var(--space-1);
}
```

### 1.6 `trip_intake.html`
**Action:** Modify
**Current state:** Step 6 contains: Report Language dropdown, POI Languages hint, Extra Notes textarea, and a button bar. No wheelchair question.
**Target state:** Add a new wheelchair accessibility question block in Step 6 between the Extra Notes textarea and the button bar. Also update `generateMarkdown()` to output the new field.

#### HTML Addition: Wheelchair question in Step 6 (insert after the Extra Notes `<div class="field">` block, before the `<div class="btn-bar">`)

```html
<!-- Wheelchair Accessibility (always visible, not depth-gated) -->
<div class="depth-extra-question" data-question-key="wheelchairAccessible">
  <label class="field__label" data-i18n="s6_wheelchair">Does anyone in your group need wheelchair-accessible places?</label>
  <div class="question-options">
    <div class="q-card is-selected" tabindex="0" role="button" data-value="no">
      <div class="q-card__icon">&#9989;</div>
      <div class="q-card__title" data-i18n="s6_wheelchair_no">No Requirement</div>
      <div class="q-card__desc" data-i18n="s6_wheelchair_no_desc">No wheelchair accessibility needed</div>
    </div>
    <div class="q-card" tabindex="0" role="button" data-value="yes">
      <div class="q-card__icon">&#9855;</div>
      <div class="q-card__title" data-i18n="s6_wheelchair_yes">Wheelchair Accessible</div>
      <div class="q-card__desc" data-i18n="s6_wheelchair_yes_desc">All places must be wheelchair accessible</div>
    </div>
  </div>
</div>
```

**Component behavior:**
- Uses the same `.depth-extra-question` container and `.q-card` pattern as Photography/Accessibility in Step 2.
- 2-column layout (not 3) since there are only 2 options. The existing `.question-options` grid handles this naturally — two cards will fill the first row.
- Default selection: "No Requirement" (`data-value="no"`) has `is-selected` class on page load.
- Click behavior: standard q-card radio selection (click selects one, deselects the other) — already handled by the existing event delegation on `.q-card` elements.
- The `data-question-key="wheelchairAccessible"` attribute enables the existing answer extraction pattern.

#### JavaScript Addition: Update `generateMarkdown()` patched function

Inside the `patchGenerateMarkdown` IIFE (around line 6676, after the accessibility prefs.push line), add:

```javascript
// Wheelchair accessible (always-visible Step 6 field, not depth-gated)
const wheelchairEl = document.querySelector('.depth-extra-question[data-question-key="wheelchairAccessible"] .q-card.is-selected');
const wheelchairVal = wheelchairEl ? wheelchairEl.dataset.value : 'no';
prefs.push(`- **Wheelchair accessible:** ${wheelchairVal === 'yes' ? 'yes' : 'no'}`);
```

**Placement in output:** The wheelchair field appears in the "Additional Preferences" section of the generated markdown, after the existing accessibility line. Output example:
```
- **Accessibility needs:** None
- **Wheelchair accessible:** no
```

### 1.7 `trip_intake_rules.md`
**Action:** Modify
**Current state:** Step 6 section lists: Report Language, POI Languages, Additional Notes, Photography (T4), Accessibility (T5). Supplementary Fields table does not include wheelchair. Output Format does not include wheelchair.
**Target state:** Three updates:

#### Update 1: Step 6 table

Add new row to the Step 6 field table:

```markdown
| Wheelchair Accessible | — | 2-option card (supplementary) | Always visible. "No Requirement" (default) / "Wheelchair Accessible Required" |
```

#### Update 2: Supplementary Fields table

Add new row:

```markdown
| wheelchairAccessible | 2-option card | Step 6 |
```

#### Update 3: Output Format

Add to the Additional Preferences section of the output format template, after the `accessibility` line:

```markdown
- **Wheelchair accessible:** {yes|no}
```

### 1.8 `trip_intake_design.md`
**Action:** Modify
**Current state:** "Depth Extra Questions" section describes Photography (T4) and Accessibility (T5) components in Step 6. No wheelchair question.
**Target state:** Add wheelchair question visual spec.

Add after the existing "Depth Extra Questions" section:

```markdown
### Wheelchair Accessibility Question (Step 6)
- Always visible (not depth-gated), placed after Extra Notes textarea
- Uses `.depth-extra-question` container (same styling as Photography/Accessibility depth extras)
- 2-option `.q-card` grid: "No Requirement" (default, ✅ icon) and "Wheelchair Accessible" (♿ icon)
- Cards use compact sizing (`min-height: 140px`) consistent with other Step 6 depth extras
- Default: first option pre-selected with `is-selected` class
- Radio behavior: clicking one deselects the other (existing q-card delegation)
- RTL: grid and text direction flip automatically via existing RTL rules
- i18n keys: `s6_wheelchair`, `s6_wheelchair_no`, `s6_wheelchair_no_desc`, `s6_wheelchair_yes`, `s6_wheelchair_yes_desc`
```

### 1.9 `locales/ui_*.json` (12 files)
**Action:** Modify
**Current state:** No wheelchair-related keys. No POI phone/rating label keys.
**Target state:** Add 5 new keys for the wheelchair question + 2 new keys for POI field labels to all 12 locale files.

#### New keys (English values shown — `locales/ui_en.json`):

```json
"s6_wheelchair": "Does anyone in your group need wheelchair-accessible places?",
"s6_wheelchair_no": "No Requirement",
"s6_wheelchair_no_desc": "No wheelchair accessibility needed",
"s6_wheelchair_yes": "Wheelchair Accessible",
"s6_wheelchair_yes_desc": "All places must be wheelchair accessible"
```

#### Translation policy:
- **Full translations** for: `ui_en.json`, `ui_ru.json`, `ui_he.json` (the 3 fully-translated locales).
- **English fallback** for: `ui_es.json`, `ui_fr.json`, `ui_de.json`, `ui_it.json`, `ui_pt.json`, `ui_zh.json`, `ui_ja.json`, `ui_ko.json`, `ui_ar.json` (the 9 fallback locales).

#### Russian translations (`locales/ui_ru.json`):

```json
"s6_wheelchair": "Нужны ли кому-то из группы места, доступные для инвалидных колясок?",
"s6_wheelchair_no": "Не требуется",
"s6_wheelchair_no_desc": "Доступность для колясок не нужна",
"s6_wheelchair_yes": "Доступные для колясок",
"s6_wheelchair_yes_desc": "Все места должны быть доступны для инвалидных колясок"
```

#### Hebrew translations (`locales/ui_he.json`):

```json
"s6_wheelchair": "האם מישהו בקבוצה זקוק למקומות נגישים לכיסאות גלגלים?",
"s6_wheelchair_no": "אין דרישה",
"s6_wheelchair_no_desc": "לא נדרשת נגישות לכיסאות גלגלים",
"s6_wheelchair_yes": "נגיש לכיסאות גלגלים",
"s6_wheelchair_yes_desc": "כל המקומות חייבים להיות נגישים לכיסאות גלגלים"
```

### 1.10 `automation/code/tests/pages/TripPage.ts`
**Action:** Modify
**Current state:** POI card locators: `poiCards`, `getPoiCardLinks()`, `getPoiCardName()`, `getPoiCardProTip()`. No phone link or rating locators.
**Target state:** Add two new helper methods and one new locator:

```typescript
// In constructor, after poiCards:
readonly poiCardRatings: Locator;
// ...
this.poiCardRatings = page.locator('.poi-card__rating');

// New methods:
getPoiCardRating(poiCard: Locator): Locator {
  return poiCard.locator('.poi-card__rating');
}

getPoiCardPhoneLink(poiCard: Locator): Locator {
  return poiCard.locator('.poi-card__link[href^="tel:"]');
}

getPoiCardAccessibleBadge(poiCard: Locator): Locator {
  return poiCard.locator('.poi-card__accessible');
}
```

### 1.11 `automation/code/tests/pages/IntakePage.ts`
**Action:** Modify
**Current state:** Step 6 locators: `depthExtraQuestions`, `reportLang`. No wheelchair question locator.
**Target state:** Add wheelchair question locator:

```typescript
// In Step 6 section of constructor:
readonly wheelchairQuestion: Locator;
// ...
this.wheelchairQuestion = page.locator('.depth-extra-question[data-question-key="wheelchairAccessible"]');
```

### 1.12 `automation/code/tests/regression/poi-cards.spec.ts`
**Action:** Modify
**Current state:** Tests for POI card names, pro-tips, and 3-link structure (Maps, Site, Photo). No phone or rating assertions.
**Target state:** Add two new test blocks:

```typescript
test('POI cards with phone numbers should use tel: links', async ({ tripPage }) => {
  const phoneLinks = tripPage.page.locator('.poi-card .poi-card__link[href^="tel:"]');
  const count = await phoneLinks.count();
  // Phone links are optional ("when available"), so we only validate structure when present
  for (let i = 0; i < count; i++) {
    const href = await phoneLinks.nth(i).getAttribute('href');
    expect.soft(href, `Phone link ${i}: should start with tel:`).toMatch(/^tel:\+?[\d\s\-()]+$/);
  }
});

test('POI cards with ratings should have .poi-card__rating element', async ({ tripPage }) => {
  const ratings = tripPage.poiCardRatings;
  const count = await ratings.count();
  // Ratings are optional ("when available"), so we only validate structure when present
  for (let i = 0; i < count; i++) {
    const text = await ratings.nth(i).textContent();
    // Rating should contain a number (language-independent check)
    expect.soft(text, `Rating ${i}: should contain a numeric value`).toMatch(/\d/);
  }
});
```

**Key design decision:** These tests validate structural correctness (href pattern, DOM class, numeric content) without asserting that every POI has phone/rating (since they are "when available" fields). This follows the language-independence rule — no hardcoded text in any language.

### 1.13 `automation/code/tests/intake/intake-wheelchair.spec.ts` (New File)
**Action:** Create
**Current state:** No intake tests for wheelchair question.
**Target state:** New spec file with structural tests:

```typescript
import { test, expect } from '@playwright/test';
import { IntakePage } from '../pages/IntakePage';

test.describe('Wheelchair Accessibility Question', () => {
  test('should be visible on Step 6 regardless of depth selection', async ({ page }) => {
    const intake = new IntakePage(page);
    // Navigate to Step 6 (requires filling Steps 0-5 or programmatic navigation)
    // Assert wheelchair question container is visible
    await expect(intake.wheelchairQuestion).toBeVisible();
    // Assert it has exactly 2 option cards
    const options = intake.wheelchairQuestion.locator('.q-card');
    await expect(options).toHaveCount(2);
  });

  test('should default to "no" option selected', async ({ page }) => {
    const intake = new IntakePage(page);
    // Navigate to Step 6
    const selectedCard = intake.wheelchairQuestion.locator('.q-card.is-selected');
    await expect(selectedCard).toHaveCount(1);
    await expect(selectedCard).toHaveAttribute('data-value', 'no');
  });

  test('selecting wheelchair option should produce markdown field', async ({ page }) => {
    const intake = new IntakePage(page);
    // Navigate to Step 6, click "yes" option
    const yesCard = intake.wheelchairQuestion.locator('.q-card[data-value="yes"]');
    await yesCard.click();
    // Navigate to Step 7, check markdown preview for the field
    // Assert structurally: preview content contains the wheelchair line
    const preview = intake.previewContent;
    await expect(preview).toContainText('Wheelchair accessible');
  });
});
```

**Note:** These are structural templates. The implementation phase will fill in the navigation logic (filling required steps 0-5 to reach Step 6) and may adjust selectors based on the final HTML structure.

### 1.14 `automation/code/automation_rules.md`
**Action:** Modify
**Current state:** Section 7 "Language Independence" covers existing structural assertions. No mention of phone/rating/wheelchair assertions.
**Target state:** Add a note in section 7.1 documenting the new structural assertion patterns:

```markdown
* **POI phone links:** Assert via `a[href^="tel:"]` selector — never match by link text.
* **POI ratings:** Assert via `.poi-card__rating` selector — validate numeric content with regex, never match specific rating text.
* **Wheelchair question (intake):** Assert via `[data-question-key="wheelchairAccessible"]` selector — validate card count and `data-value` attributes, never match option labels.
```

## 2. Markdown Format Specification

### 2.1 Phone Number Line

**Pattern:** `📞 {localized_phone_label}: {phone_number}`

| Language | Example |
|---|---|
| Russian | `📞 Телефон: +36 1 234 5678` |
| English | `📞 Phone: +36 1 234 5678` |
| Hebrew | `📞 טלפון: +36 1 234 5678` |

**Placement in POI section:** After the Photo Gallery link line, before the rating line (if present) or the description paragraph. On its own line.

**Omission rule:** If no phone number is available from either Google Places or web fetch, the entire line is omitted (not rendered as `📞 Телефон: —` or similar).

### 2.2 Rating Line

**Pattern:** `⭐ {rating}/5 ({review_count} {localized_reviews_label})`

| Language | Example |
|---|---|
| Russian | `⭐ 4.5/5 (2,340 отзывов)` |
| English | `⭐ 4.5/5 (2,340 reviews)` |
| Hebrew | `⭐ 4.5/5 (2,340 ביקורות)` |

**Placement in POI section:** After the phone line (if present) or after the Photo Gallery link line, before the description paragraph. On its own line.

**Omission rule:** If no rating is available, the entire line is omitted.

**Review count:** Formatted with locale-appropriate thousands separators (e.g., `2,340` for English, `2 340` for French).

### 2.3 Wheelchair Accessibility Indicator

**Pattern:** `♿ {localized_accessible_label}`

| Language | Example |
|---|---|
| Russian | `♿ Доступно для колясок` |
| English | `♿ Wheelchair accessible` |
| Hebrew | `♿ נגיש לכיסאות גלגלים` |

**Placement:** After the rating line (if present), before the description paragraph. Only shown when `wheelchair accessible: yes` is set in trip details AND the POI is confirmed accessible via Google Places data.

### 2.4 Complete POI Section Example (with all new fields)

```markdown
### Magyar Nemzeti Múzeum / Венгерский национальный музей 🏛️

📍 [Google Maps](https://maps.google.com/...)
🌐 [Сайт](https://mnm.hu)
📸 [Фото](https://www.google.com/maps/...)
📞 Телефон: +36 1 338 2122
⭐ 4.5/5 (2,340 отзывов)
♿ Доступно для колясок

Величественное здание в стиле неоклассицизма...

**Pro-tip:** Бесплатный вход по четвергам для семей с детьми.
```

### 2.5 Wheelchair Field in Trip Details Output

**Pattern in Additional Preferences section:**
```markdown
- **Wheelchair accessible:** {yes|no}
```

**Default:** `no` (when field is absent in legacy trip details files or when user selects "No Requirement").

## 3. HTML Rendering Specification

### 3.1 Rating Display Component

**HTML Structure:**
```html
<span class="poi-card__rating">⭐ 4.5 (2,340)</span>
```

**Placement in POI card:** Inside `.poi-card__body`, between `.poi-card__tag` and `<h3 class="poi-card__name">`.

```html
<div class="poi-card__body">
  <span class="poi-card__tag">🏛️ MUSEUM</span>
  <span class="poi-card__rating">⭐ 4.5 (2,340)</span>  <!-- NEW -->
  <h3 class="poi-card__name">Magyar Nemzeti Múzeum / ...</h3>
  <!-- ... -->
</div>
```

**CSS (from §1.5):**
```css
.poi-card__rating {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-sm);    /* 14px */
  font-weight: var(--font-weight-semibold);  /* 600 */
  color: var(--color-brand-accent);  /* gold #C9972B */
  margin-top: var(--space-1);   /* 4px */
}
```

**Conditional rendering:** Only rendered when the source markdown contains a `⭐` rating line. If no rating, the `<span class="poi-card__rating">` element is entirely absent from the DOM.

### 3.2 Phone Link Component

**HTML Structure:**
```html
<a href="tel:+3613382122" class="poi-card__link">
  <svg width="12" height="12" ...><!-- phone icon --></svg>
  📞 Телефон
</a>
```

**Placement in link row:** 4th link, after Photo.

```html
<div class="poi-card__links">
  <a href="https://maps.google.com/..." class="poi-card__link">📍 Maps</a>
  <a href="https://mnm.hu" class="poi-card__link">🌐 Сайт</a>
  <a href="https://www.google.com/maps/..." class="poi-card__link">📸 Фото</a>
  <a href="tel:+3613382122" class="poi-card__link">📞 Телефон</a>  <!-- NEW -->
</div>
```

**CSS:** Reuses existing `.poi-card__link` styles — no new CSS needed for the link itself.

**SVG icon:** Phone icon (Feather-style), `width="12" height="12"`:
```html
<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
</svg>
```

**Conditional rendering:** Only rendered when the source markdown contains a `📞` phone line. If no phone number, the link element is entirely absent.

**`href` format:** `tel:` followed by the phone number with non-digit characters (except `+`) stripped. Example: `+36 1 338 2122` → `href="tel:+3613382122"`.

### 3.3 Accessibility Badge Component

**HTML Structure:**
```html
<span class="poi-card__accessible">♿</span>
```

**Placement:** Inside `.poi-card__body`, after `.poi-card__rating` (or after `.poi-card__tag` if no rating), before `<h3 class="poi-card__name">`.

**CSS (from §1.5):**
```css
.poi-card__accessible {
  display: inline-block;
  font-size: var(--text-sm);
  margin-top: var(--space-1);
}
```

**Conditional rendering:** Only rendered when the source markdown contains a `♿` accessibility line.

## 4. Rule File Updates

| Rule File | Section | Change |
|---|---|---|
| `trip_planning_rules.md` | New "Data Source Hierarchy" section | Add two-layer data flow: web fetch first, Google Places second |
| `trip_planning_rules.md` | Research & Quality Control → Live Verification | Add Google Places enrichment per-POI rule (phone, rating, wheelchair) |
| `trip_planning_rules.md` | CEO Audit | Add wheelchair accessibility check when requirement is active |
| `content_format_rules.md` | §3 Universal Location Standards | Add phone number and rating as required fields (when available) |
| `content_format_rules.md` | Per-Day File Format (code block) | Add phone/rating/accessibility lines to POI template |
| `rendering-config.md` | POI Card Structure | Add rating display spec, update link order to include phone, add accessibility indicator |
| `trip_intake_rules.md` | Step 6 field table | Add `wheelchairAccessible` row |
| `trip_intake_rules.md` | Supplementary Fields table | Add `wheelchairAccessible` row |
| `trip_intake_rules.md` | Output Format template | Add `- **Wheelchair accessible:** {yes\|no}` to Additional Preferences |
| `trip_intake_design.md` | After "Depth Extra Questions" | Add wheelchair question visual spec |
| `automation_rules.md` | §7.1 Language Independence | Add phone/rating/wheelchair assertion patterns |

## 5. Implementation Checklist

- [ ] **Phase 1: MCP Configuration**
  - [ ] Create `.mcp.json` in project root
  - [ ] Verify Google Places MCP server package exists and is installable
  - [ ] Test `search_places` and `get_place_details` tool calls with a sample POI

- [ ] **Phase 2: Rule File Updates**
  - [ ] Update `trip_planning_rules.md` (3 additions)
  - [ ] Update `content_format_rules.md` (§3 + template)
  - [ ] Update `rendering-config.md` (rating, phone link, accessibility badge)
  - [ ] Update `trip_intake_rules.md` (Step 6, Supplementary Fields, Output Format)
  - [ ] Update `trip_intake_design.md` (wheelchair visual spec)
  - [ ] Update `automation_rules.md` (§7.1)

- [ ] **Phase 3: Rendering CSS**
  - [ ] Add `.poi-card__rating` styles to `rendering_style_config.css`
  - [ ] Add `.poi-card__accessible` styles to `rendering_style_config.css`

- [ ] **Phase 4: Trip Intake HTML**
  - [ ] Add wheelchair question HTML to Step 6 in `trip_intake.html`
  - [ ] Add click handler for wheelchair q-cards (verify existing delegation covers it)
  - [ ] Update `generateMarkdown()` to include wheelchair field
  - [ ] Add i18n keys to all 12 locale files

- [ ] **Phase 5: Automation**
  - [ ] Add locators to `TripPage.ts` (rating, phone link, accessible badge)
  - [ ] Add locator to `IntakePage.ts` (wheelchair question)
  - [ ] Add structural tests to `poi-cards.spec.ts` (phone, rating)
  - [ ] Create `intake-wheelchair.spec.ts` (visibility, default, output)

## 6. BRD Traceability

| Requirement | Acceptance Criterion | Implemented in |
|---|---|---|
| REQ-001 | AC-1: MCP config file exists | `.mcp.json` (§1.1) |
| REQ-001 | AC-2: MCP server exposes search/details tools | `.mcp.json` server config (§1.1) |
| REQ-001 | AC-3: MCP server responds to tool calls | Verified during implementation (§5 Phase 1) |
| REQ-002 | AC-1: content_format_rules.md lists phone | `content_format_rules.md` §3 update (§1.3) |
| REQ-002 | AC-2: Markdown includes phone line | Phone format spec (§2.1) |
| REQ-002 | AC-3: trip_planning_rules.md includes phone | `trip_planning_rules.md` Live Verification update (§1.2) |
| REQ-003 | AC-1: rendering-config.md specifies phone link | `rendering-config.md` Links rule update (§1.4) |
| REQ-003 | AC-2: Phone link in link row after Photo | Phone link HTML spec (§3.2) |
| REQ-003 | AC-3: Phone link uses poi-card__link class | Same CSS class as other links (§3.2) |
| REQ-003 | AC-4: No phone = no link rendered | Conditional rendering rule (§3.2) |
| REQ-004 | AC-1: content_format_rules.md lists rating | `content_format_rules.md` §3 update (§1.3) |
| REQ-004 | AC-2: Markdown includes rating line | Rating format spec (§2.2) |
| REQ-004 | AC-3: trip_planning_rules.md includes rating | `trip_planning_rules.md` Live Verification update (§1.2) |
| REQ-005 | AC-1: rendering-config.md specifies rating display | `rendering-config.md` Rating rule (§1.4) |
| REQ-005 | AC-2: Rating near POI name, not link row | Rating placement between tag and name (§3.1) |
| REQ-005 | AC-3: Star icon with numeric value | `⭐ 4.5 (2,340)` format (§3.1) |
| REQ-005 | AC-4: No rating = no element rendered | Conditional rendering rule (§3.1) |
| REQ-005 | AC-5: Review count in parentheses | Included in format spec (§2.2, §3.1) |
| REQ-006 | AC-1: wheelchairAccessible question exists, always visible | `trip_intake.html` Step 6 addition (§1.6) |
| REQ-006 | AC-2: Question on Step 6 | Placed in Step 6 section (§1.6) |
| REQ-006 | AC-3: Two options (No Requirement / Wheelchair Accessible) | 2-card layout with data-value="no"/"yes" (§1.6) |
| REQ-006 | AC-4: Value in markdown output | `generateMarkdown()` update (§1.6), format spec (§2.5) |
| REQ-006 | AC-5: i18n keys in 12 locale files | Locale file updates (§1.9) |
| REQ-006 | AC-6: Works in LTR and RTL | Uses existing `.depth-extra-question` + `.q-card` styles with RTL support (§1.6) |
| REQ-006 | AC-7: trip_intake_rules.md updated | Step 6 table, Supplementary Fields, Output Format updates (§1.7) |
| REQ-007 | AC-1: trip_planning_rules.md wheelchair verification rule | Live Verification update (§1.2) |
| REQ-007 | AC-2: Accessible POIs get ♿ indicator | Accessibility indicator markdown format (§2.3) |
| REQ-007 | AC-3: Inaccessible POIs replaced or flagged | trip_planning_rules.md rule (§1.2) |
| REQ-007 | AC-4: CEO Audit wheelchair check | CEO Audit update (§1.2) |
| REQ-008 | AC-1: Two-layer data flow documented | New "Data Source Hierarchy" section (§1.2) |
| REQ-008 | AC-2: Phone/rating from Google Places with web fetch fallback | Data Source Hierarchy precedence rule (§1.2) |
| REQ-008 | AC-3: Google Places not used for narrative content | Scope limitation in Data Source Hierarchy (§1.2) |
| REQ-009 | AC-1: Structural test for tel: links | `poi-cards.spec.ts` phone test (§1.12) |
| REQ-009 | AC-2: Structural test for .poi-card__rating | `poi-cards.spec.ts` rating test (§1.12) |
| REQ-009 | AC-3: Tests validate when present, not always | "when available" test design (§1.12) |
| REQ-009 | AC-4: Language-independent, shared-page, expect.soft | Test follows automation_rules.md patterns (§1.12) |
| REQ-010 | AC-1: Wheelchair question visible on Step 6 | `intake-wheelchair.spec.ts` visibility test (§1.13) |
| REQ-010 | AC-2: Selection produces markdown field | `intake-wheelchair.spec.ts` output test (§1.13) |
| REQ-010 | AC-3: Language-independent DOM assertions | Tests use data-value attributes, not text (§1.13) |
