import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Language-Independence Lint Guard (QF-3)
 *
 * Scans test source code to catch hardcoded language or trip-specific strings.
 * This is a "meta-test" — it tests the test code itself.
 *
 * Rationale: Manual code review failed to catch 44 Russian prefixes, 69
 * trip-specific POI names, and hardcoded filenames across 10 spec files.
 * Automated enforcement prevents recurrence.
 */

const TESTS_DIR = path.resolve(__dirname, '..');
const UTILS_DIR = path.resolve(TESTS_DIR, 'utils');
const ALLOWED_FILES = [
  'utils/trip-config.ts',       // LANGUAGE_LABELS map — the ONLY place for localized strings
  'utils/language-config.ts',   // SCRIPT_MAP — unicode range definitions
];

function getSpecFiles(dir: string, relative = ''): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'code-quality') continue;
      results.push(...getSpecFiles(path.join(dir, entry.name), rel));
    } else if (entry.name.endsWith('.ts') && !ALLOWED_FILES.includes(rel)) {
      results.push(rel);
    }
  }
  return results;
}

// Module-level so all test.describe blocks in this file can reference it
const specFiles = getSpecFiles(TESTS_DIR);

test.describe('Language Independence — Source Code Lint', () => {

  test('should have found test files to scan', () => {
    expect(specFiles.length).toBeGreaterThan(0);
  });

  test('no spec file should contain Cyrillic string literals (outside allowed files)', () => {
    const cyrillicPattern = /[\u0400-\u04FF]/;
    const violations: string[] = [];

    for (const file of specFiles) {
      const content = fs.readFileSync(path.join(TESTS_DIR, file), 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip comments
        if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;
        if (cyrillicPattern.test(line)) {
          violations.push(`${file}:${i + 1}: ${line.trim().substring(0, 80)}`);
        }
      }
    }

    expect(
      violations,
      `Cyrillic characters found in test source code (outside allowed files):\n${violations.join('\n')}`
    ).toHaveLength(0);
  });

  test('no spec file should contain hardcoded trip_full_ filename', () => {
    const filenamePattern = /trip_full_(ru|en|he|ar|fa)\.(html|md)/;
    const violations: string[] = [];

    for (const file of specFiles) {
      const content = fs.readFileSync(path.join(TESTS_DIR, file), 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('//') || lines[i].trim().startsWith('*')) continue;
        if (filenamePattern.test(lines[i])) {
          violations.push(`${file}:${i + 1}: ${lines[i].trim().substring(0, 80)}`);
        }
      }
    }

    expect(
      violations,
      `Hardcoded trip filenames found in test source code:\n${violations.join('\n')}`
    ).toHaveLength(0);
  });

  test('TripPage.ts should not contain hasText filters with string literals', () => {
    const pomPath = path.join(TESTS_DIR, 'pages', 'TripPage.ts');
    const content = fs.readFileSync(pomPath, 'utf-8');
    const lines = content.split('\n');
    const violations: string[] = [];

    // Match hasText with hardcoded strings (not variable references)
    const hasTextPattern = /hasText:\s*['"][^'"]+['"]/;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('//') || lines[i].trim().startsWith('*')) continue;
      if (hasTextPattern.test(lines[i])) {
        violations.push(`TripPage.ts:${i + 1}: ${lines[i].trim()}`);
      }
    }

    expect(
      violations,
      `TripPage.ts contains hasText filters with hardcoded strings — use data attributes or config:\n${violations.join('\n')}`
    ).toHaveLength(0);
  });

  test('no spec file should hardcode lang="xx" assertions', () => {
    const langPattern = /lang.*['"](?:ru|en|he|ar)['"]/;
    const violations: string[] = [];

    for (const file of specFiles) {
      // Skip rtl-layout.spec.ts — it legitimately checks lang matches RTL languages
      if (file.includes('rtl-layout')) continue;
      const content = fs.readFileSync(path.join(TESTS_DIR, file), 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('//') || lines[i].trim().startsWith('*')) continue;
        if (langPattern.test(lines[i])) {
          violations.push(`${file}:${i + 1}: ${lines[i].trim().substring(0, 80)}`);
        }
      }
    }

    expect(
      violations,
      `Hardcoded lang attribute values found in test source code:\n${violations.join('\n')}`
    ).toHaveLength(0);
  });
});

test.describe('Day Mini-Map — Language Independence Guard (TC-216)', () => {
  // TC-216: data-poi-name attribute value is never hardcoded in spec files
  // Traces to: REQ-006 AC-2 (tests use data-* attributes only, no language-specific strings)
  // automation_rules §7.1 — no natural language text in test assertions
  test('TC-216: no spec file should assert a specific hardcoded value for data-poi-name attribute', () => {
    // Pattern: toHaveAttribute('data-poi-name', 'someString') or
    // toHaveAttribute("data-poi-name", "someString") where the value is a non-empty literal
    const hardcodedDataPoiNamePattern = /toHaveAttribute\s*\(\s*['"]data-poi-name['"]\s*,\s*['"][^'"]+['"]/;
    const violations: string[] = [];

    for (const file of specFiles) {
      const content = fs.readFileSync(path.join(TESTS_DIR, file), 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('//') || lines[i].trim().startsWith('*')) continue;
        if (hardcodedDataPoiNamePattern.test(lines[i])) {
          violations.push(`${file}:${i + 1}: ${lines[i].trim().substring(0, 100)}`);
        }
      }
    }

    expect(
      violations,
      `Spec files asserting hardcoded data-poi-name values (language-specific string in test assertion):\n${violations.join('\n')}`
    ).toHaveLength(0);
  });
});

test.describe('Dynamic Trip Details — Code Quality (TC-008/TC-009)', () => {
  const UTILITY_FILES = ['trip-config.ts', 'language-config.ts'];

  test('trip-config.ts and language-config.ts should document TRIP_DETAILS_FILE env var (TC-008)', () => {
    for (const file of UTILITY_FILES) {
      const filePath = path.join(UTILS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect.soft(
        content.includes('TRIP_DETAILS_FILE'),
        `${file} should contain a reference to TRIP_DETAILS_FILE env var`
      ).toBe(true);
    }
  });

  test('no hardcoded path.resolve with trip_details.md in utility files (TC-009)', () => {
    // Matches: resolve(..., 'trip_details.md') or resolve(..., "trip_details.md")
    // Does NOT flag: process.env.TRIP_DETAILS_FILE || 'trip_details.md' (the fallback default)
    const hardcodedResolvePattern = /resolve\(.*['"]trip_details\.md['"]\)/;
    const violations: string[] = [];

    for (const file of UTILITY_FILES) {
      const filePath = path.join(UTILS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('//') || lines[i].trim().startsWith('*')) continue;
        if (hardcodedResolvePattern.test(lines[i])) {
          violations.push(`${file}:${i + 1}: ${lines[i].trim().substring(0, 100)}`);
        }
      }
    }

    expect(
      violations,
      `Hardcoded path.resolve with trip_details.md found — use TRIP_DETAILS_FILE env var:\n${violations.join('\n')}`
    ).toHaveLength(0);
  });
});
