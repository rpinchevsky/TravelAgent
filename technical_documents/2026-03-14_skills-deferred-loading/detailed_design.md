# Detailed Design

**Change:** Add /render and /regression skills with deferred rule loading
**Date:** 2026-03-14
**Author:** Development Team
**HLD Reference:** `high_level_design.md`
**Status:** Approved (retroactive)

---

## 1. File Changes

### 1.1 `.claude/skills/regression/SKILL.md`

**Action:** Create

**Target state:** Skill definition that:
- Loads `development_rules.md`, `automation_rules.md`, `TripPage.ts`, `release_notes.md`
- Implements pre-validation gate (check HTML exists before running tests)
- Provides test execution workflow (progression → regression → report)
- Supports env var overrides for trip path targeting

**Rationale:** Encapsulates the full regression workflow in a single invokable skill; prevents partial execution.

---

### 1.2 `.claude/skills/render/SKILL.md`

**Action:** Create

**Target state:** Skill definition that:
- Loads `rendering-config.md`, `development_rules.md` §1–3, `base_layout.html`, `rendering_style_config.css`, `TripPage.ts`
- Guides per-day fragment generation, assembly, and pre-regression validation
- Supports incremental mode (rebuild only changed day fragments)

**Rationale:** Encapsulates the full HTML generation workflow; ensures all rendering context is loaded together.

---

### 1.3 `CLAUDE.MD`

**Action:** Modify

**Changes:**
1. Split "Rule Files" table into "Rule Files (Always Loaded)" (2 entries: `trip_planning_rules.md`, `content_format_rules.md`) and "Rule Files (Loaded On-Demand via Skills)" (3 entries: `/render`, `/regression`, `development_process.md`)
2. Update "Trip Generation Pipeline" step 6: "Invoke `/render` skill"
3. Update "Trip Generation Pipeline" step 7: "Invoke `/regression` skill"
4. Update "Incremental Edit Pipeline" step 3: "Invoke `/render` skill"
5. Update "Incremental Edit Pipeline" step 4: "Invoke `/regression` skill"
6. Add "Feature / Rule Change Pipeline" section referencing `development_process.md`

---

### 1.4 `content_format_rules.md`

**Action:** Modify

**Changes:**
1. HTML Export Workflow section: replace inline rendering instructions with "Invoke `/render` skill"
2. Remove 3 inline references to `rendering-config.md` (map-link hint, pro-tip hint, incremental edit step)
3. Replace with pointers to `/render` and `/regression` skills

**Rationale:** Ensures always-loaded context has zero references that could trigger eager loading of deferred files.

---

### 1.5 `automation/code/playwright.config.ts`

**Action:** Modify

**Changes:**
1. Add `TRIP_LTR_HTML` and `TRIP_RTL_HTML` env var support for overriding default trip paths
2. Add auto-discovery logic: find latest `trip_*` folder in `generated_trips/` (reuses pattern from `poi-parity.spec.ts`)
3. Fallback chain: env var → auto-discovery → hardcoded default

**Rationale:** Enables flexible test targeting without editing config; required for skill-driven execution.

---

### 1.6 `development_process.md`

**Action:** Create

**Target state:** 6-phase development cycle definition with stakeholders, responsibilities, phases, gates, folder structure, and integration table.

---

### 1.7 `technical_documents/templates/` (6 files)

**Action:** Create

**Files:** `business_requirements_template.md`, `high_level_design_template.md`, `detailed_design_template.md`, `architecture_review_template.md`, `test_plan_template.md`, `qa_architecture_review_template.md`

**Rationale:** Standardized templates ensure consistent documentation across changes.

## 2. Markdown Format Specification

Not applicable — no new markdown sections in day files.

## 3. HTML Rendering Specification

Not applicable — no HTML component changes.

## 4. Rule File Updates

| Rule File | Section | Change |
|---|---|---|
| `CLAUDE.md` | Rule Files table | Split into always-loaded vs. on-demand |
| `CLAUDE.md` | Trip Generation Pipeline | Steps 6-7 invoke skills |
| `CLAUDE.md` | Incremental Edit Pipeline | Steps 3-4 invoke skills |
| `content_format_rules.md` | HTML Export Workflow | Delegates to /render |
| `content_format_rules.md` | Inline references | 3 stale rendering-config.md refs removed |
| `rendering-config.md` | N/A | Minor additions (no structural change) |

## 5. Implementation Checklist

- [x] Create `.claude/skills/regression/SKILL.md`
- [x] Create `.claude/skills/render/SKILL.md`
- [x] Restructure CLAUDE.md rule file tables
- [x] Update CLAUDE.md pipeline steps to use skills
- [x] Update `content_format_rules.md` HTML export workflow
- [x] Remove 3 stale `rendering-config.md` references from `content_format_rules.md`
- [x] Refactor `playwright.config.ts` with env var support + auto-discovery
- [x] Create `development_process.md`
- [x] Create 6 document templates
- [x] Verify zero eager-load triggers in always-loaded files

## 6. BRD Traceability

| Requirement | Acceptance Criterion | Implemented in |
|---|---|---|
| REQ-001 | AC-1 | `.claude/skills/regression/SKILL.md` |
| REQ-001 | AC-2 | `CLAUDE.md` — rule file table |
| REQ-001 | AC-3 | `CLAUDE.md` — pipeline step 7 |
| REQ-001 | AC-4 | `CLAUDE.md` — incremental edit step 4 |
| REQ-002 | AC-1 | `.claude/skills/render/SKILL.md` |
| REQ-002 | AC-2 | `CLAUDE.md` — rule file table |
| REQ-002 | AC-3 | `CLAUDE.md` — pipeline step 6 |
| REQ-002 | AC-4 | `CLAUDE.md` — incremental edit step 3 |
| REQ-002 | AC-5 | `content_format_rules.md` — HTML export workflow |
| REQ-003 | AC-1 | `CLAUDE.md` — always loaded table |
| REQ-003 | AC-2 | `content_format_rules.md` — 3 refs removed |
| REQ-003 | AC-3 | Verified by token count comparison |
| REQ-004 | AC-1 | `development_process.md` |
| REQ-004 | AC-2 | `technical_documents/templates/` (6 files) |
| REQ-004 | AC-3 | `CLAUDE.md` — Feature/Rule Change Pipeline section |
