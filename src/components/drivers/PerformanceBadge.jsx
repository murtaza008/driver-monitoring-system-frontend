import { performanceColor } from '@/utils/driverDisplay';
import { Badge } from '@/components/ui/badge';

const PerformanceBadge = ({ level }) => (
  <Badge variant="outline" className={`${performanceColor(level)} border-0 font-medium`}>
    {level}
  </Badge>
);

export default PerformanceBadge;
