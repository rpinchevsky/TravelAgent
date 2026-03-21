# High-Level Design

**Change:** Parallelize Overview and Budget Fragment Generation with Day Batches
**Date:** 2026-03-21
**Author:** Development Team
**BRD Reference:** `technical_documents/2026-03-21_parallel-shell-fragments/business_requirements.md`
**Status:** Draft

---

## 1. Overview

The HTML render pipeline currently has an artificial sequencing bottleneck: Step 2a generates overview and budget fragments synchronously, before day batch subagents start in Step 2c. Since overview, budget, and all day fragments are fully data-independent at generation time — they each read only their own source markdown file — this sequencing adds unnecessary latency equal to the combined generation time of the overview and budget fragments.

The change restructures Step 2a to produce only the three shell fragments (PAGE_TITLE, NAV_LINKS, NAV_PILLS) that are genuine prerequisites for day batch subagents (which need NAV_LINKS/NAV_PILLS as read-only shell context). Overview and budget fragment generation moves into Step 2c, where they run as singleton subagents in the same parallel response block as all day batch subagents. Step 2d verification and Step 3 assembly are updated to treat overview and budget as first-class fragment files on par with day fragments.

No structural change is made to what the overview or budget HTML fragments contain. The assembly concatenation order (overview → days → budget) is preserved. Incremental rebuild mode is unchanged.

---

## 2. Affected Components

| Component | File | Type of Change |
|---|---|---|
| Step 2a: Sequential fragment generation | `rendering-config.md` | Modified — removes overview and budget items; updated heading and description |
| Step 2c: Parallel subagent execution | `rendering-config.md` | Modified — adds overview subagent and budget subagent to parallel block; updated description |
| Step 2d: Fragment verification | `rendering-config.md` | Modified — adds `fragment_overview_LANG.html` and `fragment_budget_LANG.html` to required file list and retry logic |
| Step 2.5: Agent Prompt Contract | `rendering-config.md` | Modified — adds overview and budget subagent context sections; updates gate statement |
| Step 3: Assembly & Final Export | `rendering-config.md` | Modified — overview and budget read from fragment files rather than inline content |
| SKILL.md Step 2a bullet | `.claude/skills/render/SKILL.md` | Modified — removes overview and budget from sequential list |
| SKILL.md Step 2c bullet | `.claude/skills/render/SKILL.md` | Modified — references overview and budget subagents in parallel block description |

**Total files affected: 2**

---

## 3. Data Flow

### Before (Current State)

```
Step 2a (Sequential):
  overview.md + manifest.json → PAGE_TITLE (inline)
  overview.md + manifest.json → NAV_LINKS (inline)
  overview.md + manifest.json → NAV_PILLS (inline)
  overview_LANG.md            → fragment_overview_LANG.html  ← sequential delay
  budget_LANG.md              → fragment_budget_LANG.html    ← sequential delay

Step 2b: Batch assignment for days

Step 2c (Parallel — all in one response block):
  day batch 1 subagent → fragment_day_00_LANG.html ... fragment_day_NN_LANG.html
  day batch 2 subagent → ...
  day batch N subagent → ...

Step 2d: Verify fragment_day_XX_LANG.html files only

Step 3 (Assembly):
  {{TRIP_CONTENT}} = inline overview content
                   + fragment_day_00_LANG.html ... fragment_day_NN_LANG.html
                   + inline budget content
```

### After (Target State)

```
Step 2a (Sequential — shell only):
  overview.md + manifest.json → PAGE_TITLE (inline)
  overview.md + manifest.json → NAV_LINKS (inline)
  overview.md + manifest.json → NAV_PILLS (inline)

Step 2b: Batch assignment for days (unchanged)

Step 2c (Parallel — all in one response block):
  overview subagent → fragment_overview_LANG.html   ← now parallel
  budget subagent   → fragment_budget_LANG.html     ← now parallel
  day batch 1 subagent → fragment_day_00_LANG.html ...
  day batch 2 subagent → ...
  day batch N subagent → ...

Step 2d: Verify fragment_overview_LANG.html + fragment_budget_LANG.html + all fragment_day_XX_LANG.html files

Step 3 (Assembly):
  {{TRIP_CONTENT}} = fragment_overview_LANG.html (read from file)
                   + fragment_day_00_LANG.html ... fragment_day_NN_LANG.html
                   + fragment_budget_LANG.html (read from file)
```

---

## 4. Integration Points

**Shell fragment dependency (preserved):** NAV_LINKS and NAV_PILLS are still generated sequentially in Step 2a and provided as read-only shell context to day batch subagents (Agent Prompt Contract item 12). This one-way dependency is unchanged. Overview and budget subagents do NOT require NAV_LINKS or NAV_PILLS — they are simpler subagents with no cross-fragment dependencies.

**Fragment file naming convention:** Overview and budget fragment files follow the same `fragment_XXX_LANG.html` naming pattern used by day fragments (`fragment_day_NN_LANG.html`). The new names are `fragment_overview_LANG.html` and `fragment_budget_LANG.html`. These names do not collide with day fragment names (which include `_day_NN_` in the filename).

**Step 2d retry isolation:** Day fragment retries operate at batch granularity (re-spawn the failed batch subagent). Overview and budget retries operate at singleton granularity (re-spawn only the failed singleton). These retry paths are independent.

**Step 3 assembly source:** Currently, Step 3 describes overview and budget as inline/embedded content generated during assembly. After the change, both are read from fragment files on disk. The assembled HTML content is identical — only the mechanism (inline vs. file-read) changes. The concatenation order (overview → days → budget) is preserved.

**Incremental rebuild mode:** Unchanged. The `manifest.json → assembly.stale_days` mechanism detects stale day fragments only. Overview and budget changes continue to trigger a full rebuild per the "When to do a full rebuild instead" rules. Overview and budget fragment subagents are a full-generation-only construct.

**Agent Prompt Contract gate:** The gate statement at the bottom of Step 2.5 must be updated to acknowledge the new overview and budget subagent contracts alongside the existing day batch contract.

---

## 5. Impact on Existing Behavior

| Area | Impact | Backward Compatible? |
|---|---|---|
| Shell fragment generation (PAGE_TITLE, NAV_LINKS, NAV_PILLS) | No change — still generated sequentially in Step 2a | Yes |
| Overview HTML fragment content and structure | No change — same `<section id="overview">` output | Yes |
| Budget HTML fragment content and structure | No change — same `<section id="budget">` output | Yes |
| Day fragment generation | No change to batch logic, subagent contract, or output | Yes |
| Fragment file naming | Two new file names introduced: `fragment_overview_LANG.html`, `fragment_budget_LANG.html` | Yes — additive only |
| Assembly concatenation order | Unchanged: overview → days → budget | Yes |
| Assembled HTML output (`trip_full_LANG.html`) | Byte-for-byte identical — only the pipeline mechanism changes | Yes |
| Incremental rebuild mode | No change | Yes |
| Automation tests | No test currently asserts render pipeline execution order; no test changes required | Yes |
| Wall-clock render time | Reduced — overview and budget generation now runs in parallel with day batches | Improvement |

---

## 6. BRD Coverage Matrix

| Requirement | Addressed in HLD? | Section |
|---|---|---|
| REQ-001: Shell-only sequential Step 2a | Yes | §2 (Step 2a row), §3 (Before/After flow) |
| REQ-002: Overview and budget via parallel subagents in Step 2c | Yes | §2 (Step 2c row), §3 (After flow), §4 (integration points) |
| REQ-003: Overview and budget subagent prompt contract | Yes | §2 (Step 2.5 row), §4 (Agent Prompt Contract gate) |
| REQ-004: Fragment verification includes overview and budget | Yes | §2 (Step 2d row), §3 (After flow), §4 (retry isolation) |
| REQ-005: Assembly reads overview and budget from fragment files | Yes | §2 (Step 3 row), §3 (After flow), §4 (Step 3 assembly source) |
| REQ-006: Incremental rebuild mode unchanged | Yes | §4 (Incremental rebuild mode), §5 (impact table row) |
