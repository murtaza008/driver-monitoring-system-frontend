import { Users, Activity, AlertTriangle, Gauge } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import KPICard from '@/components/dashboard/KPICard';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import PendingReview from '@/components/dashboard/PendingReview';
import RecentViolationsTable from '@/components/dashboard/RecentViolationsTable';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getSafetyScore } from '@/utils/safetyScore';

const Dashboard = () => {
  const { data: stats, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await api.get('/stats');
      return data;
    },
    refetchInterval: 5000,
  });

  const { data: violations = [], isLoading: violationsLoading, isError: violationsError } = useQuery({
    queryKey: ['violations', 'recent'],
    queryFn: async () => {
      const { data } = await api.get('/violations?limit=10');
      return data;
    },
    refetchInterval: 5000,
  });

  if (statsLoading || violationsLoading) {
    return <LoadingSpinner label="Loading dashboard..." />;
  }

  if (statsError || violationsError || !stats) {
    return <div className="flex items-center justify-center h-full text-destructive font-semibold">Session expired. Please log in again.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Real-time fleet monitoring overview</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Drivers" value={stats.totalDrivers} icon={Users} color="bg-primary/20 text-primary" tooltip="Total registered drivers in fleet" delay={0} to="/drivers" />
        <KPICard title="Active Now" value={stats.activeDrivers} icon={Activity} color="bg-success/20 text-success" tooltip="Drivers currently on active routes" delay={100} to="/drivers?status=Active" />
        <KPICard title="Violations Today" value={stats.violationsToday} icon={AlertTriangle} color="bg-warning/20 text-warning" tooltip="Accepted violations today — resets at midnight" delay={200} to="/violations/today" />
        <KPICard title="Avg Safety Score" value={getSafetyScore(stats.avgRisk)} suffix="%" icon={Gauge} color="bg-success/20 text-success" tooltip="Daily average across all drivers — resets to 100% at midnight" delay={300} />
      </div>

      <DashboardCharts stats={stats} />

      <PendingReview />

      <RecentViolationsTable violations={violations} />
    </div>
  );
};

export default Dashboard;
