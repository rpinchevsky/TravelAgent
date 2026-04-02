# High-Level Design

**Change:** Convert trip_details.json to trip_details.md
**Date:** 2026-03-14
**Author:** Development Team
**BRD Reference:** `business_requirements.md`
**Status:** Approved (retroactive)

---

## 1. Overview

Replace the JSON-formatted trip metadata file with an equivalent markdown file. Update the single parser that consumes it (`language-config.ts`) to use regex extraction. Update all textual references across the project. No behavioral changes — this is a format migration.

## 2. Affected Components

| Component | File(s) | Type of Change |
|---|---|---|
| Trip metadata | `trip_details.json` → `trip_details.md` | Replaced (delete + create) |
| Language config parser | `automation/code/tests/utils/language-config.ts` | Modified — JSON.parse → regex |
| CLAUDE.md | `CLAUDE.MD` | Modified — file reference |
| README | `README.md` | Modified — file reference |
| Content format rules | `content_format_rules.md` | Modified — file reference |
| Trip planning rules | `trip_planning_rules.md` | Modified — file reference |
| Rendering config | `rendering-config.md` | Modified — file reference |
| Release notes | `automation/code/release_notes.md` | Modified — file reference |
| Test plan | `automation/code/regression_test_plan.md` | Modified — file reference |
| Language test specs | `activity-label-languages.spec.ts`, `poi-languages.spec.ts` | Modified — file reference |

## 3. Data Flow

```
trip_details.md  ──(read by)──►  language-config.ts  ──(provides)──►  test specs
                 ──(referenced by)──►  rule files, CLAUDE.md, README
```

No change to data flow direction or consumers — only the file format and parser method change.

## 4. Integration Points

- `language-config.ts` is the only programmatic consumer; all other references are documentation
- The parser contract (exported interface) remains identical — consumers receive the same data shape

## 5. Impact on Existing Behavior

| Area | Impact | Backward Compatible? |
|---|---|---|
| Test execution | No change — same data extracted | Yes |
| Trip generation | No change — rule files reference same data | Yes |
| Manual editing | Improved — markdown easier than JSON | Yes (improvement) |

## 6. BRD Coverage Matrix

| Requirement | Addressed in HLD? | Section |
|---|---|---|
| REQ-001 | Yes | §2 (Trip metadata row) |
| REQ-002 | Yes | §2 (Language config parser row), §3 |
| REQ-003 | Yes | §2 (all reference rows) |
