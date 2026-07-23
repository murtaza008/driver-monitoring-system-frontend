import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { CalendarIcon, Download, AlertTriangle, CheckCircle, Eye, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { severityColor } from '@/utils/driverDisplay';
import { formatViolationDisplay } from '@/utils/violationTypes';
import { useDeleteViolation } from '@/hooks/useDeleteViolation';
import SnapshotModal from '@/components/drivers/SnapshotModal';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import DriverAvatar from '@/components/ui/DriverAvatar';

const DailyReport = () => {
  const [date, setDate] = useState(new Date());
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { toast } = useToast();

  const { data: violations = [], isLoading } = useQuery({
    queryKey: ['violations', 'all'],
    queryFn: async () => {
      const { data } = await api.get('/violations');
      return data;
    },
    refetchInterval: 5000,
  });

  const deleteMutation = useDeleteViolation({ onDeleted: () => setDeleteTarget(null) });

  const dateStr = format(date, 'yyyy-MM-dd');
  const dayViolations = useMemo(() => violations.filter(v => format(new Date(v.timestamp), 'yyyy-MM-dd') === dateStr), [dateStr, violations]);

  const stats = {
    total: dayViolations.length,
    critical: dayViolations.filter(v => v.severity === 'Critical').length,
    drivers: new Set(dayViolations.map(v => v.driverId)).size,
  };

  if (isLoading) return <LoadingSpinner label="Loading daily report..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Daily Report</h1>
          <p className="text-muted-foreground text-sm">Detailed violation report for selected date</p>
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("justify-start text-left font-normal", !date && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={date} onSelect={d => d && setDate(d)} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={() => toast({ title: 'Export started', description: 'Report will be downloaded shortly.' })}>
            <Download className="w-4 h-4 mr-2" />Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Violations', value: stats.total, icon: AlertTriangle, color: 'text-warning' },
          { label: 'Critical Alerts', value: stats.critical, icon: AlertTriangle, color: 'text-danger' },
          { label: 'Drivers Involved', value: stats.drivers, icon: CheckCircle, color: 'text-primary' },
        ].map(s => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 flex items-center gap-3">
            <s.icon className={`w-8 h-8 ${s.color}`} />
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Violations on {format(date, 'MMMM d, yyyy')}</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Time</TableHead>
                <TableHead className="text-muted-foreground">Driver</TableHead>
                <TableHead className="text-muted-foreground">Violation</TableHead>
                <TableHead className="text-muted-foreground">Severity</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dayViolations.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">No violations recorded for this date</TableCell></TableRow>
              ) : dayViolations.map(v => (
                <TableRow key={v.id} className="border-border/30 hover:bg-muted/30 transition-colors">
                  <TableCell className="text-muted-foreground font-mono text-sm">{new Date(v.timestamp).toLocaleTimeString()}</TableCell>
                  <TableCell className="text-foreground font-medium">
                    <div className="flex items-center gap-2">
                      <DriverAvatar photoUrl={v.driverPhotoUrl} name={v.driverName} />
                      {v.driverName}
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground">{formatViolationDisplay(v.type)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${severityColor(v.severity)} border-0 text-xs`}>{v.severity}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" onClick={() => setSelectedViolation(v)} className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-muted/50" aria-label="View violation snapshot">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => setDeleteTarget(v)} className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-md hover:bg-destructive/10" aria-label="Delete violation">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      <SnapshotModal violation={selectedViolation} open={!!selectedViolation} onClose={() => setSelectedViolation(null)} />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Delete Violation</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">Are you sure you want to delete this violation?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteTarget.id)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DailyReport;
