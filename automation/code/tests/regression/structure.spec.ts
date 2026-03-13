import { test, expect } from '@playwright/test';
import { TripPage } from '../pages/TripPage';

test.describe('Structural Integrity', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('should have correct page title', async ({ page }) => {
    await expect(page).toHaveTitle('Будапешт 2026 — Семейный маршрут');
  });

  test('should display main heading', async () => {
    await expect(tripPage.pageTitle).toBeVisible();
    await expect(tripPage.pageTitle).toContainText('Будапешт 2026');
  });

  test('should display page subtitle with family info', async () => {
    await expect(tripPage.pageSubtitle).toBeVisible();
    await expect(tripPage.pageSubtitle).toContainText('Роберт');
    await expect(tripPage.pageSubtitle).toContainText('Анна');
    await expect(tripPage.pageSubtitle).toContainText('Тамир');
    await expect(tripPage.pageSubtitle).toContainText('Ариэль');
    await expect(tripPage.pageSubtitle).toContainText('Итай');
  });

  test('should render all 12 day sections (day-0 arrival + days 1-10 + day-11 departure)', async () => {
    await expect(tripPage.daySections).toHaveCount(12);
    for (let i = 0; i <= 11; i++) {
      await expect(tripPage.getDaySection(i)).toBeAttached();
    }
  });

  test('should render overview section', async () => {
    await expect(tripPage.overviewSection).toBeAttached();
  });

  test('should render budget section', async () => {
    await expect(tripPage.budgetSection).toBeAttached();
  });

  test('should have inlined CSS (no external stylesheet link)', async ({ page }) => {
    await expect(tripPage.inlineStyle).toBeAttached();
    const externalCssLink = page.locator('link[href*="rendering_style_config"]');
    await expect(externalCssLink).toHaveCount(0);
  });

  test('should have lang="ru" on html element', async ({ page }) => {
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('ru');
  });
});
