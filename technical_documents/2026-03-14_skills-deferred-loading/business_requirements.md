# Business Requirements Document

**Change:** Add /render and /regression skills with deferred rule loading
**Date:** 2026-03-14
**Author:** Product Manager
**Status:** Approved (retroactive)

---

## 1. Background & Motivation

Every conversation loads all rule files into context at session start, consuming ~10-12K tokens even when the task only requires trip planning (Phase A/B). Rule files for HTML rendering (`rendering-config.md`, `development_rules.md`, CSS, `base_layout.html`) and automation (`automation_rules.md`, `TripPage.ts`) are only needed during specific pipeline stages. Loading them eagerly wastes context budget and increases cost for the most common workflow (trip generation).

Additionally, there is no structured way to invoke HTML generation or regression testing — users must manually reference the correct rule files and follow multi-step processes.

## 2. Scope

**In scope:**
- Create `/render` skill that loads rendering rule files on demand and guides HTML generation
- Create `/regression` skill that loads automation rule files on demand and guides test execution
- Restructure CLAUDE.md to separate "always loaded" from "on-demand" rule files
- Update pipeline references in CLAUDE.md and `content_format_rules.md` to use skills
- Remove stale `rendering-config.md` references from `content_format_rules.md`
- Add `development_process.md` and document templates

**Out of scope:**
- Changing any rule file content (rendering rules, automation rules remain identical)
- Changing trip generation behavior
- Changing test assertions or test logic

**Affected rule files:**
- `CLAUDE.md` — rule file table restructured, pipeline steps updated
- `content_format_rules.md` — HTML export workflow and inline references updated

## 3. Requirements

### REQ-001: /regression skill with latent tool definition

**Description:** Create a Claude Code skill that loads automation context on demand when regression testing is needed, replacing eager loading of `automation_rules.md` at session start.

**Acceptance Criteria:**
- [x] AC-1: `.claude/skills/regression/SKILL.md` exists and loads `development_rules.md`, `automation_rules.md`, `TripPage.ts`, `release_notes.md`
- [x] AC-2: `automation_rules.md` is removed from CLAUDE.md "always loaded" table
- [x] AC-3: Pipeline step 7 (Validate & Test) invokes `/regression` skill
- [x] AC-4: Incremental edit pipeline step 4 invokes `/regression` skill

**Priority:** Must-have

**Affected components:**
- `.claude/skills/regression/SKILL.md` (new)
- `CLAUDE.md`

---

### REQ-002: /render skill with latent tool definition

**Description:** Create a Claude Code skill that loads rendering context on demand when HTML generation is needed, replacing eager loading of `rendering-config.md`, `development_rules.md`, CSS, and `base_layout.html`.

**Acceptance Criteria:**
- [x] AC-1: `.claude/skills/render/SKILL.md` exists and loads `rendering-config.md`, `development_rules.md` §1–3, `base_layout.html`, `rendering_style_config.css`, `TripPage.ts`
- [x] AC-2: `rendering-config.md` and `development_rules.md` are removed from CLAUDE.md "always loaded" table
- [x] AC-3: Pipeline step 6 (Generate HTML) invokes `/render` skill
- [x] AC-4: Incremental edit pipeline step 3 invokes `/render` skill
- [x] AC-5: `content_format_rules.md` HTML export workflow delegates to `/render` skill

**Priority:** Must-have

**Affected components:**
- `.claude/skills/render/SKILL.md` (new)
- `CLAUDE.md`
- `content_format_rules.md`

---

### REQ-003: Deferred loading reduces token consumption

**Description:** Trip planning conversations (Phase A/B) must not load rendering or automation rule files.

**Acceptance Criteria:**
- [x] AC-1: CLAUDE.md "Always Loaded" table contains only `trip_planning_rules.md` and `content_format_rules.md`
- [x] AC-2: Zero references to `rendering-config.md` remain in `content_format_rules.md` (which is always loaded)
- [x] AC-3: Estimated savings of ~10-12K tokens for trip planning conversations

**Priority:** Must-have

**Affected components:**
- `CLAUDE.md`
- `content_format_rules.md`

---

### REQ-004: Development process documentation

**Description:** Establish a 6-phase development cycle with document templates for all future changes.

**Acceptance Criteria:**
- [x] AC-1: `development_process.md` defines 6 phases with gates, stakeholders, and deliverables
- [x] AC-2: Templates exist in `technical_documents/templates/` for all 6 document types
- [x] AC-3: CLAUDE.md references the development process for feature/rule changes

**Priority:** Must-have

**Affected components:**
- `development_process.md` (new)
- `technical_documents/templates/` (6 new templates)
- `CLAUDE.md`

## 4. Dependencies & Risks

| Dependency / Risk | Mitigation |
|---|---|
| Skills must be invokable via `/render` and `/regression` syntax | Verified with Claude Code skill system |
| Deferred files must still be loaded when needed | Skills explicitly load all required files |
| Stale references could trigger eager loading | Grep-verified zero remaining references |

## 5. Acceptance Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| PM | Product Manager | 2026-03-14 | Approved (retroactive) |
