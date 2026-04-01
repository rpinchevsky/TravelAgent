/**
 * Step Registry — Single source of truth for wizard step-to-content mapping.
 *
 * When steps are reordered or added, update this ONE file. All tests import
 * step numbers from here instead of hardcoding them.
 *
 * Best practice: tests should reference STEPS.interests instead of literal 4.
 */

/** Wizard step numbers indexed by semantic name */
export const STEPS = {
  trip: 0,
  travelers: 1,
  stay: 2,
  questionnaire: 3,
  interests: 4,
  avoids: 5,
  food: 6,
  details: 7,
  review: 8,
} as const;

/** Total step count (0-based, inclusive) */
export const STEP_COUNT = Object.keys(STEPS).length;

/** Ordered stepper label i18n keys (index = step number) */
export const STEPPER_LABEL_KEYS = [
  'step_trip',
  'step_travelers',
  'step_stay',
  'step_style',
  'step_interests',
  'step_avoid',
  'step_food',
  'step_details',
  'step_review',
] as const;

/** Stepper emoji per step index (visual identity) */
export const STEPPER_EMOJIS: Record<number, string> = {
  [STEPS.stay]: '🏨',
  [STEPS.questionnaire]: '🎯',
};

/** Content markers — map step number to the primary container ID within that step */
export const STEP_CONTENT_MARKERS: Record<number, string> = {
  [STEPS.questionnaire]: '.question-slide',
  [STEPS.interests]: '#interestsSections',
  [STEPS.avoids]: '#avoidSections',
  [STEPS.food]: '#foodExperienceCards',
  [STEPS.details]: '#reportLang',
  [STEPS.review]: '#previewContent',
};

/** Steps where the context bar should be visible */
export const CONTEXT_BAR_VISIBLE_STEPS = [
  STEPS.travelers,
  STEPS.stay,
  STEPS.questionnaire,
  STEPS.interests,
  STEPS.avoids,
  STEPS.food,
  STEPS.details,
] as const;

/** Steps where the context bar should be hidden */
export const CONTEXT_BAR_HIDDEN_STEPS = [
  STEPS.trip,
  STEPS.review,
] as const;

/**
 * Step data-i18n keys for title and description per step.
 * Format: { title: 'sN_title', desc: 'sN_desc' }
 */
export const STEP_I18N_KEYS: Record<number, { title: string; desc: string }> = {
  [STEPS.stay]: { title: 's2_title', desc: 's2_desc' },
  [STEPS.questionnaire]: { title: 's3_title', desc: 's3_desc' },
  [STEPS.interests]: { title: 's4_title', desc: 's4_desc' },
  [STEPS.avoids]: { title: 's5_title', desc: 's5_desc' },
  [STEPS.food]: { title: 's6_title', desc: 's6_desc' },
  [STEPS.details]: { title: 's7_title', desc: 's7_desc' },
  [STEPS.review]: { title: 's8_title', desc: 's8_desc' },
};
