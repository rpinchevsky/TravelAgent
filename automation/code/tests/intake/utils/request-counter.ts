import type { Page, Request } from '@playwright/test';

/**
 * Creates a network request counter that monitors requests matching a URL pattern.
 *
 * Usage:
 *   const counter = await createRequestCounter(page, GLOB_LOCALES);
 *   // ... perform actions ...
 *   expect(counter.count).toBe(1);
 *   expect(counter.requests[0].url()).toContain('ui_en.json');
 *
 * The counter starts counting immediately after creation.
 * It captures both the count and the full Request objects for detailed assertions.
 */
export interface RequestCounter {
  /** Current count of matching requests */
  readonly count: number;
  /** Captured Request objects for detailed assertions (URL, headers, etc.) */
  readonly requests: Request[];
  /** Reset the counter to zero */
  reset(): void;
}

export async function createRequestCounter(
  page: Page,
  urlPattern: string
): Promise<RequestCounter> {
  const captured: Request[] = [];

  page.on('request', (request) => {
    // Convert glob-style pattern to a simple matcher
    if (matchesGlob(request.url(), urlPattern)) {
      captured.push(request);
    }
  });

  return {
    get count() {
      return captured.length;
    },
    get requests() {
      return [...captured];
    },
    reset() {
      captured.length = 0;
    },
  };
}

/**
 * Simple glob matcher supporting double-star and single-star wildcards.
 * Used to filter request URLs against glob patterns for locale JSON files.
 */
function matchesGlob(url: string, pattern: string): boolean {
  // Escape regex special chars except * and ?
  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/\{\{GLOBSTAR\}\}/g, '.*');
  return new RegExp(regexStr).test(url);
}
