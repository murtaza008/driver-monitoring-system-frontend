import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Percent, Loader2 } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { VIOLATION_FILTER_TYPES } from '@/utils/violationTypes';
import { severityColor } from '@/utils/driverDisplay';

const severities = ['Low', 'Medium', 'High', 'Critical'];

const defaultPenalties = {
  'Drowsiness': { Low: 1, Medium: 2, High: 3, Critical: 4 },
  'Yawning': { Low: 1, Medium: 2, High: 3, Critical: 4 },
  'Distraction': { Low: 1, Medium: 2, High: 3, Critical: 4 },
  'Mobile Usage': { Low: 1, Medium: 2, High: 3, Critical: 4 },
  'Seatbelt': { Low: 1, Medium: 2, High: 3, Critical: 4 },
  'Smoking': { Low: 1, Medium: 2, High: 3, Critical: 4 },
};

const PenaltySettings = () => {
  const [penalties, setPenalties] = useState(defaultPenalties);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPenalties = async () => {
      try {
        const { data } = await api.get('/settings/penalties');
        setPenalties(data);
      } catch (err) {
        // Use defaults on error
      } finally {
        setLoading(false);
      }
    };
    fetchPenalties();
  }, []);

  const updatePenalty = (type, severity, value) => {
    setPenalties(prev => ({
      ...prev,
      [type]: { ...prev[type], [severity]: Math.min(100, Math.max(0, value)) },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/settings/penalties', penalties);
      toast({ title: 'Penalties saved!', description: 'Penalty deduction percentages updated successfully.' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to save penalties', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading penalty settings..." />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/settings"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Penalty Settings</h1>
          <p className="text-muted-foreground text-sm">Configure % deduction per violation type &amp; severity</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 pr-4 font-semibold text-foreground">Violation</th>
              {severities.map(s => (
                <th key={s} className="text-center py-3 px-2 font-semibold">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${severityColor(s)}`}>{s}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {VIOLATION_FILTER_TYPES.map(type => (
              <tr key={type} className="border-b border-border/50 last:border-0">
                <td className="py-3 pr-4 font-medium text-foreground">{type}</td>
                {severities.map(severity => (
                  <td key={severity} className="py-3 px-2">
                    <div className="relative w-20 mx-auto">
                      <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={penalties[type][severity]}
                        onChange={e => updatePenalty(type, severity, Number(e.target.value))}
                        className="bg-muted/50 pr-6 text-sm text-center h-8"
                      />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <Button className="w-full mt-6" onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</> : 'Save Penalties'}
        </Button>
      </motion.div>
    </div>
  );
};

export default PenaltySettings;
