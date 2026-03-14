# Development Process & Stakeholder Roles

## Overview

Every change to the trip generation system — whether content rules, rendering logic, automation tests, or architecture — follows a structured development cycle with defined stakeholders, deliverables, and gates.

## Stakeholders & Responsibilities

### Product Manager (PM)
**Owns:** Business requirements, acceptance criteria, and delivery sign-off.

| # | Responsibility | Phase | Source |
|---|---|---|---|
| 1 | Prepare detailed Business Requirements Document (BRD) for every new or changed requirement | Phase 1 | New |
| 2 | Ensure the development team implements code that satisfies the BRD — review deliverables against requirements | Phase 5–6 | New |
| 3 | Work with QA to verify test plans cover all business requirements and edge cases | Phase 4 | New |
| 4 | Final acceptance sign-off: verify generated output meets all BRD acceptance criteria before delivery is considered complete | Phase 6 | New |
| 5 | Maintain `trip_details.md` — keep it generic and reusable across destinations (no destination-specific content) | Ongoing | `trip_details.md` |
| 6 | Define and prioritize Universal Interests, Kids Interests, and Places to Avoid | Ongoing | `trip_planning_rules.md` |
| 7 | Define culinary profile (dietary style, must-haves, dislikes, vibe) | Ongoing | `trip_planning_rules.md` |

**Deliverable:** `business_requirements.md` in the change folder.

---

### Software Architect (SA)
**Owns:** System architecture, design quality, and maintainability.

| # | Responsibility | Phase | Source |
|---|---|---|---|
| 1 | Ensure software architecture supports easy updates when requirements change | Phase 3 | New |
| 2 | Content-only changes must not require UI/UX rebuilds — enforce separation of content and presentation | Phase 3 | New |
| 3 | Review HLD and DD from development, provide architectural feedback before implementation begins | Phase 3 | New |
| 4 | Define and enforce development best practices (code structure, naming, modularity) | Ongoing | New |
| 5 | Own the modular trip folder architecture (manifest.json, per-day files, per-language suffixes) | Ongoing | `content_format_rules.md` |
| 6 | Own the HTML Generation Pipeline (Fragment Master Mode, base_layout.html, incremental rebuild) | Ongoing | `rendering-config.md` |
| 7 | Own the Design System (design tokens, component rules, POI card structure, theming) | Ongoing | `rendering-config.md` |
| 8 | Maintain the HTML Generation Contract (TripPage.ts locator → HTML element mapping) | Ongoing | `development_rules.md` §1 |
| 9 | Maintain the Agent Prompt Contract (9-item checklist for delegated HTML generation) | Ongoing | `rendering-config.md` §2.5 |
| 10 | Define the Change Impact Matrix — classify changes and predict affected test areas | Ongoing | `development_rules.md` §6 |

**Deliverable:** `architecture_review.md` in the change folder.

---

### QA Architect (QA-A)
**Owns:** Test architecture, coverage strategy, and automation quality.

| # | Responsibility | Phase | Source |
|---|---|---|---|
| 1 | Ensure QA architecture supports easy updates when requirements change | Phase 4 | New |
| 2 | Automation tests have strong coverage without duplication — reliable and maintainable | Phase 4 | New |
| 3 | Enforce best practices in the automation project (POM, fixtures, assertions, reporting) | Ongoing | New |
| 4 | Review test plans and provide architectural feedback before test implementation | Phase 4 | New |
| 5 | Own the Zero-Flakiness Policy (no hard sleeps, atomic tests, quarantine protocol) | Ongoing | `automation_rules.md` §3 |
| 6 | Own the Test Performance Optimization rules (single project, shared-page fixture, batched assertions, progression consolidation) | Ongoing | `automation_rules.md` §6 |
| 7 | Enforce the Lifecycle & Approval Workflow (test plan before code, QA lead sign-off) | Phase 4 | `automation_rules.md` §1 |
| 8 | Enforce Regression Reporting Standards (Playwright HTML reports, traces, screenshots) | Phase 6 | `automation_rules.md` §2 |
| 9 | Own the Testability & Dev Synergy process (Stop & Escalate rule, `qa_2_dev_requirements.txt`) | Ongoing | `automation_rules.md` §4 |

**Deliverable:** `qa_architecture_review.md` in the change folder.

---

### Development Team (Dev)
**Owns:** Implementation of features, rule files, content generation, and HTML output.

| # | Responsibility | Phase | Source |
|---|---|---|---|
| 1 | Write High-Level Design (`high_level_design.md`) | Phase 2 | New |
| 2 | Write Detailed Design (`detailed_design.md`) | Phase 2 | New |
| 3 | Implement code changes per approved DD | Phase 5 | New |
| 4 | Trip planning: execute Pre-Flight Setup (data retrieval, age calculation, language selection) | Trip Gen | `trip_planning_rules.md` §Pre-Flight |
| 5 | Trip planning: apply Interest Hierarchy (Universal → Specific → Conflict Resolution → Avoidance) | Trip Gen | `trip_planning_rules.md` §1 |
| 6 | Trip planning: execute "Only Here" Research Gate — replace generic POIs with destination-unique alternatives | Trip Gen | `trip_planning_rules.md` §2 |
| 7 | Trip planning: apply Age-Appropriate Filter (safety, pace, movement) | Trip Gen | `trip_planning_rules.md` §3 |
| 8 | Trip planning: apply Geographic Clustering (15–35 min radius, consecutive car rental days) | Trip Gen | `trip_planning_rules.md` §4 |
| 9 | Trip planning: apply Culinary Selection (dietary style, must-haves, vibe, dislikes) | Trip Gen | `trip_planning_rules.md` §5 |
| 10 | Trip planning: execute Environmental & Event Intelligence (holidays, closures, crowd management) | Trip Gen | `trip_planning_rules.md` §Events |
| 11 | Trip planning: pass CEO Audit for every day before writing (age, interest, POI count, logistics, parity) | Trip Gen | `trip_planning_rules.md` §CEO Audit |
| 12 | Content: generate Phase A overview + manifest.json | Trip Gen | `content_format_rules.md` §Phase A |
| 13 | Content: generate day files (day_00 through day_NN) with all 9 required sections per day | Trip Gen | `content_format_rules.md` §Phase B |
| 14 | Content: assemble budget, trip_full.md, and trip_full.html | Trip Gen | `content_format_rules.md` §Assembly |
| 15 | Content: follow Per-Day Content Requirements (route map, hourly table, location standards, logistics, operational data, budget table, Plan B, grocery store, optional stops) | Trip Gen | `content_format_rules.md` §Per-Day |
| 16 | HTML: generate per-day fragments following Component Usage Rules | HTML Gen | `rendering-config.md` §Components |
| 17 | HTML: assemble into base_layout.html with correct placeholder injection | HTML Gen | `rendering-config.md` §Step 3 |
| 18 | HTML: run Trip Completeness Validation before assembly | Pre-Test | `development_rules.md` §2 |
| 19 | HTML: run Pre-Regression Validation Gate (11-point structural check) before testing | Pre-Test | `development_rules.md` §3 |
| 20 | HTML: synchronize test data when content changes (budget amounts, day counts, dates) | Pre-Test | `development_rules.md` §4 |
| 21 | Update release notes (`automation/code/release_notes.md`) before any testing begins | Phase 6 | `development_rules.md` §7.1 |

**Deliverables:** `high_level_design.md` + `detailed_design.md` in the change folder.

---

### Automation Engineer (AE)
**Owns:** Test implementation, execution, and reporting per approved test plans.

| # | Responsibility | Phase | Source |
|---|---|---|---|
| 1 | Write test plan (`test_plan.md`) mapping BRD acceptance criteria to test cases | Phase 4 | New |
| 2 | Implement automation tests per approved test plan | Phase 5 | New |
| 3 | Use Page Object Model (POM) pattern — all locators in `TripPage.ts` | Phase 5 | `automation_rules.md` §5 |
| 4 | Use TypeScript with descriptive `test('should...')` blocks (no Gherkin/Cucumber) | Phase 5 | `automation_rules.md` §5 |
| 5 | Use shared-page fixture for read-only tests, standard fixture for mutations | Phase 5 | `automation_rules.md` §6.2 |
| 6 | Batch per-day assertions with `expect.soft()` and descriptive messages | Phase 5 | `automation_rules.md` §6.3 |
| 7 | Consolidate progression tests into single `progression.spec.ts` (append, never split) | Phase 5 | `automation_rules.md` §6.4 |
| 8 | Write progression tests for new/changed features before running regression | Phase 6 | `development_rules.md` §7.2 |
| 9 | Execute full regression suite and generate Playwright HTML reports with traces | Phase 6 | `development_rules.md` §7.3 |
| 10 | Triage failures: real bug → fix HTML; flaky test → quarantine per Zero-Flakiness Policy | Phase 6 | `automation_rules.md` §3 |
| 11 | Document testability gaps in `qa_2_dev_requirements.txt` (missing test IDs, brittle selectors) | Ongoing | `automation_rules.md` §4 |
| 12 | Run on desktop-chromium only; set viewport per-spec when needed (no separate mobile project) | Phase 5 | `automation_rules.md` §6.1 |

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
