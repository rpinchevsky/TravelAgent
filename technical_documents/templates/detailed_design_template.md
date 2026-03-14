# Detailed Design

**Change:** {Change title}
**Date:** {YYYY-MM-DD}
**Author:** Development Team
**HLD Reference:** {Link to high_level_design.md}
**Status:** Draft | Under Review | Approved

---

## 1. File Changes

### 1.1 {File path}

**Action:** Create | Modify | Delete

**Current state:**
```
{Relevant existing content or "N/A" for new files}
```

**Target state:**
```
{Exact content after the change}
```

**Rationale:** {Why this specific change satisfies the requirement}

---

*(Repeat 1.X block for each file)*

## 2. Markdown Format Specification

{If the change introduces new markdown sections, define the exact format here.}

**Section name:** `### {Section heading}`
**Position in day file:** {After X, before Y}
**Required fields:**
- {Field 1: description}
- {Field 2: description}

**Example:**
```markdown
{Complete example of the new section}
```

## 3. HTML Rendering Specification

{If the change affects HTML output, define the component structure here.}

**Component:** `<div class="{class}">`
**Tag:** `<span class="poi-card__tag">{tag text}</span>`
**Required attributes:** {id, class, aria-*}

**Example:**
```html
{Complete HTML example}
```

## 4. Rule File Updates

{List all rule files that need updating and the exact changes.}

| Rule File | Section | Change |
|---|---|---|
| {file} | {section} | {description} |

## 5. Implementation Checklist

- [ ] {Step 1}
- [ ] {Step 2}
- [ ] {Step N}

## 6. BRD Traceability

| Requirement | Acceptance Criterion | Implemented in |
|---|---|---|
| REQ-{NNN} | AC-1 | {File:section} |
| REQ-{NNN} | AC-2 | {File:section} |
