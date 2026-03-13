import { test, expect } from '../fixtures/shared-page';

const DAY_TITLES = [
  'День 0',
  'День 1',
  'День 2',
  'День 3',
  'День 4',
  'День 5',
  'День 6',
  'День 7',
  'День 8',
  'День 9',
  'День 10',
  'День 11',
];

const DAY_DATES = [
  '20 августа',
  '21 августа',
  '22 августа',
  '23 августа',
  '24 августа',
  '25 августа',
  '26 августа',
  '27 августа',
  '28 августа',
  '29 августа',
  '30 августа',
  '31 августа',
];

test.describe('Day Cards — Content Verification', () => {
  for (let i = 0; i <= 11; i++) {
    test(`Day ${i} should have complete card structure`, async ({ tripPage, sharedPage }) => {
      // Banner title and date
      const bannerTitle = tripPage.getDayBannerTitle(i);
      const bannerDate = tripPage.getDayBannerDate(i);
      await expect.soft(bannerTitle, `Day ${i}: banner title visible`).toBeVisible();
      await expect.soft(bannerDate, `Day ${i}: banner date visible`).toBeVisible();
      await expect.soft(bannerTitle, `Day ${i}: title text`).toContainText(DAY_TITLES[i]);
      await expect.soft(bannerDate, `Day ${i}: date text`).toContainText(DAY_DATES[i]);

      // Itinerary table with rows
      const table = tripPage.getDayItineraryTable(i);
      await expect.soft(table, `Day ${i}: itinerary table`).toBeAttached();
      const rows = tripPage.getDayItineraryRows(i);
      const rowCount = await rows.count();
      expect.soft(rowCount, `Day ${i}: itinerary row count >= 3`).toBeGreaterThanOrEqual(3);

      // At least one POI card
      const pois = tripPage.getDayPoiCards(i);
      const poiCount = await pois.count();
      expect.soft(poiCount, `Day ${i}: POI card count >= 1`).toBeGreaterThanOrEqual(1);

      // Plan B section
      const planB = sharedPage.locator(`#day-${i} .advisory--info`).filter({ hasText: 'Запасной план' });
      await expect.soft(planB, `Day ${i}: Plan B section`).toBeAttached();

      // Advisory section
      const advisory = sharedPage.locator(`#day-${i} .advisory`);
      const advisoryCount = await advisory.count();
      expect.soft(advisoryCount, `Day ${i}: advisory count >= 1`).toBeGreaterThanOrEqual(1);
    });
  }
});
