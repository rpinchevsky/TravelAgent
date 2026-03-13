import * as fs from 'fs';
import * as path from 'path';

/**
 * Script detection patterns mapped by language name.
 * Each entry defines a regex that matches characters unique to that script,
 * and a human-readable script label for error messages.
 */
const SCRIPT_MAP: Record<string, { regex: RegExp; script: string }> = {
  // Cyrillic-based languages
  Russian:    { regex: /[\u0400-\u04FF]/, script: 'Cyrillic' },
  Ukrainian:  { regex: /[\u0400-\u04FF]/, script: 'Cyrillic' },
  Bulgarian:  { regex: /[\u0400-\u04FF]/, script: 'Cyrillic' },
  Serbian:    { regex: /[\u0400-\u04FF]/, script: 'Cyrillic' },
  Belarusian: { regex: /[\u0400-\u04FF]/, script: 'Cyrillic' },

  // Latin-based languages
  Hungarian:  { regex: /[A-Za-zÀ-ÖØ-öø-ÿŐőŰű]/, script: 'Latin' },
  English:    { regex: /[A-Za-z]/, script: 'Latin' },
  German:     { regex: /[A-Za-zÀ-ÖØ-öø-ÿẞß]/, script: 'Latin' },
  French:     { regex: /[A-Za-zÀ-ÖØ-öø-ÿŒœ]/, script: 'Latin' },
  Spanish:    { regex: /[A-Za-zÀ-ÖØ-öø-ÿ¡¿ñÑ]/, script: 'Latin' },
  Italian:    { regex: /[A-Za-zÀ-ÖØ-öø-ÿ]/, script: 'Latin' },
  Portuguese: { regex: /[A-Za-zÀ-ÖØ-öø-ÿ]/, script: 'Latin' },
  Czech:      { regex: /[A-Za-zÀ-ÖØ-öø-ÿěščřžýáíéůúďťň]/, script: 'Latin' },
  Polish:     { regex: /[A-Za-zÀ-ÖØ-öø-ÿąćęłńóśźż]/, script: 'Latin' },
  Romanian:   { regex: /[A-Za-zÀ-ÖØ-öø-ÿăâîșț]/, script: 'Latin' },
  Croatian:   { regex: /[A-Za-zÀ-ÖØ-öø-ÿčćžšđ]/, script: 'Latin' },
  Turkish:    { regex: /[A-Za-zÀ-ÖØ-öø-ÿğışçüö]/, script: 'Latin' },
  Dutch:      { regex: /[A-Za-zÀ-ÖØ-öø-ÿ]/, script: 'Latin' },

  // CJK languages
  Chinese:    { regex: /[\u4E00-\u9FFF]/, script: 'CJK' },
  Japanese:   { regex: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/, script: 'Kana/Kanji' },
  Korean:     { regex: /[\uAC00-\uD7AF\u1100-\u11FF]/, script: 'Hangul' },

  // Other scripts
  Arabic:     { regex: /[\u0600-\u06FF]/, script: 'Arabic' },
  Hebrew:     { regex: /[\u0590-\u05FF]/, script: 'Hebrew' },
  Greek:      { regex: /[\u0370-\u03FF]/, script: 'Greek' },
  Thai:       { regex: /[\u0E00-\u0E7F]/, script: 'Thai' },
  Hindi:      { regex: /[\u0900-\u097F]/, script: 'Devanagari' },
  Georgian:   { regex: /[\u10A0-\u10FF]/, script: 'Georgian' },
  Armenian:   { regex: /[\u0530-\u058F]/, script: 'Armenian' },
};

export interface LanguageValidator {
  language: string;
  script: string;
  regex: RegExp;
}

export interface PoiLanguageConfig {
  poiLanguages: LanguageValidator[];
  reportingLanguage: string;
}

/**
 * Reads trip_details.json and returns language validators for poi_languages.
 * Throws if a configured language has no script mapping.
 */
export function loadPoiLanguageConfig(): PoiLanguageConfig {
  const projectRoot = path.resolve(__dirname, '..', '..', '..', '..');
  const tripDetailsPath = path.resolve(projectRoot, 'trip_details.json');
  const raw = fs.readFileSync(tripDetailsPath, 'utf-8');
  const tripDetails = JSON.parse(raw);

  const poiLangs: string[] = tripDetails.language_preference?.poi_languages ?? [];
  const reportingLang: string = tripDetails.language_preference?.reporting_language ?? 'English';

  if (poiLangs.length === 0) {
    throw new Error('trip_details.json: language_preference.poi_languages is empty or missing');
  }

  const validators: LanguageValidator[] = poiLangs.map(lang => {
    const entry = SCRIPT_MAP[lang];
    if (!entry) {
      throw new Error(
        `No script mapping for language "${lang}". ` +
        `Supported: ${Object.keys(SCRIPT_MAP).join(', ')}`
      );
    }
    return { language: lang, script: entry.script, regex: entry.regex };
  });

  return { poiLanguages: validators, reportingLanguage: reportingLang };
}

/**
 * Returns true if all configured poi_languages are detected in the text.
 * Uses distinct script groups — if two languages share a script (e.g. English + Hungarian),
 * only one needs to match that script.
 */
export function textContainsAllLanguages(text: string, validators: LanguageValidator[]): boolean {
  return validators.every(v => v.regex.test(text));
}

/**
 * Returns the list of languages missing from the text.
 */
export function findMissingLanguages(text: string, validators: LanguageValidator[]): string[] {
  return validators
    .filter(v => !v.regex.test(text))
    .map(v => `${v.language} (${v.script})`);
}

/**
 * Checks whether two or more distinct scripts are required by the poi_languages config.
 * If all languages use the same script, separator validation is not meaningful.
 */
export function requiresMultipleScripts(validators: LanguageValidator[]): boolean {
  const uniqueScripts = new Set(validators.map(v => v.script));
  return uniqueScripts.size > 1;
}
