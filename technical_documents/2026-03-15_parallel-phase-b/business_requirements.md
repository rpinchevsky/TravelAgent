# Business Requirements Document

**Change:** Parallelize Phase B Day Generation
**Date:** 2026-03-15
**Author:** Product Manager
**Status:** Approved

---

## 1. Background & Motivation

Phase B currently generates all day files sequentially within a single agent context. For a typical 11–12 day trip, this means 12 serial LLM calls, each waiting for the previous to complete. Since Phase A already assigns concrete POIs to each day, there is no cross-day dependency during generation — each day file is self-contained. Parallelizing day generation across multiple subagents will significantly reduce wall-clock time for trip generation without sacrificing quality or introducing duplication risk.

---

## 2. Scope

**In scope:**
- Splitting Phase B day generation into parallel batches across 3–4 subagents
- Defining batch assignment logic (which days go to which subagent)
- Updating `content_format_rules.md` to document the parallel generation protocol
- Deferring manifest update to a single write after all subagents complete

**Out of scope:**
- Phase A (overview generation, POI assignment) — no changes
- Budget assembly — no changes
- Trip assembly (mechanical concat) — no changes
- HTML rendering (`/render` skill) — no changes
- Regression testing (`/regression` skill) — no changes
- Incremental edit workflow — no changes
- Day file format or content requirements — no changes
- Cross-day narrative references (not used per existing rules)

**Affected rule files:**
- `content_format_rules.md` — §Phase B: Detailed Operational Plan, §Day Generation Protocol

---

## 3. Requirements

### REQ-001: Batch Assignment Logic

**Description:** The main agent must divide the total days (day_00 through day_NN) into 3–4 roughly equal batches. Each batch is assigned to one subagent. The number of subagents scales with trip length: trips with fewer than 4 days use fewer subagents (minimum 1 per batch).

**Acceptance Criteria:**
- [ ] AC-1: For a trip with N days, days are divided into ceil(N/3) to ceil(N/4) batches, with each batch containing at most ceil(N/3) days and at least 1 day.
- [ ] AC-2: Every day from day_00 through day_NN is assigned to exactly one batch (no gaps, no overlaps).
- [ ] AC-3: Batch assignment preserves chronological order within each batch (e.g., batch 1 gets days 0–2, not days 0, 5, 8).

**Priority:** Must-have

**Affected components:**
- `content_format_rules.md` — Day Generation Protocol section

---

### REQ-002: Parallel Subagent Execution

**Description:** The main agent spawns 3–4 subagents in parallel (using the Agent tool). Each subagent receives its assigned batch of days and generates only those day files. Subagents run concurrently, not sequentially.

**Acceptance Criteria:**
- [ ] AC-1: Subagents are spawned in parallel (not sequentially) — all subagent Agent tool calls appear in the same response block.
- [ ] AC-2: Each subagent generates only the day files in its assigned batch — it does not write files belonging to another batch.
- [ ] AC-3: Each subagent receives the same generation context as the current sequential protocol: `trip_details.md`, `overview_LANG.md`, and the relevant day rows from Phase A.

**Priority:** Must-have

**Affected components:**
- `content_format_rules.md` — Day Generation Protocol section

---

### REQ-003: Subagent File Ownership Isolation

**Description:** Each subagent writes only its own day files (`day_XX_LANG.md`). No subagent writes to `manifest.json` or any file outside its assigned day range. This prevents write conflicts.

**Acceptance Criteria:**
- [ ] AC-1: During parallel generation, `manifest.json` is not modified by any subagent.
- [ ] AC-2: Each subagent creates only `day_XX_LANG.md` files where XX is within its assigned batch range.
- [ ] AC-3: No subagent reads or modifies another subagent's day files.

**Priority:** Must-have

**Affected components:**
- `content_format_rules.md` — Day Generation Protocol section, manifest.json update rules

---

### REQ-004: Post-Completion Manifest Update

**Description:** After all subagents complete, the main agent writes `manifest.json` once with all days set to `"complete"` and their `last_modified` timestamps. This replaces the current per-day manifest update.

**Acceptance Criteria:**
- [ ] AC-1: After all subagents complete, every day entry in `manifest.json` under `languages.LANG.days` has `status: "complete"`.
- [ ] AC-2: Every day entry has a non-null `last_modified` timestamp.
- [ ] AC-3: The manifest is written exactly once after all subagents finish (not incrementally during generation).

**Priority:** Must-have

**Affected components:**
- `content_format_rules.md` — Day Generation Protocol step 3, manifest.json schema docs

---

### REQ-005: Day File Content Integrity

**Description:** Day files produced by parallel subagents must be identical in format and content quality to those produced by the current sequential process. All per-day content requirements (route map, hourly table, POI sections, budget table, backup plan, grocery store, along-the-way stops) remain unchanged.

**Acceptance Criteria:**
- [ ] AC-1: Every generated day file passes the existing regression test suite without modification to tests.
- [ ] AC-2: Day file format matches the per-day file format spec in `content_format_rules.md` (all 9 content requirement sections present).
- [ ] AC-3: No duplicate POIs appear across day files (verified by checking POI names across all days).

**Priority:** Must-have

**Affected components:**
- Day files (`day_XX_LANG.md`) — content unchanged, generation method changes

---

### REQ-006: Graceful Degradation

**Description:** If a subagent fails (e.g., network error, tool failure), the main agent must detect the failure and either retry the failed batch or report the specific failed days so the user can act.

**Acceptance Criteria:**
- [ ] AC-1: After all subagents return, the main agent verifies that every expected day file exists on disk.
- [ ] AC-2: Missing day files are reported with their day numbers and batch assignment.
- [ ] AC-3: The pipeline does not proceed to Budget/Assembly if any day files are missing.

**Priority:** Should-have

**Affected components:**
- `content_format_rules.md` — Day Generation Protocol (new verification step)

---

## 4. Dependencies & Risks

| Dependency / Risk | Mitigation |
|---|---|
| Phase A must assign concrete POIs per day (not vague themes) for deduplication guarantee | Already the case per current Phase A rules; no change needed |
| Agent tool must support parallel invocations in a single response | Confirmed supported by Claude Agent SDK |
| Subagent context size — each subagent needs trip_details + overview + day rows | Context is small (overview + trip_details < 2K tokens); no risk |
| File write conflicts if batches overlap | REQ-001 AC-2 ensures no overlap; REQ-003 enforces isolation |
| Manifest corruption if subagents write concurrently | REQ-003/REQ-004: only main agent writes manifest, once, after completion |

---

## 5. Acceptance Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| PM | Product Manager | 2026-03-15 | Approved |
