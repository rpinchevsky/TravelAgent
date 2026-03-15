# Test Plan

**Change:** Parallelize Phase B Day Generation
**Date:** 2026-03-15
**Author:** Automation Engineer
**BRD Reference:** `technical_documents/2026-03-15_parallel-phase-b/business_requirements.md`
**DD Reference:** `technical_documents/2026-03-15_parallel-phase-b/detailed_design.md`
**Status:** Draft

---

## 1. Test Scope

**In scope:**
- Verify that existing regression suite passes without modification after the rule change (REQ-005 AC-1)
- Verify day file completeness: all expected day files exist, correct naming (REQ-001, REQ-006)
- Verify day file content integrity: all 9 content sections present per day (REQ-005 AC-2)
- Verify no duplicate POIs across days (REQ-005 AC-3)
- Verify manifest completeness: all days have `status: "complete"` and non-null `last_modified` (REQ-004)

**Out of scope:**
- Batch assignment logic validation (REQ-001 AC-1, AC-3) — this is a rule for the LLM agent, not code. Batch sizes and chronological ordering cannot be tested via HTML/DOM inspection. The correctness of batch assignment is verified indirectly: if all day files exist with correct content, batching worked.
- Parallel vs sequential execution verification (REQ-002 AC-1) — whether subagents were spawned in the same response block is an LLM orchestration concern, not observable from test artifacts. No DOM or file-system signal distinguishes parallel from sequential generation.
- Subagent isolation verification (REQ-002 AC-2, AC-3, REQ-003 AC-2, AC-3) — file ownership constraints are LLM behavioral rules. Tests can verify the outcome (all files correct) but cannot verify the process (which subagent wrote which file).
- Manifest write timing (REQ-003 AC-1, REQ-004 AC-3) — whether manifest was written once or incrementally is not observable after the fact; the end state is identical either way.

**Test type:** Both (Regression + Progression)

**Rationale for limited progression scope:** This change modifies LLM behavioral rules, not application code or output format. Most BRD acceptance criteria describe agent orchestration behavior (parallel spawning, batch assignment, file ownership isolation) that is inherently unobservable from the generated artifacts. The testable surface is the *outcome*: all day files exist, content is correct, manifest is complete. These outcomes are already covered by existing regression tests. The only new progression tests target manifest schema validation, which was not previously tested.

## 2. Test Environment

- **Browser:** Chromium (desktop viewport)
- **Framework:** Playwright + TypeScript
- **Fixture:** Shared-page (read-only) for all tests
- **Target file:** `trip_full_{LANG}.html` (for HTML tests), `manifest.json` (for manifest tests)

## 3. Test Cases

### TC-001: All day sections render in HTML

**Traces to:** REQ-001 → AC-2, REQ-006 → AC-1
**Type:** Regression (already covered)
**Spec file:** `structure.spec.ts`
**Priority:** Critical

**Preconditions:**
- Trip generated using parallel Phase B protocol
- HTML rendered via `/render`

**Steps:**
1. Load `trip_full_LANG.html`
2. Count elements matching `.day-card[id^="day-"]`
3. Verify count equals `tripConfig.dayCount`
4. Verify each `#day-{i}` element is attached for i = 0..N-1

**Expected result:**
- Day section count matches expected day count
- Every day section from day-0 through day-N-1 exists

**Implementation notes:**
- Already implemented in `structure.spec.ts` test "should render all day sections"
- No changes needed; existing test covers this

---

### TC-002: Each day has complete card structure (banner, table, POIs, Plan B)

**Traces to:** REQ-005 → AC-2
**Type:** Regression (already covered)
**Spec file:** `day-cards.spec.ts`
**Priority:** Critical

**Preconditions:**
- Trip generated using parallel Phase B protocol

**Steps:**
1. For each day 0..N-1:
   - Verify banner title and date visible
   - Verify itinerary table attached with >= 3 rows
   - Verify >= 1 POI card
   - Verify Plan B advisory section present

**Expected result:**
- All days have complete structure matching Per-Day Content Requirements

**Implementation notes:**
- Already implemented in `day-cards.spec.ts` using `expect.soft()` per day
- No changes needed

---

### TC-003: POI parity between markdown and HTML (no missing/extra POIs)

**Traces to:** REQ-005 → AC-2, REQ-005 → AC-3
**Type:** Regression (already covered)
**Spec file:** `poi-parity.spec.ts`
**Priority:** Critical

**Preconditions:**
- Trip generated, markdown day files and HTML available

**Steps:**
1. Parse POI sections from each `day_XX_LANG.md` markdown file
2. Count rendered POI cards per day in HTML (excluding grocery/along-the-way tags)
3. Compare per-day and total counts

**Expected result:**
- HTML POI card count >= markdown POI section count for each day
- Total POI count matches

**Implementation notes:**
- Already implemented in `poi-parity.spec.ts`
- Also indirectly validates REQ-005 AC-3 (no duplicate POIs) because POI assignment comes from Phase A and parity checks per-day counts

---

### TC-004: No duplicate POI names across all days

**Traces to:** REQ-005 → AC-3
**Type:** Progression
**Spec file:** `progression.spec.ts`
**Priority:** High

**Preconditions:**
- Trip generated, markdown day files available

**Steps:**
1. Extract all POI names from all `day_XX_LANG.md` files using `getExpectedPoiCountsFromMarkdown()`
2. Collect all POI names into a flat array
3. Check for duplicates (same name appearing in two different days)

**Expected result:**
- No POI name appears in more than one day's POI list

**Implementation notes:**
- Shared-page fixture (read-only DOM check not needed — this is a markdown-level check)
- Uses `getExpectedPoiCountsFromMarkdown()` from `markdown-pois.ts`
- Single test with hard assert — a duplicate POI is a critical defect
- Append to `progression.spec.ts` per §6.4 consolidation rule

---

### TC-005: Manifest has all days with status "complete"

**Traces to:** REQ-004 → AC-1
**Type:** Progression
**Spec file:** `progression.spec.ts`
**Priority:** High

**Preconditions:**
- Trip generated, `manifest.json` exists in trip folder

**Steps:**
1. Read `manifest.json` from the trip folder (path from `trip-config.ts`)
2. Parse JSON, navigate to `languages.LANG.days`
3. For each day 0..N-1, verify `status === "complete"`

**Expected result:**
- Every day entry has `status: "complete"`

**Implementation notes:**
- Shared-page fixture (no DOM interaction, file read only)
- Single test with `expect.soft()` per day for granular failure reporting
- Manifest path derived from trip-config (language-independent)
- Append to `progression.spec.ts`

---

### TC-006: Manifest has non-null last_modified for all days

**Traces to:** REQ-004 → AC-2
**Type:** Progression
**Spec file:** `progression.spec.ts`
**Priority:** High

**Preconditions:**
- Trip generated, `manifest.json` exists in trip folder

**Steps:**
1. Read `manifest.json` from the trip folder
2. Parse JSON, navigate to `languages.LANG.days`
3. For each day 0..N-1, verify `last_modified` is a non-null, non-empty string

**Expected result:**
- Every day entry has a non-null, non-empty `last_modified` value

**Implementation notes:**
- Combine with TC-005 into a single test using `expect.soft()` for both status and timestamp per day
- Append to `progression.spec.ts`

---

### TC-007: Existing regression suite passes unchanged

**Traces to:** REQ-005 → AC-1
**Type:** Regression (meta-verification)
**Spec file:** All existing spec files
**Priority:** Critical

**Preconditions:**
- Trip generated using parallel Phase B protocol
- HTML rendered via `/render`

**Steps:**
1. Run full regression suite: `npx playwright test`
2. Verify all existing tests pass

**Expected result:**
- Zero test failures across all existing spec files
- No modifications to any existing test file

**Implementation notes:**
- This is not a new test case to implement — it is the execution of the existing suite
- Validates that parallel generation produces identical HTML output
- Run as part of Phase 6 `/regression` invocation

---

## 4. Coverage Matrix

| BRD Requirement | Acceptance Criterion | Test Case(s) | Assertion Type | Notes |
|---|---|---|---|---|
| REQ-001 | AC-1: Batch count/size | — | — | Untestable: LLM orchestration rule |
| REQ-001 | AC-2: Every day in exactly one batch | TC-001 | Hard | Indirectly: all days exist in output |
| REQ-001 | AC-3: Chronological order | — | — | Untestable: LLM orchestration rule |
| REQ-002 | AC-1: Parallel spawning | — | — | Untestable: LLM orchestration rule |
| REQ-002 | AC-2: Subagent generates only its batch | TC-001 | Hard | Indirectly: all days correct |
| REQ-002 | AC-3: Same generation context | TC-002, TC-003 | Soft | Indirectly: content quality unchanged |
| REQ-003 | AC-1: No subagent writes manifest | TC-005, TC-006 | Soft | Indirectly: manifest correct after single write |
| REQ-003 | AC-2: File ownership isolation | TC-001 | Hard | Indirectly: all days exist |
| REQ-003 | AC-3: No cross-batch file access | — | — | Untestable: LLM orchestration rule |
| REQ-004 | AC-1: All days complete in manifest | TC-005 | Soft | Direct |
| REQ-004 | AC-2: Non-null timestamps | TC-006 | Soft | Direct |
| REQ-004 | AC-3: Single manifest write | — | — | Untestable: timing not observable post-hoc |
| REQ-005 | AC-1: Existing tests pass | TC-007 | Hard | Full suite execution |
| REQ-005 | AC-2: Day file format intact | TC-002, TC-003 | Soft | Direct |
| REQ-005 | AC-3: No duplicate POIs | TC-004 | Hard | Direct |
| REQ-006 | AC-1: File existence verification | TC-001 | Hard | Indirectly: all days render |
| REQ-006 | AC-2: Missing files reported | — | — | Untestable: LLM error-handling behavior |
| REQ-006 | AC-3: Pipeline blocked if missing | — | — | Untestable: LLM control-flow behavior |

## 5. Test Data Dependencies

| Data Source | What's Used | Update Needed? |
|---|---|---|
| `trip-config.ts` | `dayCount`, `dayTitles`, `dayDates`, trip folder path, language code | No — already configured for current trip |
| `manifest.json` | Day entries with `status` and `last_modified` fields | No — read at runtime from trip folder |
| `day_XX_LANG.md` files | POI section headers (for `markdown-pois.ts`) | No — parsed dynamically at runtime |
| `trip_full_LANG.html` | DOM structure | No — loaded via Playwright baseURL |

**New utility needed:** A manifest reader function in `trip-config.ts` (or a new `manifest-reader.ts` utility) to load and parse `manifest.json` for TC-005/TC-006. Check if `trip-config.ts` already exposes the trip folder path.

## 6. Risk & Mitigation

| Risk | Mitigation |
|---|---|
| Manifest path not accessible from test context | Derive path from `trip-config.ts` trip folder; if not exposed, add a `manifestPath` getter |
| Manifest schema varies between trips | Read schema dynamically; validate only structural properties (`status`, `last_modified`) not values |
| Duplicate POI detection false positives from common names | Compare full POI names including emoji prefix; only flag exact matches across different days |
| Flaky POI parity if parallel generation produces slightly different POI counts | Existing `poi-parity.spec.ts` uses `>=` comparison which tolerates extra POIs; this is by design |

## 7. Estimated Impact

- **New test count:** 3 (TC-004: duplicate POI check, TC-005+TC-006 combined: manifest validation — both appended to `progression.spec.ts`)
- **Estimated runtime increase:** < 1 second (manifest read is a file I/O operation; POI dedup is an in-memory set check)
- **Files modified:** `progression.spec.ts` (append 2 new test blocks)
- **Files potentially added:** `tests/utils/manifest-reader.ts` (if trip-config doesn't already expose manifest path) — small utility to load and parse `manifest.json`
- **New POM locators needed:** None — all DOM selectors already exist in `TripPage.ts`
