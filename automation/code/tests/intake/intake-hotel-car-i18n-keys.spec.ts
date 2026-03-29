import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Hotel & Car Rental Assistance — Static i18n Key Validation
 *
 * TC-223: Validates that all 101 i18n keys (s6_hotel_* and s6_car_*)
 * are present and non-empty in all 12 locale files.
 * TC-305: Validates new Step 2 i18n keys (step_stay, s2_title, s2_desc).
 * TC-343: Validates renumbered step keys (s3→s8) and confirms hotel/car
 * feature keys (s6_*) are unchanged.
 *
 * QF-1 resolution: These are static file analysis tests that read JSON
 * files from disk. They do NOT interact with the browser at all. Separated
 * into their own spec file per QA Architecture Review to avoid unnecessary
 * browser launch. Playwright supports non-browser tests — the test()
 * blocks never reference `page`, so no browser context is created.
 */

const SUPPORTED_LANGUAGES = [
  'en', 'ru', 'he', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar',
] as const;

// Project root is four levels up from automation/code/tests/intake/
const projectRoot = path.resolve(__dirname, '..', '..', '..', '..');
const localesDir = path.join(projectRoot, 'locales');

// All 101 i18n keys from DD §1.7 — Hotel (57 keys) + Car (44 keys)
const REQUIRED_I18N_KEYS = [
  // Hotel header & toggle (6)
  's6_hotel_header',
  's6_hotel_toggle',
  's6_hotel_toggle_no',
  's6_hotel_toggle_no_desc',
  's6_hotel_toggle_yes',
  's6_hotel_toggle_yes_desc',
  // Hotel type (13)
  's6_hotel_type',
  's6_hotel_type_hotel',
  's6_hotel_type_boutique',
  's6_hotel_type_resort',
  's6_hotel_type_apartment',
  's6_hotel_type_aparthotel',
  's6_hotel_type_villa',
  's6_hotel_type_bnb',
  's6_hotel_type_hostel',
  's6_hotel_type_farmhouse',
  's6_hotel_type_cabin',
  's6_hotel_type_glamping',
  's6_hotel_type_houseboat',
  // Hotel location (6)
  's6_hotel_location',
  's6_hotel_loc_center',
  's6_hotel_loc_attractions',
  's6_hotel_loc_quiet',
  's6_hotel_loc_beach',
  's6_hotel_loc_transport',
  // Hotel stars (5)
  's6_hotel_stars',
  's6_hotel_stars_budget',
  's6_hotel_stars_mid',
  's6_hotel_stars_upscale',
  's6_hotel_stars_luxury',
  // Hotel amenities (13)
  's6_hotel_amenities',
  's6_hotel_amen_pool',
  's6_hotel_amen_parking',
  's6_hotel_amen_kitchen',
  's6_hotel_amen_wifi',
  's6_hotel_amen_gym',
  's6_hotel_amen_spa',
  's6_hotel_amen_ac',
  's6_hotel_amen_laundry',
  's6_hotel_amen_kids',
  's6_hotel_amen_restaurant',
  's6_hotel_amen_nonsmoking',
  's6_hotel_amen_shuttle',
  // Hotel pets (5)
  's6_hotel_pets',
  's6_hotel_pets_no',
  's6_hotel_pets_no_desc',
  's6_hotel_pets_yes',
  's6_hotel_pets_yes_desc',
  // Hotel cancellation (7)
  's6_hotel_cancellation',
  's6_hotel_cancel_free',
  's6_hotel_cancel_free_desc',
  's6_hotel_cancel_cheap',
  's6_hotel_cancel_cheap_desc',
  's6_hotel_cancel_nopref',
  's6_hotel_cancel_nopref_desc',
  // Hotel budget (1)
  's6_hotel_budget',
  // Car header & toggle (6)
  's6_car_header',
  's6_car_toggle',
  's6_car_toggle_no',
  's6_car_toggle_no_desc',
  's6_car_toggle_yes',
  's6_car_toggle_yes_desc',
  // Car category (15)
  's6_car_category',
  's6_car_cat_mini',
  's6_car_cat_economy',
  's6_car_cat_compact',
  's6_car_cat_intermediate',
  's6_car_cat_standard',
  's6_car_cat_fullsize',
  's6_car_cat_premium',
  's6_car_cat_luxury',
  's6_car_cat_suv_compact',
  's6_car_cat_suv_full',
  's6_car_cat_minivan',
  's6_car_cat_van',
  's6_car_cat_convertible',
  's6_car_cat_oversize',
  // Car transmission (4)
  's6_car_transmission',
  's6_car_trans_auto',
  's6_car_trans_manual',
  's6_car_trans_nopref',
  // Car fuel (6)
  's6_car_fuel',
  's6_car_fuel_petrol',
  's6_car_fuel_diesel',
  's6_car_fuel_hybrid',
  's6_car_fuel_electric',
  's6_car_fuel_nopref',
  // Car pickup (5)
  's6_car_pickup',
  's6_car_pickup_airport',
  's6_car_pickup_city',
  's6_car_pickup_hotel',
  's6_car_pickup_train',
  // Car extras (8)
  's6_car_extras',
  's6_car_extra_infant',
  's6_car_extra_toddler',
  's6_car_extra_booster',
  's6_car_extra_gps',
  's6_car_extra_roof',
  's6_car_extra_snow',
  's6_car_extra_driver',
  // Car budget (1)
  's6_car_budget',
] as const;

// New Step 2 i18n keys (TC-305)
const STEP2_I18N_KEYS = [
  'step_stay',
  's2_title',
  's2_desc',
] as const;

// Renumbered step i18n keys (TC-343) — keys that shifted due to Step 2 insertion
const RENUMBERED_I18N_KEYS = [
  // Step 3 (was Step 2)
  's3_title', 's3_desc',
  // Step 4 (was Step 3)
  's4_title', 's4_desc',
  // Step 5 (was Step 4)
  's5_title', 's5_desc',
  // Step 6 (was Step 5)
  's6_title', 's6_desc',
  // Step 7 (was Step 6)
  's7_title', 's7_desc', 's7_next',
  // Step 8 (was Step 7)
  's8_title', 's8_desc', 's8_edit', 's8_copy', 's8_download',
] as const;

test.describe('Hotel & Car i18n Keys — Static File Validation (TC-223)', () => {
  test('TC-223: all 101 i18n keys present in all 12 locale files', async () => {
    // Static file analysis — no browser interaction
    for (const lang of SUPPORTED_LANGUAGES) {
      const filePath = path.join(localesDir, `ui_${lang}.json`);

      let catalog: Record<string, unknown> | null = null;
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        catalog = JSON.parse(content);
      } catch {
        expect.soft(false, `ui_${lang}.json: valid JSON parse`).toBe(true);
        continue;
      }

      expect.soft(catalog, `ui_${lang}.json: parsed successfully`).not.toBeNull();
      if (!catalog) continue;

      for (const key of REQUIRED_I18N_KEYS) {
        const value = catalog[key];
        expect.soft(
          typeof value === 'string' && value.length > 0,
          `ui_${lang}.json: ${key} exists and non-empty`
        ).toBe(true);
      }
    }
  });
});

test.describe('Step 2 i18n Keys — New Keys (TC-305)', () => {
  test('TC-305: new Step 2 i18n keys present in all 12 locale files', async () => {
    // Static file analysis — no browser interaction
    for (const lang of SUPPORTED_LANGUAGES) {
      const filePath = path.join(localesDir, `ui_${lang}.json`);

      let catalog: Record<string, unknown> | null = null;
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        catalog = JSON.parse(content);
      } catch {
        expect.soft(false, `ui_${lang}.json: valid JSON parse`).toBe(true);
        continue;
      }

      expect.soft(catalog, `ui_${lang}.json: parsed successfully`).not.toBeNull();
      if (!catalog) continue;

      for (const key of STEP2_I18N_KEYS) {
        const value = catalog[key];
        expect.soft(
          typeof value === 'string' && value.length > 0,
          `ui_${lang}.json: ${key} exists and non-empty`
        ).toBe(true);
      }
    }
  });
});

test.describe('Renumbered Step i18n Keys (TC-343)', () => {
  test('TC-343: renumbered step keys present in all 12 locale files; hotel/car keys unchanged', async () => {
    // Static file analysis — no browser interaction
    for (const lang of SUPPORTED_LANGUAGES) {
      const filePath = path.join(localesDir, `ui_${lang}.json`);

      let catalog: Record<string, unknown> | null = null;
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        catalog = JSON.parse(content);
      } catch {
        expect.soft(false, `ui_${lang}.json: valid JSON parse`).toBe(true);
        continue;
      }

      expect.soft(catalog, `ui_${lang}.json: parsed successfully`).not.toBeNull();
      if (!catalog) continue;

      // Renumbered keys must exist and be non-empty
      for (const key of RENUMBERED_I18N_KEYS) {
        const value = catalog[key];
        expect.soft(
          typeof value === 'string' && value.length > 0,
          `ui_${lang}.json: ${key} exists and non-empty`
        ).toBe(true);
      }

      // Hotel/car feature keys must still exist (NOT renamed from s6_*)
      for (const key of REQUIRED_I18N_KEYS) {
        const value = catalog[key];
        expect.soft(
          typeof value === 'string' && value.length > 0,
          `ui_${lang}.json: hotel/car key ${key} still exists`
        ).toBe(true);
      }
    }
  });
});
