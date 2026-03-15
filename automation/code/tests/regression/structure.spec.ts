import { test, expect } from '../fixtures/shared-page';
import { loadTripConfig } from '../utils/trip-config';

const tripConfig = loadTripConfig();

test.describe('Structural Integrity', () => {
  test('should have correct page title', async ({ sharedPage }) => {
    await expect(sharedPage).toHaveTitle(tripConfig.pageTitle);
  });

  test('should display main heading', async ({ tripPage }) => {
    await expect(tripPage.pageTitle).toBeVisible();
    await expect(tripPage.pageTitle).toContainText(tripConfig.localizedDestination);
  });

  test('should display page subtitle with family info', async ({ tripPage }) => {
    await expect(tripPage.pageSubtitle).toBeVisible();
    const text = await tripPage.pageSubtitle.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
  });

  test('should render all day sections', async ({ tripPage }) => {
    await expect(tripPage.daySections).toHaveCount(tripConfig.dayCount);
    for (let i = 0; i < tripConfig.dayCount; i++) {
      await expect(tripPage.getDaySection(i)).toBeAttached();
    }
  });

  test('should render overview section', async ({ tripPage }) => {
    await expect(tripPage.overviewSection).toBeAttached();
  });

  test('should render budget section', async ({ tripPage }) => {
    await expect(tripPage.budgetSection).toBeAttached();
  });

  test('should have inlined CSS (no external stylesheet link)', async ({ tripPage, sharedPage }) => {
    await expect(tripPage.inlineStyle).toBeAttached();
    const externalCssLink = sharedPage.locator('link[href*="rendering_style_config"]');
    await expect(externalCssLink).toHaveCount(0);
  });

  test('should have correct lang attribute on html element', async ({ sharedPage }) => {
    const lang = await sharedPage.locator('html').getAttribute('lang');
    expect(lang).toBe(tripConfig.labels.langCode);
  });

  test('country flag should be an inline SVG, not an emoji', async ({ tripPage }) => {
    const title = tripPage.pageTitle;
    const flagSvg = title.locator('svg[role="img"]');
    await expect(flagSvg).toBeAttached();
    await expect(flagSvg).toHaveAttribute('aria-label', /flag/i);
    await expect(flagSvg).toHaveAttribute('width', '28');
    await expect(flagSvg).toHaveAttribute('height', '20');
  });

  test('page title should not contain flag emoji characters', async ({ tripPage }) => {
    const titleText = await tripPage.pageTitle.textContent();
    const flagEmojiPattern = /[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/;
    expect(titleText).not.toMatch(flagEmojiPattern);
  });
});
