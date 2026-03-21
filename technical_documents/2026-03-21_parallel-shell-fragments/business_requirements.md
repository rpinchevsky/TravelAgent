# Business Requirements Document

**Change:** Parallelize Overview and Budget Fragment Generation with Day Batches
**Date:** 2026-03-21
**Author:** Product Manager
**Status:** Approved

---

## 1. Background & Motivation

The HTML render pipeline currently generates overview and budget fragments **sequentially** in Step 2a, before spawning day fragment subagents in Step 2c. This means the render pipeline cannot start day fragment generation until overview and budget fragments are both complete — even though these three workloads are entirely independent of each other.

Overview and budget fragments each require reading one markdown file (`overview_LANG.md`, `budget_LANG.md`) and producing one HTML fragment. Day fragment subagents read their assigned `day_XX_LANG.md` files independently. There is no data dependency between these three groups at generation time — they all feed into Step 3 (Assembly), which waits for all fragments regardless.

Moving overview and budget fragment generation into the same parallel response block as day batch subagents eliminates this artificial sequencing delay and reduces total render pipeline wall-clock time proportionally to the time previously spent on sequential overview/budget generation.

The only fragments that must remain sequential before the parallel block are the three shell fragments (PAGE_TITLE, NAV_LINKS, NAV_PILLS), because NAV_LINKS and NAV_PILLS are needed by day batch subagents as shell context (item 12 of the Agent Prompt Contract) and must be resolved before spawning subagents.

---

## 2. Scope

**In scope:**
- Restructuring `rendering-config.md` Step 2a to generate only shell fragments (PAGE_TITLE, NAV_LINKS, NAV_PILLS) sequentially.
- Moving overview fragment generation to Step 2c as a parallel subagent alongside day batch subagents.
- Moving budget fragment generation to Step 2c as a parallel subagent alongside day batch subagents.
- Updating Step 2d (Fragment Verification) to include `fragment_overview_LANG.html` and `fragment_budget_LANG.html` in its existence check.
- Updating Step 3 (Assembly) to read overview and budget from their respective fragment files rather than inline-generated content.
- Updating the render SKILL.md workflow description to match the new Step 2a/2c structure.
- Updating the Agent Prompt Contract (Step 2.5) to define what context overview and budget subagents receive.

**Out of scope:**
- Shell fragment generation (PAGE_TITLE, NAV_LINKS, NAV_PILLS) — these remain sequential and unchanged.
- Step 2b (Batch Assignment for day fragments) — unchanged.
- Step 3 (Assembly) assembly logic — `{{TRIP_CONTENT}}` concatenation order is unchanged; only the source of overview and budget content changes from inline to file-based.
- Incremental rebuild mode — overview and budget subagent parallelization applies only to full generation mode. Incremental mode continues to handle overview/budget changes per existing "When to do a full rebuild instead" rules.
- Automation test specs — no test currently asserts the render pipeline execution order.
- Any change to what the overview or budget HTML fragment contains structurally.

**Affected rule files:**
- `rendering-config.md` — Step 2a, Step 2c, Step 2d, Step 2.5, Step 3
- `.claude/skills/render/SKILL.md` — Step 2 workflow description (Steps 2a, 2c)

---

## 3. Requirements

### REQ-001: Shell-Only Sequential Step 2a

**Description:** Step 2a must generate exactly three items sequentially: PAGE_TITLE, NAV_LINKS, and NAV_PILLS. Overview fragment and budget fragment generation must be removed from Step 2a. The step heading and description must be updated to reflect the reduced scope.

**Acceptance Criteria:**
- [ ] AC-1: `rendering-config.md` Step 2a lists exactly three sequential items: PAGE_TITLE, NAV_LINKS, NAV_PILLS — no overview, no budget.
- [ ] AC-2: `rendering-config.md` Step 2a heading/description no longer references "Overview" or "Budget" fragments as sequential outputs.
- [ ] AC-3: `SKILL.md` Step 2a workflow description matches — lists shell fragments only, no overview or budget.

**Priority:** Must-have

**Affected components:**
- `rendering-config.md` § Step 2a
- `.claude/skills/render/SKILL.md` § Step 2, Step 2a bullet

---

### REQ-002: Overview and Budget Fragment Generation via Parallel Subagents in Step 2c

**Description:** Step 2c must spawn an overview subagent and a budget subagent in the same single-response parallel block as the day batch subagents. All subagent calls (overview + budget + all day batches) must appear in one response block, with no call depending on the output of another within that block.

**Acceptance Criteria:**
- [ ] AC-1: `rendering-config.md` Step 2c explicitly states that the overview subagent, budget subagent, and all day batch subagents are spawned in a single response block.
- [ ] AC-2: The overview subagent is defined in Step 2c as a distinct subagent with its own input file (`overview_LANG.md`) and output file (`fragment_overview_LANG.html`).
- [ ] AC-3: The budget subagent is defined in Step 2c as a distinct subagent with its own input file (`budget_LANG.md`) and output file (`fragment_budget_LANG.html`).
- [ ] AC-4: Step 2c specifies that no overview or budget subagent may depend on the output of any day batch subagent, and vice versa — all are data-independent within the block.
- [ ] AC-5: `SKILL.md` Step 2c description references overview and budget subagents as part of the parallel block.

**Priority:** Must-have

**Affected components:**
- `rendering-config.md` § Step 2c
- `.claude/skills/render/SKILL.md` § Step 2c bullet

---

### REQ-003: Overview and Budget Subagent Prompt Contract

**Description:** The Agent Prompt Contract (Step 2.5) must define the mandatory context items that overview and budget subagents receive when delegated. These subagents are simpler than day batch subagents (no day list, no batch-specific context) but must still receive the core rendering contract.

**Acceptance Criteria:**
- [ ] AC-1: Step 2.5 defines a separate context section (or subsection) for overview subagent: specifies that it receives `rendering-config.md` + `overview_LANG.md` + `manifest.json` and must write `fragment_overview_LANG.html` to the trip folder.
- [ ] AC-2: Step 2.5 defines a separate context section (or subsection) for budget subagent: specifies that it receives `rendering-config.md` + `budget_LANG.md` + `manifest.json` and must write `fragment_budget_LANG.html` to the trip folder.
- [ ] AC-3: The overview and budget subagent contracts specify that these subagents must NOT modify day fragments, shell fragments, or `manifest.json`.
- [ ] AC-4: The gate statement at the bottom of Step 2.5 is updated to reference overview and budget subagent contracts alongside day batch contracts.

**Priority:** Must-have

**Affected components:**
- `rendering-config.md` § Step 2.5

---

### REQ-004: Fragment Verification Includes Overview and Budget Fragments (Step 2d)

**Description:** Step 2d (Fragment Verification) currently verifies only day fragment files. It must be extended to also verify that `fragment_overview_LANG.html` and `fragment_budget_LANG.html` exist after parallel execution. Missing overview or budget fragments must trigger the same retry-then-stop logic as missing day fragments.

**Acceptance Criteria:**
- [ ] AC-1: `rendering-config.md` Step 2d lists `fragment_overview_LANG.html` and `fragment_budget_LANG.html` as required files alongside day fragment files.
- [ ] AC-2: If `fragment_overview_LANG.html` is missing, the retry logic re-spawns only the overview subagent (not day batches).
- [ ] AC-3: If `fragment_budget_LANG.html` is missing, the retry logic re-spawns only the budget subagent (not day batches).
- [ ] AC-4: If all day fragments are present but overview or budget is missing (or vice versa), the rule is unambiguous: verify ALL required fragments before proceeding; any missing fragment triggers its own targeted retry.

**Priority:** Must-have

**Affected components:**
- `rendering-config.md` § Step 2d

---

### REQ-005: Assembly Reads Overview and Budget from Fragment Files (Step 3)

**Description:** Step 3 currently assembles `{{TRIP_CONTENT}}` from inline-generated content for overview and budget, and from fragment files for days. After this change, overview and budget are also fragment files. Step 3 must be updated to read `fragment_overview_LANG.html` and `fragment_budget_LANG.html` from the trip folder, consistent with how day fragments are assembled.

**Acceptance Criteria:**
- [ ] AC-1: `rendering-config.md` Step 3 specifies that `{{TRIP_CONTENT}}` is assembled from: `fragment_overview_LANG.html` + `fragment_day_00_LANG.html` through `fragment_day_NN_LANG.html` + `fragment_budget_LANG.html` — all read from trip folder files.
- [ ] AC-2: Step 3 no longer describes overview or budget as inline/embedded content generated during assembly.
- [ ] AC-3: The concatenation order remains unchanged: overview first, days in chronological order, budget last.

**Priority:** Must-have

**Affected components:**
- `rendering-config.md` § Step 3

---

### REQ-006: Incremental Rebuild Mode Unchanged

**Description:** The incremental rebuild mode (triggered by `manifest.json → assembly.stale_days`) must not be affected by this change. Overview and budget parallelization applies only to full generation mode. Existing "When to do a full rebuild instead" rules for overview/budget changes remain unchanged.

**Acceptance Criteria:**
- [ ] AC-1: `rendering-config.md` § Incremental rebuild section contains no reference to overview or budget fragment subagents — these are full-generation-only constructs.
- [ ] AC-2: The incremental rebuild exception note in Step 2d (or 2c) explicitly states that overview and budget parallel subagents are a full-generation-only pattern.
- [ ] AC-3: No behavior change to the "When to do a full rebuild instead" criteria in `rendering-config.md` § Incremental HTML Rebuild.

**Priority:** Must-have

**Affected components:**
- `rendering-config.md` § Incremental HTML Rebuild
- `rendering-config.md` § Step 2c or 2d (incremental exception note)

---

## 4. Dependencies & Risks

| Dependency / Risk | Mitigation |
|---|---|
| Shell fragments (NAV_LINKS, NAV_PILLS) are referenced by day batch subagents as "shell context (read-only)" per Step 2.5 item 12. Overview and budget subagents do not use NAV_LINKS/NAV_PILLS — this is a one-way dependency that remains valid. | Confirm in Step 2.5 that overview/budget subagents do NOT require NAV_LINKS or NAV_PILLS in their context. Only day batch subagents need them. |
| Fragment file naming convention must be consistent: `fragment_overview_LANG.html` and `fragment_budget_LANG.html` must follow the same `fragment_XXX_LANG.html` pattern used by day fragments. | SA review to confirm naming convention is unambiguous and does not collide with day fragment filenames (which use `fragment_day_NN_LANG.html` format). |
| Step 2d retry logic currently targets batch-level retries (re-spawn per failed batch). Overview and budget are singleton subagents, not batches. Retry logic must be extended to handle singleton subagent failures without invoking day batch retry logic. | Explicitly define in Step 2d that overview and budget retries are per-subagent (not per-batch) and are independent of day batch retry. |
| Assembly (Step 3) currently reads overview and budget inline. If implementation incorrectly leaves partial inline reads alongside new file reads, duplicate content could appear in the assembled HTML. | Step 3 must clearly state that overview and budget content comes exclusively from fragment files — no inline fallback. |
| Incremental rebuild detection logic checks `stale_days` for day fragments. Overview and budget are not tracked as "stale days." If overview or budget markdown changes, the existing "When to do a full rebuild instead" rule ("Overview or budget changed") must continue to trigger a full rebuild, not an incremental one. | REQ-006 preserves this behavior. Dev must confirm no changes to stale detection logic. |

---

## 5. Acceptance Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| PM | Product Manager | 2026-03-21 | Approved |
