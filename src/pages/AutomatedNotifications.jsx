import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Bell, Eye, Brain, Phone, Cigarette, ShieldOff, Loader2 } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Link } from 'react-router-dom';
import { defaultNotificationTemplates, severityColor } from '@/utils/driverDisplay';
import api from '@/lib/api';
import FieldError from '@/components/ui/FieldError';

const icons = {
  'Drowsiness': Eye, 'Yawning': Brain, 'Distraction': Brain,
  'Mobile Usage': Phone, 'Seatbelt': ShieldOff, 'Smoking': Cigarette,
};

const severities = ['Low', 'Medium', 'High', 'Critical'];
const violationTypes = ['Drowsiness', 'Yawning', 'Distraction', 'Mobile Usage', 'Seatbelt', 'Smoking'];

const defaultToggles = () => {
  const result = {};
  violationTypes.forEach(type => {
    result[type] = { Low: false, Medium: false, High: true, Critical: true };
  });
  return result;
};

const AutomatedNotifications = () => {
  const [templates, setTemplates] = useState(defaultNotificationTemplates);
  const [toggles, setToggles] = useState(defaultToggles);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templateErrors, setTemplateErrors] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await api.get('/settings/notifications');
        if (data.templates) setTemplates(data.templates);
        if (data.toggles) setToggles(data.toggles);
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to load notifications config', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleToggle = (type, severity, checked) => {
    setToggles(prev => ({
      ...prev,
      [type]: { ...prev[type], [severity]: checked },
    }));
    setTemplateErrors(prev => ({ ...prev, [type]: undefined }));
  };

  const handleSave = async () => {
    const errors = {};
    violationTypes.forEach(type => {
      const anyEnabled = toggles[type] ? Object.values(toggles[type]).some(Boolean) : false;
      if (anyEnabled && !String(templates[type] || '').trim()) {
        errors[type] = 'Add a message template, or turn off all severities for this violation.';
      }
    });
    setTemplateErrors(errors);
    if (Object.keys(errors).length) {
      toast({ title: 'Missing message templates', description: 'Fill in a template for every enabled violation type.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      await api.post('/settings/notifications', { templates, toggles });
      toast({ title: 'Notifications saved!', description: 'Message templates and severity settings updated.' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to save notification settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading notification settings..." />;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/settings"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Automated Notifications</h1>
          <p className="text-muted-foreground text-sm">Configure alert messages and severity toggles per violation</p>
        </div>
      </div>

      <div className="space-y-4">
        {violationTypes.map((type, i) => {
          const Icon = icons[type] || Bell;
          const anyEnabled = toggles[type] ? Object.values(toggles[type]).some(Boolean) : false;
          return (
            <motion.div key={type} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`glass-card p-5 transition-opacity ${!anyEnabled ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Icon className="w-4 h-4" /></div>
                <Label className="font-medium text-foreground flex-1 text-base">{type}</Label>
              </div>

              {/* Severity toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {severities.map(sev => (
                  <div key={sev} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50 border border-border">
                    <Badge variant="outline" className={`${severityColor(sev)} border-0 text-xs`}>{sev}</Badge>
                    <Switch
                      checked={toggles[type] ? toggles[type][sev] : false}
                      onCheckedChange={(checked) => handleToggle(type, sev, checked)}
                    />
                  </div>
                ))}
              </div>

              <Textarea
                value={templates[type] || ''}
                onChange={e => {
                  setTemplates(prev => ({ ...prev, [type]: e.target.value }));
                  setTemplateErrors(prev => ({ ...prev, [type]: undefined }));
                }}
                rows={2}
                className="bg-muted/50 text-sm"
                placeholder={`Message template for ${type}...`}
                disabled={!anyEnabled}
              />
              <FieldError message={templateErrors[type]} />
              <p className="text-xs text-muted-foreground mt-1">Use {'{name}'} for driver name and {'{time}'} for when the violation occurred</p>
            </motion.div>
          );
        })}
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Save All Templates
      </Button>
    </div>
  );
};

export default AutomatedNotifications;
