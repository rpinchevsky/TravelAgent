# Detailed Design — Pipeline Progress Bar

**Date:** 2026-03-21
**Feature:** Static pipeline roadmap in the trip intake post-download section
**Affected file:** `trip_intake.html`

---

## 1. HTML Structure

Insert the following block inside `#postDownload`, immediately **after** the `<p class="post-download__hint">` element (line 2866) and **before** the closing `</div>` of `#postDownload` (line 2867).

```html
<!-- Pipeline Roadmap -->
<div class="pipeline-roadmap">
  <div class="pipeline-roadmap__header">
    <span class="pipeline-roadmap__title" data-i18n="s7_pipeline_title">What happens next</span>
    <span class="pipeline-roadmap__total" data-i18n="s7_pipeline_total">~35 min total</span>
  </div>

  <div class="pipeline-roadmap__steps">
    <div class="pipeline-roadmap__step" style="flex-basis:6%;">
      <div class="pipeline-roadmap__num">1</div>
      <div class="pipeline-roadmap__label" data-i18n="s7_pipeline_step1">Overview & Manifest</div>
      <div class="pipeline-roadmap__time">~2 min</div>
      <div class="pipeline-roadmap__bar"><div class="pipeline-roadmap__bar-fill"></div></div>
    </div>
    <div class="pipeline-roadmap__step pipeline-roadmap__step--major" style="flex-basis:34%;">
      <div class="pipeline-roadmap__num">2</div>
      <div class="pipeline-roadmap__label" data-i18n="s7_pipeline_step2">Day Generation</div>
      <div class="pipeline-roadmap__time">~12 min</div>
      <div class="pipeline-roadmap__bar"><div class="pipeline-roadmap__bar-fill"></div></div>
    </div>
    <div class="pipeline-roadmap__step" style="flex-basis:3%;">
      <div class="pipeline-roadmap__num">3</div>
      <div class="pipeline-roadmap__label" data-i18n="s7_pipeline_step3">Budget</div>
      <div class="pipeline-roadmap__time">~1 min</div>
      <div class="pipeline-roadmap__bar"><div class="pipeline-roadmap__bar-fill"></div></div>
    </div>
    <div class="pipeline-roadmap__step" style="flex-basis:3%;">
      <div class="pipeline-roadmap__num">4</div>
      <div class="pipeline-roadmap__label" data-i18n="s7_pipeline_step4">Assembly</div>
      <div class="pipeline-roadmap__time">~1 min</div>
      <div class="pipeline-roadmap__bar"><div class="pipeline-roadmap__bar-fill"></div></div>
    </div>
    <div class="pipeline-roadmap__step pipeline-roadmap__step--major" style="flex-basis:31%;">
      <div class="pipeline-roadmap__num">5</div>
      <div class="pipeline-roadmap__label" data-i18n="s7_pipeline_step5">HTML Rendering</div>
      <div class="pipeline-roadmap__time">~11 min</div>
      <div class="pipeline-roadmap__bar"><div class="pipeline-roadmap__bar-fill"></div></div>
    </div>
    <div class="pipeline-roadmap__step" style="flex-basis:3%;">
      <div class="pipeline-roadmap__num">6</div>
      <div class="pipeline-roadmap__label" data-i18n="s7_pipeline_step6">Quality Testing</div>
      <div class="pipeline-roadmap__time">~1 min</div>
      <div class="pipeline-roadmap__bar"><div class="pipeline-roadmap__bar-fill"></div></div>
    </div>
  </div>

  <div class="pipeline-roadmap__bar-track">
    <div class="pipeline-roadmap__bar-segment" style="width:6%;" title="Overview & Manifest"></div>
    <div class="pipeline-roadmap__bar-segment pipeline-roadmap__bar-segment--major" style="width:34%;" title="Day Generation"></div>
    <div class="pipeline-roadmap__bar-segment" style="width:3%;" title="Budget"></div>
    <div class="pipeline-roadmap__bar-segment" style="width:3%;" title="Assembly"></div>
    <div class="pipeline-roadmap__bar-segment pipeline-roadmap__bar-segment--major" style="width:31%;" title="HTML Rendering"></div>
    <div class="pipeline-roadmap__bar-segment" style="width:3%;" title="Quality Testing"></div>
  </div>
</div>
```

### 1.1 Design Rationale

The component has two visual parts:
1. **Steps row** (`.pipeline-roadmap__steps`) — A flex row of 6 step cards, each containing a numbered badge, label, and time. The `flex-basis` on each step is proportional to its duration, so wider steps visually communicate longer phases.
2. **Bar track** (`.pipeline-roadmap__bar-track`) — A single continuous proportional bar beneath the steps, divided into 6 colored segments. This gives an at-a-glance view of where time is spent.

The `--major` modifier identifies the two dominant steps (Day Generation and HTML Rendering) for accent coloring.

### 1.2 Minimum Width Handling

Steps with very small percentages (Budget, Assembly, Quality Testing at ~1-3%) use a `min-width` in CSS to ensure their labels remain readable. On mobile, the vertical layout eliminates this concern entirely.

---

## 2. CSS

Insert after the existing `.post-download` CSS block (after line 766, before `/* === Pace Selector */`).

```css
/* === Pipeline Roadmap === */
.pipeline-roadmap {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
}
.pipeline-roadmap__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: var(--space-3);
}
.pipeline-roadmap__title {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}
.pipeline-roadmap__total {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-medium);
}
.pipeline-roadmap__steps {
  display: flex;
  gap: 2px;
  margin-bottom: var(--space-2);
}
.pipeline-roadmap__step {
  min-width: 60px;
  text-align: center;
  padding: var(--space-2) var(--space-1);
}
.pipeline-roadmap__num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-surface-raised);
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}
.pipeline-roadmap__step--major .pipeline-roadmap__num {
  background: var(--color-brand-primary);
  color: var(--color-text-inverse);
}
.pipeline-roadmap__label {
  font-size: 0.6875rem;
  color: var(--color-text-secondary);
  line-height: 1.3;
  margin-bottom: 2px;
}
.pipeline-roadmap__time {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-medium);
}

/* --- Proportional bar track --- */
.pipeline-roadmap__bar-track {
  display: flex;
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
  background: var(--color-surface-raised);
  gap: 1px;
}
.pipeline-roadmap__bar-segment {
  background: var(--color-brand-accent-alt);
  border-radius: 1px;
  min-width: 4px;
  opacity: 0.5;
  transition: opacity var(--transition-fast);
}
.pipeline-roadmap__bar-segment--major {
  background: var(--color-brand-primary);
  opacity: 0.8;
}
.pipeline-roadmap__bar-track:hover .pipeline-roadmap__bar-segment {
  opacity: 1;
}

/* --- Dark mode --- */
@media (prefers-color-scheme: dark) {
  .pipeline-roadmap { border-top-color: var(--color-border); }
  .pipeline-roadmap__bar-segment { opacity: 0.6; }
  .pipeline-roadmap__bar-segment--major { opacity: 0.9; }
}

/* --- RTL --- */
html[dir="rtl"] .pipeline-roadmap__steps {
  flex-direction: row-reverse;
}
html[dir="rtl"] .pipeline-roadmap__bar-track {
  flex-direction: row-reverse;
}
html[dir="rtl"] .pipeline-roadmap__header {
  flex-direction: row-reverse;
}

/* --- Mobile: vertical stack --- */
@media (max-width: 480px) {
  .pipeline-roadmap__steps {
    flex-direction: column;
    gap: 0;
  }
  .pipeline-roadmap__step {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    text-align: start;
    min-width: unset;
    padding: var(--space-1) 0;
    flex-basis: unset !important;
    border-bottom: 1px solid var(--color-border);
  }
  .pipeline-roadmap__step:last-child {
    border-bottom: none;
  }
  .pipeline-roadmap__num {
    flex-shrink: 0;
    margin-bottom: 0;
  }
  .pipeline-roadmap__label {
    flex: 1;
    font-size: var(--text-xs);
    margin-bottom: 0;
  }
  .pipeline-roadmap__time {
    flex-shrink: 0;
    font-size: var(--text-xs);
  }
  .pipeline-roadmap__bar-track {
    margin-top: var(--space-2);
  }
  html[dir="rtl"] .pipeline-roadmap__steps {
    flex-direction: column;
  }
  html[dir="rtl"] .pipeline-roadmap__step {
    flex-direction: row-reverse;
    text-align: end;
  }
}
```

---

## 3. i18n Keys

### 3.1 New Translation Keys

| Key | EN | RU | HE |
|-----|----|----|-----|
| `s7_pipeline_title` | What happens next | Что будет дальше | מה קורה הלאה |
| `s7_pipeline_total` | ~35 min total | ~35 мин всего | ~35 דקות סה"כ |
| `s7_pipeline_step1` | Overview & Manifest | Обзор и манифест | סקירה ומניפסט |
| `s7_pipeline_step2` | Day Generation | Генерация дней | יצירת ימים |
| `s7_pipeline_step3` | Budget | Бюджет | תקציב |
| `s7_pipeline_step4` | Assembly | Сборка | הרכבה |
| `s7_pipeline_step5` | HTML Rendering | HTML рендеринг | עיבוד HTML |
| `s7_pipeline_step6` | Quality Testing | Тестирование качества | בדיקות איכות |

### 3.2 Insertion Points in TRANSLATIONS Object

**English (en):** Insert after `s7_post_hint` (line 3115):
```js
s7_pipeline_title: "What happens next",
s7_pipeline_total: "~35 min total",
s7_pipeline_step1: "Overview & Manifest",
s7_pipeline_step2: "Day Generation",
s7_pipeline_step3: "Budget",
s7_pipeline_step4: "Assembly",
s7_pipeline_step5: "HTML Rendering",
s7_pipeline_step6: "Quality Testing",
```

**Russian (ru):** Insert after `s7_post_hint` (line 3502):
```js
s7_pipeline_title: "Что будет дальше",
s7_pipeline_total: "~35 мин всего",
s7_pipeline_step1: "Обзор и манифест",
s7_pipeline_step2: "Генерация дней",
s7_pipeline_step3: "Бюджет",
s7_pipeline_step4: "Сборка",
s7_pipeline_step5: "HTML рендеринг",
s7_pipeline_step6: "Тестирование качества",
```

**Hebrew (he):** Insert after `s7_post_hint` (line 3887):
```js
s7_pipeline_title: "מה קורה הלאה",
s7_pipeline_total: "~35 דקות סה\"כ",
s7_pipeline_step1: "סקירה ומניפסט",
s7_pipeline_step2: "יצירת ימים",
s7_pipeline_step3: "תקציב",
s7_pipeline_step4: "הרכבה",
s7_pipeline_step5: "עיבוד HTML",
s7_pipeline_step6: "בדיקות איכות",
```

---

## 4. JavaScript Changes

### 4.1 No Visibility Logic Needed

The pipeline roadmap is nested inside `#postDownload`. The existing download handler already controls visibility:

```js
// Line 6323 — already handles showing the entire section
$('#postDownload').style.display = '';
```

And the step navigation already hides it:

```js
// Line 5937 — already handles hiding when re-entering Step 7
$('#postDownload').style.display = 'none';
```

Since the pipeline roadmap is a child of `#postDownload`, it inherits both behaviors automatically. **No new JavaScript is required.**

### 4.2 i18n Engine

The existing `applyI18n()` function scans all `[data-i18n]` attributes and replaces text content from the `TRANSLATIONS` object. The new `data-i18n` attributes on pipeline elements will be picked up automatically. **No changes to the i18n engine are needed.**

---

## 5. Insertion Summary

| What | Where in `trip_intake.html` | After |
|------|-----------------------------|-------|
| CSS block | Style section, ~line 767 | Existing `.post-download` responsive rules |
| HTML block | Inside `#postDownload` div, ~line 2866 | `<p class="post-download__hint">` |
| i18n keys (en) | TRANSLATIONS.en, ~line 3115 | `s7_post_hint` key |
| i18n keys (ru) | TRANSLATIONS.ru, ~line 3502 | `s7_post_hint` key |
| i18n keys (he) | TRANSLATIONS.he, ~line 3887 | `s7_post_hint` key |

Total new lines: ~120 CSS + ~35 HTML + ~24 i18n = ~179 lines added to `trip_intake.html`.

---

## 6. Visual Specification

### 6.1 Desktop Layout (>480px)

```
┌─────────────────────────────────────────────────────────────┐
│ What happens next                              ~35 min total│
│                                                             │
│  (1)        (2)          (3)    (4)       (5)         (6)   │
│ Overview  Day Gen      Budget Assembly  HTML Render  QA Test│
│  ~2 min   ~12 min      ~1 min  ~1 min   ~11 min     ~1 min │
│                                                             │
│ ▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮│
│ [6%  ][======34%======][3%][3%][=====31%=====][3% ]         │
└─────────────────────────────────────────────────────────────┘
```

- Step numbers (1)-(6) are circular badges
- Major steps (2, 5) have brand-primary background badges
- Minor steps (1, 3, 4, 6) have surface-raised background badges
- Bar segments: major steps use `--color-brand-primary`, minor use `--color-brand-accent-alt` at reduced opacity
- Hover on bar track brings all segments to full opacity

### 6.2 Mobile Layout (<=480px)

```
┌──────────────────────────────┐
│ What happens next  ~35 min   │
│                              │
│ (1) Overview & Manifest ~2m  │
│ ─────────────────────────── │
│ (2) Day Generation     ~12m  │
│ ─────────────────────────── │
│ (3) Budget              ~1m  │
│ ─────────────────────────── │
│ (4) Assembly            ~1m  │
│ ─────────────────────────── │
│ (5) HTML Rendering     ~11m  │
│ ─────────────────────────── │
│ (6) Quality Testing     ~1m  │
│                              │
│ ▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮ │
└──────────────────────────────┘
```

- Each step is a horizontal row: badge | label (flex:1) | time
- Thin border separators between rows
- Bar track remains at the bottom, same proportional segments

### 6.3 Color Usage

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Major badge bg | `--color-brand-primary` (#1A3C5E) | `--color-brand-primary` (#1A3C5E) |
| Major badge text | `--color-text-inverse` (#FAFAFA) | `--color-text-inverse` (#1C1C1E) |
| Minor badge bg | `--color-surface-raised` (#F2F0EC) | `--color-surface-raised` (#1F3247) |
| Minor badge text | `--color-text-secondary` (#4A4A52) | `--color-text-secondary` (#C8CDD6) |
| Bar major segment | `--color-brand-primary` at 80% | `--color-brand-primary` at 90% |
| Bar minor segment | `--color-brand-accent-alt` at 50% | `--color-brand-accent-alt` at 60% |
| Bar track bg | `--color-surface-raised` | `--color-surface-raised` |
| Section border-top | `--color-border` | `--color-border` |

---

## 7. Accessibility

- Step numbers provide sequential ordering information
- `title` attributes on bar segments provide tooltip text for hover
- Color is not the sole differentiator — major steps also have different badge styling and are wider
- All text meets WCAG AA contrast ratios (inherited from existing design tokens)
- Semantic markup uses divs (presentational); no interactive elements requiring ARIA roles

---

## 8. Testing Considerations

- Verify pipeline roadmap appears when download button is clicked
- Verify it hides when navigating away from Step 7 and back
- Verify i18n labels update when switching UI language (en, ru, he)
- Verify RTL layout reversal with Hebrew
- Verify mobile vertical stack at <=480px viewport
- Verify bar segment proportions are visually correct
- Verify dark mode colors
