# High-Level Design

**Change:** Add /render and /regression skills with deferred rule loading
**Date:** 2026-03-14
**Author:** Development Team
**BRD Reference:** `business_requirements.md`
**Status:** Approved (retroactive)

---

## 1. Overview

Introduce two Claude Code skills (`/render`, `/regression`) that encapsulate the HTML generation and regression testing workflows respectively. Restructure CLAUDE.md to split rule files into "always loaded" (2 files for trip planning) and "on-demand via skills" (rendering, automation, development). This reduces token consumption for the most common workflow (trip generation) by ~10-12K tokens while preserving full functionality when rendering or testing is needed.

Separately, add `development_process.md` and 6 document templates to establish a structured development cycle.

## 2. Affected Components

| Component | File(s) | Type of Change |
|---|---|---|
| Regression skill | `.claude/skills/regression/SKILL.md` | New file |
| Render skill | `.claude/skills/render/SKILL.md` | New file |
| CLAUDE.md | `CLAUDE.MD` | Modified — rule file table split, pipeline steps updated |
| Content format rules | `content_format_rules.md` | Modified — HTML references → /render skill |
| Playwright config | `automation/code/playwright.config.ts` | Modified — env var overrides + auto-discovery |
| Dev process | `development_process.md` | New file |
| Templates | `technical_documents/templates/*.md` | New files (6) |
| Rendering config | `rendering-config.md` | Modified — minor additions |

## 3. Data Flow

```
User invokes trip planning (Phase A/B):
  CLAUDE.md ──loads──► trip_planning_rules.md + content_format_rules.md
  (rendering & automation files NOT loaded — saves ~10-12K tokens)

User invokes /render:
  SKILL.md ──loads──► rendering-config.md, development_rules.md §1-3,
                      base_layout.html, CSS, TripPage.ts

User invokes /regression:
  SKILL.md ──loads──► development_rules.md, automation_rules.md,
                      TripPage.ts, release_notes.md
```

## 4. Integration Points

- Skills integrate with Claude Code's native skill system (`.claude/skills/{name}/SKILL.md`)
- `/render` skill is invoked at pipeline step 6 (Generate HTML) and incremental edit step 3
- `/regression` skill is invoked at pipeline step 7 (Validate & Test) and incremental edit step 4
- Playwright config now supports `TRIP_LTR_HTML` / `TRIP_RTL_HTML` env vars for flexible test targeting
- Skills load the same rule files previously loaded eagerly — no content changes

## 5. Impact on Existing Behavior

| Area | Impact | Backward Compatible? |
|---|---|---|
| Trip planning conversations | Reduced token usage (~10-12K saved) | Yes (improvement) |
| HTML generation workflow | Now invoked via `/render` instead of manual reference | Yes (same rules loaded) |
| Regression testing workflow | Now invoked via `/regression` instead of manual reference | Yes (same rules loaded) |
| Playwright config | Supports env var overrides; auto-discovers latest trip | Yes (fallback to existing behavior) |
| Test assertions | No change | Yes |

## 6. BRD Coverage Matrix

| Requirement | Addressed in HLD? | Section |
|---|---|---|
| REQ-001 | Yes | §2 (Regression skill), §3, §4 |
| REQ-002 | Yes | §2 (Render skill), §3, §4 |
| REQ-003 | Yes | §1, §3, §5 |
| REQ-004 | Yes | §2 (Dev process, Templates) |
