# Development Process & Stakeholder Roles

## Overview

Every change to the trip generation system — whether content rules, rendering logic, automation tests, or architecture — follows a structured development cycle with defined stakeholders, deliverables, and gates.

## Stakeholders & Responsibilities

### Product Manager (PM)
**Owns:** Business requirements, acceptance criteria, and delivery sign-off.

#### PM-Req — Requirements Authoring (Phase 1)
| # | Task | Source |
|---|---|---|
| 1 | Read user request and identify distinct requirements | New |
| 2 | Write `business_requirements.md` (IDs, descriptions, acceptance criteria) | New |
| 3 | Identify affected rule files/sections, set priority and scope | New |

#### PM-Accept — Validation & Sign-off (Phase 4–6)
| # | Task | Source |
|---|---|---|
| 4 | Review Dev deliverables against BRD requirements | New |
| 5 | Verify test plans cover all BRD acceptance criteria (with QA-A) | New |
| 6 | Final sign-off: confirm regression results meet all acceptance criteria | New |

#### PM-Ongoing — Configuration & Priorities
| # | Task | Source |
|---|---|---|
| 7 | Maintain `trip_details.md` — keep it generic and reusable across destinations | `trip_details.md` |
| 8 | Define and prioritize Universal Interests, Kids Interests, and Places to Avoid | `trip_planning_rules.md` |
| 9 | Define culinary profile (dietary style, must-haves, dislikes, vibe) | `trip_planning_rules.md` |

**Deliverable:** `business_requirements.md` in the change folder.

---

### Software Architect (SA)
**Owns:** System architecture, design quality, and maintainability.

#### SA-Review — Per-Change Architecture Review (Phase 3)
| # | Task | Source |
|---|---|---|
| 1 | Review HLD+DD for content/presentation separation | New |
| 2 | Review HLD+DD for ease-of-future-change (extensibility) | New |
| 3 | Review HLD+DD for consistency with existing patterns | New |
| 4 | Write `architecture_review.md` with verdict + feedback items | New |

#### SA-ContentArch — Content Architecture Ownership (Ongoing)
| # | Task | Source |
|---|---|---|
| 5 | Own modular trip folder architecture (manifest.json, per-day files, per-language suffixes) | `content_format_rules.md` |
| 6 | Define Change Impact Matrix — classify changes, predict affected test areas | `development_rules.md` §6 |

#### SA-RenderArch — Rendering Architecture Ownership (Ongoing)
| # | Task | Source |
|---|---|---|
| 7 | Own HTML Generation Pipeline (Fragment Master Mode, base_layout.html, incremental rebuild) | `rendering-config.md` |
| 8 | Own Design System (design tokens, component rules, POI cards, theming) | `rendering-config.md` |
| 9 | Maintain HTML Generation Contract (TripPage.ts locator → HTML element mapping) | `development_rules.md` §1 |
| 10 | Maintain Agent Prompt Contract (9-item checklist for delegated HTML generation) | `rendering-config.md` §2.5 |
| 11 | Define and enforce development best practices (code structure, naming, modularity) | New |

**Deliverable:** `architecture_review.md` in the change folder.

---

### QA Architect (QA-A)
**Owns:** Test architecture, coverage strategy, and automation quality.

#### QA-Review — Per-Change Test Plan Review (Phase 4b)
| # | Task | Source |
|---|---|---|
| 1 | Review test plan for BRD coverage completeness (no gaps) | New |
| 2 | Review for duplicate tests (no two tests assert the same thing) | New |
| 3 | Review correct use of fixtures, assertions, POM | New |
| 4 | Write `qa_architecture_review.md` with verdict + feedback items | New |

#### QA-Standards — Test Architecture Ownership (Ongoing)
| # | Task | Source |
|---|---|---|
| 5 | Own Zero-Flakiness Policy (no hard sleeps, atomic tests, quarantine protocol) | `automation_rules.md` §3 |
| 6 | Own Test Performance Optimization (single project, shared-page fixture, batched assertions, progression consolidation) | `automation_rules.md` §6 |
| 7 | Enforce Lifecycle & Approval Workflow (test plan before code, QA lead sign-off) | `automation_rules.md` §1 |
| 8 | Enforce Regression Reporting Standards (Playwright HTML reports, traces, screenshots) | `automation_rules.md` §2 |
| 9 | Own Testability & Dev Synergy process (Stop & Escalate rule, `qa_2_dev_requirements.txt`) | `automation_rules.md` §4 |

**Deliverable:** `qa_architecture_review.md` in the change folder.

---

### Development Team (Dev)
**Owns:** Implementation of features, rule files, content generation, and HTML output.

#### Dev-Design — Design Documents (Phase 2)
| # | Task | Source |
|---|---|---|
| 1 | Read BRD + affected rule files | New |
| 2 | Write `high_level_design.md` (components, data flow, dependencies) | New |
| 3 | Write `detailed_design.md` (exact file edits, sections, code changes) | New |
| 4 | Address SA feedback from architecture review (Phase 3 retry) | New |

#### Dev-TripPlanning — Trip Planning Logic (Trip Gen)
| # | Task | Source |
|---|---|---|
| 5 | Execute Pre-Flight Setup (data retrieval, age calculation, language selection) | `trip_planning_rules.md` §Pre-Flight |
| 6 | Apply Interest Hierarchy (Universal → Specific → Conflict Resolution → Avoidance) | `trip_planning_rules.md` §1 |
| 7 | Execute "Only Here" Research Gate — replace generic POIs with destination-unique alternatives | `trip_planning_rules.md` §2 |
| 8 | Apply Age-Appropriate Filter (safety, pace, movement) | `trip_planning_rules.md` §3 |
| 9 | Apply Geographic Clustering (15–35 min radius, consecutive car rental days) | `trip_planning_rules.md` §4 |
| 10 | Apply Culinary Selection (dietary style, must-haves, vibe, dislikes) | `trip_planning_rules.md` §5 |
| 11 | Execute Environmental & Event Intelligence (holidays, closures, crowd management) | `trip_planning_rules.md` §Events |
| 12 | Pass CEO Audit per day (age, interest, POI count, logistics, parity) | `trip_planning_rules.md` §CEO Audit |

#### Dev-Content — Content Generation & Assembly (Trip Gen)
| # | Task | Source |
|---|---|---|
| 13 | Generate Phase A overview + manifest.json | `content_format_rules.md` §Phase A |
| 14 | Generate day files (day_00 through day_NN) with all 9 required sections | `content_format_rules.md` §Phase B |
| 15 | Follow Per-Day Content Requirements (route map, hourly table, locations, logistics, budget, Plan B, grocery, optional stops) | `content_format_rules.md` §Per-Day |
| 16 | Assemble budget, trip_full.md, trip_full.html | `content_format_rules.md` §Assembly |

#### Dev-HTML — HTML Rendering & Validation (HTML Gen / Pre-Test)
| # | Task | Source |
|---|---|---|
| 17 | Generate per-day fragments following Component Usage Rules | `rendering-config.md` §Components |
| 18 | Assemble into base_layout.html with correct placeholder injection | `rendering-config.md` §Step 3 |
| 19 | Run Trip Completeness Validation before assembly | `development_rules.md` §2 |
| 20 | Run Pre-Regression Validation Gate (11-point structural check) | `development_rules.md` §3 |
| 21 | Synchronize test data when content changes (budget amounts, day counts, dates) | `development_rules.md` §4 |

#### Dev-Impl — Feature Implementation (Phase 5)
| # | Task | Source |
|---|---|---|
| 22 | Implement code changes per approved DD | New |

**Deliverables:** `high_level_design.md` + `detailed_design.md` in the change folder.

---

### Automation Engineer (AE)
**Owns:** Test implementation, execution, and reporting per approved test plans.

#### AE-Plan — Test Planning (Phase 4a)
| # | Task | Source |
|---|---|---|
| 1 | Map each BRD acceptance criterion to test cases | New |
| 2 | Write `test_plan.md` | New |
| 3 | Address QA-A feedback on test plan (Phase 4b retry) | New |

#### AE-Impl — Test Implementation (Phase 5)
| # | Task | Source |
|---|---|---|
| 4 | Implement automation tests per approved test plan | New |
| 5 | Use POM pattern — all locators in `TripPage.ts` | `automation_rules.md` §5 |
| 6 | Use TypeScript with descriptive `test('should...')` blocks | `automation_rules.md` §5 |
| 7 | Use shared-page fixture for read-only tests, standard for mutations | `automation_rules.md` §6.2 |
| 8 | Batch per-day assertions with `expect.soft()` and descriptive messages | `automation_rules.md` §6.3 |
| 9 | Consolidate progression tests into single `progression.spec.ts` (append, never split) | `automation_rules.md` §6.4 |
| 10 | Update `release_notes.md` before testing | `development_rules.md` §7.1 |
| 11 | Run on desktop-chromium only; set viewport per-spec when needed | `automation_rules.md` §6.1 |

#### AE-Exec — Test Execution & Triage (Phase 6)
| # | Task | Source |
|---|---|---|
| 12 | Write progression tests for new/changed features | `development_rules.md` §7.2 |
| 13 | Execute full regression suite and generate Playwright HTML reports with traces | `development_rules.md` §7.3 |
| 14 | Triage failures: real bug → fix HTML; flaky test → quarantine | `automation_rules.md` §3 |
| 15 | Document testability gaps in `qa_2_dev_requirements.txt` | `automation_rules.md` §4 |

**Deliverable:** `test_plan.md` in the change folder.

---

## Development Cycle

Every change follows these phases in order. Each phase has a **gate** — the next phase cannot begin until the gate passes.

```
┌─────────────────────────────────────────────────────────────────┐
│  Phase 1: REQUIREMENTS                                         │
│  PM writes business_requirements.md                            │
│  Gate: BRD covers all user asks + acceptance criteria defined  │
├─────────────────────────────────────────────────────────────────┤
│  Phase 2: DESIGN                                               │
│  Dev writes high_level_design.md + detailed_design.md          │
│  Gate: Documents address all BRD items                         │
├─────────────────────────────────────────────────────────────────┤
│  Phase 3: ARCHITECTURE REVIEW                                  │
│  SA reviews HLD/DD → writes architecture_review.md             │
│  Gate: All SA feedback addressed or accepted                   │
├─────────────────────────────────────────────────────────────────┤
│  Phase 4: TEST PLANNING                                        │
│  AE writes test_plan.md based on BRD + DD                      │
│  QA-A reviews test plan → writes qa_architecture_review.md     │
│  Gate: Test plan covers all BRD acceptance criteria             │
├─────────────────────────────────────────────────────────────────┤
│  Phase 5: IMPLEMENTATION                                       │
│  Dev implements per DD; AE implements per test_plan.md          │
│  Gate: Code changes match DD; tests match test plan            │
├─────────────────────────────────────────────────────────────────┤
│  Phase 6: VALIDATION                                           │
│  Run progression tests → full regression → PM acceptance       │
│  Gate: All tests pass; PM confirms BRD acceptance criteria met │
└─────────────────────────────────────────────────────────────────┘
```

### Phase Details

#### Phase 1 — Requirements
- PM reads the user request and all relevant rule files
- PM produces `business_requirements.md` with:
  - Requirement ID, description, acceptance criteria
  - Affected rule files and sections
  - Priority and scope (which days/components are impacted)

#### Phase 2 — Design
- Dev reads the BRD and affected rule files
- Dev produces `high_level_design.md`: which components change, data flow, dependencies
- Dev produces `detailed_design.md`: exact file edits, new markdown sections, rendering rules, code changes

#### Phase 3 — Architecture Review
- SA reviews HLD and DD against:
  - Separation of content vs. presentation
  - Ease of future changes (new requirements shouldn't require rework)
  - Consistency with existing patterns
- SA writes `architecture_review.md` with verdict (Approved / Approved with changes / Rejected) and feedback items
- Dev addresses feedback before proceeding

#### Phase 4 — Test Planning
- AE writes `test_plan.md` mapping each BRD acceptance criterion to test cases
- QA-A reviews for:
  - Coverage completeness (no gaps vs. BRD)
  - No duplicate tests
  - Correct use of fixtures, assertions, POM
- QA-A writes `qa_architecture_review.md` with verdict and feedback
- AE addresses feedback before proceeding

#### Phase 5 — Implementation
- Dev implements changes per the approved DD
- AE implements tests per the approved test plan
- Both reference the BRD acceptance criteria as the source of truth

#### Phase 6 — Validation
- Run new progression tests
- Run full regression suite
- PM verifies the output meets all BRD acceptance criteria
- Any failures loop back to Phase 5

---

## Folder Structure

```
development_process.md                ← This file (project root)
technical_documents/
  templates/                          ← Document templates
    business_requirements_template.md
    high_level_design_template.md
    detailed_design_template.md
    architecture_review_template.md
    qa_architecture_review_template.md
    test_plan_template.md
  YYYY-MM-DD_change-name/             ← Per-change folder
    business_requirements.md           (PM)
    high_level_design.md               (Dev)
    detailed_design.md                 (Dev)
    architecture_review.md             (SA)
    qa_architecture_review.md          (QA-A)
    test_plan.md                       (AE)
```

---

## Integration with Existing Rules

This process supplements (does not replace) the existing rule files:

| Existing Rule | Relationship |
|---|---|
| `development_rules.md` | Phase 5–6 follow its quality gates (HTML contract, pre-regression, test sync) |
| `automation_rules.md` | Phase 4–5 follow its standards (POM, zero-flakiness, performance optimization) |
| `content_format_rules.md` | Phase 2 DD references its day-file format for content changes |
| `rendering-config.md` | Phase 2 DD references its component rules for UI changes |
| `trip_planning_rules.md` | Phase 1 BRD references its planning logic for trip content changes |

## When to Use This Process

| Change Type | Full Cycle Required? |
|---|---|
| New feature (new POI type, new section) | Yes — all 6 phases |
| Rule file update (planning, content, rendering) | Yes — all 6 phases |
| Bug fix (HTML doesn't match rules) | Abbreviated — Phase 1 (BRD) + Phase 5–6 (fix + validate) |
| Content-only regeneration (same rules, new trip) | No — use existing Trip Generation Pipeline |
| Test-only update (sync to new content) | Abbreviated — Phase 4 (test plan) + Phase 5–6 |
