# Detailed Design

**Change:** Trip Type Classification & Type-Aware Question Bank
**Date:** 2026-03-21
**Author:** Development Team
**HLD Reference:** high_level_design.md
**Status:** Revised (v2)

---

## 1. File Changes

### 1.1 `trip_intake.html`
**Action:** Modify
**Current state:** Single monolithic HTML file with ~30 question slides, `analyzeGroup()` for flag-based audience filtering, flat `QUESTION_TIERS`/`QUESTION_DEFAULTS` constants, tier-only `applyDepth()`, and `generateMarkdown()` without trip type field.
**Target state:** Same file extended with: `detectTripType()` function, `QUESTION_META` data structure (~70 entries), `TRIP_TYPE_SCORING` table, `balanceFamilyQuestions()`, modified `applyDepth()` with two-stage filtering, modified `generateMarkdown()` with trip type field, ~40 new question slide DOM elements, trip type context bar pill, updated depth overlay UI, and i18n keys for all new content.
**Rationale:** All intake logic lives in this single self-contained file per project architecture. No external JS dependencies.

### 1.2 `trip_intake_rules.md`
**Action:** Modify
**Current state:** Documents 30 questions (T1-T5), simple tier-based depth system, no trip type concept, output format without trip type field.
**Target state:** New "Trip Type Detection" section, expanded Question Inventory with ~70 questions in 8 categories, type-aware filtering documentation, family balancing documentation, updated output format with trip type field.
**Rationale:** Rule file must reflect the new business logic for future development and testing.

### 1.3 `trip_intake_design.md`
**Action:** Modify
**Current state:** Documents context bar with 4 pill types (dest, dates, travelers, depth/style), depth overlay without trip type messaging.
**Target state:** New trip type pill specification, updated depth overlay spec with type-aware messaging, toast notification spec for trip type detection.
**Rationale:** Design spec must document new visual components.

### 1.4 `trip_planning_rules.md`
**Action:** Modify
**Current state:** Pre-Flight Setup reads destination, dates, travelers, language. Interest Hierarchy uses universal_interests. No trip type awareness.
**Target state:** Pre-Flight Setup reads trip type field (with fallback). Interest Hierarchy factors trip type into weighting. Age-Appropriate Filter references trip type. Culinary Selection uses trip type for dining defaults.
**Rationale:** Downstream pipeline must consume the new field.

---

## 2. Trip Type Detection Algorithm

### 2.1 Function Signature

```javascript
function detectTripType(arrivalDate) → { tripType: string, familyBalance: string|null }
```

### 2.2 Detection Rules (Priority Order)

The function calls `analyzeGroup()` to obtain flags and computes additional metrics. Rules are evaluated in strict priority order; first match wins.

```javascript
function detectTripType(arrivalDate) {
  const { flags, ageTags } = analyzeGroup();
  const parentCards = document.querySelectorAll('#parentsContainer .traveler-card');
  const childCards = document.querySelectorAll('#childrenContainer .traveler-card');
  const adultCount = parentCards.length;
  const childCount = childCards.length;
  const hasChildren = childCount > 0;

  // Compute ages for all adults
  const adultAges = Array.from(parentCards).map(card => {
    const dob = getDobValue(card);
    return dob ? ageAt(dob, arrivalDate) : null;
  }).filter(a => a !== null);

  // Compute ages for all children
  const childAges = Array.from(childCards).map(card => {
    const dob = getDobValue(card);
    return dob ? ageAt(dob, arrivalDate) : null;
  }).filter(a => a !== null);

  // Constants
  const SENIOR_AGE = 65; // configurable threshold
  const YOUNG_MAX_AGE = 30;

  const hasSenior = adultAges.some(a => a >= SENIOR_AGE);
  const allYoung = adultAges.length > 0 && adultAges.every(a => a >= 18 && a <= YOUNG_MAX_AGE);

  // Priority 1: Solo — exactly 1 adult, 0 children
  if (adultCount === 1 && !hasChildren) {
    return { tripType: 'Solo', familyBalance: null };
  }

  // Priority 2: Couple — exactly 2 adults, 0 children
  if (adultCount === 2 && !hasChildren) {
    return { tripType: 'Couple', familyBalance: null };
  }

  // Priority 3: Young — all adults 18-30, 0 children
  if (!hasChildren && allYoung && adultCount >= 3) {
    return { tripType: 'Young', familyBalance: null };
  }

  // Priority 4: Multi-generational — has senior 65+ AND has child 0-17
  if (hasSenior && hasChildren) {
    return { tripType: 'Multi-generational', familyBalance: computeFamilyBalance(childAges) };
  }

  // Priority 5: Family — has adult AND has child, no seniors 65+
  if (hasChildren && !hasSenior) {
    return { tripType: 'Family', familyBalance: computeFamilyBalance(childAges) };
  }

  // Priority 6: Adults — all adults 18+, 0 children (catch-all)
  return { tripType: 'Adults', familyBalance: null };
}
```

**Note on Priority 2 vs. 3:** Per BRD AC-7 clarification, Couple (2 adults, 0 kids) takes priority over Young. Two adults aged 18-30 with no children will be classified as "Couple", not "Young". Young requires 3+ adults all aged 18-30.

**Note on Senior threshold:** The `SENIOR_AGE` constant (default 65) is defined at the top of the detection function for easy configurability, per BRD risk mitigation.

### 2.3 Family Balance Computation

```javascript
// Named constants for easy tuning (FB-8). Initial values are estimates subject to adjustment.
const FAMILY_KID_THRESHOLD = 0.4;   // ratio <= this → kid-focused
const FAMILY_TEEN_THRESHOLD = 0.7;  // ratio >= this → teen-friendly

function computeFamilyBalance(childAges) {
  if (childAges.length === 0) return null;

  // Age brackets
  const toddlers = childAges.filter(a => a >= 0 && a <= 3).length;
  const preschoolers = childAges.filter(a => a >= 4 && a <= 7).length;
  const schoolAge = childAges.filter(a => a >= 8 && a <= 12).length;
  const teens = childAges.filter(a => a >= 13 && a <= 17).length;
  const total = childAges.length;

  // Weighted score: younger children push toward "kid-focused", older toward "teen-friendly"
  // Weights: toddler=1, preschool=2, school-age=3, teen=4
  const weightedSum = toddlers * 1 + preschoolers * 2 + schoolAge * 3 + teens * 4;
  const maxPossible = total * 4; // all teens
  const ratio = weightedSum / maxPossible; // 0.25 (all toddlers) to 1.0 (all teens)

  if (ratio <= FAMILY_KID_THRESHOLD) return 'kid-focused';
  if (ratio >= FAMILY_TEEN_THRESHOLD) return 'teen-friendly';
  return 'balanced';
}
```

### 2.4 Invocation Point

`detectTripType()` is called:
1. When the user completes Step 1 and clicks "Continue" (before depth overlay opens)
2. When the user navigates back to Step 1 and modifies travelers, then proceeds forward again

The result is stored in a module-level variable `currentTripType` accessible to all other functions.

```javascript
let currentTripType = { tripType: null, familyBalance: null };

// In the Step 1 → depth overlay transition:
function onStep1Complete() {
  const arrivalDate = document.getElementById('arrival').value
    ? new Date(document.getElementById('arrival').value)
    : new Date();
  currentTripType = detectTripType(arrivalDate);
  updateTripTypePill(currentTripType.tripType);
  showTripTypeToast(currentTripType.tripType);
  openDepthOverlay(false); // existing behavior
}
```

---

## 3. Complete Question Bank (~70 Questions)

### 3.1 Data Structure: `QUESTION_META`

```javascript
const QUESTION_META = {
  // key: { category, tier, appliesTo, options, default, scoringTags }
};
```

Each entry:
- `category`: string A-H
- `tier`: number 1-5 (matches existing QUESTION_TIERS)
- `appliesTo`: array of trip type strings (subset of ['Solo','Couple','Young','Adults','Family','Multi-generational']). **No conditional/flag-based filtering** — this is a pure string-match model. A question either applies to a trip type or it does not. [Clarified per SA FB-1]
- `options`: array of { value, i18nKey } (3-4 options)
- `default`: string (default value, matches QUESTION_DEFAULTS)
- `scoringTags`: object mapping scoring dimensions to values (used by pre-selection functions)

**Note on data duplication (FB-4):** `QUESTION_META` contains `tier` and `default` fields that duplicate `QUESTION_TIERS` and `QUESTION_DEFAULTS`. This is intentional for phase 1 to preserve backward compatibility. **Follow-up refactoring (post-stabilization):** Once the feature is validated, derive `QUESTION_TIERS` and `QUESTION_DEFAULTS` from `QUESTION_META` to create a single source of truth:
```javascript
const QUESTION_TIERS = Object.fromEntries(
  Object.entries(QUESTION_META).map(([k, v]) => [k, v.tier])
);
const QUESTION_DEFAULTS = Object.fromEntries(
  Object.entries(QUESTION_META).map(([k, v]) => [k, v.default])
);
```
This refactoring is tracked as a post-release task, not part of the initial implementation.

### 3.2 Category A: Pace & Energy (7 questions)

| # | Key | Tier | Applies To | Options (value) | Default | New? |
|---|-----|------|-----------|-----------------|---------|------|
| A1 | `rhythm` | T1 | All 6 | early, balanced, marathon, latenight | balanced | No |
| A2 | `pace` | T1 | All 6 | relaxed, balanced, packed | balanced | No |
| A3 | `morningPreference` | T3 | All 6 | morning, nopref, afternoon | nopref | No |
| A4 | `walkingTolerance` | T2 | All 6 | light, moderate, marathon | moderate | No |
| A5 | `napSchedule` | T3 | Family, Multi-gen | strict, flexible, none | flexible | **Yes** |
| A6 | `energyManagement` | T4 | Family, Multi-gen | earlyReturn, splitDay, pushThrough | splitDay | **Yes** |
| A7 | `restDayFrequency` | T4 | All 6 | never, midTrip, everyThirdDay | midTrip | **Yes** |

**Note on A5:** `napSchedule` — "How important are nap/rest windows for young children?" Only applies to Family and Multi-generational. Options: strict (plan around naps), flexible (nice but not required), none (no nap needs).

**Note on A6:** `energyManagement` — "When energy runs low, what's your preference?" Options: earlyReturn (head back to hotel), splitDay (adults continue, kids rest), pushThrough (find a cafe and recharge). Applies to Family and Multi-generational only. The Adults+senior edge case (all adults with one 65+) is intentionally excluded to keep the `appliesTo` model clean (pure trip-type string matching, no flag-based conditions). For Adults trips with a senior, `relaxationTime` (F2, applies to all types) and `restDayFrequency` (A7, applies to all types) provide equivalent coverage for energy management planning. [Revised per SA FB-1]

**Note on A7:** `restDayFrequency` — "Would you like a rest/pool day built into the trip?" Applies to all trip types.

### 3.3 Category B: Budget & Logistics (7 questions)

| # | Key | Tier | Applies To | Options (value) | Default | New? |
|---|-----|------|-----------|-----------------|---------|------|
| B1 | `budget` | T1 | All 6 | budget, balanced, premium | balanced | No |
| B2 | `flexibility` | T1 | All 6 | strict, loose, spontaneous | loose | No |
| B3 | `transport` | T3 | All 6 | walking, transit, taxi | transit | No |
| B4 | `weatherSensitivity` | T2 | All 6 | indoor, flexible, outdoor | flexible | No |
| B5 | `accommodationType` | T3 | Solo, Couple, Young, Adults | hostel, hotel, apartment | hotel | **Yes** |
| B6 | `luggageStyle` | T4 | Solo, Young | ultraLight, standard, comfort | standard | **Yes** |
| B7 | `travelInsurance` | T5 | Family, Multi-gen | skip, basic, comprehensive | basic | **Yes** |
| B8 | `carRental` | T3 | Family, Adults, Multi-gen | noNeed, someDays, fullTrip | someDays | **Yes** |

### 3.4 Category C: Culture & Sightseeing (8 questions)

| # | Key | Tier | Applies To | Options (value) | Default | New? |
|---|-----|------|-----------|-----------------|---------|------|
| C1 | `setting` | T1 | All 6 | city, both, nature | both | No |
| C2 | `culture` | T1 | All 6 | culture, both, fun | both | No |
| C3 | `culturalImmersion` | T3 | All 6 | photo, some, full | some | No |
| C4 | `visitDuration` | T5 | All 6 | quick, moderate, deep | moderate | No |
| C5 | `museumStyle` | T3 | Family, Adults, Couple | interactive, mixed, classical | mixed | **Yes** |
| C6 | `historicalInterest` | T4 | Adults, Couple, Multi-gen | skip, highlights, deep | highlights | **Yes** |
| C7 | `artPreference` | T4 | Couple, Adults, Solo | none, casual, dedicated | casual | **Yes** |
| C8 | `guidedTours` | T5 | All 6 | selfGuided, audioGuide, liveGuide | audioGuide | **Yes** |

### 3.5 Category D: Food & Dining (13 questions)

| # | Key | Tier | Applies To | Options (value) | Default | New? |
|---|-----|------|-----------|-----------------|---------|------|
| D1 | `foodadventure` | T1 | All 6 | safe, open, fearless | open | No |
| D2 | `diet` | T1 | All 6 | omnivore, omnivore-meat, vegetarian, vegan | omnivore | No |
| D3 | `diningstyle` | T1 | All 6 | street, casual, upscale | casual | No |
| D4 | `kidsfood` | T2 | Family, Multi-gen | separate, some, same | some | No |
| D5 | `mealpriority` | T2 | All 6 | breakfast, lunch, dinner | dinner | No |
| D6 | `localfood` | T2 | All 6 | familiar, mix, fulllocal | mix | No |
| D7 | `snacking` | T4 | All 6 | skip, occasional, serious | occasional | No |
| D8 | `diningTiming` | T3 | Family, Multi-gen | earlyDinner, standard, lateDinner | standard | **Yes** |
| D9 | `alcoholPreference` | T3 | Couple, Young, Adults, Solo | none, wine, cocktails, beer | wine | **Yes** |
| D10 | `coffeeImportance` | T4 | All 6 | skip, occasional, essential | occasional | **Yes** |
| D11 | `foodMarketInterest` | T4 | All 6 | skip, browse, mustVisit | browse | **Yes** |
| D12 | `romanticDining` | T3 | Couple | skip, oneEvening, multipleEvenings | oneEvening | **Yes** |
| D13 | `streetFoodComfort` | T5 | Family, Young, Solo | avoid, selective, adventurous | selective | **Yes** |
| D14 | `cookingExperience` | T5 | Couple, Family, Adults | noInterest, maybe, mustDo | maybe | **Yes** |

### 3.6 Category E: Social & Group Dynamics (8 questions)

| # | Key | Tier | Applies To | Options (value) | Default | New? |
|---|-----|------|-----------|-----------------|---------|------|
| E1 | `groupSplitting` | T4 | Family, Adults, Multi-gen | together, maybe, fine | maybe | No |
| E2 | `socialInteraction` | T5 | All 6 | private, small, social | small | No |
| E3 | `surpriseOpenness` | T5 | All 6 | plan, detours, surprise | detours | No |
| E4 | `noise` | T1 | All 6 | quiet, flexible, lively | flexible | No |
| E5 | `soloComfort` | T2 | Solo | avoidSolo, comfortable, prefer | comfortable | **Yes** |
| E6 | `coupleTime` | T3 | Couple | alwaysTogether, someAlone, mixedGroup | alwaysTogether | **Yes** |
| E7 | `generationalBalance` | T3 | Multi-gen | kidsFirst, balanced, adultsLead | balanced | **Yes** |
| E8 | `groupSize` | T4 | Young, Adults | small, medium, large | medium | **Yes** |

### 3.7 Category F: Nightlife & Evening (6 questions)

| # | Key | Tier | Applies To | Options (value) | Default | New? |
|---|-----|------|-----------|-----------------|---------|------|
| F1 | `nightlife` | T3 | Solo, Couple, Young, Adults | skip, some, essential | some | No |
| F2 | `relaxationTime` | T4 | All 6 | keepGoing, short, long | short | No |
| F3 | `eveningEntertainment` | T3 | Couple, Adults, Young | quiet, shows, liveMusic | shows | **Yes** |
| F4 | `barScene` | T4 | Solo, Young, Adults | skip, oneOrTwo, everyNight | oneOrTwo | **Yes** |
| F5 | `sunsetPriority` | T5 | Couple, Solo | notImportant, niceToHave, mustPlan | niceToHave | **Yes** |
| F6 | `familyEvening` | T3 | Family, Multi-gen | earlyBed, gentleEvening, fullEvening | gentleEvening | **Yes** |

### 3.8 Category G: Activities & Adventure (14 questions)

| # | Key | Tier | Applies To | Options (value) | Default | New? |
|---|-----|------|-----------|-----------------|---------|------|
| G1 | `crowdTolerance` | T3 | All 6 | offPeak, some, dontMind | some | No |
| G2 | `photography` | T4 | All 6 | skip, bonus, major | bonus | No |
| G3 | `souvenirShopping` | T4 | All 6 | skip, local, everything | local | No |
| G4 | `shopping` | T5 | All 6 | skip, browse, dedicated | browse | No |
| G5 | `accessibility` | T5 | All 6 | none, flat, wheelchair | none | No |
| G6 | `adventureLevel` | T2 | Solo, Young, Adults | mild, moderate, extreme | moderate | **Yes** |
| G7 | `waterActivities` | T3 | Young, Family, Adults | avoid, casual, active | casual | **Yes** |
| G8 | `fitnessLevel` | T2 | Solo, Couple, Young, Adults | low, moderate, high | moderate | **Yes** |
| G9 | `kidActivityStyle` | T2 | Family, Multi-gen | educational, playful, balanced | balanced | **Yes** |
| G10 | `thrillSeeking` | T4 | Young, Solo | avoid, mild, extreme | mild | **Yes** |
| G11 | `natureDepth` | T3 | All 6 | scenic, dayHike, multiDay | scenic | **Yes** |
| G12 | `sportInterest` | T4 | Young, Adults, Solo | none, watch, participate | watch | **Yes** |
| G13 | `wellnessInterest` | T3 | Couple, Adults, Solo, Multi-gen | skip, spa, dedicated | spa | **Yes** |
| G14 | `beachPreference` | T5 | All 6 | avoid, relaxing, active | relaxing | **Yes** |

### 3.9 Category H: Special & Occasion-Based (7 questions) — ALL NEW

| # | Key | Tier | Applies To | Options (value) | Default | New? |
|---|-----|------|-----------|-----------------|---------|------|
| H1 | `specialOccasion` | T2 | Couple, Family, Adults | none, birthday, anniversary, honeymoon | none | **Yes** |
| H2 | `romanticMoments` | T3 | Couple | skip, oneSpecial, dailySurprise | oneSpecial | **Yes** |
| H3 | `celebrationStyle` | T3 | All 6 | quiet, moderate, bigEvent | moderate | **Yes** |
| H4 | `photoOpPriority` | T4 | Couple, Solo, Young | casual, someSpots, instagramTrip | someSpots | **Yes** |
| H5 | `localConnections` | T4 | Solo, Couple, Adults | tourist, someLocals, deepLocal | someLocals | **Yes** |
| H6 | `petFriendly` | T5 | Solo, Couple, Family | noPets, petFriendly, travelingWithPet | noPets | **Yes** |
| H7 | `sustainableTravel` | T5 | Solo, Young, Couple | notPriority, someEffort, priority | someEffort | **Yes** |

### 3.10 Question Count Summary

| Category | Existing | New | Total |
|---|---|---|---|
| A. Pace & Energy | 4 | 3 | 7 |
| B. Budget & Logistics | 4 | 4 | 8 |
| C. Culture & Sightseeing | 4 | 4 | 8 |
| D. Food & Dining | 7 | 7 | 14 |
| E. Social & Group Dynamics | 4 | 4 | 8 |
| F. Nightlife & Evening | 2 | 4 | 6 |
| G. Activities & Adventure | 5 | 9 | 14 |
| H. Special & Occasion-Based | 0 | 7 | 7 |
| **Total** | **30** | **42** | **72** |

### 3.11 Per-Trip-Type Question Availability

| Trip Type | Available Questions | Categories with coverage |
|---|---|---|
| Solo | 48 | A(7), B(7), C(7), D(10), E(5), F(5), G(12), H(5) |
| Couple | 50 | A(7), B(5), C(8), D(12), E(5), F(5), G(10), H(5) |
| Young | 46 | A(7), B(7), C(5), D(10), E(5), F(5), G(12), H(4) |
| Adults | 49 | A(6), B(6), C(7), D(10), E(5), F(5), G(12), H(4) |
| Family | 52 | A(7), B(6), C(6), D(12), E(5), F(4), G(10), H(4) |
| Multi-generational | 48 | A(7), B(6), C(6), D(11), E(5), F(4), G(9), H(3) |

All trip types have at least 46 questions (well above the 15 minimum from BRD AC-4). [Updated: Adults count adjusted from 50 to 49 after removing A6 from Adults appliesTo per SA FB-1]

---

## 4. Type-Aware Question Filtering

### 4.1 `getTypeFilteredQuestions(tripType)`

Returns an array of question keys that apply to the given trip type.

```javascript
function getTypeFilteredQuestions(tripType) {
  if (!tripType) return Object.keys(QUESTION_META); // no filtering
  return Object.entries(QUESTION_META)
    .filter(([key, meta]) => meta.appliesTo.includes(tripType))
    .map(([key]) => key);
}
```

### 4.2 Modified `applyDepth(level)`

```javascript
function applyDepth(level) {
  const maxTier = DEPTH_TO_MAX_TIER[level] || 3;
  const typeFiltered = new Set(getTypeFilteredQuestions(currentTripType.tripType));

  document.querySelectorAll('[data-question]').forEach(el => {
    const key = el.dataset.question || el.dataset.questionKey;
    const tier = parseInt(el.dataset.tier);
    const isTypeAllowed = typeFiltered.has(key);
    const isTierAllowed = tier <= maxTier;

    if (isTypeAllowed && isTierAllowed) {
      el.style.display = '';
      el.removeAttribute('data-depth-hidden');
    } else {
      el.style.display = 'none';
      el.setAttribute('data-depth-hidden', 'true');
    }
  });

  // For Family trips, apply balancing to reorder visible questions
  if (currentTripType.tripType === 'Family' || currentTripType.tripType === 'Multi-generational') {
    balanceFamilyQuestions(currentTripType.familyBalance);
  }

  // Existing: rebuild sub-dots, apply defaults, update stepper
  activeSteps = [0, 1, 2, 3, 4, 5, 6, 7];
  rebuildStyleSubDots(maxTier);
  applyDefaultSelections();
  // ... (rest of existing logic unchanged)
}
```

### 4.3 Category-Based Question Ordering

When rebuilding visible questions, sort by category (A-H alphabetical), then by tier (T1 first) within each category.

```javascript
function getVisibleStyleSlides() {
  const slides = Array.from(document.querySelectorAll('[data-question]:not([data-depth-hidden])'));
  // Sort by category then tier
  slides.sort((a, b) => {
    const metaA = QUESTION_META[a.dataset.question] || {};
    const metaB = QUESTION_META[b.dataset.question] || {};
    const catCompare = (metaA.category || 'Z').localeCompare(metaB.category || 'Z');
    if (catCompare !== 0) return catCompare;
    return (metaA.tier || 5) - (metaB.tier || 5);
  });
  return slides;
}
```

**Note:** This changes presentation order only. DOM order of question slides is preserved; the `getVisibleStyleSlides()` function returns a reordered array that `goToSubQuestion()` uses for navigation.

**Important (FB-3):** The `rebuildStyleSubDots()` function **must** call `getVisibleStyleSlides()` to obtain the sorted slide array and use that for assigning sub-dot indices. It must NOT iterate DOM children directly via `querySelectorAll` in DOM order, as that would produce sub-dot indices mismatched with the category-sorted presentation order. Specifically:
```javascript
function rebuildStyleSubDots(maxTier) {
  const sortedSlides = getVisibleStyleSlides(); // category-then-tier sorted
  // Build sub-dots based on sortedSlides order, not DOM order
  sortedSlides.forEach((slide, idx) => {
    slide.dataset.sortIndex = String(idx); // navigation uses this index
  });
  // ... create dot elements matching sortedSlides.length ...
}
```
Similarly, `applyDepth()` must invoke `rebuildStyleSubDots()` after the type+tier filtering is complete, and `rebuildStyleSubDots()` must delegate to `getVisibleStyleSlides()` for ordering. This ensures sub-dot indices, navigation, and presentation order are all consistent.

### 4.4 Hidden Question Defaults

Questions hidden due to type filtering (not just depth) use their `QUESTION_DEFAULTS` value in `generateMarkdown()`. The existing mechanism already handles this: `generateMarkdown()` reads the selected card from each question slide, falling back to the default if no card is selected or the slide is hidden.

### 4.5 Depth Selector Adaptation

When the depth overlay opens, compute the available question count for the detected trip type at each depth level:

```javascript
function updateDepthCardsForTripType(tripType) {
  const typeFiltered = getTypeFilteredQuestions(tripType);
  depthCards.forEach(card => {
    const depth = parseInt(card.dataset.depth);
    const maxTier = DEPTH_TO_MAX_TIER[depth];
    const available = typeFiltered.filter(key => {
      const meta = QUESTION_META[key];
      return meta && meta.tier <= maxTier;
    }).length;
    // Update card count display
    const countEl = card.querySelector('.depth-card__count');
    if (countEl) countEl.textContent = String(available);
    // Disable card if available === 0 (unlikely but defensive)
    card.classList.toggle('is-disabled', available === 0);
    // If available < depth number, show "(max N)" instead
    const labelEl = card.querySelector('.depth-card__number');
    if (labelEl) {
      const depthNum = parseInt(card.dataset.depth);
      if (available < depthNum) {
        labelEl.textContent = `${available}`;
        card.querySelector('.depth-card__max')?.remove();
        const maxBadge = document.createElement('span');
        maxBadge.className = 'depth-card__max';
        maxBadge.textContent = `(max)`;
        labelEl.after(maxBadge);
      }
    }
  });
  // --- Recommended badge adjustment (FB-2) ---
  // Default: "Recommended" badge is on depth 20 (Standard).
  // If the type-filtered pool at depth 20 has fewer questions than 20,
  // move the badge to the highest depth card whose available count >= its depth number.
  const RECOMMENDED_DEFAULT_DEPTH = 20;
  let recommendedCard = null;
  const defaultMaxTier = DEPTH_TO_MAX_TIER[RECOMMENDED_DEFAULT_DEPTH];
  const defaultAvailable = typeFiltered.filter(key => {
    const meta = QUESTION_META[key];
    return meta && meta.tier <= defaultMaxTier;
  }).length;

  if (defaultAvailable >= RECOMMENDED_DEFAULT_DEPTH) {
    // Standard depth has enough questions — keep badge on depth 20
    recommendedCard = Array.from(depthCards).find(c => parseInt(c.dataset.depth) === RECOMMENDED_DEFAULT_DEPTH);
  } else {
    // Find the highest depth card where available >= depth number
    const sorted = Array.from(depthCards).sort((a, b) => parseInt(b.dataset.depth) - parseInt(a.dataset.depth));
    for (const card of sorted) {
      const d = parseInt(card.dataset.depth);
      const mt = DEPTH_TO_MAX_TIER[d];
      const avail = typeFiltered.filter(key => {
        const meta = QUESTION_META[key];
        return meta && meta.tier <= mt;
      }).length;
      if (avail >= d) {
        recommendedCard = card;
        break;
      }
    }
    // If no card qualifies (all have fewer available than their depth), pick the one with the highest available count
    if (!recommendedCard) {
      recommendedCard = Array.from(depthCards).reduce((best, card) => {
        const mt = DEPTH_TO_MAX_TIER[parseInt(card.dataset.depth)];
        const avail = typeFiltered.filter(key => QUESTION_META[key]?.tier <= mt).length;
        const bestAvail = typeFiltered.filter(key => QUESTION_META[key]?.tier <= DEPTH_TO_MAX_TIER[parseInt(best.dataset.depth)]).length;
        return avail > bestAvail ? card : best;
      });
    }
  }
  // Move the recommended badge
  depthCards.forEach(card => card.classList.remove('is-recommended'));
  if (recommendedCard) recommendedCard.classList.add('is-recommended');

  // Update overlay title to show trip type
  const overlayTitle = overlay.querySelector('.depth-overlay__subtitle');
  if (overlayTitle) {
    overlayTitle.textContent = t('depth_type_prefix') + ' ' + t('tripType_' + tripType);
  }
}
```

---

## 5. Family Trip Balancing Logic

### 5.1 Purpose

For Family and Multi-generational trips, the question set is reordered within the visible pool to emphasize either kid-safety/energy-management questions or common-interest/teen-friendly questions based on child age distribution.

### 5.2 Question Tags

Each question in `QUESTION_META` has a `familyTag` property (optional):
- `kidSafety` — questions about nap schedules, energy management, early dining, kid activity style
- `commonInterest` — questions about group splitting, adventure level, cultural immersion
- `null` — neutral questions (majority)

### 5.3 Balancing Algorithm

```javascript
function balanceFamilyQuestions(familyBalance) {
  if (!familyBalance) return;

  // Get currently visible question slides
  const visible = Array.from(document.querySelectorAll('[data-question]:not([data-depth-hidden])'));

  // Assign priority boost based on balance
  const boostMap = {
    'kid-focused': { kidSafety: -10, commonInterest: 0 },   // kidSafety sorts first
    'balanced': { kidSafety: 0, commonInterest: 0 },          // no reordering
    'teen-friendly': { kidSafety: 0, commonInterest: -10 }    // commonInterest sorts first
  };

  const boost = boostMap[familyBalance] || boostMap['balanced'];

  // Only reorders within the same category — does not cross category boundaries
  // The effect is subtle: within a category, kid-safety questions appear earlier
  // for kid-focused families, and common-interest questions appear earlier for teen-friendly
  visible.forEach(slide => {
    const meta = QUESTION_META[slide.dataset.question];
    if (!meta || !meta.familyTag) return;
    const sortPriority = boost[meta.familyTag] || 0;
    slide.dataset.familySort = String(sortPriority);
  });
}
```

The `getVisibleStyleSlides()` sort function incorporates `familySort` as a secondary criterion (after category, before tier).

---

## 6. Type-Aware Pre-Selection Scoring (Steps 3-5)

### 6.1 `TRIP_TYPE_SCORING` Table

```javascript
const TRIP_TYPE_SCORING = {
  Solo: {
    interestBonus: {
      'Scenic Walking & Viewpoints': 2, 'Photography Spots & Scenic Lookouts': 2,
      'Local Food Markets & Street Food': 2, 'Guided Walking & History Tours': 2,
      'Bookshop Cafes & Literary Tours': 1, 'Wellness Retreats & Yoga': 1
    },
    avoidBonus: {
      // Safety-related avoids
      'Scam-prone areas': 2, 'Nightlife areas after 10pm': 1
    },
    foodBonus: {}
  },
  Couple: {
    interestBonus: {
      'Romantic Sunset Cruises': 3, 'Candlelit Dinner Experiences': 3,
      'Couples Spa & Massage': 2, 'Wine & Cheese Pairings': 2,
      'Stargazing Experiences': 2, 'Theater, Opera & Ballet': 1,
      'Rooftop Bars & Cocktail Lounges': 1, 'Romantic Horse-Drawn Carriage': 2
    },
    avoidBonus: {
      'Crowded family attractions': 2, 'Group tour buses': 2,
      'Noisy family restaurants': 1
    },
    foodBonus: {
      // Upscale dining bias
    }
  },
  Young: {
    interestBonus: {
      'Nightclubs & Dance Venues': 2, 'Pub Crawls & Bar Hopping': 2,
      'Bungee Jumping & Extreme Sports': 2, 'Music Festivals & Open-Air Concerts': 2,
      'Beach Clubs & Pool Parties': 2, 'Karaoke Bars': 1,
      'Stand-up Comedy Shows': 1, 'Gaming Cafes & VR Arcades': 1
    },
    avoidBonus: {
      'Slow-paced guided tours': 2
    },
    foodBonus: {}
  },
  Adults: {
    interestBonus: {
      'Wine Tasting & Vineyard Tours': 1, 'Hiking & Nature Trails': 1,
      'Art Galleries & Exhibitions': 1, 'Cycling & E-bike Tours': 1
    },
    avoidBonus: {
      'Kid-oriented attractions & play areas': 2
    },
    foodBonus: {}
  },
  Family: {
    interestBonus: {
      'Amusement & Theme Parks': 2, 'Scenic Train & Tram Rides': 2,
      'Mini Golf': 1, 'Bowling & Laser Tag': 1,
      'Family Cooking Workshops': 2, 'Nature Walks & Easy Hikes': 1
    },
    avoidBonus: {
      'Activities requiring heavy physical effort': 2,
      'Very loud clubs or concerts': 1
    },
    foodBonus: {}
  },
  'Multi-generational': {
    interestBonus: {
      'Scenic Train & Tram Rides': 2, 'Botanical Gardens & Arboretums': 2,
      'Thermal Baths & Wellness Spas': 2, 'Boat or River Cruises': 2,
      'Parks & Gardens': 1, 'Classical Music & Opera': 1
    },
    avoidBonus: {
      'Activities requiring heavy physical effort': 3,
      'Steep stairs without elevator access': 3,
      'Very loud clubs or concerts': 2,
      'Hilly terrain & steep inclines': 2
    },
    foodBonus: {}
  }
};
```

### 6.2 Development-Time Validation (FB-5)

To prevent silent regressions when pool items are renamed, a one-time validation runs on page load when a debug flag is set:

```javascript
function validateTripTypeScoring() {
  if (!window.DEBUG_TRIP_TYPE) return;
  const allInterestNames = new Set(Object.values(INTEREST_POOLS).flat().map(i => i.name || i));
  const allAvoidNames = new Set(Object.values(AVOID_POOLS || {}).flat().map(i => i.name || i));
  const allFoodNames = new Set(Object.values(FOOD_POOLS || {}).flat().map(i => i.name || i));

  Object.entries(TRIP_TYPE_SCORING).forEach(([type, scoring]) => {
    Object.keys(scoring.interestBonus || {}).forEach(name => {
      if (!allInterestNames.has(name)) console.warn(`[TripType] interestBonus key "${name}" in ${type} not found in INTEREST_POOLS`);
    });
    Object.keys(scoring.avoidBonus || {}).forEach(name => {
      if (!allAvoidNames.has(name)) console.warn(`[TripType] avoidBonus key "${name}" in ${type} not found in AVOID_POOLS`);
    });
    Object.keys(scoring.foodBonus || {}).forEach(name => {
      if (!allFoodNames.has(name)) console.warn(`[TripType] foodBonus key "${name}" in ${type} not found in FOOD_POOLS`);
    });
  });
}
// Call on DOMContentLoaded if DEBUG_TRIP_TYPE is set
```

This is a dev-only check. The `DEBUG_TRIP_TYPE` flag defaults to `false` and is not included in production. It can be enabled via `window.DEBUG_TRIP_TYPE = true` in the browser console or by adding `?debug=triptype` to the URL.

### 6.3 Modified `scoreItem()` (Interest Scoring)

```javascript
// Inside scoreAndFilterInterests()
const scoreItem = (item) => {
  let s = 0;
  // ... existing dimension scoring (energy, setting, culture, food, evening) ...

  // Trip type bonus
  const typeScoring = TRIP_TYPE_SCORING[currentTripType.tripType];
  if (typeScoring && typeScoring.interestBonus[item.name]) {
    s += typeScoring.interestBonus[item.name];
  }

  return s;
};
```

### 6.4 Modified `scoreAvoidItem()`

```javascript
function scoreAvoidItem(item, aq) {
  let score = 0;
  // ... existing dimension scoring (mobility, noise, foodadventure, budget, flexibility) ...

  // Trip type bonus
  const typeScoring = TRIP_TYPE_SCORING[currentTripType.tripType];
  if (typeScoring && typeScoring.avoidBonus[item.name]) {
    score += typeScoring.avoidBonus[item.name];
  }

  return score;
}
```

### 6.5 Pre-Selection Target Preservation

The existing pre-selection target of ~8-15 chips remains. Trip type bonuses are additive (typically +1 to +3), shifting borderline items above or below the threshold rather than drastically changing the set. The existing `topPicks` filter (score >= 5, max 15) and avoid pre-select threshold (score >= 3) naturally cap the selection count.

---

## 7. Trip Type UI Indicator

### 7.1 Context Bar Pill

A new pill is added to the context bar between the travelers pill and the depth pill.

**HTML:**
```html
<button type="button" class="context-bar__pill context-bar__pill--triptype"
        id="tripTypePill" style="display:none;" title="Edit travelers">
  <span class="context-bar__pill-icon" id="tripTypeIcon"></span>
  <span id="tripTypePillText"></span>
</button>
```

**CSS:**
```css
.context-bar__pill--triptype {
  background: var(--color-accent-alt);
  color: #fff;
}
```

**Icons per trip type:**
| Trip Type | Icon | Emoji |
|---|---|---|
| Solo | Backpack | &#127890; |
| Couple | Hearts | &#128149; |
| Young | Party | &#127881; |
| Adults | Briefcase | &#128188; |
| Family | Family | &#128106; |
| Multi-generational | Chain | &#129309; |

**Behavior:** Clicking the pill navigates back to Step 1, consistent with the travelers pill.

### 7.2 Toast Notification

After trip type detection completes, a toast notification shows briefly:

```javascript
function showTripTypeToast(tripType) {
  const icon = TRIP_TYPE_ICONS[tripType];
  const name = t('tripType_' + tripType);
  showToast(`${icon} ${t('tripType_detected_prefix')} ${name}`, 'info');
}
```

### 7.3 i18n Keys

New translation keys required:
- `tripType_Solo`, `tripType_Couple`, `tripType_Young`, `tripType_Adults`, `tripType_Family`, `tripType_Multi-generational` (6 keys x 12 languages)
- `tripType_detected_prefix` — "Detected trip type:" (12 languages)
- `depth_type_prefix` — "Customized for your" (12 languages)
- `familyBalance_kid-focused`, `familyBalance_balanced`, `familyBalance_teen-friendly` (3 keys x 12 languages)
- ~42 new question titles: `q_{key}_title` (42 keys x 12 languages)
- ~42 new question descriptions: `q_{key}_desc` (42 keys x 12 languages)
- ~42 x 3 new option labels: `q_{key}_{value}` (~126 keys x 12 languages)
- Full translations provided for en/ru/he; other 9 languages fall back to English via existing `t()` mechanism.

---

## 8. Markdown Output Specification

### 8.1 New Field in `## Trip Context`

Inserted after `- **Departure:**` and before `### Daily Schedule`:

```markdown
- **Trip Type:** {Solo|Couple|Young|Adults|Family|Multi-generational}
```

For Family and Multi-generational trips with balancing:
```markdown
- **Trip Type:** Family
- **Family Balance:** kid-focused
```

### 8.2 Modified `generateMarkdown()`

```javascript
function generateMarkdown() {
  // ... existing code for dest, arrival, departure ...

  md += `- **Destination:** ${dest}\n`;
  md += `- **Arrival:** ${arrival}\n`;
  md += `- **Departure:** ${departure}\n`;

  // NEW: Trip type field
  if (currentTripType.tripType) {
    md += `- **Trip Type:** ${currentTripType.tripType}\n`;
    if (currentTripType.familyBalance) {
      md += `- **Family Balance:** ${currentTripType.familyBalance}\n`;
    }
  }

  md += `\n### Daily Schedule\n\n`;
  // ... rest of existing code ...
}
```

**Note:** Trip type value is always in English regardless of UI or report language, consistent with other identifier fields.

---

## 9. Rule File Updates

| Rule File | Section | Change |
|---|---|---|
| `trip_intake_rules.md` | New section "Trip Type Detection" (after "Wizard Flow") | Add detection algorithm, priority table, constants, invocation timing |
| `trip_intake_rules.md` | "Question Inventory & Depth Tiers" | Rewrite to include 72 questions, 8 categories, per-question metadata table, per-type availability counts |
| `trip_intake_rules.md` | "Question Depth Selector" | Add type-aware filtering paragraph, adapted depth card behavior |
| `trip_intake_rules.md` | New subsection "Family Trip Balancing" (under Trip Type Detection) | Add balance computation algorithm, familyTag definitions, reordering logic |
| `trip_intake_rules.md` | "Dynamic Interest Engine — Profile Flags" | Note that `detectTripType()` consumes `analyzeGroup()` flags; no flag changes |
| `trip_intake_rules.md` | "Answer -> Pre-selection Mapping" | Add trip type bonus/penalty table and explanation |
| `trip_intake_rules.md` | "Output Format" | Add `Trip Type` and `Family Balance` fields to markdown template |
| `trip_intake_design.md` | "Selection Summary Strip (`.context-bar`)" | Add trip type pill spec (color, icon, position, behavior) |
| `trip_intake_design.md` | "Depth Selector Overlay" | Add type-aware title, adapted count display, max badge spec |
| `trip_intake_design.md` | "Toast Notifications" | Add trip type detection toast spec |
| `trip_planning_rules.md` | "Pre-Flight Setup" | Add step: "5. **Trip Type:** Read `trip_context.trip_type`. If missing, infer from traveler composition using detection logic." |
| `trip_planning_rules.md` | "The Interest Hierarchy" | Add: "Trip type adjusts priority weighting: Couple trips elevate romantic POIs, Young trips elevate nightlife/adventure, Multi-gen trips elevate accessible/comfortable POIs." |
| `trip_planning_rules.md` | "The Age-Appropriate Filter" | Add: "For Solo/Young trips, apply safety-awareness bias (well-lit areas, avoid isolated zones at night). For Multi-gen, apply accessibility bias." |
| `trip_planning_rules.md` | "Culinary Selection" | Add: "Trip type informs default dining style: Couple → upscale bias with romantic settings; Young → street food/casual bias with social venues; Family → kid-friendly early dinner timing; Multi-gen → accessible venues with varied menus." |

---

## 10. New DOM Elements for Question Slides

Each new question requires a `.question-slide` DOM element in Step 2's questionnaire viewport. The structure matches existing questions:

```html
<div class="question-slide" data-question="{key}" data-qindex="{N}" data-question-key="{key}" data-tier="{tier}">
  <h3 class="question-title" data-i18n="q_{key}_title">{English title}</h3>
  <p class="question-desc" data-i18n="q_{key}_desc">{English description}</p>
  <div class="question-options">
    <div class="q-card" data-value="{option1_value}" tabindex="0" role="radio" aria-checked="false">
      <div class="q-card__icon">{emoji}</div>
      <div class="q-card__title" data-i18n="q_{key}_{option1_value}">{option1 label}</div>
      <div class="q-card__desc" data-i18n="q_{key}_{option1_value}_desc">{option1 desc}</div>
    </div>
    <!-- 2-3 more q-cards -->
  </div>
</div>
```

42 new slides will be added after the existing 30, maintaining sequential `data-qindex` values (30-71). The `data-tier` attribute must match `QUESTION_TIERS`. All text elements have `data-i18n` attributes.

---

## 11. Implementation Checklist

### Phase 1: Data Layer
- [ ] Define `QUESTION_META` constant with all 72 questions (30 existing + 42 new) including category, tier, appliesTo, options, default, scoringTags, familyTag
- [ ] Extend `QUESTION_TIERS` with 42 new entries
- [ ] Extend `QUESTION_DEFAULTS` with 42 new entries
- [ ] Define `TRIP_TYPE_SCORING` constant
- [ ] Define `TRIP_TYPE_ICONS` constant
- [ ] Define `SENIOR_AGE` constant (65)
- [ ] Define `FAMILY_KID_THRESHOLD` constant (0.4) and `FAMILY_TEEN_THRESHOLD` constant (0.7)
- [ ] Implement `validateTripTypeScoring()` dev-time validation function

### Phase 2: Detection Logic
- [ ] Implement `detectTripType(arrivalDate)` function
- [ ] Implement `computeFamilyBalance(childAges)` function
- [ ] Add `currentTripType` module-level variable
- [ ] Hook detection into Step 1 completion flow (before depth overlay)
- [ ] Ensure re-detection on Step 1 re-entry

### Phase 3: Question Filtering
- [ ] Implement `getTypeFilteredQuestions(tripType)` function
- [ ] Modify `applyDepth(level)` to apply two-stage filtering (type + tier)
- [ ] Modify `getVisibleStyleSlides()` to sort by category then tier
- [ ] Ensure `rebuildStyleSubDots()` delegates to `getVisibleStyleSlides()` for sorted order (not DOM order)
- [ ] Implement `balanceFamilyQuestions(familyBalance)` function
- [ ] Verify hidden questions use defaults in markdown output

### Phase 4: UI Updates
- [ ] Add trip type pill to context bar HTML
- [ ] Add trip type pill CSS (`.context-bar__pill--triptype`)
- [ ] Implement `updateTripTypePill()` function
- [ ] Implement `showTripTypeToast()` function
- [ ] Modify depth overlay to show trip-type-aware counts and title
- [ ] Implement "Recommended" badge relocation logic in `updateDepthCardsForTripType()`
- [ ] Add 42 new question slide DOM elements to Step 2
- [ ] Ensure new slides have correct `data-tier`, `data-question`, `data-qindex` attributes

### Phase 5: Pre-Selection Scoring
- [ ] Modify `scoreItem()` in `scoreAndFilterInterests()` to add trip type bonus
- [ ] Modify `scoreAvoidItem()` to add trip type bonus
- [ ] Modify `scoreFoodItem()` to add trip type bonus (if applicable)
- [ ] Verify pre-selection stays within ~8-15 chip target

### Phase 6: Markdown Output
- [ ] Modify `generateMarkdown()` to include `Trip Type` field after Departure
- [ ] Add `Family Balance` sub-field for Family/Multi-gen trips
- [ ] Verify preview in Step 7 shows new fields

### Phase 7: i18n
- [ ] Add trip type name keys to TRANSLATIONS (6 types x 12 languages)
- [ ] Add trip type UI keys (detected_prefix, depth_type_prefix, familyBalance) to TRANSLATIONS
- [ ] Add new question title/desc/option keys to TRANSLATIONS (en/ru/he full, others fallback)
- [ ] Add new question items to ITEM_I18N if applicable
- [ ] Verify RTL layout for trip type pill and new questions

### Phase 8: Rule Files
- [ ] Update `trip_intake_rules.md` with Trip Type Detection section
- [ ] Update `trip_intake_rules.md` Question Inventory with 72-question table
- [ ] Update `trip_intake_rules.md` Output Format with trip type field
- [ ] Update `trip_intake_design.md` with trip type pill and depth overlay specs
- [ ] Update `trip_planning_rules.md` Pre-Flight Setup, Interest Hierarchy, Age-Appropriate Filter, Culinary Selection

---

## 12. BRD Traceability

| Requirement | Acceptance Criterion | Implemented in |
|---|---|---|
| REQ-001 AC-1 | Solo: 1 adult 25, 0 children → Solo | `detectTripType()`: Priority 1 rule |
| REQ-001 AC-2 | Couple: 2 adults 30+28, 0 children → Couple | `detectTripType()`: Priority 2 rule |
| REQ-001 AC-3 | Young: 3 adults all 18-30, 0 children → Young | `detectTripType()`: Priority 3 rule |
| REQ-001 AC-4 | Family: 2 adults 35+33, 1 child 5 → Family | `detectTripType()`: Priority 5 rule |
| REQ-001 AC-5 | Multi-gen: seniors 68+65, adult 35, child 8 → Multi-gen | `detectTripType()`: Priority 4 rule |
| REQ-001 AC-6 | Adults: 4 adults 40-55, 0 children → Adults | `detectTripType()`: Priority 6 rule |
| REQ-001 AC-7 | 2 adults 28+29, 0 children → Couple (not Young) | `detectTripType()`: Priority 2 before 3; Young requires 3+ adults |
| REQ-001 AC-8 | Re-evaluates on traveler add/remove | `onStep1Complete()` called on every Step 1 → forward transition |
| REQ-001 AC-9 | Uses age at arrival date | `detectTripType()` receives `arrivalDate` from Step 0 |
| REQ-001 AC-10 | 1 adult 70, 0 children → Solo | `detectTripType()`: Priority 1 (Solo) before Priority 6 (Adults) |
| REQ-002 AC-1 | Trip type indicator displayed | `showTripTypeToast()` after detection |
| REQ-002 AC-2 | Context bar pill with icon + name | Trip type pill in context bar with `TRIP_TYPE_ICONS` |
| REQ-002 AC-3 | Pill updates on traveler change | `updateTripTypePill()` called on re-detection |
| REQ-002 AC-4 | i18n for 12 languages | `tripType_*` keys in TRANSLATIONS |
| REQ-002 AC-5 | Pill tappable → Step 1 | Click handler navigates to Step 1 |
| REQ-002 AC-6 | RTL layout correct | Inherits RTL from context bar flex-direction reversal |
| REQ-003 AC-1 | 65-75 questions total | 72 questions in QUESTION_META |
| REQ-003 AC-2 | All 30 existing preserved | All 30 keys present in QUESTION_META with original options |
| REQ-003 AC-3 | Each question has category, appliesTo, tier | QUESTION_META structure enforces this |
| REQ-003 AC-4 | Every type has >=15 questions | Minimum is 46 (Young), well above 15 |
| REQ-003 AC-5 | Category H has >=7 new questions | H1-H7, all new |
| REQ-003 AC-6 | New questions have 3-4 options | All new questions defined with 3 options |
| REQ-003 AC-7 | QUESTION_DEFAULTS includes all new | 42 new entries added to QUESTION_DEFAULTS |
| REQ-004 AC-1 | Solo depth 20 shows only Solo-applicable | `getTypeFilteredQuestions('Solo')` + tier filter |
| REQ-004 AC-2 | Family depth 20 shows only Family-applicable | `getTypeFilteredQuestions('Family')` + tier filter |
| REQ-004 AC-3 | Non-applicable questions never shown | `applyDepth()` two-stage filter |
| REQ-004 AC-4 | Hidden questions use defaults | `QUESTION_DEFAULTS` read in `generateMarkdown()` |
| REQ-004 AC-5 | Depth overlay shows available count | `updateDepthCardsForTripType()` |
| REQ-004 AC-6 | Fewer questions than depth → show all | Tier filter caps at available; no error |
| REQ-004 AC-7 | Tier ordering preserved | `getVisibleStyleSlides()` sorts by category then tier |
| REQ-004 AC-8 | Sub-dots reflect filtered count | `rebuildStyleSubDots()` counts visible slides |
| REQ-004 AC-9 | Changing trip type resets Step 2 | Detection triggers `applyDepth()` which rebuilds everything |
| REQ-005 AC-1 | Family with toddler sees more kid-safety Qs | `balanceFamilyQuestions('kid-focused')` reorders |
| REQ-005 AC-2 | Family with toddler+teen sees balanced | `computeFamilyBalance()` returns 'balanced' |
| REQ-005 AC-3 | Balancing within Family pool only | `balanceFamilyQuestions()` operates on visible slides only |
| REQ-005 AC-4 | Markdown includes Family Balance | `generateMarkdown()` writes `Family Balance` field |
| REQ-006 AC-1 | Scoring bonus/penalty by trip type | `TRIP_TYPE_SCORING` table applied in scoring functions |
| REQ-006 AC-2 | Couple pre-selects >=2 romantic cards | `TRIP_TYPE_SCORING.Couple.interestBonus` gives +2/+3 to romantic items |
| REQ-006 AC-3 | Multi-gen pre-selects accessibility avoid | `TRIP_TYPE_SCORING['Multi-generational'].avoidBonus` gives +3 to accessibility avoids |
| REQ-006 AC-4 | Solo pre-selects safety/comfort card | `TRIP_TYPE_SCORING.Solo.interestBonus` gives +2 to solo-comfort items |
| REQ-006 AC-5 | Pre-selection stays ~8-15 chips | Additive bonuses are +1 to +3; existing thresholds (score>=5, score>=3) remain |
| REQ-006 AC-6 | analyzeGroup() flags still work | `analyzeGroup()` is unchanged; trip type scoring is additive |
| REQ-007 AC-1 | Markdown has Trip Type field | `generateMarkdown()` writes `- **Trip Type:** {value}` |
| REQ-007 AC-2 | Field in ## Trip Context | Inserted after Departure, before ### Daily Schedule |
| REQ-007 AC-3 | Family trips include Family Balance | Conditional write in `generateMarkdown()` |
| REQ-007 AC-4 | Non-family trips omit Family Balance | Conditional write checks `familyBalance !== null` |
| REQ-007 AC-5 | Value always in English | Trip type stored as English constant string, not translated |
| REQ-007 AC-6 | Preview shows trip type | Step 7 preview renders `generateMarkdown()` output |
| REQ-008 AC-1 | Pre-Flight Setup lists Trip Type | New step 5 in Pre-Flight Setup |
| REQ-008 AC-2 | Interest Hierarchy describes weighting | New paragraph in Interest Hierarchy section |
| REQ-008 AC-3 | Age-Appropriate Filter references trip type | New paragraph referencing Solo/Young safety |
| REQ-008 AC-4 | Culinary Selection references trip type | New paragraph with dining style defaults per type |
| REQ-008 AC-5 | Backward compatibility fallback | Pre-Flight Setup: "If missing, infer from traveler composition" |
| REQ-009 AC-1 | Depth overlay shows trip type name | `updateDepthCardsForTripType()` sets subtitle |
| REQ-009 AC-2 | Each depth card shows actual count | Per-card count computed from filtered pool |
| REQ-009 AC-3 | Pool < 30 → show "(max)" | `depth-card__max` badge logic |
| REQ-009 AC-4 | Recommended badge adjusts | `updateDepthCardsForTripType()`: explicit badge relocation logic — checks if depth-20 pool < 20, finds highest viable card, falls back to highest-count card [FB-2] |
| REQ-009 AC-5 | Depth text translated | `depth_type_prefix` key in TRANSLATIONS |
| REQ-009 AC-6 | Keyboard navigation works | Existing keyboard handler unchanged |
| REQ-010 AC-1 | Same-category questions grouped | `getVisibleStyleSlides()` sorts by category |
| REQ-010 AC-2 | Categories in A-H order | Alphabetical sort on category string |
| REQ-010 AC-3 | Within category, lower tier first | Secondary sort by tier |
| REQ-010 AC-4 | Ordering consistent across types | Sort logic is deterministic, independent of trip type |

---

## 13. Revision History

| Version | Date | Change | SA Feedback |
|---|---|---|---|
| v1 | 2026-03-21 | Initial draft | — |
| v2 | 2026-03-21 | Addressed SA architecture review | FB-1 through FB-8 |

### v2 Changes (SA Review Response)

**FB-1 (Blocking) -- RESOLVED:** Removed the hybrid `Adults + flags.senior` condition from A6 `energyManagement`. The `appliesTo` array is now `['Family', 'Multi-generational']` only. Rationale: Multi-gen already covers senior+children scenarios. For all-adult groups with a senior (classified as "Adults"), `relaxationTime` (F2) and `restDayFrequency` (A7) -- both applying to all trip types -- provide equivalent energy management coverage. The `appliesTo` model remains a pure string-match array with no flag-based escape hatches. Adults per-type count adjusted from 50 to 49.

**FB-2 (Recommendation) -- RESOLVED:** Added explicit "Recommended" badge relocation logic to `updateDepthCardsForTripType()` (section 4.5). The logic checks whether depth-20's filtered pool has >= 20 questions; if not, it finds the highest depth card whose available count meets or exceeds its depth number; final fallback picks the card with the highest absolute count. Added to implementation checklist (Phase 4).

**FB-3 (Recommendation) -- RESOLVED:** Added explicit documentation in section 4.3 confirming that `rebuildStyleSubDots()` must delegate to `getVisibleStyleSlides()` for sorted order. Includes a code snippet showing the `data-sortIndex` assignment pattern. Added to implementation checklist (Phase 3).

**FB-4 (Recommendation) -- DEFERRED:** Added a follow-up refactoring note in section 3.1 documenting the plan to derive `QUESTION_TIERS` and `QUESTION_DEFAULTS` from `QUESTION_META` post-stabilization. Not part of initial implementation to preserve backward compatibility during rollout.

**FB-5 (Recommendation) -- RESOLVED:** Added `validateTripTypeScoring()` dev-time validation function (new section 6.2) that checks all `TRIP_TYPE_SCORING` keys against actual pool items. Runs only when `DEBUG_TRIP_TYPE` flag is set. Added to implementation checklist (Phase 1).

**FB-6 (Observation) -- ACKNOWLEDGED:** Senior-without-children gap is a known limitation matching the BRD definition. No design change. Documented in SA review for future consideration.

**FB-7 (Observation) -- ACKNOWLEDGED:** Category B has 8 questions (not 7) and Category D has 14 (not 13); total 72 is within BRD's 65-75 range. No change needed.

**FB-8 (Observation) -- RESOLVED:** Extracted family balance thresholds as named constants `FAMILY_KID_THRESHOLD` (0.4) and `FAMILY_TEEN_THRESHOLD` (0.7) in section 2.3, alongside existing `SENIOR_AGE`. Documented as initial estimates subject to tuning. Added to implementation checklist (Phase 1).
