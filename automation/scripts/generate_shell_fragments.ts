#!/usr/bin/env node
/**
 * generate_shell_fragments.ts
 * Generates PAGE_TITLE, NAV_LINKS, and NAV_PILLS from manifest.json.
 * Writes shell_fragments_{lang}.json to the trip folder.
 *
 * Usage:
 *   npx tsx automation/scripts/generate_shell_fragments.ts \
 *     --trip-folder <path> \
 *     --lang <lang_code>
 *
 * Exit codes: 0 = success, 1 = error
 */

// Node.js >= 18 preflight check
const nodeVersion = parseInt(process.versions.node.split('.')[0], 10);
if (nodeVersion < 18) {
  process.stderr.write(
    `ERROR: generate_shell_fragments.ts requires Node.js >= 18 (found ${process.versions.node}).\n` +
      `Upgrade Node.js and retry.\n`
  );
  process.exit(1);
}

import * as fs from 'fs';
import * as path from 'path';

// ─── Language Lookup Tables ────────────────────────────────────────────────

const TITLE_SUFFIX_BY_LANG: Record<string, string> = {
  ru: 'Семейный маршрут',
  en: 'Family Itinerary',
  he: 'מסלול משפחתי',
};

// Localized destination names — keyed by the English city name from manifest.destination
const DESTINATION_NAMES_BY_LANG: Record<string, Record<string, string>> = {
  ru: { Budapest: 'Будапешт', Moldova: 'Молдова' },
  en: {},
  he: { Budapest: 'בודפשט', Moldova: 'מולדובה' },
};

const NAV_LABEL_OVERVIEW: Record<string, string> = {
  ru: 'Обзор',
  en: 'Overview',
  he: 'סקירה',
};

const NAV_LABEL_ACCOMMODATION: Record<string, string> = {
  ru: 'Проживание',
  en: 'Accommodation',
  he: 'לינה',
};

const NAV_LABEL_CAR_RENTAL: Record<string, string> = {
  ru: 'Аренда авто',
  en: 'Car Rental',
  he: 'השכרת רכב',
};

const NAV_LABEL_BUDGET: Record<string, string> = {
  ru: 'Бюджет',
  en: 'Budget',
  he: 'תקציב',
};

// HTML lang + dir attributes for the <html> element
const HTML_LANG_ATTRS_BY_LANG: Record<string, string> = {
  ru: 'lang="ru"',
  en: 'lang="en"',
  he: 'lang="he" dir="rtl"',
};

// ─── SVG Icons ─────────────────────────────────────────────────────────────

// Overview: home icon (feather home, 16x16)
const SVG_HOME =
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
  `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
  `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>` +
  `<polyline points="9 22 9 12 15 12 15 22"></polyline>` +
  `</svg>`;

// Accommodation: bed icon (16x16)
const SVG_BED =
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
  `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
  `<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"></path>` +
  `<path d="M2 10V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4"></path>` +
  `<line x1="2" y1="20" x2="22" y2="20"></line>` +
  `</svg>`;

// Car rental: car icon (feather, 16x16)
const SVG_CAR =
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
  `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
  `<rect x="1" y="3" width="15" height="13"></rect>` +
  `<polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>` +
  `<circle cx="5.5" cy="18.5" r="2.5"></circle>` +
  `<circle cx="18.5" cy="18.5" r="2.5"></circle>` +
  `</svg>`;

// Day: calendar icon (feather calendar, 16x16)
const SVG_CALENDAR =
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
  `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
  `<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>` +
  `<line x1="16" y1="2" x2="16" y2="6"></line>` +
  `<line x1="8" y1="2" x2="8" y2="6"></line>` +
  `<line x1="3" y1="10" x2="21" y2="10"></line>` +
  `</svg>`;

// Budget: credit card icon (feather credit-card, 16x16)
const SVG_CREDIT_CARD =
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
  `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
  `<rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>` +
  `<line x1="1" y1="10" x2="23" y2="10"></line>` +
  `</svg>`;

// ─── Types ─────────────────────────────────────────────────────────────────

interface ManifestDayEntry {
  status: string;
  title: string;
  last_modified: string;
}

interface ManifestLanguage {
  phase_a_complete: boolean;
  days: Record<string, ManifestDayEntry>;
  overview_title?: string;
  accommodation_complete?: boolean;
  car_rental_complete?: boolean;
  budget_complete?: boolean;
  assembly?: {
    trip_full_md_built?: string;
    trip_full_html_built?: string;
    stale_days?: string[];
  };
}

interface Manifest {
  destination: string;
  arrival: string;
  languages: Record<string, ManifestLanguage>;
  [key: string]: unknown;
}

// ─── Argument Parsing ──────────────────────────────────────────────────────

function parseArgs(): { tripFolder: string; lang: string } {
  const args = process.argv.slice(2);
  let tripFolder = '';
  let lang = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--trip-folder' && i + 1 < args.length) {
      tripFolder = args[++i];
    } else if (args[i] === '--lang' && i + 1 < args.length) {
      lang = args[++i];
    }
  }

  if (!tripFolder || !lang) {
    process.stderr.write(
      `ERROR: --trip-folder and --lang are required.\n` +
        `Usage: npx tsx generate_shell_fragments.ts --trip-folder <path> --lang <lang_code>\n`
    );
    process.exit(1);
  }

  return { tripFolder, lang };
}

// ─── Validation ────────────────────────────────────────────────────────────

function validateLabelTables(lang: string): void {
  const missing: string[] = [];
  if (!TITLE_SUFFIX_BY_LANG[lang]) missing.push('TITLE_SUFFIX_BY_LANG');
  if (!NAV_LABEL_OVERVIEW[lang]) missing.push('NAV_LABEL_OVERVIEW');
  if (!NAV_LABEL_ACCOMMODATION[lang]) missing.push('NAV_LABEL_ACCOMMODATION');
  if (!NAV_LABEL_CAR_RENTAL[lang]) missing.push('NAV_LABEL_CAR_RENTAL');
  if (!NAV_LABEL_BUDGET[lang]) missing.push('NAV_LABEL_BUDGET');

  if (missing.length > 0) {
    process.stderr.write(
      `ERROR: generate_shell_fragments.ts — language '${lang}' is missing from label lookup tables.\n` +
        `Add '${lang}' entries to TITLE_SUFFIX_BY_LANG, NAV_LABEL_OVERVIEW, NAV_LABEL_ACCOMMODATION,\n` +
        `NAV_LABEL_CAR_RENTAL, NAV_LABEL_BUDGET before proceeding.\n` +
        `(Missing from: ${missing.join(', ')})\n`
    );
    process.exit(1);
  }
}

// ─── Helper: zero-pad day numbers ─────────────────────────────────────────

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

// ─── NAV Link / Pill Builders ──────────────────────────────────────────────

interface NavSection {
  id: string;
  label: string;
  svg: string;
}

function buildNavLinks(sections: NavSection[]): string {
  return sections
    .map((s, idx) => {
      const isFirst = idx === 0;
      const activeClass = isFirst ? ' is-active' : '';
      const ariaCurrent = isFirst ? ' aria-current="page"' : '';
      return (
        `<a class="sidebar__link${activeClass}" href="#${s.id}"${ariaCurrent}>\n` +
        `  ${s.svg}\n` +
        `  <span>${s.label}</span>\n` +
        `</a>`
      );
    })
    .join('\n');
}

function buildNavPills(sections: NavSection[]): string {
  return sections
    .map((s, idx) => {
      const isFirst = idx === 0;
      const activeClass = isFirst ? ' is-active' : '';
      const ariaCurrent = isFirst ? ' aria-current="page"' : '';
      return `<a class="mobile-nav__pill${activeClass}" href="#${s.id}"${ariaCurrent}>${s.label}</a>`;
    })
    .join('\n');
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

/** initDayMaps function body — injected into a <script> tag when API key is present. */
const INIT_SCRIPT_BODY = `function initDayMaps() {
  var widgets = document.querySelectorAll('.day-map-widget[data-map-day]');
  if (!widgets.length) return;
  widgets.forEach(function(widget) {
    var dayN = widget.getAttribute('data-map-day');
    var canvas = document.getElementById('day-map-' + dayN);
    var fallback = widget.querySelector('.day-map-widget__fallback');
    if (!canvas) return;

    var daySection = document.getElementById('day-' + dayN);
    if (!daySection) return;
    var poiCards = Array.prototype.slice.call(
      daySection.querySelectorAll('.poi-card[data-place-id]')
    );
    if (!poiCards.length) {
      widget.classList.remove('day-map-widget--loading');
      widget.classList.add('day-map-widget--error');
      if (fallback) fallback.removeAttribute('aria-hidden');
      return;
    }

    var map = new google.maps.Map(canvas, {
      mapId: 'DEMO_MAP_ID',
      gestureHandling: 'cooperative',
      mapTypeControl: false,
      fullscreenControl: true,
      streetViewControl: false
    });

    var bounds = new google.maps.LatLngBounds();
    var service = new google.maps.places.PlacesService(map);
    var placedCount = 0;
    var failedCount = 0;
    var currentInfoIdx = -1;

    // Build slide-in side panel — overlays right portion of map on marker click
    var panel = document.createElement('div');
    panel.className = 'dmp';
    var photoWrap = document.createElement('div');
    photoWrap.className = 'dmp__photo-wrap';
    var panelPhotoEl = document.createElement('img');
    panelPhotoEl.className = 'dmp__photo';
    panelPhotoEl.alt = '';
    var closeBtn = document.createElement('button');
    closeBtn.className = 'dmp__close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '\u00d7';
    closeBtn.onclick = function() { panel.classList.remove('is-open'); currentInfoIdx = -1; };
    photoWrap.appendChild(panelPhotoEl);
    photoWrap.appendChild(closeBtn);
    var panelBodyEl = document.createElement('div');
    panelBodyEl.className = 'dmp__body';
    var panelNameEl = document.createElement('div');
    panelNameEl.className = 'dmp__name';
    var panelMetaEl = document.createElement('div');
    panelMetaEl.className = 'dmp__meta';
    var panelNlEl = document.createElement('div');
    panelNlEl.className = 'dmp__nl';
    panelNlEl.textContent = 'Notes from Claude';
    var panelDescEl = document.createElement('div');
    panelDescEl.className = 'dmp__desc';
    var panelPrevBtn = document.createElement('button');
    panelPrevBtn.className = 'dmp__nb';
    panelPrevBtn.innerHTML = '\u2039';
    panelPrevBtn.onclick = function() { openInfo(currentInfoIdx - 1); };
    var panelNextBtn = document.createElement('button');
    panelNextBtn.className = 'dmp__nb';
    panelNextBtn.innerHTML = '\u203a';
    panelNextBtn.onclick = function() { openInfo(currentInfoIdx + 1); };
    var panelCountEl = document.createElement('span');
    panelCountEl.className = 'dmp__nc';
    var panelNavEl = document.createElement('div');
    panelNavEl.className = 'dmp__nav';
    panelNavEl.appendChild(panelPrevBtn);
    panelNavEl.appendChild(panelCountEl);
    panelNavEl.appendChild(panelNextBtn);
    panelBodyEl.appendChild(panelNameEl);
    panelBodyEl.appendChild(panelMetaEl);
    panelBodyEl.appendChild(panelNlEl);
    panelBodyEl.appendChild(panelDescEl);
    panelBodyEl.appendChild(panelNavEl);
    panel.appendChild(photoWrap);
    panel.appendChild(panelBodyEl);
    widget.appendChild(panel);

    // Pre-populate mData from HTML data attributes — available immediately
    var mData = poiCards.map(function(card, i) {
      return {
        placeId: card.getAttribute('data-place-id'),
        name:    card.getAttribute('data-poi-name') || String(i + 1),
        tag:     card.getAttribute('data-poi-tag')  || '',
        desc:    card.getAttribute('data-poi-description') || '',
        rating:  null, reviews: null, photo: null,
        marker: null, thumbEl: null, resolved: false
      };
    });

    // Create markers: thumbnail photo + name label, wrapped so label sits below photo
    mData.forEach(function(d, i) {
      var wrapEl = document.createElement('div');
      wrapEl.className = 'mmt-wrap';
      var thumbEl = document.createElement('div');
      thumbEl.className = 'mmt';
      var imgEl = document.createElement('img');
      imgEl.className = 'mmt__img';
      var numEl = document.createElement('span');
      numEl.className = 'mmt__num';
      numEl.textContent = String(i + 1);
      thumbEl.appendChild(imgEl);
      thumbEl.appendChild(numEl);
      var labelEl = document.createElement('div');
      labelEl.className = 'mmt__label';
      labelEl.textContent = d.name;
      wrapEl.appendChild(thumbEl);
      wrapEl.appendChild(labelEl);
      d.thumbEl = thumbEl;

      var marker = new google.maps.marker.AdvancedMarkerElement({
        map: map, title: d.name, content: wrapEl
      });
      d.marker = marker;
      (function(idx) {
        // stopPropagation prevents Google Maps from opening its own place panel.
        wrapEl.addEventListener('click', function(e) { e.stopPropagation(); openInfo(idx); });
      }(i));
    });

    function openInfo(idx) {
      if (idx < 0 || idx >= mData.length) return;
      currentInfoIdx = idx;
      var d = mData[idx];
      var total = mData.length;
      if (d.photo) {
        panelPhotoEl.src = d.photo;
        photoWrap.style.display = 'block';
      } else {
        photoWrap.style.display = 'none';
      }
      panelNameEl.textContent = d.name;
      var meta = '';
      if (d.rating) { meta = '\u2605 ' + d.rating; if (d.reviews) meta += ' (' + d.reviews + ')'; }
      if (d.tag) { meta += (meta ? ' \u00b7 ' : '') + d.tag; }
      panelMetaEl.textContent = meta;
      panelMetaEl.style.display = meta ? '' : 'none';
      if (d.desc) {
        panelDescEl.textContent = d.desc;
        panelDescEl.style.display = '';
        panelNlEl.style.display = '';
      } else {
        panelDescEl.style.display = 'none';
        panelNlEl.style.display = 'none';
      }
      panelCountEl.textContent = (idx + 1) + ' of ' + total;
      panelPrevBtn.disabled = (idx === 0);
      panelNextBtn.disabled = (idx === total - 1);
      panel.classList.add('is-open');
    }

    // Fetch place details — position, photo, rating
    mData.forEach(function(d, i) {
      service.getDetails(
        { placeId: d.placeId, fields: ['geometry', 'photos', 'rating', 'user_ratings_total'] },
        function(place, status) {
          if (status !== google.maps.places.PlacesServiceStatus.OK || !place || !place.geometry || !place.geometry.location) {
            failedCount++;
            checkAllSettled();
            return;
          }

          d.marker.position = place.geometry.location;
          bounds.extend(place.geometry.location);
          d.resolved = true;
          placedCount++;

          if (place.rating) d.rating = String(place.rating);
          if (place.user_ratings_total) {
            d.reviews = String(place.user_ratings_total).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',');
          }

          if (place.photos && place.photos.length > 0) {
            d.photo = place.photos[0].getUrl({ maxWidth: 400, maxHeight: 200 });
            var thumbUrl = place.photos[0].getUrl({ maxWidth: 80, maxHeight: 80 });
            var imgEl = d.thumbEl.querySelector('.mmt__img');
            if (imgEl) {
              imgEl.src = thumbUrl;
              imgEl.onload = function() { d.thumbEl.classList.add('mmt--photo'); };
            }
          }

          // Refresh open info window with newly-loaded data
          if (currentInfoIdx === i) openInfo(i);

          checkAllSettled();
        }
      );
    });

    function checkAllSettled() {
      if (placedCount + failedCount < mData.length) return;
      if (placedCount === 0) {
        widget.classList.remove('day-map-widget--loading');
        widget.classList.add('day-map-widget--error');
        if (fallback) fallback.removeAttribute('aria-hidden');
        return;
      }
      if (placedCount === 1) {
        for (var k = 0; k < mData.length; k++) {
          if (mData[k].resolved) { map.setCenter(mData[k].marker.position); map.setZoom(15); break; }
        }
      } else {
        map.fitBounds(bounds);
      }
    }

    map.addListener('tilesloaded', function() {
      widget.classList.remove('day-map-widget--loading');
      if (fallback) fallback.setAttribute('aria-hidden', 'true');
    });
  });
}`;

/**
 * Build the MAPS_SCRIPT placeholder value.
 * Returns a multi-line string containing the async Maps JS API loader + initDayMaps function,
 * or empty string when apiKey is blank.
 */
function buildMapsScript(apiKey: string): string {
  if (!apiKey) return '';
  // apiKey is embedded in a JS string attribute — escape for HTML attribute context
  const safeKey = apiKey.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return [
    `<script async`,
    `  src="https://maps.googleapis.com/maps/api/js?key=${safeKey}&libraries=places,marker&v=weekly&callback=initDayMaps">`,
    `</script>`,
    `<script>`,
    INIT_SCRIPT_BODY,
    `</script>`,
  ].join('\n');
}

// ─── Main ──────────────────────────────────────────────────────────────────

function main(): void {
  const { tripFolder, lang } = parseArgs();

  // Validate label tables first (before accessing any lookup)
  validateLabelTables(lang);

  // Read manifest.json
  const manifestPath = path.join(tripFolder, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    process.stderr.write(
      `ERROR: manifest.json missing or invalid at ${manifestPath}\n`
    );
    process.exit(1);
  }

  let manifest: Manifest;
  try {
    const raw = fs.readFileSync(manifestPath, 'utf8');
    manifest = JSON.parse(raw) as Manifest;
  } catch {
    process.stderr.write(
      `ERROR: manifest.json missing or invalid at ${manifestPath}\n`
    );
    process.exit(1);
  }

  // Validate language in manifest
  if (!manifest.languages || !manifest.languages[lang]) {
    const available = manifest.languages ? Object.keys(manifest.languages).join(', ') : '(none)';
    process.stderr.write(
      `ERROR: language '${lang}' not found in manifest.json. Available: ${available}\n`
    );
    process.exit(1);
  }

  const langData = manifest.languages[lang];

  // Derive PAGE_TITLE
  const destination = manifest.destination; // e.g. "Budapest, Hungary"
  const year = manifest.arrival.substring(0, 4); // e.g. "2026"
  const cityRaw = destination.split(',')[0].trim(); // e.g. "Budapest"
  const city = (DESTINATION_NAMES_BY_LANG[lang] ?? {})[cityRaw] ?? cityRaw;
  const suffix = TITLE_SUFFIX_BY_LANG[lang]; // already validated above
  const PAGE_TITLE = `${city} ${year} — ${suffix}`;

  // Determine present optional files
  const hasAccommodation = fs.existsSync(path.join(tripFolder, `accommodation_${lang}.md`));
  const hasCarRental = fs.existsSync(path.join(tripFolder, `car_rental_${lang}.md`));

  // Enumerate day files via readdirSync + regex (robust, not manifest arithmetic)
  const dayFileRegex = new RegExp(`^day_(\\d{2})_${lang}\\.md$`);
  const allFiles = fs.readdirSync(tripFolder);
  const dayNumbers: number[] = allFiles
    .filter((f) => dayFileRegex.test(f))
    .sort() // lexicographic = numeric for zero-padded names
    .map((f) => parseInt(f.slice(4, 6), 10));

  // Build ordered section list
  const sections: NavSection[] = [];

  // Overview
  const overviewLabel = langData.overview_title ?? NAV_LABEL_OVERVIEW[lang];
  sections.push({ id: 'overview', label: overviewLabel, svg: SVG_HOME });

  // Accommodation (conditional)
  if (hasAccommodation) {
    sections.push({
      id: 'accommodation',
      label: NAV_LABEL_ACCOMMODATION[lang],
      svg: SVG_BED,
    });
  }

  // Car rental (conditional)
  if (hasCarRental) {
    sections.push({
      id: 'car-rental',
      label: NAV_LABEL_CAR_RENTAL[lang],
      svg: SVG_CAR,
    });
  }

  // Days
  for (const dayNum of dayNumbers) {
    const dayKey = `day_${pad2(dayNum)}`;
    const dayEntry = langData.days[dayKey];
    if (!dayEntry) {
      process.stderr.write(
        `ERROR: generate_shell_fragments.ts — day key '${dayKey}' not found in manifest.languages.${lang}.days.\n` +
          `Ensure manifest.json is up to date with all day files in the trip folder.\n`
      );
      process.exit(1);
    }
    sections.push({
      id: `day-${dayNum}`,
      label: `${dayNum} — ${dayEntry.title}`,
      svg: SVG_CALENDAR,
    });
  }

  // Budget
  sections.push({ id: 'budget', label: NAV_LABEL_BUDGET[lang], svg: SVG_CREDIT_CARD });

  // Build NAV_LINKS and NAV_PILLS
  const NAV_LINKS = buildNavLinks(sections);
  const NAV_PILLS = buildNavPills(sections);

  // Compute HTML lang/dir attributes for the <html> element
  const HTML_LANG_ATTRS = HTML_LANG_ATTRS_BY_LANG[lang] ?? `lang="${lang}"`;

  // Read Maps API key and build MAPS_SCRIPT placeholder value
  const mapsApiKey = readMapsApiKey(path.dirname(process.argv[1]));
  const MAPS_SCRIPT = buildMapsScript(mapsApiKey);

  // Write output
  const outputPath = path.join(tripFolder, `shell_fragments_${lang}.json`);
  const output = JSON.stringify({ PAGE_TITLE, NAV_LINKS, NAV_PILLS, HTML_LANG_ATTRS, MAPS_SCRIPT }, null, 2);
  fs.writeFileSync(outputPath, output, 'utf8');

  console.log(`Shell fragments written to ${outputPath}`);
  process.exit(0);
}

main();
