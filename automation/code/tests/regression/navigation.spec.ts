import { test, expect } from '../fixtures/shared-page';

test.describe('Navigation — Desktop Sidebar', () => {
  test('should have exactly 14 sidebar links', async ({ tripPage }) => {
    await expect(tripPage.sidebarLinks).toHaveCount(14);
  });

  test('should have first sidebar link as active with aria-current', async ({ tripPage }) => {
    // Scroll to top to ensure IntersectionObserver highlights #overview
    await tripPage.page.evaluate(() => window.scrollTo(0, 0));
    await tripPage.page.waitForTimeout(300);
    await expect(tripPage.sidebarActiveLink).toHaveCount(1);
    await expect(tripPage.sidebarActiveLink).toHaveAttribute('aria-current', 'page');
    await expect(tripPage.sidebarActiveLink).toHaveAttribute('href', '#overview');
  });

  test('should have correct sidebar link hrefs', async ({ tripPage }) => {
    const expectedHrefs = [
      '#overview',
      '#day-0', '#day-1', '#day-2', '#day-3', '#day-4', '#day-5',
      '#day-6', '#day-7', '#day-8', '#day-9', '#day-10', '#day-11',
      '#budget',
    ];
    for (let i = 0; i < expectedHrefs.length; i++) {
      await expect(tripPage.sidebarLinks.nth(i)).toHaveAttribute('href', expectedHrefs[i]);
    }
  });

  test('should have SVG icon in each sidebar link', async ({ tripPage }) => {
    const count = await tripPage.sidebarLinks.count();
    for (let i = 0; i < count; i++) {
      const svg = tripPage.sidebarLinks.nth(i).locator('svg');
      await expect(svg).toBeAttached();
    }
  });
});

test.describe('Navigation — Mobile Pills', () => {
  test('should have exactly 14 mobile pills', async ({ tripPage }) => {
    await expect(tripPage.mobilePills).toHaveCount(14);
  });

  test('should have first pill as active', async ({ tripPage }) => {
    await tripPage.page.evaluate(() => window.scrollTo(0, 0));
    await tripPage.page.waitForTimeout(300);
    await expect(tripPage.mobileActivePill).toHaveCount(1);
    await expect(tripPage.mobileActivePill).toHaveAttribute('href', '#overview');
  });

  test('should have correct pill hrefs', async ({ tripPage }) => {
    const expectedHrefs = [
      '#overview',
      '#day-0', '#day-1', '#day-2', '#day-3', '#day-4', '#day-5',
      '#day-6', '#day-7', '#day-8', '#day-9', '#day-10', '#day-11',
      '#budget',
    ];
    for (let i = 0; i < expectedHrefs.length; i++) {
      await expect(tripPage.mobilePills.nth(i)).toHaveAttribute('href', expectedHrefs[i]);
    }
  });
});
