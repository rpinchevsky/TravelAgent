# Test Plan

**Change:** Dynamic Trip Details Filename and Auto-Generate Trigger
**Date:** 2026-03-21
**Author:** Automation Engineer
**BRD Reference:** business_requirements.md
**DD Reference:** detailed_design.md
**Status:** Draft

---

## 1. Test Scope

### 1.1 What Changed

This change modifies `trip_intake.html` — a standalone browser HTML wizard that collects trip preferences and downloads a markdown file. The changes are:

1. **Dynamic filename** — the download filename changes from the hardcoded `llm_trip_details.md` to `{name}_trip_details_{date}.md`, derived from the first parent's name and the arrival date.
2. **Preview tab label** — the code-editor tab in Step 7 now displays the dynamic filename and refreshes on each Step 7 entry.
3. **Post-download section** — a new "Next Step" card appears after download with a pre-filled `generate trip from {filename}` command and a "Copy Command" button.
4. **i18n keys** — four new translation keys added for the post-download section text.
5. **Rule file updates** — `trip_intake_rules.md` and `trip_intake_design.md` updated to document new behavior.

### 1.2 What Did NOT Change

- The generated markdown content structure (`generateMarkdown()` output is identical).
- The trip generation pipeline (already supports arbitrary filenames).
- The rendered trip HTML (`trip_full_LANG.html`) — no structural, styling, or content changes.
- No new trip output files are created or modified.

### 1.3 Scope Boundary — Existing Test Infrastructure

The existing Playwright regression/progression suite (`automation/code/tests/regression/*.spec.ts`) tests the **rendered trip HTML output** (`trip_full_LANG.html`) via the `TripPage` Page Object Model. It has:

- No page objects for `trip_intake.html`
- No test infrastructure for the intake wizard
- No locators for wizard steps, download buttons, or preview tabs

Since this change is entirely within the intake wizard and does not affect any rendered trip output, the existing regression suite requires **zero modifications**. No existing tests break, and no new automated tests are needed for trip output validation.

### 1.4 Automated Testing Decision

**Decision: No new automated tests.**

Rationale:
- The change is isolated to `trip_intake.html`, which has no existing test coverage infrastructure.
- Building a new `IntakePage.ts` POM, spec files, and test fixtures from scratch would be disproportionate to the scope of this change.
- The existing test suite validates trip output, which is unaffected.
- All acceptance criteria can be verified through a structured manual verification checklist.

**Future consideration:** If intake wizard changes become a recurring pattern, a dedicated `IntakePage.ts` POM and `intake.spec.ts` should be created under `automation/code/tests/` with Playwright tests covering wizard navigation, form validation, download behavior, and i18n. This would follow the same POM pattern as `TripPage.ts` and the shared-page fixture model from `automation_rules.md` section 6.2.

---

## 2. Test Environment

| Aspect | Details |
|---|---|
| **Artifact under test** | `trip_intake.html` (standalone HTML, opened via `file://` protocol or local HTTP server) |
| **Browsers** | Chrome (latest), Firefox (latest), Safari (latest) — manual verification |
| **Viewports** | Desktop (1280x800), Mobile (375x667 — iPhone SE), Tablet (768x1024) |
| **Languages** | English (en), Russian (ru), Hebrew (he — RTL) |
| **Prerequisites** | Fill in wizard Steps 0-6 with valid test data before verifying Step 7 behavior |

---

## 3. Manual Verification Checklist

### 3.1 Dynamic Filename Construction (REQ-001)

| # | Test Case | Steps | Expected Result | BRD AC |
|---|---|---|---|---|
| MV-001 | Standard name + date | 1. Enter first parent name "Robert". 2. Set arrival date to 2026-07-15. 3. Navigate to Step 7. | Preview tab shows `robert_trip_details_2026-07-15.md`. Download produces file with that name. | AC-1, AC-2, AC-3, AC-4 |
| MV-002 | Multi-word name | 1. Enter first parent name "Anna Maria". 2. Set arrival date to 2026-08-01. 3. Navigate to Step 7. | Filename is `anna_maria_trip_details_2026-08-01.md` (spaces become underscores). | AC-3 |
| MV-003 | Empty name fallback | 1. Leave first parent name empty (or only spaces). 2. Set arrival date to 2026-07-15. 3. Navigate to Step 7. | Filename is `traveler_trip_details_2026-07-15.md`. | AC-5 |
| MV-004 | Missing date fallback | 1. Enter first parent name "Robert". 2. Do NOT set arrival date (clear the field). 3. Navigate to Step 7. | Filename is `robert_trip_details_undated.md`. | AC-6 |
| MV-005 | Both fallbacks | 1. Leave first parent name empty. 2. Leave arrival date empty. 3. Navigate to Step 7. | Filename is `traveler_trip_details_undated.md`. | AC-5, AC-6 |
| MV-006 | Special characters stripped | 1. Enter first parent name with accented/special characters (e.g., "Jean-Pierre" or "Анна"). 2. Set arrival date. 3. Navigate to Step 7. | Non-`[a-z0-9_]` characters are removed. "Jean-Pierre" becomes `jeanpierre`. Cyrillic-only name falls back to `traveler`. | AC-7 |
| MV-007 | Unicode-only name | 1. Enter first parent name using only CJK, emoji, or Cyrillic characters. 2. Set date. 3. Navigate to Step 7. | After stripping, name is empty so fallback `traveler` is used. | AC-5, AC-7 |
| MV-008 | Multiple consecutive spaces | 1. Enter first parent name "Anna   Maria" (multiple spaces). 2. Set date. 3. Navigate to Step 7. | Filename uses single underscore: `anna_maria_trip_details_...`. | AC-3 |

### 3.2 Post-Download Section (REQ-002)

| # | Test Case | Steps | Expected Result | BRD AC |
|---|---|---|---|---|
| MV-009 | Section hidden initially | 1. Navigate to Step 7. | Post-download section is not visible. | AC-1 (pre-condition) |
| MV-010 | Section appears after download | 1. Navigate to Step 7. 2. Click download button. | Post-download section becomes visible below the button bar. | AC-1 |
| MV-011 | Command format correct | 1. Enter name "Robert", date 2026-07-15. 2. Navigate to Step 7. 3. Click download. | Command shows `generate trip from robert_trip_details_2026-07-15.md`. | AC-2, AC-3 |
| MV-012 | Copy command to clipboard | 1. Click download. 2. Click "Copy Command" button. 3. Paste into a text editor. | Clipboard contains the exact command text. Toast notification appears confirming copy. | AC-4, AC-5 |
| MV-013 | Section updates on re-download | 1. Download with name "Robert". 2. Navigate back to Step 1, change name to "Anna". 3. Navigate to Step 7 (section should be hidden). 4. Click download again. | Section re-appears with updated command: `generate trip from anna_trip_details_...`. | AC-6 |
| MV-014 | Instructional text present | 1. Click download. | Section includes instruction text explaining how to use the command with Claude Code. Hint text mentions project directory and Claude Code. | AC-8 |
| MV-015 | Consistent styling | 1. Click download. | Section uses surface card style with left accent border (brand primary color), standard spacing, and the command box uses monospace dark theme matching the preview box. | AC-7 |

### 3.3 Preview Tab Dynamic Label (REQ-003)

| # | Test Case | Steps | Expected Result | BRD AC |
|---|---|---|---|---|
| MV-016 | Tab shows dynamic filename | 1. Enter name "Robert", date 2026-07-15. 2. Navigate to Step 7. | Tab label reads `robert_trip_details_2026-07-15.md` (not `llm_trip_details.md`). | AC-1 |
| MV-017 | Tab refreshes on re-entry | 1. Navigate to Step 7 (tab shows "robert_..."). 2. Go back to Step 1, change name to "Anna". 3. Return to Step 7. | Tab label now reads `anna_trip_details_...`. | AC-2 |
| MV-018 | Tab matches download filename | 1. Note the tab label text. 2. Click download. 3. Check downloaded file name. | The downloaded file name matches the tab label exactly. | AC-3 |

### 3.4 i18n Verification

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| MV-019 | English text | 1. Set language to English. 2. Navigate to Step 7 and click download. | Post-download section shows English text: "Profile saved! Ready to generate your trip.", "Copy Command", etc. |
| MV-020 | Russian text | 1. Set language to Russian. 2. Navigate to Step 7 and click download. | Post-download section shows Russian translations for all four i18n keys. |
| MV-021 | Hebrew (RTL) text | 1. Set language to Hebrew. 2. Navigate to Step 7 and click download. | Post-download section shows Hebrew translations. Accent border is on the RIGHT side (RTL flip). Text is right-aligned. |

### 3.5 Responsive Layout

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| MV-022 | Desktop layout | 1. View at 1280px width. 2. Click download. | Command row is horizontal: command box and copy button side by side. |
| MV-023 | Mobile layout (<=480px) | 1. View at 375px width. 2. Click download. | Command row stacks vertically: command box above, copy button below aligned right. |
| MV-024 | Tablet layout | 1. View at 768px width. 2. Click download. | Same as desktop (horizontal command row). |

### 3.6 Section State Reset

| # | Test Case | Steps | Expected Result |
|---|---|---|---|
| MV-025 | Reset on step re-entry | 1. Navigate to Step 7. 2. Click download (post-download section appears). 3. Navigate back to Step 6. 4. Navigate forward to Step 7 again. | Post-download section is hidden again. Tab label is refreshed. Preview content is regenerated. |

---

## 4. Coverage Matrix

| BRD Requirement | AC | Description | Verification Method | Test Case(s) |
|---|---|---|---|---|
| REQ-001 | AC-1 | Dynamic filename on download | Manual verification | MV-001, MV-002 |
| REQ-001 | AC-2 | Preview tab shows dynamic filename | Manual verification | MV-016 |
| REQ-001 | AC-3 | Lowercase name with underscores | Manual verification | MV-001, MV-002, MV-008 |
| REQ-001 | AC-4 | YYYY-MM-DD date format | Manual verification | MV-001 |
| REQ-001 | AC-5 | Empty name fallback "traveler" | Manual verification | MV-003, MV-005, MV-007 |
| REQ-001 | AC-6 | Missing date fallback "undated" | Manual verification | MV-004, MV-005 |
| REQ-001 | AC-7 | Special characters stripped | Manual verification | MV-006, MV-007 |
| REQ-002 | AC-1 | Post-download section visible after download | Manual verification | MV-009, MV-010 |
| REQ-002 | AC-2 | Command format `generate trip from {filename}` | Manual verification | MV-011 |
| REQ-002 | AC-3 | Command contains exact downloaded filename | Manual verification | MV-011, MV-018 |
| REQ-002 | AC-4 | Copy button copies to clipboard | Manual verification | MV-012 |
| REQ-002 | AC-5 | Toast notification on copy | Manual verification | MV-012 |
| REQ-002 | AC-6 | Section updates on re-download | Manual verification | MV-013 |
| REQ-002 | AC-7 | Consistent styling with design system | Manual verification | MV-015 |
| REQ-002 | AC-8 | Instructional text present | Manual verification | MV-014 |
| REQ-003 | AC-1 | Tab shows dynamic filename | Manual verification | MV-016 |
| REQ-003 | AC-2 | Tab refreshes on Step 7 re-entry | Manual verification | MV-017 |
| REQ-003 | AC-3 | Tab matches download filename | Manual verification | MV-018 |

**Coverage: 18/18 acceptance criteria covered (100%).**

---

## 5. Test Data Dependencies

| Data | Source | Notes |
|---|---|---|
| First parent name | Manual entry in Step 1 `#parentsContainer .parent-name` | Test with: standard Latin, multi-word, accented, Cyrillic, empty, spaces-only, emoji |
| Arrival date | Step 0 date picker `#arrival` (datetime-local input) | Test with: valid date, empty/cleared field |
| Wizard steps 0-6 | Manual entry | Must be filled with valid data to reach Step 7; exact values are irrelevant to this test scope |
| Existing toast system | Built into `trip_intake.html` | `showToast()` function must exist; already verified by existing copy-to-clipboard functionality |

---

## 6. Risk & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| No automated regression coverage for intake wizard | Changes to `trip_intake.html` could regress without detection | Medium | Manual checklist covers all BRD acceptance criteria. If intake changes become frequent, prioritize building `IntakePage.ts` POM and `intake.spec.ts`. |
| `navigator.clipboard.writeText()` requires secure context (HTTPS or localhost) | Copy button may fail silently on `file://` protocol in some browsers | Low | The existing copy-to-clipboard button on the preview box has the same constraint and works today. Test in the same environment the user normally uses. |
| Browser download behavior varies (save dialog vs. auto-download) | Cannot verify downloaded filename in all browsers via manual testing alone | Low | Verify the `<a>` element's `download` attribute value in DevTools; this is what sets the suggested filename regardless of browser behavior. |
| RTL accent border flip not visible if RTL language not tested | RTL-specific CSS rule (`border-right` instead of `border-left`) could be missed | Low | MV-021 explicitly tests Hebrew/RTL layout. |

---

## 7. Estimated Impact

| Metric | Value |
|---|---|
| **Existing automated tests affected** | 0 — no trip output changes, no spec modifications needed |
| **New automated tests** | 0 — manual verification only (see Section 1.4 for rationale) |
| **Manual verification cases** | 25 (MV-001 through MV-025) |
| **Estimated manual verification time** | 30-45 minutes (single tester, three browsers) |
| **Risk to existing regression suite** | None — the change is in `trip_intake.html`, not in `trip_full_LANG.html` |
| **Rule file changes requiring review** | 2 (`trip_intake_rules.md`, `trip_intake_design.md`) — documentation only, no test logic impact |
