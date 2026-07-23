import ViolationsListPage from '@/components/violations/ViolationsListPage';

const AllViolations = () => (
  <ViolationsListPage
    title="All Violations"
    subtitle="Full history of accepted violations across your fleet"
    endpoint="/violations"
    queryKey={['violations', 'all']}
    emptyText="No violations recorded"
  />
);

export default AllViolations;
