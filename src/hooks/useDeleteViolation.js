import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Shared by every "cross to delete" spot for already-confirmed violations:
// Recent/Today/All Violations tables, the Snapshot modal, and the driver's
// Violation History. Deleting reverts whatever penalty the violation applied
// (handled server-side) and removes it everywhere it's shown.
export function useDeleteViolation({ onDeleted } = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.delete(`/violations/${id}`),
    onSuccess: (_res, id) => {
      queryClient.invalidateQueries({ queryKey: ['violations'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast({ title: 'Violation deleted' });
      onDeleted?.(id);
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to delete violation',
        variant: 'destructive',
      });
    },
  });
}
