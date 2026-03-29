# UX Design Document

**Change:** {Change title}
**Date:** {YYYY-MM-DD}
**Author:** UX/UI Principal Engineer
**BRD Reference:** {Link to business_requirements.md}
**Status:** Draft | Under Review | Approved

---

## 1. Overview

{High-level summary of the user experience goals for this change. What problem is being solved from the user's perspective? What is the desired experience?}

## 2. User Flow

{Describe the step-by-step user journey for this change. Where does the user encounter the new feature? How do they interact with it? What happens at each decision point?}

```
{Flow diagram or textual step sequence}
```

## 3. Placement & Navigation

{Where in the existing UI does this change live? Why this location? How does the user discover and access it?}

| Element | Location | Rationale |
|---|---|---|
| {e.g., Hotel toggle} | {e.g., Step 6, after wheelchair} | {e.g., Groups all optional extras} |

## 4. Layout & Wireframes

{Describe the visual layout for each new or modified screen/section. Include ASCII wireframes, annotated descriptions, or references to mockups.}

### 4.1 {Screen/Section name}

**Desktop (≥1024px):**
```
{Layout sketch or description}
```

**Mobile (≤480px):**
```
{Layout sketch or description}
```

## 5. Component Specifications

{For each new UI component, define its visual and behavioral spec.}

### 5.1 {Component name}

**Visual:**
- Dimensions: {width, height, padding, margin}
- Colors: {background, text, border, accent — reference design tokens}
- Typography: {font size, weight, line height}
- Border radius: {value}

**States:**
- Default: {appearance}
- Hover: {appearance}
- Active/Selected: {appearance}
- Disabled: {appearance}
- Focus: {appearance + outline spec}

**Behavior:**
- Click/tap: {what happens}
- Keyboard: {tab order, key bindings}

## 6. Interaction Patterns

{Define animations, transitions, conditional visibility, and dynamic behavior.}

| Interaction | Trigger | Behavior | Duration |
|---|---|---|---|
| {e.g., Section expand} | {e.g., Toggle "Yes" click} | {e.g., Slide open with opacity fade} | {e.g., 400ms ease} |

## 7. Responsive Behavior

{Define how the layout adapts across breakpoints.}

| Breakpoint | Layout Change |
|---|---|
| Desktop (≥1024px) | {e.g., 4-column grid} |
| Tablet (768px) | {e.g., 3-column grid} |
| Mobile (≤480px) | {e.g., 2-column grid, full-width cards} |

## 8. Accessibility

{Define ARIA roles, keyboard navigation, screen reader behavior, contrast requirements.}

- **ARIA:** {roles, labels, states}
- **Keyboard:** {tab order, key interactions}
- **Screen reader:** {announced text, live regions}
- **Contrast:** {minimum ratios, checked against WCAG 2.1 AA}
- **Touch targets:** {minimum 44×44px}

## 9. RTL Support

{Define right-to-left layout adjustments for Hebrew/Arabic.}

| Element | LTR | RTL |
|---|---|---|
| {e.g., Slider direction} | {Left=min, Right=max} | {Right=min, Left=max} |

## 10. Dark Mode

{Define dark mode color overrides for new components.}

| Element | Light Mode | Dark Mode |
|---|---|---|
| {e.g., Card background} | {#FFFFFF} | {#2A2A2A} |

## 11. Design Consistency Check

{Verify this change is consistent with existing design patterns. List any existing patterns being reused and any new patterns being introduced.}

| Pattern | Existing/New | Reference |
|---|---|---|
| {e.g., Toggle card (Yes/No)} | Existing | {e.g., Wheelchair accessibility, Step 6} |
| {e.g., Range slider} | New | {Defined in §5} |

## 12. BRD Coverage Matrix

| Requirement | UX Addressed? | Section |
|---|---|---|
| REQ-{NNN} | Yes / Partial / N/A | §{N} |

## 13. Approval Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| Product Manager | | | Approved / Rejected |
| Dev Team Lead | | | Approved / Rejected |
| UX/UI Principal Engineer | | | Self-approved |

**Conditions (if any):**
- [ ] {Condition 1}
