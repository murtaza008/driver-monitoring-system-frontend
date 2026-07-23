import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Camera, Clock, User, AlertTriangle, CheckCircle, XCircle, Car, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { formatViolationDisplay } from '@/utils/violationTypes';
import { useDeleteViolation } from '@/hooks/useDeleteViolation';

// Read-only viewer for already-confirmed violations (Recent Violations, Driver
// Profile history). Confirm/reject only happens from the Pending Review queue
// on the Dashboard, where the admin hasn't made a call on the violation yet.
const SnapshotModal = ({ violation, open, onClose, onDeleted }) => {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleteMutation = useDeleteViolation({
    onDeleted: (id) => {
      setConfirmDelete(false);
      onDeleted?.(id);
      onClose();
    },
  });

  if (!violation) return null;

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 text-foreground pr-6">
            <span className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Violation Snapshot
            </span>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-md hover:bg-destructive/10"
              aria-label="Delete violation"
            >
              <X className="w-4 h-4" />
            </button>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Snapshot Display */}
          <div className="aspect-video bg-muted rounded-lg overflow-hidden border border-border flex items-center justify-center">
            {violation.imageUrl ? (
              <img
                src={violation.imageUrl}
                alt={`${violation.type} snapshot`}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center text-muted-foreground">
                <Camera className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No Snapshot Available</p>
                <p className="text-xs mt-1">{formatViolationDisplay(violation.type)} Detected</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div
              className="glass-card p-3 flex items-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => {
                onClose();
                navigate(`/drivers/${violation.driverId}`);
              }}
            >
              <User className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Driver</p>
                <p className="text-sm font-medium text-primary hover:underline">{violation.driverName}</p>
              </div>
            </div>
            <div className="glass-card p-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="text-sm font-medium text-foreground">{formatViolationDisplay(violation.type)}</p>
              </div>
            </div>
            <div className="glass-card p-3 flex items-center gap-2">
              <Car className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Vehicle</p>
                <p className="text-sm font-medium text-foreground">{violation.vehiclePlate || '—'}</p>
              </div>
            </div>
            <div className="glass-card p-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="text-sm font-medium text-foreground">{new Date(violation.timestamp).toLocaleString()}</p>
              </div>
            </div>
            <div className="glass-card p-3 flex items-center justify-between gap-2 col-span-2">
              <div className="flex items-center gap-2">
                {violation.severity === 'Low' ? <CheckCircle className="w-5 h-5 text-success" /> : <XCircle className={`w-5 h-5 ${violation.severity === 'Critical' || violation.severity === 'High' ? 'text-destructive' : 'text-warning'}`} />}
                <div>
                  <p className="text-xs text-muted-foreground">Severity</p>
                  <span className={`text-sm font-medium ${
                    violation.severity === 'Critical' || violation.severity === 'High' ? 'text-destructive' :
                    violation.severity === 'Medium' ? 'text-warning' : 'text-success'
                  }`}>
                    {violation.severity}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => {
                  onClose();
                  navigate(`/send-message?driver=${violation.driverId}`);
                }}
              >
                <MessageSquare className="w-4 h-4" /> Send Message
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
      <DialogContent className="bg-card border-border">
        <DialogHeader><DialogTitle className="text-foreground">Delete Violation</DialogTitle></DialogHeader>
        <p className="text-muted-foreground">Are you sure you want to delete this violation?</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(violation.id)}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default SnapshotModal;
