# Detailed Design

**Change:** Parallelize Overview and Budget Fragment Generation with Day Batches
**Date:** 2026-03-21
**Author:** Development Team
**HLD Reference:** `technical_documents/2026-03-21_parallel-shell-fragments/high_level_design.md`
**Status:** Draft

---

## 1. File Changes

### 1.1 `rendering-config.md`

**Action:** Modify

---

#### 1.1.1 Step 2a — Heading and Description

**Current state:**
```
#### Step 2a: Shell, Overview, and Budget Fragments (Sequential)

Generate shell fragments, the overview fragment, and the budget fragment sequentially. These are fast and provide context needed by day fragment subagents.

**Shell Fragments (generated once from overview.md + manifest.json):**

1. **{{PAGE_TITLE}}**:
   - Derive from destination and year: `"{Destination} {Year} — Семейный маршрут"`.

2. **{{NAV_LINKS}}**:
   - Create a list of `<a class="sidebar__link">` tags with inline `<svg>` icons.
   - Assign `href="#day-X"` and include the `is-active` class and `aria-current="page"` for the first item only.
   - **Ordering (Mandatory):** `#overview`, `#day-0` (if applicable), `#day-1` through `#day-N`, `#budget` — always overview first, budget last.

3. **{{NAV_PILLS}}**:
   - Create a list of `<a class="mobile-nav__pill">` tags.
   - Assign matching `href="#day-X"` and include the `is-active` class for the first item only.
   - **Ordering:** Must match `{{NAV_LINKS}}` exactly.

4. **{{TRIP_CONTENT}}** — assembled from per-day fragments:
   - `#overview` section (from `overview.md`): itinerary summary table.
   - `#day-0` through `#day-N` sections (from `fragment_day_XX_LANG.html` files): day cards with POI cards.
   - `#budget` section (from `budget.md`): aggregated budget table.
   - Each POI card MUST have `id="poi-day-{D}-{N}"`.
   - **Activity Label Linking:** POI-referencing labels use `<a class="activity-label" href="#poi-day-{D}-{N}">`. Generic actions remain as `<span class="activity-label">`.
   - Ensure all `<img>` tags include `loading="lazy"`.
   - **POI Parity:** Verify per-day `.poi-card` count matches markdown `###` POI count in the source day file.
```

**Target state:**
```
#### Step 2a: Shell Fragments (Sequential)

Generate the three shell fragments sequentially. These provide navigation context required by day fragment subagents and must be resolved before the parallel step.

**Shell Fragments (generated once from overview.md + manifest.json):**

1. **{{PAGE_TITLE}}**:
   - Derive from destination and year: `"{Destination} {Year} — Семейный маршрут"`.

2. **{{NAV_LINKS}}**:
   - Create a list of `<a class="sidebar__link">` tags with inline `<svg>` icons.
   - Assign `href="#day-X"` and include the `is-active` class and `aria-current="page"` for the first item only.
   - **Ordering (Mandatory):** `#overview`, `#day-0` (if applicable), `#day-1` through `#day-N`, `#budget` — always overview first, budget last.

3. **{{NAV_PILLS}}**:
   - Create a list of `<a class="mobile-nav__pill">` tags.
   - Assign matching `href="#day-X"` and include the `is-active` class for the first item only.
   - **Ordering:** Must match `{{NAV_LINKS}}` exactly.
```

**Rationale:** Removes the four-item `{{TRIP_CONTENT}}` placeholder description (which was misplaced here — assembly belongs in Step 3) and removes overview and budget from the sequential step. Exactly three shell fragment items remain, satisfying REQ-001 AC-1 and AC-2.

---

#### 1.1.2 Step 2c — Parallel Subagent Execution

**Current state:**
```
#### Step 2c: Parallel Subagent Execution

Spawn one subagent per batch using the Agent tool. **All subagent calls must appear in the same response block** so they execute in parallel, not sequentially.

Each subagent receives the context defined in Step 2.5 (Agent Prompt Contract) plus its batch-specific day assignment.

Each subagent:
- Reads only its assigned `day_XX_LANG.md` files from the trip folder.
- Generates one `fragment_day_XX_LANG.html` file per assigned day, written to the trip folder.
- Each fragment file contains only the `<div class="day-card" id="day-{N}">...</div>` block — no `<html>`, `<head>`, or `<body>` wrappers.
- Does NOT read or write fragment files outside its assigned day range.
- Does NOT modify `manifest.json`, shell fragments, overview, or budget.

Fragment files are ephemeral build artifacts: overwritten on each full generation and not used by incremental rebuild mode.
```

**Target state:**
```
#### Step 2c: Parallel Subagent Execution

Spawn all subagents in the same single response block using the Agent tool: one overview subagent, one budget subagent, and one subagent per day batch. **All subagent calls must appear in the same response block** so they execute in parallel, not sequentially. No subagent within this block may depend on the output of any other subagent within this block.

**Overview subagent:**
- Receives: `rendering-config.md` + `overview_LANG.md` + `manifest.json` (see Step 2.5 for full contract).
- Writes: `fragment_overview_LANG.html` to the trip folder.
- Fragment contains only the `<section id="overview">...</section>` block — no `<html>`, `<head>`, or `<body>` wrappers.
- Does NOT modify day fragments, shell fragments, budget fragment, or `manifest.json`.

**Budget subagent:**
- Receives: `rendering-config.md` + `budget_LANG.md` + `manifest.json` (see Step 2.5 for full contract).
- Writes: `fragment_budget_LANG.html` to the trip folder.
- Fragment contains only the `<section id="budget">...</section>` block — no `<html>`, `<head>`, or `<body>` wrappers.
- Does NOT modify day fragments, shell fragments, overview fragment, or `manifest.json`.

**Day batch subagents (one per batch):**
- Each receives the context defined in Step 2.5 (Agent Prompt Contract) plus its batch-specific day assignment.
- Reads only its assigned `day_XX_LANG.md` files from the trip folder.
- Generates one `fragment_day_XX_LANG.html` file per assigned day, written to the trip folder.
- Each fragment file contains only the `<div class="day-card" id="day-{N}">...</div>` block — no `<html>`, `<head>`, or `<body>` wrappers.
- Does NOT read or write fragment files outside its assigned day range.
- Does NOT modify `manifest.json`, shell fragments, overview fragment, or budget fragment.

Fragment files are ephemeral build artifacts: overwritten on each full generation and not used by incremental rebuild mode.

**Incremental rebuild exception:** Overview and budget parallel subagents are a full-generation-only pattern. In incremental rebuild mode (single-day edits via `stale_days`), skip overview and budget subagents — generate only the stale day fragment(s) sequentially.
```

**Rationale:** Adds the overview and budget singleton subagents to the parallel block with explicit input/output contracts and isolation rules. Satisfies REQ-002 AC-1 through AC-4 and REQ-006 AC-2. Moves the incremental rebuild exception note from Step 2d to Step 2c for clarity (it belongs with the parallel block description).

---

#### 1.1.3 Step 2d — Fragment Verification

**Current state:**
```
#### Step 2d: Fragment Verification

After all subagents return, verify that every expected fragment file (`fragment_day_00_LANG.html` through `fragment_day_NN_LANG.html`) exists in the trip folder.

- **All present:** Proceed to Step 3 (Assembly).
- **Missing fragments:** Identify the failed batch(es). Re-spawn one subagent per failed batch (single retry). After retry, verify again:
  - All present: proceed to Step 3.
  - Still missing: report the missing day numbers and stop. Do NOT proceed to assembly with incomplete fragments.

Verification checks fragment file existence only — content validation happens in Step 4 (pre-regression gate).

**Incremental rebuild exception:** When operating in incremental rebuild mode (single-day edits via `stale_days`), skip batch assignment and generate only the stale fragment(s) sequentially. Parallel batching applies only to full generation mode.
```

**Target state:**
```
#### Step 2d: Fragment Verification

After all subagents return, verify that ALL expected fragment files exist in the trip folder:
- `fragment_overview_LANG.html`
- `fragment_day_00_LANG.html` through `fragment_day_NN_LANG.html`
- `fragment_budget_LANG.html`

Verification is independent per fragment type. A missing day fragment does not affect the overview/budget retry, and vice versa.

- **All present:** Proceed to Step 3 (Assembly).
- **Missing day fragment(s):** Identify the failed batch(es). Re-spawn one subagent per failed batch (single retry). After retry, verify day fragments again:
  - All day fragments present: continue with overview/budget check.
  - Still missing: report the missing day numbers and stop.
- **Missing `fragment_overview_LANG.html`:** Re-spawn only the overview subagent (single retry). After retry, verify overview fragment again:
  - Present: continue.
  - Still missing: report and stop.
- **Missing `fragment_budget_LANG.html`:** Re-spawn only the budget subagent (single retry). After retry, verify budget fragment again:
  - Present: continue.
  - Still missing: report and stop.

Do NOT proceed to Step 3 (Assembly) with any fragment missing. All three fragment types (overview, days, budget) must be fully present before assembly.

Verification checks fragment file existence only — content validation happens in Step 4 (pre-regression gate).
```

**Rationale:** Extends verification to cover all three fragment types. Defines per-type isolated retry logic (overview and budget retries are singleton, not batch-level). Removes the incremental rebuild exception note (moved to Step 2c). Satisfies REQ-004 AC-1 through AC-4.

---

#### 1.1.4 Step 2.5 — Agent Prompt Contract

**Current state:**
```
### Step 2.5: Agent Prompt Contract (Mandatory)
When delegating HTML fragment generation to a sub-agent (whether for full parallel generation or single-day incremental rebuild), the prompt MUST include these items:

#### Core Contract (9 mandatory items)
1. The full `TripPage.ts` — defines the structural contract (CSS classes, IDs, locators)
2. The `rendering-config.md` — component structure and design system rules
3. Explicit list of required section IDs: `#overview`, `#budget`, `#day-0` (if applicable) through `#day-N`
4. Advisory class rules: `.advisory--warning` = Holiday Advisory ONLY; `.advisory--info` = Plan B + Logistics
5. Pro-tip rule: wrap in `<div class="pro-tip">`, not just `<strong>` text
6. SVG rule: sidebar links need inline `<svg>` with explicit `width`/`height`
7. CSS inlining rule: full CSS in `<style>` tag, never `<link>`
8. Activity label linking rule: POI-referencing labels use `<a class="activity-label" href="#poi-day-{D}-{N}">`, POI cards have matching `id="poi-day-{D}-{N}"`
9. **Modular source rule:** HTML is generated per-day from individual `day_XX.md` files, not from a monolithic trip file. The agent must read each day file separately and produce one HTML fragment file per day.

#### Batch-Specific Context (for parallel day fragment generation)
10. **Assigned day list:** Explicit list of day numbers the subagent must generate (e.g., "Generate fragments for day_03, day_04, day_05"). The subagent generates ONLY these days.
11. **Day source files:** Only the `day_XX_LANG.md` files for the assigned batch — not all day files.
12. **Shell context (read-only):** `overview_LANG.md` and `manifest.json` for cross-referencing (trip metadata, navigation structure). The subagent does NOT regenerate shell, overview, or budget fragments.
13. **Fragment output path:** The trip folder path where `fragment_day_XX_LANG.html` files must be written.

**Gate:** Never delegate HTML generation without all 9 core items in the prompt. For parallel batch subagents, items 10-13 are also mandatory. See `development_rules.md` Rule 4.
```

**Target state:**
```
### Step 2.5: Agent Prompt Contract (Mandatory)
When delegating HTML fragment generation to a sub-agent (whether for full parallel generation or single-day incremental rebuild), the prompt MUST include these items:

#### Core Contract (9 mandatory items)
1. The full `TripPage.ts` — defines the structural contract (CSS classes, IDs, locators)
2. The `rendering-config.md` — component structure and design system rules
3. Explicit list of required section IDs: `#overview`, `#budget`, `#day-0` (if applicable) through `#day-N`
4. Advisory class rules: `.advisory--warning` = Holiday Advisory ONLY; `.advisory--info` = Plan B + Logistics
5. Pro-tip rule: wrap in `<div class="pro-tip">`, not just `<strong>` text
6. SVG rule: sidebar links need inline `<svg>` with explicit `width`/`height`
7. CSS inlining rule: full CSS in `<style>` tag, never `<link>`
8. Activity label linking rule: POI-referencing labels use `<a class="activity-label" href="#poi-day-{D}-{N}">`, POI cards have matching `id="poi-day-{D}-{N}"`
9. **Modular source rule:** HTML is generated per-day from individual `day_XX.md` files, not from a monolithic trip file. The agent must read each day file separately and produce one HTML fragment file per day.

#### Batch-Specific Context (for parallel day batch subagents)
10. **Assigned day list:** Explicit list of day numbers the subagent must generate (e.g., "Generate fragments for day_03, day_04, day_05"). The subagent generates ONLY these days.
11. **Day source files:** Only the `day_XX_LANG.md` files for the assigned batch — not all day files.
12. **Shell context (read-only):** `overview_LANG.md` and `manifest.json` for cross-referencing (trip metadata, navigation structure). The subagent does NOT regenerate shell, overview, or budget fragments.
13. **Fragment output path:** The trip folder path where `fragment_day_XX_LANG.html` files must be written.

#### Overview Subagent Context (for parallel overview fragment generation)
14. **Source file:** `overview_LANG.md` from the trip folder.
15. **Reference file:** `manifest.json` for trip metadata.
16. **Output file:** `fragment_overview_LANG.html` written to the trip folder. Contains only the `<section id="overview">...</section>` block — no `<html>`, `<head>`, or `<body>` wrappers.
17. **Isolation:** The overview subagent MUST NOT modify day fragments, shell fragments, budget fragment, or `manifest.json`. It does NOT require NAV_LINKS or NAV_PILLS.

#### Budget Subagent Context (for parallel budget fragment generation)
18. **Source file:** `budget_LANG.md` from the trip folder.
19. **Reference file:** `manifest.json` for trip metadata.
20. **Output file:** `fragment_budget_LANG.html` written to the trip folder. Contains only the `<section id="budget">...</section>` block — no `<html>`, `<head>`, or `<body>` wrappers.
21. **Isolation:** The budget subagent MUST NOT modify day fragments, shell fragments, overview fragment, or `manifest.json`. It does NOT require NAV_LINKS or NAV_PILLS.

**Gate:** Never delegate HTML generation without all 9 core items in the prompt. For parallel day batch subagents, items 10-13 are also mandatory. For the overview subagent, items 14-17 are mandatory. For the budget subagent, items 18-21 are mandatory. See `development_rules.md` Rule 4.
```

**Rationale:** Adds dedicated context sections (items 14-17, 18-21) for overview and budget subagents, including explicit isolation rules and confirmation that they do not need shell context (NAV_LINKS/NAV_PILLS). Updates the gate statement. Satisfies REQ-003 AC-1 through AC-4.

---

#### 1.1.5 Step 3 — Assembly & Final Export

**Current state:**
```
### Step 3: Assembly & Final Export
1. **Read** (do not modify) `base_layout.html` to use as a template.
2. **Assemble** `{{TRIP_CONTENT}}` by concatenating: overview fragment + day fragment files (read `fragment_day_00_LANG.html` through `fragment_day_NN_LANG.html` in chronological order) + budget fragment.
3. **Inject** all fragments into the placeholders.
4. **Save** the result as `trip_full_LANG.html` inside the trip folder.
5. **Validation:** Ensure the original `base_layout.html` still contains its `{{PAGE_TITLE}}`, `{{NAV_LINKS}}`, `{{NAV_PILLS}}`, `{{TRIP_CONTENT}}` placeholders for future use.
```

**Target state:**
```
### Step 3: Assembly & Final Export
1. **Read** (do not modify) `base_layout.html` to use as a template.
2. **Assemble** `{{TRIP_CONTENT}}` by reading and concatenating these fragment files from the trip folder, in order:
   - `fragment_overview_LANG.html` — the `#overview` section
   - `fragment_day_00_LANG.html` through `fragment_day_NN_LANG.html` — day cards, in chronological order
   - `fragment_budget_LANG.html` — the `#budget` section
   All three fragment types are read exclusively from their respective files. There is no inline or embedded fallback for overview or budget content.
3. **Inject** all fragments into the placeholders.
4. **Save** the result as `trip_full_LANG.html` inside the trip folder.
5. **Validation:** Ensure the original `base_layout.html` still contains its `{{PAGE_TITLE}}`, `{{NAV_LINKS}}`, `{{NAV_PILLS}}`, `{{TRIP_CONTENT}}` placeholders for future use.
```

**Rationale:** Makes explicit that overview and budget are read from fragment files (consistent with day fragments), removes any ambiguity about inline content, and preserves concatenation order. Satisfies REQ-005 AC-1 through AC-3.

---

### 1.2 `.claude/skills/render/SKILL.md`

**Action:** Modify

---

#### 1.2.1 Step 2a bullet in Workflow section

**Current state:**
```
**Step 2a — Sequential fragments:**
1. Generate shell fragments (PAGE_TITLE, NAV_LINKS, NAV_PILLS) from `overview_LANG.md` + `manifest.json`
2. Generate overview fragment from `overview_LANG.md`
3. Generate budget fragment from `budget_LANG.md`
```

**Target state:**
```
**Step 2a — Sequential shell fragments:**
1. Generate shell fragments (PAGE_TITLE, NAV_LINKS, NAV_PILLS) from `overview_LANG.md` + `manifest.json`
```

**Rationale:** Removes overview and budget from the sequential step, matching the updated `rendering-config.md` Step 2a. Satisfies REQ-001 AC-3.

---

#### 1.2.2 Step 2c bullet in Workflow section

**Current state:**
```
**Step 2c — Parallel day fragment generation:**
6. Spawn one Agent-tool subagent per batch in a **single response block** (parallel execution).
7. Each subagent receives: the 9-item core contract (§ 2.5) + batch-specific items 10-13. It reads its assigned `day_XX_LANG.md` files and writes `fragment_day_XX_LANG.html` files to the trip folder.
```

**Target state:**
```
**Step 2c — Parallel fragment generation:**
6. Spawn all subagents in a **single response block** (parallel execution): one overview subagent, one budget subagent, and one subagent per day batch.
7. Overview subagent: receives core contract (§ 2.5 items 14-17), reads `overview_LANG.md` + `manifest.json`, writes `fragment_overview_LANG.html` to the trip folder.
8. Budget subagent: receives core contract (§ 2.5 items 18-21), reads `budget_LANG.md` + `manifest.json`, writes `fragment_budget_LANG.html` to the trip folder.
9. Day batch subagents: each receives the 9-item core contract (§ 2.5) + batch-specific items 10-13. Reads assigned `day_XX_LANG.md` files and writes `fragment_day_XX_LANG.html` files to the trip folder.
```

**Rationale:** References overview and budget subagents as parallel participants alongside day batches, with explicit context pointers into Step 2.5. Satisfies REQ-002 AC-5.

---

#### 1.2.3 Step 2d bullet in Workflow section

**Current state:**
```
**Step 2d — Verification:**
8. Verify all `fragment_day_XX_LANG.html` files exist (day_00 through day_NN).
9. If any missing: re-spawn failed batch subagent(s) once. If still missing after retry, report and stop.
```

**Target state:**
```
**Step 2d — Verification:**
10. Verify all required fragments exist: `fragment_overview_LANG.html`, `fragment_day_00_LANG.html` through `fragment_day_NN_LANG.html`, and `fragment_budget_LANG.html`.
11. If any missing: re-spawn only the failed subagent (overview, budget, or the failed day batch). Single retry per subagent. If still missing after retry, report and stop.
```

**Rationale:** Updates SKILL.md verification step to match the expanded verification scope in `rendering-config.md` Step 2d. Note: step numbering in SKILL.md increments because Step 2c now has items 6-9 (up from 6-7). This is consistent with the updated workflow flow.

---

## 2. Markdown Format Specification

Not applicable — this change does not introduce new markdown sections in trip day files.

---

## 3. HTML Rendering Specification

Not applicable — this change does not alter the HTML structure of any fragment. The `<section id="overview">` and `<section id="budget">` content is identical before and after; only the pipeline mechanism (inline vs. file-based) changes.

---

## 4. Rule File Updates

| Rule File | Section | Change |
|---|---|---|
| `rendering-config.md` | Step 2a heading | "Shell, Overview, and Budget Fragments (Sequential)" → "Shell Fragments (Sequential)" |
| `rendering-config.md` | Step 2a description | Remove mention of overview and budget; reduce to 3 shell items only; remove misplaced `{{TRIP_CONTENT}}` item |
| `rendering-config.md` | Step 2c heading/description | Add overview and budget subagents to parallel block; define their input/output contracts and isolation rules |
| `rendering-config.md` | Step 2c incremental note | Move incremental rebuild exception note from Step 2d to Step 2c (belongs with parallel block description) |
| `rendering-config.md` | Step 2d | Expand required fragment list to include `fragment_overview_LANG.html` and `fragment_budget_LANG.html`; add per-type isolated retry logic; remove incremental rebuild exception note (moved to Step 2c) |
| `rendering-config.md` | Step 2.5 Batch-Specific section heading | "for parallel day fragment generation" → "for parallel day batch subagents" |
| `rendering-config.md` | Step 2.5 | Add Overview Subagent Context (items 14-17) |
| `rendering-config.md` | Step 2.5 | Add Budget Subagent Context (items 18-21) |
| `rendering-config.md` | Step 2.5 Gate | Update to reference overview and budget subagent contracts |
| `rendering-config.md` | Step 3 item 2 | Explicitly list `fragment_overview_LANG.html` and `fragment_budget_LANG.html` as read-from-file sources; remove any inline/embedded fallback language |
| `.claude/skills/render/SKILL.md` | Step 2a bullet | Remove items 2 and 3 (overview and budget generation) |
| `.claude/skills/render/SKILL.md` | Step 2c bullet | Add overview and budget subagents; renumber items |
| `.claude/skills/render/SKILL.md` | Step 2d bullet | Expand verification to include overview and budget fragments; renumber items |

---

## 5. Implementation Checklist

### rendering-config.md
- [ ] Update Step 2a heading: remove "Overview, and Budget Fragments" → "Shell Fragments (Sequential)"
- [ ] Update Step 2a opening sentence: remove reference to overview and budget; state that shell fragments provide navigation context required by day subagents
- [ ] Remove item 4 (`{{TRIP_CONTENT}}` placeholder description) from Step 2a entirely
- [ ] Update Step 2c heading: "Parallel Subagent Execution" (keep heading, update body)
- [ ] Update Step 2c opening paragraph: state that overview, budget, and all day batch subagents appear in one response block; add no-dependency constraint
- [ ] Add "Overview subagent" subsection in Step 2c: input (`overview_LANG.md` + `manifest.json`), output (`fragment_overview_LANG.html`), isolation rules
- [ ] Add "Budget subagent" subsection in Step 2c: input (`budget_LANG.md` + `manifest.json`), output (`fragment_budget_LANG.html`), isolation rules
- [ ] Move incremental rebuild exception note from Step 2d to end of Step 2c
- [ ] Update Step 2d: expand required fragment list to three types (overview, days, budget)
- [ ] Update Step 2d: add per-type isolated retry logic for overview and budget
- [ ] Remove incremental rebuild exception note from Step 2d (moved to Step 2c)
- [ ] Update Step 2.5 Batch-Specific section heading: "for parallel day batch subagents"
- [ ] Add Step 2.5 "Overview Subagent Context" subsection (items 14-17)
- [ ] Add Step 2.5 "Budget Subagent Context" subsection (items 18-21)
- [ ] Update Step 2.5 Gate statement to reference overview and budget subagent contracts
- [ ] Update Step 3 item 2: list all three fragment file types explicitly; add "no inline fallback" statement

### .claude/skills/render/SKILL.md
- [ ] Update Step 2a bullet: remove items 2 and 3 (overview and budget); update heading text to match
- [ ] Update Step 2c bullet: add overview and budget subagents; add context pointers to Step 2.5 items 14-17 and 18-21; renumber items
- [ ] Update Step 2d bullet: expand verification to include `fragment_overview_LANG.html` and `fragment_budget_LANG.html`; describe per-type retry; renumber items

---

## 6. BRD Traceability

| Requirement | Acceptance Criterion | Implemented in |
|---|---|---|
| REQ-001 | AC-1: Step 2a lists exactly PAGE_TITLE, NAV_LINKS, NAV_PILLS — no overview, no budget | `rendering-config.md` § Step 2a (§1.1.1) |
| REQ-001 | AC-2: Step 2a heading/description no longer references Overview or Budget as sequential outputs | `rendering-config.md` § Step 2a (§1.1.1) |
| REQ-001 | AC-3: SKILL.md Step 2a matches — shell fragments only | `.claude/skills/render/SKILL.md` § Step 2a bullet (§1.2.1) |
| REQ-002 | AC-1: Step 2c explicitly states overview, budget, and all day batches spawn in one response block | `rendering-config.md` § Step 2c (§1.1.2) |
| REQ-002 | AC-2: Overview subagent defined in Step 2c with input `overview_LANG.md` and output `fragment_overview_LANG.html` | `rendering-config.md` § Step 2c (§1.1.2) |
| REQ-002 | AC-3: Budget subagent defined in Step 2c with input `budget_LANG.md` and output `fragment_budget_LANG.html` | `rendering-config.md` § Step 2c (§1.1.2) |
| REQ-002 | AC-4: Step 2c specifies no overview/budget/day subagent may depend on output of another within the block | `rendering-config.md` § Step 2c (§1.1.2) |
| REQ-002 | AC-5: SKILL.md Step 2c references overview and budget subagents in parallel block | `.claude/skills/render/SKILL.md` § Step 2c bullet (§1.2.2) |
| REQ-003 | AC-1: Step 2.5 defines overview subagent context: `rendering-config.md` + `overview_LANG.md` + `manifest.json` → `fragment_overview_LANG.html` | `rendering-config.md` § Step 2.5 (§1.1.4) |
| REQ-003 | AC-2: Step 2.5 defines budget subagent context: `rendering-config.md` + `budget_LANG.md` + `manifest.json` → `fragment_budget_LANG.html` | `rendering-config.md` § Step 2.5 (§1.1.4) |
| REQ-003 | AC-3: Overview and budget subagent contracts specify they MUST NOT modify day/shell/budget/overview fragments or `manifest.json` | `rendering-config.md` § Step 2.5 items 17, 21 (§1.1.4) |
| REQ-003 | AC-4: Gate statement updated to reference overview and budget subagent contracts | `rendering-config.md` § Step 2.5 Gate (§1.1.4) |
| REQ-004 | AC-1: Step 2d lists `fragment_overview_LANG.html` and `fragment_budget_LANG.html` alongside day fragments | `rendering-config.md` § Step 2d (§1.1.3) |
| REQ-004 | AC-2: Missing `fragment_overview_LANG.html` → retry only overview subagent | `rendering-config.md` § Step 2d (§1.1.3) |
| REQ-004 | AC-3: Missing `fragment_budget_LANG.html` → retry only budget subagent | `rendering-config.md` § Step 2d (§1.1.3) |
| REQ-004 | AC-4: All required fragments must be present before proceeding; any missing triggers its own targeted retry | `rendering-config.md` § Step 2d (§1.1.3) |
| REQ-005 | AC-1: Step 3 specifies `{{TRIP_CONTENT}}` assembled from `fragment_overview_LANG.html` + day files + `fragment_budget_LANG.html` — all from files | `rendering-config.md` § Step 3 (§1.1.5) |
| REQ-005 | AC-2: Step 3 no longer describes overview or budget as inline/embedded content | `rendering-config.md` § Step 3 (§1.1.5) |
| REQ-005 | AC-3: Concatenation order unchanged: overview first, days in chronological order, budget last | `rendering-config.md` § Step 3 (§1.1.5) |
| REQ-006 | AC-1: Incremental rebuild section contains no reference to overview or budget fragment subagents | `rendering-config.md` § Incremental HTML Rebuild (unchanged) |
| REQ-006 | AC-2: Incremental exception note explicitly states overview and budget parallel subagents are full-generation-only | `rendering-config.md` § Step 2c incremental note (§1.1.2) |
| REQ-006 | AC-3: No behavior change to "When to do a full rebuild instead" criteria | `rendering-config.md` § Incremental HTML Rebuild (unchanged) |
