# High-Level Design

**Change:** Dynamic Trip Details Filename and Auto-Generate Trigger
**Date:** 2026-03-21
**Author:** Development Team
**BRD Reference:** business_requirements.md
**Status:** Draft

---

## 1. Overview

This change modifies the trip intake page (`trip_intake.html`) to:

1. **Dynamic filename** -- Replace the hardcoded download filename `llm_trip_details.md` with a pattern-based filename `{name}_trip_details_{date}.md` derived from the first parent's name and the arrival date.
2. **Dynamic preview tab label** -- Update the code editor tab label in Step 7 to display the dynamic filename instead of the static `llm_trip_details.md`.
3. **Post-download trigger section** -- After download, reveal a new UI section with a ready-to-copy Claude Code command (`generate trip from {filename}`) to bridge the gap between intake and trip generation.

Two rule files (`trip_intake_rules.md`, `trip_intake_design.md`) are updated to document the new behavior and UI section.

No changes are made to the markdown content structure, the trip generation pipeline, or any server-side components.

## 2. Affected Components

| File | Type | Change Summary |
|---|---|---|
| `trip_intake.html` | HTML + CSS + JS | New `getTripFilename()` function, updated download handler, updated preview tab label, new post-download HTML section, new CSS for post-download section |
| `trip_intake_rules.md` | Rule file | Update Step 7 description and Output Format section to document dynamic filename and post-download behavior |
| `trip_intake_design.md` | Rule file | Add Post-Download Section component spec, update Preview Box tab label spec |

**Total: 3 files affected.**

## 3. Data Flow

```
Step 0 (arrival date)    ──┐
                           ├──► getTripFilename() ──► "{name}_trip_details_{date}.md"
Step 1 (first parent name) ┘           │
                                       ├──► Preview tab label (on Step 7 entry)
                                       ├──► Download handler (a.download = filename)
                                       └──► Post-download command text
```

**Filename construction flow:**
1. Read first parent name from `#parentsContainer .traveler-card .parent-name` value.
2. Sanitize: lowercase, trim, spaces to underscores, strip non-`[a-z0-9_]` characters. If empty after sanitization, fall back to `"traveler"`.
3. Read arrival date from `$('#arrival').value`, extract first 10 characters (ISO `YYYY-MM-DD`). If empty, fall back to `"undated"`.
4. Return `{sanitized_name}_trip_details_{date}.md`.

**Post-download flow:**
1. User clicks Download button.
2. Browser download triggers with the dynamic filename.
3. The `.post-download` section becomes visible (remove `display: none`).
4. The command text is populated: `generate trip from {filename}`.
5. User clicks "Copy Command" -- clipboard write + toast notification.
6. If user downloads again (after edits), the section updates with the new filename.

## 4. Integration Points

| Integration Point | Mechanism | Notes |
|---|---|---|
| First parent name | DOM query: `document.querySelector('#parentsContainer .traveler-card .parent-name')` | Same selector used by `generateMarkdown()` for the parents array; no new coupling introduced |
| Arrival date | DOM query: `$('#arrival').value` | Already read by `generateMarkdown()`; no new coupling |
| Preview tab label | DOM update on `goToStep(7)` | The step navigation already populates `#previewContent` at this point; tab update is added adjacently |
| Clipboard API | `navigator.clipboard.writeText()` | Already used by `handleCopy()`; the new copy button reuses this pattern |
| Toast system | `window.showToast()` | Already used throughout the page (date save, clipboard copy, depth selection); no new system needed |

## 5. Impact on Existing Behavior

| Area | Impact |
|---|---|
| Download filename | **Breaking change** (intentional): Downloads will no longer be named `llm_trip_details.md`. Users who rely on the fixed filename in scripts or aliases will need to update. The BRD explicitly requires this change. |
| Preview tab label | **Visual change**: The tab text changes from static `llm_trip_details.md` to dynamic. No functional impact on the preview content. |
| Markdown content | **No change**: The generated markdown structure, field order, and content are unchanged. |
| Copy to Clipboard | **No change**: The existing copy button behavior is unaffected. |
| Trip generation pipeline | **No change**: The pipeline already supports arbitrary filenames via `generate trip from {filename}`. |
| Button bar layout | **Minor visual addition**: A new section appears below the button bar after download. The button bar itself is unchanged. |
| i18n | **Partial**: The post-download section's static UI text (heading, instruction, button label) needs `data-i18n` keys added to the `TRANSLATIONS` object for all 12 languages. The filename itself is not translated (it is data, not UI chrome). |

## 6. BRD Coverage Matrix

| BRD Requirement | HLD Section | Design Decision |
|---|---|---|
| REQ-001: Dynamic Filename Format | Section 3 (Data Flow) | Single `getTripFilename()` helper encapsulates all sanitization logic; called from three consumers (tab, download, post-download) |
| REQ-001 AC-5/AC-6: Fallbacks | Section 3 (Data Flow) | `"traveler"` for empty name, `"undated"` for missing date -- applied after sanitization |
| REQ-001 AC-7: Special char stripping | Section 3 (Data Flow) | Regex `[^a-z0-9_]` applied after lowercasing; handles Unicode by stripping non-ASCII entirely |
| REQ-002: Post-Download Section | Section 3 (Data Flow), Section 5 (Impact) | Hidden-by-default HTML section below `.btn-bar`, shown on download click, reuses existing toast system for copy feedback |
| REQ-003: Preview Tab Dynamic Label | Section 3 (Data Flow) | Tab label updated on every Step 7 entry via the existing `goToStep()` navigation handler |
| Rule file updates | Section 2 (Affected Components) | Both `trip_intake_rules.md` and `trip_intake_design.md` updated to reflect new behavior |
