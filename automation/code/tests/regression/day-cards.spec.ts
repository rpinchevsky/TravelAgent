import { test, expect } from '@playwright/test';
import { TripPage } from '../pages/TripPage';

const DAY_TITLES = [
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
];

const DAY_DATES = [
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
];

test.describe('Day Cards — Content Verification', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  for (let i = 1; i <= 10; i++) {
    test(`Day ${i} should have a banner with title and date`, async () => {
      const bannerTitle = tripPage.getDayBannerTitle(i);
      const bannerDate = tripPage.getDayBannerDate(i);
      await expect(bannerTitle).toBeVisible();
      await expect(bannerDate).toBeVisible();
      await expect(bannerTitle).toContainText(DAY_TITLES[i - 1]);
      await expect(bannerDate).toContainText(DAY_DATES[i - 1]);
    });

    test(`Day ${i} should have an itinerary table with rows`, async () => {
      const table = tripPage.getDayItineraryTable(i);
      await expect(table).toBeAttached();
      const rows = tripPage.getDayItineraryRows(i);
      const count = await rows.count();
      expect(count).toBeGreaterThanOrEqual(4);
    });

    test(`Day ${i} should have at least one POI card`, async () => {
      const pois = tripPage.getDayPoiCards(i);
      const count = await pois.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test(`Day ${i} should have a Plan B section`, async () => {
      const planB = tripPage.page.locator(`#day-${i} .advisory--info`).filter({ hasText: 'Запасной план' });
      await expect(planB).toBeAttached();
    });

    test(`Day ${i} should have a logistics section`, async () => {
      const logistics = tripPage.getDayLogistics(i);
      await expect(logistics).toBeAttached();
    });
  }
});
