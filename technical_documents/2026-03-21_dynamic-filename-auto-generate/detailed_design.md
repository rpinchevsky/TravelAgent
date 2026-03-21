# Detailed Design

**Change:** Dynamic Trip Details Filename and Auto-Generate Trigger
**Date:** 2026-03-21
**Author:** Development Team
**HLD Reference:** high_level_design.md
**Status:** Draft

---

## 1. File Changes

### 1.1 `trip_intake.html` -- JavaScript Changes

#### 1.1.1 New function: `getTripFilename()`

**Current state:** No such function exists. The filename `'llm_trip_details.md'` is hardcoded in the download handler (line 6216).

**Target state:** A new helper function added in the "9. COPY & DOWNLOAD" section (before `handleCopy`), approximately at line 6192:

```javascript
function getTripFilename() {
  // 1. Get first parent name
  const nameEl = document.querySelector('#parentsContainer .traveler-card .parent-name');
  let name = (nameEl?.value || '').trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  if (!name) name = 'traveler';

  // 2. Get arrival date (YYYY-MM-DD)
  const arrivalVal = $('#arrival').value || '';
  const date = arrivalVal ? arrivalVal.substring(0, 10) : 'undated';

  return `${name}_trip_details_${date}.md`;
}
```

**Rationale:** Centralizes filename logic so it is called from three places (tab label, download handler, post-download command) without duplication. The sanitization approach:
- `trim()` removes leading/trailing whitespace.
- `toLowerCase()` ensures consistent casing.
- `replace(/\s+/g, '_')` converts spaces (including multiple consecutive) to single underscores.
- `replace(/[^a-z0-9_]/g, '')` strips all non-safe characters including Unicode, accents, punctuation.
- Empty-after-sanitization fallback to `'traveler'` handles edge cases like Cyrillic-only or emoji-only names.
- `$('#arrival').value` for `datetime-local` inputs always returns ISO format `YYYY-MM-DDTHH:MM`, so `substring(0, 10)` reliably extracts `YYYY-MM-DD`.

#### 1.1.2 Updated download handler

**Current state (line 6211-6218):**
```javascript
$('#btnDownload').addEventListener('click', () => {
  const text = $('#previewContent').textContent;
  const blob = new Blob([text], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'llm_trip_details.md'; a.click();
  URL.revokeObjectURL(url);
});
```

**Target state:**
```javascript
$('#btnDownload').addEventListener('click', () => {
  const filename = getTripFilename();
  const text = $('#previewContent').textContent;
  const blob = new Blob([text], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);

  // Show post-download section with command
  const postSection = $('#postDownload');
  const cmdText = `generate trip from ${filename}`;
  $('#postDownloadCmd').textContent = cmdText;
  postSection.style.display = '';
});
```

**Rationale:** The download handler now calls `getTripFilename()` for the filename and reveals the post-download section with the correct command. Each subsequent download click updates the command (handles re-download after edits as required by REQ-002 AC-6).

#### 1.1.3 Updated step navigation (Step 7 entry)

**Current state (line 5844-5847):**
```javascript
// Generate preview on last step
if (step === totalSteps - 1) {
  $('#previewContent').textContent = generateMarkdown();
}
```

**Target state:**
```javascript
// Generate preview on last step
if (step === totalSteps - 1) {
  $('#previewContent').textContent = generateMarkdown();
  // Update preview tab label with dynamic filename
  document.querySelector('.preview-box__tab').textContent = getTripFilename();
  // Reset post-download section (hidden until download)
  $('#postDownload').style.display = 'none';
}
```

**Rationale:** The tab label refreshes every time Step 7 is entered, ensuring it reflects any name or date changes the user made by navigating back (REQ-003 AC-2). The post-download section is hidden on re-entry because the user has not yet downloaded this version.

#### 1.1.4 New post-download copy button handler

**Target state:** Added after the download handler:
```javascript
$('#btnCopyCmd').addEventListener('click', () => {
  const cmdText = $('#postDownloadCmd').textContent;
  navigator.clipboard.writeText(cmdText).then(() => {
    if (window.showToast) window.showToast('Command copied to clipboard', 'success');
  });
});
```

**Rationale:** Reuses the existing `navigator.clipboard` pattern and `showToast()` system already in use throughout the page. Consistent with how `handleCopy` and the date-save toast work.

### 1.2 `trip_intake.html` -- HTML Changes

#### 1.2.1 Preview tab label (line 2776)

**Current state:**
```html
<div class="preview-box__tab">llm_trip_details.md</div>
```

**Target state:**
```html
<div class="preview-box__tab" id="previewTab">llm_trip_details.md</div>
```

**Rationale:** Adding an `id` is not strictly necessary since JS can query by class, but it is not used here -- the JS update in section 1.1.3 queries by `.preview-box__tab`. The HTML itself does not change; the tab text is updated dynamically via JS. The static HTML retains the fallback text for initial render.

**Decision:** No HTML change to this element. The existing class selector `.preview-box__tab` is unique within the page and sufficient for JS targeting.

#### 1.2.2 New post-download section (after `.btn-bar`, before `</section>`)

**Current state (line 2790-2791):**
```html
        </div>
      </section>
```

**Target state:**
```html
        </div>

        <div class="post-download" id="postDownload" style="display:none;">
          <div class="post-download__header">
            <span class="post-download__icon">&#9989;</span>
            <span class="post-download__title" data-i18n="s7_post_title">Profile saved! Ready to generate your trip.</span>
          </div>
          <p class="post-download__instruction" data-i18n="s7_post_instruction">Paste this command into Claude Code to start generating your personalized trip:</p>
          <div class="post-download__cmd-row">
            <code class="post-download__cmd" id="postDownloadCmd"></code>
            <button type="button" class="btn btn--secondary post-download__copy-btn" id="btnCopyCmd" data-i18n="s7_post_copy">Copy Command</button>
          </div>
          <p class="post-download__hint" data-i18n="s7_post_hint">Make sure the downloaded file is in your project directory and Claude Code is open.</p>
        </div>
      </section>
```

**Rationale:** The section is hidden by default (`style="display:none"`) and revealed by the download handler. It uses `data-i18n` attributes on all static text elements for i18n compatibility. The `<code>` element for the command uses monospace styling consistent with the preview box. The structure is intentionally simple -- no nested cards or complex layouts.

### 1.3 `trip_intake.html` -- CSS Changes

#### 1.3.1 New `.post-download` styles

**Location:** Add after the `.preview-box__body .md-table` rule (after line 702), within the existing `<style>` block.

**Target state:**
```css
/* === Post-Download Section === */
.post-download {
  margin-top: var(--space-4);
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-brand-primary);
  border-radius: var(--radius-container);
  box-shadow: var(--shadow-sm);
}
.post-download__header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}
.post-download__icon {
  font-size: 1.25rem;
}
.post-download__title {
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}
.post-download__instruction {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--space-3);
}
.post-download__cmd-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}
.post-download__cmd {
  flex: 1;
  padding: 10px var(--space-3);
  background: #1a1a2e;
  color: #c8cdd6;
  font-family: 'Courier New', monospace;
  font-size: var(--text-sm);
  border-radius: var(--radius-interactive);
  border: 1px solid rgba(255,255,255,0.1);
  white-space: nowrap;
  overflow-x: auto;
}
.post-download__copy-btn {
  white-space: nowrap;
  flex-shrink: 0;
}
.post-download__hint {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin: 0;
}

/* Dark mode overrides */
@media (prefers-color-scheme: dark) {
  .post-download {
    border-color: var(--color-border);
  }
  .post-download__cmd {
    background: #0d0d1a;
  }
}

/* RTL override */
html[dir="rtl"] .post-download {
  border-left: 1px solid var(--color-border);
  border-right: 4px solid var(--color-brand-primary);
}

/* Mobile responsive */
@media (max-width: 480px) {
  .post-download__cmd-row {
    flex-direction: column;
    align-items: stretch;
  }
  .post-download__copy-btn {
    align-self: flex-end;
  }
}
```

**Design rationale:**
- Surface card with left accent border matches the design system's card pattern (BRD REQ-002 AC-7).
- The command box uses the same dark theme colors (`#1a1a2e` bg, `#c8cdd6` text) as the preview box body, providing visual continuity.
- RTL override flips the accent border from left to right, consistent with existing RTL patterns in the page.
- Mobile breakpoint stacks the command and copy button vertically to prevent horizontal overflow.

### 1.4 `trip_intake.html` -- i18n Changes

New keys to add to the `TRANSLATIONS` object for all 12 languages:

| Key | English Value |
|---|---|
| `s7_post_title` | `Profile saved! Ready to generate your trip.` |
| `s7_post_instruction` | `Paste this command into Claude Code to start generating your personalized trip:` |
| `s7_post_copy` | `Copy Command` |
| `s7_post_hint` | `Make sure the downloaded file is in your project directory and Claude Code is open.` |

These keys are added to `en`, `ru`, `he` with proper translations, and to the remaining 9 languages with English fallback values (consistent with existing i18n pattern where non-core languages fall back to English via the `t()` function).

## 2. Markdown Format Specification

**N/A** -- No changes to the generated markdown structure. The `generateMarkdown()` function output is unchanged. Only the filename under which it is saved differs.

## 3. HTML Rendering Specification

### 3.1 Post-Download Section Layout

```
.post-download (surface card, left accent border, hidden by default)
  .post-download__header (flex row)
    .post-download__icon (checkmark emoji)
    .post-download__title ("Profile saved! Ready to generate your trip.")
  p.post-download__instruction ("Paste this command...")
  .post-download__cmd-row (flex row)
    code.post-download__cmd ("generate trip from {filename}")
    button.post-download__copy-btn ("Copy Command")
  p.post-download__hint ("Make sure the downloaded file...")
```

### 3.2 Visual Specifications

| Property | Value | Matches |
|---|---|---|
| Background | `var(--color-surface)` | Standard surface card |
| Border | `1px solid var(--color-border)` | Standard card border |
| Left accent | `4px solid var(--color-brand-primary)` (#1A3C5E) | Brand primary color |
| Border radius | `var(--radius-container)` (12px) | Standard container radius |
| Shadow | `var(--shadow-sm)` | Light elevation |
| Command box bg | `#1a1a2e` | Matches preview-box body |
| Command box text | `#c8cdd6`, monospace | Matches preview-box body |
| Spacing | `var(--space-4)` padding, `var(--space-2/3)` internal gaps | 8px base scale |
| Copy button | `.btn--secondary` class | Existing button style |
| Touch target | Inherits `.btn` 44px min-height | WCAG compliance |

### 3.3 State Transitions

| Trigger | Action |
|---|---|
| Page load / Step 7 entry | Post-download section hidden (`display: none`) |
| Download button click | Section shown (`display: ''`), command text populated |
| Copy Command click | `navigator.clipboard.writeText()` + `showToast('Command copied to clipboard', 'success')` |
| Re-download (after edits) | Command text updated with new filename; section remains visible |
| Navigate away from Step 7 and back | Section hidden again (reset on Step 7 entry) |

## 4. Rule File Updates

### 4.1 `trip_intake_rules.md`

#### Section: Step 7 -- Review & Download (line ~187-193)

**Current state:**
```markdown
### Step 7 — Review & Download
- **Preview:** Rendered markdown in preview box
- **Actions:**
  - "Copy to Clipboard" — copies raw markdown text
  - "Download llm_trip_details.md" — triggers browser download as `.md` file
- **Edit:** "Back" button returns to Step 6
```

**Target state:**
```markdown
### Step 7 — Review & Download
- **Preview:** Rendered markdown in preview box. The preview tab label shows the dynamic filename (`{name}_trip_details_{date}.md`) and refreshes each time Step 7 is entered.
- **Actions:**
  - "Copy to Clipboard" — copies raw markdown text
  - "Download" — triggers browser download with the dynamic filename `{name}_trip_details_{date}.md` (see Output Format below for filename construction rules)
- **Post-Download:** After download, a "Next Step" section appears with:
  - Success message confirming the profile was saved
  - Pre-filled command: `generate trip from {filename}` (using the exact downloaded filename)
  - "Copy Command" button (copies to clipboard, shows toast)
  - Instructional text directing the user to paste into Claude Code
  - The section updates if the user downloads again after making edits
  - The section resets (hides) when navigating away from Step 7 and back
- **Edit:** "Back" button returns to Step 6
```

#### Section: Output Format heading (line ~346)

**Current state:**
```markdown
## Output Format (llm_trip_details.md)

The generated markdown must match the structure of `trip_details.md` so it can be consumed by the trip generation pipeline. The exact structure:
```

**Target state:**
```markdown
## Output Format

The generated markdown is downloaded with a dynamic filename following the pattern `{name}_trip_details_{date}.md`:

- **`{name}`**: First parent's name from Step 1, lowercased, spaces replaced with underscores, non-`[a-z0-9_]` characters stripped. Falls back to `traveler` if empty after sanitization.
- **`{date}`**: Arrival date from Step 0 in `YYYY-MM-DD` format. Falls back to `undated` if not set.
- **Examples:** `robert_trip_details_2026-07-15.md`, `anna_maria_trip_details_2026-08-01.md`, `traveler_trip_details_undated.md`

The generated markdown must match the structure of `trip_details.md` so it can be consumed by the trip generation pipeline. The exact structure:
```

#### Section: Purpose paragraph (line ~8)

**Current state:**
```markdown
**Output:** `llm_trip_details.md` by default (downloaded by user or copied to clipboard). The user may rename the downloaded file (e.g., `Maryan.md`). Any file following the trip details markdown structure is a valid input to the Trip Generation Pipeline.
```

**Target state:**
```markdown
**Output:** Downloaded with a dynamic filename `{name}_trip_details_{date}.md` (see Output Format for construction rules). The user may rename the downloaded file. Any file following the trip details markdown structure is a valid input to the Trip Generation Pipeline.
```

### 4.2 `trip_intake_design.md`

#### Section: Preview Box (after line ~317, "Max-height 500px with scroll")

**Current state:**
```markdown
### Preview Box (Code Editor Style)
- Dark theme container (`#1a1a2e` bg)
- Tab-style header with `#252545` bg, active tab with accent underline
- Copy button in header (ghost style, success state on copy)
- Monospace body, syntax-colored: headings blue, bold gold, bullets green, tables purple
- Max-height 500px with scroll
```

**Target state:**
```markdown
### Preview Box (Code Editor Style)
- Dark theme container (`#1a1a2e` bg)
- Tab-style header with `#252545` bg, active tab with accent underline
- **Tab label:** Dynamic filename (`{name}_trip_details_{date}.md`) — refreshes on each Step 7 entry
- Copy button in header (ghost style, success state on copy)
- Monospace body, syntax-colored: headings blue, bold gold, bullets green, tables purple
- Max-height 500px with scroll
```

#### New section: Post-Download Section (add after the Preview Box section)

**Target state:**
```markdown
### Post-Download Section (`.post-download`)
A contextual "next step" card that appears below the button bar after the user downloads the trip profile. Bridges the gap between intake and trip generation.

**Layout:**
- Surface card with `border-left: 4px solid var(--color-brand-primary)` accent
- Border, radius-container, shadow-sm — consistent with standard surface cards
- Hidden by default (`display: none`), revealed on download button click
- Resets (hides) when navigating away from Step 7 and returning

**Structure:**
```
.post-download
  .post-download__header (flex row: icon + title)
  p.post-download__instruction (muted text)
  .post-download__cmd-row (flex row: code + copy button)
    code.post-download__cmd (dark theme, monospace — matches preview box)
    button.post-download__copy-btn (.btn--secondary)
  p.post-download__hint (xs muted text)
```

**Command box:**
- Same dark theme as preview body (`#1a1a2e` bg, `#c8cdd6` text, monospace)
- Contains: `generate trip from {dynamic_filename}`
- Read-only display (`<code>` element, not `<input>`)

**Copy behavior:**
- Copies command text to clipboard via `navigator.clipboard.writeText()`
- Shows toast: "Command copied to clipboard" (success type)
- Uses existing `showToast()` system

**RTL:** Left accent border flips to right border
**Mobile (≤480px):** Command row stacks vertically (command above, button below aligned right)
**i18n:** All static text uses `data-i18n` attributes (keys: `s7_post_title`, `s7_post_instruction`, `s7_post_copy`, `s7_post_hint`)
```

## 5. Implementation Checklist

| # | Task | File | Lines (approx.) | Dependencies |
|---|---|---|---|---|
| 1 | Add `getTripFilename()` function | `trip_intake.html` | ~6192 (before `handleCopy`) | None |
| 2 | Update download handler to use `getTripFilename()` and show post-download section | `trip_intake.html` | ~6211-6218 | Task 1 |
| 3 | Add post-download copy button handler | `trip_intake.html` | After download handler (~6220) | Task 1 |
| 4 | Update Step 7 entry logic to set tab label and reset post-download | `trip_intake.html` | ~5845-5847 | Task 1 |
| 5 | Add post-download HTML section | `trip_intake.html` | ~2790 (after `.btn-bar` closing div) | None |
| 6 | Add `.post-download` CSS rules | `trip_intake.html` | After line ~702 | None |
| 7 | Add i18n keys to `TRANSLATIONS` (en, ru, he + 9 fallbacks) | `trip_intake.html` | In TRANSLATIONS object | None |
| 8 | Update Step 7 description in rule file | `trip_intake_rules.md` | ~187-193 | None |
| 9 | Update Output Format heading and filename docs in rule file | `trip_intake_rules.md` | ~8, ~346 | None |
| 10 | Update Preview Box spec and add Post-Download section spec | `trip_intake_design.md` | ~312-317 | None |

**Implementation order:** Tasks 5, 6, 7 (HTML/CSS/i18n) can be done in parallel with tasks 1-4 (JS). Tasks 8-10 (rule files) are independent. Tasks 2, 3, 4 depend on task 1.

## 6. BRD Traceability

| BRD Requirement | Acceptance Criterion | DD Section | Implemented By |
|---|---|---|---|
| REQ-001 | AC-1: Dynamic filename on download | 1.1.2 | `getTripFilename()` called in download handler |
| REQ-001 | AC-2: Preview tab shows dynamic filename | 1.1.3 | Tab label updated on Step 7 entry |
| REQ-001 | AC-3: Lowercase name with underscores | 1.1.1 | `toLowerCase()` + `replace(/\s+/g, '_')` |
| REQ-001 | AC-4: YYYY-MM-DD date format | 1.1.1 | `substring(0, 10)` on datetime-local value |
| REQ-001 | AC-5: Empty name fallback to "traveler" | 1.1.1 | `if (!name) name = 'traveler'` |
| REQ-001 | AC-6: Missing date fallback to "undated" | 1.1.1 | Ternary: `arrivalVal ? substring : 'undated'` |
| REQ-001 | AC-7: Special chars stripped | 1.1.1 | `replace(/[^a-z0-9_]/g, '')` |
| REQ-002 | AC-1: Post-download section visible after download | 1.1.2, 1.2.2 | `postSection.style.display = ''` in handler |
| REQ-002 | AC-2: Command format | 1.1.2 | Template literal: `` `generate trip from ${filename}` `` |
| REQ-002 | AC-3: Command contains exact filename | 1.1.2 | Same `getTripFilename()` call used for download and command |
| REQ-002 | AC-4: Copy button copies to clipboard | 1.1.4 | `navigator.clipboard.writeText(cmdText)` |
| REQ-002 | AC-5: Toast on copy | 1.1.4 | `showToast('Command copied to clipboard', 'success')` |
| REQ-002 | AC-6: Section updates on re-download | 1.1.2 | Download handler always recalculates filename and updates command |
| REQ-002 | AC-7: Consistent styling | 1.3.1 | Design system tokens used throughout |
| REQ-002 | AC-8: Instructional text | 1.2.2 | `post-download__instruction` and `post-download__hint` elements |
| REQ-003 | AC-1: Tab shows dynamic filename | 1.1.3 | `document.querySelector('.preview-box__tab').textContent = getTripFilename()` |
| REQ-003 | AC-2: Tab refreshes on Step 7 entry | 1.1.3 | Update placed inside `if (step === totalSteps - 1)` block |
| REQ-003 | AC-3: Tab matches download filename | 1.1.1, 1.1.2, 1.1.3 | All three call the same `getTripFilename()` function |
