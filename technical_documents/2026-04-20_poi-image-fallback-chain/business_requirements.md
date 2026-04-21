# BRD — POI Image Fallback Chain

## Problem
Layer 2c (inline POI images) currently specifies Wikimedia Commons as preferred source, with "any freely accessible URL" as fallback. That fallback is too vague: when Wikimedia returns a wrong hash (404) or the researcher cannot WebFetch Wikimedia pages (rate-limit risk), there is no concrete next step. Result: images are silently omitted, leaving blank cards.

In the Malmo trip (2026-04-20), 6 of 24 image URLs returned 404 due to incorrect Wikimedia thumbnail hashes.

## Root Cause
The rule names no alternative sources and gives no search strategy for fallbacks. Claude has no instruction to try Google Search, Flickr, or any other source.

## Proposed Change (Layer 2c rule in trip_planning_rules.md)
Replace the single "Fallback" bullet with an ordered fallback chain:

1. **Wikimedia Commons** (preferred) — WebSearch `site:commons.wikimedia.org "<POI name>"` to find the correct filename, never WebFetch Wikimedia pages directly.
2. **Flickr Creative Commons** — WebSearch `site:flickr.com "<POI name>" license:cc` — permanent direct image URLs at `live.staticflickr.com`.
3. **Official attraction / municipal tourism website** — WebSearch `"<POI name>" official site photo` — use the direct `<img>` src URL if stable (no CDN token).
4. **Google Images via WebSearch** — as last resort, WebSearch `"<POI name>" photo -site:google.com` and extract a stable direct image URL.
5. **Omit** — if all sources fail, omit the `**Image:**` line (graceful degradation).

**Disallowed sources (regardless of fallback level):**
- Any URL containing CDN auth tokens (`?X-Amz-`, `?Policy=`, `?Signature=`)
- TripAdvisor dynamic image URLs (non-permanent)
- Google Photos / Google Drive shared URLs
- Social media image CDNs (Instagram, Facebook)

## Acceptance Criteria
1. Rule updated in `trip_planning_rules.md` Layer 2c section.
2. Malmo trip: all 6 previously-404 POI images replaced with working URLs.
3. Re-rendered HTML shows images in browser (no onerror-hidden cards).
4. Smoke test passes.
