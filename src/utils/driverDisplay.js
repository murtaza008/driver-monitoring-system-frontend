export const getPerformanceLevel = (score, thresholds = { excellent: 90, good: 70, average: 50 }) => {
  if (score >= thresholds.excellent) return 'Excellent';
  if (score >= thresholds.good) return 'Good';
  if (score >= thresholds.average) return 'Average';
  return 'Poor';
};

export const defaultNotificationTemplates = {
  'Drowsiness': 'Alert: Driver {name} detected with drowsiness. Please take a break immediately.',
  'Yawning': 'Notice: Frequent yawning detected for driver {name}. Consider scheduling a rest stop.',
  'Distraction': 'Warning: Driver {name} appears distracted. Please focus on the road.',
  'Mobile Usage': 'Critical: Driver {name} detected using mobile phone while driving. Immediate action required.',
  'Seatbelt': 'Alert: Driver {name} is not wearing a seatbelt. Please buckle up immediately.',
  'Smoking': 'Notice: Driver {name} detected smoking in the vehicle. This violates company policy.',
};

export const severityColor = (severity) => {
  switch (severity) {
    case 'Low': return 'bg-success/20 text-success';
    case 'Medium': return 'bg-warning/20 text-warning';
    case 'High': return 'bg-danger/20 text-danger';
    case 'Critical': return 'bg-destructive text-destructive-foreground';
  }
};

export const statusColor = (status) => {
  if (status === 'Active') return 'bg-success/20 text-success';
  return 'bg-muted text-muted-foreground';
};

export const performanceColor = (level) => {
  switch (level) {
    case 'Excellent': return 'bg-success/20 text-success';
    case 'Good': return 'bg-primary/20 text-primary';
    case 'Average': return 'bg-warning/20 text-warning';
    case 'Poor': return 'bg-danger/20 text-danger';
  }
};

export const getDriverInitials = (d) => {
  if (d.firstName && d.lastName) return `${d.firstName[0]}${d.lastName[0]}`;
  if (d.name) {
    const parts = d.name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`;
    return parts[0][0] || '?';
  }
  return '?';
};
