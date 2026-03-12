import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

// Project root is two levels up from automation/code/
const projectRoot = path.resolve(__dirname, '..', '..');
const filePath = path.resolve(projectRoot, 'generated_trips', 'html', 'trip_2026-03-12_2215.html').replace(/\\/g, '/');
const TRIP_HTML = `file:///${filePath}`;

// Extract timestamp from trip filename for report naming
const tripMatch = path.basename(filePath).match(/trip_(\d{4}-\d{2}-\d{2}_\d{4})/);
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
    baseURL: TRIP_HTML,
    trace: 'on-first-retry',
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      use: {
        ...devices['iPhone SE'],
        defaultBrowserType: 'chromium',
      },
    },
  ],
});
