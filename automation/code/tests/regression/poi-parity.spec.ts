import { test, expect } from '@playwright/test';
import { TripPage } from '../pages/TripPage';
import * as fs from 'fs';
import * as path from 'path';

/**
 * POI Parity Test
 *
 * Validates that the number of rendered POI cards per day in the HTML
 * matches the number of ### POI sections per day in the source markdown.
 *
 * Sections excluded from count (not POIs):
 *   - Логистика (Logistics)
 *   - Стоимость (Cost)
 *   - Запасной план (Plan B)
 */

const EXCLUDED_SECTIONS = ['Логистика', 'Стоимость', 'Запасной план'];

function getExpectedPoiCountsFromMarkdown(): Record<number, { count: number; names: string[] }> {
  const mdDir = path.resolve(__dirname, '..', '..', '..', '..', 'generated_trips', 'md');
  const mdFiles = fs.readdirSync(mdDir)
    .filter(f => /^trip_\d{4}-\d{2}-\d{2}_\d{4}\.md$/.test(f))
    .sort()
    .reverse();

  if (mdFiles.length === 0) {
    throw new Error(`No trip markdown files found in ${mdDir}`);
  }

  const latestMd = fs.readFileSync(path.join(mdDir, mdFiles[0]), 'utf-8');
  const lines = latestMd.split('\n');

  const result: Record<number, { count: number; names: string[] }> = {};
  let currentDay: number | null = null;
  let skipNextHeading = false;

  for (const line of lines) {
    // Support both formats: <a id="day-X"> anchors and ## День X headings
    const anchorMatch = line.match(/<a\s+id="day-(\d+)"/);
    const headingMatch = line.match(/^#{1,2}\s+День\s+(\d+)/);
    if (anchorMatch || headingMatch) {
      currentDay = parseInt((anchorMatch || headingMatch)![1], 10);
      if (!result[currentDay]) {
        result[currentDay] = { count: 0, names: [] };
      }
      // When using ## День format, the first ### is the area title (banner), not a POI
      skipNextHeading = !!headingMatch;
      continue;
    }

    if (currentDay !== null && line.startsWith('### ')) {
      if (skipNextHeading) {
        skipNextHeading = false;
        continue;
      }
      const isExcluded = EXCLUDED_SECTIONS.some(s => line.includes(s));
      if (!isExcluded) {
        result[currentDay].count++;
        result[currentDay].names.push(line.replace('### ', '').trim());
      }
    }
  }

  return result;
}

test.describe('POI Parity — Markdown vs HTML Card Count', () => {
  let tripPage: TripPage;
  let expectedPois: Record<number, { count: number; names: string[] }>;

  test.beforeAll(() => {
    expectedPois = getExpectedPoiCountsFromMarkdown();
  });

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('should have parsed at least one day from markdown source', () => {
    const days = Object.keys(expectedPois);
    expect(days.length).toBeGreaterThan(0);
  });

  for (let day = 0; day <= 11; day++) {
    test(`Day ${day}: HTML POI card count should match markdown POI section count`, async () => {
      const expected = expectedPois[day];
      expect(expected, `Day ${day} not found in markdown source`).toBeDefined();

      const poiCards = tripPage.getDayPoiCards(day);
      const actualCount = await poiCards.count();

      expect(
        actualCount,
        `Day ${day}: expected ${expected.count} POI cards (from markdown: ${expected.names.join(', ')}), but found ${actualCount} in HTML`
      ).toBe(expected.count);
    });
  }

  test('total POI cards in HTML should match total POI sections in markdown', async () => {
    let expectedTotal = 0;
    for (const day of Object.values(expectedPois)) {
      expectedTotal += day.count;
    }

    const actualTotal = await tripPage.poiCards.count();

    expect(
      actualTotal,
      `Total POI mismatch: markdown has ${expectedTotal} POI sections, HTML has ${actualTotal} poi-cards`
    ).toBe(expectedTotal);
  });
});
