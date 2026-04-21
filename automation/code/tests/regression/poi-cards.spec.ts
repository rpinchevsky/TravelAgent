import { test, expect } from '../fixtures/shared-page';
import { loadTripConfig } from '../utils/trip-config';
import { getPlaceIdsFromMarkdown } from '../utils/markdown-place-ids';

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
    // Structural section-header cards (🛒 grocery, 🎯 along-the-way) are synthetic
    // placeholders with no body text — they are already link-exempt and excluded from
    // parity counts. Exempt them from the description requirement too.
    const STRUCTURAL_TAGS = ['🛒', '🎯'];
    const count = await tripPage.poiCards.count();
    for (let i = 0; i < count; i++) {
      const card = tripPage.poiCards.nth(i);
      const tag = await card.locator('.poi-card__tag').textContent() ?? '';
      if (STRUCTURAL_TAGS.some(t => tag.includes(t))) continue;
      const desc = card.locator('.poi-card__description').first();
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

  test('TC-160: POI card descriptions must not have flex-grow (prevents layout gaps in multi-paragraph cards)', async ({ tripPage }) => {
    const violations = await tripPage.page.evaluate(() => {
      const descriptions = Array.from(document.querySelectorAll('.poi-card__description'));
      return descriptions
        .filter(el => parseFloat(getComputedStyle(el).flexGrow) > 0)
        .map(el => el.closest('.poi-card')?.querySelector('.poi-card__name')?.textContent?.trim() ?? 'unknown');
    });
    expect(
      violations,
      `POI descriptions with flex-grow > 0 (creates empty gaps):\n${violations.join('\n')}`
    ).toHaveLength(0);
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

  test('TC-161: POI descriptions and pro-tips must not contain unrendered markdown links', async ({ tripPage }) => {
    // Ensure [text](url) markdown syntax was converted to <a> tags by the renderer.
    // Raw markdown in visible text means the script forgot to call renderInlineMd().
    const violations = await tripPage.page.evaluate(() => {
      const mdLinkPattern = /\[[^\]]+\]\(https?:\/\/[^)]+\)/;
      const results: string[] = [];
      for (const el of Array.from(document.querySelectorAll('.poi-card__description, .pro-tip span'))) {
        const text = el.textContent ?? '';
        if (mdLinkPattern.test(text)) {
          const cardName = el.closest('.poi-card')?.querySelector('.poi-card__name')?.textContent?.trim() ?? 'unknown';
          const snippet = text.match(mdLinkPattern)![0].slice(0, 60);
          results.push(`${cardName}: "${snippet}"`);
        }
      }
      return results;
    });
    expect(
      violations,
      `Unrendered markdown links found in POI descriptions/pro-tips:\n${violations.join('\n')}`
    ).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Google Maps Day Mini-Map — POI Card Attribute Tests (TC-207, TC-208, TC-209)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('POI Cards — data-poi-name Attribute (TC-207)', () => {
  // TC-207: data-poi-name present and non-empty on all POI cards
  // Traces to: REQ-006 AC-2, DD §1.6d (data-poi-name always emitted), REQ-006 AC-1
  // Runs regardless of API key — attribute is always emitted.
  test('TC-207: every .poi-card must have a non-empty data-poi-name attribute', async ({ tripPage }) => {
    const count = await tripPage.poiCards.count();
    expect(count, 'POI cards must exist on the page').toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const card = tripPage.poiCards.nth(i);
      const dataName = await tripPage.getPoiCardDataName(card);
      expect.soft(
        dataName !== null && dataName.trim().length > 0,
        `POI card[${i}]: data-poi-name must be present and non-empty (got "${dataName}")`
      ).toBe(true);
    }
  });
});

test.describe('POI Cards — data-place-id Attribute (TC-208)', () => {
  // TC-208: data-place-id present only on POI cards derived from enriched POIs
  // Traces to: REQ-001 AC-1, REQ-001 AC-2, DD §1.6d, DD §1.6c
  // Spot-check: first and last available day only to avoid O(N×POIs) test time.
  // Skipped if the current trip has no **place_id:** entries in markdown.
  test('TC-208: data-place-id attribute must match markdown place_id entries (spot-check)', async ({ sharedPage }) => {
    const tripConfig = loadTripConfig();
    const placeIdMap = getPlaceIdsFromMarkdown();
    const dayNumbers = Object.keys(placeIdMap).map(Number).sort((a, b) => a - b);

    if (dayNumbers.length === 0) {
      // No place_id lines in current trip markdown — skip with message
      console.log('TC-208: No **place_id:** entries found in trip markdown — test skipped (old trip without enrichment)');
      return;
    }

    // Spot-check: first and last available day
    const sampleDays = [...new Set([dayNumbers[0], dayNumbers[dayNumbers.length - 1]])];

    for (const day of sampleDays) {
      const entries = placeIdMap[day];
      if (!entries || entries.length === 0) continue;

      // Collect all poi-card data-poi-name and data-place-id values within this day
      const dayCardData = await sharedPage.evaluate((dayNum) => {
        const daySection = document.querySelector(`#day-${dayNum}`);
        if (!daySection) return [] as Array<{ dataPoiName: string | null; dataPlaceId: string | null }>;
        const cards = Array.from(daySection.querySelectorAll('.poi-card'));
        return cards.map(card => ({
          dataPoiName: card.getAttribute('data-poi-name'),
          dataPlaceId: card.getAttribute('data-place-id'),
        }));
      }, day);

      for (const mdEntry of entries) {
        // Find the corresponding HTML card by matching data-poi-name to markdown heading
        // We do a fuzzy match: strip emoji and check if card name contains the first segment
        const mdNameClean = mdEntry.poiName.replace(/^[\p{Emoji}\p{Emoji_Presentation}\uFE0F\u200D ]+/u, '').trim();
        const matchingCard = dayCardData.find(c =>
          c.dataPoiName !== null && (
            c.dataPoiName.includes(mdNameClean) ||
            mdNameClean.includes(c.dataPoiName.split('/')[0].trim())
          )
        );

        if (!matchingCard) continue; // POI not rendered (e.g., excluded section) — skip

        if (mdEntry.placeId !== null) {
          expect.soft(
            matchingCard.dataPlaceId,
            `Day ${day} POI "${mdEntry.poiName}": data-place-id must equal "${mdEntry.placeId}" from markdown`
          ).toBe(mdEntry.placeId);
        } else {
          expect.soft(
            matchingCard.dataPlaceId,
            `Day ${day} POI "${mdEntry.poiName}": data-place-id must be absent (no **place_id:** in markdown)`
          ).toBeNull();
        }
      }
    }
  });
});

test.describe('POI Cards — data-place-id Value Format (TC-209)', () => {
  // TC-209: data-place-id values are valid Google Places IDs (heuristic format check)
  // Traces to: REQ-001 AC-3, DD §1.6c
  // Skipped if no .poi-card[data-place-id] elements found (old trip, no enrichment).
  test('TC-209: data-place-id values must match Google Places ID format', async ({ sharedPage }) => {
    const enrichedCards = sharedPage.locator('.poi-card[data-place-id]');
    const count = await enrichedCards.count();

    if (count === 0) {
      console.log('TC-209: No .poi-card[data-place-id] elements found — test skipped (no enriched POIs in current trip)');
      return;
    }

    // Relaxed format check: minimum 20 chars, alphanumeric + _ -
    // Guards against parser bugs (empty string, whitespace, truncated value).
    // Does not enforce specific prefix (ChIJ/EiA/GhIJ) to avoid false failures if
    // Google introduces new Place ID formats. See QA QF-4 recommendation.
    const placeIdPattern = /^[A-Za-z0-9_-]{20,}$/;

    for (let i = 0; i < count; i++) {
      const card = enrichedCards.nth(i);
      const placeId = await card.getAttribute('data-place-id') ?? '';
      expect.soft(
        placeIdPattern.test(placeId),
        `POI card[${i}]: data-place-id "${placeId}" does not match expected Google Places ID format (min 20 alphanumeric chars)`
      ).toBe(true);
    }
  });
});
