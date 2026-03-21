# Architecture Review

**Change:** Dynamic Trip Details Filename Support
**Date:** 2026-03-21
**Reviewer:** Software Architect
**Documents Reviewed:** `technical_documents/2026-03-21_dynamic-trip-details-filename/high_level_design.md`, `technical_documents/2026-03-21_dynamic-trip-details-filename/detailed_design.md`
**Verdict:** Approved

---

## 1. Review Summary

The design is well-structured and addresses the core requirement of parameterizing the trip details filename across all pipeline stages. The three-tier propagation mechanism (pipeline parameter, manifest field, environment variable) is sound and provides appropriate separation of concerns: natural language context for rule files, structured data for rendering, and runtime configurability for tests. Backward compatibility is consistently preserved through defaults at every parameterization point.

Two blocking items require attention before implementation: (1) the `language-config.ts` cache must be keyed by filename (same as `trip-config.ts`) to prevent stale data, and (2) the error messages in both utility files still reference the hardcoded `trip_details.md` filename, which will confuse developers when using alternate files. Both are straightforward fixes.

---

## 2. Architecture Principles Checklist

| Principle | Status | Notes |
|---|---|---|
| Content / presentation separation | Pass | The change is purely about input file resolution. No HTML structure, CSS classes, or rendering logic changes. Content files remain decoupled from presentation. The manifest provides an indirection layer so rendering never needs to know the filename at design time. |
| Easy to extend for new requirements | Pass | Adding a new trip details file requires zero code changes — just pass a different filename at pipeline invocation. The env var + default fallback pattern is standard and well-understood. Future automation (e.g., `trip_intake.html` triggering pipeline) can set the env var programmatically. |
| Consistent with existing patterns | Pass | The `manifest.json` field addition follows the established schema pattern (top-level metadata fields). The env var naming convention (`TRIP_DETAILS_FILE`) is consistent with the existing `TRIP_FOLDER` env var used by test utilities. Rule file phrasing ("the active trip details file") is consistent across all modified files. |
| No unnecessary coupling | Pass | The design correctly avoids coupling test utilities to the manifest (HLD §4.3 explains why — test utilities operate at project-root scope, not trip-folder scope). Each propagation mechanism serves its appropriate consumer. Rule files use natural language, rendering uses manifest, tests use env var. |
| Regeneration performance | Pass | No impact on regeneration performance. Changing the trip details file triggers a new trip generation (expected behavior), not a rebuild of existing trips. The manifest records which file was used, so incremental edits on existing trips read the correct file without re-resolution. |

---

## 3. Feedback Items

### FB-1: `language-config.ts` missing cache invalidation keyed by filename

**Severity:** Blocking
**Affected document:** DD
**Section:** §1.8
**Issue:** The DD specifies cache invalidation for `trip-config.ts` (§1.7, Change 4) with `_cachedFile` tracking, but `language-config.ts` (§1.8) has no equivalent cache invalidation. The current `language-config.ts` does not have a module-level cache, but if one is added in the future, or if the function is called multiple times in a single process with different `TRIP_DETAILS_FILE` values (e.g., in a test runner that validates multiple trip files), the file path resolution must be re-evaluated on each call. More immediately, the DD should explicitly confirm that `language-config.ts` does NOT currently cache results — and if it does not, state that no cache invalidation is needed (making the asymmetry intentional and documented).
**Suggestion:** Add a brief note in DD §1.8 clarifying that `loadPoiLanguageConfig()` does not cache results (unlike `loadTripConfig()`), so no cache invalidation is needed. This prevents a future developer from assuming the omission was accidental. If caching is ever added to `language-config.ts`, it must follow the same `_cachedFile` pattern as `trip-config.ts`.

---

### FB-2: Error messages still reference hardcoded `trip_details.md`

**Severity:** Blocking
**Affected document:** DD
**Section:** §1.7 (trip-config.ts) and §1.8 (language-config.ts)
**Issue:** The current code throws errors with hardcoded `trip_details.md` in the message: `throw new Error('trip_details.md: Arrival or Departure date is missing')` (trip-config.ts line 154) and `throw new Error('trip_details.md: Language Preference → POI languages is empty or missing')` (language-config.ts line 79). The DD's target state for path resolution changes the file being read, but does not update these error messages. When parsing `Maryan.md`, a missing field would produce a misleading error pointing to the wrong file.
**Suggestion:** Add a change item in both DD §1.7 and §1.8 to update error messages to use the dynamic filename. For example: `throw new Error(\`${tripDetailsFile}: Arrival or Departure date is missing\`)`. This ensures error messages correctly identify which file failed parsing.

---

### FB-3: `Maryan.md` has `Role` column header, not `Name` — parent name regex filter may skip valid rows

**Severity:** Recommendation
**Affected document:** DD
**Section:** §1.7, Change 2 (Traveler parsing robustness)
**Issue:** The DD's target state regex filters out rows matching `/^(Role|Name)\s*$/i`. However, `Maryan.md` uses `| Role | Gender | Date of Birth |` as the header row (column 1 is "Role", not "Name"). The first column values are `maryan moshe` and `yoval` — these are placed in the "Role" column structurally, but they are actually traveler names. The filter correctly skips the header row because it matches "Role". However, the column is semantically named "Role" in the source, and the regex `name.split(/\s+/)[0]` would extract `maryan` from `maryan moshe`. This works but is fragile — if a future trip file uses actual role values (e.g., "Mother", "Father") in a separate column, the parser would incorrectly treat roles as names.
**Suggestion:** The current approach is acceptable for the known file formats. Document the assumption in a code comment: "Assumes first column contains the traveler name (or name in the 'Role' column for Maryan.md format)." This makes the fragility visible without over-engineering the parser.

---

### FB-4: HLD §4.3 drops manifest-based auto-discovery — verify this does not leave REQ-003 AC-4 partially unaddressed

**Severity:** Recommendation
**Affected document:** HLD
**Section:** §4.3
**Issue:** HLD §4.3 explicitly states: "The manifest-based auto-discovery (reading `trip_details_file` from the trip folder's `manifest.json`) is not implemented in this iteration because the test utilities operate at project-root scope." REQ-003 AC-4 requires "The rendering pipeline reads the trip details filename from the manifest." The rendering pipeline (rule files, render skill) DOES read from the manifest — this is addressed. However, the test utilities do NOT read from the manifest, relying solely on the env var. This means if a developer runs tests without setting `TRIP_DETAILS_FILE` against a non-default trip, the tests would silently use `trip_details.md` instead of the manifest's recorded file. The HLD acknowledges this but does not flag it as a limitation.
**Suggestion:** Add a "Known Limitations" subsection to HLD §4.3 or §5 stating: "Test utilities do not auto-discover the trip details filename from manifest.json. Developers must set `TRIP_DETAILS_FILE` explicitly when testing non-default trips." This sets the right expectation and could be addressed in a future iteration if needed.

---

### FB-5: `destinationNames` map in `LANGUAGE_LABELS` — completeness for Moldova across all languages

**Severity:** Observation
**Affected document:** DD
**Section:** §1.7 (implicit — `loadTripConfig()` uses `labels.destinationNames`)
**Issue:** The BRD risk table notes that the Hebrew entry already has `'Moldova': 'מולדובה'` in `destinationNames`. However, the Russian and English entries do not have Moldova mappings. `loadTripConfig()` falls back to the raw destination name (`labels.destinationNames[destination] || destination`), so this is not a crash risk. But if a trip from `Maryan.md` is ever generated in Russian, the page title would use "Moldova" (English) instead of "Молдова" (Russian). This is outside the current BRD scope (Maryan.md specifies Hebrew only), but worth noting for future multi-language support.
**Suggestion:** No action required for this change. If/when multi-language generation from `Maryan.md` is needed, add Moldova entries to the Russian and English `destinationNames` maps.

---

### FB-6: `Maryan.md` uses year-only DOB (`1977`) — age calculation in `trip-config.ts` may be affected

**Severity:** Observation
**Affected document:** DD
**Section:** §1.7, Change 3 (Date parsing)
**Issue:** The DD notes that `new Date("2026-05-18T04:00:00")` parses correctly for arrival/departure dates, but does not address the parent DOB format. `Maryan.md` uses `1977` as the Date of Birth (year only, no month/day). The current `trip-config.ts` does not parse parent DOB values (it only extracts names), so this is not a functional issue. However, if age calculation is ever added to `trip-config.ts` (it currently happens in the LLM planning phase, not in test utilities), the year-only format would need special handling.
**Suggestion:** No action required. The current design correctly delegates age calculation to the LLM planning phase, not to test utilities. The parser only extracts names from the table rows.

---

## 4. Best Practice Recommendations

1. **DRY the resolution logic.** Both `trip-config.ts` and `language-config.ts` will contain identical 3-line blocks for env var resolution. Consider extracting a shared helper function (e.g., `resolveTripDetailsPath()`) in a common utility module. This prevents the two files from diverging in their resolution logic over time. This is a recommendation for implementation, not a design change.

2. **Integration test with Maryan.md.** The DD's verification checklist (§5, Phase 3) is manual. Consider adding a lightweight integration test (or a test fixture) that calls `loadTripConfig()` and `loadPoiLanguageConfig()` with `TRIP_DETAILS_FILE=Maryan.md` and asserts the expected parsed values. This would catch parser regressions automatically.

3. **Defensive manifest reading.** When rendering or test utilities read `trip_details_file` from `manifest.json`, use optional chaining and a default (`manifest.trip_details_file || 'trip_details.md'`). The DD describes this behavior but the defensive coding pattern should be explicit in the implementation.

4. **Consistent generic phrasing.** The DD uses both "the active trip details file" and "the trip details file specified at pipeline invocation." Standardize on one phrase across all rule file updates for consistency. The shorter "the active trip details file" is recommended.

---

## 5. Re-review (2026-03-21)

The Dev team revised the HLD and DD to address the two blocking items and two recommendations from the initial review. All items have been resolved satisfactorily.

### FB-1: `language-config.ts` missing cache invalidation keyed by filename — RESOLVED

**Resolution:** DD §1.8 now includes a dedicated "Cache behavior note" paragraph explicitly stating that `loadPoiLanguageConfig()` does not use a module-level cache and that each call re-reads the file. The note clarifies this is intentional (called infrequently, once per test suite setup), documents that no cache invalidation is needed, and provides future guidance: if caching is ever added, it must follow the `_cachedFile` pattern from `trip-config.ts`. The asymmetry between the two utility files is now clearly intentional and documented.

### FB-2: Error messages still reference hardcoded `trip_details.md` — RESOLVED

**Resolution:** DD §1.7 now includes a new Change 5 that updates `trip-config.ts` error messages from hardcoded `trip_details.md` to `${tripDetailsFile}` template literals. DD §1.8 now includes a new Change 3 with the equivalent update for `language-config.ts`. Both changes show current/target state and confirm that `tripDetailsFile` is already in scope from each file's Change 1 (env var resolution). The rationale sections (§1.7 and §1.8) have been updated to reference the error message changes.

### FB-3: `Maryan.md` Role column header fragility — ADDRESSED

**Resolution:** DD §1.7, Change 2 target state now includes a code comment documenting the assumption: "Maryan.md uses 'Role' as the first column header, but the column values are actually traveler names. If a future file uses actual role values (e.g., 'Mother') in a separate column, the parser would need structural changes." This matches the suggestion exactly and makes the fragility visible without over-engineering.

### FB-4: Known limitation for test utility manifest auto-discovery — ADDRESSED

**Resolution:** HLD §4.3 now includes a "Known limitation" paragraph stating that test utilities do not auto-discover the trip details filename from `manifest.json` and that developers must set `TRIP_DETAILS_FILE` explicitly when testing non-default trips. The paragraph also notes the risk of silent fallback to `trip_details.md` and identifies manifest-based resolution as a potential future iteration.

---

## 6. Sign-off

| Role | Date | Verdict |
|---|---|---|
| Software Architect | 2026-03-21 (initial) | Approved with Changes |
| Software Architect | 2026-03-21 (re-review) | Approved |

All blocking items resolved. No remaining conditions.
