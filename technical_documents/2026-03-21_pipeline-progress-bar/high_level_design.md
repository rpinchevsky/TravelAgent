# High-Level Design — Pipeline Progress Bar

**Date:** 2026-03-21
**Feature:** Static pipeline roadmap in the trip intake post-download section
**Affected file:** `trip_intake.html`

---

## 1. Problem Statement

After the user downloads their trip details file and sees the "paste this command" section, they have no visibility into what happens next. The trip generation pipeline takes ~35 minutes across 6 distinct phases. Users need to understand the scope and duration of the pipeline so they can set expectations and monitor progress themselves while Claude Code runs.

## 2. Solution Overview

Add a **static informational pipeline roadmap** inside the existing `#postDownload` section of `trip_intake.html`. This is a visual timeline displaying the 6 generation steps with their estimated durations and proportional width bars. It appears alongside the existing post-download content when the download button is clicked.

**Key constraint:** This is a standalone HTML page; the pipeline runs in Claude Code. The display is purely informational — no live progress tracking.

## 3. Architecture Decisions

### 3.1 Placement
The pipeline roadmap is inserted **inside** the existing `#postDownload` div, **after** the hint paragraph (`.post-download__hint`). It shares the same visibility lifecycle: hidden by default, revealed on download click, reset when navigating away from Step 7.

### 3.2 Layout Strategy
- **Desktop (>480px):** Horizontal stepped timeline — 6 steps in a single row with proportional-width bar segments beneath each step label.
- **Mobile (<=480px):** Vertical stacked list — each step is a horizontal row (number + label + time + bar).
- This mirrors the responsive pattern already established by `.post-download__cmd-row`.

### 3.3 Styling Approach
All styles use existing design tokens (CSS custom properties). No new tokens introduced. The pipeline visual uses:
- `--color-brand-primary` and `--color-brand-accent` for step indicators
- `--color-surface-raised` for bar backgrounds
- `--color-text-muted` and `--color-text-secondary` for labels and times
- Standard spacing tokens (`--space-2`, `--space-3`, `--space-4`)

### 3.4 i18n
All user-visible text uses `data-i18n` attributes. New keys follow the existing `s7_post_*` prefix convention: `s7_pipeline_*`. Translations are provided for all 3 supported languages (en, ru, he).

### 3.5 RTL Support
The horizontal timeline reverses direction via `direction: rtl` on the container or `flex-direction: row-reverse`. Bar fill direction also flips.

### 3.6 No JavaScript Logic Changes
The pipeline section lives inside `#postDownload`, which is already toggled by the download button handler (`$('#postDownload').style.display = ''`). No additional JS is needed to show/hide it. The data is static — step names, durations, and percentages are hardcoded in HTML.

## 4. Component Breakdown

| Component | Purpose |
|-----------|---------|
| `.pipeline-roadmap` | Outer container with top border separator |
| `.pipeline-roadmap__header` | Section title + total time |
| `.pipeline-roadmap__steps` | Flex container for the 6 step items |
| `.pipeline-roadmap__step` | Individual step: number badge + label + time + bar segment |
| `.pipeline-roadmap__bar` | Proportional-width colored bar segment |

## 5. Pipeline Steps Data

| # | i18n Key | EN Label | Duration | Bar Width |
|---|----------|----------|----------|-----------|
| 1 | `s7_pipeline_step1` | Overview & Manifest | ~2 min | 6% |
| 2 | `s7_pipeline_step2` | Day Generation | ~12 min | 34% |
| 3 | `s7_pipeline_step3` | Budget | ~1 min | 3% |
| 4 | `s7_pipeline_step4` | Assembly | ~1 min | 3% |
| 5 | `s7_pipeline_step5` | HTML Rendering | ~11 min | 31% |
| 6 | `s7_pipeline_step6` | Quality Testing | ~1 min | 3% |

Bar widths are normalized so the two largest steps (Day Generation at 34% and HTML Rendering at 31%) dominate visually, while smaller steps get a minimum width of 3% for readability.

## 6. Non-Goals

- **Live progress tracking** — not possible; the pipeline runs in Claude Code, not the browser.
- **Clickable steps** — no interaction; purely informational.
- **Animation/auto-advance** — no timer-based animations. The display is static.
- **New design tokens** — reuse existing tokens only.

## 7. Risk Assessment

| Risk | Mitigation |
|------|------------|
| Pipeline times change in future | Times are hardcoded in HTML; easy single-file update |
| Horizontal layout too cramped on tablet | Min-width on steps + overflow scroll fallback |
| RTL bar direction confusing | Test with Hebrew locale explicitly |
