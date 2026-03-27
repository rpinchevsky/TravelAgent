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

  test('TC-154: non-exempt POI cards should have 3 or 4 link types (Maps, Site, Photo, optional Phone)', async ({ tripPage }) => {
    // Uses data-link-exempt attribute — language-independent, no name-based exclusion list.
    // TC-154: Relaxed from exactly 3 to 3 or 4 links. The 4th link, if present, must be a phone (tel:) link.
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

      // Link count must be 3 (Maps, Site, Photo) or 4 (Maps, Site, Photo, Phone)
      expect.soft(
        linkCount === 3 || linkCount === 4,
        `${name.trim()}: expected 3 or 4 links, got ${linkCount}`
      ).toBe(true);

      // If a 4th link exists, it must be a phone link
      if (linkCount === 4) {
        const fourthHref = linkHrefs[3];
        expect.soft(
          fourthHref.startsWith('tel:'),
          `${name.trim()}: 4th link should be tel:, got "${fourthHref}"`
        ).toBe(true);
      }
    }
    expect(missing, `Non-exempt POI cards with missing links:\n${missing.join('\n')}`).toHaveLength(0);
  });

  test('link-exempt POI cards should have fewer than 3 link types (QF-2 contract)', async ({ tripPage }) => {
    // Validates the rendering contract from the other side: exempt cards must actually have fewer links
    const exemptCards = tripPage.page.locator('.poi-card[data-link-exempt]');
    const count = await exemptCards.count();
    if (count === 0) return; // No exempt cards in this trip — nothing to validate
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

  test('TC-142: POI cards with phone numbers use valid tel: links', async ({ tripPage }) => {
    // REQ-009 -> AC-1, AC-3; REQ-003 -> AC-2, AC-3, AC-4
    // Phone links are optional ("when available"). Zero is acceptable.
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

  test('TC-143: Phone links appear as the last link in the POI card link row', async ({ tripPage }) => {
    // REQ-003 -> AC-2; REQ-009 -> AC-1
    // Order: Maps, Site, Photo, Phone. Phone (if present) must be last.
    const results = await tripPage.page.evaluate(() => {
      const cards = document.querySelectorAll('.poi-card:not([data-link-exempt])');
      const violations: string[] = [];
      cards.forEach((card) => {
        const links = card.querySelectorAll('.poi-card__link');
        const linkArray = Array.from(links);
        const phoneIndex = linkArray.findIndex(l => {
          const href = l.getAttribute('href') || '';
          return href.startsWith('tel:');
        });
        if (phoneIndex >= 0 && phoneIndex !== linkArray.length - 1) {
          const name = card.querySelector('.poi-card__name')?.textContent?.trim() || 'unknown';
          violations.push(`${name}: phone link at index ${phoneIndex}, expected last (${linkArray.length - 1})`);
        }
      });
      return violations;
    });
    for (const v of results) {
      expect.soft(false, v).toBe(true);
    }
  });

  test('TC-144: Rating elements have correct class and contain numeric value', async ({ tripPage }) => {
    // REQ-009 -> AC-2, AC-3; REQ-005 -> AC-1, AC-2, AC-3, AC-5
    // Ratings are optional ("when available"). Zero is acceptable.
    const count = await tripPage.poiCardRatings.count();
    for (let i = 0; i < count; i++) {
      const text = await tripPage.poiCardRatings.nth(i).textContent() ?? '';
      expect.soft(
        /\d/.test(text),
        `Rating ${i}: should contain a numeric value ("${text.trim()}")`
      ).toBe(true);
    }
  });

  test('TC-145: Rating elements are positioned in card body, not in link row', async ({ tripPage }) => {
    // REQ-005 -> AC-2
    const results = await tripPage.page.evaluate(() => {
      const ratings = document.querySelectorAll('.poi-card__rating');
      const violations: string[] = [];
      ratings.forEach((rating, i) => {
        const inLinks = rating.closest('.poi-card__links');
        const inBody = rating.closest('.poi-card__body');
        if (inLinks) {
          violations.push(`Rating ${i}: should not be inside .poi-card__links`);
        }
        if (!inBody) {
          violations.push(`Rating ${i}: should be inside .poi-card__body`);
        }
      });
      return violations;
    });
    for (const v of results) {
      expect.soft(false, v).toBe(true);
    }
  });

  test('TC-146: Accessibility badge elements are positioned in card body', async ({ tripPage }) => {
    // REQ-005 -> AC-4; REQ-007 -> AC-2
    // Accessibility badges are optional — zero is acceptable.
    const results = await tripPage.page.evaluate(() => {
      const badges = document.querySelectorAll('.poi-card__accessible');
      const violations: string[] = [];
      badges.forEach((badge, i) => {
        const inLinks = badge.closest('.poi-card__links');
        const inBody = badge.closest('.poi-card__body');
        if (inLinks) {
          violations.push(`Accessible badge ${i}: should not be inside .poi-card__links`);
        }
        if (!inBody) {
          violations.push(`Accessible badge ${i}: should be inside .poi-card__body`);
        }
      });
      return violations;
    });
    for (const v of results) {
      expect.soft(false, v).toBe(true);
    }
  });
});
