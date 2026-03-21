# Architecture Review

**Change:** Parallelize Overview and Budget Fragment Generation with Day Batches
**Date:** 2026-03-21
**Reviewer:** Software Architect
**Documents Reviewed:**
- `technical_documents/2026-03-21_parallel-shell-fragments/high_level_design.md`
- `technical_documents/2026-03-21_parallel-shell-fragments/detailed_design.md`
**Verdict:** Approved

---

## 1. Review Summary

This change removes a sequential bottleneck in the HTML render pipeline by moving overview and budget fragment generation from Step 2a (sequential) into Step 2c (parallel), alongside the existing day batch subagents. The design is well-scoped, directly aligned with BRD requirements, and architecturally sound.

The core insight is correct: overview and budget fragments are data-independent at generation time, so there is no justification for sequencing them before the parallel day batch block. The design extends the fragment-file pattern already used by day fragments to cover overview and budget, making the pipeline more uniform. Assembly (Step 3) becomes fully file-based with no inline content, which is a positive simplification.

All six BRD requirements are addressed in the design. The detailed design provides exact before/after diffs for every affected section of `rendering-config.md` and `SKILL.md`, which eliminates implementation ambiguity. BRD traceability is complete, with every acceptance criterion mapped to a specific design section.

One observation is noted regarding the current state of `rendering-config.md` (the `{{TRIP_CONTENT}}` description misplaced in Step 2a), which the DD correctly identifies and removes as a side-effect cleanup — this is a net improvement, not a risk.

---

## 2. Architecture Principles Checklist

| Principle | Status | Notes |
|---|---|---|
| Content / presentation separation | Pass | No change to HTML fragment content or structure. The `<section id="overview">` and `<section id="budget">` output is identical before and after — only the pipeline mechanism (inline vs. file-based) changes. Content can be changed by editing `overview_LANG.md` / `budget_LANG.md` without any UI rebuild. |
| Easy to extend for new requirements | Pass | The singleton subagent pattern (overview, budget) is a clean precedent. Adding a future singleton fragment (e.g., a trip-level introduction section) follows the same pattern: define a source file, an output file, add a subagent entry in Step 2c, extend Step 2d verification, and update Step 3 assembly. The design is explicitly extensible. |
| Consistent with existing patterns | Pass | Fragment file naming (`fragment_overview_LANG.html`, `fragment_budget_LANG.html`) follows the established `fragment_XXX_LANG.html` convention used by day fragments. The Agent Prompt Contract extension (items 14-21) mirrors the structure of items 10-13. Isolated per-type retry in Step 2d mirrors the existing per-batch retry for day fragments. |
| No unnecessary coupling | Pass | Overview and budget subagents are explicitly forbidden from reading NAV_LINKS/NAV_PILLS (no dependency on shell context). Day batch subagents retain their existing cross-reference to `overview_LANG.md` + `manifest.json` as read-only (not changed). Isolation rules in Step 2.5 items 17 and 21 are explicit and unambiguous. The only true ordering dependency (shell fragments before parallel block) is preserved and correctly justified. |
| Regeneration performance | Pass | Overview and budget changes continue to trigger a full rebuild per the existing "When to do a full rebuild instead" criteria — REQ-006 explicitly preserves this. The incremental rebuild mode for single-day edits is unchanged. The change improves wall-clock performance for full generation mode without introducing any new performance regressions. |

---

## 3. Feedback Items

### FB-1: Step 2.5 Core Contract item 9 — "Modular source rule" wording may mislead overview/budget subagents

**Severity:** Observation
**Affected document:** DD §1.1.4
**Section:** Step 2.5 Core Contract item 9
**Issue:** Item 9 of the Core Contract reads: "HTML is generated per-day from individual `day_XX.md` files, not from a monolithic trip file. The agent must read each day file separately and produce one HTML fragment file per day." This item is part of the Core Contract that all subagents receive, including the new overview and budget subagents. The "per-day" and "read each day file" language is specific to day fragments and could confuse an overview or budget subagent, potentially causing it to attempt to read day files unnecessarily.
**Suggestion:** At implementation time, consider adding a parenthetical clarification to item 9 such as "(applies to day batch subagents; overview and budget subagents receive their own source rules in items 14-17 and 18-21 respectively)." This is non-blocking because the overview and budget subagent contracts (items 14-17, 18-21) supersede the generic wording, and the isolation rules in those sections explicitly define what each subagent reads and writes.

---

### FB-2: Step 2d retry sequencing — parallel vs. sequential retry not specified

**Severity:** Observation
**Affected document:** DD §1.1.3
**Section:** Step 2d Fragment Verification
**Issue:** The DD defines that missing overview, budget, and day fragments each trigger their own isolated retry. However, the verification text does not specify whether retries for multiple simultaneous failures (e.g., overview missing AND a day batch missing) are issued in parallel or sequentially. In practice, since the LLM orchestrator issues retries one at a time per response block, this is unlikely to matter; but the rule as written could be interpreted to require sequential retry issue.
**Suggestion:** At implementation time, consider adding a note: "If multiple fragment types are missing simultaneously, re-spawn all failed subagents in a single response block (parallel retry)." This keeps retry performance consistent with the parallel execution philosophy of Step 2c.

---

### FB-3: SKILL.md step numbering — renumbering rationale documented in DD but not in the rule file itself

**Severity:** Observation
**Affected document:** DD §1.2.3
**Section:** SKILL.md Step 2d bullet
**Issue:** The DD notes that step numbering in SKILL.md increments because Step 2c now has items 6-9 (up from 6-7), and the Step 2d items shift to 10-11. This is a maintenance concern: SKILL.md uses sequential item numbers as a reader navigation aid, and any future change to Step 2c item count will silently invalidate the numbering of all subsequent items.
**Suggestion:** This is an inherent limitation of sequential numbering in a bullet-list workflow doc and is acceptable as-is. No action required at this time.

---

## 4. Best Practice Recommendations

**Fragment contract completeness check at implementation time:** When implementing the new subagent context sections (items 14-21 in Step 2.5), verify that the Core Contract item 3 ("Explicit list of required section IDs: `#overview`, `#budget`, `#day-0`...") is still meaningful for overview and budget subagents. These subagents only generate their own single section — they do not need a full section ID list. Item 3 as currently written is a day-fragment-oriented instruction. Implementation should confirm that overview/budget subagent prompts are not over-burdened with day-specific context that has no relevance to their task (consistent with the "simpler subagents" framing in the BRD).

**Step 3 dual-source risk at implementation time:** The BRD risk log correctly identifies the risk of partial inline reads surviving alongside new file reads in Step 3. The DD's target state for Step 3 item 2 includes an explicit "no inline or embedded fallback" statement. At implementation time, verify that the current `rendering-config.md` Step 3 item 2 contains no residual inline-generation language after the edit is applied.

**Consistency with development_rules.md §1 (HTML Generation Contract):** The Change Impact Matrix in `development_rules.md` §6 includes "rendering-config.md changed → HTML generation → Regenerate HTML." This change modifies `rendering-config.md`, so the next trip HTML generation after implementation will correctly trigger a full pipeline run. No test data synchronization is required (the BRD and DD correctly identify that no automation tests assert on render pipeline execution order).

---

## 5. Sign-off

| Role | Date | Verdict |
|---|---|---|
| Software Architect | 2026-03-21 | Approved |

**Conditions for approval:** None. Design is approved without conditions. The three feedback items are observations only and do not require resolution before implementation.
