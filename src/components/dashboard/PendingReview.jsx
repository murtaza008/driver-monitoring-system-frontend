import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, ThumbsUp, X, Clock, Camera } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { severityColor } from '@/utils/driverDisplay';
import { formatViolationDisplay } from '@/utils/violationTypes';
import DriverAvatar from '@/components/ui/DriverAvatar';
import { useToast } from '@/hooks/use-toast';

// Confirm/reject only happens here, on violations the admin hasn't decided on
// yet — this dialog is intentionally separate from the read-only
// SnapshotModal used for already-confirmed violations elsewhere in the app.
const PendingReview = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [viewing, setViewing] = useState(null);

  const { data: pending = [] } = useQuery({
    queryKey: ['pendingViolations'],
    queryFn: async () => {
      const { data } = await api.get('/violations/pending');
      return data;
    },
    refetchInterval: 5000,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['pendingViolations'] });
    queryClient.invalidateQueries({ queryKey: ['violations'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
    queryClient.invalidateQueries({ queryKey: ['drivers'] });
  };

  const confirmMutation = useMutation({
    mutationFn: (id) => api.put(`/violations/${id}/confirm`),
    onSuccess: () => {
      toast({ title: 'Violation confirmed', description: 'Penalty applied and driver notified.' });
      setViewing(null);
      invalidateAll();
    },
    onError: (err) => {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to confirm violation', variant: 'destructive' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => api.put(`/violations/${id}/reject`),
    onSuccess: () => {
      toast({ title: 'Violation rejected', description: 'Removed as a false positive.' });
      setViewing(null);
      invalidateAll();
    },
    onError: (err) => {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to reject violation', variant: 'destructive' });
    },
  });

  const busy = confirmMutation.isPending || rejectMutation.isPending;

  if (pending.length === 0) return null;

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-warning" />
          <h3 className="text-sm font-semibold text-foreground">Pending Review</h3>
          <Badge variant="outline" className="text-xs">{pending.length}</Badge>
        </div>
        <div className="space-y-2">
          {pending.map(v => (
            <div
              key={v.id}
              onClick={() => setViewing(v)}
              className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 flex-wrap cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <div className="min-w-0 flex items-center gap-2.5">
                <DriverAvatar photoUrl={v.driverPhotoUrl} name={v.driverName} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {v.driverName} <span className="text-muted-foreground font-normal">— {formatViolationDisplay(v.type)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                    <span>{v.vehiclePlate || '—'} · {new Date(v.timestamp).toLocaleString()}</span>
                    <Badge variant="outline" className={`${severityColor(v.severity)} border-0 text-xs`}>{v.severity}</Badge>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0">
                <Eye className="w-3.5 h-3.5" /> View & decide
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Camera className="w-5 h-5 text-primary" />
              Pending Violation
            </DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden border border-border flex items-center justify-center">
                {viewing.imageUrl ? (
                  <img src={viewing.imageUrl} alt={`${viewing.type} snapshot`} className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Camera className="w-12 h-12 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No Snapshot Available</p>
                    <p className="text-xs mt-1">{formatViolationDisplay(viewing.type)} Detected</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="glass-card p-3">
                  <p className="text-xs text-muted-foreground">Driver</p>
                  <p className="font-medium text-foreground">{viewing.driverName}</p>
                </div>
                <div className="glass-card p-3">
                  <p className="text-xs text-muted-foreground">Violation</p>
                  <p className="font-medium text-foreground">{formatViolationDisplay(viewing.type)}</p>
                </div>
                <div className="glass-card p-3">
                  <p className="text-xs text-muted-foreground">Vehicle</p>
                  <p className="font-medium text-foreground">{viewing.vehiclePlate || '—'}</p>
                </div>
                <div className="glass-card p-3">
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="font-medium text-foreground">{new Date(viewing.timestamp).toLocaleString()}</p>
                </div>
                <div className="glass-card p-3">
                  <p className="text-xs text-muted-foreground">Severity</p>
                  <Badge variant="outline" className={`${severityColor(viewing.severity)} border-0 mt-0.5`}>{viewing.severity}</Badge>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-border">
                <Button
                  variant="outline"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  disabled={busy}
                  onClick={() => rejectMutation.mutate(viewing.id)}
                >
                  <X className="w-4 h-4 mr-1.5" /> Reject
                </Button>
                <Button
                  className="bg-success text-success-foreground hover:bg-success/90"
                  disabled={busy}
                  onClick={() => confirmMutation.mutate(viewing.id)}
                >
                  <ThumbsUp className="w-4 h-4 mr-1.5" /> Looks Good
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PendingReview;
