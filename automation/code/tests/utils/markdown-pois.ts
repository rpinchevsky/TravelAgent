import * as fs from 'fs';
import * as path from 'path';
import { loadTripConfig } from './trip-config';
import { getLatestTripFolderPath } from './trip-folder';

/**
 * Extracts expected POI counts per day from the generated trip markdown.
 * Shared utility used by poi-parity.spec.ts and progression.spec.ts.
 *
 * All language-dependent values (filename, heading regex, excluded sections)
 * come from trip-config.ts — no hardcoded strings.
 */
export function getExpectedPoiCountsFromMarkdown(): Record<number, { count: number; names: string[] }> {
  const tripConfig = loadTripConfig();
  const tripFolder = getLatestTripFolderPath(tripConfig.markdownFilename);
  const fullMdPath = path.join(tripFolder, tripConfig.markdownFilename);
  let latestMdContent: string | null = null;

  if (fs.existsSync(fullMdPath)) {
    latestMdContent = fs.readFileSync(fullMdPath, 'utf-8');
  }

  if (!latestMdContent) {
    throw new Error(
      `No trip markdown file "${tripConfig.markdownFilename}" found in trip folder ${tripFolder}`
    );
  }

  const lines = latestMdContent.split('\n');
  const result: Record<number, { count: number; names: string[] }> = {};
  let currentDay: number | null = null;
  let skipNextHeading = false;

  for (const line of lines) {
    const anchorMatch = line.match(/<a\s+id="day-(\d+)"/);
    const headingMatch = line.match(tripConfig.labels.dayHeadingRegex);
    if (anchorMatch || headingMatch) {
      currentDay = parseInt((anchorMatch || headingMatch)![1], 10);
      if (!result[currentDay]) {
        result[currentDay] = { count: 0, names: [] };
      }
      skipNextHeading = !!headingMatch;
      continue;
    }

    if (currentDay !== null && line.startsWith('### ')) {
      if (skipNextHeading) {
        skipNextHeading = false;
        continue;
      }
      const isExcluded = tripConfig.excludedSections.some(s => line.includes(s));
      if (!isExcluded) {
        result[currentDay].count++;
        result[currentDay].names.push(line.replace('### ', '').trim());
      }
    }
  }

  return result;
}
