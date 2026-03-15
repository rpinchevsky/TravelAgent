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
  budgetTotal: string;
  pageTitlePattern: (destination: string, year: number) => string;
  fileSuffix: string;
  dayHeadingRegex: RegExp;
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
    budgetTotal: 'Итого',
    pageTitlePattern: (dest, year) => `${dest} ${year} — Семейный маршрут`,
    fileSuffix: 'ru',
    dayHeadingRegex: /^#{1,2}\s+День\s+(\d+)/,
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
    budgetTotal: 'Total',
    pageTitlePattern: (dest, year) => `${dest} ${year} — Family Itinerary`,
    fileSuffix: 'en',
    dayHeadingRegex: /^#{1,2}\s+Day\s+(\d+)/,
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
    budgetTotal: 'סה"כ',
    pageTitlePattern: (dest, year) => `${dest} ${year} — מסלול משפחתי`,
    fileSuffix: 'he',
    dayHeadingRegex: /^#{1,2}\s+יום\s+(\d+)/,
  },
};

// ────────────────────────────────────────────────────────
// Trip config interface
// ────────────────────────────────────────────────────────

export interface TripConfig {
  destination: string;
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

export function loadTripConfig(): TripConfig {
  if (_cached) return _cached;

  const projectRoot = path.resolve(__dirname, '..', '..', '..', '..');
  const tripDetailsPath = path.resolve(projectRoot, 'trip_details.md');
  const raw = fs.readFileSync(tripDetailsPath, 'utf-8');

  // Parse destination
  const destMatch = raw.match(/\*\*Destination:\*\*\s*(.+)/i);
  const destination = destMatch ? destMatch[1].trim().split(',')[0].trim() : 'Unknown';

  // Parse dates
  const arrivalMatch = raw.match(/\*\*Arrival:\*\*\s*(.+)/i);
  const departureMatch = raw.match(/\*\*Departure:\*\*\s*(.+)/i);
  if (!arrivalMatch || !departureMatch) {
    throw new Error('trip_details.md: Arrival or Departure date is missing');
  }
  const arrivalDate = new Date(arrivalMatch[1].trim());
  const departureDate = new Date(departureMatch[1].trim());

  // Calculate day count
  const msPerDay = 86400000;
  const dayCount = Math.round((departureDate.getTime() - arrivalDate.getTime()) / msPerDay) + 1;

  // Parse travelers (parents + children)
  const travelers: string[] = [];
  const parentRows = raw.match(/\|\s*(\w+)\s*\|\s*\d{4}-\d{2}-\d{2}\s*\|/g);
  if (parentRows) {
    for (const row of parentRows) {
      const m = row.match(/\|\s*(\w+)\s*\|/);
      if (m) travelers.push(m[1]);
    }
  }
  const childSection = raw.split('### Children')[1];
  if (childSection) {
    const childRows = childSection.match(/\|\s*(\w+)\s*\|\s*\d{4}-\d{2}-\d{2}\s*\|/g);
    if (childRows) {
      for (const row of childRows) {
        const m = row.match(/\|\s*(\w+)\s*\|/);
        if (m) travelers.push(m[1]);
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

  // Build excluded sections list from language labels
  const excludedSections = [
    labels.sectionLogistics,
    labels.sectionCost,
    labels.sectionPlanB,
    labels.sectionGrocery,
    labels.sectionAlongTheWay,
    labels.sectionTransfer,
    '⚠️',
    labels.sectionMornPrep,
    labels.sectionLunch,
    labels.sectionBirthdayLunch,
  ];

  const result: TripConfig = {
    destination,
    arrivalDate,
    departureDate,
    dayCount,
    travelers,
    reportingLanguage,
    labels,
    dayTitles,
    dayDates,
    tripYear,
    pageTitle: labels.pageTitlePattern(destination, tripYear),
    markdownFilename: `trip_full_${labels.fileSuffix}.md`,
    htmlFilename: `trip_full_${labels.fileSuffix}.html`,
    direction: labels.direction,
    excludedSections,
  };

  _cached = Object.freeze(result) as TripConfig;
  return _cached;
}
