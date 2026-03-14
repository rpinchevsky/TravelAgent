# High-Level Design

**Change:** {Change title}
**Date:** {YYYY-MM-DD}
**Author:** Development Team
**BRD Reference:** {Link to business_requirements.md}
**Status:** Draft | Under Review | Approved

---

## 1. Overview

{High-level summary of the technical approach. Which system components are affected and how they interact.}

## 2. Affected Components

| Component | File(s) | Type of Change |
|---|---|---|
| {e.g., Day file format} | `content_format_rules.md` | Modified — new section added |
| {e.g., HTML rendering} | `rendering-config.md` | Modified — new POI card tag |
| {e.g., Automation tests} | `automation/code/tests/regression/` | New spec file |

## 3. Data Flow

{How data flows through the system for this change. Which inputs produce which outputs.}

```
{Diagram or flow description}
```

## 4. Integration Points

{How this change connects to existing components. What contracts must be preserved.}

## 5. Impact on Existing Behavior

| Area | Impact | Backward Compatible? |
|---|---|---|
| {e.g., Existing day files} | {No change to existing POI cards} | Yes |
| {e.g., POI parity tests} | {New POI types increase card count} | No — test data must update |

## 6. BRD Coverage Matrix

| Requirement | Addressed in HLD? | Section |
|---|---|---|
| REQ-{NNN} | Yes / Partial / No | §{N} |
