import * as fs from 'fs';
import * as path from 'path';

// ────────────────────────────────────────────────────────
// Language-to-label mappings
//
// Contract:
//   - Every entry must implement ALL LanguageLabels fields (enforced by TypeScript)
//   - Section names must exactly match the rendering pipeline's output text
//   - fileSuffix must match the trip_full_{suffix}.html naming convention
//   - direction is an inherent property of the script, not user-configurable
//   - To add a new language: add one entry here — no spec files change
// ────────────────────────────────────────────────────────

export interface LanguageLabels {
  langCode: string;
  direction: 'ltr' | 'rtl';
  dayTitle: (n: number) => string;
  monthNames: string[];
  sectionPlanB: string;
  sectionLogistics: string;
  sectionCost: string;
  sectionGrocery: string;
  sectionAlongTheWay: string;
  sectionTransfer: string;
  sectionMornPrep: string;
  sectionLunch: string;
  sectionBirthdayLunch: string;
  sectionSchedule: string;
  budgetTotal: string;
  pageTitlePattern: (destination: string, year: number) => string;
  fileSuffix: string;
  dayHeadingRegex: RegExp;
  /** Maps English destination names to localized equivalents for title/heading assertions */
  destinationNames: Record<string, string>;
}

export const LANGUAGE_LABELS: Record<string, LanguageLabels> = {
  Russian: {
    langCode: 'ru',
    direction: 'ltr',
    dayTitle: (n) => `День ${n}`,
    monthNames: [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
    ],
    sectionPlanB: 'Запасной план',
    sectionLogistics: 'Логистика',
    sectionCost: 'Стоимость',
    sectionGrocery: 'Ближайший магазин',
    sectionAlongTheWay: 'По пути',
    sectionTransfer: 'Трансфер',
    sectionMornPrep: 'Утренние сборы',
    sectionLunch: 'Обед:',
    sectionBirthdayLunch: 'Праздничный обед',
    sectionSchedule: 'Расписание',
    budgetTotal: 'Итого',
    pageTitlePattern: (dest, year) => `${dest} ${year} — Семейный маршрут`,
    fileSuffix: 'ru',
    dayHeadingRegex: /^#{1,2}\s+День\s+(\d+)/,
    destinationNames: { 'Budapest': 'Будапешт' },
  },
  English: {
    langCode: 'en',
    direction: 'ltr',
    dayTitle: (n) => `Day ${n}`,
    monthNames: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ],
    sectionPlanB: 'Plan B',
    sectionLogistics: 'Logistics',
    sectionCost: 'Cost',
    sectionGrocery: 'Nearest Store',
    sectionAlongTheWay: 'Along the Way',
    sectionTransfer: 'Transfer',
    sectionMornPrep: 'Morning Prep',
    sectionLunch: 'Lunch:',
    sectionBirthdayLunch: 'Birthday Lunch',
    sectionSchedule: 'Schedule',
    budgetTotal: 'Total',
    pageTitlePattern: (dest, year) => `${dest} ${year} — Family Itinerary`,
    fileSuffix: 'en',
    dayHeadingRegex: /^#{1,2}\s+Day\s+(\d+)/,
    destinationNames: {},
  },
  Hebrew: {
    langCode: 'he',
    direction: 'rtl',
    dayTitle: (n) => `יום ${n}`,
    monthNames: [
      'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
      'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
    ],
    sectionPlanB: 'תוכנית ב׳',
    sectionLogistics: 'לוגיסטיקה',
    sectionCost: 'עלות',
    sectionGrocery: 'חנות קרובה',
    sectionAlongTheWay: 'בדרך',
    sectionTransfer: 'העברה',
    sectionMornPrep: 'הכנות בוקר',
    sectionLunch: 'ארוחת צהריים:',
    sectionBirthdayLunch: 'ארוחת יום הולדת',
    sectionSchedule: 'לוח זמנים',
    budgetTotal: 'סה"כ',
    pageTitlePattern: (dest, year) => `${dest} ${year} — מסלול משפחתי`,
    fileSuffix: 'he',
    dayHeadingRegex: /^#{1,2}\s+יום\s+(\d+)/,
    destinationNames: { 'Budapest': 'בודפשט', 'Moldova': 'מולדובה' },
  },
};

// ────────────────────────────────────────────────────────
// Trip config interface
// ────────────────────────────────────────────────────────

export interface TripConfig {
  destination: string;
  /** Destination name in the reporting language (e.g., "Будапешт" for Russian) */
  localizedDestination: string;
  arrivalDate: Date;
  departureDate: Date;
  dayCount: number;
  travelers: string[];
  reportingLanguage: string;
  labels: LanguageLabels;
  dayTitles: string[];
  dayDates: string[];
  tripYear: number;
  pageTitle: string;
  markdownFilename: string;
  htmlFilename: string;
  direction: 'ltr' | 'rtl';
  excludedSections: string[];
}

// ────────────────────────────────────────────────────────
// Loader with module-level cache (FB-5) + Object.freeze (FB-1)
// ────────────────────────────────────────────────────────

let _cached: TripConfig | null = null;
let _cachedFile: string | null = null;

export function loadTripConfig(): TripConfig {
  // Trip details filename is configurable via TRIP_DETAILS_FILE env var.
  // Defaults to 'trip_details.md' for backward compatibility.
  // Example: TRIP_DETAILS_FILE=Maryan.md npx playwright test
  const tripDetailsFile = process.env.TRIP_DETAILS_FILE || 'trip_details.md';
  if (_cached && _cachedFile === tripDetailsFile) return _cached;

  const projectRoot = path.resolve(__dirname, '..', '..', '..', '..');
  const tripDetailsPath = path.resolve(projectRoot, tripDetailsFile);
  const raw = fs.readFileSync(tripDetailsPath, 'utf-8');

  // Parse destination
  const destMatch = raw.match(/\*\*Destination:\*\*\s*(.+)/i);
  const destination = destMatch ? destMatch[1].trim().split(',')[0].trim() : 'Unknown';

  // Parse dates
  const arrivalMatch = raw.match(/\*\*Arrival:\*\*\s*(.+)/i);
  const departureMatch = raw.match(/\*\*Departure:\*\*\s*(.+)/i);
  if (!arrivalMatch || !departureMatch) {
    throw new Error(`${tripDetailsFile}: Arrival or Departure date is missing`);
  }
  const arrivalDate = new Date(arrivalMatch[1].trim());
  const departureDate = new Date(departureMatch[1].trim());

  // Calculate day count
  const msPerDay = 86400000;
  const dayCount = Math.round((departureDate.getTime() - arrivalDate.getTime()) / msPerDay) + 1;

  // Parse travelers (parents + children)
  // Supports both 2-column (Name | DOB) and 3-column (Name | Gender | DOB) table formats.
  // DOB can be YYYY-MM-DD, YYYY-MM, or YYYY.
  const travelers: string[] = [];
  const parentSection = raw.split('### Parents')[1]?.split('###')[0] || '';
  const parentNameRegex = /^\|\s*([^|]+?)\s*\|/gm;
  let parentMatch: RegExpExecArray | null;
  while ((parentMatch = parentNameRegex.exec(parentSection)) !== null) {
    const name = parentMatch[1].trim();
    // Skip table header rows (contain "Role", "Name", dashes, or are empty).
    // Note: Maryan.md uses "Role" as the first column header, but the column values
    // are actually traveler names (e.g., "maryan moshe"). The filter skips the header
    // row itself. If a future file uses actual role values (e.g., "Mother") in a
    // separate column, the parser would need structural changes.
    if (name && !name.match(/^[-\s]+$/) && !name.match(/^(Role|Name)\s*$/i)) {
      travelers.push(name.split(/\s+/)[0]); // Use first word as traveler name
    }
  }

  const childSection = raw.split('### Children')[1]?.split(/^##\s/m)[0] || '';
  if (childSection) {
    const childNameRegex = /^\|\s*([^|]+?)\s*\|/gm;
    let childMatch: RegExpExecArray | null;
    while ((childMatch = childNameRegex.exec(childSection)) !== null) {
      const name = childMatch[1].trim();
      if (name && !name.match(/^[-\s]+$/) && !name.match(/^(Name)\s*$/i)) {
        travelers.push(name.split(/\s+/)[0]);
      }
    }
  }

  // Parse reporting language
  const reportingMatch = raw.match(/\*\*Reporting language:\*\*\s*(.+)/i);
  const reportingLanguage = reportingMatch ? reportingMatch[1].trim() : 'English';

  // Get language labels — fail-fast with clear message (FB-1)
  const labels = LANGUAGE_LABELS[reportingLanguage];
  if (!labels) {
    throw new Error(
      `No label mapping for reporting language "${reportingLanguage}". ` +
      `Add an entry to LANGUAGE_LABELS in trip-config.ts. ` +
      `Supported: ${Object.keys(LANGUAGE_LABELS).join(', ')}`
    );
  }

  // Generate day titles and dates
  const dayTitles: string[] = [];
  const dayDates: string[] = [];
  for (let i = 0; i < dayCount; i++) {
    dayTitles.push(labels.dayTitle(i));
    const d = new Date(arrivalDate.getTime() + i * msPerDay);
    const day = d.getDate();
    const month = labels.monthNames[d.getMonth()];
    dayDates.push(`${day} ${month}`);
  }

  const tripYear = arrivalDate.getFullYear();
  const localizedDestination = labels.destinationNames[destination] || destination;

  // Build excluded sections list from language labels
  const excludedSections = [
    labels.sectionLogistics,
    labels.sectionCost,
    labels.sectionPlanB,
    labels.sectionGrocery,
    labels.sectionAlongTheWay,
    labels.sectionTransfer,
    '⚠️',
    '🚗',
    labels.sectionMornPrep,
    labels.sectionLunch,
    labels.sectionBirthdayLunch,
    labels.sectionSchedule,
  ];

  const result: TripConfig = {
    destination,
    localizedDestination,
    arrivalDate,
    departureDate,
    dayCount,
    travelers,
    reportingLanguage,
    labels,
    dayTitles,
    dayDates,
    tripYear,
    pageTitle: labels.pageTitlePattern(localizedDestination, tripYear),
    markdownFilename: `trip_full_${labels.fileSuffix}.md`,
    htmlFilename: `trip_full_${labels.fileSuffix}.html`,
    direction: labels.direction,
    excludedSections,
  };

  _cachedFile = tripDetailsFile;
  _cached = Object.freeze(result) as TripConfig;
  return _cached;
}
