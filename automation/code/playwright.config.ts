import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { loadTripConfig } from './tests/utils/trip-config';

// Project root is two levels up from automation/code/
const projectRoot = path.resolve(__dirname, '..', '..');

/**
 * Auto-discovers the latest trip folder containing the target file.
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

// Load trip configuration — direction and filenames derived from reporting language
const tripConfig = loadTripConfig();

// Main regression target — always the reporting language's HTML.
// Direction (ltr/rtl) is an inherent property of the script, not configured separately.
const mainPath = process.env.TRIP_HTML_OVERRIDE
  ? path.resolve(process.env.TRIP_HTML_OVERRIDE).replace(/\\/g, '/')
  : resolveLatestTrip(projectRoot, tripConfig.htmlFilename);
const MAIN_HTML = `file:///${mainPath}`;

// Secondary direction HTML (optional — only if env var provided).
// Single-language trips have no secondary HTML; the project is simply omitted.
const secondaryEnvVar = tripConfig.direction === 'ltr'
  ? process.env.TRIP_RTL_HTML
  : process.env.TRIP_LTR_HTML;
let secondaryHtml: string | null = null;
if (secondaryEnvVar) {
  secondaryHtml = `file:///${path.resolve(secondaryEnvVar).replace(/\\/g, '/')}`;
}

// Extract timestamp from resolved trip folder for report naming
const mainFolder = path.basename(path.dirname(mainPath));
const folderMatch = mainFolder.match(/^trip_(\d{4}-\d{2}-\d{2}_\d{4})$/);
const tripTimestamp = folderMatch ? folderMatch[1] : new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
const reportDir = path.resolve(__dirname, '..', 'Reports', `automation_report_${tripTimestamp}`);

// Build project list dynamically based on direction
const projects: Array<{
  name: string;
  use: Record<string, unknown>;
  testIgnore?: RegExp | RegExp[];
  testMatch?: RegExp;
}> = [
  {
    name: tripConfig.direction === 'ltr' ? 'desktop-chromium' : 'desktop-chromium-rtl',
    use: { ...devices['Desktop Chrome'], baseURL: MAIN_HTML },
    testIgnore: tripConfig.direction === 'ltr'
      ? [/rtl-/, /intake-i18n-catalog/, /intake-i18n-key-leak/, /intake-step1-alignment/, /intake-mix-options/, /intake-wheelchair/]
      : [/intake-i18n-catalog/, /intake-i18n-key-leak/, /intake-step1-alignment/, /intake-mix-options/, /intake-wheelchair/],
    testMatch: tripConfig.direction === 'rtl' ? /rtl-/ : undefined,
  },
];

// Add secondary direction project only if HTML is available
if (secondaryHtml) {
  projects.push({
    name: tripConfig.direction === 'ltr' ? 'desktop-chromium-rtl' : 'desktop-chromium',
    use: { ...devices['Desktop Chrome'], baseURL: secondaryHtml },
    testMatch: tripConfig.direction === 'ltr' ? /rtl-/ : undefined,
    testIgnore: tripConfig.direction === 'rtl'
      ? [/rtl-/, /intake-i18n-catalog/, /intake-i18n-key-leak/, /intake-step1-alignment/, /intake-mix-options/, /intake-wheelchair/]
      : [/intake-i18n-catalog/, /intake-i18n-key-leak/, /intake-step1-alignment/, /intake-mix-options/, /intake-wheelchair/],
  });
}

// Intake page project — served via trip_bridge.js on HTTP (not file://)
// Matches intake i18n catalog tests, key leak scanner, and alignment tests that require HTTP transport
projects.push({
  name: 'intake-i18n',
  use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3456/trip_intake.html' },
  testMatch: /intake-i18n-catalog|intake-i18n-key-leak|intake-step1-alignment|intake-mix-options|intake-wheelchair/,
});

// Mobile-specific tests (responsive.spec.ts, visual.spec.ts) set their own
// viewport via test.use(). No need for a separate mobile project — it would
// only duplicate viewport-agnostic DOM tests for zero added coverage.

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
  projects,

  /* Auto-start trip_bridge.js for intake tests that require HTTP transport */
  webServer: {
    command: `node ${path.join(projectRoot, 'trip_bridge.js')}`,
    url: 'http://localhost:3456/trip_intake.html',
    reuseExistingServer: true,
    timeout: 10000,
  },
});
