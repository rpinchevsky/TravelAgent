# Detailed Design

**Change:** Dynamic Trip Details Filename Support
**Date:** 2026-03-21
**Author:** Development Team
**HLD Reference:** `technical_documents/2026-03-21_dynamic-trip-details-filename/high_level_design.md`
**Status:** Revised (SA feedback addressed)

---

## 1. File Changes

### 1.1 `CLAUDE.md`

**Action:** Modify

**Current state:**
```markdown
## Trip Generation Pipeline (Execute in Order)
1. **Plan** — Read `trip_details.md`, calculate ages, research destination (`trip_planning_rules.md`)
```

**Target state:**
```markdown
## Trip Generation Pipeline (Execute in Order)
1. **Plan** — Read the trip details file (default: `trip_details.md`; override by specifying a filename, e.g., "generate trip from `Maryan.md`"), calculate ages, research destination (`trip_planning_rules.md`)
```

**Rationale:** REQ-001 AC-5 requires the pipeline entry point to accept a filename parameter with a default. The parenthetical notation keeps the instruction concise while making the parameterization explicit. Downstream steps inherit the filename from step 1 context.

---

### 1.2 `trip_planning_rules.md`

**Action:** Modify

**Current state (line 5):**
```markdown
1. **Data Retrieval:** Read `trip_details.md`.
```

**Target state:**
```markdown
1. **Data Retrieval:** Read the active trip details file (as specified at pipeline invocation; defaults to `trip_details.md`).
```

**Current state (line 58, Environmental & Event Intelligence section):**
```markdown
- Prioritize events that align with the `trip_context.universal_interests` found in `trip_details.md`.
```

**Target state:**
```markdown
- Prioritize events that align with the `trip_context.universal_interests` found in the active trip details file.
```

**Rationale:** REQ-001 AC-1 requires removing the hardcoded filename. Both references are updated to use the generic term "the active trip details file," consistent with the convention established in `CLAUDE.md`.

---

### 1.3 `content_format_rules.md`

**Action:** Modify

**Change 1 — Language code mapping (line 23):**

**Current state:**
```markdown
- **Language code mapping:** Russian → `ru`, English → `en`, Hebrew → `he`, German → `de`, French → `fr`, Spanish → `es`, etc. Derived from `language_preference.reporting_language` in `trip_details.md`.
```

**Target state:**
```markdown
- **Language code mapping:** Russian → `ru`, English → `en`, Hebrew → `he`, German → `de`, French → `fr`, Spanish → `es`, etc. Derived from `language_preference.reporting_language` in the active trip details file.
```

**Change 2 — manifest.json schema (after line 56):**

**Current state:**
```json
{
  "destination": "Budapest, Hungary",
  "arrival": "2026-08-20",
  "departure": "2026-08-31",
  "total_days": 11,
  "created": "2026-03-15T09:00:00",
  "languages": { ... }
}
```

**Target state:**
```json
{
  "trip_details_file": "trip_details.md",
  "destination": "Budapest, Hungary",
  "arrival": "2026-08-20",
  "departure": "2026-08-31",
  "total_days": 11,
  "created": "2026-03-15T09:00:00",
  "languages": { ... }
}
```

Add to **Field rules** section:
```markdown
- `trip_details_file` — the filename of the trip details source file used to generate this trip (e.g., `"trip_details.md"`, `"Maryan.md"`). Defaults to `"trip_details.md"` if absent (backward compatibility with older manifests). Written during Phase A manifest creation.
```

**Change 3 — Phase A Output (line 86):**

**Current state:**
```markdown
3. Write `manifest.json` with the language key under `languages`, all days listed as `"pending"`, `phase_a_complete: true`.
```

**Target state:**
```markdown
3. Write `manifest.json` with `trip_details_file` set to the active trip details filename, the language key under `languages`, all days listed as `"pending"`, `phase_a_complete: true`.
```

**Change 4 — Generation Context per Day (line 98):**

**Current state:**
```markdown
When generating `day_XX_LANG.md`, load only:
1. `trip_details.md` — travelers, interests, schedule preferences.
```

**Target state:**
```markdown
When generating `day_XX_LANG.md`, load only:
1. The active trip details file — travelers, interests, schedule preferences.
```

**Change 5 — Parallel Subagent Execution context (line 179):**

**Current state:**
```markdown
Each subagent receives this context:
1. `trip_details.md` -- travelers, interests, schedule preferences.
```

**Target state:**
```markdown
Each subagent receives this context:
1. The active trip details file -- travelers, interests, schedule preferences.
```

**Rationale:** REQ-001 AC-2, REQ-003 AC-1/AC-2/AC-3, REQ-004 AC-1/AC-2. These five changes collectively remove all hardcoded references in `content_format_rules.md` and add the manifest field for filename tracking.

---

### 1.4 `rendering-config.md`

**Action:** Modify

**Change 1 — Country Flag Rule (line 302):**

**Current state:**
```markdown
Look up the official flag colors for the destination from `trip_details.md → trip_context.destination`.
```

**Target state:**
```markdown
Look up the official flag colors for the destination from the active trip details file (identified by `trip_details_file` in `manifest.json`) → `trip_context.destination`.
```

**Change 2 — Agent Prompt Contract, Step 2.5, item 12 (Shell context):**

**Current state (approximate):**
```markdown
12. **Shell context (read-only):** `overview_LANG.md` and `manifest.json` for cross-referencing (trip metadata, navigation structure). The subagent does NOT regenerate shell, overview, or budget fragments.
```

**Target state:**
```markdown
12. **Shell context (read-only):** `overview_LANG.md`, `manifest.json`, and the active trip details file (filename read from `manifest.json → trip_details_file`) for cross-referencing (trip metadata, navigation structure). The subagent does NOT regenerate shell, overview, or budget fragments.
```

**Rationale:** REQ-001 AC-3, REQ-003 AC-4, REQ-004 AC-3. The rendering pipeline needs to know which trip details file to read for destination metadata (flag colors). The manifest provides the indirection layer.

---

### 1.5 `.claude/skills/render/SKILL.md`

**Action:** Modify

**Current state (line 14):**
```markdown
- Language: use the `_LANG` suffix from existing day files, or default to `language_preference.reporting_language` from `trip_details.md`.
```

**Target state:**
```markdown
- Language: use the `_LANG` suffix from existing day files, or default to `language_preference.reporting_language` from the active trip details file (read `trip_details_file` from `manifest.json`; defaults to `trip_details.md`).
```

**Rationale:** REQ-001 AC-4. The render skill must not hardcode `trip_details.md`. It discovers the filename via the manifest, with a backward-compatible default.

---

### 1.6 `trip_intake_rules.md`

**Action:** Modify

**Change 1 — Purpose section (lines 5-8):**

**Current state:**
```markdown
`trip_intake.html` is a standalone, self-contained wizard page that collects traveler information and outputs `llm_trip_details.md` — the input file the trip generation pipeline reads from. It replaces manual authoring of `trip_details.md` with a guided, user-friendly form.

**File:** `trip_intake.html` (project root)
**Output:** `llm_trip_details.md` (downloaded by user or copied to clipboard)
```

**Target state:**
```markdown
`trip_intake.html` is a standalone, self-contained wizard page that collects traveler information and outputs a trip details file — the input file the trip generation pipeline reads from. It replaces manual authoring of `trip_details.md` with a guided, user-friendly form.

**File:** `trip_intake.html` (project root)
**Output:** `llm_trip_details.md` by default (downloaded by user or copied to clipboard). The user may rename the downloaded file (e.g., `Maryan.md`). Any file following the trip details markdown structure is a valid input to the Trip Generation Pipeline.
```

**Rationale:** REQ-006 AC-1 and AC-2. Clarifies that the output filename is customizable and any structurally compliant file works as pipeline input.

---

### 1.7 `automation/code/tests/utils/trip-config.ts`

**Action:** Modify

**Change 1 — Path resolution (lines 142-143):**

**Current state:**
```typescript
const projectRoot = path.resolve(__dirname, '..', '..', '..', '..');
const tripDetailsPath = path.resolve(projectRoot, 'trip_details.md');
```

**Target state:**
```typescript
const projectRoot = path.resolve(__dirname, '..', '..', '..', '..');

// Trip details filename is configurable via TRIP_DETAILS_FILE env var.
// Defaults to 'trip_details.md' for backward compatibility.
// Example: TRIP_DETAILS_FILE=Maryan.md npx playwright test
const tripDetailsFile = process.env.TRIP_DETAILS_FILE || 'trip_details.md';
const tripDetailsPath = path.resolve(projectRoot, tripDetailsFile);
```

**Change 2 — Traveler parsing robustness (lines 165-180):**

The current parent row regex `\|\s*(\w+)\s*\|\s*\d{4}-\d{2}-\d{2}\s*\|` only matches `| Name | YYYY-MM-DD |` (2-column format). `Maryan.md` uses a 3-column format with Gender: `| maryan moshe | Male | 1977 |`, and the DOB can be year-only (`1977`), not full ISO date.

**Current state:**
```typescript
// Parse travelers (parents + children)
const travelers: string[] = [];
const parentRows = raw.match(/\|\s*(\w+)\s*\|\s*\d{4}-\d{2}-\d{2}\s*\|/g);
if (parentRows) {
  for (const row of parentRows) {
    const m = row.match(/\|\s*(\w+)\s*\|/);
    if (m) travelers.push(m[1]);
  }
}
const childSection = raw.split('### Children')[1];
if (childSection) {
  const childRows = childSection.match(/\|\s*(\w+)\s*\|\s*\d{4}-\d{2}-\d{2}\s*\|/g);
  if (childRows) {
    for (const row of childRows) {
      const m = row.match(/\|\s*(\w+)\s*\|/);
      if (m) travelers.push(m[1]);
    }
  }
}
```

**Target state:**
```typescript
// Parse travelers (parents + children)
// Supports both 2-column (Name | DOB) and 3-column (Name | Gender | DOB) table formats.
// DOB can be YYYY-MM-DD, YYYY-MM, or YYYY.
const travelers: string[] = [];
const parentSection = raw.split('### Parents')[1]?.split('###')[0] || '';
const parentNameRegex = /^\|\s*([^|]+?)\s*\|/gm;
let parentMatch: RegExpExecArray | null;
while ((parentMatch = parentNameRegex.exec(parentSection)) !== null) {
  const name = parentMatch[1].trim();
  // Skip table header rows (contain "Role", "Name", dashes, or are empty).
  // Note: Maryan.md uses "Role" as the first column header, but the column values
  // are actually traveler names (e.g., "maryan moshe"). The filter skips the header
  // row itself. If a future file uses actual role values (e.g., "Mother") in a
  // separate column, the parser would need structural changes.
  if (name && !name.match(/^[-\s]+$/) && !name.match(/^(Role|Name)\s*$/i)) {
    travelers.push(name.split(/\s+/)[0]); // Use first word as traveler name
  }
}

const childSection = raw.split('### Children')[1]?.split(/^##\s/m)[0] || '';
if (childSection) {
  const childNameRegex = /^\|\s*([^|]+?)\s*\|/gm;
  let childMatch: RegExpExecArray | null;
  while ((childMatch = childNameRegex.exec(childSection)) !== null) {
    const name = childMatch[1].trim();
    if (name && !name.match(/^[-\s]+$/) && !name.match(/^(Name)\s*$/i)) {
      travelers.push(name.split(/\s+/)[0]);
    }
  }
}
```

**Change 3 — Date parsing robustness (around lines 152-157):**

**Current state:**
```typescript
const arrivalDate = new Date(arrivalMatch[1].trim());
const departureDate = new Date(departureMatch[1].trim());
```

No change needed here — `new Date("2026-05-18T04:00:00")` parses correctly. The ISO datetime format without trailing Z is valid.

**Change 4 — Cache invalidation:**

The module-level cache (`_cached`) must be keyed by the trip details filename to avoid returning stale data when `TRIP_DETAILS_FILE` changes between test suites.

**Current state:**
```typescript
let _cached: TripConfig | null = null;

export function loadTripConfig(): TripConfig {
  if (_cached) return _cached;
```

**Target state:**
```typescript
let _cached: TripConfig | null = null;
let _cachedFile: string | null = null;

export function loadTripConfig(): TripConfig {
  const tripDetailsFile = process.env.TRIP_DETAILS_FILE || 'trip_details.md';
  if (_cached && _cachedFile === tripDetailsFile) return _cached;
```

And at the end of the function, before returning:
```typescript
  _cachedFile = tripDetailsFile;
  _cached = Object.freeze(result) as TripConfig;
  return _cached;
```

**Change 5 — Error messages use dynamic filename (line 154):**

Error messages currently hardcode `trip_details.md`, which would be misleading when parsing a different file (e.g., `Maryan.md`).

**Current state:**
```typescript
if (!arrivalMatch || !departureMatch) {
  throw new Error('trip_details.md: Arrival or Departure date is missing');
}
```

**Target state:**
```typescript
if (!arrivalMatch || !departureMatch) {
  throw new Error(`${tripDetailsFile}: Arrival or Departure date is missing`);
}
```

The `tripDetailsFile` variable (introduced in Change 1) is already in scope. This ensures error messages correctly identify which file failed parsing.

**Rationale:** REQ-002 AC-1, AC-3, AC-4, AC-6. The env var provides runtime configurability. The regex changes handle `Maryan.md`'s structural differences (no Children section, Gender column, year-only DOB, multi-word names). Cache invalidation prevents stale data across runs. Error messages reference the dynamic filename to aid debugging.

---

### 1.8 `automation/code/tests/utils/language-config.ts`

**Action:** Modify

**Change 1 — Path resolution (lines 66-67):**

**Current state:**
```typescript
const projectRoot = path.resolve(__dirname, '..', '..', '..', '..');
const tripDetailsPath = path.resolve(projectRoot, 'trip_details.md');
```

**Target state:**
```typescript
const projectRoot = path.resolve(__dirname, '..', '..', '..', '..');

// Trip details filename is configurable via TRIP_DETAILS_FILE env var.
// Defaults to 'trip_details.md' for backward compatibility.
// Example: TRIP_DETAILS_FILE=Maryan.md npx playwright test
const tripDetailsFile = process.env.TRIP_DETAILS_FILE || 'trip_details.md';
const tripDetailsPath = path.resolve(projectRoot, tripDetailsFile);
```

**Change 2 — Case-insensitive language lookup (lines 82-84):**

**Current state:**
```typescript
const validators: LanguageValidator[] = poiLangs.map(lang => {
  const entry = SCRIPT_MAP[lang];
  if (!entry) {
```

`Maryan.md` has `**POI languages:** hebrew` (lowercase). `SCRIPT_MAP` keys are title-case (`Hebrew`). The lookup fails.

**Target state:**
```typescript
const validators: LanguageValidator[] = poiLangs.map(lang => {
  // Normalize to title-case for SCRIPT_MAP lookup (e.g., "hebrew" → "Hebrew")
  const normalizedLang = lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase();
  const entry = SCRIPT_MAP[normalizedLang] || SCRIPT_MAP[lang];
  if (!entry) {
```

**Change 3 — Error message uses dynamic filename (line 79):**

Error messages currently hardcode `trip_details.md`, which would be misleading when parsing a different file.

**Current state:**
```typescript
if (poiLangs.length === 0) {
  throw new Error('trip_details.md: Language Preference → POI languages is empty or missing');
}
```

**Target state:**
```typescript
if (poiLangs.length === 0) {
  throw new Error(`${tripDetailsFile}: Language Preference → POI languages is empty or missing`);
}
```

The `tripDetailsFile` variable (introduced in Change 1) is already in scope.

**Cache behavior note:** Unlike `trip-config.ts`, `loadPoiLanguageConfig()` does **not** use a module-level cache. Each call re-reads and re-parses the file. This is intentional — `loadPoiLanguageConfig()` is called infrequently (once per test suite setup), so caching provides no meaningful performance benefit. No cache invalidation logic is needed. If caching is ever added to this function, it must follow the same `_cachedFile` pattern used in `trip-config.ts` (see §1.7, Change 4) to avoid returning stale data when `TRIP_DETAILS_FILE` changes.

**Rationale:** REQ-002 AC-2, AC-3, AC-5, AC-6. The env var mirrors `trip-config.ts`. The case normalization handles the `Maryan.md` lowercase POI language issue identified in the BRD risk table. Error messages reference the dynamic filename to aid debugging.

---

## 2. Markdown Format Specification

### 2.1 New `manifest.json` Field: `trip_details_file`

**Position:** First field in the JSON object (before `destination`).

**Required fields:**
- `trip_details_file` (string): The filename (not path) of the trip details source file. Examples: `"trip_details.md"`, `"Maryan.md"`, `"llm_trip_details.md"`.

**Default value:** `"trip_details.md"` — used when the field is absent (backward compatibility) or when the pipeline is invoked without specifying a filename.

**Example (new trip from Maryan.md):**
```json
{
  "trip_details_file": "Maryan.md",
  "destination": "Moldova, Moldova",
  "arrival": "2026-05-18",
  "departure": "2026-05-31",
  "total_days": 14,
  "created": "2026-03-21T10:00:00",
  "languages": {
    "he": {
      "phase_a_complete": true,
      "days": { ... }
    }
  }
}
```

**Example (existing trip, backward compatible):**
```json
{
  "destination": "Budapest, Hungary",
  "arrival": "2026-08-20",
  "departure": "2026-08-31",
  "total_days": 12,
  "created": "2026-03-21T02:04:00",
  "languages": { ... }
}
```
When `trip_details_file` is absent, consumers default to `"trip_details.md"`.

---

## 3. HTML Rendering Specification

No HTML structural changes are required. The Country Flag Rule continues to produce the same `<svg>` output — only the source of the destination name changes (from hardcoded `trip_details.md` to the file indicated by `manifest.json → trip_details_file`). The SVG attributes, dimensions, and rendering logic remain identical.

---

## 4. Rule File Updates

| Rule File | Section | Change |
|---|---|---|
| `CLAUDE.md` | Trip Generation Pipeline step 1 | Add filename parameter with default |
| `trip_planning_rules.md` | Pre-Flight Setup step 1 | Replace `trip_details.md` with "the active trip details file" |
| `trip_planning_rules.md` | Environmental & Event Intelligence §1 | Replace `trip_details.md` with "the active trip details file" |
| `content_format_rules.md` | Naming Rules — Language code mapping | Replace `trip_details.md` with "the active trip details file" |
| `content_format_rules.md` | manifest.json Schema | Add `trip_details_file` field + field rule |
| `content_format_rules.md` | Phase A Output step 3 | Add instruction to write `trip_details_file` |
| `content_format_rules.md` | Generation Context per Day item 1 | Replace `trip_details.md` with "the active trip details file" |
| `content_format_rules.md` | Parallel Subagent Execution context item 1 | Replace `trip_details.md` with "the active trip details file" |
| `rendering-config.md` | Country Flag Rule | Replace `trip_details.md` with manifest-based reference |
| `rendering-config.md` | Agent Prompt Contract item 12 | Add trip details file to shell context |
| `.claude/skills/render/SKILL.md` | Argument Parsing | Replace `trip_details.md` with manifest-based reference |
| `trip_intake_rules.md` | Purpose section | Document output filename flexibility |

---

## 5. Implementation Checklist

### Phase 1: Rule File Updates (6 files)
- [ ] Update `CLAUDE.md` — Trip Generation Pipeline step 1
- [ ] Update `trip_planning_rules.md` — Pre-Flight Setup step 1
- [ ] Update `trip_planning_rules.md` — Environmental & Event Intelligence §1
- [ ] Update `content_format_rules.md` — Language code mapping
- [ ] Update `content_format_rules.md` — manifest.json schema (add field + field rule)
- [ ] Update `content_format_rules.md` — Phase A Output step 3
- [ ] Update `content_format_rules.md` — Generation Context per Day
- [ ] Update `content_format_rules.md` — Parallel Subagent Execution context
- [ ] Update `rendering-config.md` — Country Flag Rule
- [ ] Update `rendering-config.md` — Agent Prompt Contract item 12
- [ ] Update `.claude/skills/render/SKILL.md` — Argument Parsing
- [ ] Update `trip_intake_rules.md` — Purpose section and output description

### Phase 2: TypeScript Utility Updates (2 files)
- [ ] Update `trip-config.ts` — env var resolution with `TRIP_DETAILS_FILE`
- [ ] Update `trip-config.ts` — robust parent/child parsing (regex overhaul)
- [ ] Update `trip-config.ts` — cache invalidation keyed by filename
- [ ] Update `trip-config.ts` — error messages use dynamic filename
- [ ] Update `language-config.ts` — env var resolution with `TRIP_DETAILS_FILE`
- [ ] Update `language-config.ts` — case-insensitive SCRIPT_MAP lookup
- [ ] Update `language-config.ts` — error messages use dynamic filename

### Phase 3: Verification
- [ ] Verify `loadTripConfig()` with default (no env var) parses `trip_details.md` correctly
- [ ] Verify `loadTripConfig()` with `TRIP_DETAILS_FILE=Maryan.md` parses Moldova trip correctly
- [ ] Verify `loadPoiLanguageConfig()` with `TRIP_DETAILS_FILE=Maryan.md` handles lowercase `hebrew`
- [ ] Verify existing manifest.json files without `trip_details_file` field still work

---

## 6. BRD Traceability

| Requirement | Acceptance Criterion | Implemented in |
|---|---|---|
| REQ-001 | AC-1: trip_planning_rules.md no hardcoded filename | `trip_planning_rules.md`: Pre-Flight Setup step 1 + Event Intelligence §1 |
| REQ-001 | AC-2: content_format_rules.md no hardcoded filename | `content_format_rules.md`: Language code mapping, Generation Context, Subagent Execution |
| REQ-001 | AC-3: rendering-config.md no hardcoded filename | `rendering-config.md`: Country Flag Rule |
| REQ-001 | AC-4: render SKILL.md no hardcoded filename | `.claude/skills/render/SKILL.md`: Argument Parsing |
| REQ-001 | AC-5: CLAUDE.md accepts filename parameter | `CLAUDE.md`: Trip Generation Pipeline step 1 |
| REQ-002 | AC-1: trip-config.ts uses env var | `trip-config.ts`: TRIP_DETAILS_FILE env var resolution |
| REQ-002 | AC-2: language-config.ts uses env var | `language-config.ts`: TRIP_DETAILS_FILE env var resolution |
| REQ-002 | AC-3: Default fallback to trip_details.md | `trip-config.ts` + `language-config.ts`: `|| 'trip_details.md'` fallback |
| REQ-002 | AC-4: Maryan.md parses correctly in loadTripConfig | `trip-config.ts`: Robust regex for parent/child parsing |
| REQ-002 | AC-5: Maryan.md parses correctly in loadPoiLanguageConfig | `language-config.ts`: Case-insensitive SCRIPT_MAP lookup |
| REQ-002 | AC-6: Env var documented in code comments | `trip-config.ts` + `language-config.ts`: Comment block at env var usage |
| REQ-003 | AC-1: manifest.json schema includes trip_details_file | `content_format_rules.md`: manifest.json Schema section |
| REQ-003 | AC-2: Field defaults to trip_details.md | `content_format_rules.md`: Field rules — default stated |
| REQ-003 | AC-3: Phase A writes trip_details_file | `content_format_rules.md`: Phase A Output step 3 |
| REQ-003 | AC-4: Rendering reads filename from manifest | `rendering-config.md`: Country Flag Rule + Agent Prompt Contract |
| REQ-004 | AC-1: Phase B Generation Context parameterized | `content_format_rules.md`: Generation Context per Day |
| REQ-004 | AC-2: Phase B Subagent Execution parameterized | `content_format_rules.md`: Parallel Subagent Execution context |
| REQ-004 | AC-3: Agent Prompt Contract parameterized | `rendering-config.md`: Agent Prompt Contract item 12 |
| REQ-004 | AC-4: Maryan.md trip uses Moldova data | Validated by pipeline execution (REQ-005) |
| REQ-005 | AC-1: Pipeline with Maryan.md produces Moldova trip | End-to-end validation — no code change, pipeline behavior |
| REQ-005 | AC-2: Manifest contains trip_details_file + destination | `content_format_rules.md`: Phase A Output + manifest schema |
| REQ-005 | AC-3: Hebrew reporting language used | Pipeline reads from Maryan.md which specifies Hebrew |
| REQ-005 | AC-4: Tests with TRIP_DETAILS_FILE=Maryan.md pass | `trip-config.ts` + `language-config.ts` parser robustness |
| REQ-005 | AC-5: Default pipeline still produces Budapest trip | Fallback to `trip_details.md` at all parameterization points |
| REQ-006 | AC-1: trip_intake_rules.md allows custom filename | `trip_intake_rules.md`: Purpose section updated |
| REQ-006 | AC-2: Any compliant file is valid pipeline input | `trip_intake_rules.md`: Output description updated |
