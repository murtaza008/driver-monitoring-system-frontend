import { motion } from 'framer-motion';
import { Trophy, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { getPerformanceLevel, getDriverInitials } from '@/utils/driverDisplay';
import { useThresholds } from '@/hooks/useThresholds';
import PerformanceBadge from '@/components/drivers/PerformanceBadge';
import SampleBadge from '@/components/dashboard/SampleBadge';
import { SAMPLE_WEEKLY, SAMPLE_TYPES, isWeeklyEmpty, isTypesEmpty } from '@/utils/sampleChartData';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const Summary = () => {
  const { data: thresholds } = useThresholds();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await api.get('/stats');
      return data;
    },
    refetchInterval: 5000,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data } = await api.get('/drivers');
      return data;
    },
    refetchInterval: 5000,
  });

  if (isLoading) return <LoadingSpinner label="Loading summary..." />;

  // Sort by lowest risk score first (highest safety score, since 0 risk = 100 safety)
  const sortedByScore = [...drivers].sort((a, b) => (a.riskScore || 0) - (b.riskScore || 0));
  const top5 = sortedByScore.slice(0, 5);
  const bottom5 = sortedByScore.slice(-5).reverse();

  const avgScore = stats?.avgRisk || 0;
  const violationsToday = stats?.violationsToday || 0;
  const activeDriversCount = stats?.activeDrivers || 0;

  const weeklyViolations = stats?.weeklyViolations || [];
  const violationTypesToday = stats?.violationTypesToday || [];

  const weeklyIsEmpty = isWeeklyEmpty(weeklyViolations);
  const typesIsEmpty = isTypesEmpty(violationTypesToday);
  const weeklyData = weeklyIsEmpty ? SAMPLE_WEEKLY : weeklyViolations;
  const typesData = typesIsEmpty ? SAMPLE_TYPES : violationTypesToday;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Fleet Summary</h1>
        <p className="text-muted-foreground text-sm">Overall fleet performance overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Fleet Safety Score', value: `${100 - avgScore}%`, icon: TrendingUp, color: 'text-primary' },
          { label: 'Violations Today', value: violationsToday, icon: AlertTriangle, color: 'text-warning' },
          { label: 'Active Drivers', value: activeDriversCount, icon: Trophy, color: 'text-success' },
        ].map(s => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 flex items-center gap-4">
            <s.icon className={`w-10 h-10 ${s.color}`} />
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Performers */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-success" />Top Performers</h3>
          <div className="space-y-3">
            {top5.map((d, i) => (
              <div key={d.id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">{getDriverInitials(d)}</div>
                <span className="text-sm font-medium text-foreground flex-1">{d.name || `${d.firstName} ${d.lastName}`}</span>
                {(() => {
                  const safetyScore = 100 - (d.riskScore || 0);
                  return (
                    <>
                      <span className="text-sm text-muted-foreground">{safetyScore}%</span>
                      <PerformanceBadge level={getPerformanceLevel(safetyScore, thresholds)} />
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Worst Performers */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><TrendingDown className="w-4 h-4 text-danger" />Needs Improvement</h3>
          <div className="space-y-3">
            {bottom5.map((d, i) => (
              <div key={d.id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-danger/20 flex items-center justify-center text-danger text-xs font-bold">{getDriverInitials(d)}</div>
                <span className="text-sm font-medium text-foreground flex-1">{d.name || `${d.firstName} ${d.lastName}`}</span>
                {(() => {
                  const safetyScore = 100 - (d.riskScore || 0);
                  return (
                    <>
                      <span className="text-sm text-muted-foreground">{safetyScore}%</span>
                      <PerformanceBadge level={getPerformanceLevel(safetyScore, thresholds)} />
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Past 7 Days Violation Trend</h3>
            {weeklyIsEmpty && <SampleBadge />}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,22%)" />
              <XAxis dataKey="day" tick={{ fill: 'hsl(215,20%,55%)', fontSize: 12 }} />
              <YAxis domain={[0, 'auto']} tick={{ fill: 'hsl(215,20%,55%)', fontSize: 12 }} />
              <RTooltip contentStyle={{ background: 'hsl(222,41%,14%)', border: '1px solid hsl(222,30%,22%)', borderRadius: 8, color: 'hsl(213,31%,91%)' }} />
              <Line type="monotone" dataKey="count" stroke="hsl(187,72%,50%)" strokeWidth={2} dot={{ fill: 'hsl(187,72%,50%)' }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Violations by Type */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Violation Types (Today)</h3>
            {typesIsEmpty && <SampleBadge />}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={typesData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,22%)" />
              <XAxis type="number" tick={{ fill: 'hsl(215,20%,55%)', fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(215,20%,55%)', fontSize: 11 }} width={80} />
              <RTooltip contentStyle={{ background: 'hsl(222,41%,14%)', border: '1px solid hsl(222,30%,22%)', borderRadius: 8, color: 'hsl(213,31%,91%)' }} />
              <Bar dataKey="value" fill="hsl(38,92%,50%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
};

export default Summary;
