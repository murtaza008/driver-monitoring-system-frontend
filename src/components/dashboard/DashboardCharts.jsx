import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import SampleBadge from '@/components/dashboard/SampleBadge';
import { SAMPLE_WEEKLY, SAMPLE_TYPES, SAMPLE_TREND, isWeeklyEmpty, isTypesEmpty, isTrendEmpty } from '@/utils/sampleChartData';

const COLORS = ['hsl(187,72%,50%)', 'hsl(142,71%,45%)', 'hsl(38,92%,50%)', 'hsl(0,84%,60%)', 'hsl(262,60%,55%)', 'hsl(200,70%,50%)'];

// Recharts' default label x/y sits just outside the pie (meant for a label line back
// to the slice), not inside it — with labelLine disabled that left the % text
// straddling the slice's outer edge and spilling onto the card background: invisible
// on a light card (white-on-white), only barely visible on a dark one, and prone to
// overlapping once 3+ thin slices crowd that same outer ring. Computing a position at
// 60% between the inner and outer radius keeps every label solidly inside its own
// colored slice regardless of theme or slice count.
const RADIAN = Math.PI / 180;
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const DashboardCharts = ({ stats }) => {
  // Defensive fallbacks: a stale/partially-shaped API response (e.g. a
  // backend process that hasn't restarted since a stats.js change) should
  // never crash the whole dashboard.
  const weeklyViolations = stats.weeklyViolations || [];
  const violationTypesToday = stats.violationTypesToday || [];
  const safetyScoreTrend = stats.safetyScoreTrend || [];

  const weeklyIsEmpty = isWeeklyEmpty(weeklyViolations);
  const typesIsEmpty = isTypesEmpty(violationTypesToday);
  const trendIsEmpty = isTrendEmpty(safetyScoreTrend);

  const weeklyData = weeklyIsEmpty ? SAMPLE_WEEKLY : weeklyViolations;
  const typesData = typesIsEmpty ? SAMPLE_TYPES : violationTypesToday;
  const trendData = trendIsEmpty ? SAMPLE_TREND : safetyScoreTrend;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Weekly Violations</h3>
          {weeklyIsEmpty && <SampleBadge />}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,22%)" />
            <XAxis dataKey="day" tick={{ fill: 'hsl(215,20%,55%)', fontSize: 12 }} />
            <YAxis tick={{ fill: 'hsl(215,20%,55%)', fontSize: 12 }} />
            <RTooltip contentStyle={{ background: 'hsl(222,41%,14%)', border: '1px solid hsl(222,30%,22%)', borderRadius: 8, color: 'hsl(213,31%,91%)' }} />
            <Bar dataKey="count" fill="hsl(187,72%,50%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Violation Types (Today)</h3>
          {typesIsEmpty && <SampleBadge />}
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={typesData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="value" paddingAngle={3} label={renderPieLabel} labelLine={false}>
              {typesData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <RTooltip
              contentStyle={{ background: 'hsl(222,47%,11%)', border: '1px solid hsl(222,30%,22%)', borderRadius: 8 }}
              itemStyle={{ color: 'hsl(0,0%,100%)' }}
            />
            <Legend wrapperStyle={{ fontSize: 10, color: 'hsl(215,20%,55%)', lineHeight: '16px' }} iconSize={8} />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Safety Score Trend</h3>
          {trendIsEmpty && <SampleBadge />}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,22%)" />
            <XAxis dataKey="date" tick={{ fill: 'hsl(215,20%,55%)', fontSize: 11 }} tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} minTickGap={20} />
            <YAxis tick={{ fill: 'hsl(215,20%,55%)', fontSize: 12 }} domain={[0, 100]} />
            <RTooltip labelFormatter={(d) => new Date(d).toLocaleDateString()} contentStyle={{ background: 'hsl(222,41%,14%)', border: '1px solid hsl(222,30%,22%)', borderRadius: 8, color: 'hsl(213,31%,91%)' }} />
            <Line type="monotone" dataKey="score" stroke="hsl(187,72%,50%)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
};

export default DashboardCharts;
