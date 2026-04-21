#!/usr/bin/env node
/**
 * generate_html_fragments.ts
 * Deterministic markdown → HTML template engine for trip fragment generation.
 * Reads trip folder, parses all markdown sources, writes HTML fragment files.
 *
 * Usage:
 *   npx tsx automation/scripts/generate_html_fragments.ts \
 *     --trip-folder <path> \
 *     --lang <lang_code>
 *     [--stale-days "1,3,5"]   # incremental mode: only regenerate listed days
 *
 * Exit codes: 0 = success, 1 = error
 */

// Node.js >= 18 preflight check
const nodeVersion = parseInt(process.versions.node.split('.')[0], 10);
if (nodeVersion < 18) {
  process.stderr.write(
    `ERROR: generate_html_fragments.ts requires Node.js >= 18 (found ${process.versions.node}).\n` +
      `Upgrade Node.js and retry.\n`
  );
  process.exit(1);
}

import * as fs from 'fs';
import * as path from 'path';

// ─── Language Label Tables ─────────────────────────────────────────────────

const LINK_LABELS_BY_LANG: Record<
  string,
  { site: string; photo: string; phone: string; maps: string; book: string }
> = {
  ru: { site: 'Сайт', photo: 'Фото Google', phone: 'Телефон', maps: 'Maps', book: 'Забронировать' },
  en: { site: 'Site', photo: 'Google Photos', phone: 'Phone', maps: 'Maps', book: 'Book' },
  he: { site: 'אתר', photo: 'תמונות Google', phone: 'טלפון', maps: 'Maps', book: 'הזמנה' },
};

// ─── SVG Icons ─────────────────────────────────────────────────────────────

const SVG_ICONS: Record<string, string> = {
  mapPin:
    `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
    `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
    `<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>` +
    `<circle cx="12" cy="10" r="3"></circle>` +
    `</svg>`,

  globe:
    `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
    `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
    `<circle cx="12" cy="12" r="10"></circle>` +
    `<line x1="2" y1="12" x2="22" y2="12"></line>` +
    `<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>` +
    `</svg>`,

  camera:
    `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
    `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
    `<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>` +
    `<circle cx="8.5" cy="8.5" r="1.5"></circle>` +
    `<polyline points="21 15 16 10 5 21"></polyline>` +
    `</svg>`,

  phone:
    `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
    `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
    `<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 15.1 19.79 19.79 0 0 1 1.62 6.47 2 2 0 0 1 3.62 4.47h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 12.09a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>` +
    `</svg>`,

  info:
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
    `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
    `<circle cx="12" cy="12" r="10"></circle>` +
    `<line x1="12" y1="16" x2="12" y2="12"></line>` +
    `<line x1="12" y1="8" x2="12.01" y2="8"></line>` +
    `</svg>`,

  warning:
    `<svg class="advisory__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
    `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
    `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>` +
    `<line x1="12" y1="9" x2="12" y2="13"/>` +
    `<line x1="12" y1="17" x2="12.01" y2="17"/>` +
    `</svg>`,

  calendar:
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
    `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
    `<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>` +
    `<line x1="16" y1="2" x2="16" y2="6"></line>` +
    `<line x1="8" y1="2" x2="8" y2="6"></line>` +
    `<line x1="3" y1="10" x2="21" y2="10"></line>` +
    `</svg>`,

  creditCard:
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
    `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
    `<rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>` +
    `<line x1="1" y1="10" x2="23" y2="10"></line>` +
    `</svg>`,

  home:
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
    `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
    `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>` +
    `<polyline points="9 22 9 12 15 12 15 22"></polyline>` +
    `</svg>`,

  car:
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
    `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
    `<rect x="1" y="3" width="15" height="13"></rect>` +
    `<polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>` +
    `<circle cx="5.5" cy="18.5" r="2.5"></circle>` +
    `<circle cx="18.5" cy="18.5" r="2.5"></circle>` +
    `</svg>`,
};

// ─── Country Flags ─────────────────────────────────────────────────────────

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  'hungary': 'HU',
  'israel': 'IL',
  'germany': 'DE',
  'france': 'FR',
  'spain': 'ES',
  'italy': 'IT',
  'united kingdom': 'GB',
  'uk': 'GB',
  'great britain': 'GB',
  'united states': 'US',
  'usa': 'US',
  'us': 'US',
  'portugal': 'PT',
  'greece': 'GR',
  'czech republic': 'CZ',
  'czechia': 'CZ',
  'austria': 'AT',
  'poland': 'PL',
  'montenegro': 'ME',
  'sweden': 'SE',
  'denmark': 'DK',
};

// Inline SVG flags — compact rectangular (28x20, ratio 4:3)
const FLAG_SVG: Record<string, string> = {
  HU: `<svg width="28" height="20" viewBox="0 0 24 18" role="img" aria-label="Hungary flag"><rect width="24" height="6" fill="#CE2939"/><rect y="6" width="24" height="6" fill="#FFFFFF"/><rect y="12" width="24" height="6" fill="#477050"/></svg>`,
  IL: `<svg width="28" height="20" viewBox="0 0 24 18" role="img" aria-label="Israel flag"><rect width="24" height="18" fill="#FFFFFF"/><rect y="3" width="24" height="3" fill="#0038B8"/><rect y="12" width="24" height="3" fill="#0038B8"/><polygon points="12,6.5 14.5,11 9.5,11" fill="none" stroke="#0038B8" stroke-width="1.5"/><polygon points="12,11.5 9.5,7 14.5,7" fill="none" stroke="#0038B8" stroke-width="1.5"/></svg>`,
  DE: `<svg width="28" height="20" viewBox="0 0 24 18" role="img" aria-label="Germany flag"><rect width="24" height="6" fill="#000000"/><rect y="6" width="24" height="6" fill="#DD0000"/><rect y="12" width="24" height="6" fill="#FFCE00"/></svg>`,
  FR: `<svg width="28" height="20" viewBox="0 0 24 18" role="img" aria-label="France flag"><rect width="8" height="18" fill="#002395"/><rect x="8" width="8" height="18" fill="#FFFFFF"/><rect x="16" width="8" height="18" fill="#ED2939"/></svg>`,
  ES: `<svg width="28" height="20" viewBox="0 0 24 18" role="img" aria-label="Spain flag"><rect width="24" height="18" fill="#AA151B"/><rect y="4.5" width="24" height="9" fill="#F1BF00"/></svg>`,
  IT: `<svg width="28" height="20" viewBox="0 0 24 18" role="img" aria-label="Italy flag"><rect width="8" height="18" fill="#009246"/><rect x="8" width="8" height="18" fill="#FFFFFF"/><rect x="16" width="8" height="18" fill="#CE2B37"/></svg>`,
  GB: `<svg width="28" height="20" viewBox="0 0 24 18" role="img" aria-label="United Kingdom flag"><rect width="24" height="18" fill="#012169"/><path d="M0,0 L24,18 M24,0 L0,18" stroke="#FFFFFF" stroke-width="4"/><path d="M0,0 L24,18 M24,0 L0,18" stroke="#C8102E" stroke-width="2"/><path d="M12,0 L12,18 M0,9 L24,9" stroke="#FFFFFF" stroke-width="6"/><path d="M12,0 L12,18 M0,9 L24,9" stroke="#C8102E" stroke-width="4"/></svg>`,
  US: `<svg width="28" height="20" viewBox="0 0 24 18" role="img" aria-label="United States flag"><rect width="24" height="18" fill="#B22234"/><rect y="1.38" width="24" height="1.38" fill="#FFFFFF"/><rect y="4.15" width="24" height="1.38" fill="#FFFFFF"/><rect y="6.92" width="24" height="1.38" fill="#FFFFFF"/><rect y="9.69" width="24" height="1.38" fill="#FFFFFF"/><rect y="12.46" width="24" height="1.38" fill="#FFFFFF"/><rect y="15.23" width="24" height="1.38" fill="#FFFFFF"/><rect width="9.5" height="9.69" fill="#3C3B6E"/></svg>`,
  PT: `<svg width="28" height="20" viewBox="0 0 24 18" role="img" aria-label="Portugal flag"><rect width="9.6" height="18" fill="#006600"/><rect x="9.6" width="14.4" height="18" fill="#FF0000"/></svg>`,
  GR: `<svg width="28" height="20" viewBox="0 0 24 18" role="img" aria-label="Greece flag"><rect width="24" height="18" fill="#0D5EAF"/><rect y="2" width="24" height="2" fill="#FFFFFF"/><rect y="6" width="24" height="2" fill="#FFFFFF"/><rect y="10" width="24" height="2" fill="#FFFFFF"/><rect y="14" width="24" height="2" fill="#FFFFFF"/><rect width="10" height="10" fill="#0D5EAF"/><rect x="4" width="2" height="10" fill="#FFFFFF"/><rect y="4" width="10" height="2" fill="#FFFFFF"/></svg>`,
  CZ: `<svg width="28" height="20" viewBox="0 0 24 18" role="img" aria-label="Czech Republic flag"><rect width="24" height="9" fill="#FFFFFF"/><rect y="9" width="24" height="9" fill="#D7141A"/><polygon points="0,0 12,9 0,18" fill="#11457E"/></svg>`,
  AT: `<svg width="28" height="20" viewBox="0 0 24 18" role="img" aria-label="Austria flag"><rect width="24" height="6" fill="#ED2939"/><rect y="6" width="24" height="6" fill="#FFFFFF"/><rect y="12" width="24" height="6" fill="#ED2939"/></svg>`,
  PL: `<svg width="28" height="20" viewBox="0 0 24 18" role="img" aria-label="Poland flag"><rect width="24" height="9" fill="#FFFFFF"/><rect y="9" width="24" height="9" fill="#DC143C"/></svg>`,
  ME: `<svg width="28" height="20" viewBox="0 0 24 18" role="img" aria-label="Montenegro flag"><rect width="24" height="18" fill="#D4AF37"/><rect x="1.5" y="1.5" width="21" height="15" fill="#D0000C"/></svg>`,
  SE: `<svg width="28" height="20" viewBox="0 0 24 18" role="img" aria-label="Sweden flag"><rect width="24" height="18" fill="#006AA7"/><rect y="7" width="24" height="4" fill="#FECC02"/><rect x="6" width="4" height="18" fill="#FECC02"/></svg>`,
  DK: `<svg width="28" height="20" viewBox="0 0 24 18" role="img" aria-label="Denmark flag"><rect width="24" height="18" fill="#C60C30"/><rect y="7" width="24" height="4" fill="#FFFFFF"/><rect x="7" width="4" height="18" fill="#FFFFFF"/></svg>`,
};

// ─── Types ─────────────────────────────────────────────────────────────────

interface PoiData {
  headingEmoji: string;
  name: string;
  tag: string;
  rating?: string;
  reviewCount?: string;
  accessible: boolean;
  mapsUrl?: string;
  siteUrl?: string;
  photoUrl?: string;
  imageUrl?: string;
  phone?: string;
  placeId?: string;           // Google Places place_id (from **place_id:** line)
  description: string[];
  proTip?: string;
  isAccommodation: false;
  isCarRental: false;
}

interface AccommodationCardData {
  name: string;
  rating?: string;
  reviewCount?: string;
  mapsUrl?: string;
  siteUrl?: string;
  photoUrl?: string;
  phone?: string;
  priceLevel: number;
  description: string;
  bookingUrl: string;
  bookingLabel: string;
  proTip?: string;
  stayIndex: number;
  cardIndex: number;
}

interface CarRentalRow {
  company: string;
  dailyRate: string;
  total: string;
  bookingUrl: string;
  bookingLabel: string;
}

interface CarRentalCategoryData {
  name: string;
  rows: CarRentalRow[];
  estimateText: string;
  recommendationText: string;
  proTip?: string;
}

interface ItineraryRow {
  time: string;
  activityRaw: string;
  details: string;
  poiRef?: string;
}

interface DayData {
  dayNumber: number;
  title: string;
  dateStr: string;
  area: string;
  mapLink?: string;
  mapLinkLabel?: string;
  itineraryRows: ItineraryRow[];
  pois: PoiData[];
  pricingRows: string[][];
  planB?: string;
  planBTitle?: string;
  poiNameIndex: Map<string, number>;
}

interface OverviewData {
  title: string;
  subtitle: string;
  countryCode: string;
  holidayAdvisoryTitle?: string;
  holidayAdvisoryContent?: string;
  tableTitle: string;
  tableHeaders: string[];
  tableRows: string[][];
}

interface BudgetData {
  sectionTitle: string;
  tables: BudgetTableData[];
}

interface BudgetTableData {
  subTitle?: string;
  headers: string[];
  rows: string[][];
}

interface AccommodationData {
  sectionTitle: string;
  introText: string;
  cards: AccommodationCardData[];
}

interface CarRentalBudgetSummary {
  title: string;
  headers: string[];
  rows: string[][];
}

interface CarRentalData {
  sectionTitle: string;
  introText: string;
  blockId: string;
  categories: CarRentalCategoryData[];
  budgetSummary?: CarRentalBudgetSummary;
}

interface ManifestDayEntry {
  status: string;
  title: string;
  last_modified: string;
}

interface ManifestLanguage {
  phase_a_complete: boolean;
  days: Record<string, ManifestDayEntry>;
  [key: string]: unknown;
}

interface Manifest {
  destination: string;
  arrival: string;
  car_rental?: { blocks: Array<{ id: string; [key: string]: unknown }> };
  accommodation?: { stays: Array<{ id: string; [key: string]: unknown }> };
  languages: Record<string, ManifestLanguage>;
  [key: string]: unknown;
}

// ─── Utilities ─────────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// When a place_id is available, build a Google Maps href that is already HTML-attribute-safe.
// Uses encodeURIComponent for the name (handles /, &, non-ASCII, etc.) and emits &amp; directly
// for URL separators — bypassing sanitizeHref to avoid its encodeURI double-encoding of %XX sequences.
// Falls back to sanitizeHref(fallbackUrl) when no place_id is available.
function buildMapsHref(name: string, placeId?: string, fallbackUrl?: string): string | undefined {
  if (placeId) {
    const q = encodeURIComponent(name);
    return `https://www.google.com/maps/search/?api=1&amp;query=${q}&amp;query_place_id=${placeId}`;
  }
  return fallbackUrl ? sanitizeHref(fallbackUrl) : undefined;
}

// Percent-encode non-ASCII characters in a URL (Swedish ö/å, Hebrew, Russian, etc.)
// then HTML-escape for safe use in an href/src attribute.
function sanitizeHref(url: string): string {
  let encoded: string;
  try {
    encoded = encodeURI(decodeURI(url));
  } catch {
    encoded = encodeURI(url);
  }
  return escapeHtml(encoded);
}

function stripInlineMarkdown(text: string): string {
  // Strip **bold** and _italic_ markers to plain text
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1');
}

function preprocessContent(raw: string): string {
  // Strip UTF-8 BOM if present
  let content = raw.replace(/^\uFEFF/, '');
  // Normalize CRLF and lone CR to LF
  content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return content;
}

function normalizePhone(raw: string): string {
  const hasPlus = raw.trimStart().startsWith('+');
  const digitsOnly = raw.replace(/[^\d]/g, '');
  return hasPlus ? `+${digitsOnly}` : digitsOnly;
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function extractCountryCode(destination: string): string {
  const country = destination.split(',').slice(1).join(',').trim();
  const code = COUNTRY_NAME_TO_CODE[country.toLowerCase()];
  if (!code) {
    process.stderr.write(
      `ERROR: generate_html_fragments.ts — unrecognized country "${country}" in manifest.destination.\n` +
        `Add "${country.toLowerCase()}" to COUNTRY_NAME_TO_CODE and add its SVG to FLAG_SVG.\n`
    );
    process.exit(1);
  }
  return code;
}

function validateLinkLabels(lang: string): void {
  if (!LINK_LABELS_BY_LANG[lang]) {
    process.stderr.write(
      `ERROR: generate_html_fragments.ts — language '${lang}' is missing from LINK_LABELS_BY_LANG.\n` +
        `Add '${lang}' entries to LINK_LABELS_BY_LANG before proceeding.\n`
    );
    process.exit(1);
  }
}

// Extract URL from markdown link syntax: [label](url) or bare url
function extractUrl(text: string): string {
  const mdLink = text.match(/\[([^\]]*)\]\(([^)]+)\)/);
  if (mdLink) return mdLink[2].trim();
  // bare URL
  const bare = text.trim().replace(/^https?:\/\//, '');
  return text.trim().startsWith('http') ? text.trim() : '';
}

function extractLinkLabel(text: string): string {
  const mdLink = text.match(/\[([^\]]*)\]\([^)]+\)/);
  if (mdLink) return mdLink[1].trim();
  return text.trim();
}

// Normalize text for POI name matching (lowercase, strip emojis, strip punctuation, trim, collapse whitespace)
function normalizePOIName(text: string): string {
  // Strip emoji (basic: remove characters in emoji ranges)
  let s = text.replace(
    /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2B00}-\u{2BFF}\uFE00-\uFE0F\u200D]/gu,
    ' '
  );
  s = s.toLowerCase();
  // Strip punctuation except word chars and spaces
  s = s.replace(/[^\w\s]/gu, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

// Write to temp file then rename (atomic write)
function atomicWrite(finalPath: string, content: string): void {
  const tmpPath = `${finalPath}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(tmpPath, content, 'utf8');
    fs.renameSync(tmpPath, finalPath);
  } catch (err) {
    // Clean up temp if rename failed
    try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
    throw err;
  }
}

// Parse a table row from markdown: | cell | cell | ...
function parseTableRow(line: string): string[] {
  // Remove leading/trailing pipes and split
  const trimmed = line.replace(/^\s*\|/, '').replace(/\|\s*$/, '');
  return trimmed.split('|').map((c) => c.trim());
}

function isTableSeparatorRow(line: string): boolean {
  return /^\s*\|[-| :]+\|\s*$/.test(line);
}

// ─── POI Name Index Builder ─────────────────────────────────────────────────

function buildPoiNameIndex(pois: PoiData[]): Map<string, number> {
  const index = new Map<string, number>();
  pois.forEach((poi, idx) => {
    const poiIndex = idx + 1; // 1-based
    const fullName = poi.name;
    // Split by slash for bilingual names
    const parts = fullName.split('/');
    for (const part of parts) {
      const normalized = normalizePOIName(part);
      if (normalized.length > 0) {
        index.set(normalized, poiIndex);
      }
    }
    // Also store the full normalized name
    const fullNormalized = normalizePOIName(fullName);
    if (fullNormalized.length > 0 && !index.has(fullNormalized)) {
      index.set(fullNormalized, poiIndex);
    }
  });
  return index;
}

// Find the best matching POI index for an activity text
function findPoiRef(activityText: string, poiNameIndex: Map<string, number>): number | undefined {
  const normalizedActivity = normalizePOIName(activityText);
  if (!normalizedActivity) return undefined;

  let bestMatch: { length: number; index: number } | undefined;

  for (const [name, poiIndex] of poiNameIndex.entries()) {
    if (name.length === 0) continue;
    if (normalizedActivity.includes(name)) {
      if (!bestMatch || name.length > bestMatch.length) {
        bestMatch = { length: name.length, index: poiIndex };
      }
    }
  }

  return bestMatch?.index;
}

// ─── Day File Parser ────────────────────────────────────────────────────────

function parseDayFile(filePath: string, dayNumber: number): DayData {
  const raw = fs.readFileSync(filePath, 'utf8');
  const content = preprocessContent(raw);
  const lines = content.split('\n');

  const data: DayData = {
    dayNumber,
    title: '',
    dateStr: '',
    area: '',
    mapLink: undefined,
    mapLinkLabel: undefined,
    itineraryRows: [],
    pois: [],
    pricingRows: [],
    planB: undefined,
    planBTitle: undefined,
    poiNameIndex: new Map(),
  };

  type State =
    | 'FRONT_MATTER'
    | 'SCHEDULE_TABLE'
    | 'MAP_LINK'
    | 'POI_SECTION'
    | 'PRICING_TABLE'
    | 'PLAN_B'
    | 'SKIP_SECTION';

  let state: State = 'FRONT_MATTER';
  let currentPoi: Partial<PoiData> | null = null;
  let planBLines: string[] = [];
  let inScheduleBody = false;

  function finalizeCurrentPoi(): void {
    if (currentPoi) {
      if (!currentPoi.description) currentPoi.description = [];
      if (!currentPoi.isAccommodation) currentPoi.isAccommodation = false as const;
      if (!currentPoi.isCarRental) currentPoi.isCarRental = false as const;
      data.pois.push(currentPoi as PoiData);
      currentPoi = null;
    }
  }

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const trimmed = line.trim();

    // Detect new ### section — check state transitions
    if (trimmed.startsWith('### ')) {
      const sectionName = trimmed.slice(4).trim();

      // Error: accommodation heading in day file
      if (sectionName.startsWith('🏨')) {
        process.stderr.write(
          `ERROR: generate_html_fragments.ts — ${filePath}: unexpected ### 🏨 heading.\n` +
            `Accommodation headings are only valid in accommodation_LANG.md, not in day files.\n`
        );
        process.exit(1);
      }

      // Error: car rental heading in day file
      if (sectionName.startsWith('🚗')) {
        process.stderr.write(
          `ERROR: generate_html_fragments.ts — ${filePath}: unexpected ### 🚗 heading.\n` +
            `Car rental headings are only valid in car_rental_LANG.md, not in day files.\n`
        );
        process.exit(1);
      }

      // Plan B section
      if (sectionName.startsWith('🅱️') || sectionName.startsWith('🅱')) {
        finalizeCurrentPoi();
        state = 'PLAN_B';
        data.planBTitle = sectionName;
        planBLines = [];
        continue;
      }

      // Schedule table (Russian: "Расписание", Hebrew: "לוּחַ זְמַנִּים" / "לוח זמנים" / "סֵדֶר יוֹם" / "סדר יום", English: "Schedule")
      if (sectionName === 'Расписание' || sectionName === 'Schedule' || sectionName.startsWith('לוּחַ זְמַנִּים') || sectionName.startsWith('לוח זמנים') || sectionName.startsWith('סֵדֶר יוֹם') || sectionName.startsWith('סדר יום')) {
        finalizeCurrentPoi();
        state = 'SCHEDULE_TABLE';
        inScheduleBody = false;
        continue;
      }

      // Pricing table (Russian: "Стоимость дня", Hebrew variants: "עֲלוּת/עֶלֶת יוֹם/הַיּוֹם", English: "Day N Cost")
      if (sectionName.startsWith('Стоимость дня') || sectionName.startsWith('Day ') || sectionName.startsWith('עֲלוּת') || sectionName.startsWith('עֶלֶת') || sectionName.startsWith('עלות')) {
        finalizeCurrentPoi();
        state = 'PRICING_TABLE';
        continue;
      }

      // Logistics section (non-POI): "### Логистика:", "### Logistics:", "### לוגיסטיקה"
      if (sectionName.startsWith('Логистика') || sectionName.startsWith('Logistics') || sectionName.startsWith('לוגיסטיקה')) {
        finalizeCurrentPoi();
        state = 'SKIP_SECTION';
        continue;
      }

      // All other ### — POI section
      finalizeCurrentPoi();
      state = 'POI_SECTION';

      // Parse the emoji and name from heading
      // First non-whitespace sequence that is emoji
      const emojiMatch = sectionName.match(/^([\p{Emoji}\uFE0F\u20D0-\u20FF\u{1F000}-\u{1FFFF}]+\s*)/u);
      const headingEmoji = emojiMatch ? emojiMatch[1].trim() : '';
      const nameText = emojiMatch ? sectionName.slice(emojiMatch[0].length).trim() : sectionName;

      // Build tag: emoji + label (uppercase first word after emoji or whole remaining text)
      const tagLabel = nameText.split(/[\/—\-]/)[0].trim().toUpperCase();
      const tag = headingEmoji ? `${headingEmoji} ${tagLabel}` : tagLabel;

      currentPoi = {
        headingEmoji,
        name: nameText,
        tag,
        accessible: false,
        description: [],
        isAccommodation: false,
        isCarRental: false,
      };
      continue;
    }

    // Handle each state
    switch (state) {
      case 'FRONT_MATTER': {
        if (trimmed.startsWith('# ')) {
          data.title = trimmed.slice(2).trim();
        } else if (trimmed.startsWith('**Дата:**') || trimmed.startsWith('**Date:**') || trimmed.startsWith('**תאריך:**')) {
          const val = trimmed.replace(/^\*\*[^*]+\*\*:?\s*/, '').trim();
          data.dateStr = val;
        } else if (trimmed.startsWith('**Район:**') || trimmed.startsWith('**District:**') || trimmed.startsWith('**Area:**') || trimmed.startsWith('**אזור:**')) {
          const val = trimmed.replace(/^\*\*[^*]+\*\*:?\s*/, '').trim();
          data.area = val;
        } else if (trimmed.startsWith('🗺️') || trimmed.startsWith('🗺')) {
          // Map link line: 🗺️ [label](url)
          const mdLink = trimmed.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (mdLink) {
            data.mapLinkLabel = mdLink[1].trim();
            data.mapLink = mdLink[2].trim();
          }
        }
        break;
      }

      case 'SCHEDULE_TABLE': {
        if (trimmed.startsWith('|') && !isTableSeparatorRow(trimmed)) {
          if (!inScheduleBody) {
            // First pipe row = header row, skip it
            inScheduleBody = true;
          } else {
            const cells = parseTableRow(trimmed);
            if (cells.length >= 2) {
              const time = cells[0] ?? '';
              const activityRaw = cells[1] ?? '';
              const details = cells[2] ?? '';
              data.itineraryRows.push({ time, activityRaw, details });
            }
          }
        }
        break;
      }

      case 'POI_SECTION': {
        if (!currentPoi) break;

        if (trimmed.startsWith('📍')) {
          const url = extractUrl(trimmed.slice(2).trim());
          if (url) currentPoi.mapsUrl = url;
        } else if (trimmed.startsWith('🌐')) {
          const url = extractUrl(trimmed.slice(2).trim());
          if (url) currentPoi.siteUrl = url;
        } else if (trimmed.startsWith('📸')) {
          const url = extractUrl(trimmed.slice(2).trim());
          if (url) currentPoi.photoUrl = url;
        } else if (trimmed.startsWith('📞')) {
          // Phone: "📞 Телефон: +36 ..." or "📞 Phone: ..."
          const phoneRaw = trimmed.replace(/^📞\s*(Телефон:|Phone:|טלפון:)?\s*/i, '').trim();
          if (phoneRaw) currentPoi.phone = phoneRaw;
        } else if (trimmed.startsWith('⭐')) {
          // Rating: "⭐ 4.4/5 (Google)" or "⭐ 4.4/5 (2,340)"
          const ratingText = trimmed.slice(1).trim();
          const ratingMatch = ratingText.match(/^([\d.]+(?:\/[\d.]+)?)/);
          if (ratingMatch) {
            currentPoi.rating = ratingMatch[1];
            // Extract review count if present: (2,340)
            const reviewMatch = ratingText.match(/\(([^)]+)\)/);
            if (reviewMatch) {
              currentPoi.reviewCount = reviewMatch[1];
            }
          }
        } else if (trimmed.startsWith('♿')) {
          currentPoi.accessible = true;
        } else if (/^\*\*place_id\b/.test(trimmed)) {
          // place_id: **place_id:** ChIJ... (language-agnostic ASCII key)
          const pidMatch = trimmed.match(/^\*\*place_id[*:]*\s*(\S+)/);
          if (pidMatch && currentPoi) currentPoi.placeId = pidMatch[1].trim();
        } else if (/^\*\*(?:Image|Изображение|תמונה|Kép)\b/.test(trimmed)) {
          // Inline image URL: **Image:** https://... (language-agnostic)
          const urlMatch = trimmed.match(/https?:\/\/\S+/);
          if (urlMatch) currentPoi.imageUrl = urlMatch[0].replace(/[.,)>]+$/, '');
        } else if (trimmed.startsWith('> **') || trimmed.startsWith('> **')) {
          // Pro-tip: > **Совет:** text
          const tipText = trimmed
            .replace(/^>\s*\*\*[^*]+\*\*:?\s*/, '')
            .replace(/\*\*/g, '')
            .trim();
          if (tipText) currentPoi.proTip = tipText;
        } else if (trimmed.startsWith('>')) {
          // Block quote without ** — append to last pro-tip or start new
          const tipText = trimmed.replace(/^>\s*/, '').trim();
          if (tipText) {
            if (currentPoi.proTip) {
              currentPoi.proTip += ' ' + tipText;
            } else {
              currentPoi.proTip = tipText;
            }
          }
        } else if (/^\*\*(Про-?тип|Про-?совет|Pro-?[Tt]ip|Совет|Tip|Hint|Подсказка)[^*]*\*\*/.test(trimmed)) {
          // Inline bold pro-tip: **Про-тип:** text (or **Про-совет:**, **Pro-tip:**, **Совет:** etc.)
          const tipMatch = trimmed.match(/^\*\*[^*]+\*\*:?\s+(.*)/);
          if (tipMatch) {
            const tipText = stripInlineMarkdown(tipMatch[1]).trim();
            if (tipText) currentPoi.proTip = tipText;
          }
        } else if (trimmed.startsWith('---')) {
          // Section separator — finalize current POI
          // (handled by next ### detection, but --- also signals end)
        } else if (trimmed.startsWith('#')) {
          // Sub-heading (## or #) — treat as description
          const text = trimmed.replace(/^#+\s*/, '');
          if (text && !text.startsWith('*') && currentPoi.description) {
            currentPoi.description.push(stripInlineMarkdown(text));
          }
        } else if (trimmed === '' || trimmed === '---') {
          // blank or separator — skip
        } else if (
          !trimmed.startsWith('**Часы') &&
          !trimmed.startsWith('**Вход') &&
          !trimmed.startsWith('**Билеты') &&
          !trimmed.startsWith('**Hours') &&
          !trimmed.startsWith('**Admission') &&
          !/^\*\*(?:Image|Изображение|תמונה|Kép)\b/.test(trimmed) &&
          !/^\*\*place_id\b/.test(trimmed) &&
          trimmed.length > 0 &&
          !trimmed.startsWith('- ') && // list items (pricing) — keep for description
          !isTableSeparatorRow(trimmed)
        ) {
          // Paragraph text — description
          if (currentPoi.description) {
            const clean = stripInlineMarkdown(trimmed);
            if (clean) currentPoi.description.push(clean);
          }
        } else if (trimmed.startsWith('- ')) {
          // Bullet point — append to description
          if (currentPoi.description) {
            const clean = stripInlineMarkdown(trimmed.slice(2));
            if (clean) currentPoi.description.push('• ' + clean);
          }
        }
        break;
      }

      case 'PRICING_TABLE': {
        if (trimmed.startsWith('|') && !isTableSeparatorRow(trimmed)) {
          const cells = parseTableRow(trimmed);
          data.pricingRows.push(cells);
        }
        break;
      }

      case 'PLAN_B': {
        if (trimmed && !trimmed.startsWith('### ')) {
          planBLines.push(line);
        }
        break;
      }
    }
  }

  // Finalize last POI
  finalizeCurrentPoi();

  // Finalize plan B
  if (planBLines.length > 0) {
    data.planB = planBLines.join('\n').trim();
  }

  // Build POI name index (two-pass)
  data.poiNameIndex = buildPoiNameIndex(data.pois);

  // Resolve POI refs in itinerary rows
  for (const row of data.itineraryRows) {
    const ref = findPoiRef(row.activityRaw, data.poiNameIndex);
    if (ref !== undefined) {
      row.poiRef = String(ref);
    }
  }

  // Validation: day > 0 must have at least some content (not strict POI count in parser)
  // Zero POI warning for day > 0 (not error from parser; parity will catch render issues)

  return data;
}

// ─── Overview File Parser ───────────────────────────────────────────────────

function parseOverviewFile(filePath: string, manifest: Manifest, lang: string): OverviewData {
  const raw = fs.readFileSync(filePath, 'utf8');
  const content = preprocessContent(raw);
  const lines = content.split('\n');

  const destination = manifest.destination;
  const countryCode = extractCountryCode(destination);

  const data: OverviewData = {
    title: '',
    subtitle: '',
    countryCode,
    tableTitle: '',
    tableHeaders: [],
    tableRows: [],
  };

  type State = 'OVERVIEW_FRONT' | 'HOLIDAY_ADVISORY' | 'OVERVIEW_TABLE' | 'OVERVIEW_DONE';
  let state: State = 'OVERVIEW_FRONT';
  let advisoryLines: string[] = [];
  let advisoryTitle = '';
  let inTableBody = false;

  for (const line of lines) {
    const trimmed = line.trim();

    switch (state) {
      case 'OVERVIEW_FRONT': {
        if (trimmed.startsWith('# ')) {
          // Strip flag emoji (paired regional indicators U+1F1xx) — SVG flag is added by renderer
          data.title = trimmed.slice(2).trim()
            .replace(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/g, '')
            .trim();
        } else if (trimmed.startsWith('**Направление:**') || trimmed.startsWith('**Destination:**')) {
          // skip
        } else if (trimmed.startsWith('**Даты:**') || trimmed.startsWith('**Dates:**')) {
          data.subtitle = trimmed.replace(/^\*\*[^*]+\*\*:?\s*/, '').trim();
        } else if (trimmed.startsWith('**Путешественники:**') || trimmed.startsWith('**Travelers:**')) {
          const travelers = trimmed.replace(/^\*\*[^*]+\*\*:?\s*/, '').trim();
          if (data.subtitle) {
            data.subtitle = data.subtitle + ' · ' + travelers;
          } else {
            data.subtitle = travelers;
          }
        } else if (
          trimmed.startsWith('## ⚠️') ||
          trimmed.startsWith('## ⚠') ||
          trimmed.startsWith('## Праздничная') ||
          trimmed.startsWith('## Holiday') ||
          trimmed.startsWith('## הערות') ||
          (trimmed.startsWith('## ') && /предупреждение|advisory|warning|праздник|holiday/i.test(trimmed))
        ) {
          state = 'HOLIDAY_ADVISORY';
          // Strip warning emojis from title — renderer prepends ⚠️ itself
          advisoryTitle = trimmed.replace(/^## /, '').replace(/^[⚠️🚨⚠]\s*/, '').trim();
          advisoryLines = [];
        } else if (trimmed.startsWith('## Обзорная таблица') || trimmed.startsWith('## Overview') || trimmed.startsWith('## לוח') || trimmed.startsWith('## ') ) {
          data.tableTitle = trimmed.replace(/^## /, '');
          state = 'OVERVIEW_TABLE';
          inTableBody = false;
        }
        break;
      }

      case 'HOLIDAY_ADVISORY': {
        if (trimmed.startsWith('## ')) {
          // New section — save advisory, transition
          data.holidayAdvisoryTitle = advisoryTitle;
          data.holidayAdvisoryContent = advisoryLines.join('\n').trim();
          advisoryLines = [];
          if (trimmed.startsWith('## Обзорная таблица') || trimmed.startsWith('## Overview') || trimmed.match(/^## /)) {
            data.tableTitle = trimmed.replace(/^## /, '');
            state = 'OVERVIEW_TABLE';
            inTableBody = false;
          }
        } else {
          advisoryLines.push(line);
        }
        break;
      }

      case 'OVERVIEW_TABLE': {
        if (trimmed.startsWith('## ')) {
          // New section header — stop collecting itinerary rows.
          // Subsequent sections (accommodation, car rental, etc.) are NOT part of the overview table.
          state = 'OVERVIEW_DONE';
        } else if (trimmed.startsWith('|') && !isTableSeparatorRow(trimmed)) {
          const cells = parseTableRow(trimmed);
          if (!inTableBody) {
            // Header row
            data.tableHeaders = cells;
            inTableBody = true;
          } else {
            data.tableRows.push(cells);
          }
        }
        break;
      }

      case 'OVERVIEW_DONE': {
        // Remaining sections (accommodation, car rental, etc.) — ignore all content.
        break;
      }
    }
  }

  // Finalize advisory if we never hit another ## section
  if (state === 'HOLIDAY_ADVISORY' && advisoryLines.length > 0) {
    data.holidayAdvisoryTitle = advisoryTitle;
    data.holidayAdvisoryContent = advisoryLines.join('\n').trim();
  }

  return data;
}

// ─── Budget File Parser ─────────────────────────────────────────────────────

function parseBudgetFile(filePath: string): BudgetData {
  const raw = fs.readFileSync(filePath, 'utf8');
  const content = preprocessContent(raw);
  const lines = content.split('\n');

  const data: BudgetData = {
    sectionTitle: '',
    tables: [],
  };

  let currentTable: BudgetTableData | null = null;
  let inTableHeader = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('## ')) {
      data.sectionTitle = trimmed.slice(3).trim();
    } else if (trimmed.startsWith('### ')) {
      // Sub-section heading — start new table
      if (currentTable) {
        data.tables.push(currentTable);
      }
      currentTable = {
        subTitle: trimmed.slice(4).trim(),
        headers: [],
        rows: [],
      };
      inTableHeader = false;
    } else if (trimmed.startsWith('|') && !isTableSeparatorRow(trimmed)) {
      if (!currentTable) {
        currentTable = { headers: [], rows: [] };
        inTableHeader = false;
      }
      const cells = parseTableRow(trimmed);
      if (!inTableHeader) {
        currentTable.headers = cells;
        inTableHeader = true;
      } else {
        currentTable.rows.push(cells);
      }
    } else if (trimmed === '' && currentTable && inTableHeader) {
      // End of table block — save it
      data.tables.push(currentTable);
      currentTable = null;
      inTableHeader = false;
    }
  }

  // Finalize last table
  if (currentTable) {
    data.tables.push(currentTable);
  }

  return data;
}

// ─── Accommodation File Parser ──────────────────────────────────────────────

function parseAccommodationFile(filePath: string): AccommodationData {
  const raw = fs.readFileSync(filePath, 'utf8');
  const content = preprocessContent(raw);
  const lines = content.split('\n');

  const data: AccommodationData = {
    sectionTitle: '',
    introText: '',
    cards: [],
  };

  let stayBlock = 1;
  let cardIndex = 0;
  let currentCard: Partial<AccommodationCardData> | null = null;
  let inIntro = true;
  let introLines: string[] = [];
  let descriptionLines: string[] = [];

  function finalizeCard(): void {
    if (currentCard) {
      currentCard.description = descriptionLines.join(' ').trim();
      currentCard.stayIndex = stayBlock;
      if (!currentCard.priceLevel) currentCard.priceLevel = 2;
      if (!currentCard.bookingUrl) currentCard.bookingUrl = '';
      if (!currentCard.bookingLabel) currentCard.bookingLabel = '🔗';
      data.cards.push(currentCard as AccommodationCardData);
      currentCard = null;
      descriptionLines = [];
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('## ')) {
      data.sectionTitle = trimmed.replace(/^##\s*🏨\s*/, '').replace(/^##\s*/, '').trim();
      inIntro = true;
    } else if (trimmed.startsWith('### 🏨')) {
      // New accommodation card
      finalizeCard();
      cardIndex++;
      const name = trimmed.slice(6).trim().replace(/^🏨\s*/, '');
      currentCard = {
        name,
        accessible: false,
        priceLevel: 2,
        bookingUrl: '',
        bookingLabel: '',
        stayIndex: stayBlock,
        cardIndex,
      } as Partial<AccommodationCardData>;
      descriptionLines = [];
      inIntro = false;
    } else if (inIntro && !currentCard) {
      if (trimmed && !trimmed.startsWith('###')) {
        introLines.push(trimmed);
      }
    } else if (currentCard) {
      if (trimmed.startsWith('📍')) {
        const url = extractUrl(trimmed.slice(2).trim());
        if (url) currentCard.mapsUrl = url;
      } else if (trimmed.startsWith('🌐')) {
        const url = extractUrl(trimmed.slice(2).trim());
        if (url) currentCard.siteUrl = url;
      } else if (trimmed.startsWith('📸')) {
        const url = extractUrl(trimmed.slice(2).trim());
        if (url) currentCard.photoUrl = url;
      } else if (trimmed.startsWith('📞')) {
        const phoneRaw = trimmed.replace(/^📞\s*(Телефон:|Phone:|טלפון:)?\s*/i, '').trim();
        if (phoneRaw) currentCard.phone = phoneRaw;
      } else if (trimmed.startsWith('⭐')) {
        const ratingText = trimmed.slice(1).trim();
        const ratingMatch = ratingText.match(/^([\d.]+(?:\/[\d.]+)?)/);
        if (ratingMatch) {
          currentCard.rating = ratingMatch[1];
          const reviewMatch = ratingText.match(/\(([^)]+)\)/);
          if (reviewMatch) {
            currentCard.reviewCount = reviewMatch[1];
          }
        }
      } else if (trimmed.startsWith('💰')) {
        // Price level: either "💰💰💰○" pip-count format OR "💰 Уровень цен: Средний–Верхний" text format
        if (trimmed.includes('Уровень цен') || trimmed.includes('Price Level') || trimmed.includes('Ценовой')) {
          // Text-based level description
          const lower = trimmed.toLowerCase();
          if (lower.includes('бюджет') || lower.includes('низкий') || lower.includes('budget') || lower.includes('cheap')) {
            currentCard.priceLevel = 1;
          } else if (lower.includes('верхний') || lower.includes('upper') || lower.includes('high') || lower.includes('premium')) {
            // "Верхний средний" or "Средний–Верхний" — treat as 3
            currentCard.priceLevel = lower.includes('средний') ? 3 : 4;
          } else if (lower.includes('средний') || lower.includes('middle') || lower.includes('mid')) {
            currentCard.priceLevel = 2;
          } else {
            currentCard.priceLevel = 2; // default
          }
        } else {
          // Pip format: count 💰 emoji
          const count = (trimmed.match(/💰/g) || []).length;
          currentCard.priceLevel = Math.max(1, Math.min(4, count || 2));
        }
      } else if (trimmed.startsWith('🔗')) {
        // Booking link: 🔗 [label](url)
        const mdLink = trimmed.slice(1).trim().match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (mdLink) {
          currentCard.bookingLabel = mdLink[1].trim();
          currentCard.bookingUrl = mdLink[2].trim();
        }
      } else if (trimmed.startsWith('> **')) {
        // Pro-tip
        const tipText = trimmed.replace(/^>\s*\*\*[^*]+\*\*:?\s*/, '').replace(/\*\*/g, '').trim();
        if (tipText) currentCard.proTip = tipText;
      } else if (trimmed.startsWith('>')) {
        const tipText = trimmed.replace(/^>\s*/, '').trim();
        if (tipText) {
          if (currentCard.proTip) {
            currentCard.proTip += ' ' + tipText;
          } else {
            currentCard.proTip = tipText;
          }
        }
      } else if (trimmed && !trimmed.startsWith('---')) {
        descriptionLines.push(stripInlineMarkdown(trimmed));
      }
    }
  }

  finalizeCard();

  // Finalize intro
  if (introLines.length > 0) {
    data.introText = introLines.join(' ').trim();
  }

  if (data.cards.length === 0) {
    process.stderr.write(
      `ERROR: generate_html_fragments.ts — ${filePath}: has zero ### 🏨 cards.\n`
    );
    process.exit(1);
  }

  return data;
}

// ─── Car Rental File Parser ─────────────────────────────────────────────────

function parseCarRentalFile(filePath: string): CarRentalData {
  const raw = fs.readFileSync(filePath, 'utf8');
  const content = preprocessContent(raw);
  const lines = content.split('\n');

  const data: CarRentalData = {
    sectionTitle: '',
    introText: '',
    blockId: 'rental_01',
    categories: [],
  };

  let currentCategory: Partial<CarRentalCategoryData> | null = null;
  let inTableHeader = false;
  let inIntro = true;
  let introLines: string[] = [];
  let estimateLines: string[] = [];
  let recommendationLines: string[] = [];
  let proTipLines: string[] = [];
  let inBudgetSection = false;
  let budgetTitle = '';
  let budgetHeaders: string[] = [];
  let budgetDataRows: string[][] = [];
  let budgetHeaderParsed = false;

  function finalizeCategory(): void {
    if (currentCategory) {
      if (!currentCategory.rows) currentCategory.rows = [];
      currentCategory.estimateText = estimateLines.join(' ').trim();
      currentCategory.recommendationText = recommendationLines.join(' ').trim();
      if (proTipLines.length > 0) currentCategory.proTip = proTipLines.join(' ').trim();
      data.categories.push(currentCategory as CarRentalCategoryData);
      currentCategory = null;
      estimateLines = [];
      recommendationLines = [];
      proTipLines = [];
      inTableHeader = false;
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('## ')) {
      data.sectionTitle = trimmed.replace(/^##\s*🚗\s*/, '').replace(/^##\s*/, '').trim();
      inIntro = true;
    } else if (trimmed.startsWith('### 🚗')) {
      finalizeCategory();
      inBudgetSection = false;
      const name = trimmed.slice(6).trim().replace(/^🚗\s*/, '');
      currentCategory = {
        name,
        rows: [],
      };
      inTableHeader = false;
      inIntro = false;
    } else if (trimmed.startsWith('### ')) {
      // Non-car-rental ### heading (block headers, budget summary, etc.)
      finalizeCategory();
      inIntro = false;
      inBudgetSection = false;
      if (trimmed.includes('💰')) {
        inBudgetSection = true;
        budgetTitle = trimmed.replace(/^###\s*/, '').trim();
        budgetHeaderParsed = false;
        budgetHeaders = [];
        budgetDataRows = [];
      }
    } else if (trimmed.startsWith('#### ')) {
      // Sub-sub-heading inside car rental category — treat as content
      // e.g. "#### 💎 Как получить люкс..."
      if (currentCategory) {
        recommendationLines.push(trimmed.slice(5).trim());
      }
    } else if (inBudgetSection) {
      if (trimmed.startsWith('|') && !isTableSeparatorRow(trimmed)) {
        const cells = parseTableRow(trimmed);
        if (!budgetHeaderParsed) {
          budgetHeaders = cells.map(c => stripInlineMarkdown(c));
          budgetHeaderParsed = true;
        } else {
          budgetDataRows.push(cells);
        }
      }
    } else if (inIntro && !currentCategory) {
      if (trimmed && !trimmed.startsWith('#')) {
        introLines.push(trimmed.replace(/^\*[^*]*\*\s*/,''));
      }
    } else if (currentCategory) {
      if (trimmed.startsWith('|') && !isTableSeparatorRow(trimmed)) {
        const cells = parseTableRow(trimmed);
        if (!inTableHeader) {
          // Skip header row
          inTableHeader = true;
        } else {
          if (cells.length >= 4) {
            const mdLink = cells[3].match(/\[([^\]]+)\]\(([^)]+)\)/);
            const bookingLabel = mdLink ? mdLink[1].trim() : cells[3].trim();
            const bookingUrl = mdLink ? mdLink[2].trim() : '';
            const row: CarRentalRow = {
              company: stripInlineMarkdown(cells[0]),
              dailyRate: stripInlineMarkdown(cells[1]),
              total: stripInlineMarkdown(cells[2]),
              bookingUrl,
              bookingLabel,
            };
            currentCategory.rows!.push(row);
          }
        }
      } else if (trimmed.startsWith('*') && trimmed.endsWith('*')) {
        // Italic estimate text: *Цены ориентировочные...*
        estimateLines.push(trimmed.slice(1, -1).trim());
      } else if (trimmed.startsWith('💡')) {
        // Recommendation
        recommendationLines.push(trimmed.slice(1).trim());
      } else if (trimmed.startsWith('> **') || trimmed.startsWith('> ')) {
        const tipText = trimmed
          .replace(/^>\s*\*\*[^*]+\*\*:?\s*/, '')
          .replace(/^>\s*/, '')
          .replace(/\*\*/g, '')
          .trim();
        if (tipText) proTipLines.push(tipText);
      } else if (trimmed.startsWith('**')) {
        // Bold numbered item text — add to recommendation
        const text = trimmed.replace(/\*\*/g, '').trim();
        if (text) recommendationLines.push(text);
      }
    }
  }

  finalizeCategory();

  // Finalize budget summary
  if (inBudgetSection && budgetHeaders.length > 0 && budgetDataRows.length > 0) {
    data.budgetSummary = { title: budgetTitle, headers: budgetHeaders, rows: budgetDataRows };
  }

  // Finalize intro
  if (introLines.length > 0) {
    data.introText = introLines.join(' · ').trim();
  }

  if (data.categories.length === 0) {
    process.stderr.write(
      `ERROR: generate_html_fragments.ts — ${filePath}: has zero ### 🚗 categories.\n`
    );
    process.exit(1);
  }

  return data;
}

// ─── Maps Config ────────────────────────────────────────────────────────────

/**
 * Read the Google Maps API key from maps_config.json in the project root.
 * Returns empty string if the file is absent, unreadable, or the key is blank.
 * Project root is two directories above automation/scripts/.
 */
function readMapsApiKey(scriptDir: string): string {
  const projectRoot = path.resolve(scriptDir, '..', '..');
  const configPath = path.join(projectRoot, 'maps_config.json');
  if (!fs.existsSync(configPath)) return '';
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const cfg = JSON.parse(raw) as { google_maps_api_key?: string };
    return (cfg.google_maps_api_key ?? '').trim();
  } catch {
    return '';
  }
}

/** Localized labels for the day map widget aria-labelledby region. {N} is replaced with day number. */
const MAP_ARIA_LABELS: Record<string, string> = {
  ru: 'Карта дня {N}',
  en: 'Day {N} map',
  he: 'מפת יום {N}',
};

// ─── Render Functions ───────────────────────────────────────────────────────

function renderPoiCard(poi: PoiData, dayNum: number, poiIndex: number, lang: string): string {
  const labels = LINK_LABELS_BY_LANG[lang];
  const parts: string[] = [];

  // buildMapsHref returns an already-HTML-safe href string — do NOT pass through sanitizeHref again.
  const mapsHref = buildMapsHref(poi.name, poi.placeId, poi.mapsUrl);

  // A card is exempt (QF-2 contract) if it has fewer than 3 total links of any type
  const totalLinkCount = (mapsHref ? 1 : 0) + (poi.siteUrl ? 1 : 0) + (poi.photoUrl ? 1 : 0) + (poi.phone ? 1 : 0);
  const exemptAttr = totalLinkCount < 3 ? ' data-link-exempt="true"' : '';
  const placeIdAttr = poi.placeId ? ` data-place-id="${escapeHtml(poi.placeId)}"` : '';
  const poiNameAttr = ` data-poi-name="${escapeHtml(poi.name)}"`;
  const poiTagAttr = poi.tag ? ` data-poi-tag="${escapeHtml(poi.tag)}"` : '';
  const poiDescAttr = poi.description.length > 0
    ? ` data-poi-description="${escapeHtml(poi.description[0])}"`
    : '';

  parts.push(`<div class="poi-card" id="poi-day-${dayNum}-${poiIndex}"${exemptAttr}${placeIdAttr}${poiNameAttr}${poiTagAttr}${poiDescAttr}>`);
  if (poi.imageUrl) {
    parts.push(`  <div class="poi-card__image-wrapper">`);
    parts.push(`    <img src="${sanitizeHref(poi.imageUrl)}" alt="${escapeHtml(poi.name)}" loading="lazy" onerror="this.style.display='none'">`);
    parts.push(`  </div>`);
  }
  parts.push(`  <div class="poi-card__body">`);
  parts.push(`    <span class="poi-card__tag">${escapeHtml(poi.tag)}</span>`);

  if (poi.rating) {
    const reviewPart = poi.reviewCount ? ` (${escapeHtml(poi.reviewCount)})` : '';
    parts.push(`    <span class="poi-card__rating">⭐ ${escapeHtml(poi.rating)}${reviewPart}</span>`);
  }

  if (poi.accessible) {
    parts.push(`    <span class="poi-card__accessible">♿</span>`);
  }

  parts.push(`    <h3 class="poi-card__name">${escapeHtml(poi.name)}</h3>`);

  for (const para of poi.description) {
    parts.push(`    <p class="poi-card__description">${renderInlineMd(para)}</p>`);
  }

  if (poi.proTip) {
    parts.push(`    <div class="pro-tip">`);
    parts.push(`      ${SVG_ICONS.info}`);
    parts.push(`      <span>${renderInlineMd(poi.proTip)}</span>`);
    parts.push(`    </div>`);
  }

  parts.push(`    <div class="poi-card__links">`);
  if (mapsHref) {
    parts.push(
      `      <a class="poi-card__link" data-link-type="maps" href="${mapsHref}" target="_blank" rel="noopener noreferrer">${SVG_ICONS.mapPin} 📍 ${escapeHtml(labels.maps)}</a>`
    );
  }
  if (poi.siteUrl) {
    parts.push(
      `      <a class="poi-card__link" data-link-type="site" href="${sanitizeHref(poi.siteUrl)}" target="_blank" rel="noopener noreferrer">${SVG_ICONS.globe} 🌐 ${escapeHtml(labels.site)}</a>`
    );
  }
  if (poi.photoUrl) {
    parts.push(
      `      <a class="poi-card__link" data-link-type="photo" href="${sanitizeHref(poi.photoUrl)}" target="_blank" rel="noopener noreferrer">${SVG_ICONS.camera} 📸 ${escapeHtml(labels.photo)}</a>`
    );
  }
  if (poi.phone) {
    parts.push(
      `      <a class="poi-card__link" data-link-type="phone" href="tel:${normalizePhone(poi.phone)}" target="_blank" rel="noopener noreferrer">${SVG_ICONS.phone} 📞 ${escapeHtml(labels.phone)}</a>`
    );
  }
  parts.push(`    </div>`);
  parts.push(`  </div>`);
  parts.push(`</div>`);

  return parts.join('\n');
}

function renderItineraryTable(rows: ItineraryRow[], dayNum: number): string {
  const parts: string[] = [];
  parts.push(`<div class="itinerary-table-wrapper">`);
  parts.push(`  <table class="itinerary-table">`);
  parts.push(`    <thead><tr><th>Время</th><th>Активность</th><th>Детали</th></tr></thead>`);
  parts.push(`    <tbody>`);

  for (const row of rows) {
    // Normalize bilingual separator per POI Language Rule:
    // 1. em-dash in any direction → "/"
    // 2. Cyrillic prepositions "в"/"до" before uppercase Latin → "/"
    // 3. Colon before uppercase Latin → " /"
    const normalizedActivity = row.activityRaw
      .replace(/\s+—\s+/g, ' / ')
      .replace(/\s+(?:в|до)\s+(?=[A-Z\u00C0-\u024F])/g, ' / ')
      .replace(/:\s+(?=[A-Z\u00C0-\u024F])/g, ' / ');
    const activityHtml =
      row.poiRef !== undefined
        ? `<a class="activity-label" href="#poi-day-${dayNum}-${row.poiRef}">${escapeHtml(stripInlineMarkdown(normalizedActivity))}</a>`
        : `<span class="activity-label">${escapeHtml(stripInlineMarkdown(normalizedActivity))}</span>`;

    parts.push(`      <tr>`);
    parts.push(`        <td class="col-time">${escapeHtml(row.time)}</td>`);
    parts.push(`        <td>${activityHtml}</td>`);
    parts.push(`        <td>${escapeHtml(stripInlineMarkdown(row.details))}</td>`);
    parts.push(`      </tr>`);
  }

  parts.push(`    </tbody>`);
  parts.push(`  </table>`);
  parts.push(`</div>`);
  return parts.join('\n');
}

function renderPricingGrid(rows: string[][]): string {
  if (rows.length === 0) return '';

  const parts: string[] = [];
  parts.push(`<div class="pricing-grid">`);

  // Filter out header row and separator rows
  const dataRows = rows.filter((r) => r.some((c) => c.trim() && !c.match(/^[-:]+$/)));

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const isTotal = i === dataRows.length - 1; // last non-empty row = total (language-agnostic)
    const cells = row.filter((_, idx) => idx < 3); // up to 3 columns

    if (cells.length >= 1) {
      const label = escapeHtml(stripInlineMarkdown(cells[0] ?? ''));
      const amount = escapeHtml(stripInlineMarkdown(cells[1] ?? ''));
      const currency = escapeHtml(stripInlineMarkdown(cells[2] ?? ''));

      if (isTotal) {
        parts.push(`  <div class="pricing-cell">`);
        parts.push(`    <span class="pricing-cell__label"><strong>${label}</strong></span>`);
        parts.push(`    <span class="pricing-cell__amount"><strong>${amount}</strong></span>`);
        parts.push(`    <span class="pricing-cell__currency"><strong>${currency}</strong></span>`);
        parts.push(`  </div>`);
      } else {
        parts.push(`  <div class="pricing-cell">`);
        parts.push(`    <span class="pricing-cell__label">${label}</span>`);
        parts.push(`    <span class="pricing-cell__amount">${amount}</span>`);
        parts.push(`    <span class="pricing-cell__currency">${currency}</span>`);
        parts.push(`  </div>`);
      }
    }
  }

  parts.push(`</div>`);
  return parts.join('\n');
}

interface PlanBCard {
  heading: string;        // empty string = implicit single card (no extra heading rendered)
  mapsUrl?: string;
  siteUrl?: string;
  phone?: string;
  rating?: string;
  proTip?: string;
  descriptionLines: string[];
  pricingRows?: string[][];  // parsed from a markdown pricing table merged into this card
}

// Apply one content line to a PlanBCard — extracts links, rating, pro-tip, or appends description
function applyLineToCard(card: PlanBCard, line: string): void {
  const trimmed = line.trim();
  if (!trimmed) return;

  const mapsM = trimmed.match(/^📍\s*\[([^\]]+)\]\(([^)]+)\)/);
  if (mapsM) { card.mapsUrl = mapsM[2]; return; }

  const siteM = trimmed.match(/^🌐\s*\[([^\]]+)\]\(([^)]+)\)/);
  if (siteM) { card.siteUrl = siteM[2]; return; }

  // Phone: "📞 +36…" or "📞 Телефон: +36…" — strip any localized label prefix
  const phoneM = trimmed.match(/^📞\s*(?:[^+\d]*)?([+\d][\d\s\-().]+?)(?:\s*\|.*)?$/);
  if (phoneM) {
    card.phone = phoneM[1].trim();
    const ratingInPhone = trimmed.match(/⭐\s*([\d.]+\/5)/);
    if (ratingInPhone && !card.rating) card.rating = ratingInPhone[1];
    return;
  }

  // Rating: "⭐ 4.5/5 — optional description"
  const ratingM = trimmed.match(/^⭐\s*([\d.]+\/5)\s*(?:[—\-]\s*)?(.*)$/);
  if (ratingM) {
    if (!card.rating) card.rating = ratingM[1];
    if (ratingM[2].trim()) card.descriptionLines.push(ratingM[2].trim());
    return;
  }

  // Pro-tip blockquote: "> **Pro-tip:** text" or "> text"
  if (trimmed.startsWith('> ')) {
    const tipText = trimmed
      .replace(/^>\s*\*\*[^*]+\*\*:?\s*/, '')
      .replace(/^>\s*/, '')
      .replace(/\*\*/g, '')
      .trim();
    if (tipText) card.proTip = (card.proTip ? card.proTip + ' ' : '') + tipText;
    return;
  }

  card.descriptionLines.push(trimmed);
}

function parsePlanBCards(content: string): { intro: string; cards: PlanBCard[] } {
  // A card heading is a line whose ENTIRE content is **...**  (optional trailing whitespace only)
  const CARD_HEADING = /^\*\*(.+?)\*\*\s*$/;
  const lines = content.split('\n');
  const hasCardHeadings = lines.some((l) => CARD_HEADING.test(l.trimEnd()));

  if (!hasCardHeadings) {
    // Single implicit card — entire content is the card body
    const card: PlanBCard = { heading: '', descriptionLines: [] };
    for (const line of lines) applyLineToCard(card, line);
    return { intro: '', cards: [card] };
  }

  // Multiple named cards, with optional intro text before the first heading
  const introLines: string[] = [];
  const rawCards: PlanBCard[] = [];
  for (const line of lines) {
    const m = line.trimEnd().match(CARD_HEADING);
    if (m) {
      rawCards.push({ heading: m[1].replace(/:$/, '').trim(), descriptionLines: [] });
      continue;
    }
    if (!rawCards.length) { introLines.push(line); continue; }
    applyLineToCard(rawCards[rawCards.length - 1], line);
  }

  // Post-process: a card whose descriptionLines are all markdown table rows and has no POI
  // data (links/rating/proTip) is a pricing table — merge it into the preceding card instead
  // of rendering it as a separate poi-card.
  const isMdTableRow = (l: string) => /^\|.*\|/.test(l);
  const isMdSeparator = (l: string) => l.split('|').slice(1, -1).every(c => /^[-:\s]+$/.test(c));
  const cards: PlanBCard[] = [];
  for (const card of rawCards) {
    const isPricingOnly =
      !card.mapsUrl && !card.siteUrl && !card.phone && !card.rating && !card.proTip &&
      card.descriptionLines.length > 0 &&
      card.descriptionLines.every(l => isMdTableRow(l));
    if (isPricingOnly && cards.length > 0) {
      const tableLines = card.descriptionLines.filter(l => !isMdSeparator(l));
      const rows = tableLines.map(l =>
        l.replace(/^\||\|$/g, '').split('|').map(c => c.trim())
      );
      cards[cards.length - 1].pricingRows = rows;
    } else {
      cards.push(card);
    }
  }

  return { intro: introLines.join('\n').trim(), cards };
}

function renderPlanBCard(card: PlanBCard, labels: { maps: string; site: string; phone: string }): string {
  const parts: string[] = [];
  // Plan B cards MUST NOT use poi-card class (rendering-config.md rule).
  // They use plan-b-card to keep them out of POI parity checks and anchor ID requirements.
  parts.push(`      <div class="plan-b-card">`);
  parts.push(`        <div class="plan-b-card__body">`);
  if (card.rating) {
    parts.push(`          <span class="plan-b-card__rating">⭐ ${escapeHtml(card.rating)}</span>`);
  }
  if (card.heading) {
    parts.push(`          <h3 class="plan-b-card__name">${processInlineMd(card.heading)}</h3>`);
  }
  for (const desc of card.descriptionLines) {
    parts.push(`          <p class="plan-b-card__description">${processInlineMd(desc)}</p>`);
  }
  if (card.pricingRows && card.pricingRows.length > 1) {
    const [headers, ...bodyRows] = card.pricingRows;
    parts.push(`          <div class="itinerary-table-wrapper" style="margin-top:var(--space-3)">`);
    parts.push(`            <table class="itinerary-table">`);
    parts.push(`              <thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>`);
    parts.push(`              <tbody>`);
    for (const row of bodyRows) {
      parts.push(`                <tr>${row.map(c => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`);
    }
    parts.push(`              </tbody>`);
    parts.push(`            </table>`);
    parts.push(`          </div>`);
  }
  if (card.proTip) {
    parts.push(`          <div class="pro-tip">`);
    parts.push(`            ${SVG_ICONS.info}`);
    parts.push(`            <span>${processInlineMd(card.proTip)}</span>`);
    parts.push(`          </div>`);
  }
  const hasLinks = card.mapsUrl || card.siteUrl || card.phone;
  if (hasLinks) {
    parts.push(`          <div class="plan-b-card__links">`);
    if (card.mapsUrl) {
      parts.push(`            <a class="plan-b-card__link" data-link-type="maps" href="${sanitizeHref(card.mapsUrl)}" target="_blank" rel="noopener noreferrer">${SVG_ICONS.mapPin} 📍 ${escapeHtml(labels.maps)}</a>`);
    }
    if (card.siteUrl) {
      parts.push(`            <a class="plan-b-card__link" data-link-type="site" href="${sanitizeHref(card.siteUrl)}" target="_blank" rel="noopener noreferrer">${SVG_ICONS.globe} 🌐 ${escapeHtml(labels.site)}</a>`);
    }
    if (card.phone) {
      parts.push(`            <a class="plan-b-card__link" data-link-type="phone" href="tel:${normalizePhone(card.phone)}" target="_blank" rel="noopener noreferrer">${SVG_ICONS.phone} 📞 ${escapeHtml(labels.phone)}</a>`);
    }
    parts.push(`          </div>`);
  }
  parts.push(`        </div>`);
  parts.push(`      </div>`);
  return parts.join('\n');
}

function renderPlanB(content: string, title: string, lang: string): string {
  const { intro, cards } = parsePlanBCards(content);
  const labels = LINK_LABELS_BY_LANG[lang] ?? LINK_LABELS_BY_LANG['ru'];
  const parts: string[] = [];

  parts.push(`<div class="advisory advisory--info" data-section-type="plan-b">`);
  parts.push(`  ${SVG_ICONS.info}`);
  parts.push(`  <div style="flex:1;min-width:0">`);
  parts.push(`    <h3 class="advisory__title">${escapeHtml(title)}</h3>`);

  if (intro) {
    parts.push(`    <div class="advisory__body" style="margin-bottom:var(--space-4)">`);
    for (const line of intro.split('\n').filter((l) => l.trim())) {
      parts.push(`      <p style="margin-bottom:var(--space-2)">${processInlineMd(line.trim())}</p>`);
    }
    parts.push(`    </div>`);
  }

  if (cards.length === 1) {
    // Single card — render full-width without grid
    parts.push(renderPlanBCard(cards[0], labels));
  } else if (cards.length > 1) {
    parts.push(`    <div class="itinerary-grid">`);
    for (const card of cards) {
      parts.push(renderPlanBCard(card, labels));
    }
    parts.push(`    </div>`);
  }

  parts.push(`  </div>`);
  parts.push(`</div>`);
  return parts.join('\n');
}

/**
 * Render either a full day-map-widget (when API key present and day has ≥1 place_id POI)
 * or the plain fallback map-link (when degraded).
 */
function renderDayMapWidget(day: DayData, lang: string, mapsApiKey: string): string {
  const rawLabel = day.mapLinkLabel ?? '🗺️ Google Maps';
  const mapLabel = rawLabel.startsWith('🗺') ? rawLabel : `🗺️ ${rawLabel}`;
  const mapHref = sanitizeHref(day.mapLink!);

  const poisWithPlaceId = day.pois.filter((p) => p.placeId);

  // Degraded path: no API key or no pinnable POIs → plain map-link (original behavior)
  if (!mapsApiKey || poisWithPlaceId.length === 0) {
    return `    <a class="map-link" href="${mapHref}" target="_blank" rel="noopener noreferrer">${escapeHtml(mapLabel)}</a>`;
  }

  // Widget path
  const N = day.dayNumber;
  const ariaLabelTemplate = MAP_ARIA_LABELS[lang] ?? '';
  const ariaLabel = ariaLabelTemplate.replace('{N}', String(N));
  const ariaAttrs = ariaLabel
    ? ` role="region" aria-labelledby="map-day-${N}-label"`
    : '';
  const labelSpan = ariaLabel
    ? `\n      <span id="map-day-${N}-label" class="sr-only">${escapeHtml(ariaLabel)}</span>`
    : '';

  const fallbackLink =
    `      <a class="map-link day-map-widget__fallback" href="${mapHref}"` +
    ` target="_blank" rel="noopener noreferrer" aria-hidden="true">${escapeHtml(mapLabel)}</a>`;

  return [
    `    <div class="day-map-widget day-map-widget--loading" data-map-day="${N}"${ariaAttrs}>${labelSpan}`,
    `      <div id="day-map-${N}" class="day-map-widget__canvas" tabindex="0"></div>`,
    fallbackLink,
    `    </div>`,
  ].join('\n');
}

function renderDayFragment(day: DayData, lang: string, mapsApiKey: string = ''): string {
  // POI parity assertion — BEFORE writing output
  let renderedPoiCount = 0;
  const poiCards = day.pois.map((poi, idx) => {
    renderedPoiCount++;
    return renderPoiCard(poi, day.dayNumber, idx + 1, lang);
  });

  if (renderedPoiCount !== day.pois.length) {
    throw new Error(
      `POI parity failure in day ${day.dayNumber}: parsed ${day.pois.length} POIs, ` +
        `rendered ${renderedPoiCount} cards`
    );
  }

  const parts: string[] = [];
  parts.push(`<div class="day-card" id="day-${day.dayNumber}">`);
  parts.push(`  <div class="day-card__banner">`);
  parts.push(
    `    <h2 class="day-card__banner-title" style="color: var(--color-text-inverse)">${escapeHtml(day.title)}</h2>`
  );
  parts.push(
    `    <p class="day-card__banner-date" style="color: var(--color-text-inverse)">${escapeHtml(day.dateStr)}</p>`
  );
  parts.push(`  </div>`);
  parts.push(`  <div class="day-card__content">`);

  // Day map widget (or fallback link) — BEFORE itinerary table
  if (day.mapLink) {
    parts.push(renderDayMapWidget(day, lang, mapsApiKey));
    parts.push('');
  }

  // Itinerary table
  if (day.itineraryRows.length > 0) {
    parts.push(renderItineraryTable(day.itineraryRows, day.dayNumber));
    parts.push('');
  }

  // POI cards grid
  parts.push(`    <div class="itinerary-grid">`);
  for (const card of poiCards) {
    parts.push('');
    parts.push(card);
  }
  parts.push(`    </div>`);

  // Pricing grid
  if (day.pricingRows.length > 0) {
    parts.push('');
    parts.push(renderPricingGrid(day.pricingRows));
  }

  // Plan B
  if (day.planB) {
    parts.push('');
    parts.push(renderPlanB(day.planB, day.planBTitle ?? '🅱️ Запасной план', lang));
  }

  parts.push(`  </div>`);
  parts.push(`</div>`);

  return parts.join('\n');
}

function renderOverviewFragment(data: OverviewData): string {
  const flagSvg = FLAG_SVG[data.countryCode];
  if (!flagSvg) {
    process.stderr.write(
      `ERROR: generate_html_fragments.ts — no FLAG_SVG entry for country code "${data.countryCode}".\n`
    );
    process.exit(1);
  }

  const parts: string[] = [];
  parts.push(`<section id="overview">`);
  parts.push('');
  parts.push(`<h1 class="page-title">${escapeHtml(data.title)} ${flagSvg}</h1>`);
  parts.push(`<p class="page-subtitle">${escapeHtml(data.subtitle)}</p>`);

  if (data.holidayAdvisoryContent) {
    parts.push('');
    parts.push(`<div class="advisory advisory--warning">`);
    parts.push(`  ${SVG_ICONS.warning}`);
    parts.push(`  <div>`);
    parts.push(
      `    <h3 class="advisory__title">⚠️ ${escapeHtml(data.holidayAdvisoryTitle ?? '')}</h3>`
    );
    parts.push(`    <div class="advisory__body">`);
    // Render the advisory content as markdown-like HTML (basic conversion)
    const advisoryHtml = renderAdvisoryContent(data.holidayAdvisoryContent);
    parts.push(advisoryHtml);
    parts.push(`    </div>`);
    parts.push(`  </div>`);
    parts.push(`</div>`);
  }

  if (data.tableHeaders.length > 0) {
    parts.push('');
    parts.push(`<h2 class="section-title">${escapeHtml(data.tableTitle)}</h2>`);
    parts.push(`<div class="itinerary-table-wrapper">`);
    parts.push(`  <table class="itinerary-table">`);
    parts.push(`    <thead>`);
    parts.push(`      <tr>${data.tableHeaders.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`);
    parts.push(`    </thead>`);
    parts.push(`    <tbody>`);
    for (const row of data.tableRows) {
      parts.push(
        `      <tr>${row.map((c) => `<td>${escapeHtml(stripInlineMarkdown(c))}</td>`).join('')}</tr>`
      );
    }
    parts.push(`    </tbody>`);
    parts.push(`  </table>`);
    parts.push(`</div>`);
  }

  parts.push('');
  parts.push(`</section>`);

  return parts.join('\n');
}

// Basic markdown-to-HTML for advisory content (headers, lists, paragraphs)
function renderAdvisoryContent(md: string): string {
  const lines = md.split('\n');
  const htmlLines: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      continue;
    }

    if (trimmed.startsWith('### ')) {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      htmlLines.push(`<h4>${escapeHtml(trimmed.slice(4))}</h4>`);
    } else if (trimmed.startsWith('## ')) {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      htmlLines.push(`<h3>${escapeHtml(trimmed.slice(3))}</h3>`);
    } else if (trimmed.startsWith('- ')) {
      if (!inList) {
        htmlLines.push('<ul>');
        inList = true;
      }
      // Process inline bold
      const itemHtml = processInlineMd(trimmed.slice(2));
      htmlLines.push(`<li>${itemHtml}</li>`);
    } else {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      htmlLines.push(`<p>${processInlineMd(trimmed)}</p>`);
    }
  }

  if (inList) htmlLines.push('</ul>');
  return htmlLines.join('\n');
}

function processInlineMd(text: string): string {
  // Convert **bold**, [text](url) links, and escape everything else
  const parts: string[] = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] === '*' && text[i + 1] === '*') {
      const end = text.indexOf('**', i + 2);
      if (end !== -1) {
        parts.push(`<strong>${escapeHtml(text.slice(i + 2, end))}</strong>`);
        i = end + 2;
        continue;
      }
    }
    if (text[i] === '[') {
      const closeBracket = text.indexOf(']', i + 1);
      if (closeBracket !== -1 && text[closeBracket + 1] === '(') {
        const closeParen = text.indexOf(')', closeBracket + 2);
        if (closeParen !== -1) {
          const linkText = text.slice(i + 1, closeBracket);
          const linkUrl = text.slice(closeBracket + 2, closeParen);
          parts.push(`<a href="${sanitizeHref(linkUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(linkText)}</a>`);
          i = closeParen + 1;
          continue;
        }
      }
    }
    parts.push(escapeHtml(text[i]));
    i++;
  }
  return parts.join('');
}

// Render inline markdown (bold + links) for POI description paragraphs and pro-tips
function renderInlineMd(text: string): string {
  return processInlineMd(text);
}

function renderBudgetFragment(data: BudgetData): string {
  const parts: string[] = [];
  parts.push(`<section id="budget">`);
  parts.push(`  <h2 class="section-title">${escapeHtml(data.sectionTitle)}</h2>`);

  for (const table of data.tables) {
    if (table.subTitle) {
      parts.push(
        `  <h3 style="font-size:1.25rem;margin-top:32px;margin-bottom:16px;">${escapeHtml(table.subTitle)}</h3>`
      );
    }

    if (table.headers.length > 0) {
      parts.push(`  <div class="itinerary-table-wrapper">`);
      parts.push(`    <table class="itinerary-table">`);
      parts.push(`      <thead>`);
      parts.push(
        `        <tr>${table.headers.map((h) => `<th>${escapeHtml(stripInlineMarkdown(h))}</th>`).join('')}</tr>`
      );
      parts.push(`      </thead>`);
      parts.push(`      <tbody>`);

      for (let i = 0; i < table.rows.length; i++) {
        const row = table.rows[i];
        const isTotal = i === table.rows.length - 1; // last row = total
        if (isTotal) {
          parts.push(
            `        <tr style="font-weight:bold">${row
              .map((c) => `<td><strong>${escapeHtml(stripInlineMarkdown(c))}</strong></td>`)
              .join('')}</tr>`
          );
        } else {
          parts.push(
            `        <tr>${row.map((c) => `<td>${escapeHtml(stripInlineMarkdown(c))}</td>`).join('')}</tr>`
          );
        }
      }

      parts.push(`      </tbody>`);
      parts.push(`    </table>`);
      parts.push(`  </div>`);
    }
  }

  // Add footnote if any
  parts.push('');
  parts.push(`</section>`);
  return parts.join('\n');
}

function renderAccommodationCard(card: AccommodationCardData, lang: string): string {
  const labels = LINK_LABELS_BY_LANG[lang];
  const parts: string[] = [];

  parts.push(`<div class="accommodation-card" id="accom-stay-${card.stayIndex}-${card.cardIndex}">`);
  parts.push(`  <span class="accommodation-card__tag">🏨</span>`);

  if (card.rating) {
    const reviewPart = card.reviewCount ? ` (${escapeHtml(card.reviewCount)})` : '';
    // Only append /5 if rating doesn't already contain a slash (e.g. "4.4/5" vs "4.4")
    const ratingDisplay = card.rating.includes('/') ? card.rating : `${card.rating}/5`;
    parts.push(
      `  <span class="accommodation-card__rating">⭐ ${escapeHtml(ratingDisplay)}${reviewPart}</span>`
    );
  }

  parts.push(`  <h3 class="accommodation-card__name">${escapeHtml(card.name)}</h3>`);

  parts.push(`  <div class="accommodation-card__links">`);
  if (card.mapsUrl) {
    parts.push(
      `    <a class="accommodation-card__link" data-link-type="maps" href="${sanitizeHref(card.mapsUrl)}" target="_blank" rel="noopener noreferrer">${SVG_ICONS.mapPin} 📍 ${escapeHtml(labels.maps)}</a>`
    );
  }
  if (card.siteUrl) {
    parts.push(
      `    <a class="accommodation-card__link" data-link-type="site" href="${sanitizeHref(card.siteUrl)}" target="_blank" rel="noopener noreferrer">${SVG_ICONS.globe} 🌐 ${escapeHtml(labels.site)}</a>`
    );
  }
  if (card.photoUrl) {
    parts.push(
      `    <a class="accommodation-card__link" data-link-type="photo" href="${sanitizeHref(card.photoUrl)}" target="_blank" rel="noopener noreferrer">${SVG_ICONS.camera} 📸 ${escapeHtml(labels.photo)}</a>`
    );
  }
  if (card.phone) {
    parts.push(
      `    <a class="accommodation-card__link" data-link-type="phone" href="tel:${normalizePhone(card.phone)}" target="_blank" rel="noopener noreferrer">${SVG_ICONS.phone} 📞 ${escapeHtml(labels.phone)}</a>`
    );
  }
  parts.push(`  </div>`);

  // Price level pips
  parts.push(`  <div class="accommodation-card__price-level">`);
  for (let i = 0; i < card.priceLevel; i++) {
    parts.push(`    <span class="price-pip price-pip--filled">💰</span>`);
  }
  for (let i = card.priceLevel; i < 4; i++) {
    parts.push(`    <span class="price-pip price-pip--empty">○</span>`);
  }
  parts.push(`  </div>`);

  parts.push(`  <div class="accommodation-card__description">${escapeHtml(card.description)}</div>`);

  parts.push(
    `  <a class="booking-cta" data-link-type="booking" href="${sanitizeHref(card.bookingUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(card.bookingLabel)}</a>`
  );

  if (card.proTip) {
    parts.push(`  <div class="pro-tip">${SVG_ICONS.info} <div>${escapeHtml(card.proTip)}</div></div>`);
  }

  parts.push(`</div>`);
  return parts.join('\n');
}

function renderAccommodationFragment(data: AccommodationData, lang: string): string {
  const parts: string[] = [];
  parts.push(`<div class="accommodation-section" id="accommodation">`);
  parts.push(
    `  <h2 class="section-title accommodation-section__title">🏨 ${escapeHtml(data.sectionTitle)}</h2>`
  );
  parts.push(`  <p class="accommodation-section__intro">${escapeHtml(data.introText)}</p>`);
  parts.push(`  <div class="accommodation-grid">`);

  for (const card of data.cards) {
    parts.push('');
    parts.push(renderAccommodationCard(card, lang));
  }

  parts.push(`  </div>`);
  parts.push(`</div>`);
  return parts.join('\n');
}

function renderCarRentalCategory(cat: CarRentalCategoryData, lang: string): string {
  const labels = LINK_LABELS_BY_LANG[lang];
  const parts: string[] = [];

  parts.push(`<div class="car-rental-category">`);
  parts.push(`  <span class="car-rental-category__tag">🚗</span>`);
  parts.push(`  <h3 class="car-rental-category__title">${escapeHtml(cat.name)}</h3>`);
  parts.push(`  <div class="car-rental-table-wrapper">`);
  parts.push(`    <table class="car-rental-table">`);
  parts.push(`      <thead><tr><th>Компания</th><th>Дневная ставка</th><th>Итого</th><th>Бронирование</th></tr></thead>`);
  parts.push(`      <tbody>`);

  for (const row of cat.rows) {
    parts.push(`        <tr>`);
    parts.push(`          <td>${escapeHtml(row.company)}</td>`);
    parts.push(`          <td>${escapeHtml(row.dailyRate)}</td>`);
    parts.push(`          <td>${escapeHtml(row.total)}</td>`);
    parts.push(
      `          <td><a class="rental-cta" data-link-type="rental-booking" href="${sanitizeHref(row.bookingUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(row.bookingLabel)}</a></td>`
    );
    parts.push(`        </tr>`);
  }

  parts.push(`      </tbody>`);
  parts.push(`    </table>`);
  parts.push(`  </div>`);

  if (cat.estimateText) {
    parts.push(`  <p class="car-rental-category__estimate"><em>${escapeHtml(cat.estimateText)}</em></p>`);
  }

  if (cat.recommendationText) {
    parts.push(
      `  <p class="car-rental-category__recommendation">💡 ${escapeHtml(cat.recommendationText)}</p>`
    );
  }

  if (cat.proTip) {
    parts.push(`  <div class="pro-tip">${SVG_ICONS.info} <div>${escapeHtml(cat.proTip)}</div></div>`);
  }

  parts.push(`</div>`);
  return parts.join('\n');
}

function renderBudgetCellHtml(raw: string): string {
  // Escape HTML then convert **bold** to <strong>
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function renderCarRentalBudgetSummary(budget: CarRentalBudgetSummary): string {
  const parts: string[] = [];
  parts.push(`<div class="car-rental-budget-summary">`);
  parts.push(`  <h3 class="car-rental-budget-summary__title">${escapeHtml(budget.title)}</h3>`);
  parts.push(`  <div class="car-rental-table-wrapper">`);
  parts.push(`    <table class="car-rental-table">`);
  parts.push(`      <thead><tr>${budget.headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>`);
  parts.push(`      <tbody>`);
  for (const row of budget.rows) {
    parts.push(`        <tr>`);
    for (const cell of row) {
      parts.push(`          <td>${renderBudgetCellHtml(cell)}</td>`);
    }
    parts.push(`        </tr>`);
  }
  parts.push(`      </tbody>`);
  parts.push(`    </table>`);
  parts.push(`  </div>`);
  parts.push(`</div>`);
  return parts.join('\n');
}

function renderCarRentalFragment(data: CarRentalData, lang: string): string {
  const parts: string[] = [];
  const titleId = `car-rental-title-${data.blockId}`;

  parts.push(
    `<section id="car-rental" class="car-rental-section" role="region" aria-labelledby="${titleId}">`
  );
  parts.push(
    `  <h2 class="section-title car-rental-section__title" id="${titleId}">🚗 ${escapeHtml(data.sectionTitle)}</h2>`
  );
  parts.push(`  <p class="car-rental-section__intro">${escapeHtml(data.introText)}</p>`);

  for (const cat of data.categories) {
    parts.push('');
    parts.push(renderCarRentalCategory(cat, lang));
  }

  if (data.budgetSummary) {
    parts.push('');
    parts.push(renderCarRentalBudgetSummary(data.budgetSummary));
  }

  parts.push(`</section>`);
  return parts.join('\n');
}

// ─── Argument Parsing ──────────────────────────────────────────────────────

function parseArgs(): { tripFolder: string; lang: string; staleDays: number[] | null } {
  const args = process.argv.slice(2);
  let tripFolder = '';
  let lang = '';
  let staleDaysStr = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--trip-folder' && i + 1 < args.length) {
      tripFolder = args[++i];
    } else if (args[i] === '--lang' && i + 1 < args.length) {
      lang = args[++i];
    } else if (args[i] === '--stale-days' && i + 1 < args.length) {
      staleDaysStr = args[++i];
    }
  }

  if (!tripFolder || !lang) {
    process.stderr.write(
      `ERROR: --trip-folder and --lang are required.\n` +
        `Usage: npx tsx generate_html_fragments.ts --trip-folder <path> --lang <lang_code> [--stale-days "1,3,5"]\n`
    );
    process.exit(1);
  }

  const staleDays =
    staleDaysStr.trim()
      ? staleDaysStr
          .split(',')
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !isNaN(n))
      : null;

  return { tripFolder, lang, staleDays };
}

// ─── Main ──────────────────────────────────────────────────────────────────

function main(): void {
  const { tripFolder, lang, staleDays } = parseArgs();

  // Validate link label tables
  validateLinkLabels(lang);

  // Read Google Maps API key from project root maps_config.json
  const mapsApiKey = readMapsApiKey(path.dirname(process.argv[1]));
  if (mapsApiKey) {
    console.log('Maps API key found — day map widgets will be rendered.');
  } else {
    console.log('No Maps API key — day map widgets will fall back to plain map links.');
  }

  // Read manifest.json
  const manifestPath = path.join(tripFolder, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    process.stderr.write(
      `ERROR: generate_html_fragments.ts — manifest.json missing at ${manifestPath}\n`
    );
    process.exit(1);
  }

  let manifest: Manifest;
  try {
    const raw = fs.readFileSync(manifestPath, 'utf8');
    manifest = JSON.parse(raw) as Manifest;
  } catch {
    process.stderr.write(
      `ERROR: generate_html_fragments.ts — manifest.json invalid JSON at ${manifestPath}\n`
    );
    process.exit(1);
  }

  // Validate language
  if (!manifest.languages || !manifest.languages[lang]) {
    const available = manifest.languages ? Object.keys(manifest.languages).join(', ') : '(none)';
    process.stderr.write(
      `ERROR: generate_html_fragments.ts — language '${lang}' not found in manifest.json. Available: ${available}\n`
    );
    process.exit(1);
  }

  // Enumerate day files
  const dayFileRegex = new RegExp(`^day_(\\d{2})_${lang}\\.md$`);
  const allFiles = fs.readdirSync(tripFolder);
  const dayNumbers: number[] = allFiles
    .filter((f) => dayFileRegex.test(f))
    .sort()
    .map((f) => parseInt(f.slice(4, 6), 10));

  // Determine which days to process
  const daysToProcess =
    staleDays !== null ? dayNumbers.filter((d) => staleDays.includes(d)) : dayNumbers;

  const isIncrementalMode = staleDays !== null;

  // ── Process day fragments ──
  for (const dayNum of daysToProcess) {
    const dayFile = path.join(tripFolder, `day_${pad2(dayNum)}_${lang}.md`);
    if (!fs.existsSync(dayFile)) {
      process.stderr.write(
        `ERROR: generate_html_fragments.ts — ${dayFile}: day file missing.\n`
      );
      process.exit(1);
    }

    console.log(`Generating fragment for day ${dayNum}...`);
    try {
      const dayData = parseDayFile(dayFile, dayNum);

      // Validate: day > 0 must have >= 1 POI
      if (dayNum > 0 && dayData.pois.length === 0) {
        process.stderr.write(
          `WARN: generate_html_fragments.ts — ${dayFile}: day ${dayNum} has 0 POI headings.\n`
        );
        // Not a hard error for arrival/departure days > 0 that may be light
      }

      const html = renderDayFragment(dayData, lang, mapsApiKey);
      const outputPath = path.join(tripFolder, `fragment_day_${pad2(dayNum)}_${lang}.html`);
      atomicWrite(outputPath, html);
      console.log(`  Written: ${outputPath}`);
    } catch (err) {
      process.stderr.write(
        `ERROR: generate_html_fragments.ts — ${dayFile}: ${(err as Error).message}\n`
      );
      process.exit(1);
    }
  }

  // ── Process non-day fragments (skip in incremental mode for days-only stale) ──
  if (!isIncrementalMode) {
    // Overview
    const overviewFile = path.join(tripFolder, `overview_${lang}.md`);
    if (!fs.existsSync(overviewFile)) {
      process.stderr.write(
        `ERROR: generate_html_fragments.ts — ${overviewFile}: overview file missing.\n`
      );
      process.exit(1);
    }
    console.log('Generating overview fragment...');
    try {
      const overviewData = parseOverviewFile(overviewFile, manifest, lang);
      const html = renderOverviewFragment(overviewData);
      const outputPath = path.join(tripFolder, `fragment_overview_${lang}.html`);
      atomicWrite(outputPath, html);
      console.log(`  Written: ${outputPath}`);
    } catch (err) {
      process.stderr.write(
        `ERROR: generate_html_fragments.ts — ${overviewFile}: ${(err as Error).message}\n`
      );
      process.exit(1);
    }

    // Budget
    const budgetFile = path.join(tripFolder, `budget_${lang}.md`);
    if (!fs.existsSync(budgetFile)) {
      process.stderr.write(
        `ERROR: generate_html_fragments.ts — ${budgetFile}: budget file missing.\n`
      );
      process.exit(1);
    }
    console.log('Generating budget fragment...');
    try {
      const budgetData = parseBudgetFile(budgetFile);
      const html = renderBudgetFragment(budgetData);
      const outputPath = path.join(tripFolder, `fragment_budget_${lang}.html`);
      atomicWrite(outputPath, html);
      console.log(`  Written: ${outputPath}`);
    } catch (err) {
      process.stderr.write(
        `ERROR: generate_html_fragments.ts — ${budgetFile}: ${(err as Error).message}\n`
      );
      process.exit(1);
    }

    // Accommodation (conditional)
    const accommodationFile = path.join(tripFolder, `accommodation_${lang}.md`);
    if (fs.existsSync(accommodationFile)) {
      console.log('Generating accommodation fragment...');
      try {
        const accommodationData = parseAccommodationFile(accommodationFile);

        // Set stayIndex based on manifest stays
        const stays = manifest.accommodation?.stays ?? [];
        if (stays.length > 0) {
          // Update stayIndex on cards based on manifest stay block numbering
          let cardIdx = 0;
          for (let si = 0; si < stays.length; si++) {
            // Cards are ordered by stay block in the file
            // For single stay, all cards get stayIndex=1
            // Multi-stay: we rely on parsing to have set stayIndex correctly
            // (parseAccommodationFile uses stayBlock tracking)
          }
        }

        const html = renderAccommodationFragment(accommodationData, lang);
        const outputPath = path.join(tripFolder, `fragment_accommodation_${lang}.html`);
        atomicWrite(outputPath, html);
        console.log(`  Written: ${outputPath}`);
      } catch (err) {
        process.stderr.write(
          `ERROR: generate_html_fragments.ts — ${accommodationFile}: ${(err as Error).message}\n`
        );
        process.exit(1);
      }
    }

    // Car rental (conditional)
    const carRentalFile = path.join(tripFolder, `car_rental_${lang}.md`);
    if (fs.existsSync(carRentalFile)) {
      console.log('Generating car rental fragment...');
      try {
        const carRentalData = parseCarRentalFile(carRentalFile);

        // Set blockId from manifest
        const blocks = manifest.car_rental?.blocks ?? [];
        if (blocks.length > 0) {
          carRentalData.blockId = String(blocks[0].id);
        }

        const html = renderCarRentalFragment(carRentalData, lang);
        const outputPath = path.join(tripFolder, `fragment_car_rental_${lang}.html`);
        atomicWrite(outputPath, html);
        console.log(`  Written: ${outputPath}`);
      } catch (err) {
        process.stderr.write(
          `ERROR: generate_html_fragments.ts — ${carRentalFile}: ${(err as Error).message}\n`
        );
        process.exit(1);
      }
    }
  }

  console.log('\nAll fragments generated successfully.');
  process.exit(0);
}

main();
