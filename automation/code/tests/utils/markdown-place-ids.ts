import * as fs from 'fs';
import * as path from 'path';
import { loadTripConfig } from './trip-config';
import { getLatestTripFolderPath } from './trip-folder';

/**
 * Result for a single POI within a day — its index (0-based, in POI order within the day)
 * and the place_id value from the markdown (or null if not present).
 */
export interface PoiPlaceIdEntry {
  poiIndex: number;
  /** Name as it appears in the ### heading (used for assertion messages). */
  poiName: string;
  /** The place_id string from `**place_id:** <value>`, or null if absent. */
  placeId: string | null;
}

/**
 * Reads day markdown files for the latest trip and extracts `**place_id:**` values
 * from each POI section.
 *
 * Returns a map keyed by day number (integer) with an array of PoiPlaceIdEntry per day.
 * POIs are ordered as they appear in the markdown.
 *
 * If a day file does not exist on disk the day entry is absent from the result.
 * If no `**place_id:**` lines exist at all, the returned map will have empty placeId
 * for all entries — callers should check the total count and skip if zero.
 *
 * Language-agnostic: uses tripConfig.labels.fileSuffix for filename construction.
 * Follows the same interface conventions as markdown-pois.ts.
 */
export function getPlaceIdsFromMarkdown(): Record<number, PoiPlaceIdEntry[]> {
  const tripConfig = loadTripConfig();
  const tripFolder = getLatestTripFolderPath(tripConfig.markdownFilename);
  const suffix = tripConfig.labels.fileSuffix;
  const result: Record<number, PoiPlaceIdEntry[]> = {};

  for (let day = 0; day < tripConfig.dayCount; day++) {
    const dayNum = String(day).padStart(2, '0');
    const dayFile = path.join(tripFolder, `day_${dayNum}_${suffix}.md`);

    if (!fs.existsSync(dayFile)) {
      // Day file absent — skip silently (trip may not be fully generated yet)
      continue;
    }

    const content = fs.readFileSync(dayFile, 'utf-8');
    const entries: PoiPlaceIdEntry[] = [];
    let poiIndex = 0;
    let currentPoiName: string | null = null;
    let currentPlaceId: string | null = null;
    let inPoiSection = false;

    const lines = content.split('\n');
    for (const line of lines) {
      // A `### ` heading starts a new POI section (or a sub-section within the day).
      // We capture everything under each `### ` heading and look for place_id lines.
      if (line.startsWith('### ')) {
        // Flush previous POI section if we were in one
        if (inPoiSection && currentPoiName !== null) {
          entries.push({ poiIndex, poiName: currentPoiName, placeId: currentPlaceId });
          poiIndex++;
        }
        currentPoiName = line.replace(/^###\s+/, '').trim();
        currentPlaceId = null;
        inPoiSection = true;
        continue;
      }

      // A `## ` or higher-level heading ends the POI scan for this day
      if (/^#{1,2}\s/.test(line)) {
        if (inPoiSection && currentPoiName !== null) {
          entries.push({ poiIndex, poiName: currentPoiName, placeId: currentPlaceId });
          poiIndex++;
          currentPoiName = null;
          currentPlaceId = null;
          inPoiSection = false;
        }
        continue;
      }

      // Look for `**place_id:** <value>` inside the current POI section
      if (inPoiSection) {
        // Matches: **place_id:** ChIJxxx... (with optional whitespace)
        const placeIdMatch = line.match(/^\*\*place_id:\*\*\s+(\S+)/);
        if (placeIdMatch) {
          currentPlaceId = placeIdMatch[1].trim();
        }
      }
    }

    // Flush the last POI section
    if (inPoiSection && currentPoiName !== null) {
      entries.push({ poiIndex, poiName: currentPoiName, placeId: currentPlaceId });
    }

    if (entries.length > 0) {
      result[day] = entries;
    }
  }

  return result;
}
