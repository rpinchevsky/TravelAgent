# Detailed Design

**Change:** Convert trip_details.json to trip_details.md
**Date:** 2026-03-14
**Author:** Development Team
**HLD Reference:** `high_level_design.md`
**Status:** Approved (retroactive)

---

## 1. File Changes

### 1.1 `trip_details.json` → `trip_details.md`

**Action:** Delete `trip_details.json`, create `trip_details.md`

**Current state (JSON):**
```json
{
  "travelers": [ { "name": "...", "dob": "..." }, ... ],
  "dates": { "start": "...", "end": "..." },
  "languages": ["ru", "he"],
  ...
}
```

**Target state (Markdown):**
```markdown
# Trip Details

## Travelers
- Name: ..., DOB: ...
- Name: ..., DOB: ...

## Dates
- Start: ...
- End: ...

## Languages
- ru
- he
...
```

**Rationale:** Markdown is human-editable without syntax errors; consistent with all other project files.

---

### 1.2 `automation/code/tests/utils/language-config.ts`

**Action:** Modify

**Current state:**
```typescript
const raw = fs.readFileSync('trip_details.json', 'utf-8');
const data = JSON.parse(raw);
```

**Target state:**
```typescript
const raw = fs.readFileSync('trip_details.md', 'utf-8');
// Regex extraction for each field
const languages = raw.match(/## Languages\n([\s\S]*?)(?=\n##|$)/);
```

**Rationale:** Regex extraction handles the known markdown structure; no external dependencies needed.

---

### 1.3 Reference updates (10 files)

**Action:** Modify — find/replace `trip_details.json` → `trip_details.md`

**Files:** `CLAUDE.MD`, `README.md`, `content_format_rules.md`, `trip_planning_rules.md`, `rendering-config.md`, `automation/code/release_notes.md`, `automation/code/test_plan.md`, `activity-label-languages.spec.ts`, `poi-languages.spec.ts`, automation report `index.html`

**Rationale:** Ensures zero stale references remain.

## 2. Markdown Format Specification

Not applicable — no new markdown sections in day files.

## 3. HTML Rendering Specification

Not applicable — no HTML changes.

## 4. Rule File Updates

| Rule File | Section | Change |
|---|---|---|
| `content_format_rules.md` | Trip folder structure, Pre-Flight references | `trip_details.json` → `trip_details.md` |
| `trip_planning_rules.md` | Pre-Flight Setup, data source references | `trip_details.json` → `trip_details.md` |
| `rendering-config.md` | Language/data source references | `trip_details.json` → `trip_details.md` |

## 5. Implementation Checklist

- [x] Create `trip_details.md` with all data from JSON
- [x] Delete `trip_details.json`
- [x] Update `language-config.ts` parser
- [x] Grep for all `trip_details.json` references and update
- [x] Verify zero remaining references
- [x] Run existing tests to confirm no regressions

## 6. BRD Traceability

| Requirement | Acceptance Criterion | Implemented in |
|---|---|---|
| REQ-001 | AC-1 | `trip_details.md` (new), `trip_details.json` (deleted) |
| REQ-001 | AC-2 | `trip_details.md` format uses headings + bullets |
| REQ-001 | AC-3 | Markdown format is plain-text editable |
| REQ-002 | AC-1 | `language-config.ts` regex parser |
| REQ-002 | AC-2 | Existing tests pass unchanged |
| REQ-003 | AC-1 | 10 files updated, grep confirms zero remaining |
| REQ-003 | AC-2 | All references point to `trip_details.md` |
