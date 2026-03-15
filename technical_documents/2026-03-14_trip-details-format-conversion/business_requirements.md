# Business Requirements Document

**Change:** Convert trip_details.json to trip_details.md
**Date:** 2026-03-14
**Author:** Product Manager
**Status:** Approved (retroactive)

---

## 1. Background & Motivation

`trip_details.json` stores core trip metadata (travelers, dates, interests, languages) consumed by rule files, test utilities, and content generation. JSON format is difficult to manually edit — requires strict syntax (commas, quotes, brackets) and is error-prone for non-developers. Markdown is the native format for all other project content and is easier to read and modify.

## 2. Scope

**In scope:**
- Replace `trip_details.json` with `trip_details.md` (same data, markdown format)
- Update the parser in `language-config.ts` to extract data from markdown instead of JSON
- Update all file references across rule files, tests, CLAUDE.md, README, and release notes

**Out of scope:**
- Changing the data content itself (travelers, dates, interests remain identical)
- Changing any test logic or assertions

**Affected rule files:**
- `content_format_rules.md` — references to trip_details file
- `trip_planning_rules.md` — references to trip_details file
- `rendering-config.md` — references to trip_details file

## 3. Requirements

### REQ-001: Replace trip_details.json with trip_details.md

**Description:** The system must use a markdown-formatted `trip_details.md` as the single source of trip metadata, replacing `trip_details.json`.

**Acceptance Criteria:**
- [x] AC-1: `trip_details.json` is deleted; `trip_details.md` exists with identical data
- [x] AC-2: Markdown format uses headings and bullet lists (no JSON syntax)
- [x] AC-3: All content in `trip_details.md` is manually editable without JSON knowledge

**Priority:** Must-have

**Affected components:**
- Trip metadata file (root)

---

### REQ-002: Update parser to read markdown format

**Description:** `language-config.ts` must parse `trip_details.md` using regex extraction instead of `JSON.parse`.

**Acceptance Criteria:**
- [x] AC-1: `language-config.ts` reads `trip_details.md` and extracts language configuration correctly
- [x] AC-2: All existing tests that depend on language config continue to pass without changes to assertions

**Priority:** Must-have

**Affected components:**
- `automation/code/tests/utils/language-config.ts`

---

### REQ-003: Update all references across the project

**Description:** Every file referencing `trip_details.json` must be updated to reference `trip_details.md`.

**Acceptance Criteria:**
- [x] AC-1: Zero occurrences of `trip_details.json` remain in the project (excluding git history)
- [x] AC-2: All references now point to `trip_details.md`

**Priority:** Must-have

**Affected components:**
- CLAUDE.md, README.md, rule files, test files, release notes, test plan

## 4. Dependencies & Risks

| Dependency / Risk | Mitigation |
|---|---|
| Parser regex must handle all markdown variations | Test with existing data; regex scoped to known format |
| File references spread across many files | Grep for all occurrences before and after |

## 5. Acceptance Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| PM | Product Manager | 2026-03-14 | Approved (retroactive) |
