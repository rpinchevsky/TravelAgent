import * as fs from 'fs';
import * as path from 'path';

/**
 * Master i18n Key Registry — Single source of truth for all required locale keys.
 *
 * All i18n key validation tests import from here instead of maintaining separate
 * key lists. When a feature adds new keys, add them to ONE place.
 *
 * Organization: keys are grouped by feature domain for readability.
 */

export const SUPPORTED_LANGUAGES = [
  'en', 'ru', 'he', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar',
] as const;

export const FULLY_TRANSLATED = ['en', 'ru', 'he'] as const;

export const FALLBACK_LANGUAGES = [
  'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar',
] as const;

// Special keys that are not flat key-value strings
export const SPECIAL_KEYS = ['_items', 'months', 'days_short'] as const;

export const BASE_LANG = 'en';

// Project root is five levels up from automation/code/tests/intake/utils/
const projectRoot = path.resolve(__dirname, '..', '..', '..', '..', '..');
const localesDir = path.join(projectRoot, 'locales');

// ── Depth selector keys ──
export const DEPTH_I18N_KEYS = [
  'depth_title', 'depth_desc', 'depth_confirm', 'depth_update',
  'depth_10', 'depth_15', 'depth_20', 'depth_25', 'depth_30',
  'depth_10_time', 'depth_15_time', 'depth_20_time', 'depth_25_time', 'depth_30_time',
  'depth_recommended', 'depth_pill',
  'depth_toast_10', 'depth_toast_15', 'depth_toast_20', 'depth_toast_25', 'depth_toast_30',
] as const;

// ── Step 2 keys ──
export const STEP2_I18N_KEYS = [
  'step_stay', 's2_title', 's2_desc',
] as const;

// ── Renumbered step keys (from Step 2 insertion) ──
export const RENUMBERED_I18N_KEYS = [
  's3_title', 's3_desc',
  's4_title', 's4_desc',
  's5_title', 's5_desc',
  's6_title', 's6_desc',
  's7_title', 's7_desc', 's7_next',
  's8_title', 's8_desc', 's8_edit', 's8_copy', 's8_download',
] as const;

// ── Hotel keys (57 keys) ──
export const HOTEL_I18N_KEYS = [
  's6_hotel_header', 's6_hotel_toggle',
  's6_hotel_toggle_no', 's6_hotel_toggle_no_desc',
  's6_hotel_toggle_yes', 's6_hotel_toggle_yes_desc',
  's6_hotel_type',
  's6_hotel_type_hotel', 's6_hotel_type_boutique', 's6_hotel_type_resort',
  's6_hotel_type_apartment', 's6_hotel_type_aparthotel', 's6_hotel_type_villa',
  's6_hotel_type_bnb', 's6_hotel_type_hostel', 's6_hotel_type_farmhouse',
  's6_hotel_type_cabin', 's6_hotel_type_glamping', 's6_hotel_type_houseboat',
  's6_hotel_location',
  's6_hotel_loc_center', 's6_hotel_loc_attractions', 's6_hotel_loc_quiet',
  's6_hotel_loc_beach', 's6_hotel_loc_transport',
  's6_hotel_stars',
  's6_hotel_stars_budget', 's6_hotel_stars_mid', 's6_hotel_stars_upscale', 's6_hotel_stars_luxury',
  's6_hotel_amenities',
  's6_hotel_amen_pool', 's6_hotel_amen_parking', 's6_hotel_amen_kitchen',
  's6_hotel_amen_wifi', 's6_hotel_amen_gym', 's6_hotel_amen_spa',
  's6_hotel_amen_ac', 's6_hotel_amen_laundry', 's6_hotel_amen_kids',
  's6_hotel_amen_restaurant', 's6_hotel_amen_nonsmoking', 's6_hotel_amen_shuttle',
  's6_hotel_pets',
  's6_hotel_pets_no', 's6_hotel_pets_no_desc',
  's6_hotel_pets_yes', 's6_hotel_pets_yes_desc',
  's6_hotel_cancellation',
  's6_hotel_cancel_free', 's6_hotel_cancel_free_desc',
  's6_hotel_cancel_cheap', 's6_hotel_cancel_cheap_desc',
  's6_hotel_cancel_nopref', 's6_hotel_cancel_nopref_desc',
  's6_hotel_budget',
] as const;

// ── Car keys (44 keys) ──
export const CAR_I18N_KEYS = [
  's6_car_header', 's6_car_toggle',
  's6_car_toggle_no', 's6_car_toggle_no_desc',
  's6_car_toggle_yes', 's6_car_toggle_yes_desc',
  's6_car_category',
  's6_car_cat_mini', 's6_car_cat_economy', 's6_car_cat_compact',
  's6_car_cat_intermediate', 's6_car_cat_standard', 's6_car_cat_fullsize',
  's6_car_cat_premium', 's6_car_cat_luxury',
  's6_car_cat_suv_compact', 's6_car_cat_suv_full',
  's6_car_cat_minivan', 's6_car_cat_van', 's6_car_cat_convertible', 's6_car_cat_oversize',
  's6_car_transmission',
  's6_car_trans_auto', 's6_car_trans_manual', 's6_car_trans_nopref',
  's6_car_fuel',
  's6_car_fuel_petrol', 's6_car_fuel_diesel', 's6_car_fuel_hybrid',
  's6_car_fuel_electric', 's6_car_fuel_nopref',
  's6_car_pickup',
  's6_car_pickup_airport', 's6_car_pickup_city', 's6_car_pickup_hotel', 's6_car_pickup_train',
  's6_car_extras',
  's6_car_extra_infant', 's6_car_extra_toddler', 's6_car_extra_booster',
  's6_car_extra_gps', 's6_car_extra_roof', 's6_car_extra_snow', 's6_car_extra_driver',
  's6_car_budget',
] as const;

// ── Mix/All option keys ──
export const MIX_OPTION_I18N_KEYS = [
  'q_dine_mix', 'q_dine_mix_desc',
  'q_meal_all', 'q_meal_all_desc',
  'q_transport_mix', 'q_transport_mix_desc',
] as const;

// ── Wheelchair keys ──
export const WHEELCHAIR_I18N_KEYS = [
  's6_wheelchair',
  's6_wheelchair_no', 's6_wheelchair_no_desc',
  's6_wheelchair_yes', 's6_wheelchair_yes_desc',
] as const;

// ── Multi-select hint key ──
export const MULTISELECT_HINT_I18N_KEYS = [
  's6_multiselect_hint',
] as const;

// ── Master list: union of all groups ──
export const ALL_REQUIRED_I18N_KEYS = [
  ...DEPTH_I18N_KEYS,
  ...STEP2_I18N_KEYS,
  ...RENUMBERED_I18N_KEYS,
  ...HOTEL_I18N_KEYS,
  ...CAR_I18N_KEYS,
  ...MIX_OPTION_I18N_KEYS,
  ...WHEELCHAIR_I18N_KEYS,
  ...MULTISELECT_HINT_I18N_KEYS,
] as const;

// ── Key groups for per-feature traceability in test output ──
export const I18N_KEY_GROUPS = [
  { name: 'Depth selector', keys: DEPTH_I18N_KEYS },
  { name: 'Step 2', keys: STEP2_I18N_KEYS },
  { name: 'Renumbered steps', keys: RENUMBERED_I18N_KEYS },
  { name: 'Hotel assistance', keys: HOTEL_I18N_KEYS },
  { name: 'Car assistance', keys: CAR_I18N_KEYS },
  { name: 'Mix/All options', keys: MIX_OPTION_I18N_KEYS },
  { name: 'Wheelchair', keys: WHEELCHAIR_I18N_KEYS },
  { name: 'Multi-select hint', keys: MULTISELECT_HINT_I18N_KEYS },
] as const;

// ── Helpers ──

/** Load and parse a locale file. Returns null on failure. */
export function loadLocale(lang: string): Record<string, unknown> | null {
  const filePath = path.join(localesDir, `ui_${lang}.json`);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/** Extract non-special top-level keys from a catalog */
export function getUiKeys(catalog: Record<string, unknown>): string[] {
  return Object.keys(catalog).filter(
    (k) => !(SPECIAL_KEYS as readonly string[]).includes(k)
  );
}

/** Get the locales directory path */
export function getLocalesDir(): string {
  return localesDir;
}

/** Get the project root path */
export function getProjectRoot(): string {
  return projectRoot;
}
