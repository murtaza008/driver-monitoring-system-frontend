// Illustrative placeholders only — used (with a "Sample data" badge) so a brand-new
// company's charts don't look broken/empty before any real activity exists yet.
// Swapped out automatically the moment real data shows up.
export const SAMPLE_WEEKLY = [
  { day: 'Sun', count: 2 }, { day: 'Mon', count: 4 }, { day: 'Tue', count: 1 },
  { day: 'Wed', count: 3 }, { day: 'Thu', count: 5 }, { day: 'Fri', count: 2 }, { day: 'Sat', count: 1 },
];

export const SAMPLE_TYPES = [
  { name: 'Drowsiness', value: 4 }, { name: 'Mobile Usage', value: 3 },
  { name: 'Distraction', value: 2 }, { name: 'Seatbelt', value: 1 },
];

const SAMPLE_TREND_SCORES = [90, 92, 88, 91, 94, 93, 95];
export const SAMPLE_TREND = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (6 - i));
  return { date: d.toISOString().slice(0, 10), score: SAMPLE_TREND_SCORES[i] };
});

export const isWeeklyEmpty = (weeklyViolations) =>
  !weeklyViolations || weeklyViolations.length === 0 || weeklyViolations.every(w => !w.count);

export const isTypesEmpty = (violationTypes) =>
  !violationTypes || violationTypes.length === 0 || violationTypes.every(t => !t.value);

export const isTrendEmpty = (trend) => !trend || trend.length < 2;
