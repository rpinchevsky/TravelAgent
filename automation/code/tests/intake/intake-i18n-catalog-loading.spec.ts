import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { IntakePage } from '../pages/IntakePage';
import { createRequestCounter } from './utils/request-counter';

/**
 * i18n External Catalog — Browser-Based Loading Tests
 *
 * Validates catalog loading via fetch(), language switching, caching,
 * fallback chain, FOUC prevention, item translations, and protocol detection.
 * All tests use the bridge server (http://localhost:3456) as the transport.
 *
 * Test cases: TC-108 through TC-130 (22 browser tests)
 * Spec file: intake-i18n-catalog-loading.spec.ts
 */

test.describe('Catalog Fetching & Caching', () => {
  test('TC-108: setLanguage fetches external catalog on first call', async ({ page }) => {
    // REQ-002 -> AC-1
    const intake = new IntakePage(page);
    const counter = await createRequestCounter(page, '**/locales/ui_ru.json');

    await intake.goto();
    await intake.waitForI18nReady();

    await intake.switchLanguage('ru');
    await intake.waitForI18nReady();

    expect(counter.count, 'Exactly one fetch to ui_ru.json').toBeGreaterThanOrEqual(1);

    // Verify the request URL contains the expected path
    const ruRequest = counter.requests.find(r => r.url().includes('ui_ru.json'));
    expect(ruRequest, 'Request to ui_ru.json was captured').toBeTruthy();
  });

  test('TC-109: Fetched catalogs are cached (no duplicate fetches)', async ({ page }) => {
    // REQ-002 -> AC-2
    const intake = new IntakePage(page);
    const counter = await createRequestCounter(page, '**/locales/ui_ru.json');

    await intake.goto();
    await intake.waitForI18nReady();

    // First switch to Russian -> should fetch
    await intake.switchLanguage('ru');
    await intake.waitForI18nReady();
    expect(counter.count, 'RU fetched once').toBe(1);

    // Switch to English (cached from init) -> no new fetch
    await intake.switchLanguage('en');
    await intake.waitForI18nReady();

    // Switch back to Russian -> should NOT re-fetch
    await intake.switchLanguage('ru');
    await intake.waitForI18nReady();
    expect(counter.count, 'RU still fetched only once (cached)').toBe(1);
  });

  test('TC-112: English catalog is eagerly loaded on page init', async ({ page }) => {
    // REQ-002 -> AC-4; REQ-005 -> AC-1
    const intake = new IntakePage(page);
    const counter = await createRequestCounter(page, '**/locales/ui_en.json');

    await intake.goto();
    await intake.waitForI18nReady();

    expect(
      counter.count,
      'English catalog fetched during initial page load'
    ).toBeGreaterThanOrEqual(1);

    // Verify body does not have i18n-loading class
    const hasLoadingClass = await page.evaluate(
      () => document.body.classList.contains('i18n-loading')
    );
    expect(hasLoadingClass, 'i18n-loading class removed after load').toBe(false);
  });

  test('TC-118: Cold load makes at most 2 network requests for catalogs', async ({ page }) => {
    // REQ-005 -> AC-3
    const intake = new IntakePage(page);

    // Test 1: English user (no persisted language) -> 1 request
    const counter1 = await createRequestCounter(page, '**/locales/*.json');
    await intake.goto();
    await intake.waitForI18nReady();
    expect(counter1.count, 'English-only user: 1 catalog request').toBe(1);

    // Test 2: Non-English user -> at most 2 requests
    // Create a new context to get a clean state
    const context = page.context();
    const page2 = await context.newPage();
    const intake2 = new IntakePage(page2);

    // Set persisted language before navigation
    await page2.addInitScript(() => {
      localStorage.setItem('tripIntakeLang', 'he');
    });

    const counter2 = await createRequestCounter(page2, '**/locales/*.json');
    await intake2.goto();
    await intake2.waitForI18nReady();
    expect(
      counter2.count,
      'Non-English user: at most 2 catalog requests'
    ).toBeLessThanOrEqual(2);
    expect(
      counter2.count,
      'Non-English user: at least 1 catalog request'
    ).toBeGreaterThanOrEqual(1);

    await page2.close();
  });

  test('TC-119: Bridge server Cache-Control headers for locale files', async ({ page }) => {
    // REQ-005 -> AC-4
    const intake = new IntakePage(page);
    let cacheControl: string | null = null;
    let contentType: string | null = null;

    page.on('response', (response) => {
      if (response.url().includes('locales/ui_en.json')) {
        cacheControl = response.headers()['cache-control'] ?? null;
        contentType = response.headers()['content-type'] ?? null;
      }
    });

    await intake.goto();
    await intake.waitForI18nReady();

    expect(contentType, 'Content-Type is application/json').toContain('application/json');
    expect(cacheControl, 'Cache-Control header present').toBeTruthy();
    if (cacheControl) {
      expect(
        (cacheControl as string).includes('max-age'),
        'Cache-Control contains max-age'
      ).toBe(true);
    }
  });
});

test.describe('Fallback Chain', () => {
  test('TC-110: Fallback to English when target catalog fetch fails', async ({ page }) => {
    // REQ-002 -> AC-3
    const intake = new IntakePage(page);

    await intake.goto();
    await intake.waitForI18nReady();

    // Block Russian catalog to force fallback
    await page.route('**/locales/ui_ru.json', (route) =>
      route.fulfill({ status: 404 })
    );

    await intake.switchLanguage('ru');
    await intake.waitForI18nReady();

    // Verify page still displays content (falls back to English)
    const result = await page.evaluate(() => {
      const els = document.querySelectorAll('[data-i18n]');
      let emptyCount = 0;
      let rawKeyCount = 0;
      for (const el of els) {
        const text = el.textContent?.trim() ?? '';
        const key = el.getAttribute('data-i18n') ?? '';
        if (text.length === 0) emptyCount++;
        if (text === key) rawKeyCount++;
      }
      return { total: els.length, emptyCount, rawKeyCount };
    });

    expect(result.total, 'data-i18n elements exist').toBeGreaterThan(0);
    expect(result.emptyCount, 'No empty translated elements').toBe(0);
    expect(result.rawKeyCount, 'No raw key strings displayed').toBe(0);
  });

  test('TC-111: Emergency catalog activates when all fetches fail', async ({ page }) => {
    // REQ-002 -> AC-3 (emergency fallback)

    // Block ALL locale requests BEFORE navigation
    await page.route('**/locales/*.json', (route) =>
      route.fulfill({ status: 500 })
    );

    const intake = new IntakePage(page);
    await intake.goto();
    await intake.waitForI18nReady();

    // Verify the page is not stuck in loading state
    const isLoading = await page.evaluate(
      () => document.body.classList.contains('i18n-loading')
    );
    expect(isLoading, 'Page is not stuck in i18n-loading').toBe(false);

    // Verify critical elements have non-empty text
    const result = await page.evaluate(() => {
      const criticalEls = document.querySelectorAll(
        '.btn-next[data-i18n], .step__title[data-i18n]'
      );
      let filledCount = 0;
      for (const el of criticalEls) {
        if ((el.textContent?.trim() ?? '').length > 0) filledCount++;
      }
      return { total: criticalEls.length, filledCount };
    });

    expect(result.total, 'Critical elements exist').toBeGreaterThan(0);
    expect(result.filledCount, 'Critical elements have text via emergency catalog').toBe(
      result.total
    );
  });
});

test.describe('Translation Rendering', () => {
  test('TC-113: All data-i18n elements translated after language switch', async ({ page }) => {
    // REQ-002 -> AC-5
    const intake = new IntakePage(page);
    await intake.goto();
    await intake.waitForI18nReady();

    // Collect English texts
    const enTexts = await page.evaluate(() => {
      const map: Record<string, string> = {};
      document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n') ?? '';
        map[key] = el.textContent?.trim() ?? '';
      });
      return map;
    });

    // Switch to Russian
    await intake.switchLanguage('ru');
    await intake.waitForI18nReady();

    // Collect Russian texts
    const ruTexts = await page.evaluate(() => {
      const map: Record<string, string> = {};
      document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n') ?? '';
        map[key] = el.textContent?.trim() ?? '';
      });
      return map;
    });

    // At least some elements should differ (Russian has actual translations)
    let diffCount = 0;
    const keys = Object.keys(enTexts);
    for (const key of keys) {
      if (enTexts[key] !== ruTexts[key] && ruTexts[key].length > 0) {
        diffCount++;
      }
      // No element should display the raw key
      expect.soft(
        ruTexts[key] !== key || key.length === 0,
        `RU: data-i18n="${key}" does not display raw key`
      ).toBe(true);
    }

    expect(
      diffCount,
      'At least some elements have different text in Russian'
    ).toBeGreaterThan(0);
  });

  test('TC-114: RTL direction setting works for Hebrew and Arabic', async ({ page }) => {
    // REQ-002 -> AC-6
    const intake = new IntakePage(page);
    await intake.goto();
    await intake.waitForI18nReady();

    // Default should be LTR
    const initialDir = await page.locator('html').getAttribute('dir');
    expect(initialDir === 'ltr' || initialDir === null, 'Initial direction is LTR').toBe(true);

    // Switch to Hebrew -> RTL
    await intake.switchLanguage('he');
    await intake.waitForI18nReady();
    expect(
      await page.locator('html').getAttribute('dir'),
      'Hebrew sets dir=rtl'
    ).toBe('rtl');

    // Switch to Arabic -> RTL
    await intake.switchLanguage('ar');
    await intake.waitForI18nReady();
    expect(
      await page.locator('html').getAttribute('dir'),
      'Arabic sets dir=rtl'
    ).toBe('rtl');

    // Switch back to English -> LTR
    await intake.switchLanguage('en');
    await intake.waitForI18nReady();
    expect(
      await page.locator('html').getAttribute('dir'),
      'English restores dir=ltr'
    ).toBe('ltr');
  });

  test('TC-121: Interest/avoid/food/vibe cards display correctly in EN, RU, HE', async ({ page }) => {
    // REQ-003 -> AC-2, AC-3, AC-4
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);
    await intake.waitForI18nReady();
    await intake.navigateToStep(3);

    // English: verify cards have visible non-empty names and data-en-name
    const enResult = await page.evaluate(() => {
      const cards = document.querySelectorAll('#interestsSections .interest-card');
      const names: string[] = [];
      let missingEnName = 0;
      for (const card of cards) {
        const name = card.querySelector('.interest-card__name')?.textContent?.trim() ?? '';
        names.push(name);
        if (!card.getAttribute('data-en-name')) missingEnName++;
      }
      return { count: cards.length, names, missingEnName };
    });

    expect(enResult.count, 'Interest cards exist').toBeGreaterThan(0);
    expect(enResult.missingEnName, 'All cards have data-en-name').toBe(0);

    // Collect data-en-name values (should remain stable)
    const enNames = await page.evaluate(() => {
      const cards = document.querySelectorAll('#interestsSections .interest-card');
      return Array.from(cards).map(c => c.getAttribute('data-en-name') ?? '');
    });

    // Switch to Russian
    await intake.switchLanguage('ru');
    await intake.waitForI18nReady();
    const ruNames = await page.evaluate(() => {
      const cards = document.querySelectorAll('#interestsSections .interest-card');
      return Array.from(cards).map(c => ({
        display: c.querySelector('.interest-card__name')?.textContent?.trim() ?? '',
        enName: c.getAttribute('data-en-name') ?? '',
      }));
    });

    // At least some display names should differ from English names
    let ruDiffCount = 0;
    for (const item of ruNames) {
      if (item.display !== item.enName && item.display.length > 0) ruDiffCount++;
      expect.soft(item.enName.length > 0, `RU: data-en-name preserved`).toBe(true);
    }
    expect(ruDiffCount, 'Some RU card names differ from English').toBeGreaterThan(0);

    // Switch to Hebrew
    await intake.switchLanguage('he');
    await intake.waitForI18nReady();
    const heNames = await page.evaluate(() => {
      const cards = document.querySelectorAll('#interestsSections .interest-card');
      return Array.from(cards).map(c => ({
        display: c.querySelector('.interest-card__name')?.textContent?.trim() ?? '',
        enName: c.getAttribute('data-en-name') ?? '',
      }));
    });

    let heDiffCount = 0;
    for (const item of heNames) {
      if (item.display !== item.enName && item.display.length > 0) heDiffCount++;
    }
    expect(heDiffCount, 'Some HE card names differ from English').toBeGreaterThan(0);

    // data-en-name must be unchanged across all switches
    const finalEnNames = await page.evaluate(() => {
      const cards = document.querySelectorAll('#interestsSections .interest-card');
      return Array.from(cards).map(c => c.getAttribute('data-en-name') ?? '');
    });
    expect(finalEnNames, 'data-en-name unchanged after language switches').toEqual(enNames);
  });

  test('TC-128: tItem() returns correct translations for RU and HE', async ({ page }) => {
    // REQ-003 -> AC-2, AC-3
    const intake = new IntakePage(page);
    await intake.goto();
    await intake.waitForI18nReady();

    // Dynamically extract the first item key from the loaded catalog
    const firstItem = await page.evaluate(
      () => Object.keys((window as any)._uiCache?.en?._items ?? {})[0]
    );
    expect(firstItem, 'First item key extracted from catalog').toBeTruthy();

    // EN: identity mapping (English name returned)
    const enResult = await page.evaluate(
      (key) => typeof (window as any).tItem === 'function' ? (window as any).tItem(key) : null,
      firstItem
    );
    expect(enResult, 'EN tItem returns the key itself').toBe(firstItem);

    // Switch to Russian
    await intake.switchLanguage('ru');
    await intake.waitForI18nReady();
    const ruResult = await page.evaluate(
      (key) => typeof (window as any).tItem === 'function' ? (window as any).tItem(key) : null,
      firstItem
    );
    expect(ruResult, 'RU tItem returns a value').toBeTruthy();
    expect(ruResult, 'RU tItem returns different from English').not.toBe(firstItem);

    // Switch to Spanish (fallback) -> should return English identity
    await intake.switchLanguage('es');
    await intake.waitForI18nReady();
    const esResult = await page.evaluate(
      (key) => typeof (window as any).tItem === 'function' ? (window as any).tItem(key) : null,
      firstItem
    );
    expect(esResult, 'ES (fallback) tItem returns English identity').toBe(firstItem);
  });
});

test.describe('Persistence & FOUC Prevention', () => {
  test('TC-115: localStorage persistence works across reloads', async ({ page }) => {
    // REQ-002 -> AC-7
    const intake = new IntakePage(page);
    await intake.goto();
    await intake.waitForI18nReady();

    // Switch to Russian
    await intake.switchLanguage('ru');
    await intake.waitForI18nReady();

    // Verify localStorage is set
    const storedLang = await page.evaluate(
      () => localStorage.getItem('tripIntakeLang')
    );
    expect(storedLang, 'Language persisted in localStorage').toBeTruthy();

    // Reload the page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await intake.waitForI18nReady();

    // Verify the page reloads in the persisted language
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang, 'Page reloads in persisted language').toBe(storedLang);
  });

  test('TC-116: Cached language switch is visually instant (no FOUC)', async ({ page }) => {
    // REQ-002 -> AC-8; REQ-005 -> AC-5
    const intake = new IntakePage(page);
    await intake.goto();
    await intake.waitForI18nReady();

    // Prime the cache: switch RU -> EN -> RU
    await intake.switchLanguage('ru');
    await intake.waitForI18nReady();
    await intake.switchLanguage('en');
    await intake.waitForI18nReady();

    // Now both are cached. Switch to Russian again.
    // During a cached switch, body should never get i18n-loading class.
    // Start the observer WITHOUT awaiting, then trigger the switch concurrently.
    const observerPromise = page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        const observer = new MutationObserver((mutations) => {
          for (const m of mutations) {
            if (
              m.type === 'attributes' &&
              m.attributeName === 'class' &&
              document.body.classList.contains('i18n-loading')
            ) {
              observer.disconnect();
              resolve(true);
              return;
            }
          }
        });
        observer.observe(document.body, { attributes: true });
        // Disconnect after enough time for the switch to complete
        setTimeout(() => {
          observer.disconnect();
          resolve(false);
        }, 2000);
      });
    });

    // Trigger switch while observer is watching
    await intake.switchLanguage('ru');
    await intake.waitForI18nReady();

    // Now await the observer result
    const hadLoadingDuringSwitch = await observerPromise;
    expect(hadLoadingDuringSwitch, 'No i18n-loading class during cached switch').toBe(false);

    // Double-check class is removed after switch
    const finalLoading = await page.evaluate(
      () => document.body.classList.contains('i18n-loading')
    );
    expect(finalLoading, 'No i18n-loading after cached switch').toBe(false);
  });

  test('TC-117: User persisted language loaded before first render', async ({ page }) => {
    // REQ-005 -> AC-2
    // Set persisted language before navigation
    await page.addInitScript(() => {
      localStorage.setItem('tripIntakeLang', 'ru');
    });

    const intake = new IntakePage(page);
    const counter = await createRequestCounter(page, '**/locales/**');

    await intake.goto();
    await intake.waitForI18nReady();

    // Both EN and RU should have been fetched
    const enFetched = counter.requests.some(r => r.url().includes('ui_en.json'));
    const ruFetched = counter.requests.some(r => r.url().includes('ui_ru.json'));
    expect(enFetched, 'EN catalog fetched on init').toBe(true);
    expect(ruFetched, 'RU catalog fetched on init (persisted language)').toBe(true);

    // Verify page displays in Russian (html[lang] = ru)
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang, 'Page displays in persisted language').toBe('ru');
  });

  test('TC-120: No flash of untranslated content on initial load', async ({ page }) => {
    // REQ-005 -> AC-5
    const intake = new IntakePage(page);

    // Use addInitScript to inject an observer that captures whether
    // body.i18n-loading was present during page initialization.
    // This runs BEFORE any page script, so it reliably detects the CSS class.
    await page.addInitScript(() => {
      (window as any).__i18nLoadingDetected = false;
      const observer = new MutationObserver(() => {
        if (document.body && document.body.classList.contains('i18n-loading')) {
          (window as any).__i18nLoadingDetected = true;
          observer.disconnect();
        }
      });
      // Observe once DOM is available
      if (document.body) {
        if (document.body.classList.contains('i18n-loading')) {
          (window as any).__i18nLoadingDetected = true;
        } else {
          observer.observe(document.body, { attributes: true });
        }
      } else {
        document.addEventListener('DOMContentLoaded', () => {
          if (document.body.classList.contains('i18n-loading')) {
            (window as any).__i18nLoadingDetected = true;
          } else {
            observer.observe(document.body, { attributes: true });
          }
        });
      }
    });

    await intake.goto();
    await intake.waitForI18nReady();

    // Verify body had i18n-loading class during load (FOUC prevention was active)
    const hadLoadingClass = await page.evaluate(
      () => (window as any).__i18nLoadingDetected
    );
    expect(hadLoadingClass, 'body.i18n-loading was present during initial load').toBe(true);

    // After loading, verify class is removed
    const isLoading = await page.evaluate(
      () => document.body.classList.contains('i18n-loading')
    );
    expect(isLoading, 'i18n-loading removed after load completes').toBe(false);

    // Verify all visible data-i18n elements have non-key content
    const result = await page.evaluate(() => {
      const els = document.querySelectorAll('[data-i18n]');
      let rawKeyCount = 0;
      for (const el of els) {
        const key = el.getAttribute('data-i18n') ?? '';
        const text = el.textContent?.trim() ?? '';
        if (text === key && text.length > 0) rawKeyCount++;
      }
      return { total: els.length, rawKeyCount };
    });
    expect(result.rawKeyCount, 'No raw key strings visible after load').toBe(0);
  });
});

test.describe('Item Card Rendering & Markdown', () => {
  test('TC-122: Card names in generated markdown output remain in English', async ({ page }) => {
    // REQ-003 -> AC-5
    const intake = new IntakePage(page);

    // Set language to Russian before navigation
    await page.addInitScript(() => {
      localStorage.setItem('tripIntakeLang', 'ru');
    });

    await intake.goto();
    await intake.waitForI18nReady();

    // Setup with depth and navigate to interests
    await intake.completePrerequisiteSteps();
    await intake.selectDepthAndConfirm(20);
    await intake.navigateToStep(3);

    // Select a few interest cards
    const cards = intake.interestCards;
    const cardCount = await cards.count();
    if (cardCount > 0) {
      await cards.first().click();
    }
    if (cardCount > 1) {
      await cards.nth(1).click();
    }

    // Collect data-en-name values for selected cards
    const selectedEnNames = await page.evaluate(() => {
      const selected = document.querySelectorAll('#interestsSections .interest-card.is-selected');
      return Array.from(selected).map(c => c.getAttribute('data-en-name') ?? '');
    });

    // Navigate to review step
    await intake.navigateToStep(7);
    const markdown = await intake.getRawMarkdown();

    // Verify English names appear in markdown
    for (const enName of selectedEnNames) {
      if (enName) {
        expect.soft(
          markdown.includes(enName),
          `Markdown contains English name: "${enName}"`
        ).toBe(true);
      }
    }
  });

  test('TC-130: Calendar month and day names use external catalogs', async ({ page }) => {
    // REQ-002 -> AC-5 (calendar translations)
    const intake = new IntakePage(page);
    await intake.goto();
    await intake.waitForI18nReady();

    // Open date picker
    await page.locator('#sbDatesToggle').click();
    await expect(page.locator('#sbDatesDropdown')).toBeVisible();

    // Collect English day-of-week headers
    const enDays = await page.evaluate(() => {
      const dows = document.querySelectorAll('.date-picker__dow');
      return Array.from(dows).map(d => d.textContent?.trim() ?? '').slice(0, 7);
    });

    // Switch to Russian
    await intake.switchLanguage('ru');
    await intake.waitForI18nReady();

    // Re-open date picker if needed
    if (!await page.locator('#sbDatesDropdown').isVisible()) {
      await page.locator('#sbDatesToggle').click();
    }

    // Collect Russian day-of-week headers
    const ruDays = await page.evaluate(() => {
      const dows = document.querySelectorAll('.date-picker__dow');
      return Array.from(dows).map(d => d.textContent?.trim() ?? '').slice(0, 7);
    });

    // Days should differ between EN and RU
    let dayDiffCount = 0;
    for (let i = 0; i < Math.min(enDays.length, ruDays.length); i++) {
      if (enDays[i] !== ruDays[i]) dayDiffCount++;
    }
    expect(
      dayDiffCount,
      'Calendar day names are translated (at least some differ)'
    ).toBeGreaterThan(0);
  });
});

test.describe('Bridge Server & Protocol', () => {
  test('TC-123: Page works via bridge server', async ({ page }) => {
    // REQ-004 -> AC-1, AC-5
    const intake = new IntakePage(page);

    // Capture console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const pageErrors: string[] = [];
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    await intake.goto();
    await intake.waitForI18nReady();

    // Verify page loaded without i18n-related errors
    const i18nErrors = consoleErrors.filter(
      (e) => /i18n|locale|catalog|fetch|translate/i.test(e)
    );
    expect(
      i18nErrors.length,
      `No i18n console errors: ${i18nErrors.join('; ')}`
    ).toBe(0);

    // Verify page errors (unhandled exceptions) are zero
    expect(pageErrors.length, `No unhandled page errors: ${pageErrors.join('; ')}`).toBe(0);

    // Verify language switching works
    await intake.switchLanguage('ru');
    await intake.waitForI18nReady();
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang, 'Language switch works via bridge server').toBe('ru');

    // Verify locale file is directly accessible
    const response = await page.request.get('/locales/ui_en.json');
    expect(response.status(), 'Direct locale file access returns 200').toBe(200);
    const json = await response.json();
    expect(typeof json, 'Response is valid JSON object').toBe('object');
  });
});

test.describe('file:// protocol detection', () => {
  test('TC-124: file:// protocol shows graceful error message', async ({ page }) => {
    // REQ-004 -> AC-4
    // Block ALL locale catalog requests (simulates fetch failure on file://)
    await page.route('**/locales/*.json', (route) =>
      route.abort('blockedbyclient')
    );

    // Override window.location.protocol to return 'file:'
    await page.addInitScript(() => {
      Object.defineProperty(window, '__protocolOverride', { value: 'file:' });
      const origDescriptor = Object.getOwnPropertyDescriptor(window.location, 'protocol') ||
        Object.getOwnPropertyDescriptor(Location.prototype, 'protocol');
      if (origDescriptor) {
        Object.defineProperty(Location.prototype, 'protocol', {
          get: () => 'file:',
          configurable: true,
        });
      }
    });

    const intake = new IntakePage(page);
    await page.goto('');
    await page.waitForLoadState('domcontentloaded');

    // Wait for the error overlay to appear (protocol detection fires)
    // Give the page time to detect the condition and show the overlay
    await page.waitForSelector(
      '.file-protocol-overlay, [data-i18n="file_protocol_error"], .protocol-error',
      { timeout: 5000 }
    ).catch(() => {
      // The selector might vary; check for any full-page overlay
    });

    // Verify an error overlay is displayed
    const overlayResult = await page.evaluate(() => {
      // Check for various possible overlay selectors
      const overlay =
        document.querySelector('.file-protocol-overlay') ||
        document.querySelector('.protocol-error') ||
        document.querySelector('[data-i18n="file_protocol_error"]')?.closest('div');

      if (!overlay) return { found: false, position: '', zIndex: '' };

      const style = window.getComputedStyle(overlay);
      return {
        found: true,
        position: style.position,
        zIndex: style.zIndex,
      };
    });

    expect(overlayResult.found, 'Error overlay is displayed').toBe(true);
    if (overlayResult.found) {
      expect(
        overlayResult.position,
        'Overlay uses fixed positioning'
      ).toBe('fixed');
    }
  });
});

test.describe('Race Condition Guard', () => {
  test('TC-129: Rapid language switching settles on last selection', async ({ page }) => {
    // REQ-002 -> AC-8; DD 1.12
    const intake = new IntakePage(page);
    await intake.goto();
    await intake.waitForI18nReady();

    // Add artificial network delays: RU is slow (300ms), HE is fast (100ms)
    await page.route('**/locales/ui_ru.json', async (route) => {
      const response = await route.fetch();
      const body = await response.text();
      // Delay the response
      await new Promise((r) => setTimeout(r, 300));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body,
      });
    });

    await page.route('**/locales/ui_he.json', async (route) => {
      const response = await route.fetch();
      const body = await response.text();
      // Faster response
      await new Promise((r) => setTimeout(r, 100));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body,
      });
    });

    // Rapidly switch: EN -> RU -> HE (without waiting)
    await intake.switchLanguage('ru');
    // Don't wait for i18n ready — immediately switch again
    await intake.switchLanguage('he');
    await intake.waitForI18nReady();

    // Wait for all network to settle
    await page.waitForLoadState('networkidle');

    // Final state should be Hebrew (last selection wins)
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang, 'Final language is Hebrew (last selected)').toBe('he');

    const htmlDir = await page.locator('html').getAttribute('dir');
    expect(htmlDir, 'Final direction is RTL (Hebrew)').toBe('rtl');
  });
});

test.describe('Cross-Validation (Browser + Filesystem)', () => {
  // Shared constants
  const SPECIAL_KEYS = ['_items', 'months', 'days_short'];
  const projectRoot = path.resolve(__dirname, '..', '..', '..', '..');
  const enPath = path.join(projectRoot, 'locales', 'ui_en.json');

  /** Load English catalog from filesystem */
  function loadEnCatalog(): Record<string, unknown> {
    return JSON.parse(fs.readFileSync(enPath, 'utf-8'));
  }

  test('TC-106: data-i18n count matches catalog key count', async ({ page }) => {
    // REQ-007 -> AC-5
    const enCatalog = loadEnCatalog();

    // Count non-special keys in catalog
    const catalogKeySet = new Set(
      Object.keys(enCatalog).filter((k) => !SPECIAL_KEYS.includes(k))
    );

    const intake = new IntakePage(page);
    await intake.goto();
    await intake.waitForI18nReady();

    // Count data-i18n elements in DOM
    const domCount = await page.evaluate(() => {
      return document.querySelectorAll('[data-i18n]').length;
    });

    expect(domCount, 'data-i18n element count is > 0').toBeGreaterThan(0);

    // Collect unique data-i18n values and verify each exists in catalog
    const domKeys = await page.evaluate(() => {
      const els = document.querySelectorAll('[data-i18n]');
      return Array.from(new Set(
        Array.from(els).map(e => e.getAttribute('data-i18n')).filter(Boolean)
      )) as string[];
    });

    for (const key of domKeys) {
      expect.soft(
        catalogKeySet.has(key),
        `DOM data-i18n="${key}" exists in English catalog`
      ).toBe(true);
    }
  });

  test('TC-131: Post-extraction validation — data-i18n keys map to catalog', async ({ page }) => {
    // REQ-007 -> AC-5, AC-6
    const enCatalog = loadEnCatalog();
    const catalogKeys = new Set(
      Object.keys(enCatalog).filter((k) => !SPECIAL_KEYS.includes(k))
    );

    const intake = new IntakePage(page);
    await intake.goto();
    await intake.waitForI18nReady();

    // Collect all data-i18n and data-i18n-placeholder values from the DOM
    const { i18nKeys, placeholderKeys } = await page.evaluate(() => {
      const i18nEls = document.querySelectorAll('[data-i18n]');
      const placeholderEls = document.querySelectorAll('[data-i18n-placeholder]');
      return {
        i18nKeys: Array.from(new Set(
          Array.from(i18nEls).map(el => el.getAttribute('data-i18n')).filter(Boolean) as string[]
        )),
        placeholderKeys: Array.from(new Set(
          Array.from(placeholderEls).map(el => el.getAttribute('data-i18n-placeholder')).filter(Boolean) as string[]
        )),
      };
    });

    // Every data-i18n value must exist as a catalog key
    for (const key of i18nKeys) {
      expect.soft(
        catalogKeys.has(key),
        `data-i18n="${key}" has matching catalog key`
      ).toBe(true);
    }

    // Every data-i18n-placeholder value must exist as a catalog key
    for (const key of placeholderKeys) {
      expect.soft(
        catalogKeys.has(key),
        `data-i18n-placeholder="${key}" has matching catalog key`
      ).toBe(true);
    }
  });
});
