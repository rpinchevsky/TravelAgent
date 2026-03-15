# High-Level Design

**Change:** Parallelize per-day HTML fragment generation in the render pipeline
**Date:** 2026-03-15
**Author:** Development Team
**BRD Reference:** `technical_documents/2026-03-15_parallel-render-fragments/business_requirements.md`
**Status:** Draft

---

## 1. Overview

The render pipeline currently generates per-day HTML fragments sequentially in Step 2 of Fragment Master Mode (`rendering-config.md`). This change introduces batched parallel subagent execution for per-day HTML fragment generation, reusing the same batch sizing algorithm already proven in Phase B day markdown generation (`content_format_rules.md` § Day Generation Protocol).

The technical approach is:
1. Shell fragments (PAGE_TITLE, NAV_LINKS, NAV_PILLS), overview fragment, and budget fragment continue to be generated sequentially — they are fast and provide context needed by day fragments.
2. Day fragments (the bottleneck) are divided into batches using the Phase B batch table, and one subagent per batch is spawned in a single response block for parallel execution.
3. Each subagent writes individual `fragment_day_XX.html` files to the trip folder.
4. The main agent verifies all fragments exist, retries failed batches once, then proceeds to assembly (Step 3) unchanged.

## 2. Affected Components

| Component | File(s) | Type of Change |
|---|---|---|
| HTML rendering pipeline | `rendering-config.md` § Step 2 | Modified — sequential day generation replaced with parallel batch pattern |
| Agent prompt contract | `rendering-config.md` § Step 2.5 | Modified — contract extended with batch-specific day assignment |
| Render skill workflow | `.claude/skills/render/SKILL.md` § Step 2 | Modified — orchestration updated to spawn parallel subagents |
| Fragment assembly | `rendering-config.md` § Step 3 | Minor update — assembly now reads fragment files from disk instead of in-memory |
| Incremental rebuild | `rendering-config.md` § Incremental HTML Rebuild | No change — explicitly excluded from parallelization |
| Phase B day generation | `content_format_rules.md` § Day Generation Protocol | No change — referenced as pattern source only |

## 3. Data Flow

### Current (Sequential)

```
manifest.json + overview_LANG.md
        │
        ▼
  Step 1: Shell fragments (PAGE_TITLE, NAV_LINKS, NAV_PILLS)
        │
        ▼
  Step 2: Sequential day generation
     day_00_LANG.md → [render] → day-0 HTML fragment (in memory)
     day_01_LANG.md → [render] → day-1 HTML fragment (in memory)
     ...
     day_NN_LANG.md → [render] → day-N HTML fragment (in memory)
        │
        ▼
  Overview + Budget fragments (in memory)
        │
        ▼
  Step 3: Assembly → trip_full_LANG.html
```

### Target (Parallel)

```
manifest.json + overview_LANG.md
        │
        ▼
  Step 1: Shell fragments (PAGE_TITLE, NAV_LINKS, NAV_PILLS)
        │
        ▼
  Step 2a: Overview + Budget fragments (sequential, fast)
        │
        ▼
  Step 2b: Batch assignment (divide days into 1-4 batches per table)
        │
        ├──────────────────┬──────────────────┬──────────────────┐
        ▼                  ▼                  ▼                  ▼
   Subagent 1         Subagent 2         Subagent 3         Subagent 4
   day_00..day_02     day_03..day_05     day_06..day_08     day_09..day_11
        │                  │                  │                  │
        ▼                  ▼                  ▼                  ▼
   fragment_day_00.html  fragment_day_03.html  fragment_day_06.html  fragment_day_09.html
   fragment_day_01.html  fragment_day_04.html  fragment_day_07.html  fragment_day_10.html
   fragment_day_02.html  fragment_day_05.html  fragment_day_08.html  fragment_day_11.html
        │                  │                  │                  │
        └──────────────────┴──────────────────┴──────────────────┘
                                   │
                                   ▼
                      Step 2c: Verification (all fragments exist?)
                           │              │
                          Yes            No → retry failed batch(es) once
                           │              │
                           ▼              ▼
                      Step 3: Assembly → trip_full_LANG.html
```

### Key Data Artifacts

| Artifact | Producer | Consumer | Lifetime |
|---|---|---|---|
| `fragment_day_XX.html` | Subagent (one per day) | Main agent (assembly, Step 3) | Intermediate — retained for incremental rebuild |
| Shell fragments (PAGE_TITLE, etc.) | Main agent (Step 1) | Main agent (assembly, Step 3) | In-memory, same as today |
| Overview/budget fragments | Main agent (Step 2a) | Main agent (assembly, Step 3) | In-memory, same as today |

## 4. Integration Points

### manifest.json
- **Read** in Step 1 to determine total day count and language. No changes to manifest schema.
- Day count drives batch assignment (same table as Phase B).

### base_layout.html
- **No change.** Assembly step (Step 3) injects fragments into placeholders exactly as today.

### Agent Prompt Contract (Step 2.5)
- Each subagent receives all 9 mandatory items from `rendering-config.md` § 2.5.
- Additional batch-specific context: explicit list of day numbers to generate, and only the `day_XX_LANG.md` files for its assigned batch.
- Shell context (overview, manifest) provided read-only for cross-referencing (e.g., navigation ordering, trip metadata).

### Fragment File Contract
- Naming: `fragment_day_XX.html` in the trip folder (deterministic, no collisions).
- Content: raw `<div class="day-card" id="day-{N}">...</div>` block — no HTML/head/body wrappers.
- Assembly reads files in chronological order (day_00 first, day_NN last).

### Incremental Rebuild Mode
- **Unchanged.** Single-day edits regenerate only the stale fragment(s) sequentially and splice into the existing `trip_full_LANG.html`. Parallel batching applies only to full generation mode.

### Pre-Regression Validation (Step 4)
- **Unchanged.** Runs on the fully assembled HTML after Step 3, same as today.

## 5. Impact on Existing Behavior

| Area | Impact | Backward Compatible? |
|---|---|---|
| Full HTML generation (Step 2) | Day fragments generated in parallel batches instead of sequentially | Yes — output HTML is structurally identical |
| Fragment files on disk | New intermediate `fragment_day_XX.html` files appear in trip folder | Yes — additive; does not affect existing files |
| Assembly (Step 3) | Reads fragment files from disk instead of in-memory fragments | Yes — same concatenation logic, different source |
| Incremental rebuild | No change | Yes |
| Pre-regression validation (Step 4) | No change | Yes |
| Shell/overview/budget generation | No change — remains sequential | Yes |
| CSS, component rules, design system | No change | Yes |
| manifest.json schema | No change | Yes |
| Phase B markdown generation | No change — referenced as pattern only | Yes |

## 6. BRD Coverage Matrix

| Requirement | Addressed in HLD? | Section |
|---|---|---|
| REQ-001 (Batch assignment) | Yes | §3 (batch assignment step), §4 (manifest integration) |
| REQ-002 (Parallel subagent execution) | Yes | §3 (parallel data flow diagram) |
| REQ-003 (Subagent prompt contract) | Yes | §4 (Agent Prompt Contract integration point) |
| REQ-004 (Fragment verification and retry) | Yes | §3 (verification step in data flow) |
| REQ-005 (Fragment output mechanism) | Yes | §3 (fragment file artifacts), §4 (fragment file contract) |
| REQ-006 (Sequential steps unchanged) | Yes | §5 (backward compatibility for all sequential steps) |
| REQ-007 (Incremental rebuild exclusion) | Yes | §4 (incremental rebuild integration point), §5 (no change) |
