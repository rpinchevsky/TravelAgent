# Business Requirements Document
**Change:** Pipeline Progress Bar in Post-Download Section
**Date:** 2026-03-21
**Author:** Product Manager
**Status:** Approved

## 1. Background & Motivation

After the user completes the trip intake wizard and downloads their trip details file, the post-download section (Step 7) shows a command to paste into Claude Code. However, the user has **no visibility into what happens next** — the trip generation pipeline takes approximately 28-35 minutes end-to-end, spanning six distinct phases with very different durations. Users are left wondering: Is it still running? How long will this take? What is it doing?

The `performance_analysis.md` report provides concrete timing data from a real 12-day Budapest trip generation. By surfacing this data as a static visual pipeline roadmap in the post-download section, users gain immediate understanding of the process they are about to trigger, setting correct expectations before they even paste the command.

This is a **static informational display**, not a live progress tracker. The trip intake page is a standalone browser HTML file with no real-time communication channel to the Claude Code CLI. The roadmap shows estimated durations based on measured pipeline performance.

## 2. Scope

### In Scope
- Static visual pipeline roadmap added to the post-download section of Step 7
- Six pipeline steps with names, estimated durations, and percentage of total time
- Total estimated time summary
- Consistent with the existing design system (tokens, responsive behavior, i18n, RTL, dark mode)
- Updates to `trip_intake.html`, `trip_intake_rules.md`, and `trip_intake_design.md`

### Out of Scope
- Live/real-time progress tracking (not technically feasible — standalone HTML cannot communicate with CLI)
- Clickable or interactive steps (this is informational only)
- Customization of estimated times based on trip length or complexity
- Changes to the pipeline itself or to `performance_analysis.md`

## 3. Requirements

### REQ-001: Pipeline Steps Visual

**Description:** Display a visual stepped progress bar (horizontal timeline/roadmap) in the post-download section showing the six stages of the trip generation pipeline. The visual must clearly convey a sequential process with distinct phases.

**Pipeline steps (in order):**

| # | Step Name | Description |
|---|-----------|-------------|
| 1 | Phase A — Overview & Manifest | Web research, overview table, manifest generation |
| 2 | Phase B — Day Generation | Parallel day-by-day content generation with POI research |
| 3 | Budget | Read all days, aggregate costs into budget file |
| 4 | Assembly | Concatenate all parts into full trip markdown |
| 5 | HTML Render | Generate HTML fragments in parallel, assemble final page |
| 6 | Regression Testing | Playwright test suite validates output quality |

**Acceptance criteria:**
- AC-001.1: All six steps are displayed in order as a horizontal stepped timeline (or equivalent visual that conveys sequential progression)
- AC-001.2: Each step shows its name and a step number or icon
- AC-001.3: The visual appears inside the existing `.post-download` section, below the command copy row and hint text
- AC-001.4: The visual is hidden by default and appears together with the rest of the post-download section when the user clicks download
- AC-001.5: The visual resets (hides) when navigating away from Step 7 and returning, consistent with existing post-download behavior
- AC-001.6: Responsive: on mobile (<=480px), the timeline adapts gracefully (e.g., vertical layout or compact horizontal scroll)
- AC-001.7: Supports dark mode via existing `prefers-color-scheme: dark` tokens
- AC-001.8: Supports RTL layout for Hebrew and Arabic (direction flips)
- AC-001.9: All static text uses `data-i18n` attributes for i18n support across 12 languages

### REQ-002: Timing Information Display

**Description:** Each pipeline step displays its estimated duration and its share of total pipeline time. A summary line shows the total estimated duration.

**Timing data (based on measured performance):**

| Step | Estimated Duration | % of Total |
|------|-------------------|------------|
| Phase A — Overview & Manifest | ~2 min | 5% |
| Phase B — Day Generation | ~12 min | 35% |
| Budget | ~1 min | 2% |
| Assembly | ~1 min | 1% |
| HTML Render | ~11 min | 31% |
| Regression Testing | ~1 min | 2% |
| **Total** | **~28 min** | — |

*Note: Percentages are rounded from `performance_analysis.md` actuals. The remaining ~24% (fixes/re-runs) is excluded because it is non-deterministic and would confuse users. The "Total" represents the expected happy-path duration.*

**Acceptance criteria:**
- AC-002.1: Each step shows its estimated duration (e.g., "~2 min", "~12 min")
- AC-002.2: Each step shows its percentage of total time, displayed as a visual proportion (e.g., bar width, segment size) or as text
- AC-002.3: A summary element shows the total estimated pipeline duration ("~28 min")
- AC-002.4: The two heaviest steps (Phase B at 35% and HTML Render at 31%) are visually distinguishable as major phases (e.g., wider bars, bolder styling, distinct color)
- AC-002.5: Timing values are defined as data constants in JavaScript (not hardcoded in HTML), enabling future updates without HTML surgery

## 4. Dependencies & Risks

### Dependencies
- **Design system tokens:** The visual must use existing CSS variables from the design system (`--color-brand-primary`, `--color-brand-accent`, spacing scale, radius, shadows). No new tokens required.
- **Post-download section:** The feature extends the existing `.post-download` component (specified in `trip_intake_design.md`). The section's show/hide lifecycle is already implemented.
- **i18n system:** Step names and labels must be added to the `TRANSLATIONS` object for all 12 supported languages.

### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Timing estimates become outdated as pipeline is optimized | Low — users see approximate guidance, not guarantees | Use "~" prefix on all durations; store values as JS constants for easy updates |
| Post-download section becomes too tall with the added roadmap | Medium — could push important content below fold on smaller screens | Use compact visual (single horizontal bar row or collapsible section); validate at 480px breakpoint |
| i18n complexity — step names need translation in 12 languages | Low — small number of short strings | Add to existing TRANSLATIONS object; fallback to English for untranslated locales |

## 5. Acceptance Sign-off

| Criterion | Validation Method |
|-----------|-------------------|
| Six pipeline steps render correctly in order | Visual inspection in Chrome, Firefox, Safari |
| Timing data matches specification table | Code review of JS constants |
| Responsive at desktop (>=1024px), tablet (768px), mobile (<=480px) | Browser resize testing |
| Dark mode renders correctly | Toggle `prefers-color-scheme` in DevTools |
| RTL layout correct for Hebrew/Arabic | Set UI language to Hebrew, inspect layout |
| i18n keys present for all static text | Code review of TRANSLATIONS object |
| Section appears/disappears with post-download lifecycle | Click download, verify appearance; navigate away and back, verify reset |
| Total estimated time displayed | Visual inspection |
| Major phases (Phase B, HTML Render) visually emphasized | Visual inspection |

**Self-validation:** All requirements are testable via visual inspection and code review. No external service dependencies. The feature is purely additive to the existing post-download section and does not alter any existing functionality. Status: **Approved**.
