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

test.describe('Language Independence — Source Code Lint', () => {
  const specFiles = getSpecFiles(TESTS_DIR);

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
