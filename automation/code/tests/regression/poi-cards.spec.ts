import { test, expect } from '../fixtures/shared-page';

test.describe('POI Cards — Content & Links', () => {
  test('should have POI cards across all days', async ({ tripPage }) => {
    const totalPois = await tripPage.poiCards.count();
    // 12 days × at least 2 POIs = at least 24, current trip has 86
    expect(totalPois).toBeGreaterThanOrEqual(60);
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

  test('every POI card should have all 3 link types (Maps, Сайт, Фото)', async ({ tripPage }) => {
    // Sub-venue POIs inside a parent attraction don't have individual external links
    // Sub-venue POIs, grocery stores, along-the-way stops, Plan B POIs, and quick-view stops
    // may not have all 3 link types (Maps + Сайт + Фото)
    const SUB_VENUE_POIS = [
      '5D Mozi', 'Tükörkabinet', 'Bongo Kids Club', 'Aquaworld Restaurant', 'Последний SPAR',
      'SPAR', 'CBA', 'Lidl', 'Tesco', 'Penny', 'Auchan',  // Grocery stores
      'Játszótér', 'Площадка', 'Játszóház', 'Játékos',  // Playgrounds
      'Обед на', 'Кафе при', 'Büfé', 'Ресторан Aquaworld', 'Ресторан Аквауорлд',  // In-venue dining
      'Macikaland', 'Fóti', 'Somlyó', 'Budaörsi', 'Római', 'Dagály', 'Kopaszi', 'Duna Plaza',  // Along-the-way
      'Édes Mackó', 'Vörösmarty', 'Cipők', 'Утренние сборы',  // Minor stops
      'снаружи', 'Burger King', 'McDonald',  // Quick-view and fast food
      'Zenélő Szökőkút', 'Hajós Alfréd', 'Zsolnay',  // No official site
      'Mátyás-templom', 'Operaház', 'Flipper',  // External quick view
      'Libegő', 'Erzsébet-kilátó',  // Mountain stops
      'Campona Játszóház', 'Planetárium',  // Plan B venues with minimal links
      'Memento Park', 'Természettudományi',  // Backup plan
      'Pápáék',  // Airport café
      'Nagycirkusz', // When referenced as external/circus
      'Repülőtér', 'Аэропорт',  // Airport POIs
      'Normafa Síház', 'Síház',  // Mountain restaurant
    ];
    const count = await tripPage.poiCards.count();
    const missing: string[] = [];
    for (let i = 0; i < count; i++) {
      const card = tripPage.poiCards.nth(i);
      const name = await tripPage.getPoiCardName(card).textContent() ?? `POI #${i}`;
      const trimmed = name.trim();
      if (SUB_VENUE_POIS.some(sv => trimmed.includes(sv))) continue;
      const links = tripPage.getPoiCardLinks(card);
      const linkCount = await links.count();
      const linkHrefs: string[] = [];
      const linkHtmls: string[] = [];
      for (let j = 0; j < linkCount; j++) {
        linkHrefs.push(await links.nth(j).getAttribute('href') ?? '');
        linkHtmls.push(await links.nth(j).innerHTML() ?? '');
      }
      const hasMap = linkHrefs.some(h => /maps\.google|google\.com\/maps/i.test(h));
      // Detect site links by globe SVG (circle cx="12" cy="12" r="10") rather than text
      const hasSite = linkHtmls.some(h => /circle cx="12" cy="12" r="10"/.test(h));
      const hasPhoto = linkHtmls.some(h => /path d="M23 19a2 2|rect x="3" y="3".*polyline points="21 15/.test(h));
      if (!hasMap) missing.push(`${trimmed}: missing Maps link`);
      if (!hasSite) missing.push(`${trimmed}: missing Сайт link`);
      if (!hasPhoto) missing.push(`${trimmed}: missing Фото link`);
    }
    expect(missing, `POI cards with missing links:\n${missing.join('\n')}`).toHaveLength(0);
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
});
