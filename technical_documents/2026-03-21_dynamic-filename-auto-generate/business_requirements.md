# Business Requirements Document

**Change:** Dynamic Trip Details Filename and Auto-Generate Trigger
**Date:** 2026-03-21
**Author:** Product Manager
**Status:** Draft

---

## 1. Background & Motivation

Today, `trip_intake.html` downloads the completed trip profile as a fixed filename `llm_trip_details.md`. This has two problems:

1. **Non-descriptive filename.** When a user creates multiple trip profiles (e.g., for different family members or destinations), every download overwrites or creates duplicate `llm_trip_details.md` files. There is no way to tell which profile belongs to whom without opening the file.

2. **Manual pipeline handoff.** After downloading, the user must manually open Claude Code, remember the filename, and type the trip generation command. This friction breaks the flow from profile creation to trip generation.

The user wants the intake page to (a) produce a meaningfully named file using the pattern `{PersonName}_trip_details_{ArrivalDate}.md`, and (b) immediately guide the user to trigger the trip generation pipeline with that file, closing the gap between intake and generation.

## 2. Scope

**In scope:**
- Dynamic filename construction using the first parent/adult name and the arrival date
- Updating the preview tab label and download button to reflect the dynamic filename
- Displaying a post-download section with a ready-to-copy Claude Code command that triggers trip generation with the newly created file
- Updating `trip_intake_rules.md` to document the new filename format and post-download behavior
- Updating `trip_intake_design.md` to document the post-download UI section

**Out of scope:**
- Server-side file saving or File System Access API (the page is standalone HTML with no server; `showSaveFilePicker` has limited browser support and requires HTTPS)
- Automatic programmatic invocation of Claude Code from the browser (no IPC bridge exists)
- Changes to the trip generation pipeline itself (it already supports arbitrary filenames)
- Changes to the generated markdown content or structure

**Affected rule files:**
- `trip_intake_rules.md` -- Step 7 section (Review & Download), Output Format section (filename)
- `trip_intake_design.md` -- Preview Box component, Button Bar, new Post-Download Section

## 3. Requirements

### REQ-001: Dynamic Filename Format

**Description:** The downloaded trip details file must be named using the pattern `{PersonName}_trip_details_{YYYY-MM-DD}.md`, where:
- `{PersonName}` is the name from the first parent/adult card in Step 1 (the `.parent-name` value of the first traveler card in `#parentsContainer`), lowercased, with spaces replaced by underscores, and non-alphanumeric characters (except underscores) stripped.
- `{YYYY-MM-DD}` is the arrival date selected in Step 0, formatted as ISO date (year-month-day).
- If the first parent name is empty or blank, fall back to `traveler`.
- If the arrival date is not set, fall back to `undated`.

**Examples:**
- First parent "Robert", arrival 2026-07-15 --> `robert_trip_details_2026-07-15.md`
- First parent "Anna Maria", arrival 2026-08-01 --> `anna_maria_trip_details_2026-08-01.md`
- First parent "", arrival 2026-07-15 --> `traveler_trip_details_2026-07-15.md`

**Acceptance Criteria:**
- [ ] AC-1: The browser download uses the dynamic filename pattern `{name}_trip_details_{date}.md` instead of the hardcoded `llm_trip_details.md`.
- [ ] AC-2: The preview tab label in the code editor box (Step 7) displays the dynamic filename instead of `llm_trip_details.md`.
- [ ] AC-3: The filename uses the first parent's name lowercased with spaces replaced by underscores.
- [ ] AC-4: The filename uses the arrival date in `YYYY-MM-DD` format.
- [ ] AC-5: When the first parent name is empty, `traveler` is used as the fallback.
- [ ] AC-6: When the arrival date is missing, `undated` is used as the fallback.
- [ ] AC-7: Special characters (accents, punctuation) are stripped from the name portion, keeping only `[a-z0-9_]`.

**Priority:** Must-have
**Affected components:**
- `trip_intake.html`: `$('#btnDownload')` click handler (line ~6211-6218), preview tab label (line ~2776), `generateMarkdown()` function (for accessing traveler data)

### REQ-002: Post-Download Trip Generation Trigger

**Description:** After the user clicks the download button, a new "Next Step" section appears below the button bar with:
1. A success confirmation message (e.g., "Profile saved! Ready to generate your trip.")
2. A pre-filled, read-only command text box showing the exact Claude Code command to run, using the dynamic filename: `generate trip from {filename}`
3. A "Copy Command" button that copies the command to clipboard.
4. Brief instructional text explaining: "Paste this command into Claude Code to start generating your personalized trip."

This section is hidden by default and only appears after a successful download. If the user clicks download again (e.g., after edits), the section updates with the current filename.

**Acceptance Criteria:**
- [ ] AC-1: After clicking the download button, a "Next Step" section becomes visible below the button bar.
- [ ] AC-2: The section displays a command in the format `generate trip from {dynamic_filename}`.
- [ ] AC-3: The command text box contains the exact filename that was just downloaded.
- [ ] AC-4: A "Copy Command" button copies the command text to the clipboard.
- [ ] AC-5: Clicking "Copy Command" shows a toast notification confirming the copy (using the existing toast system).
- [ ] AC-6: The section updates if the user downloads again with different data.
- [ ] AC-7: The section is styled consistently with the existing design system (surface card, brand colors, same spacing tokens).
- [ ] AC-8: The section includes a brief instruction explaining how to use the copied command.

**Priority:** Must-have
**Affected components:**
- `trip_intake.html`: New HTML section after the button bar in Step 7, new CSS for the section, JavaScript in the download handler to show/update the section

### REQ-003: Preview Tab Dynamic Label

**Description:** The preview box tab that currently shows the static text `llm_trip_details.md` must dynamically update to show the actual filename that will be downloaded. This gives the user immediate visual confirmation of what file they are about to download, before they click the button.

The tab label must update whenever Step 7 is entered (since the user may have changed the parent name or arrival date by navigating back and forth).

**Acceptance Criteria:**
- [ ] AC-1: The preview tab label shows the dynamic filename matching `{name}_trip_details_{date}.md`.
- [ ] AC-2: The tab label refreshes each time Step 7 is rendered (not just on initial load).
- [ ] AC-3: The tab label matches exactly the filename used by the download button.

**Priority:** Must-have
**Affected components:**
- `trip_intake.html`: Preview box tab element (line ~2776), step navigation logic that renders Step 7

## 4. Dependencies & Risks

| Dependency / Risk | Mitigation |
|---|---|
| First parent name may contain Unicode characters (Cyrillic, Hebrew, CJK) that are not safe for filenames | Strip non-ASCII characters and fall back to `traveler` if the result is empty after stripping |
| Arrival date format must be consistent regardless of browser locale | Use explicit `YYYY-MM-DD` extraction from the date input value (which is already ISO format in `datetime-local` inputs) |
| User may not have Claude Code open when they copy the command | The instructional text must explicitly state to open Claude Code first; this is guidance, not automation |
| Browser download behavior varies (some browsers ask for save location, some auto-save to Downloads) | This is existing behavior, unchanged. The instruction text should note the user may need to move the file to the project directory |
| The page is standalone HTML with no server — cannot programmatically invoke Claude Code | Design explicitly uses copy-paste command approach; no server or IPC bridge required |

## 5. Acceptance Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| PM | Product Manager | 2026-03-21 | Approved |
