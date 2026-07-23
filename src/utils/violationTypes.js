export const VIOLATION_FILTER_TYPES = [
  'Drowsiness',
  'Yawning',
  'Distraction',
  'Mobile Usage',
  'Seatbelt',
  'Smoking',
];

const TYPE_TO_LABEL = {
  // Current Android ViolationType enum names (see ViolationDurationTracker.kt)
  DROWSINESS: 'Drowsiness',
  PHONE: 'Mobile Usage',
  YAWNING: 'Yawning',
  DISTRACTION: 'Distraction',
  SEATBELT: 'Seatbelt',
  SMOKING: 'Smoking',
  SPEED: 'Speed',
  CRASH: 'Crash',
  // Legacy names kept for backward compatibility with any pre-existing rows
  DROWSY: 'Drowsiness',
  MOBILE_USAGE: 'Mobile Usage',
};

export function normalizeViolationLabel(type) {
  if (!type) return 'General';
  return TYPE_TO_LABEL[type] || type;
}

export function formatViolationDisplay(type) {
  const label = normalizeViolationLabel(type);
  return label
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function matchesViolationLabel(type, filterLabel) {
  if (!filterLabel || filterLabel === 'all') return true;
  return normalizeViolationLabel(type) === filterLabel;
}
