// Composite urgency score: attendance 50%, math 30%, consecutive decline 20%
// Returns 0–100 where 100 = most urgent

export function computeUrgencyScore(student) {
  const { attendanceRate, mathScore, consecutiveWeeksDecline } = student;

  // Attendance: invert so 0% attendance = 100 urgency, 100% = 0
  const attendanceUrgency = (1 - attendanceRate) * 100;

  // Math: invert so score 0 = 100 urgency, score 100 = 0
  const mathUrgency = 100 - Math.min(mathScore, 100);

  // Decline: cap at 10 weeks for scaling
  const declineUrgency = Math.min(consecutiveWeeksDecline, 10) * 10;

  const score =
    attendanceUrgency * 0.5 +
    mathUrgency * 0.3 +
    declineUrgency * 0.2;

  return Math.round(score);
}

export function classifyTier(student) {
  const { attendanceRate, mathScore } = student;

  // Tier 3: severely at risk
  if (attendanceRate < 0.75 || mathScore < 55) return 3;

  // Tier 2: moderately at risk
  if (attendanceRate < 0.90 || mathScore < 75) return 2;

  // Tier 1: on track
  return 1;
}

export const TIER_LABELS = { 1: 'Tier 1', 2: 'Tier 2', 3: 'Tier 3' };

export const TIER_COLORS = {
  1: {
    border: 'border-l-green-500',
    badge: 'bg-green-100 text-green-800',
    ring: 'ring-green-200',
  },
  2: {
    border: 'border-l-amber-500',
    badge: 'bg-amber-100 text-amber-800',
    ring: 'ring-amber-200',
  },
  3: {
    border: 'border-l-red-500',
    badge: 'bg-red-100 text-red-800',
    ring: 'ring-red-200',
  },
};
