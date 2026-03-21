# Architecture Review

**Change:** Dynamic Trip Details Filename and Auto-Generate Trigger
**Date:** 2026-03-21
**Reviewer:** Software Architect
**Documents Reviewed:** HLD, DD
**Verdict:** Approved with Changes

---

## 1. Review Summary

This is a well-scoped, targeted UI change affecting a single standalone HTML file (`trip_intake.html`) and two rule files. The design correctly centralizes filename logic in a single `getTripFilename()` function, reuses existing page patterns (toast, clipboard, surface cards, i18n), and properly addresses RTL, mobile responsiveness, and dark mode. The HLD data flow is clear and the DD provides line-level precision for all changes.

The change does not touch the trip generation pipeline, HTML rendering, or test infrastructure. It is confined to the intake wizard's Step 7 behavior and two documentation files.

Two minor issues were identified (one code style inconsistency, one documentation inaccuracy). Neither blocks implementation.

## 2. Architecture Principles Checklist

| Principle | Status | Notes |
|---|---|---|
| Content / presentation separation | Pass | Filename is pure data derivation from form inputs. The `getTripFilename()` function is logic-only with no DOM manipulation or styling concerns. The generated markdown content is unchanged. |
| Easy to extend | Pass | Single function `getTripFilename()` encapsulates the entire filename pattern. Changing the pattern (e.g., adding destination, changing separator) requires editing one function. Three consumers call it without knowledge of the pattern internals. |
| Consistent with existing patterns | Pass | Post-download section uses the same design tokens (`--color-surface`, `--color-border`, `--radius-container`, `--shadow-sm`), the same toast system (`showToast`), the same clipboard API pattern (`navigator.clipboard.writeText`), and the same BEM naming convention (`.post-download__*`). RTL override follows the established `html[dir="rtl"]` selector pattern. Mobile breakpoint uses 480px consistent with existing breakpoints. |
| No unnecessary coupling | Pass | `getTripFilename()` reads two DOM values that are already read by `generateMarkdown()`. The DD correctly notes this uses the "same selectors" rather than sharing data between functions. Given the standalone HTML context (no module system, no state management), direct DOM reads are the appropriate approach. Introducing shared state would add complexity without benefit. |
| Regeneration performance | N/A | This change does not affect trip generation, rendering, or any batch operations. The `getTripFilename()` call is instantaneous (two DOM reads + string ops). |
| i18n compliance | Pass | All four new static text strings have `data-i18n` attributes. Keys follow the existing `s7_` prefix convention. Translations provided for en/ru/he with English fallback for remaining 9 languages, matching the established pattern. The filename itself is correctly not translated (it is data, not UI chrome). |
| RTL compliance | Pass | Left accent border correctly flips to right border via `html[dir="rtl"] .post-download` override. Consistent with the existing pattern at line 1332 (`html[dir="rtl"] .step__title`). |
| Mobile responsiveness | Pass | The `.post-download__cmd-row` stacks vertically at 480px breakpoint. Copy button aligns right when stacked. The `<code>` element has `overflow-x: auto` for long filenames. Touch target inherited from `.btn` (44px min-height). |
| Language-agnostic rule | Pass | No language-specific string matching introduced. The filename uses the traveler's name as-is (lowercased, sanitized), not a translated label. |

## 3. Feedback Items

### 3.1 [Minor] Inconsistent use of `$` alias vs `document.querySelector` in `getTripFilename()`

**Location:** DD Section 1.1.1, `getTripFilename()` function

**Issue:** The proposed function uses `document.querySelector('#parentsContainer .traveler-card .parent-name')` for the name element but `$('#arrival')` for the arrival date. The page defines `const $ = (s) => document.querySelector(s)` at line 2799. All existing code uses the `$()` shorthand consistently.

**Recommendation:** Use the `$` alias for both queries:
```javascript
const nameEl = $('#parentsContainer .traveler-card .parent-name');
const arrivalVal = $('#arrival').value || '';
```

**Severity:** Minor (code style consistency, no functional impact)

### 3.2 [Informational] DD comment about `datetime-local` input type is inaccurate

**Location:** DD Section 1.1.1, rationale paragraph

**Issue:** The DD states "`$('#arrival').value` for `datetime-local` inputs always returns ISO format." In practice, `#arrival` is a `type="hidden"` input (line 1637), not `datetime-local`. Its value is populated by the calendar picker via `arrivalInput.value = s.toISOString().slice(0, 16)` (line 4106), which produces the same `YYYY-MM-DDTHH:MM` format.

**Impact:** None. The `substring(0, 10)` extraction logic is correct regardless of input type, since the value format is identical. This is a documentation accuracy note only.

**Severity:** Informational (no code change needed; dev team should be aware the rationale comment in code should say "hidden input populated with ISO format" rather than "datetime-local input")

## 4. Best Practice Recommendations

1. **Consider `aria-live` on the post-download section.** Since the section is revealed dynamically after a user action (download click), screen readers may not announce its appearance. Adding `aria-live="polite"` to `#postDownload` or using `role="status"` would improve accessibility. This follows the same pattern as the existing toast system (`role="status"`, `aria-live="polite"` at line ~6337). Not blocking, but a good enhancement.

2. **Command text should use `user-select: all` on the `<code>` element.** If a user prefers to manually select and copy the command text (rather than using the Copy button), `user-select: all` on `.post-download__cmd` would let them select the entire command with a single click. This is a common UX pattern for copy-able code snippets.

3. **Consider `white-space: pre` instead of `nowrap` on `.post-download__cmd`.** Both prevent wrapping, but `pre` preserves intentional whitespace more explicitly and is the standard choice for code/command display. Minor preference.

## 5. Sign-off

| Aspect | Assessment |
|---|---|
| Scope containment | Excellent. 3 files, no pipeline impact, no test infrastructure changes. |
| Design system adherence | Full compliance. All tokens, patterns, and conventions followed. |
| BRD traceability | Complete. All 13 acceptance criteria mapped to specific DD sections. |
| Risk level | Low. Standalone UI change with no downstream dependencies. |
| Feedback items | 1 minor, 1 informational, 3 best-practice recommendations |

**Verdict: Approved with Changes**

The minor feedback item (3.1 -- `$` alias consistency) should be addressed during implementation. The informational item (3.2) and best-practice recommendations are at the developer's discretion.

| Role | Name | Date | Verdict |
|---|---|---|---|
| SA | Software Architect | 2026-03-21 | Approved with Changes |
