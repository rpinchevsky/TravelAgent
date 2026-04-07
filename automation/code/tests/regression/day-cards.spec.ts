import { test, expect } from '../fixtures/shared-page';
import { loadTripConfig } from '../utils/trip-config';

const tripConfig = loadTripConfig();

test.describe('Day Cards — Content Verification (sampled)', () => {
  // Sample first, second, and last day — covers arrival, active, departure patterns.
  // Systemic issues (missing banner, broken table) appear on any day.
  const sampleDays = [...new Set([0, 1, tripConfig.dayCount - 1])];

  for (const i of sampleDays) {
    test(`Day ${i} should have complete card structure`, async ({ tripPage, sharedPage }) => {
      // Banner title and date
      const bannerTitle = tripPage.getDayBannerTitle(i);
      const bannerDate = tripPage.getDayBannerDate(i);
      await expect.soft(bannerTitle, `Day ${i}: banner title visible`).toBeVisible();
      await expect.soft(bannerDate, `Day ${i}: banner date visible`).toBeVisible();
      await expect.soft(bannerTitle, `Day ${i}: title text`).toContainText(tripConfig.dayTitles[i]);
      await expect.soft(bannerDate, `Day ${i}: date text`).toContainText(tripConfig.dayDates[i]);

      // Itinerary table with rows
      const table = tripPage.getDayItineraryTable(i);
      await expect.soft(table, `Day ${i}: itinerary table`).toBeAttached();
      const rows = tripPage.getDayItineraryRows(i);
      const rowCount = await rows.count();
      expect.soft(rowCount, `Day ${i}: itinerary row count >= 2`).toBeGreaterThanOrEqual(2);

      // At least one POI card
      const pois = tripPage.getDayPoiCards(i);
      const poiCount = await pois.count();
      expect.soft(poiCount, `Day ${i}: POI card count >= 1`).toBeGreaterThanOrEqual(1);

      // Plan B section — arrival (day 0) and departure (last day) are non-activity days with no Plan B
      const isArrivalOrDeparture = i === 0 || i === tripConfig.dayCount - 1;
      if (!isArrivalOrDeparture) {
        const planB = sharedPage.locator(`#day-${i} .advisory--info[data-section-type="plan-b"]`);
        expect.soft(await planB.count(), `Day ${i}: Plan B section count >= 1`).toBeGreaterThanOrEqual(1);
      }

      // Advisory section — arrival/departure days may have no advisory blocks
      if (!isArrivalOrDeparture) {
        const advisory = sharedPage.locator(`#day-${i} .advisory`);
        const advisoryCount = await advisory.count();
        expect.soft(advisoryCount, `Day ${i}: advisory count >= 1`).toBeGreaterThanOrEqual(1);
      }
    });
  }
});
