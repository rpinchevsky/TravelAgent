# High-Level Design

**Change:** Parallelize Phase B Day Generation
**Date:** 2026-03-15
**Author:** Development Team
**BRD Reference:** `technical_documents/2026-03-15_parallel-phase-b/business_requirements.md`
**Status:** Revision 2 (addressing SA feedback from architecture_review.md)

---

## 1. Overview

This change modifies Phase B of the Trip Generation Pipeline so that day files are generated in parallel across 3-4 subagents instead of sequentially. The main agent divides days into contiguous batches, spawns one subagent per batch using the Agent tool (all in a single response block), and collects results. Manifest update is deferred to a single write after all subagents complete. Only `content_format_rules.md` is modified; day file format, Phase A, Budget, Assembly, Render, and Regression are untouched.

## 2. Affected Components

| Component | File(s) | Type of Change |
|---|---|---|
| Phase B generation rules | `content_format_rules.md` | Modified -- Day Generation Protocol rewritten for parallel execution; manifest schema intro updated |
| Trip Generation Pipeline | `CLAUDE.md` | Modified -- Step 3 updated to reflect parallel generation and deferred manifest write |
| Day files | `day_XX_LANG.md` | Unchanged -- same format, different generation method |
| Manifest | `manifest.json` | Unchanged schema -- write timing changes (deferred to post-completion) |

## 3. Data Flow

Current (sequential):
```
Main Agent
  -> generate day_00, write file, update manifest
  -> generate day_01, write file, update manifest
  -> ...
  -> generate day_NN, write file, update manifest
  -> proceed to Budget
```

Target (parallel):
```
Main Agent
  |-- compute batches from N days (3-4 contiguous groups)
  |-- spawn subagents in parallel (single response block):
  |     |-- Subagent A: days 0..K    -> writes day_00 through day_K
  |     |-- Subagent B: days K+1..M  -> writes day_K+1 through day_M
  |     |-- Subagent C: days M+1..N  -> writes day_M+1 through day_N
  |     \-- (Subagent D if 4 batches)
  |-- all subagents return
  |-- verify all day files exist on disk
  |-- write manifest.json once (all days "complete")
  |-- proceed to Budget
```

### Batch Assignment Algorithm

Given N total days (day_00 through day_{N-1}):
1. Target batch count = 3 (use 4 if N >= 12; use 2 if N <= 3; use 1 if N == 1)
2. Batch size = ceil(N / batch_count)
3. Assign contiguous ranges: batch 1 = days [0, batch_size), batch 2 = [batch_size, 2*batch_size), etc.
4. Last batch may be smaller (remainder days).

### Subagent Context

Each subagent receives:
- `trip_details.md` (travelers, interests, schedule preferences)
- `overview_LANG.md` (Phase A master plan for cross-day context)
- The specific day rows from the Phase A table for its assigned batch
- The trip folder path and language code
- Instruction to write only its assigned day files and nothing else

## 4. Integration Points

| Integration Point | Contract | Preserved? |
|---|---|---|
| Phase A -> Phase B | Subagents read `overview_LANG.md` and day rows from Phase A table | Yes -- same inputs, just distributed |
| Phase B -> Budget | Budget reads `day_XX_LANG.md` files from disk | Yes -- same files, same format |
| Phase B -> Assembly | Assembly concatenates day files in order | Yes -- same filenames, same structure |
| Phase B -> Manifest | Manifest records day completion status | Yes -- same schema, write timing changes |
| Phase B -> Render | Render reads day markdown files | Yes -- no change to file format |
| Phase B -> Regression | Tests validate day file structure | Yes -- no change to file format |

## 5. Impact on Existing Behavior

| Area | Impact | Backward Compatible? |
|---|---|---|
| Day file content | Identical format and structure | Yes |
| Day file naming | Identical naming convention | Yes |
| Manifest schema | No schema change; write happens once instead of per-day | Yes |
| Trip assembly | No change -- reads same files | Yes |
| Budget assembly | No change -- reads same day cost sections | Yes |
| HTML rendering | No change -- reads same markdown | Yes |
| Regression tests | No change -- validates same file structure | Yes |
| Incremental edit | No change -- operates on individual day files | Yes |
| Sequential fallback | Not needed -- parallel is strictly better, but single-batch mode (N=1) effectively is sequential | Yes |
| Edge case N=0 | Skip Phase B entirely, proceed to Budget | Yes |

## 6. BRD Coverage Matrix

| Requirement | Addressed in HLD? | Section |
|---|---|---|
| REQ-001: Batch Assignment Logic | Yes | S3 (Batch Assignment Algorithm) |
| REQ-002: Parallel Subagent Execution | Yes | S3 (Data Flow -- target) |
| REQ-003: Subagent File Ownership Isolation | Yes | S3 (Subagent Context), S4 (Integration Points) |
| REQ-004: Post-Completion Manifest Update | Yes | S3 (Data Flow -- verify + write manifest) |
| REQ-005: Day File Content Integrity | Yes | S5 (all areas backward compatible) |
| REQ-006: Graceful Degradation | Yes | S3 (Data Flow -- verify step) |
