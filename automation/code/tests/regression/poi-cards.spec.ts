import { test, expect } from '../fixtures/shared-page';
import { loadTripConfig } from '../utils/trip-config';

/**
 * POI Cards — Content, Links & Structure
 *
 * Canonical home for POI card structural validation.
 * POI count parity lives in poi-parity.spec.ts (single source of truth).
 *
 * Link type detection prefers data-link-type attribute (rendering-config.md).
 * Falls back to href/SVG pattern matching for HTML generated before the
 * data-link-type requirement was added. Remove the fallback once all
 * active trips have been regenerated.
 */

const tripConfig = loadTripConfig();

/**
 * Detect which link types are present in a POI card.
 * Prefers data-link-type attribute; falls back to the original detection
 * strategy (href patterns for Maps/Phone, SVG patterns for Site/Photo).
 *
 * The fallback uses a "check all links" approach per type, NOT per-link
 * classification, because Photo links use Google Maps URLs (matching the
 * Maps href pattern). SVG icon is the only reliable Photo/Site discriminator.
 *
 * Remove the fallback once all active trips use data-link-type.
 */
async function detectLinkPresence(
  links: import('@playwright/test').Locator,
  linkCount: number
): Promise<{ hasMap: boolean; hasSite: boolean; hasPhoto: boolean; lastIsPhone: boolean; usingDataAttr: boolean }> {
  // Try data-link-type first
  const dataTypes: string[] = [];
  for (let j = 0; j < linkCount; j++) {
    const dt = await links.nth(j).getAttribute('data-link-type');
    if (dt) dataTypes.push(dt);
  }

  if (dataTypes.length === linkCount && dataTypes.length > 0) {
    return {
      hasMap: dataTypes.includes('maps'),
      hasSite: dataTypes.includes('site'),
      hasPhoto: dataTypes.includes('photo'),
      lastIsPhone: dataTypes[dataTypes.length - 1] === 'phone',
      usingDataAttr: true,
    };
  }

  // Fallback: original detection strategy
  const hrefs: string[] = [];
  const htmls: string[] = [];
  for (let j = 0; j < linkCount; j++) {
    hrefs.push(await links.nth(j).getAttribute('href') ?? '');
    htmls.push(await links.nth(j).innerHTML());
  }

  return {
    hasMap: hrefs.some(h => /maps\.google|google\.com\/maps/i.test(h)),
    hasSite: htmls.some(h => /circle cx="12" cy="12" r="10"/.test(h)),
    hasPhoto: htmls.some(h => /rect x="3" y="3".*polyline points="21 15/.test(h)),
    lastIsPhone: hrefs.length > 0 && hrefs[hrefs.length - 1].startsWith('tel:'),
    usingDataAttr: false,
  };
}

test.describe('POI Cards — Content & Links', () => {
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
    const nonExemptCards = tripPage.page.locator('.poi-card:not([data-link-exempt])');
    const count = await nonExemptCards.count();
    let proTipCount = 0;
    for (let i = 0; i < count; i++) {
      const proTip = tripPage.getPoiCardProTip(nonExemptCards.nth(i));
      if (await proTip.count() > 0) proTipCount++;
    }
    expect(proTipCount).toBeGreaterThanOrEqual(Math.floor(count * 0.75));
  });

  test('TC-154: non-exempt POI cards should have 3 or 4 link types (Maps, Site, Photo, optional Phone)', async ({ tripPage }) => {
    const nonExemptCards = tripPage.page.locator('.poi-card:not([data-link-exempt])');
    const count = await nonExemptCards.count();
    expect(count).toBeGreaterThan(0);

    const missing: string[] = [];
    for (let i = 0; i < count; i++) {
      const card = nonExemptCards.nth(i);
      const name = await tripPage.getPoiCardName(card).textContent() ?? `POI #${i}`;
      const links = tripPage.getPoiCardLinks(card);
      const linkCount = await links.count();

      const { hasMap, hasSite, hasPhoto, lastIsPhone } = await detectLinkPresence(links, linkCount);
      if (!hasMap) missing.push(`${name.trim()}: missing Maps link`);
      if (!hasSite) missing.push(`${name.trim()}: missing Site link`);
      if (!hasPhoto) missing.push(`${name.trim()}: missing Photo link`);

      expect.soft(
        linkCount === 3 || linkCount === 4,
        `${name.trim()}: expected 3 or 4 links, got ${linkCount}`
      ).toBe(true);

      if (linkCount === 4) {
        expect.soft(
          lastIsPhone,
          `${name.trim()}: 4th link should be a phone (tel:) link`
        ).toBe(true);
      }
    }
    expect(missing, `Non-exempt POI cards with missing links:\n${missing.join('\n')}`).toHaveLength(0);
  });

  test('link-exempt POI cards should have fewer than 3 link types (QF-2 contract)', async ({ tripPage }) => {
    const exemptCards = tripPage.page.locator('.poi-card[data-link-exempt]');
    const count = await exemptCards.count();
    if (count === 0) return;
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
    const count = await tripPage.poiCards.count();
    let mapsCount = 0;
    for (let i = 0; i < count; i++) {
      // Prefer data-link-type, fall back to href pattern
      const byAttr = tripPage.poiCards.nth(i).locator('.poi-card__link[data-link-type="maps"]');
      if (await byAttr.count() > 0) {
        mapsCount++;
        continue;
      }
      // Fallback: href pattern matching
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
    expect(mapsCount).toBeGreaterThanOrEqual(Math.floor(count * 0.70));
  });

  test('TC-142: POI cards with phone numbers use valid tel: links', async ({ tripPage }) => {
    const phoneLinks = tripPage.page.locator('.poi-card .poi-card__link[href^="tel:"]');
    const count = await phoneLinks.count();
    for (let i = 0; i < count; i++) {
      const href = await phoneLinks.nth(i).getAttribute('href') ?? '';
      expect.soft(
        /^tel:\+?[\d\s\-()]+$/.test(href),
        `Phone link ${i}: valid tel: href ("${href}")`
      ).toBe(true);
    }
  });

  test('TC-144: Rating elements have correct class and contain numeric value', async ({ tripPage }) => {
    const count = await tripPage.poiCardRatings.count();
    for (let i = 0; i < count; i++) {
      const text = await tripPage.poiCardRatings.nth(i).textContent() ?? '';
      expect.soft(
        /\d/.test(text),
        `Rating ${i}: should contain a numeric value ("${text.trim()}")`
      ).toBe(true);
    }
  });
});
