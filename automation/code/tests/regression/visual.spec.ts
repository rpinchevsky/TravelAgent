import { test, expect } from '@playwright/test';
import { TripPage } from '../pages/TripPage';

test.describe('Visual Regression — Desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('Day 1 card should match screenshot', async () => {
    const dayCard = tripPage.getDaySection(1);
    await expect(dayCard).toHaveScreenshot('day1-card-desktop.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('Overview table should match screenshot', async () => {
    const overview = tripPage.overviewSection.locator('.itinerary-table-wrapper').first();
    await expect(overview).toHaveScreenshot('overview-table-desktop.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('Holiday advisory should match screenshot', async () => {
    await expect(tripPage.holidayAdvisory).toHaveScreenshot('advisory-desktop.png', {
      maxDiffPixelRatio: 0.01,
    });
  });
});

test.describe('Visual Regression — Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('Mobile nav should match screenshot', async () => {
    await expect(tripPage.mobileNav).toHaveScreenshot('mobile-nav.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('Day 1 card should match screenshot on mobile', async () => {
    const dayCard = tripPage.getDaySection(1);
    await expect(dayCard).toHaveScreenshot('day1-card-mobile.png', {
      maxDiffPixelRatio: 0.01,
    });
  });
});
