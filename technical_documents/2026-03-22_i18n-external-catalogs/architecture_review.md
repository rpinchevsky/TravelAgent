# Architecture Review

**Change:** Extract intake page i18n data into external JSON catalog files
**Date:** 2026-03-22
**Reviewer:** Software Architect
**Documents Reviewed:** `high_level_design.md` (HLD), `detailed_design.md` (DD)
**Verdict:** Approved

---

## 1. Review Summary

The proposed design is a clean, well-structured extraction of inline translation data into external JSON catalog files. It correctly preserves all existing behavior while achieving meaningful separation of content from structure. The data flow diagrams are clear, the fallback chain is robust, and the bridge server changes are minimal and safe. The BRD traceability matrix in the DD covers all 7 requirements and all acceptance criteria.

Two issues were identified in the initial review: (1) the cold-load request count for non-English users exceeded the BRD constraint of "at most 2" and (2) the `setLanguage()` async conversion needed a guard against race conditions on rapid language switching. Both have been resolved in the v2 revision — see §6 Re-Review for details.

## 2. Architecture Principles Checklist

| Principle | Status | Notes |
|---|---|---|
| Content / presentation separation | Pass | Translation content moves to `locales/*.json` files. UI structure (HTML), behavior (JS), and content (JSON) are fully separated. Content changes (editing translations) require no HTML or JS modifications. |
| Easy to extend for new requirements | Pass | Adding a new language: create `ui_{lang}.json`, add entry to `LANG_META`. Adding new keys: add to all 12 JSON files. Adding new item translations: add entry to `_items` key in relevant `ui_{lang}.json` files. All straightforward. |
| Consistent with existing patterns | Pass | The bridge server route follows the same security pattern as the existing `/file/*` route (path traversal prevention, prefix restriction). The `_uiCache`/`_langRequestId` naming follows the existing `_` prefix convention for module-level state. The fallback chain (target -> EN -> emergency) mirrors the existing `t()` fallback pattern. |
| No unnecessary coupling | Pass | The `/locales/*` route is fully independent of existing endpoints. The `_uiCache` replaces `TRANSLATIONS` without changing any consumer signatures (same `t()` and `tItem()` interfaces). Item translations are co-located with UI translations in each `ui_{lang}.json` (under `_items` key), which simplifies the fetch model while maintaining clean access via `tItem()`. |
| Regeneration performance | Pass | This change is intake-page-only. No impact on trip generation pipeline, HTML rendering, or regression testing. Content-only changes (editing JSON files) require zero rebuilds — just a browser refresh. Per the Change Impact Matrix (development_rules.md §6), this change type does not trigger any regression action. |

## 3. Feedback Items

### FB-1: Cold-load request count exceeds BRD constraint for non-English users

**Severity:** Blocking
**Affected document:** DD
**Section:** §1.13, §6 (BRD Traceability — REQ-005 AC-3), Note on REQ-005 AC-3
**Issue:** The BRD requires "at most 2" network requests on cold load (REQ-005 AC-3). The DD acknowledges that non-English users make 3 requests: (1) `ui_en.json`, (2) `items_i18n.json`, (3) `ui_{lang}.json`. The DD's own traceability table flags this as "2-3" and defers to the SA review. This is a quantifiable BRD violation that must be resolved before implementation, not discovered during testing.
**Suggestion:** Two options, either is acceptable:
- **Option A (design change):** Merge `items_i18n.json` content into each `ui_{lang}.json` file under a reserved `_items` key. This reduces cold load to exactly 2 requests (EN + target lang, or just EN for English users). The `tItem()` function reads from `_uiCache[currentLang]._items` with fallback to `_uiCache.en._items`. Trade-off: slightly larger per-language files (+~5KB) and item translations duplicated across 12 files, but simpler fetch logic.
- **Option B (BRD amendment):** Request PM to amend REQ-005 AC-3 to "at most 3" with justification that the 3rd request is parallelizable and adds negligible latency (~15-30KB over localhost). This is the lower-effort path but requires PM sign-off.

The DD explicitly calls out this trade-off and suggests Option B. Either option is architecturally sound. The blocking status is because the current design contradicts a must-have BRD criterion — the implementation team should not proceed with a known BRD violation.

---

### FB-2: Race condition guard missing on rapid language switching

**Severity:** Recommendation
**Affected document:** DD
**Section:** §1.12 (`setLanguage()` target state)
**Issue:** The BRD identifies "Race condition: user switches language before catalog loads" as a risk (§4, Dependencies & Risks) and specifies "cache + queue; only apply translation after fetch completes; debounce rapid switches" as mitigation. The DD's `setLanguage()` implementation has no debounce or sequence guard. If a user clicks RU, then immediately clicks HE before the RU fetch completes, both fetches proceed concurrently and the last to complete wins — which may not be the user's final choice (HE). This is an edge case but was explicitly called out in the BRD.
**Suggestion:** Add a monotonically increasing request counter (e.g., `let _langRequestId = 0`). At the start of `setLanguage()`, increment the counter and capture the current value. After the fetch completes, check if the captured value still matches the current counter. If not, abort the stale apply. This is a lightweight pattern (3 lines of code) that fully addresses the race without introducing debounce delays. Example:
```javascript
async function setLanguage(lang) {
  const requestId = ++_langRequestId;
  // ... fetch logic ...
  if (requestId !== _langRequestId) return; // superseded by newer call
  // ... apply translations ...
}
```

---

### FB-3: `file://` detection should run before any DOM manipulation

**Severity:** Recommendation
**Affected document:** DD
**Section:** §1.15 (`file://` protocol detection)
**Issue:** The DD specifies adding `file://` detection "before catalog fetch" in the initialization. This is correct, but the placement relative to the `i18n-loading` class removal and the emergency message DOM insertion should be explicit. If `file://` detection runs after any `querySelectorAll('[data-i18n]')` processing, users might see a brief flash of hidden content before the error overlay appears.
**Suggestion:** Ensure the `file://` check is the very first statement in the `initLangSelector()` IIFE, before `Promise.all`. The DD's code sample already shows `document.body.classList.remove('i18n-loading')` in the detection block and returns early, which is correct. Add a note in the DD explicitly stating this check must be the first statement in the init function to guarantee clean UX on `file://`.

---

### FB-4: Emergency catalog should include RTL-critical strings

**Severity:** Observation
**Affected document:** DD
**Section:** §1.14 (`_EMERGENCY_CATALOG`)
**Issue:** The emergency catalog contains ~20 English keys for critical navigation. If both external fetches fail for a Hebrew or Arabic user, the page will display English strings — which is acceptable as a last-resort fallback. However, the `setLanguage()` function will still set `dir="rtl"` (from `LANG_META`), meaning the English emergency text will render in RTL layout. This is cosmetically awkward but functionally tolerable.
**Suggestion:** No design change required. Add a code comment in the emergency catalog noting that RTL + English is an accepted degraded state, so future developers don't "fix" this by suppressing RTL for emergency mode (which would break things worse if the user's actual language catalog loads later).

---

### FB-5: Bridge server HTML serving should handle static assets

**Severity:** Observation
**Affected document:** DD
**Section:** §1.18 (`trip_intake.html` serving route)
**Issue:** The new `/` and `/trip_intake.html` routes serve the HTML file itself. Currently, `trip_intake.html` is self-contained (inline CSS/JS), so this is sufficient. However, if future changes externalize CSS or JS files (a natural evolution after this i18n extraction), the bridge server would need a more general static file route for the project root. This is out of scope for the current change but worth noting.
**Suggestion:** No action needed now. The DD's approach of purpose-specific routes (`/locales/*`, `/trip_intake.html`) is correct for the current scope. A general static file server can be added later if needed. Add a code comment near the HTML route noting this limitation.

---

## 4. Best Practice Recommendations

1. **JSON file validation in CI/dev workflow:** The DD's implementation checklist includes manual validation of JSON files (key counts, parse checks). Consider adding a lightweight validation script (e.g., a Node.js one-liner) that can be run before committing changes to `locales/`. This is particularly valuable because hand-editing 12+ JSON files is error-prone. Not blocking for this change, but recommended as a follow-up.

2. **Cache-Control header value:** The DD specifies `max-age=3600` (1 hour). For a local development server where files change frequently during development, this is reasonable. Document that production deployments (if applicable) should use content-hash filenames or `Cache-Control: no-cache` with ETags for instant invalidation.

3. **Consistent error logging:** The DD uses `console.warn('[i18n] ...')` for fetch failures. This is good. Ensure all i18n-related log messages use the `[i18n]` prefix consistently so they can be filtered in the browser console.

## 5. Sign-off

| Role | Date | Verdict |
|---|---|---|
| Software Architect | 2026-03-22 | ~~Approved with Changes~~ |
| Software Architect (Re-Review) | 2026-03-22 | **Approved** |

All blocking and recommended items have been resolved. The design is ready for implementation.

---

## 6. Re-Review

**Trigger:** Dev team revised HLD and DD to v2, addressing all five feedback items from the initial review.

### FB-1 (Blocking): Cold-load request count -- RESOLVED

The separate `items_i18n.json` file has been eliminated. Item translations are now merged into each `ui_{lang}.json` file under a reserved `_items` key (DD §1.1-1.5). The `fetchItemsCatalog()` function is also eliminated (DD §1.9). `tItem()` reads from `_uiCache[lang]._items` with fallback to `_uiCache.en._items` (DD §1.11). Cold load is now exactly 1 request for English users and exactly 2 for non-English users (HLD §3.1, DD §1.13). BRD REQ-005 AC-3 is fully satisfied. The trade-off (~5KB larger per-language files, item translations duplicated across 12 files) is acceptable.

- [x] FB-1 resolved: items merged into UI catalogs (Option A adopted). Cold load at most 2 requests.

### FB-2 (Recommendation): Race condition guard -- ADDRESSED

A `_langRequestId` sequence counter is declared alongside `_uiCache` (DD §1.6). `setLanguage()` increments the counter at entry, captures the value, and checks it after the async fetch completes -- aborting if superseded by a newer call (DD §1.12). The HLD §3.2 data flow diagram reflects this guard. Implementation matches the suggested pattern exactly.

- [x] FB-2 addressed: sequence counter added to `setLanguage()`.

### FB-3 (Recommendation): `file://` detection placement -- ADDRESSED

The `file://` protocol check is now explicitly the very first statement in `initLangSelector()`, before any DOM manipulation or fetch calls (DD §1.13, §1.15). Both sections include explicit comments referencing "SA FB-3" and the placement requirement. HLD §3.1 data flow shows the check as step [1].

- [x] FB-3 addressed: `file://` detection is first statement in init.

### FB-4 (Observation): Emergency catalog RTL comment -- ADDRESSED

The `_EMERGENCY_CATALOG` code block in DD §1.14 includes a comment noting that RTL + English emergency text is an accepted degraded state, with a warning not to suppress RTL for emergency mode. Matches the suggestion exactly.

- [x] FB-4 addressed: RTL + English degraded state documented in code comment.

### FB-5 (Observation): Bridge server static asset limitation -- ADDRESSED

The bridge server HTML route in DD §1.18 includes a comment noting that the route only serves `trip_intake.html` and that a more general static file route would be needed if CSS/JS are externalized in the future. Matches the suggestion exactly.

- [x] FB-5 addressed: static asset limitation documented in code comment.

### Consistency Check

No new contradictions were introduced by the v2 changes. The elimination of `items_i18n.json` is consistently reflected across all affected sections: data flow diagrams (HLD §3.1, §3.3), file specifications (DD §1.1-1.5, §1.9), function implementations (DD §1.11, §1.13), implementation checklist (DD §5), and BRD traceability matrix (DD §6). The DD's own SA Feedback Resolution Summary table accurately reflects all five resolutions.

### Verdict

**Approved.** All blocking items resolved, all recommendations addressed, all observations documented. The design is consistent, complete, and ready for Phase 4 (test planning) and Phase 5 (implementation).
