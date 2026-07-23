const SEVERITY_PENALTY = {
  Low: 3,
  Medium: 7,
  High: 12,
  Critical: 20,
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function buildDriverSafetyTrend(violations, currentRiskScore = 0, months = 6) {
  const valid = (violations || []).filter(v => v.status !== 'Rejected');
  const now = new Date();
  const trend = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const upToMonth = valid.filter(v => new Date(v.timestamp) <= monthEnd);
    const totalPenalty = upToMonth.reduce(
      (sum, v) => sum + (SEVERITY_PENALTY[v.severity] || 10),
      0
    );

    let score = Math.max(0, Math.min(100, 100 - totalPenalty));
    if (i === 0) {
      score = Math.max(0, Math.min(100, 100 - (currentRiskScore ?? 0)));
    }

    trend.push({ month: MONTH_NAMES[monthDate.getMonth()], score: Math.round(score) });
  }

  return trend;
}

export function getSafetyScore(riskScore = 0) {
  return Math.max(0, Math.min(100, 100 - (riskScore ?? 0)));
}
