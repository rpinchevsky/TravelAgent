import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

// Project root is two levels up from automation/code/
const projectRoot = path.resolve(__dirname, '..', '..');

/**
 * Auto-discovers the latest trip folder containing the target file.
 * Reuses the proven pattern from poi-parity.spec.ts — scans generated_trips/
 * for timestamp-named folders, sorts descending, returns first match.
 */
function resolveLatestTrip(root: string, filename: string): string {
  const tripsDir = path.resolve(root, 'generated_trips');
  const folders = fs.readdirSync(tripsDir)
    .filter(f => /^trip_\d{4}-\d{2}-\d{2}_\d{4}$/.test(f) && fs.statSync(path.join(tripsDir, f)).isDirectory())
    .sort()
    .reverse();

  for (const folder of folders) {
    const candidate = path.join(tripsDir, folder, filename);
    if (fs.existsSync(candidate)) {
      return candidate.replace(/\\/g, '/');
    }
  }

  throw new Error(
    `No trip folder found containing "${filename}". Scanned ${folders.length} folders in ${tripsDir}: ${folders.join(', ') || '(none)'}`
  );
}

// LTR trip (Russian) — main regression target
// Accepts TRIP_LTR_HTML env var override; falls back to auto-discovery
const ltrPath = process.env.TRIP_LTR_HTML
  ? path.resolve(process.env.TRIP_LTR_HTML).replace(/\\/g, '/')
  : resolveLatestTrip(projectRoot, 'trip_full_ru.html');
const LTR_HTML = `file:///${ltrPath}`;

// RTL trip (Hebrew) — RTL layout regression target
// Accepts TRIP_RTL_HTML env var override; falls back to auto-discovery
const rtlPath = process.env.TRIP_RTL_HTML
  ? path.resolve(process.env.TRIP_RTL_HTML).replace(/\\/g, '/')
  : resolveLatestTrip(projectRoot, 'trip_full_he.html');
const RTL_HTML = `file:///${rtlPath}`;

// Extract timestamp from resolved trip folder for report naming
const ltrFolder = path.basename(path.dirname(ltrPath));
const folderMatch = ltrFolder.match(/^trip_(\d{4}-\d{2}-\d{2}_\d{4})$/);
const tripTimestamp = folderMatch ? folderMatch[1] : new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
const reportDir = path.resolve(__dirname, '..', 'Reports', `automation_report_${tripTimestamp}`);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never', outputFolder: reportDir }],
    ['list'],
  ],
  use: {
    trace: 'on-first-retry',
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], baseURL: LTR_HTML },
      testIgnore: /rtl-/,
    },
    // RTL project: runs only rtl-*.spec.ts files against the Hebrew HTML.
    // This is NOT viewport duplication — it targets a different HTML file
    // with distinct layout concerns (dir="rtl", mirrored grid, border sides).
    {
      name: 'desktop-chromium-rtl',
      use: { ...devices['Desktop Chrome'], baseURL: RTL_HTML },
      testMatch: /rtl-/,
    },
    // Mobile-specific tests (responsive.spec.ts, visual.spec.ts) set their own
    // viewport via test.use(). No need for a separate mobile project — it would
    // only duplicate viewport-agnostic DOM tests for zero added coverage.
  ],
});
