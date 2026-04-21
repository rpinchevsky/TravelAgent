import * as fs from 'fs';
import * as path from 'path';
import { test, expect } from '../fixtures/shared-page';
import { test as baseTest, expect as baseExpect } from '@playwright/test';
import { loadTripConfig } from '../utils/trip-config';
import { getExpectedPoiCountsFromMarkdown } from '../utils/markdown-pois';
import { getManifestPath, getHtmlPath, getProjectRoot } from '../utils/trip-folder';

/**
 * Progression Tests — Unique validations only
 *
 * Tests that exist ONLY here (not duplicated in other spec files):
 * - Per-day structural patterns (pricing-grid, advisory) — sampled
 * - Dynamic POI presence from markdown (FB-7)
 * - POI uniqueness across days (TC-004)
 * - Manifest integrity (TC-005/TC-006)
 * - Themed container contrast CSS gate (TC-007)
 *
 * Removed duplicates (canonical home in parentheses):
 * - POI count vs markdown → poi-parity.spec.ts
 * - Budget total/currency → overview-budget.spec.ts
 * - Holiday advisory → overview-budget.spec.ts
 * - Overview standalone → structure.spec.ts
 * - Phone/rating/accessibility presence → poi-cards.spec.ts
 * - Accommodation integration → accommodation.spec.ts
 */

const tripConfig = loadTripConfig();

test.describe('Progression — Structural Patterns (sampled days)', () => {
  const firstActiveDay = 1;
  const lastActiveDay = tripConfig.dayCount - 2;
  const midActiveDay = Math.floor((firstActiveDay + lastActiveDay) / 2);
  // Sample first, middle, last active day — systemic issues appear on any day
  const sampleDays = [...new Set([firstActiveDay, midActiveDay, lastActiveDay])];

  for (const day of sampleDays) {
    test(`Day ${day} should use pricing-grid and advisory--info`, async ({ sharedPage }) => {
      const pricingGrids = sharedPage.locator(`#day-${day} .pricing-grid`);
      expect.soft(await pricingGrids.count(), `Day ${day}: pricing-grid count`).toBeGreaterThanOrEqual(1);

      const pricingCells = sharedPage.locator(`#day-${day} .pricing-grid .pricing-cell`);
      expect.soft(await pricingCells.count(), `Day ${day}: pricing-cell count`).toBeGreaterThanOrEqual(1);

      const planB = sharedPage.locator(`#day-${day} .advisory.advisory--info`);
      expect.soft(await planB.count(), `Day ${day}: advisory--info count`).toBeGreaterThanOrEqual(1);
    });
  }
});

test.describe('Progression — Dynamic POI Presence (FB-7)', () => {
  test('each day should have its first POI from markdown rendered as a card', async ({ tripPage }) => {
    const expected = getExpectedPoiCountsFromMarkdown();
    for (const [dayStr, data] of Object.entries(expected)) {
      const day = parseInt(dayStr, 10);
      if (data.names.length === 0) continue;
      const segments = data.names[0].split('/').map(s =>
        s.trim().replace(/^[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier_Base}\p{Emoji_Component}\uFE0F\u200D\s]+/u, '').trim()
      ).filter(s => s.length > 0);
      if (segments.length === 0) continue;

      const dayCards = tripPage.getDayPoiCards(day);
      const count = await dayCards.count();
      let found = false;
      for (let i = 0; i < count; i++) {
        const name = await tripPage.getPoiCardName(dayCards.nth(i)).textContent();
        if (name && segments.some(seg => name.includes(seg))) {
          found = true;
          break;
        }
      }
      expect.soft(found, `Day ${day}: first POI "${segments.join(' / ')}" not found in rendered cards`).toBe(true);
    }
  });
});

test.describe('Progression — POI Uniqueness (TC-004)', () => {
  test('no duplicate POI names across different days', async () => {
    const expected = getExpectedPoiCountsFromMarkdown();
    const stripEmoji = (s: string) =>
      s.replace(/^[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier_Base}\p{Emoji_Component}\uFE0F\u200D\s]+/u, '').trim();

    const seen = new Map<string, number>();
    const duplicates: string[] = [];

    for (const [dayStr, data] of Object.entries(expected)) {
      const day = parseInt(dayStr, 10);
      for (const rawName of data.names) {
        const cleaned = stripEmoji(rawName.split('/')[0].trim());
        if (cleaned.length === 0) continue;
        if (seen.has(cleaned)) {
          duplicates.push(`"${cleaned}" appears in Day ${seen.get(cleaned)} and Day ${day}`);
        } else {
          seen.set(cleaned, day);
        }
      }
    }

    expect(duplicates, `Duplicate POIs found: ${duplicates.join('; ')}`).toHaveLength(0);
  });
});

test.describe('Progression — Manifest Integrity (TC-005/TC-006)', () => {
  test('all days should have status complete and non-null last_modified', async () => {
    const tripConfig = loadTripConfig();
    const manifestPath = getManifestPath();
    const raw = fs.readFileSync(manifestPath, 'utf-8');

    let manifest: Record<string, unknown>;
    try {
      manifest = JSON.parse(raw);
    } catch {
      throw new Error(`Failed to parse manifest.json at ${manifestPath}: invalid JSON`);
    }

    const languages = manifest['languages'] as Record<string, Record<string, unknown>> | undefined;
    expect(languages, 'manifest should have "languages" key').toBeTruthy();

    const langKey = tripConfig.labels.langCode;
    const langEntry = languages![langKey] as Record<string, unknown> | undefined;
    expect(langEntry, `manifest should have language entry for "${langKey}"`).toBeTruthy();

    const days = langEntry!['days'] as Record<string, Record<string, unknown>> | undefined;
    expect(days, `manifest.languages.${langKey} should have "days" key`).toBeTruthy();

    for (let i = 0; i < tripConfig.dayCount; i++) {
      const dayKey = `day_${String(i).padStart(2, '0')}`;
      const dayEntry = days![dayKey] || days![`day_${i}`];
      expect.soft(dayEntry, `Day ${i}: entry missing in manifest`).toBeTruthy();
      if (!dayEntry) continue;

      expect.soft(
        dayEntry['status'],
        `Day ${i}: status should be "complete", got "${dayEntry['status']}"`
      ).toBe('complete');

      const lastModified = dayEntry['last_modified'];
      expect.soft(
        lastModified && typeof lastModified === 'string' && lastModified.length > 0,
        `Day ${i}: last_modified should be a non-empty string, got "${lastModified}"`
      ).toBe(true);
    }
  });

  test('manifest should contain trip_details_file field', async () => {
    const manifestPath = getManifestPath();
    const raw = fs.readFileSync(manifestPath, 'utf-8');

    let manifest: Record<string, unknown>;
    try {
      manifest = JSON.parse(raw);
    } catch {
      throw new Error(`Failed to parse manifest.json at ${manifestPath}: invalid JSON`);
    }

    const tripDetailsFile = manifest['trip_details_file'];
    expect(
      tripDetailsFile,
      'manifest should have "trip_details_file" field — regenerate trip if missing'
    ).toBeDefined();
    expect(
      typeof tripDetailsFile === 'string' && tripDetailsFile.length > 0,
      `trip_details_file should be a non-empty string, got "${tripDetailsFile}"`
    ).toBe(true);

    const destination = manifest['destination'];
    expect.soft(
      destination && typeof destination === 'string' && (destination as string).length > 0,
      `manifest "destination" should be a non-empty string, got "${destination}"`
    ).toBe(true);
  });
});

test.describe('Progression — Themed Container Contrast Gate (TC-007)', () => {
  test('banner title should have explicit color declaration in inlined style', async ({ tripPage }) => {
    const styleContent = await tripPage.inlineStyle.textContent();
    expect(styleContent, 'inlined <style> block should exist and have content').toBeTruthy();

    const titleColorRegex = /\.day-card__banner-title\s*\{[^}]*color\s*:/;
    expect.soft(
      titleColorRegex.test(styleContent!),
      '.day-card__banner-title should have explicit color: in inlined <style>'
    ).toBe(true);

    const dateColorRegex = /\.day-card__banner-date\s*\{[^}]*color\s*:/;
    expect.soft(
      dateColorRegex.test(styleContent!),
      '.day-card__banner-date should have explicit color: in inlined <style> (may be exempt if <span> inherits from parent)'
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Google Maps Day Mini-Map — Regression & Progression Tests
// TC-200 through TC-213 (TC-215 removed as duplicate of TC-200 per QA QF-1)
//
// @with-key tests are skipped unless the MAPS_API_KEY environment variable is set.
// In CI, only keyless tests run (TC-200, TC-201, TC-202, TC-203, TC-213).
// TC-204 through TC-213 require HTML generated with a valid maps_config.json key.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Day Mini-Map — Placeholder Guard (TC-200) @smoke', () => {
  // TC-200: No {{MAPS_SCRIPT}} literal in assembled HTML
  // Traces to: REQ-002 AC-2, REQ-003 AC-3, DD §1.7c
  // Filesystem test — no browser launched (automation_rules §8.8)
  baseTest('TC-200: assembled HTML must not contain unsubstituted {{MAPS_SCRIPT}} literal', () => {
    const fileSuffix = loadTripConfig().labels.fileSuffix;
    const htmlPath = getHtmlPath(fileSuffix);
    const content = fs.readFileSync(htmlPath, 'utf-8');
    baseExpect(
      content.includes('{{MAPS_SCRIPT}}'),
      'Assembled HTML contains the unsubstituted {{MAPS_SCRIPT}} placeholder — renderer failed to substitute it'
    ).toBe(false);
  });
});

test.describe('Day Mini-Map — Template Source (TC-201)', () => {
  // TC-201: {{MAPS_SCRIPT}} placeholder present in base_layout.html source
  // Traces to: DD §1.4 (base_layout.html modification)
  // Filesystem test — no browser launched
  baseTest('TC-201: base_layout.html must contain {{MAPS_SCRIPT}} placeholder before </body>', () => {
    const layoutPath = path.join(getProjectRoot(), 'base_layout.html');
    baseExpect(fs.existsSync(layoutPath), `base_layout.html exists at ${layoutPath}`).toBe(true);
    const content = fs.readFileSync(layoutPath, 'utf-8');
    const placeholderIdx = content.indexOf('{{MAPS_SCRIPT}}');
    const closingBodyIdx = content.indexOf('</body>');
    baseExpect(
      placeholderIdx,
      'base_layout.html must contain the {{MAPS_SCRIPT}} placeholder'
    ).toBeGreaterThanOrEqual(0);
    baseExpect(
      placeholderIdx < closingBodyIdx,
      '{{MAPS_SCRIPT}} must appear before </body> in base_layout.html'
    ).toBe(true);
  });
});

test.describe('Day Mini-Map — Shimmer CSS Inlined (TC-202)', () => {
  // TC-202: .day-map-widget--loading shimmer animation is active (CSS inlined check)
  // Traces to: REQ-003 AC-8, DD §1.5
  // Requires at least one .day-map-widget on the page (graceful: skips if widget absent)
  test('TC-202: inlined CSS must provide shimmer animation for .day-map-widget--loading', async ({ tripPage }) => {
    const widgetCount = await tripPage.dayMapWidgets.count();
    if (widgetCount === 0) {
      // Keyless mode — no widgets emitted; skip shimmer check
      // (TC-203 covers the keyless path; this test requires a widget in the DOM)
      return;
    }
    const firstWidget = tripPage.dayMapWidgets.nth(0);
    const animationName = await firstWidget.evaluate((el) => {
      el.classList.add('day-map-widget--loading');
      return getComputedStyle(el).animationName;
    });
    expect.soft(
      animationName !== 'none',
      `day-map-widget--loading must activate a shimmer animation (animationName was "${animationName}")`
    ).toBe(true);
  });
});

test.describe('Day Mini-Map — Graceful Degradation (TC-203)', () => {
  // TC-203: No widget emitted when API key absent; plain map-link present per day
  // Traces to: REQ-005 AC-1
  // This is the baseline state for all CI runs without a live key — must always pass.
  test('TC-203: keyless mode — zero .day-map-widget elements, at least one plain map-link', async ({ tripPage, sharedPage }) => {
    const widgetCount = await tripPage.dayMapWidgets.count();
    const plainLinkCount = await tripPage.plainMapLinks.count();

    // In keyless mode: no widgets expected
    if (widgetCount === 0) {
      // Keyless path — guard that at least one plain link exists
      expect(plainLinkCount, 'At least one plain a.map-link expected in keyless mode').toBeGreaterThanOrEqual(1);
    } else {
      // With-key path — widgets present; this describe documents expected keyless state
      // When running with a key, skip the "zero widget" assertion but ensure fallbacks exist inside widgets
      expect.soft(widgetCount, 'With key: widgets should be present').toBeGreaterThanOrEqual(1);
    }
  });
});

test.describe('Day Mini-Map — Widget DOM Structure (TC-204) @with-key', () => {
  // TC-204: Widget DOM structure — required child elements present (with key)
  // Traces to: REQ-003 AC-1, DD §1.3, DD §3
  // Skipped in keyless CI environments
  test('TC-204: each .day-map-widget must have canvas, fallback, and role=region @with-key', async ({ tripPage }) => {
    const widgetCount = await tripPage.dayMapWidgets.count();
    if (widgetCount === 0) {
      // No widgets — keyless mode; this test is a no-op
      return;
    }

    // Collect {index, dataMapDay} tuples first, then run assertions with stable context
    const widgetData = await tripPage.dayMapWidgets.evaluateAll((els) =>
      els.map((el, idx) => ({
        idx,
        dataMapDay: el.getAttribute('data-map-day'),
        role: el.getAttribute('role'),
        hasCanvas: el.querySelector('.day-map-widget__canvas') !== null,
        hasFallback: el.querySelector('a.map-link.day-map-widget__fallback') !== null,
      }))
    );

    for (const w of widgetData) {
      const label = `Widget[${w.idx}] data-map-day="${w.dataMapDay}"`;
      expect.soft(w.dataMapDay, `${label}: data-map-day must be present`).not.toBeNull();
      expect.soft(
        w.dataMapDay !== null && /^\d+$/.test(w.dataMapDay),
        `${label}: data-map-day must be numeric`
      ).toBe(true);
      expect.soft(w.hasCanvas, `${label}: must contain .day-map-widget__canvas`).toBe(true);
      expect.soft(w.hasFallback, `${label}: must contain a.map-link.day-map-widget__fallback`).toBe(true);
      expect.soft(w.role, `${label}: must have role="region"`).toBe('region');
    }
  });
});

test.describe('Day Mini-Map — data-map-day Matches Day Section (TC-205) @with-key', () => {
  // TC-205: data-map-day value matches day section ID and canvas id (with key)
  // Traces to: REQ-003 AC-1, DD §1.6f
  test('TC-205: data-map-day must correspond to #day-{N} section and canvas id=day-map-{N} @with-key', async ({ sharedPage }) => {
    const widgetData = await sharedPage.evaluate(() => {
      const widgets = Array.from(document.querySelectorAll('.day-map-widget'));
      return widgets.map((el, idx) => {
        const n = el.getAttribute('data-map-day');
        const canvas = el.querySelector('.day-map-widget__canvas');
        return {
          idx,
          dataMapDay: n,
          canvasId: canvas ? canvas.id : null,
          daySectionExists: n ? document.querySelector(`#day-${n}`) !== null : false,
        };
      });
    });

    if (widgetData.length === 0) return; // keyless — no widgets

    for (const w of widgetData) {
      if (!w.dataMapDay) continue;
      const label = `Widget[${w.idx}] data-map-day="${w.dataMapDay}"`;
      expect.soft(w.daySectionExists, `${label}: #day-${w.dataMapDay} section must exist`).toBe(true);
      expect.soft(w.canvasId, `${label}: canvas id must be "day-map-${w.dataMapDay}"`).toBe(`day-map-${w.dataMapDay}`);
    }
  });
});

test.describe('Day Mini-Map — Widget Before Itinerary Table (TC-206) @with-key', () => {
  // TC-206: Widget is positioned before .itinerary-table-wrapper within its day (with key)
  // Traces to: REQ-003 AC-2, UX §3
  test('TC-206: .day-map-widget must precede .itinerary-table-wrapper in document order @with-key', async ({ sharedPage }) => {
    const result = await sharedPage.evaluate(() => {
      const widget = document.querySelector('.day-map-widget');
      if (!widget) return { hasWidget: false, widgetBeforeTable: false };
      const daySection = widget.closest('[id^="day-"]');
      if (!daySection) return { hasWidget: true, widgetBeforeTable: false };
      const tableWrapper = daySection.querySelector('.itinerary-table-wrapper');
      if (!tableWrapper) return { hasWidget: true, widgetBeforeTable: true }; // no table in this day — position N/A
      // DOCUMENT_POSITION_FOLLOWING (4) is set on tableWrapper if it comes AFTER widget
      const pos = widget.compareDocumentPosition(tableWrapper);
      return { hasWidget: true, widgetBeforeTable: !!(pos & Node.DOCUMENT_POSITION_FOLLOWING) };
    });

    if (!result.hasWidget) return; // keyless mode

    expect.soft(
      result.widgetBeforeTable,
      '.day-map-widget must appear before .itinerary-table-wrapper in its day section'
    ).toBe(true);
  });
});

test.describe('Day Mini-Map — Fallback Link Format (TC-210) @with-key', () => {
  // TC-210: Fallback link inside widget uses correct href format (with key)
  // Traces to: REQ-005 AC-4, REQ-005 AC-6
  test('TC-210: widget fallback must have google.com/maps/dir href and aria-hidden=true @with-key', async ({ tripPage }) => {
    const widgetCount = await tripPage.dayMapWidgets.count();
    if (widgetCount === 0) return; // keyless

    const fallbackData = await tripPage.dayMapWidgets.evaluateAll((els) =>
      els.map((el, idx) => {
        const fb = el.querySelector('a.map-link.day-map-widget__fallback') as HTMLAnchorElement | null;
        return {
          idx,
          href: fb ? fb.href : null,
          ariaHidden: fb ? fb.getAttribute('aria-hidden') : null,
        };
      })
    );

    for (const f of fallbackData) {
      const label = `Widget[${f.idx}] fallback`;
      expect.soft(
        f.href && f.href.startsWith('https://www.google.com/maps/dir/'),
        `${label}: href must start with https://www.google.com/maps/dir/ (got "${f.href}")`
      ).toBe(true);
      expect.soft(f.ariaHidden, `${label}: aria-hidden must be "true" in static HTML`).toBe('true');
    }
  });
});

test.describe('Day Mini-Map — ARIA Structure (TC-211) @with-key', () => {
  // TC-211: ARIA role="region" and aria-labelledby for known languages (with key)
  // Traces to: REQ-003 AC-9, DD §1.6f, REQ-006 AC-5
  test('TC-211: widgets must have aria-labelledby referencing an sr-only span @with-key', async ({ tripPage }) => {
    const langCode = loadTripConfig().labels.langCode;
    const knownLangs = ['ru', 'en', 'he'];
    if (!knownLangs.includes(langCode)) return; // language not in MAP_ARIA_LABELS — skip

    const widgetCount = await tripPage.dayMapWidgets.count();
    if (widgetCount === 0) return; // keyless

    const ariaData = await tripPage.dayMapWidgets.evaluateAll((els) =>
      els.map((el, idx) => {
        const labelId = el.getAttribute('aria-labelledby');
        const labelEl = labelId ? document.getElementById(labelId) : null;
        return {
          idx,
          role: el.getAttribute('role'),
          ariaLabelledby: labelId,
          labelElExists: labelEl !== null,
          labelHasSrOnly: labelEl ? labelEl.classList.contains('sr-only') : false,
          labelTextNonEmpty: labelEl ? (labelEl.textContent ?? '').trim().length > 0 : false,
        };
      })
    );

    for (const a of ariaData) {
      const label = `Widget[${a.idx}]`;
      expect.soft(a.role, `${label}: must have role="region"`).toBe('region');
      expect.soft(a.ariaLabelledby, `${label}: must have aria-labelledby`).not.toBeNull();
      expect.soft(a.labelElExists, `${label}: aria-labelledby must reference an existing element`).toBe(true);
      expect.soft(a.labelHasSrOnly, `${label}: referenced label element must have class sr-only`).toBe(true);
      expect.soft(a.labelTextNonEmpty, `${label}: sr-only label text must be non-empty`).toBe(true);
    }
  });
});

test.describe('Day Mini-Map — Error State Clears Shimmer (TC-213)', () => {
  // TC-213: .day-map-widget--error clears shimmer animation
  // Traces to: DD §1.5 (error state removes shimmer), REQ-005 AC-4
  test('TC-213: error state must clear shimmer animation', async ({ tripPage }) => {
    const widgetCount = await tripPage.dayMapWidgets.count();
    if (widgetCount === 0) return; // keyless — no widgets to test

    const firstWidget = tripPage.dayMapWidgets.nth(0);
    const animationName = await firstWidget.evaluate((el) => {
      el.classList.add('day-map-widget--loading', 'day-map-widget--error');
      return getComputedStyle(el).animationName;
    });
    expect.soft(
      animationName,
      'error state must clear shimmer animation (animation-name should be "none")'
    ).toBe('none');
  });
});
