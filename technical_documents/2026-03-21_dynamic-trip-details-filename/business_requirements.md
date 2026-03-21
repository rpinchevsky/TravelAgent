# Business Requirements Document

**Change:** Dynamic Trip Details Filename Support
**Date:** 2026-03-21
**Author:** Product Manager
**Status:** Approved

---

## 1. Background & Motivation

The system currently hardcodes `trip_details.md` as the sole input filename across rule files, pipeline instructions, rendering config, render skill, and test utilities. This was adequate when only one family trip existed, but the introduction of `trip_intake.html` enables any user to generate a new trip details file (e.g., `Maryan.md` for a Moldova couple trip). The hardcoded filename prevents running the trip creation pipeline against any file other than `trip_details.md`.

The user wants to:
1. Run the trip creation pipeline with an arbitrary trip details filename (e.g., `Maryan.md`).
2. Eventually have `trip_intake.html` trigger trip creation with the filename it generates.
3. Keep backward compatibility so that `trip_details.md` remains the default when no filename is specified.

**Current hardcoded references identified:**
- `trip_planning_rules.md` line 5: "Read `trip_details.md`"
- `content_format_rules.md` lines 23, 98, 179: references to `trip_details.md` for language mapping and day generation context
- `CLAUDE.md` line 50: "Read `trip_details.md`" in Trip Generation Pipeline step 1
- `rendering-config.md` line 302: references `trip_details.md` for country flag lookup
- `.claude/skills/render/SKILL.md` line 14: "from `trip_details.md`"
- `automation/code/tests/utils/trip-config.ts` line 143: `path.resolve(projectRoot, 'trip_details.md')`
- `automation/code/tests/utils/language-config.ts` line 67: `path.resolve(projectRoot, 'trip_details.md')`
- `trip_intake_rules.md` line 5: outputs `llm_trip_details.md`, mentions compatibility with `trip_details.md`

## 2. Scope

**In scope:**
- Parameterize all rule file references to accept a configurable trip details filename instead of hardcoded `trip_details.md`
- Update `CLAUDE.md` Trip Generation Pipeline to accept a trip details filename parameter
- Update `trip_planning_rules.md` to reference a parameterized filename
- Update `content_format_rules.md` to reference a parameterized filename in all relevant sections (language mapping, Phase B generation context)
- Update `rendering-config.md` to reference a parameterized filename (country flag rule)
- Update `.claude/skills/render/SKILL.md` to accept and propagate a trip details filename
- Update `trip-config.ts` to resolve the trip details path from an environment variable or configuration, falling back to `trip_details.md`
- Update `language-config.ts` to resolve the trip details path from an environment variable or configuration, falling back to `trip_details.md`
- Establish a convention for how the filename is passed through the pipeline (environment variable, manifest field, or rule-file parameter)

**Out of scope:**
- Automatic triggering of trip creation from `trip_intake.html` (future feature — this BRD only enables the filename to be configurable)
- Changes to the `trip_intake.html` UI itself
- Changes to the output format of `llm_trip_details.md` (already compatible with `trip_details.md` structure)
- Moving trip details files to a different directory (they remain in project root)
- Renaming existing `trip_details.md` or `Maryan.md` files

**Affected rule files:**
- `CLAUDE.md` — Trip Generation Pipeline step 1
- `trip_planning_rules.md` — Pre-Flight Setup step 1
- `content_format_rules.md` — Language code mapping (line 23), Phase B generation context (lines 98, 179)
- `rendering-config.md` — Country Flag Rule (line 302)
- `.claude/skills/render/SKILL.md` — Language default (line 14)
- `trip_intake_rules.md` — Output format section (documentation alignment)
- `automation/code/tests/utils/trip-config.ts` — `loadTripConfig()` path resolution
- `automation/code/tests/utils/language-config.ts` — `loadPoiLanguageConfig()` path resolution

## 3. Requirements

### REQ-001: Parameterize trip details filename in rule files

**Description:** All rule files that currently hardcode `trip_details.md` must use a parameterized reference. The convention shall be: the trip details filename is specified once at pipeline invocation (in `CLAUDE.md` Trip Generation Pipeline step 1) and propagated to all downstream consumers (rule files, subagents, rendering, tests). Rule files shall reference "the active trip details file" generically rather than a hardcoded filename.

**Acceptance Criteria:**
- [ ] AC-1: `trip_planning_rules.md` does not contain the hardcoded string `trip_details.md` as a mandatory filename; it references the active trip details file generically (e.g., "the trip details file" or a parameter placeholder).
- [ ] AC-2: `content_format_rules.md` does not contain the hardcoded string `trip_details.md` as a mandatory filename in lines referencing language mapping or Phase B generation context.
- [ ] AC-3: `rendering-config.md` does not contain the hardcoded string `trip_details.md` as a mandatory filename in the Country Flag Rule section.
- [ ] AC-4: `.claude/skills/render/SKILL.md` does not contain the hardcoded string `trip_details.md` as a mandatory filename.
- [ ] AC-5: `CLAUDE.md` Trip Generation Pipeline step 1 accepts a trip details filename parameter and defaults to `trip_details.md` when none is provided.

**Priority:** Must-have

**Affected components:**
- Rule files (markdown documentation)
- Pipeline instructions (CLAUDE.md)
- Render skill (SKILL.md)

---

### REQ-002: Parameterize trip details path in test utilities

**Description:** The test utility files `trip-config.ts` and `language-config.ts` must resolve the trip details filename dynamically instead of hardcoding `trip_details.md`. The filename shall be configurable via an environment variable (e.g., `TRIP_DETAILS_FILE`) with `trip_details.md` as the default fallback. This enables running regression tests against trips generated from any trip details file.

**Acceptance Criteria:**
- [ ] AC-1: `trip-config.ts` resolves the trip details path from an environment variable `TRIP_DETAILS_FILE` (or equivalent configuration mechanism) rather than hardcoding `trip_details.md`.
- [ ] AC-2: `language-config.ts` resolves the trip details path from the same environment variable `TRIP_DETAILS_FILE` rather than hardcoding `trip_details.md`.
- [ ] AC-3: When `TRIP_DETAILS_FILE` is not set, both utilities default to `trip_details.md` (backward compatibility).
- [ ] AC-4: When `TRIP_DETAILS_FILE` is set to `Maryan.md`, `loadTripConfig()` successfully parses the Moldova trip and returns correct values (destination: "Moldova", reporting language: "Hebrew", 2 travelers, correct dates).
- [ ] AC-5: When `TRIP_DETAILS_FILE` is set to `Maryan.md`, `loadPoiLanguageConfig()` successfully parses and returns `reportingLanguage: "Hebrew"` and POI languages including "hebrew".
- [ ] AC-6: The environment variable name is documented in a code comment at the point of use, so future developers know how to configure it.

**Priority:** Must-have

**Affected components:**
- `automation/code/tests/utils/trip-config.ts`
- `automation/code/tests/utils/language-config.ts`

---

### REQ-003: Store trip details filename in manifest.json

**Description:** The `manifest.json` schema (defined in `content_format_rules.md`) must include a field that records which trip details file was used to generate the trip. This enables downstream consumers (rendering, tests, incremental edits) to know which file to read without requiring external configuration. The field shall be written during Phase A (manifest creation) and read by all pipeline stages.

**Acceptance Criteria:**
- [ ] AC-1: `manifest.json` schema in `content_format_rules.md` includes a new top-level field (e.g., `"trip_details_file": "Maryan.md"`) documenting the source trip details filename.
- [ ] AC-2: The field defaults to `"trip_details.md"` for backward compatibility when not explicitly set.
- [ ] AC-3: Phase A manifest creation (in `content_format_rules.md`) includes instructions to write the trip details filename into the manifest.
- [ ] AC-4: The rendering pipeline (`rendering-config.md`) reads the trip details filename from the manifest when it needs trip metadata (e.g., country flag rule).

**Priority:** Must-have

**Affected components:**
- `content_format_rules.md` — manifest.json schema, Phase A output
- `rendering-config.md` — Step 1 data analysis
- `.claude/skills/render/SKILL.md` — argument parsing

---

### REQ-004: Propagate filename through subagent context

**Description:** When the pipeline spawns subagents (Phase B day generation, rendering fragment generation), the active trip details filename must be included in the subagent context so each subagent reads the correct file. Currently, subagent prompts reference `trip_details.md` explicitly.

**Acceptance Criteria:**
- [ ] AC-1: `content_format_rules.md` Phase B "Generation Context per Day" (line 98) references the active trip details file rather than hardcoded `trip_details.md`.
- [ ] AC-2: `content_format_rules.md` Phase B "Parallel Subagent Execution" context list (line 179) references the active trip details file.
- [ ] AC-3: `rendering-config.md` Agent Prompt Contract (Step 2.5) does not hardcode `trip_details.md` — it references the trip details file from the manifest or pipeline parameter.
- [ ] AC-4: A trip generated from `Maryan.md` produces day files that correctly reference Moldova-specific data (destination, travelers, interests) rather than Budapest data.

**Priority:** Must-have

**Affected components:**
- `content_format_rules.md` — Phase B sections
- `rendering-config.md` — Agent Prompt Contract (Step 2.5)

---

### REQ-005: End-to-end validation with alternate trip details file

**Description:** The system must be validated end-to-end by running the trip creation pipeline with `Maryan.md` and confirming that the output is correct for the Moldova couple trip, not the Budapest family trip.

**Acceptance Criteria:**
- [ ] AC-1: Running the Trip Generation Pipeline with `Maryan.md` as input produces a trip folder in `generated_trips/` with Moldova as the destination.
- [ ] AC-2: The generated `manifest.json` contains `"trip_details_file": "Maryan.md"` and `"destination": "Moldova"`.
- [ ] AC-3: The generated overview and day files use Hebrew as the reporting language (matching `Maryan.md` language preference).
- [ ] AC-4: Running regression tests with `TRIP_DETAILS_FILE=Maryan.md` does not fail due to Budapest-specific expectations.
- [ ] AC-5: Running the pipeline without specifying a filename still defaults to `trip_details.md` and produces the Budapest trip as before (no regression).

**Priority:** Must-have

**Affected components:**
- Trip Generation Pipeline (CLAUDE.md)
- Test utilities (trip-config.ts, language-config.ts)
- Generated trip output

---

### REQ-006: Update trip_intake_rules.md output filename convention

**Description:** The `trip_intake_rules.md` currently specifies that the output file is named `llm_trip_details.md`. The document should clarify that the output filename can be customized (the user may save as `Maryan.md` or any other name) and that any file following the `trip_details.md` structure is a valid input to the trip generation pipeline.

**Acceptance Criteria:**
- [ ] AC-1: `trip_intake_rules.md` documents that the output file can be saved under any filename (not just `llm_trip_details.md`).
- [ ] AC-2: `trip_intake_rules.md` explicitly states that any file following the trip details markdown structure is a valid input to the Trip Generation Pipeline.

**Priority:** Should-have

**Affected components:**
- `trip_intake_rules.md` — Purpose section, Output Format section

---

## 4. Dependencies & Risks

| Dependency / Risk | Mitigation |
|---|---|
| All rule files reference the same parameterization convention | Dev design (Phase 2) must define a single, consistent convention used across all files. SA review (Phase 3) validates consistency. |
| `trip-config.ts` parser assumes specific markdown fields that may differ between trip files (e.g., `Maryan.md` has no "Children" section, different parent table columns with Gender) | Dev must ensure the parser handles optional sections gracefully. AC-4 of REQ-002 validates this. |
| `language-config.ts` uses case-sensitive language names; `Maryan.md` has lowercase "hebrew" in POI languages | Parser must handle case-insensitive matching or the intake form must output canonical casing. Dev design should address. |
| Existing tests may have implicit Budapest assumptions beyond `trip-config.ts` | AE test plan (Phase 4a) must audit all spec files for indirect Budapest dependencies. Language independence lint guard (`language-independence.spec.ts`) should catch most cases. |
| `LANGUAGE_LABELS` in `language-config.ts` has `destinationNames` map — must include Moldova entries | Hebrew entry already has `'Moldova': 'מולדובה'`. Dev should verify completeness for all configured languages. |
| Backward compatibility — existing workflows that don't specify a filename must continue to work | Every parameterization point defaults to `trip_details.md`. REQ-005 AC-5 validates this. |
| `Maryan.md` has no `Buffer time` field and no `Children` section — parser must not crash on missing optional fields | `trip-config.ts` currently throws if arrival/departure missing but does not guard optional fields. Dev must add guards. |

## 5. Acceptance Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| PM | Product Manager | 2026-03-21 | Approved |
