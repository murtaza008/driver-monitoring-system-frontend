import { useEffect, useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit, Trash2, Phone, Car, IdCard, FileText, Camera, MessageSquare, Mail, CheckCircle, XCircle, ShieldAlert, Map, Eye, X } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from 'recharts';
import PerformanceBadge from '@/components/drivers/PerformanceBadge';
import SnapshotModal from '@/components/drivers/SnapshotModal';
import { getPerformanceLevel, getDriverInitials, statusColor, severityColor } from '@/utils/driverDisplay';
import { formatViolationDisplay } from '@/utils/violationTypes';
import { useToast } from '@/hooks/use-toast';
import { useThresholds } from '@/hooks/useThresholds';
import { useDeleteViolation } from '@/hooks/useDeleteViolation';
import { buildDriverSafetyTrend } from '@/utils/safetyScore';
import api from '@/lib/api';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import DriverMarker from '@/components/drivers/DriverMarker';

const DriverProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [deleteViolationTarget, setDeleteViolationTarget] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [showDoc, setShowDoc] = useState(null);
  const [location, setLocation] = useState(null);
  const { data: thresholds } = useThresholds();

  // Polled (not fetch-once), and invalidated by useDeleteViolation, so the
  // profile reflects new/removed violations and score changes live — no
  // manual page reload needed.
  const { data: driver, isLoading: driverLoading, isError: driverError } = useQuery({
    queryKey: ['drivers', 'detail', id],
    queryFn: async () => {
      const { data } = await api.get('/drivers');
      return data.find(item => item.id === id) || null;
    },
    enabled: !!id,
    refetchInterval: 5000,
  });

  const { data: violations = [], isLoading: violationsLoading } = useQuery({
    queryKey: ['violations', 'driver', id],
    queryFn: async () => {
      const { data } = await api.get(`/violations/driver/${id}`);
      return data;
    },
    enabled: !!id,
    refetchInterval: 5000,
  });

  const loading = driverLoading || violationsLoading;

  const deleteViolationMutation = useDeleteViolation({
    onDeleted: () => setDeleteViolationTarget(null),
  });

  const trend = useMemo(
    () => buildDriverSafetyTrend(violations, driver?.riskScore ?? 0),
    [violations, driver?.riskScore]
  );

  useEffect(() => {
    if (!id) return;
    const unsubscribe = onSnapshot(doc(db, 'driver_locations', id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.latitude !== 0.0 || data.longitude !== 0.0) {
          setLocation(data);
        }
      }
    });
    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (driverError) {
      toast({ title: 'Error', description: 'Failed to load profile', variant: 'destructive' });
    }
  }, [driverError]);

  const handleDelete = async () => {
    try {
      await api.delete(`/drivers/${id}`);
      toast({ title: 'Driver deleted' });
      navigate('/drivers');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete driver', variant: 'destructive' });
    }
  };

  if (loading) return <LoadingSpinner label="Loading driver profile..." />;
  if (!driver) return <div className="text-center py-20 text-muted-foreground">Driver not found</div>;

  const documents = [
    { name: 'CNIC Front', url: driver.cnicFrontUrl },
    { name: 'CNIC Back', url: driver.cnicBackUrl },
    { name: 'License Front', url: driver.licenseFrontUrl },
    { name: 'License Back', url: driver.licenseBackUrl }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{driver.name}</h1>
          <p className="text-muted-foreground text-sm">{id}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/send-message?driver=${id}`}><Button variant="outline" size="sm"><MessageSquare className="w-4 h-4 mr-2" />Message</Button></Link>
          <Link to={`/drivers/${id}/edit`}><Button variant="outline" size="sm"><Edit className="w-4 h-4 mr-2" />Edit</Button></Link>
          <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)}><Trash2 className="w-4 h-4 mr-2" />Delete</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Info Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center mb-6">
            {driver.photoUrl ? (
              <img src={driver.photoUrl} alt={driver.name} className="w-20 h-20 rounded-full object-cover border-2 border-primary/20 mb-3" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold mb-3">
                {driver.name[0]}
              </div>
            )}
            <h3 className="text-lg font-semibold text-foreground">{driver.name}</h3>
            <Badge variant="outline" className={`${statusColor(driver.status)} border-0 mt-1`}>{driver.status}</Badge>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-muted-foreground"><Mail className="w-4 h-4" />{driver.email}</div>
            <div className="flex items-center gap-3 text-muted-foreground"><Phone className="w-4 h-4" />{driver.phone}</div>
            <div className="flex items-center gap-3 text-muted-foreground"><Car className="w-4 h-4" />{driver.vehiclePlate}</div>
            <div className="flex items-center gap-3 text-muted-foreground"><IdCard className="w-4 h-4" />{driver.cnicNumber}</div>
            <div className="flex items-center gap-3 text-muted-foreground"><FileText className="w-4 h-4" />{driver.licenseNumber}</div>
          </div>
          <div className="mt-6 pt-4 border-t border-border">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-sm text-muted-foreground">Safety Score</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <ShieldAlert className="w-5 h-5 text-primary" />
                    {(() => {
                      const safetyScore = 100 - (driver.riskScore ?? 0);
                      return <span className="text-2xl font-bold text-foreground">{safetyScore}%</span>;
                    })()}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block mb-1">Performance</span>
                  <PerformanceBadge level={getPerformanceLevel(100 - (driver.riskScore ?? 0), thresholds)} />
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                {(() => {
                  const safetyScore = 100 - (driver.riskScore ?? 0);
                  return <div className={`h-full rounded-full ${safetyScore >= 70 ? 'bg-success' : safetyScore >= 50 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${safetyScore}%` }} />;
                })()}
              </div>
            </div>
          </div>
          {/* Document Previews */}
          <div className="mt-6 pt-4 border-t border-border space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Documents</p>
            <div className="grid grid-cols-2 gap-2">
              {documents.map(doc => (
                <button key={doc.name} onClick={() => doc.url && setShowDoc(doc)} className={`border border-border rounded-lg p-3 text-center transition-colors ${doc.url ? 'hover:border-primary/50' : 'opacity-40 cursor-not-allowed'}`}>
                  <IdCard className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">{doc.name}</p>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Trend Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Safety Score Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <RTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }} />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Live Location Map */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Live Location</h3>
            <div className="w-full h-64 rounded-xl overflow-hidden border border-border relative">
              {location ? (
                <MapContainer center={[location.latitude, location.longitude]} zoom={15} className="w-full h-full z-0">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <DriverMarker 
                    driverId={id} 
                    profile={driver} 
                    initialLocation={location} 
                  />
                </MapContainer>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/20">
                  <Map className="w-8 h-8 text-muted-foreground mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">No live location available</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Violation History */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Violation History ({violations.length})</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Type</TableHead>
                    <TableHead className="text-muted-foreground">Time</TableHead>
                    <TableHead className="text-muted-foreground">Severity</TableHead>
                    <TableHead className="text-muted-foreground w-20 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {violations.map(v => (
                    <TableRow key={v.id} className="border-border/30 hover:bg-muted/30 transition-colors">
                      <TableCell className="text-foreground">{formatViolationDisplay(v.type)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{new Date(v.timestamp).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${severityColor(v.severity)} border-0 text-xs`}>{v.severity}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedViolation(v)}
                            className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-muted/50"
                            aria-label="View violation"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteViolationTarget(v)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-md hover:bg-destructive/10"
                            aria-label="Delete violation"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {violations.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No violations recorded</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        </div>
      </div>

      <SnapshotModal
        violation={selectedViolation}
        open={!!selectedViolation}
        onClose={() => setSelectedViolation(null)}
      />

      {/* Delete Violation Dialog */}
      <Dialog open={!!deleteViolationTarget} onOpenChange={(open) => !open && setDeleteViolationTarget(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Delete Violation</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">Are you sure you want to delete this violation?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteViolationTarget(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteViolationMutation.isPending} onClick={() => deleteViolationMutation.mutate(deleteViolationTarget.id)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Doc Preview */}
      <Dialog open={!!showDoc} onOpenChange={() => setShowDoc(null)}>
        <DialogContent className="bg-card border-border max-w-3xl">
          <DialogHeader><DialogTitle className="text-foreground">{showDoc?.name}</DialogTitle></DialogHeader>
          <div className="aspect-[3/2] bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            {showDoc?.url ? (
              <img src={showDoc.url} alt={showDoc.name} className="w-full h-full object-contain" />
            ) : (
              <div className="text-center text-muted-foreground">
                <IdCard className="w-16 h-16 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No Document Uploaded</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Delete Driver</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DriverProfile;
