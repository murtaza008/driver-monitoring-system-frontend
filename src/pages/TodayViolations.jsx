import ViolationsListPage from '@/components/violations/ViolationsListPage';

const TodayViolations = () => (
  <ViolationsListPage
    title="Today's Violations"
    subtitle="Accepted violations logged today — resets at midnight"
    endpoint="/violations?today=1"
    queryKey={['violations', 'today']}
    emptyText="No violations today"
  />
);

export default TodayViolations;
