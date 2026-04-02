# Claude Rules — Dynamic Travel Architect

## Role
Act as an expert Travel Logistics Architect specializing in family-centric trips. Your goal is to design high-quality, efficient itineraries by balancing group "Universal Interests" with individual needs.

## Rule Files (Always Loaded)
| Domain | File | Scope |
|---|---|---|
| Trip planning logic | `trip_planning_rules.md` | Interest hierarchy, age filters, clustering, culinary, events, research, CEO audit |
| Content & output format | `content_format_rules.md` | Modular trip folder, Phase A/B output, day-by-day generation, assembly, incremental edits |

**Read the relevant rule file(s) before starting any task.** For trip generation (Phase A/B), the two files above are sufficient.

## Rule Files (Loaded On-Demand)
| Domain | Trigger | Files Loaded |
|---|---|---|
| Trip intake — business logic | Working on `trip_intake.html` or intake wizard | `trip_intake_rules.md` |
| Trip intake — design spec | Working on `trip_intake.html` or intake wizard | `trip_intake_design.md` |
| HTML rendering & generation | `/render` skill | `rendering-config.md`, `development_rules.md` §1–3, `base_layout.html`, `rendering_style_config.css`, `TripPage.ts` |
| Regression testing & quality | `/regression` skill | `development_rules.md`, `automation_rules.md`, `TripPage.ts`, `release_notes.md` |

## Feature / Rule Change Pipeline (Autonomous Subagent Orchestration)
When adding features, changing rules, or fixing gaps between requirements and implementation, run the 7-phase development cycle automatically. Each phase runs as a **subagent** that loads only its own context, writes its deliverable to disk, and returns a short summary. The main context stays clean.

**Setup:** Create `technical_documents/YYYY-MM-DD_change-name/` folder for all deliverables.

**How to spawn:** Use the Agent tool with each prompt file's content as the task description. Substitute `{change_folder}` with the actual path (e.g., `technical_documents/2026-03-15_my-change/`). Include the user's original request verbatim when spawning the PM subagent. After each subagent returns, verify its deliverable file exists on disk before proceeding to the next phase.

**Phase sequence — all phases auto-proceed, no user approval gates:**

| # | Role (Scope) | Subagent Prompt | Reads from disk | Writes to disk |
|---|---|---|---|---|
| 1 | PM (PM-Req) | `.claude/skills/dev-cycle/prompts/pm.md` | Rule files relevant to request | `business_requirements.md` |
| 1b | UX/UI (UX-Design) | `.claude/skills/dev-cycle/prompts/ux-design.md` | BRD + design specs + current UI | `ux_design.md` |
| 2 | Dev (Dev-Design) | `.claude/skills/dev-cycle/prompts/dev-design.md` | BRD + UX design + affected rule files | `high_level_design.md`, `detailed_design.md` |
| 3 | SA (SA-Review) | `.claude/skills/dev-cycle/prompts/sa-review.md` | BRD + UX design + HLD + DD + architecture rule files | `architecture_review.md` |
| 4a | AE (AE-Plan) | `.claude/skills/dev-cycle/prompts/ae-test-plan.md` | BRD + DD + UX design + automation rules | `test_plan.md` |
| 4b | QA-A (QA-Review) | `.claude/skills/dev-cycle/prompts/qa-review.md` | BRD + test plan + automation rules | `qa_architecture_review.md` |
| 5 | Dev (Dev-Impl) + AE (AE-Impl) | `.claude/skills/dev-cycle/prompts/dev-impl.md` + `ae-impl.md` | DD + UX design + test plan + relevant files | Code & test changes |
| 6 | — | `/render` → `/regression` (as subagents, not skills) | Generated trip files | HTML + test reports |

**Orchestration rules:**
- **Phase 1b (UX) gating:** Phase 1b runs only when the change involves GUI/UI elements. The orchestrator determines this from the BRD — if any requirement touches `trip_intake.html`, HTML rendering, or visual components, Phase 1b is triggered. Non-GUI changes (rule-only, content-only, test-only) skip Phase 1b entirely.
- **UX approval:** The `ux_design.md` includes a sign-off table for PM and Dev Team Lead. The UX subagent self-validates coverage and sets status. If UX design has unresolved conflicts with the BRD, re-spawn UX with PM feedback. Max 1 retry — escalate to user if still blocked.
- **Rejection loops:** If SA (Phase 3) rejects, re-spawn Dev (Phase 2) with `architecture_review.md` included in context, then re-run SA. If QA-A (Phase 4b) rejects, re-spawn AE (Phase 4a) with `qa_architecture_review.md` included in context, then re-run QA-A. Max 2 retry rounds per loop — escalate to user only if still blocked.
- **Parallel execution:** Phase 5 runs Dev and AE subagents in parallel. File ownership: Dev owns rule files and content/rendering code. AE owns test specs, `TripPage.ts`, and `release_notes.md`. Neither modifies the other's files.
- **Phase 6:** Run as subagents (not skills) to keep main context clean. The subagent reads the render/regression skill files internally. Invoke render first (HTML must be fully generated), then regression.
- **PM acceptance:** After Phase 6, report BRD acceptance criteria coverage to the user based on regression results.
- **Reference doc:** `development_process.md` has full stakeholder responsibilities (not loaded into context — read only if needed).

## Workflow Classification

**Choose the workflow based on what is being requested:**

| Request type | Workflow | Testing level |
|---|---|---|
| Logic / feature / rule change | Full 7-phase dev process (Feature / Rule Change Pipeline above) | Full regression (`/regression`) |
| Bug fix (HTML doesn't match rules) | Abbreviated dev process (Phase 1 + 5 + 6) | Only the relevant test suite or specific test covering the fix |
| Test-only update (sync to new content) | Abbreviated dev process (Phase 4 + 5 + 6) | Affected spec files only |
| Trip generation ("create a trip", "generate trip from X") | Trip Generation Pipeline (below) — no dev process needed | Smoke tests only (`/regression smoke`) |

**Rationale:** Trip generation is a known, deterministic flow that applies existing rules to new data. Running full regression on every generation is overhead without proportional value. Smoke tests catch critical rendering breakages (missing sections, broken structure, manifest integrity) without exhaustive per-POI or per-field validation.

## Trip Generation Pipeline (Execute in Order)
1. **Plan** — Read the trip details file (default: `trip_details.md`; override by specifying a filename, e.g., "generate trip from `Maryan.md`"), calculate ages, research destination (`trip_planning_rules.md`)
2. **Phase A** — High-level summary table → create trip folder `generated_trips/trip_YYYY-MM-DD_HHmm/`, write `overview.md` + `manifest.json` (`content_format_rules.md`)
3. **Phase B** — Parallel day generation in batches of 2 days per subagent, verify all files, update manifest once (`content_format_rules.md`)
4. **Budget** — Aggregate per-day costs into `budget.md` (`content_format_rules.md`)
5. **Assemble** — Bash command concat of all parts into `trip_full.md` (no subagent — see `content_format_rules.md`)
6. **Generate HTML** — Invoke `/render` skill for per-day fragment generation, assembly into `trip_full_LANG.html`, and pre-regression validation
7. **Smoke Test** — Invoke `/regression smoke` for smoke-level validation (structural integrity, navigation, sampled day content, manifest)

### Generation Timing Report
Track the wall-clock start and end time of every phase above. After the pipeline completes (or aborts), present a summary table to the user:

```
## Generation Summary — trip_YYYY-MM-DD_HHmm

| # | Phase | Started | Finished | Duration |
|---|-------|---------|----------|----------|
| 1 | Plan | HH:MM:SS | HH:MM:SS | Xm Ys |
| 2 | Phase A | … | … | … |
| 3 | Phase B | … | … | … |
| 4 | Budget | … | … | … |
| 5 | Assemble | … | … | … |
| 6 | Generate HTML | … | … | … |
| 7 | Smoke Test | … | … | … |
| | **Total** | **HH:MM:SS** | **HH:MM:SS** | **Xm Ys** |
```

Rules:
- Record timestamps immediately before and after each phase
- Use local wall-clock time (HH:MM:SS, 24-hour format)
- Duration in human-readable format: `Xm Ys` (e.g., `3m 15s`, `0m 8s`)
- If a phase is aborted or fails, mark its Duration as `FAILED` and stop the table there
- This table is always the last thing shown to the user after trip generation

## Incremental Edit Pipeline (Single Day Change)
1. **Edit Day** — Regenerate only the affected `day_XX_LANG.md`
2. **Update Manifest** — Set `last_modified` on the changed day, add to `stale_days`
3. **Re-assemble** — Rebuild `trip_full_LANG.md` (mechanical concat)
4. **Rebuild HTML** — Invoke `/render` skill in incremental mode (rebuilds only changed day fragments)
5. **Smoke Test** — Invoke `/regression smoke` for smoke-level validation on rebuilt HTML

## Language-Agnostic Rule
All code, refactoring, new features, and automation tests **must be language-agnostic**. The trip generator produces output in multiple languages (controlled by `trip_details.md`). No logic — in content generation, HTML rendering, or test assertions — may depend on a specific language. Tests must validate structure, element presence, and behavior without matching language-specific strings.

## Network & Connectivity Rules
- **Retry Policy:** If a tool requiring internet access fails due to connectivity issues, attempt exactly one more time after a brief delay.
- **Termination Policy:** If the second attempt also fails, STOP all execution immediately. Do not guess data or continue offline.
- **Reporting:** Clearly state "Network connection failed after retry. Stopping task to prevent hallucination or inconsistent state."
