import { test, expect } from '@playwright/test';
import { TripPage } from '../pages/TripPage';

test.describe('POI Cards — Content & Links', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('should have POI cards across all days', async () => {
    const totalPois = await tripPage.poiCards.count();
    // 12 days × at least 2 POIs = at least 35
    expect(totalPois).toBeGreaterThanOrEqual(35);
  });

  test('every POI card should have a name', async () => {
    const count = await tripPage.poiCards.count();
    for (let i = 0; i < count; i++) {
      const name = tripPage.getPoiCardName(tripPage.poiCards.nth(i));
      await expect(name).toBeAttached();
      const text = await name.textContent();
      expect(text!.trim().length).toBeGreaterThan(0);
    }
  });

  test('most POI cards should have a pro-tip', async () => {
    const count = await tripPage.poiCards.count();
    let proTipCount = 0;
    for (let i = 0; i < count; i++) {
      const proTip = tripPage.getPoiCardProTip(tripPage.poiCards.nth(i));
      if (await proTip.count() > 0) proTipCount++;
    }
    // At least 75% of POI cards should have pro-tips
    expect(proTipCount).toBeGreaterThanOrEqual(Math.floor(count * 0.75));
  });

  test('every POI card should have at least 1 link (Maps required)', async () => {
    const count = await tripPage.poiCards.count();
    for (let i = 0; i < count; i++) {
      const links = tripPage.getPoiCardLinks(tripPage.poiCards.nth(i));
      const linkCount = await links.count();
      expect(linkCount).toBeGreaterThanOrEqual(1);
    }
  });

  test('POI card links should have href attributes', async () => {
    const count = await tripPage.poiCards.count();
    for (let i = 0; i < count; i++) {
      const links = tripPage.getPoiCardLinks(tripPage.poiCards.nth(i));
      const linkCount = await links.count();
      for (let j = 0; j < linkCount; j++) {
        const href = await links.nth(j).getAttribute('href');
        expect(href).toBeTruthy();
        expect(href!.length).toBeGreaterThan(0);
      }
    }
  });

  test('every POI card should have a description', async () => {
    const count = await tripPage.poiCards.count();
    for (let i = 0; i < count; i++) {
      const desc = tripPage.poiCards.nth(i).locator('.poi-card__description');
      await expect(desc).toBeAttached();
    }
  });
});
