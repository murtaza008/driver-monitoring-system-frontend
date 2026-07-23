import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Eye, Brain, Phone, Cigarette, ShieldOff, AlertTriangle } from 'lucide-react';
import { severityColor } from '@/utils/driverDisplay';

const icons = {
  'Drowsiness': Eye, 'Yawning': Brain, 'Distraction': Brain,
  'Mobile Usage': Phone, 'Seatbelt': ShieldOff, 'Smoking': Cigarette,
};

const violationSeverityInfo = {
  'Drowsiness': {
    description: 'Sustained eye closure detected by the on-device camera (EAR-based). Severity escalates the longer the eyes stay closed.',
    low: '0.5 – 1.0 sec of continuous eye closure. Early fatigue signal, above a normal blink.',
    medium: '1.0 – 2.0 sec. Progressive eye closure — transitioning from alert to drowsy.',
    high: '2.0 – 3.5 sec. Approaching microsleep territory.',
    critical: 'Over 3.5 sec. Microsleep confirmed — driver has lost conscious control.',
  },
  'Yawning': {
    description: 'Sustained mouth-open (yawn) detected by the on-device camera. Severity escalates with how long the yawn lasts.',
    low: '1.0 – 2.5 sec. Brief mouth opening — early yawn onset.',
    medium: '2.5 – 5.0 sec. Full yawn in progress, moderate fatigue signal.',
    high: '5.0 – 7.0 sec. Extended yawn, deeper fatigue.',
    critical: 'Over 7.0 sec, or back-to-back yawns. Severe fatigue.',
  },
  'Distraction': {
    description: 'Sustained head turn away from the road (yaw/pitch) detected by the on-device camera. Severity escalates with how long the driver looks away.',
    low: '0.5 – 1.5 sec of head deviation. Brief glance — mirror/shoulder check territory.',
    medium: '1.5 – 2.5 sec. Crosses the safe-glance threshold — confirmed distraction.',
    high: '2.5 – 4.0 sec. Well beyond the safe limit.',
    critical: 'Over 4.0 sec. Severe distraction requiring immediate attention.',
  },
  'Mobile Usage': {
    description: 'Sustained phone detection by the on-device camera. Since phone use is a deliberate choice, severity escalates faster than fatigue-based violations.',
    low: '1 – 3 sec of phone detection. Could be a brief glance at a mounted screen.',
    medium: '3 – 6 sec. Confirmed phone interaction.',
    high: '6 – 10 sec. Extended use — likely active texting or a call.',
    critical: 'Over 10 sec. Prolonged phone use while driving.',
  },
  'Seatbelt': {
    description: 'Continuous seatbelt absence since the monitoring session started. Risk is constant regardless of duration, but a grace period allows for buckling up at trip start.',
    low: '0 – 15 sec since session start. Grace period — first reminder.',
    medium: '15 – 60 sec. Driver should have buckled up by now.',
    high: '1 – 3 min. Sustained non-compliance.',
    critical: 'Over 3 min. Deliberate, prolonged refusal — fleet manager notified immediately.',
  },
  'Smoking': {
    description: 'Sustained smoking detection by the on-device camera. A deliberate manual-visual distraction, similar in risk category to phone use.',
    low: '1 – 4 sec of smoking detection. Gesture beginning or building confidence.',
    medium: '4 – 8 sec. Confirmed active smoking.',
    high: '8 – 15 sec. Extended smoking episode — inhaling, ashing, adjusting.',
    critical: 'Over 15 sec. Prolonged smoking — fleet manager alerted.',
  },
};

const severities = ['Low', 'Medium', 'High', 'Critical'];

const SeverityInfo = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Severity Information</h1>
        <p className="text-muted-foreground text-sm">Detailed breakdown of violation types and their severity levels</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          <p className="text-sm font-medium text-foreground">How Severity Works</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Each violation detected by the AI camera is classified into one of four severity levels based on the nature, duration, and frequency of the behavior. Below is a detailed guide for each violation type.
        </p>
      </motion.div>

      <div className="space-y-4">
        {Object.keys(violationSeverityInfo).map((type, i) => {
          const Icon = icons[type];
          const info = violationSeverityInfo[type];
          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{type}</h3>
                  <p className="text-xs text-muted-foreground">{info.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {severities.map(sev => {
                  const key = sev.toLowerCase();
                  return (
                    <div key={sev} className="p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge variant="outline" className={`${severityColor(sev)} border-0 text-xs`}>{sev}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{info[key]}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default SeverityInfo;
