# Architecture Review

**Change:** Parallelize per-day HTML fragment generation in the render pipeline
**Date:** 2026-03-15
**Reviewer:** Software Architect
**Documents Reviewed:** `high_level_design.md`, `detailed_design.md`
**Verdict:** Approved with Changes

---

## 1. Review Summary

The HLD and DD propose parallelizing per-day HTML fragment generation in the render pipeline by reusing the proven Phase B batch sizing pattern from `content_format_rules.md`. The design is well-structured, follows established conventions, and addresses all 7 BRD requirements with full acceptance criteria traceability. The decomposition into Steps 2a-2d is clean, the fragment file contract is well-defined, and the verification/retry logic is sound. Two recommendations and two observations are noted below; none are blocking.

## 2. Architecture Principles Checklist

| Principle | Status | Notes |
|---|---|---|
| Content / presentation separation | Pass | Markdown day files remain untouched; only the HTML rendering orchestration changes. Content can change without any UI rebuild pipeline changes. |
| Easy to extend for new requirements | Pass | Batch sizing table is parameterized by day count; adding a 5th tier or adjusting batch sizes requires changing one table row. The subagent contract (items 10-13) is additive and cleanly separated from the 9-item core contract. |
| Consistent with existing patterns | Pass | Directly mirrors the Phase B Day Generation Protocol (same batch table, same subagent spawn pattern, same verification/retry logic). This is the strongest aspect of the design. |
| No unnecessary coupling | Pass | Subagents are isolated by day range, write to deterministic file paths, and share no mutable state. The main agent is the sole orchestrator and verifier. Assembly (Step 3) depends only on file existence, not on subagent implementation details. |
| Regeneration performance | Pass | Incremental rebuild mode is explicitly excluded from parallelization and continues to regenerate only stale fragments. Content-only changes flow through the incremental path without triggering a full rebuild. |

## 3. Feedback Items

### FB-1: Fragment file retention policy needs explicit rule

**Severity:** Recommendation
**Affected document:** DD
**Section:** §3 (HTML Rendering Specification) and §1.1 (rendering-config.md Step 2c)
**Issue:** The BRD (REQ-005 AC-4) states fragment files "may be retained for incremental rebuild or cleaned up after assembly at the implementer's discretion." The DD §1.1 says fragments are "intermediate artifacts" but does not specify a retention policy. Since the incremental rebuild mode in `rendering-config.md` replaces day-card sections in the existing `trip_full_LANG.html` directly (it does not read fragment files), there is ambiguity about whether fragment files serve any purpose after assembly. If they are retained, they could become stale after an incremental edit, creating a consistency risk where on-disk fragment files diverge from the assembled HTML.
**Suggestion:** Add an explicit rule to Step 2d or Step 3: either (a) retain fragment files and update them during incremental rebuilds (so they stay in sync), or (b) treat them as ephemeral build artifacts that are overwritten on each full generation and not consulted during incremental rebuilds. Option (b) is simpler and recommended. Add a single sentence: "Fragment files are overwritten on each full generation and are not used by incremental rebuild mode."

---

### FB-2: Step 3 assembly should reference fragment files with language suffix

**Severity:** Recommendation
**Affected document:** DD
**Section:** §1.3 (rendering-config.md Step 3 target state)
**Issue:** The DD specifies fragment file naming as `fragment_day_XX.html` (no language suffix), but the project naming rules in `content_format_rules.md` require all content files to include a two-letter language code before the extension (e.g., `day_01_ru.md`). In a multi-language trip folder, generating HTML for both Russian and English would produce conflicting fragment files (`fragment_day_01.html` from both languages would overwrite each other).
**Suggestion:** Rename fragment files to `fragment_day_XX_LANG.html` (e.g., `fragment_day_03_ru.html`) to follow the established naming convention and prevent multi-language conflicts. Update the naming in DD §1.1, §1.3, §3, and the BRD traceability table accordingly.

---

### FB-3: Overview and budget fragment ordering moved before day fragments

**Severity:** Observation
**Affected document:** HLD
**Section:** §3 (Data Flow — Target)
**Issue:** The current pipeline generates shell fragments first, then day fragments, then overview and budget fragments. The HLD moves overview and budget generation to Step 2a (before day fragments). This is a minor ordering change. It has no functional impact since these fragments are independent, but it does change the execution sequence compared to the current SKILL.md (which generates overview and budget after day fragments in steps 3-4). The DD and SKILL.md target state are consistent with each other, so this is just a note for awareness.
**Suggestion:** No action needed. The reordering is logical (generate all sequential fragments first, then parallelize the bottleneck).

---

### FB-4: REQ-002 AC-4 (3-4x speedup) is not architecturally verifiable

**Severity:** Observation
**Affected document:** DD
**Section:** §6 (BRD Traceability)
**Issue:** The DD traceability table notes REQ-002 AC-4 (3-4x wall-clock reduction) as "Architectural consequence of parallel execution; verified empirically." This is correct — the speedup depends on the Agent tool's actual parallel execution behavior and per-subagent rendering time, neither of which can be guaranteed by rule file changes alone.
**Suggestion:** No action needed for the design. The implementation phase (Phase 5) should include an empirical timing measurement for a 12-day trip to confirm the speedup target is met. If not met, the batch count or sizing may need adjustment, but this is an implementation concern, not a design concern.

---

## 4. Best Practice Recommendations

1. **Fragment naming convention (FB-2):** Adopting `fragment_day_XX_LANG.html` from the start avoids a naming migration later when multi-language rendering is exercised. This is a low-cost change with high future-proofing value.

2. **Subagent error isolation:** The DD correctly specifies that each subagent writes only its assigned fragments and does not touch files outside its range. During implementation, ensure that the subagent prompt includes an explicit prohibition against modifying `manifest.json` or any non-fragment files — this is stated in the DD §1.1 target state but worth reinforcing in the actual prompt template.

3. **Regression coverage:** The existing test suite (`TripPage.ts`) validates the assembled HTML structure, not the intermediate fragment files. This is the correct level of abstraction — tests should not depend on the orchestration mechanism (parallel vs. sequential). No new tests are needed for the parallelization itself; the existing regression suite validates output equivalence.

## 5. Sign-off

| Role | Date | Verdict |
|---|---|---|
| Software Architect | 2026-03-15 | Approved with Changes |

**Conditions for approval (if "Approved with Changes"):**
- [ ] FB-1: Add explicit fragment file retention policy (recommend: ephemeral, overwritten on full generation, not used by incremental rebuild)
- [ ] FB-2: Rename fragment files to `fragment_day_XX_LANG.html` to follow project naming conventions and prevent multi-language conflicts
