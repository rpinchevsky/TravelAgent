import * as fs from 'fs';
import * as path from 'path';

/**
 * Shared trip folder discovery logic.
 *
 * Scans `generated_trips/` for the latest `trip_YYYY-MM-DD_HHmm` folder.
 * Used by markdown-pois.ts, manifest-reader, and playwright.config.ts.
 */

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const TRIPS_DIR = path.resolve(PROJECT_ROOT, 'generated_trips');

/**
 * Returns sorted (newest-first) list of trip folder names matching the
 * `trip_YYYY-MM-DD_HHmm` naming convention.
 */
export function getTripFolders(): string[] {
  return fs.readdirSync(TRIPS_DIR)
    .filter(f => /^trip_\d{4}-\d{2}-\d{2}_\d{4}$/.test(f) && fs.statSync(path.join(TRIPS_DIR, f)).isDirectory())
    .sort()
    .reverse();
}

/**
 * Returns the absolute path to the latest trip folder that contains `filename`.
 * Throws with an actionable message if no folder contains the file.
 */
export function getLatestTripFolderPath(filename?: string): string {
  const folders = getTripFolders();

  if (!filename) {
    if (folders.length === 0) {
      throw new Error(`No trip folders found in ${TRIPS_DIR}`);
    }
    return path.join(TRIPS_DIR, folders[0]);
  }

  for (const folder of folders) {
    const candidate = path.join(TRIPS_DIR, folder, filename);
    if (fs.existsSync(candidate)) {
      return path.join(TRIPS_DIR, folder);
    }
  }

  throw new Error(
    `No trip folder found containing "${filename}". Scanned ${folders.length} folders in ${TRIPS_DIR}: ${folders.join(', ') || '(none)'}`
  );
}

/**
 * Returns the absolute path to `manifest.json` in the latest trip folder.
 * Throws if manifest.json does not exist.
 */
export function getManifestPath(): string {
  const folderPath = getLatestTripFolderPath('manifest.json');
  return path.join(folderPath, 'manifest.json');
}
