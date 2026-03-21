# High-Level Design

**Change:** Dynamic Trip Details Filename Support
**Date:** 2026-03-21
**Author:** Development Team
**BRD Reference:** `technical_documents/2026-03-21_dynamic-trip-details-filename/business_requirements.md`
**Status:** Revised (SA feedback addressed)

---

## 1. Overview

This change parameterizes the trip details filename across the entire trip generation pipeline. Currently, `trip_details.md` is hardcoded in 8 files (6 rule/skill files + 2 TypeScript utilities). After this change, the filename is specified once at pipeline invocation, recorded in `manifest.json`, and propagated to all downstream consumers — rule files, subagent context, rendering, and test utilities. The default remains `trip_details.md` when no filename is specified, preserving full backward compatibility.

The approach uses three propagation mechanisms:
1. **Pipeline parameter** — `CLAUDE.md` Trip Generation Pipeline accepts a filename argument, passed to rule files and subagents via natural language context.
2. **Manifest field** — `manifest.json` gains a `trip_details_file` field, enabling rendering and test utilities to discover the source file without external configuration.
3. **Environment variable** — `TRIP_DETAILS_FILE` env var allows test utilities to override the filename at runtime, with `manifest.json` as secondary source and `trip_details.md` as final fallback.

## 2. Affected Components

| Component | File(s) | Type of Change |
|---|---|---|
| Pipeline orchestration | `CLAUDE.md` | Modified — Trip Generation Pipeline step 1 accepts filename parameter |
| Planning rules | `trip_planning_rules.md` | Modified — generic reference replaces hardcoded filename |
| Content format rules | `content_format_rules.md` | Modified — manifest schema + Phase B context references parameterized |
| Rendering config | `rendering-config.md` | Modified — Country Flag Rule + Agent Prompt Contract parameterized |
| Render skill | `.claude/skills/render/SKILL.md` | Modified — argument parsing reads filename from manifest |
| Trip intake rules | `trip_intake_rules.md` | Modified — output filename flexibility documented |
| Trip config utility | `automation/code/tests/utils/trip-config.ts` | Modified — env var + manifest fallback for path resolution |
| Language config utility | `automation/code/tests/utils/language-config.ts` | Modified — env var + manifest fallback for path resolution |

## 3. Data Flow

The trip details filename flows through the pipeline in three stages:

```
User Invocation
    │
    ├─ "Generate trip from Maryan.md"
    │   └─ CLAUDE.md Pipeline step 1 reads Maryan.md (default: trip_details.md)
    │
    ▼
Phase A (Manifest Creation)
    │
    ├─ content_format_rules.md: write "trip_details_file": "Maryan.md" into manifest.json
    │
    ▼
Phase B (Day Generation — Subagents)
    │
    ├─ Each subagent context receives the filename from Pipeline step 1
    ├─ Subagents read Maryan.md (not hardcoded trip_details.md)
    │
    ▼
Rendering (HTML Generation)
    │
    ├─ rendering-config.md: reads trip_details_file from manifest.json
    ├─ .claude/skills/render/SKILL.md: resolves filename from manifest
    ├─ Country Flag Rule: looks up destination from the resolved file
    │
    ▼
Testing (Regression)
    │
    ├─ trip-config.ts: resolves filename via:
    │   1. TRIP_DETAILS_FILE env var (highest priority)
    │   2. manifest.json → trip_details_file (auto-discovery)
    │   3. "trip_details.md" (default fallback)
    │
    ├─ language-config.ts: same resolution chain
    │
    ▼
Output: Trip folder with manifest recording "trip_details_file": "Maryan.md"
```

## 4. Integration Points

### 4.1 Rule File Convention
All rule files adopt a consistent convention: instead of `trip_details.md`, they reference "the active trip details file" or "the trip details file specified at pipeline invocation." This is a documentation-level change — no executable code is affected in rule files.

### 4.2 Manifest Contract
The `manifest.json` schema gains one new top-level field: `"trip_details_file"`. All consumers of `manifest.json` (rendering pipeline, test utilities) can optionally read this field. The field is mandatory for new trips and defaults to `"trip_details.md"` for backward compatibility with existing manifests that lack the field.

### 4.3 Test Utility Resolution Chain
Both `trip-config.ts` and `language-config.ts` use a shared resolution function:
1. Check `process.env.TRIP_DETAILS_FILE` — if set, use it as the filename
2. Otherwise, default to `"trip_details.md"`

The env var approach is simple and sufficient for CI and manual test runs. The manifest-based auto-discovery (reading `trip_details_file` from the trip folder's `manifest.json`) is not implemented in this iteration because the test utilities operate at project-root scope, not trip-folder scope, and the trip folder path comes from a separate env var (`TRIP_FOLDER`).

**Known limitation:** Test utilities do not auto-discover the trip details filename from `manifest.json`. Developers must set `TRIP_DETAILS_FILE` explicitly when testing non-default trips. Without it, test utilities silently fall back to `trip_details.md`, which may cause misleading test results if the trip was generated from a different file. This can be addressed in a future iteration by implementing manifest-based resolution when `TRIP_FOLDER` is also set.

### 4.4 Parser Robustness (Maryan.md Compatibility)
`trip-config.ts` must handle structural differences in `Maryan.md`:
- No `### Children` section — the `childSection` split must not crash on missing sections
- No `Buffer time` field — optional field, not currently parsed
- Parent table has Gender column — the row regex must accommodate the 3-column table format: `| name | Gender | YYYY |`
- POI languages in lowercase (`hebrew`) — `language-config.ts` SCRIPT_MAP uses title-case keys; the parser must normalize case before lookup

### 4.5 Subagent Context Propagation
When the pipeline spawns subagents for Phase B day generation and rendering fragment generation, the filename is included as natural language context (e.g., "Read the trip details from `Maryan.md`"). This requires no code change — it is a rule file documentation change that ensures subagents reference the correct file.

## 5. Impact on Existing Behavior

| Area | Impact | Backward Compatible? |
|---|---|---|
| Existing trips (no filename specified) | Pipeline defaults to `trip_details.md` — no change | Yes |
| Existing `manifest.json` files (no `trip_details_file` field) | Consumers default to `trip_details.md` when field is absent | Yes |
| Test runs without `TRIP_DETAILS_FILE` env var | Utilities default to `trip_details.md` — no change | Yes |
| Rule file references | Text changes only — "the active trip details file" instead of `trip_details.md` | Yes (documentation) |
| `trip-config.ts` traveler parsing | Regex updated to handle optional Children section and 3-column parent table | Yes — existing format still matches |
| `language-config.ts` case sensitivity | Case-insensitive lookup added — existing title-case inputs still match | Yes |
| Render skill argument parsing | Reads `trip_details_file` from manifest; falls back to `trip_details.md` | Yes |

## 6. BRD Coverage Matrix

| Requirement | Addressed in HLD? | Section |
|---|---|---|
| REQ-001: Parameterize trip details filename in rule files | Yes | §2, §4.1 |
| REQ-002: Parameterize trip details path in test utilities | Yes | §2, §4.3, §4.4 |
| REQ-003: Store trip details filename in manifest.json | Yes | §3, §4.2 |
| REQ-004: Propagate filename through subagent context | Yes | §3, §4.5 |
| REQ-005: End-to-end validation with alternate trip details file | Yes | §3 (full data flow), §5 (backward compat) |
| REQ-006: Update trip_intake_rules.md output filename convention | Yes | §2 |
