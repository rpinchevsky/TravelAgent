/**
 * Color utility functions for contrast validation.
 *
 * Provides sRGB relative luminance calculation per WCAG 2.1 specification.
 * No Playwright dependency — pure math functions.
 */

/**
 * Parse an `rgb(R, G, B)` or `rgba(R, G, B, A)` string into [R, G, B] (0-255).
 * Throws if the format is unrecognized.
 */
export function parseRgb(colorString: string): [number, number, number] {
  const match = colorString.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/
  );
  if (!match) {
    throw new Error(
      `Cannot parse color string "${colorString}". ` +
      `Expected format: rgb(R, G, B) or rgba(R, G, B, A).`
    );
  }
  return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
}

/**
 * Linearize an sRGB channel value (0-255) to the 0-1 linear range.
 * Applies the sRGB inverse companding function.
 */
function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Calculate relative luminance of an sRGB color per WCAG 2.1.
 *
 * Formula: L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 * where R, G, B are linearized sRGB values.
 *
 * @returns Luminance in [0, 1]. White (#FFFFFF) = 1.0, Black (#000000) = 0.0.
 */
export function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}
