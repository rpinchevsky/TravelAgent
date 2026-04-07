# Business Requirements Document

**Change:** POI Inline Images, Hebrew RTL Output, and Hebrew Nikud
**Date:** 2026-04-07
**Author:** Product Manager
**Status:** Approved

---

## 1. Background & Motivation

The trip consumer is a family with young children. The user explicitly requested that POI cards in the HTML report display inline images alongside the existing links, because visual cues significantly improve engagement and usability for children who cannot read well yet. The user also requested that the Hebrew-language trip be generated with nikud (vowel diacritics), which is essential for correct pronunciation when reading Hebrew with children, and that the HTML output carry the correct `lang="he" dir="rtl"` attributes so Hebrew text renders and flows correctly in all browsers.

Currently:
- POI cards contain links (📍 Maps, 🌐 Site, 📸 Photo) but no visible image — the card is purely text-based.
- The HTML shell (`base_layout.html`) hardcodes `lang="ru"`, so Hebrew output is misidentified as Russian and renders without RTL flow.
- Hebrew content generation does not use nikud, making the output harder to read aloud to young children.

These three gaps are addressed together because they all affect the same trip generation request ("generate my trip in Hebrew with punctuation") and have no conflicting concerns.

---

## 2. Scope

**In scope:**
- Adding an `**Image:** <url>` field to the markdown POI format (content generation layer)
- Discovering and embedding a public image URL for each POI during Phase B generation
- Rendering that URL as an inline `<img>` inside `.poi-card` in the HTML output (rendering layer)
- Parameterizing the HTML `<html>` tag's `lang` and `dir` attributes via a `{{HTML_LANG_ATTRS}}` placeholder
- Emitting `HTML_LANG_ATTRS` from `generate_shell_fragments.ts`
- Injecting `HTML_LANG_ATTRS` during HTML assembly (Step 3)
- Enforcing nikud in all Hebrew-language generated text

**Out of scope:**
- Accommodation cards (`.accommodation-card`) — images not requested for this card type
- Car rental cards (`.car-rental-category`) — images not requested for this card type
- Inline images in the trip's itinerary table rows or overview table
- Changing any existing link types (📍 📸 🌐 📞) — these are preserved as-is
- Adding images to non-Hebrew language trips (unless future request)
- Automated image quality or content validation (moderation)

**Affected rule files:**
- `content_format_rules.md` — POI markdown field definition, Phase B generation instructions
- `rendering-config.md` — POI card structure (new `poi-card__image` element)
- `base_layout.html` — replace hardcoded `lang="ru"` with `{{HTML_LANG_ATTRS}}`
- `trip_planning_rules.md` — image URL discovery during research (web search, Wikimedia)
- `rendering_style_config.css` — new `.poi-card__image` CSS rules

---

## 3. Requirements

### REQ-1: POI Inline Images in HTML Output

**Description:** Each POI card in the HTML report must display an inline image above the card's tag/rating/name block. The image is sourced from a `**Image:** <url>` field in the markdown. Existing photo links (📸) are preserved unchanged — images are additive only.

**Acceptance Criteria:**
- [ ] AC-1.1: Every `.poi-card` that has a corresponding `**Image:** <url>` field in its source markdown renders an `<img class="poi-card__image">` as the first child element inside the card.
- [ ] AC-1.2: The `<img>` tag has `loading="lazy"`, `alt="{POI name}"`, and `src="{url from markdown}"`.
- [ ] AC-1.3: The `<img>` element appears BEFORE `.poi-card__tag`, `.poi-card__rating`, and `<h3 class="poi-card__name">` in DOM order.
- [ ] AC-1.4: When the `**Image:**` field is absent from a POI, the card renders without any `<img>` tag — no broken placeholder, no empty space.
- [ ] AC-1.5: Existing links (📍 Maps, 🌐 Site, 📸 Photo, 📞 Phone) are all present and unmodified in cards that also have an image.
- [ ] AC-1.6: The POI Parity Rule is unaffected — count of `.poi-card` elements still equals count of `###` POI headings per day.

**Priority:** Must-have

**Affected components:**
- `rendering-config.md` (POI Card Structure section)
- `rendering_style_config.css` (new `.poi-card__image` rule)
- `automation/scripts/generate_html_fragments.ts` (image field parsing and `<img>` rendering)
- Automation tests (`poi-cards.spec.ts`)

---

### REQ-2: Image URL Discovery During Phase B Generation

**Description:** During Phase B day-by-day content generation, for each POI, the generating agent must find a publicly accessible, permanently stable image URL and record it in the markdown as `**Image:** <url>`. Wikipedia/Wikimedia Commons is the preferred source because images are freely licensed, permanently hosted, and do not require authentication.

**Acceptance Criteria:**
- [ ] AC-2.1: Each POI section in a generated day markdown file contains a `**Image:** <url>` line if a suitable image was found.
- [ ] AC-2.2: The URL is a direct image URL (ends in `.jpg`, `.jpeg`, `.png`, `.webp`, or a Wikimedia `thumb` URL) that a browser can load with no authentication.
- [ ] AC-2.3: Wikimedia Commons thumbnail format is preferred: `https://upload.wikimedia.org/wikipedia/commons/thumb/...`
- [ ] AC-2.4: The image is specific to the POI (not a generic destination or placeholder photo).
- [ ] AC-2.5: If no suitable image is found after one web search retry (per Network & Connectivity Rules), the `**Image:**` field is omitted entirely — generation continues without it.
- [ ] AC-2.6: The `**Image:**` field appears on its own line, immediately after the POI heading block (name, tag, rating fields), before the description paragraph.

**Priority:** Must-have

**Affected components:**
- `content_format_rules.md` (POI markdown field definition)
- `trip_planning_rules.md` (image discovery instruction during research)
- Day markdown files generated in Phase B

---

### REQ-3: Language-Aware HTML `lang` and `dir` Attributes

**Description:** The assembled HTML file must carry the correct `lang` and `dir` attributes on the `<html>` element, derived from the trip's reporting language. For Hebrew (`lang=he`), the output must be `<html lang="he" dir="rtl">`. For all other languages currently supported (Russian, English), `dir` is omitted or set to `ltr`. The existing RTL CSS rules (`[dir="rtl"]`) already handle visual RTL layout — this requirement ensures the correct attributes are present to activate them.

**Acceptance Criteria:**
- [ ] AC-3.1: `base_layout.html` replaces the hardcoded `lang="ru"` attribute with the placeholder `{{HTML_LANG_ATTRS}}`.
- [ ] AC-3.2: `generate_shell_fragments.ts` emits a `HTML_LANG_ATTRS` key in `shell_fragments_{lang}.json`. Value for Hebrew: `lang="he" dir="rtl"`. Value for Russian: `lang="ru"`. Value for English: `lang="en"`.
- [ ] AC-3.3: The Step 3 assembly process reads `HTML_LANG_ATTRS` from `shell_fragments_{lang}.json` and substitutes it into the `{{HTML_LANG_ATTRS}}` placeholder in `base_layout.html` before writing the final `trip_full_LANG.html`.
- [ ] AC-3.4: The final `trip_full_he.html` has `<html lang="he" dir="rtl">` as its opening tag.
- [ ] AC-3.5: The final `trip_full_ru.html` has `<html lang="ru">` (no `dir` attribute) as its opening tag, maintaining backward compatibility.
- [ ] AC-3.6: `base_layout.html` still contains `{{HTML_LANG_ATTRS}}` as an unsubstituted placeholder after assembly completes (per Step 3 validation rule).

**Priority:** Must-have

**Affected components:**
- `base_layout.html` (placeholder substitution)
- `automation/scripts/generate_shell_fragments.ts` (emit `HTML_LANG_ATTRS`)
- `rendering-config.md` (Step 2a shell fragments contract and Step 3 assembly instructions)
- Automation tests (`smoke.spec.ts`, `navigation.spec.ts`)

---

### REQ-4: Hebrew Content with Nikud

**Description:** When generating trip content in the Hebrew reporting language, all Hebrew-language text must include nikud (vowel diacritical marks). Nikud is required for child-readable Hebrew — it disambiguates pronunciation and is standard in children's materials. This applies to all generated text in the reporting language. It does NOT apply to Hungarian POI names, link labels, or numeric data.

**Acceptance Criteria:**
- [ ] AC-4.1: Day titles, sub-headings, and day banners in Hebrew-language day files contain nikud on all Hebrew words.
- [ ] AC-4.2: POI descriptions and pro-tips in Hebrew contain nikud throughout.
- [ ] AC-4.3: Itinerary table entries (Activity column text) in Hebrew contain nikud where applicable.
- [ ] AC-4.4: Overview table cells (date labels, day summaries) in Hebrew contain nikud.
- [ ] AC-4.5: Budget section category labels and notes in Hebrew contain nikud.
- [ ] AC-4.6: Hungarian POI names (e.g., "Állatkert", "Palatinus") are NOT modified — nikud applies to the Hebrew reporting text only.
- [ ] AC-4.7: Link labels (📍 מפות, 🌐 אתר, 📸 תמונות, 📞 טלפון) include nikud where appropriate.

**Priority:** Must-have

**Affected components:**
- `trip_planning_rules.md` (language instruction section — add nikud requirement for Hebrew)
- `content_format_rules.md` (language-specific generation notes)
- All generated `*_he.md` day files

---

## 4. Dependencies & Risks

| Dependency / Risk | Mitigation |
|---|---|
| Image URLs from Wikimedia may occasionally return 404 if image is renamed/moved | Use thumbnail format with a specific pixel width (`/thumb/.../640px-`) which is more stable; graceful degradation (REQ-1 AC-1.4) ensures no visual breakage |
| `generate_shell_fragments.ts` currently has no `HTML_LANG_ATTRS` output — requires code change | Dev-Impl phase updates the script; SA reviews the contract change |
| `base_layout.html` placeholder change breaks existing Russian trips if assembly is not updated in sync | AC-3.5 ensures backward compatibility; both the placeholder and the injection logic are updated atomically in the same implementation task |
| Nikud requires the generating LLM to apply diacritics consistently — may miss some words | Treat as best-effort for initial implementation; AC-4.x criteria are verified manually or by spot-check in regression |
| Existing `.poi-card` CSS structure may not accommodate hero-style image without layout shift | UX Design Document defines exact dimensions and `object-fit` rules; CSS is tested in regression |
| Image loading adds network requests that may slow page load on mobile | `loading="lazy"` (REQ-1 AC-1.2) defers off-screen image loading |

---

## 5. Acceptance Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| PM | Product Manager | 2026-04-07 | Approved |
