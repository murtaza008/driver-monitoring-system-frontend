import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Eye, X, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SnapshotModal from '@/components/drivers/SnapshotModal';
import DriverAvatar from '@/components/ui/DriverAvatar';
import { matchesViolationLabel, VIOLATION_FILTER_TYPES, formatViolationDisplay } from '@/utils/violationTypes';
import { severityColor } from '@/utils/driverDisplay';
import { useDeleteViolation } from '@/hooks/useDeleteViolation';
import api from '@/lib/api';

// Shared by the "Today's Violations" (dashboard KPI drill-down) and "All
// Violations" (sidebar) pages — same data shape, just a different endpoint
// and copy. Polls every 5s and re-fetches on delete, so nothing here ever
// needs a manual page reload.
const ViolationsListPage = ({ title, subtitle, endpoint, queryKey, emptyText }) => {
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [search, setSearch] = useState('');

  const { data: violations = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await api.get(endpoint);
      return data;
    },
    refetchInterval: 5000,
  });

  const deleteMutation = useDeleteViolation({ onDeleted: () => setDeleteTarget(null) });

  const filtered = useMemo(() => {
    return violations
      .filter(v => matchesViolationLabel(v.type, filterType))
      .filter(v => filterSeverity === 'all' || v.severity === filterSeverity)
      .filter(v => !search || v.driverName.toLowerCase().includes(search.toLowerCase()));
  }, [violations, filterType, filterSeverity, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <p className="text-sm text-muted-foreground">{filtered.length} violations</p>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="Search driver..." value={search} onChange={e => setSearch(e.target.value)} className="bg-muted/50 w-40 h-8 text-xs pl-8" />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32 h-8 text-xs bg-muted/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {VIOLATION_FILTER_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-28 h-8 text-xs bg-muted/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {['Low', 'Medium', 'High', 'Critical'].map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Driver</TableHead>
                <TableHead className="text-muted-foreground">Vehicle</TableHead>
                <TableHead className="text-muted-foreground">Violation</TableHead>
                <TableHead className="text-muted-foreground">Time</TableHead>
                <TableHead className="text-muted-foreground">Severity</TableHead>
                <TableHead className="text-muted-foreground w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(v => (
                <TableRow key={v.id} className="border-border/30 hover:bg-muted/20 transition-colors">
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <DriverAvatar photoUrl={v.driverPhotoUrl} name={v.driverName} />
                      {v.driverName}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">{v.vehiclePlate || '—'}</TableCell>
                  <TableCell className="text-foreground">{formatViolationDisplay(v.type)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(v.timestamp).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${severityColor(v.severity)} border-0 text-xs`}>{v.severity}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                          <button type="button" onClick={() => setSelectedViolation(v)} className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-muted/50" aria-label="View violation snapshot">
                            <Eye className="w-4 h-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>View snapshot</TooltipContent>
                      </Tooltip>
                      <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                          <button type="button" onClick={() => setDeleteTarget(v)} className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-md hover:bg-destructive/10" aria-label="Delete violation">
                            <X className="w-4 h-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{emptyText}</TableCell></TableRow>
              )}
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

export default ViolationsListPage;
