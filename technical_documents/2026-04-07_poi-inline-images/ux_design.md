# UX Design Document

**Change:** POI Inline Images, Hebrew RTL Output, and Hebrew Nikud
**Date:** 2026-04-07
**Author:** UX/UI Principal Engineer
**BRD Reference:** `technical_documents/2026-04-07_poi-inline-images/business_requirements.md`
**Status:** Approved

---

## 1. Overview

The primary UX goal is to make the trip report more immediately engaging for young children by turning text-only POI cards into visual cards with a hero image at the top. Children respond to images before they respond to text — a photo of the zoo, a thermal bath, or a castle gives them instant emotional context and builds anticipation for the trip. This aligns directly with the user's stated motivation ("the target of that trip [is] my kids").

The secondary goals are infrastructure-level correctness: the HTML shell must carry the right language and directionality attributes for Hebrew so that the browser applies correct RTL text rendering without relying on CSS hacks, and the Hebrew content itself must use nikud so it can be read aloud to younger children.

No new navigation patterns, no new interaction models, no new page sections. This is a localized, additive change to an existing card component.

---

## 2. User Flow

The consumer (parent reading with children) opens `trip_full_he.html` in a browser:

```
Open HTML file in browser
        |
        v
Page loads with correct RTL layout (lang="he" dir="rtl")
        |
        v
Scroll to any day card
        |
        v
POI cards display — each card shows:
  [Hero image at top]
  [Tag chip]  [Rating]
  [POI name]
  [Description with nikud]
  [Pro-tip with nikud]
  [Links: 📍 Maps  🌐 Site  📸 Photo  📞 Phone]
        |
        v
Child sees image → recognizes the place → engagement
Parent reads description with nikud → correct pronunciation
        |
        v
Family taps 📍 Maps or 📸 Photo for more info (unchanged behavior)
```

No new user actions are required. The image is purely presentational — it is not clickable and has no hover state.

---

## 3. Placement & Navigation

This change touches one component (`.poi-card`) and one document-level attribute (`<html lang dir>`). No navigation changes.

| Element | Location | Rationale |
|---|---|---|
| `poi-card__image` | First child inside `.poi-card`, above tag/rating/name | Card-hero pattern — image anchors visual identity before text is read |
| `lang="he" dir="rtl"` | `<html>` element opening tag | Document-level directionality; controls browser text rendering for the entire page |

---

## 4. Layout & Wireframes

### 4.1 POI Card — with Image (Desktop ≥ 768px)

```
┌─────────────────────────────────────────────────────┐  ← .poi-card (border-radius: 12px)
│ ┌─────────────────────────────────────────────────┐ │
│ │                                                 │ │  ← .poi-card__image
│ │           [POI Hero Image]                      │ │    height: 160px, object-fit: cover
│ │           full card width                       │ │    border-radius: 12px 12px 0 0
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│  🏊 בריכה          ⭐ 4.8 (1,204)                  │  ← .poi-card__tag + .poi-card__rating
│  Palatinus / פלטינוס                               │  ← .poi-card__name (h3)
│                                                     │
│  [Description with nikud ...]                       │  ← .poi-card__description
│                                                     │
│  ┌── 💡 Pro-tip ──────────────────────────────── ┐ │
│  │  [Pro-tip text with nikud ...]                 │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  📍 מפות   🌐 אתר   📸 תמונות   📞 טלפון            │  ← links (unchanged)
└─────────────────────────────────────────────────────┘
```

### 4.1b POI Card — without Image (graceful degradation)

```
┌─────────────────────────────────────────────────────┐  ← .poi-card (unchanged)
│  🏊 בריכה          ⭐ 4.8 (1,204)                  │  ← tag, rating — first children as before
│  Palatinus / פלטינוס                               │  ← .poi-card__name (h3)
│  [Description ...]                                  │
│  [Pro-tip ...]                                      │
│  📍 מפות   🌐 אתר   📸 תמונות                       │
└─────────────────────────────────────────────────────┘
```

No empty image slot, no broken placeholder, no vertical gap — visually identical to current card.

### 4.2 POI Card — with Image (Mobile ≤ 480px)

```
┌─────────────────────────────────────┐  ← .poi-card (full width)
│ ┌─────────────────────────────────┐ │
│ │     [POI Hero Image]            │ │  ← .poi-card__image
│ │     height: 120px               │ │    height: 120px, object-fit: cover
│ └─────────────────────────────────┘ │
│  🏊 בריכה   ⭐ 4.8                  │
│  Palatinus / פלטינוס               │
│  [Description ...]                  │
│  📍 מפות   🌐 אתר   📸 תמונות       │
└─────────────────────────────────────┘
```

---

## 5. Component Specifications

### 5.1 `.poi-card__image`

**Visual:**
- Width: 100% of card (no horizontal padding — image bleeds edge to edge within card)
- Height: 160px on desktop (≥ 768px); 120px on mobile (≤ 480px)
- `object-fit: cover` — maintains aspect ratio, crops center
- `object-position: center` — default crop anchor
- Border radius: 12px 12px 0 0 — matches top corners of card (`var(--radius-container)`)
- No margin above; 0px top padding inside card when image is present
- `display: block` — eliminates inline-img baseline gap
- Bottom of image has no border or separator — flows naturally into tag/name area below

**States:**
- Default: image displayed at full opacity
- Broken URL / load error: image element hidden via CSS `onerror` fallback (see Interaction Patterns §6); card layout collapses to no-image state
- Loading: native browser lazy-load behavior — no custom spinner required

**Behavior:**
- Not interactive — no click/tap action, no cursor pointer
- No zoom-on-hover animation (keeps the UI calm for a children's trip report)
- Keyboard: not focusable (purely decorative)

**HTML structure (when image present):**
```html
<div class="poi-card" id="poi-day-{D}-{N}">
  <img class="poi-card__image"
       src="{url}"
       alt="{POI name}"
       loading="lazy">
  <span class="poi-card__tag">…</span>
  <span class="poi-card__rating">…</span>
  <h3 class="poi-card__name">…</h3>
  …
</div>
```

---

## 6. Interaction Patterns

| Interaction | Trigger | Behavior | Duration |
|---|---|---|---|
| Image lazy load | Scroll brings image into viewport | Browser natively loads image via `loading="lazy"` | Native (no custom) |
| Broken image fallback | `onerror` event on `<img>` | `onerror="this.style.display='none'"` hides the img element; card reflows to no-image state | Immediate |
| No image field | Markdown has no `**Image:**` | `<img>` element is not emitted; card renders without image section | N/A |

No animations are introduced. No transitions on the image. Consistent with the existing card component's calm, readable aesthetic.

---

## 7. Responsive Behavior

| Breakpoint | `.poi-card__image` height | Notes |
|---|---|---|
| Desktop (≥ 768px) | 160px | Comfortable visual weight; card grid is 2-column |
| Mobile (≤ 480px) | 120px | Reduced height saves vertical space on phone; cards are full-width single column |
| Tablet (481px–767px) | 160px | Uses desktop value; cards may be 1 or 2 column depending on grid |

The image width is always 100% of the card — it adapts automatically to the card width at every breakpoint. No additional responsive rules needed beyond the height breakpoint.

---

## 8. Accessibility

- **`alt` text:** Every `<img class="poi-card__image">` carries `alt="{POI name}"` (the same text as `<h3 class="poi-card__name">`). This provides meaningful context for screen readers.
- **Decorative treatment:** The image is supplementary to the heading — screen readers will encounter the `alt` text and then the `<h3>`, which is acceptable. If the alt text becomes redundant in future, it can be set to `alt=""` (decorative). For now, named `alt` is preferred for child accessibility tools.
- **Keyboard:** Image is not focusable. No keyboard interaction needed.
- **Contrast:** Image does not overlap text — it is above the text block. No contrast concern introduced.
- **Touch targets:** Image is not a tap target — no touch target size constraint.
- **Broken image:** `onerror` hides the element; no broken-image icon is shown to the user (avoids confusing children).

---

## 9. RTL Support

The POI card image is a block-level element at the top of the card. It is not affected by text direction — `<img>` elements do not flip or mirror under `dir="rtl"`. No RTL-specific overrides needed for the image.

The `<html lang="he" dir="rtl">` change activates existing `[dir="rtl"]` CSS rules already present in `rendering_style_config.css`. These handle text alignment, sidebar mirroring, and flex direction reversal. This UX document confirms:

| Element | LTR | RTL |
|---|---|---|
| `.poi-card__image` | Block, full width, top of card | Identical — no change |
| `.poi-card__tag`, `.poi-card__rating` | Left-aligned inline | Right-aligned (activated by existing `[dir="rtl"]` CSS) |
| `.poi-card__name` | Left-aligned heading | Right-aligned (activated by existing `[dir="rtl"]` CSS) |
| Page sidebar | Left side | Right side (activated by existing `[dir="rtl"]` CSS) |
| Mobile nav pills | LTR scroll | RTL scroll (activated by existing `[dir="rtl"]` CSS) |

No new RTL rules are needed for the image component.

---

## 10. Dark Mode

The `.poi-card__image` element has no background color of its own — the image fills it entirely. No dark mode override needed. The card background dark mode is already handled by existing CSS.

| Element | Light Mode | Dark Mode |
|---|---|---|
| `.poi-card__image` | N/A (image content) | N/A (image content) |
| Card wrapper `.poi-card` | Existing rules unchanged | Existing rules unchanged |

---

## 11. Design Consistency Check

| Pattern | Existing/New | Reference |
|---|---|---|
| Card with hero image at top | Existing (standard card pattern) | Google Maps POI cards, `accommodation-card` also uses image-at-top convention in many design systems |
| `object-fit: cover` on card image | Existing pattern in codebase (referenced in `rendering-config.md` §Performance & Responsiveness) | `rendering-config.md` Lazy Loading rule |
| `loading="lazy"` on images | Existing rule | `rendering-config.md` §Performance & Responsiveness |
| `border-radius: 12px` on card container | Existing design token (`--radius-container: 12px`) | `rendering_style_config.css` line 18 |
| `onerror` hide fallback | New micro-pattern | §6 above; no existing precedent, but minimal and self-contained |
| `{{HTML_LANG_ATTRS}}` placeholder in base layout | New pattern (extends existing placeholder pattern `{{PAGE_TITLE}}`, `{{NAV_LINKS}}`) | `rendering-config.md` Step 3 Assembly |

**No fundamentally new design patterns introduced.** The hero image follows the card convention already established in `accommodation-card` (image-at-top in many card design systems) and reuses existing design tokens exclusively.

---

## 12. BRD Coverage Matrix

| Requirement | UX Addressed? | Section |
|---|---|---|
| REQ-1: POI Inline Images in HTML Output | Yes | §4, §5, §6, §7, §8 |
| REQ-2: Image URL Discovery During Phase B | N/A | Content generation — no UX surface |
| REQ-3: Language-Aware HTML `lang` and `dir` Attributes | Yes | §9 (RTL Support) |
| REQ-4: Hebrew Content with Nikud | N/A | Content generation — no UX surface; nikud is in the text content itself |

REQ-2 and REQ-4 are content-generation concerns with no UX design surface — they are fully addressed by `content_format_rules.md` and `trip_planning_rules.md` rule updates in the Dev-Impl phase.

---

## 13. Approval Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| Product Manager | Product Manager | 2026-04-07 | Approved |
| Dev Team Lead | Dev Team Lead | 2026-04-07 | Approved |
| UX/UI Principal Engineer | UX/UI Principal Engineer | 2026-04-07 | Self-approved |

**Conditions (if any):**
- None. Requirements are clear and unambiguous. Implementation may proceed directly to Dev Design (Phase 2).
