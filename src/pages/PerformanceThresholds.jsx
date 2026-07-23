import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

const PerformanceThresholds = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [thresholds, setThresholds] = useState({ excellent: 90, good: 70, average: 50 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchThresholds = async () => {
      try {
        const { data } = await api.get('/settings/thresholds');
        setThresholds(data);
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to load thresholds', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchThresholds();
  }, []);

  const handleSave = async () => {
    const { excellent, good, average } = thresholds;
    if (!(excellent > good && good > average)) {
      toast({
        title: 'Invalid thresholds',
        description: 'Excellent must be higher than Good, and Good must be higher than Average.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await api.post('/settings/thresholds', thresholds);
      queryClient.invalidateQueries({ queryKey: ['thresholds'] });
      toast({ title: 'Thresholds saved!' });
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to save thresholds', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading thresholds..." />;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/settings"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Performance Thresholds</h1>
          <p className="text-muted-foreground text-sm">Adjust performance badge scoring ranges</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <div className="space-y-6">
          {[
            { label: 'Excellent', key: 'excellent', color: 'text-success', desc: `Score ≥ ${thresholds.excellent}%`, min: thresholds.good + 5, max: 100 },
            { label: 'Good', key: 'good', color: 'text-primary', desc: `${thresholds.good}% ≤ Score < ${thresholds.excellent}%`, min: thresholds.average + 5, max: thresholds.excellent - 5 },
            { label: 'Average', key: 'average', color: 'text-warning', desc: `${thresholds.average}% ≤ Score < ${thresholds.good}%`, min: 0, max: thresholds.good - 5 },
          ].map(t => (
            <div key={t.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label className={`text-sm font-medium ${t.color}`}>{t.label}</Label>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </div>
                <span className="text-sm font-bold text-foreground">{thresholds[t.key]}%</span>
              </div>
              <Slider
                value={[thresholds[t.key]]}
                onValueChange={([v]) => setThresholds(prev => ({ ...prev, [t.key]: Math.min(t.max, Math.max(t.min, v)) }))}
                min={t.min}
                max={t.max}
                step={5}
                className="w-full"
              />
            </div>
          ))}
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive font-medium">Poor: Score &lt; {thresholds.average}%</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Thresholds
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default PerformanceThresholds;
