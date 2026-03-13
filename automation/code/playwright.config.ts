import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

// Project root is two levels up from automation/code/
const projectRoot = path.resolve(__dirname, '..', '..');

// LTR trip (Russian) — main regression target
const ltrPath = path.resolve(projectRoot, 'generated_trips', 'html', 'trip_2026-03-13_1557.html').replace(/\\/g, '/');
const LTR_HTML = `file:///${ltrPath}`;

// RTL trip (Hebrew) — RTL layout regression target
const rtlPath = path.resolve(projectRoot, 'generated_trips', 'trip_2026-03-13_1557', 'trip_full_he.html').replace(/\\/g, '/');
const RTL_HTML = `file:///${rtlPath}`;

// Extract timestamp from trip filename for report naming
const tripMatch = path.basename(ltrPath).match(/trip_(\d{4}-\d{2}-\d{2}_\d{4})/);
const tripTimestamp = tripMatch ? tripMatch[1] : new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
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
