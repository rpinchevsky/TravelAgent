# Architecture Review — Pipeline Progress Bar

**Date:** 2026-03-21
**Reviewer:** Software Architect
**Documents Reviewed:** BRD, HLD, DD
**Verdict:** APPROVED WITH CONDITIONS

---

## Summary

The design is architecturally sound for a static informational component. It correctly leverages the existing `#postDownload` visibility lifecycle, reuses design system tokens, follows BEM naming conventions, and introduces no runtime JavaScript. The conditions below must be resolved before implementation proceeds.

---

## Findings

### MUST FIX (2)

#### MF-001: BRD Requirement AC-002.5 Violation — Timing Values Hardcoded in HTML

**BRD AC-002.5** explicitly requires: *"Timing values are defined as data constants in JavaScript (not hardcoded in HTML), enabling future updates without HTML surgery."*

The DD hardcodes all timing data directly in HTML attributes (`flex-basis`, `width`, `title`) and in text content (`~2 min`, `~12 min`, etc.). This contradicts the BRD.

**Required change:** Define a JS constant array (e.g., `PIPELINE_STEPS`) containing each step's i18n key, duration text, and percentage. On page load (or inside the download handler), iterate the array and populate the HTML dynamically. The HTML template can use placeholder elements that JS fills in. This also eliminates the duplication between the steps row and the bar track, where percentages and labels appear twice.

#### MF-002: Total Time Inconsistency Between BRD and DD

The BRD specifies `~28 min total` (REQ-002 table). The HLD and DD both use `~35 min total` in the header and i18n keys. The individual step durations (2+12+1+1+11+1 = 28 min) match the BRD, but the displayed total does not.

**Required change:** Reconcile the total. If the intent is to include non-deterministic overhead (~7 min for fixes/re-runs), the BRD explicitly excluded this: *"The remaining ~24% (fixes/re-runs) is excluded because it is non-deterministic and would confuse users."* Use `~28 min` consistently, or update the BRD to justify `~35 min`. The bar-segment widths (6+34+3+3+31+3 = 80%) also reflect the BRD's note that the remaining percentage is excluded; this is fine for proportional display, but the total label must match.

---

### SHOULD FIX (3)

#### SF-001: i18n Coverage — Only 3 of 12 Languages

The BRD (REQ-001 AC-001.9) requires i18n support across all 12 supported languages. The DD provides translations for only 3 (en, ru, he). While the existing `t()` function falls back to English for missing translations, the 9 omitted languages (es, fr, de, it, pt, zh, ja, ko, ar) should have translations added in the same implementation pass to maintain parity with existing keys.

**Note:** Arabic (ar) is an RTL language like Hebrew, so the RTL rules will apply to it as well. Verify RTL behavior covers both `he` and `ar`.

#### SF-002: Hardcoded Font Size in `.pipeline-roadmap__label`

The DD uses `font-size: 0.6875rem` (11px) for the label. This is a raw value not in the design token scale (`--text-xs: 0.75rem`, `--text-sm: 0.875rem`). Every other text element in the component uses token values.

**Required change:** Use `--text-xs` (0.75rem / 12px) instead. The 1px difference is negligible, and token consistency is more important than pixel-perfect sizing. If the label is truly too large at 12px, the correct approach is to add a token (e.g., `--text-2xs`) rather than hardcode a one-off value.

#### SF-003: Bar Segment Percentage Sum Does Not Reach 100%

The bar-track segments sum to 80% (6+34+3+3+31+3). The remaining 20% is unfilled, rendering as the track background color. While this is a deliberate design choice reflecting the BRD's exclusion of non-deterministic time, it may look like a rendering bug to users — a progress bar that stops at 80% without explanation.

**Recommendation:** Either (a) normalize the 6 segments to sum to 100% (proportions stay the same: 7.5%, 42.5%, 3.75%, 3.75%, 38.75%, 3.75%), or (b) add a subtle "other" segment with a distinct style to represent the variable portion. Option (a) is simpler and visually cleaner.

---

### CONSIDER (3)

#### C-001: Duplicate Data Between Steps Row and Bar Track

The HTML contains each step's percentage and label twice: once in the `.pipeline-roadmap__step` elements (via `flex-basis`) and again in the `.pipeline-roadmap__bar-segment` elements (via `width` and `title`). If MF-001 is implemented (JS constants), this duplication is naturally resolved since both structures would be generated from the same data source.

#### C-002: Hover Interaction on Bar Track

The DD includes a hover effect on `.pipeline-roadmap__bar-track` that changes segment opacity. While visually appealing, this is the only interactive behavior in the component, which is otherwise described as "purely informational" and "static." This is minor — the hover effect does not imply clickability — but consider whether it adds enough value to justify the slight inconsistency with the "no interaction" design principle.

#### C-003: Mobile RTL Override

The mobile media query overrides `flex-direction: column` for RTL steps, then sets `flex-direction: row-reverse` on individual step items. This is correct. However, the bar track's `flex-direction: row-reverse` (from the RTL rule) is not overridden at mobile. Since the bar track remains horizontal at all breakpoints, this is fine, but add a CSS comment clarifying the intentional asymmetry between steps (vertical at mobile) and bar-track (always horizontal, RTL-reversed when needed).

---

## Token Validation

All CSS variables referenced in the DD exist in the design system:

| Variable | Defined | Line |
|----------|---------|------|
| `--color-surface-raised` | Yes | 26 |
| `--color-text-primary` | Yes | 27 |
| `--color-text-secondary` | Yes | 27 |
| `--color-text-muted` | Yes | 28 |
| `--color-text-inverse` | Yes | 28 |
| `--color-brand-primary` | Yes | 23 |
| `--color-brand-accent-alt` | Yes | 24 |
| `--color-border` | Yes | 29 |
| `--space-1` through `--space-4` | Yes | 13 |
| `--text-xs`, `--text-sm` | Yes | 20 |
| `--font-weight-medium`, `--font-weight-semibold` | Yes | 17-18 |
| `--transition-fast` | Yes | 35 |
| `--radius-*` (not used) | N/A | — |
| `--shadow-*` (not used) | N/A | — |

**Result:** All referenced tokens are valid. No phantom variables.

---

## Architecture Strengths

1. **Zero JavaScript logic** — The component inherits visibility from its parent `#postDownload` div with no additional event handlers or state management.
2. **BEM naming** — `.pipeline-roadmap__*` follows the established BEM pattern used by `.post-download__*`, `.search-bar__*`, and other components.
3. **CSS-only responsive** — The mobile vertical stack uses clean flex overrides without JS media query listeners.
4. **Dark mode** — Correctly uses existing `prefers-color-scheme: dark` media query with token-based colors.
5. **Placement** — Inserting inside `#postDownload` rather than as a sibling avoids any lifecycle management changes.

---

## Verdict

**APPROVED WITH CONDITIONS** — Resolve the 2 MUST-FIX items before implementation. The SHOULD-FIX items are strongly recommended for the same implementation pass. CONSIDER items are at the implementer's discretion.

| Severity | Count |
|----------|-------|
| Must Fix | 2 |
| Should Fix | 3 |
| Consider | 3 |
| **Total** | **8** |
