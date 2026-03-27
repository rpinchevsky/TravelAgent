# Architecture Review

**Change:** Add "Mix of All" option to categorical quiz questions
**Date:** 2026-03-22
**Reviewer:** Software Architect
**Documents Reviewed:** `technical_documents/2026-03-22_mix-option-questions/high_level_design.md`, `technical_documents/2026-03-22_mix-option-questions/detailed_design.md`
**Verdict:** Approved

---

## 1. Review Summary

This is a well-scoped, low-risk additive change that extends three existing 3-card quiz questions to 4-card variants. The design correctly identifies all affected layers (HTML, JS scoring, JS markdown labels, i18n catalogs, rule documentation) and introduces no new architectural patterns, data flows, or interaction models. Every change reuses established conventions already proven in the codebase (e.g., the `rhythm` question already uses the `question-options--4` CSS class and 4-card layout). The `scoreFoodItem()` modification is minimal and correctly placed ahead of existing branches, preserving backward compatibility. All seven BRD requirements (REQ-001 through REQ-007) are fully traced to specific design sections with acceptance criteria coverage.

## 2. Architecture Principles Checklist

| Principle | Status | Notes |
|---|---|---|
| Content / presentation separation | Pass | New option values are stored as `data-value` strings; display labels live in external i18n catalogs (`locales/ui_*.json`). Content can change (translations, label text) without touching HTML structure or JS logic. |
| Easy to extend for new requirements | Pass | Adding a 5th option to any question would follow the identical pattern: add a `q-card` div, add i18n keys, add label map entry, optionally add scoring branch. The design does not introduce any hard-coded limits. |
| Consistent with existing patterns | Pass | The new cards use the exact same `q-card` component structure, `data-i18n` convention, `question-options--4` CSS class (already used by `rhythm` at line 2172), and single-select radio behavior. The i18n key naming follows the established `q_{question}_{value}` / `q_{question}_{value}_desc` pattern. |
| No unnecessary coupling | Pass | Each layer is independently modifiable: HTML cards, JS scoring, JS label maps, and i18n catalogs are separate concerns that communicate through `data-value` strings. The scoring change is isolated to the `style === 'mix'` branch. No new cross-component dependencies introduced. |
| Regeneration performance | Pass | This is a UI-only change to `trip_intake.html` and locale files. No trip content files, HTML rendering templates, or generation pipeline code are affected. Content regeneration is not triggered. |

## 3. Feedback Items

### FB-1: Verify `mealpriority: 'all'` does not affect food scoring unexpectedly

**Severity:** Observation
**Affected document:** DD
**Section:** §1.4
**Issue:** The HLD data flow (§3) correctly notes that `mealpriority` is "NOT used in food scoring." However, inspecting `scoreFoodItem()` (lines 4434-4463 of `trip_intake.html`), the function receives `mealpriority` via `fq.mealpriority` (line 4439) but does not use it in any scoring branch. This is safe -- the new `all` value flows through without effect. However, if a future change adds meal-priority-based scoring, the `all` value will need its own handling similar to the `diningstyle: 'mix'` branch.
**Suggestion:** No action required now. Add a code comment near line 4439 noting that `mealpriority` is read but not scored, so future developers adding meal-based scoring know to handle the `all` value.

---

### FB-2: Consider adding `mealpriority: 'all'` and `transport: 'mix'` handling to trip planning pipeline documentation

**Severity:** Observation
**Affected document:** HLD
**Section:** §4 (Integration Points)
**Issue:** The HLD states the trip generation pipeline "reads markdown string values; does not validate against enumerated lists" and therefore needs no change. This is architecturally correct. However, the trip planner (LLM) will now encounter new label strings like "Every meal matters equally" and "Mix -- whatever fits best" in the generated `trip_details.md`. While the LLM is expected to interpret these naturally, the `trip_planning_rules.md` file that guides generation should ideally document the semantic meaning of these values for the planner.
**Suggestion:** The DD already covers updating `trip_intake_rules.md` (§1.12) with the new allowed values. Verify that `trip_planning_rules.md` does not have an enumerated list of allowed values for these fields that would need updating. If it does, add the new values there as well.

---

### FB-3: Line number references in DD may drift during implementation

**Severity:** Observation
**Affected document:** DD
**Section:** §1.1 through §1.12
**Issue:** The DD references specific line numbers (e.g., "lines 2377-2397", "line 4434", "line 5457") that are accurate as of the current codebase state but will shift as earlier edits in the same file are applied during implementation. This is a standard issue with line-number references in single-file architectures.
**Suggestion:** During implementation, use the "Current state" code snippets (not line numbers) to locate edit targets. The snippets provided in the DD are exact matches to the current codebase and are reliable anchors.

## 4. Best Practice Recommendations

1. **Implementation order:** Apply changes in the order listed in the DD (HTML cards first, then scoring, then labels, then i18n, then rules). This ensures each change can be tested independently. In particular, add the `scoreFoodItem()` `mix` branch before the existing `item.style === style` check to guarantee it short-circuits correctly.

2. **JSON validation:** After editing each `locales/ui_*.json` file, validate JSON syntax before moving to the next file. A single trailing comma or missing quote in one of the 12 files will silently break i18n loading for that language.

3. **Visual verification:** The `question-options--4` CSS grid is already confirmed at line 1286 with responsive breakpoints at 768px (2-column) and 600px (2-column). No CSS changes are needed, but a quick visual check at desktop and mobile widths for the three modified questions is prudent since these questions previously used the default 3-column grid.

4. **Regression scope:** The change is additive with no modifications to existing option values, scoring paths, or defaults. Regression risk is minimal. Focus testing on: (a) new card selection behavior, (b) generated markdown output for new values, (c) food scoring when `diningstyle` is `mix` vs. existing values, (d) 4-card grid layout on all three questions.

## 5. Sign-off

| Role | Date | Verdict |
|---|---|---|
| Software Architect | 2026-03-22 | Approved |
