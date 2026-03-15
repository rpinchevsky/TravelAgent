# Detailed Design

**Change:** Parallelize Phase B Day Generation
**Date:** 2026-03-15
**Author:** Development Team
**HLD Reference:** `technical_documents/2026-03-15_parallel-phase-b/high_level_design.md`
**Status:** Revision 2 (addressing SA feedback from architecture_review.md)

---

## 1. File Changes

### 1.1 `content_format_rules.md`

**Action:** Modify

**Current state:**
```markdown
### Day Generation Protocol

1. Generate `day_00_LANG.md` (arrival) first, if applicable.
2. Generate `day_01_LANG.md` through `day_NN_LANG.md` sequentially.
3. After writing each day file:
   - Update `manifest.json`: under `languages.LANG`, set that day's `status` to `"complete"`, record `last_modified`.
4. After all days are complete, proceed to Budget and Assembly.
```

**Target state:**
```markdown
### Day Generation Protocol

Phase B generates days in parallel across multiple subagents for faster wall-clock execution. Each day file is self-contained (Phase A provides all cross-day coordination), so days can be generated independently.

#### Step 1: Batch Assignment

The main agent divides all days (day_00 through day_NN) into contiguous batches:

| Total Days (N) | Batch Count | Batch Size |
|---|---|---|
| 0 | 0 | — (skip Phase B, proceed to Budget) |
| 1 | 1 | 1 |
| 2-3 | 2 | ceil(N/2) |
| 4-11 | 3 | ceil(N/3) |
| 12+ | 4 | ceil(N/4) |

Batches are assigned in chronological order: batch 1 gets the lowest-numbered days, batch 2 the next range, etc. The last batch may contain fewer days (remainder). Every day must appear in exactly one batch -- no gaps, no overlaps.

**Example:** 12 days (day_00 through day_11), 4 batches:
- Batch 1: day_00, day_01, day_02
- Batch 2: day_03, day_04, day_05
- Batch 3: day_06, day_07, day_08
- Batch 4: day_09, day_10, day_11

#### Step 2: Parallel Subagent Execution

The main agent spawns one subagent per batch using the Agent tool. **All subagent calls must appear in the same response block** so they execute in parallel, not sequentially.

Each subagent receives this context:
1. `trip_details.md` -- travelers, interests, schedule preferences.
2. `overview_LANG.md` -- the Phase A master plan (for cross-day context).
3. The assigned day rows from the Phase A table (only the rows for this batch).
4. The trip folder path and language code.
5. The list of day numbers to generate (e.g., "Generate day_03, day_04, day_05").

Each subagent:
- Generates its assigned `day_XX_LANG.md` files following the Per-Day File Format and Per-Day Content Requirements (unchanged).
- Writes only its own day files to the trip folder.
- Does NOT write to `manifest.json`.
- Does NOT read or write day files outside its assigned range.

#### Step 3: Verification

After all subagents return, the main agent verifies that every expected day file (`day_00_LANG.md` through `day_NN_LANG.md`) exists on disk.

- If all files are present: proceed to Step 4.
- If any files are missing: identify the failed batch(es) and re-spawn one subagent per failed batch (single retry). After the retry, verify again:
  - If all files are now present: proceed to Step 4.
  - If files are still missing after retry: report the missing day numbers and their batch assignment. Do NOT proceed to Budget or Assembly.

#### Step 4: Manifest Update

Write `manifest.json` once with all days set to `"complete"`:
- Under `languages.LANG.days`, set every day's `status` to `"complete"` and `last_modified` to the current timestamp.
- This is a single write operation, not incremental.

#### Step 5: Proceed

After manifest is written, proceed to Budget and Assembly as normal.
```

**Rationale:** Replaces the sequential protocol with a parallel one. The batch assignment table gives deterministic, unambiguous batch sizes for any trip length. Subagent isolation rules prevent write conflicts. Verification step catches failures before proceeding. Deferred manifest write eliminates concurrent write risk.

### 1.2 `content_format_rules.md` — Manifest Schema Intro (FB-3)

**Action:** Modify

**Current state (line 31):**
```markdown
Created during Phase A, updated after each day is generated:
```

**Target state:**
```markdown
Created during Phase A, updated after all days are generated (see Day Generation Protocol):
```

**Rationale:** The manifest is no longer updated per-day; it is written once after all subagents complete. This aligns the schema intro with the new Day Generation Protocol Step 4.

---

### 1.3 `CLAUDE.md` — Trip Generation Pipeline Step 3 (FB-1)

**Action:** Modify

**Current state (line 50):**
```markdown
3. **Phase B** — Day-by-day generation: write `day_00.md` through `day_NN.md`, update manifest after each day (`content_format_rules.md`)
```

**Target state:**
```markdown
3. **Phase B** — Parallel day generation: spawn subagents to write `day_00.md` through `day_NN.md`, verify all files, update manifest once (`content_format_rules.md`)
```

**Rationale:** The pipeline description must reflect the new parallel protocol. Generation is no longer sequential, and manifest is updated once, not per-day.

---

## 2. Markdown Format Specification

No new markdown sections are introduced. Day file format (`day_XX_LANG.md`) remains exactly as specified in the existing Per-Day File Format section of `content_format_rules.md`. No changes to section headings, content requirements, or ordering.

---

## 3. HTML Rendering Specification

No HTML rendering changes. The `/render` skill reads the same day markdown files in the same format. This change is invisible to the rendering pipeline.

---

## 4. Rule File Updates

| Rule File | Section | Change |
|---|---|---|
| `content_format_rules.md` | Day Generation Protocol (lines 150-156) | Replace 4-step sequential protocol with 5-step parallel protocol (batch assignment, parallel execution, verification with retry, manifest update, proceed) |
| `content_format_rules.md` | Phase B header (line 93) | Update intro sentence to say "each day into its own file" instead of "one day at a time" for consistency |
| `content_format_rules.md` | Manifest schema intro (line 31) | Change "updated after each day is generated" to "updated after all days are generated (see Day Generation Protocol)" (FB-3) |
| `CLAUDE.md` | Trip Generation Pipeline step 3 (line 50) | Change to reflect parallel generation and single manifest update (FB-1) |

### Exact edit to Phase B intro (line 93):

**Current:**
```markdown
Phase B generates **one day at a time**, each into its own file. This avoids output token limits and enables per-day editing.
```

**Target:**
```markdown
Phase B generates **each day into its own file**, using parallel subagents for faster execution. This avoids output token limits and enables per-day editing.
```

---

## 5. Implementation Checklist

- [ ] Update `content_format_rules.md` Phase B intro sentence (line 93)
- [ ] Replace Day Generation Protocol section in `content_format_rules.md` (lines 150-156) with the 5-step parallel protocol (including retry in Step 3 and N=0 edge case in Step 1)
- [ ] Update `content_format_rules.md` manifest schema intro (line 31) — change "updated after each day" to "updated after all days are generated" (FB-3)
- [ ] Update `CLAUDE.md` Trip Generation Pipeline step 3 (line 50) — change to parallel generation with single manifest update (FB-1)
- [ ] Verify no other references to "sequential" or "one day at a time" exist in `content_format_rules.md` that would contradict the new protocol
- [ ] Verify Incremental Edit Workflow is unaffected (it operates on single days, not batch generation)

---

## 6. BRD Traceability

| Requirement | Acceptance Criterion | Implemented in |
|---|---|---|
| REQ-001 | AC-1: Batch count and size rules | `content_format_rules.md`: Day Generation Protocol, Step 1 (batch table) |
| REQ-001 | AC-2: Every day assigned to exactly one batch | `content_format_rules.md`: Day Generation Protocol, Step 1 ("no gaps, no overlaps") |
| REQ-001 | AC-3: Chronological order preserved | `content_format_rules.md`: Day Generation Protocol, Step 1 ("contiguous batches", "chronological order") |
| REQ-002 | AC-1: Parallel spawning | `content_format_rules.md`: Day Generation Protocol, Step 2 ("same response block") |
| REQ-002 | AC-2: Each subagent generates only its batch | `content_format_rules.md`: Day Generation Protocol, Step 2 ("writes only its own day files") |
| REQ-002 | AC-3: Same generation context | `content_format_rules.md`: Day Generation Protocol, Step 2 (context list: trip_details, overview, day rows) |
| REQ-003 | AC-1: No subagent writes manifest | `content_format_rules.md`: Day Generation Protocol, Step 2 ("Does NOT write to manifest.json") |
| REQ-003 | AC-2: File ownership isolation | `content_format_rules.md`: Day Generation Protocol, Step 2 ("Writes only its own day files") |
| REQ-003 | AC-3: No cross-batch file access | `content_format_rules.md`: Day Generation Protocol, Step 2 ("Does NOT read or write day files outside its assigned range") |
| REQ-004 | AC-1: All days complete in manifest | `content_format_rules.md`: Day Generation Protocol, Step 4 ("all days set to complete") |
| REQ-004 | AC-2: Non-null timestamps | `content_format_rules.md`: Day Generation Protocol, Step 4 ("last_modified to the current timestamp") |
| REQ-004 | AC-3: Single manifest write | `content_format_rules.md`: Day Generation Protocol, Step 4 ("single write operation, not incremental") |
| REQ-005 | AC-1: Existing tests pass | `content_format_rules.md`: Day Generation Protocol, Step 2 ("Per-Day File Format and Per-Day Content Requirements (unchanged)") |
| REQ-005 | AC-2: Day file format unchanged | `content_format_rules.md`: no changes to Per-Day File Format or Per-Day Content Requirements sections |
| REQ-005 | AC-3: No duplicate POIs | Phase A assigns POIs per day (existing guarantee); parallel generation does not introduce cross-day POI sharing |
| REQ-006 | AC-1: File existence verification | `content_format_rules.md`: Day Generation Protocol, Step 3 ("verifies that every expected day file exists on disk") |
| REQ-006 | AC-2: Missing files reported | `content_format_rules.md`: Day Generation Protocol, Step 3 ("report the missing day numbers and their batch assignment") |
| REQ-006 | AC-3: Pipeline blocked on missing files | `content_format_rules.md`: Day Generation Protocol, Step 3 ("Do NOT proceed to Budget or Assembly") |

### Additional file changes (Revision 2, SA feedback)

| SA Feedback | Addressed | Implementation |
|---|---|---|
| FB-1 (Blocking): CLAUDE.md step 3 contradicts parallel protocol | Yes | §1.3: Update step 3 to "Parallel day generation: spawn subagents..." |
| FB-2 (Recommendation): Retry for failed batches | Yes | §1.1 Step 3: Single retry per failed batch before halting |
| FB-3 (Recommendation): Manifest schema intro wording | Yes | §1.2: Change "after each day" to "after all days are generated" |
| FB-4 (Observation): N=0 edge case | Yes | §1.1 Step 1: Added N=0 row to batch table ("skip Phase B") |
