import { test, expect } from '../fixtures/shared-page';
import { loadTripConfig } from '../utils/trip-config';
import { getExpectedPoiCountsFromMarkdown } from '../utils/markdown-pois';

const tripConfig = loadTripConfig();

test.describe('POI Cards — Content & Links', () => {
  test('should have POI cards matching markdown count', async ({ tripPage }) => {
    const expected = getExpectedPoiCountsFromMarkdown();
    const expectedTotal = Object.values(expected).reduce((sum, d) => sum + d.count, 0);
    const totalPois = await tripPage.poiCards.count();
    // HTML may include extra tagged cards (🛒 grocery, 🎯 along-the-way) beyond markdown POI sections
    expect(totalPois).toBeGreaterThanOrEqual(expectedTotal);
  });

  test('every POI card should have a name', async ({ tripPage }) => {
    const count = await tripPage.poiCards.count();
    for (let i = 0; i < count; i++) {
      const name = tripPage.getPoiCardName(tripPage.poiCards.nth(i));
      await expect(name).toBeAttached();
      const text = await name.textContent();
      expect(text!.trim().length).toBeGreaterThan(0);
    }
  });

  test('most POI cards should have a pro-tip', async ({ tripPage }) => {
    const count = await tripPage.poiCards.count();
    let proTipCount = 0;
    for (let i = 0; i < count; i++) {
      const proTip = tripPage.getPoiCardProTip(tripPage.poiCards.nth(i));
      if (await proTip.count() > 0) proTipCount++;
    }
    // At least 75% of POI cards should have pro-tips
    expect(proTipCount).toBeGreaterThanOrEqual(Math.floor(count * 0.75));
  });

  test('non-exempt POI cards should have all 3 link types (Maps, Site, Photo)', async ({ tripPage }) => {
    // Uses data-link-exempt attribute — language-independent, no name-based exclusion list.
    const nonExemptCards = tripPage.page.locator('.poi-card:not([data-link-exempt])');
    const count = await nonExemptCards.count();
    expect(count).toBeGreaterThan(0);

    const missing: string[] = [];
    for (let i = 0; i < count; i++) {
      const card = nonExemptCards.nth(i);
      const name = await tripPage.getPoiCardName(card).textContent() ?? `POI #${i}`;
      const links = tripPage.getPoiCardLinks(card);
      const linkCount = await links.count();
      const linkHrefs: string[] = [];
      const linkHtmls: string[] = [];
      for (let j = 0; j < linkCount; j++) {
        linkHrefs.push(await links.nth(j).getAttribute('href') ?? '');
        linkHtmls.push(await links.nth(j).innerHTML() ?? '');
      }
      const hasMap = linkHrefs.some(h => /maps\.google|google\.com\/maps/i.test(h));
      const hasSite = linkHtmls.some(h => /circle cx="12" cy="12" r="10"/.test(h));
      const hasPhoto = linkHtmls.some(h => /path d="M23 19a2 2|rect x="3" y="3".*polyline points="21 15/.test(h));
      if (!hasMap) missing.push(`${name.trim()}: missing Maps link`);
      if (!hasSite) missing.push(`${name.trim()}: missing Site link`);
      if (!hasPhoto) missing.push(`${name.trim()}: missing Photo link`);
    }
    expect(missing, `Non-exempt POI cards with missing links:\n${missing.join('\n')}`).toHaveLength(0);
  });

  test('link-exempt POI cards should have fewer than 3 link types (QF-2 contract)', async ({ tripPage }) => {
    // Validates the rendering contract from the other side: exempt cards must actually have fewer links
    const exemptCards = tripPage.page.locator('.poi-card[data-link-exempt]');
    const count = await exemptCards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const links = tripPage.getPoiCardLinks(exemptCards.nth(i));
      const linkCount = await links.count();
      expect.soft(linkCount, `Exempt POI #${i + 1}`).toBeLessThan(3);
    }
  });

  test('POI card links should have href attributes', async ({ tripPage }) => {
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

  test('every POI card should have a description', async ({ tripPage }) => {
    const count = await tripPage.poiCards.count();
    for (let i = 0; i < count; i++) {
      const desc = tripPage.poiCards.nth(i).locator('.poi-card__description');
      await expect(desc).toBeAttached();
    }
  });

  test('most main POI cards should have Maps link', async ({ tripPage }) => {
    // Structural detection via href pattern — language-independent
    const count = await tripPage.poiCards.count();
    let mapsCount = 0;
    for (let i = 0; i < count; i++) {
      const links = tripPage.getPoiCardLinks(tripPage.poiCards.nth(i));
      const linkCount = await links.count();
      for (let j = 0; j < linkCount; j++) {
        const href = await links.nth(j).getAttribute('href') ?? '';
        if (/maps\.google|google\.com\/maps/i.test(href)) {
          mapsCount++;
          break;
        }
      }
    }
    // At least 70% of POI cards should have Maps links
    expect(mapsCount).toBeGreaterThanOrEqual(Math.floor(count * 0.70));
  });
});
