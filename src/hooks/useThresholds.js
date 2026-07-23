import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const DEFAULT_THRESHOLDS = { excellent: 90, good: 70, average: 50 };

export function useThresholds() {
  return useQuery({
    queryKey: ['thresholds'],
    queryFn: async () => {
      const { data } = await api.get('/settings/thresholds');
      return data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: DEFAULT_THRESHOLDS,
  });
}

export { DEFAULT_THRESHOLDS };
