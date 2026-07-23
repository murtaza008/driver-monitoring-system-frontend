import { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Edit, Trash2, Eye, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import PerformanceBadge from '@/components/drivers/PerformanceBadge';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { getDriverInitials, statusColor, getPerformanceLevel } from '@/utils/driverDisplay';
import { useThresholds } from '@/hooks/useThresholds';

const DriverList = () => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: thresholds } = useThresholds();

  const { data: drivers = [], isLoading, refetch } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data } = await api.get('/drivers');
      return data;
    },
    refetchInterval: 5000,
  });

  const filtered = useMemo(() => {
    return drivers
      .filter(d => statusFilter === 'all' || d.status === statusFilter)
      .filter(d => {
        const q = search.toLowerCase();
        const fullName = d.name || `${d.firstName || ''} ${d.lastName || ''}`;
        return !q || 
               fullName.toLowerCase().includes(q) || 
               (d.id && d.id.toLowerCase().includes(q)) || 
               (d.vehiclePlate && d.vehiclePlate.toLowerCase().includes(q));
      });
  }, [search, statusFilter, drivers]);

  const handleDelete = async () => {
    if (deleteTarget) {
      try {
        await api.delete(`/drivers/${deleteTarget.id}`);
        toast({ title: 'Driver deleted', description: `${deleteTarget.firstName} ${deleteTarget.lastName} removed.` });
        refetch();
      } catch (error) {
        toast({ title: 'Error', description: error.response?.data?.message || 'Failed to delete driver.', variant: 'destructive' });
      } finally {
        setDeleteTarget(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Driver List</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} drivers found</p>
        </div>
        <Link to="/drivers/add"><Button>Add Driver</Button></Link>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, ID, or plate..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-muted/50" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-muted/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Off Duty">Off Duty</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Driver</TableHead>
                <TableHead className="text-muted-foreground">Vehicle</TableHead>
                <TableHead className="text-muted-foreground">Phone</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Safety Score</TableHead>
                <TableHead className="text-muted-foreground">Performance</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d, i) => (
                <motion.tr key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="border-border/30 hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {d.photoUrl ? (
                        <img 
                          src={d.photoUrl} 
                          alt="avatar" 
                          className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-primary/20" 
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                          {getDriverInitials(d)}
                        </div>
                      )}
                      <span className="font-medium text-foreground">{d.name || `${d.firstName} ${d.lastName}`}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground">{d.vehiclePlate || '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{d.phone || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${statusColor(d.status)} border-0 text-xs`} title="Active when mobile app session is running">
                      {d.status || 'Off Duty'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const safetyScore = 100 - (d.riskScore ?? 0);
                      return (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${safetyScore >= 70 ? 'bg-success' : safetyScore >= 50 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${safetyScore}%` }} />
                          </div>
                          <span className="text-sm text-muted-foreground">{safetyScore}</span>
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell><PerformanceBadge level={getPerformanceLevel(100 - (d.riskScore ?? 0), thresholds)} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <Link to={`/drivers/${d.id}`}><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"><Eye className="w-4 h-4" /></Button></Link>
                      <Link to={`/send-message?driver=${d.id}`}><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"><MessageSquare className="w-4 h-4" /></Button></Link>
                      <Link to={`/drivers/${d.id}/edit`}><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"><Edit className="w-4 h-4" /></Button></Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(d)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Delete Driver</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">Are you sure you want to delete <strong className="text-foreground">{deleteTarget?.firstName} {deleteTarget?.lastName}</strong>?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DriverList;
