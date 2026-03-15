# Business Requirements Document

**Change:** Parallelize per-day HTML fragment generation in the render pipeline
**Date:** 2026-03-15
**Author:** Product Manager
**Status:** Approved

---

## 1. Background & Motivation

The `/render` skill currently processes per-day HTML fragment generation sequentially — one day at a time (Step 2 of Fragment Master Mode in `rendering-config.md`). For a typical 12-day trip, this takes approximately 45 minutes of wall-clock time because each day's HTML fragment must be fully generated before the next day begins.

Phase B day markdown generation already solved this same problem by parallelizing day file generation across batched subagents (`content_format_rules.md` § Day Generation Protocol). The render pipeline should adopt the same pattern: spawn parallel subagents that each generate a batch of day HTML fragments concurrently.

The shell fragments (PAGE_TITLE, NAV_LINKS, NAV_PILLS), overview fragment, and budget fragment are small and fast — they remain sequential. The bottleneck is the 12 per-day fragment generations, each of which involves reading a day markdown file, applying all component rules, and producing a full `<div class="day-card">` HTML block.

## 2. Scope

**In scope:**
- Parallelize per-day HTML fragment generation (Step 2 of Fragment Master Mode) using batched subagents
- Define batch sizing rules consistent with Phase B's existing pattern
- Define the subagent prompt contract for HTML fragment generation (what context each subagent receives)
- Define verification and retry logic for missing/failed fragments
- Update the render skill workflow to orchestrate parallel fragment generation

**Out of scope:**
- Changes to the HTML output format, CSS, or component rules (rendering-config.md design system unchanged)
- Changes to Phase B markdown generation (already parallel)
- Changes to the assembly step (Step 3) — assembly remains sequential since it requires all fragments
- Changes to pre-regression validation (Step 4) — validation remains sequential on the assembled HTML
- Changes to incremental rebuild mode (single-day edits are already fast)
- Performance of shell/overview/budget fragment generation (these are fast and remain sequential)

**Affected rule files:**
- `rendering-config.md` — § "HTML Generation Pipeline (Fragment Master Mode)" Step 2, § "Agent Prompt Contract" Step 2.5
- `.claude/skills/render/SKILL.md` — § "Step 2: Per-Day Fragment Generation"

## 3. Requirements

### REQ-001: Batch assignment for day HTML fragments

**Description:** The render pipeline must divide all days (day_00 through day_NN) into contiguous batches for parallel generation, using the same batch sizing table as Phase B day generation.

**Acceptance Criteria:**
- [ ] AC-1: Batch count follows the table: 0 days → 0 batches, 1 day → 1 batch, 2-3 days → 2 batches, 4-11 days → 3 batches, 12+ days → 4 batches
- [ ] AC-2: Batches are assigned in chronological order (batch 1 gets lowest-numbered days)
- [ ] AC-3: Every day appears in exactly one batch — no gaps, no overlaps
- [ ] AC-4: The last batch may contain fewer days (remainder)

**Priority:** Must-have

**Affected components:**
- `rendering-config.md` — Step 2 fragment generation
- `.claude/skills/render/SKILL.md` — Step 2 workflow

---

### REQ-002: Parallel subagent execution for HTML fragment generation

**Description:** The render pipeline must spawn one subagent per batch using the Agent tool. All subagent calls must appear in the same response block so they execute in parallel, not sequentially.

**Acceptance Criteria:**
- [ ] AC-1: All batch subagents are spawned in a single response block (parallel execution)
- [ ] AC-2: Each subagent generates only its assigned day HTML fragments — it does not read or write fragments outside its assigned range
- [ ] AC-3: Each subagent writes its HTML fragments to a predictable location (in-memory or to temporary files in the trip folder) so the main agent can collect them for assembly
- [ ] AC-4: Wall-clock time for fragment generation of a 12-day trip is reduced by 3-4x compared to sequential generation (target: ~12-15 minutes instead of ~45 minutes)

**Priority:** Must-have

**Affected components:**
- `rendering-config.md` — Step 2 fragment generation
- `.claude/skills/render/SKILL.md` — Step 2 workflow

---

### REQ-003: Subagent prompt contract for HTML fragment generation

**Description:** Each subagent must receive sufficient context to generate valid HTML fragments that comply with all rendering rules. The prompt must include all items from the existing Agent Prompt Contract (Step 2.5) plus the batch-specific day files.

**Acceptance Criteria:**
- [ ] AC-1: Each subagent receives all 9 mandatory items from rendering-config.md § 2.5 (TripPage.ts, rendering-config.md, section IDs, advisory rules, pro-tip rule, SVG rule, CSS inlining rule, activity label linking rule, modular source rule)
- [ ] AC-2: Each subagent receives only the `day_XX_LANG.md` files for its assigned batch (not all day files)
- [ ] AC-3: Each subagent receives shell context (overview, manifest) for cross-referencing but does not regenerate shell fragments
- [ ] AC-4: The prompt explicitly lists which day numbers the subagent must generate fragments for

**Priority:** Must-have

**Affected components:**
- `rendering-config.md` — § 2.5 Agent Prompt Contract
- `.claude/skills/render/SKILL.md` — Step 2 workflow

---

### REQ-004: Fragment verification and retry logic

**Description:** After all subagents return, the main agent must verify that every expected day fragment was produced. Missing fragments trigger a single retry per failed batch.

**Acceptance Criteria:**
- [ ] AC-1: After all subagents return, the main agent verifies that HTML fragments exist for every day (day_00 through day_NN)
- [ ] AC-2: If any fragments are missing, the main agent re-spawns one subagent per failed batch (single retry)
- [ ] AC-3: After retry, if fragments are still missing, the pipeline reports the missing days and stops — it does not proceed to assembly with incomplete fragments
- [ ] AC-4: Verification checks fragment existence, not fragment content (content validation happens in Step 4 pre-regression gate)

**Priority:** Must-have

**Affected components:**
- `rendering-config.md` — Step 2 fragment generation
- `.claude/skills/render/SKILL.md` — Step 2 workflow

---

### REQ-005: Fragment output mechanism

**Description:** Subagents must output their generated HTML fragments in a way that the main agent can reliably collect and assemble them. Fragments must be written as individual files in the trip folder.

**Acceptance Criteria:**
- [ ] AC-1: Each subagent writes one HTML fragment file per day to the trip folder, named `fragment_day_XX.html` (e.g., `fragment_day_00.html`, `fragment_day_05.html`)
- [ ] AC-2: Fragment files contain only the `<div class="day-card" id="day-{N}">...</div>` block for that day — no `<html>`, `<head>`, or `<body>` wrappers
- [ ] AC-3: The main agent reads fragment files in chronological order during assembly (Step 3)
- [ ] AC-4: Fragment files are intermediate artifacts — they may be retained for incremental rebuild or cleaned up after assembly at the implementer's discretion

**Priority:** Must-have

**Affected components:**
- `rendering-config.md` — Steps 2 and 3
- `.claude/skills/render/SKILL.md` — Steps 2 and 3

---

### REQ-006: Sequential steps remain unchanged

**Description:** Shell fragment generation, overview/budget fragment generation, assembly (Step 3), and pre-regression validation (Step 4) must remain sequential and functionally unchanged.

**Acceptance Criteria:**
- [ ] AC-1: Shell fragments (PAGE_TITLE, NAV_LINKS, NAV_PILLS) are generated before parallel day fragments (they may be needed as context)
- [ ] AC-2: Overview and budget fragments are generated sequentially (before or after day fragments, at implementer's discretion)
- [ ] AC-3: Assembly (Step 3) runs only after all day fragments are verified present
- [ ] AC-4: Pre-regression validation (Step 4) runs on the fully assembled HTML, unchanged from current behavior
- [ ] AC-5: The final `trip_full_LANG.html` output is byte-identical in structure to what sequential generation would produce (same HTML, same ordering, same components)

**Priority:** Must-have

**Affected components:**
- `rendering-config.md` — Steps 1, 3, 4
- `.claude/skills/render/SKILL.md` — Steps 1, 3, 4

---

### REQ-007: Incremental rebuild mode exclusion

**Description:** Incremental rebuild mode (single-day edits) is already fast and does not need parallelization. The parallel pattern applies only to full HTML generation.

**Acceptance Criteria:**
- [ ] AC-1: Incremental rebuild mode continues to regenerate only stale day fragments sequentially
- [ ] AC-2: Full generation mode (all days) uses the parallel batch pattern from REQ-001 through REQ-005

**Priority:** Must-have

**Affected components:**
- `rendering-config.md` — § Incremental HTML Rebuild
- `.claude/skills/render/SKILL.md` — § Incremental Rebuild Mode

---

## 4. Dependencies & Risks

| Dependency / Risk | Mitigation |
|---|---|
| Agent tool must support multiple parallel subagent calls in a single response block | This is already proven by Phase B parallel day generation — same mechanism |
| Each subagent has limited context window — must fit rendering rules + day file(s) + TripPage.ts | Batch sizes of 3-4 days keep per-subagent context manageable; same constraint as Phase B |
| Fragment files on disk could conflict if naming collides | Use deterministic naming (`fragment_day_XX.html`) — day numbers are unique |
| Subagent failure mid-batch could produce partial output (some days written, some not) | Verification step (REQ-004) catches missing fragments; retry re-runs entire failed batch |
| HTML output must be identical regardless of parallel vs sequential generation | REQ-006 AC-5 requires structural equivalence; pre-regression validation (Step 4) catches discrepancies |
| Rendering-config.md update requires SA review for architectural consistency | SA will review in Phase 3 (architecture review) |

## 5. Acceptance Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| PM | Product Manager | 2026-03-15 | Approved |
