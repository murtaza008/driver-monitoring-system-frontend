import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import FieldError from '@/components/ui/FieldError';
import FieldHint from '@/components/ui/FieldHint';
import { validateCompanyProfile, parseFleetSize } from '@/utils/validation';
import { parseApiError } from '@/utils/apiErrors';
import api from '@/lib/api';

const FIELDS = [
  { label: 'Company Name', key: 'companyName', hint: 'Required.' },
  { label: 'Admin Name', key: 'adminName', hint: 'Required.' },
  { label: 'Email', key: 'email', readOnly: true },
  { label: 'Phone', key: 'phone', placeholder: '03001234567', hint: 'Pakistan mobile number, 11 digits starting with 03. Must be unique.' },
  { label: 'Industry', key: 'industry' },
  { label: 'Fleet Size', key: 'fleetSize', type: 'number' },
  { label: 'NTN Number', key: 'ntnNumber', hint: 'Required.' },
  { label: 'Address', key: 'address', hint: 'Required.' },
];

const AccountManagement = () => {
  const { companyInfo, updateCompanyInfo, deleteAccount } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState(companyInfo || {
    companyName: '', adminName: '', email: '', phone: '', industry: '', fleetSize: '', address: '', ntnNumber: '',
  });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: fleetStatus } = useQuery({
    queryKey: ['fleet-status'],
    queryFn: async () => {
      const { data } = await api.get('/drivers/fleet-status');
      return data;
    },
  });

  useEffect(() => {
    if (companyInfo && !editing) {
      setForm(companyInfo);
      setFieldErrors({});
    }
  }, [companyInfo, editing]);

  const update = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setFieldErrors(e => ({ ...e, [k]: undefined }));
  };

  const handleFleetSizeBlur = () => {
    update('fleetSize', String(parseFleetSize(form.fleetSize) || 1));
  };

  const handleSave = async () => {
    const check = validateCompanyProfile(form, { minFleetSize: fleetStatus?.totalCount });
    if (!check.valid) {
      setFieldErrors(check.errors);
      toast({ title: 'Please fix the form', description: check.message, variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      await updateCompanyInfo(form);
      setEditing(false);
      setFieldErrors({});
      toast({ title: 'Profile updated!', description: 'Company info saved successfully.' });
    } catch (err) {
      const { message, detail, fieldErrors: apiFields } = parseApiError(err);
      setFieldErrors(prev => ({ ...prev, ...apiFields }));
      toast({ title: message, description: detail, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setFieldErrors({});
    if (companyInfo) setForm(companyInfo);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      toast({ title: 'Account deleted', description: 'Your account and all driver data have been removed.' });
      navigate('/login');
    } catch (err) {
      const { message, detail } = parseApiError(err);
      toast({ title: message || 'Error', description: detail || 'Failed to delete account', variant: 'destructive' });
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/settings"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Account Management</h1>
          <p className="text-muted-foreground text-sm">View & edit company profile</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Company Information</h3>
          {!editing && <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>}
        </div>
        <div className="space-y-4">
          {FIELDS.map(({ label, key, readOnly, placeholder, hint, type }) => {
            const isFleetSize = key === 'fleetSize';
            const fleetHint = fleetStatus
              ? `Minimum 1. You currently have ${fleetStatus.totalCount} of ${fleetStatus.fleetSize} driver slots used — fleet size can't go below that.`
              : "Minimum 1. This is the maximum number of drivers your company can add.";
            return (
              <div key={key} className="space-y-1">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                {editing ? (
                  <>
                    <Input
                      type={type || 'text'}
                      min={isFleetSize ? 1 : undefined}
                      step={isFleetSize ? 1 : undefined}
                      value={form[key] || ''}
                      onChange={e => !readOnly && update(key, e.target.value)}
                      onBlur={isFleetSize ? handleFleetSizeBlur : undefined}
                      disabled={readOnly}
                      placeholder={placeholder}
                      className={`bg-muted/50 ${readOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
                    />
                    <FieldError message={fieldErrors[key]} />
                    {!readOnly && <FieldHint>{isFleetSize ? fleetHint : hint}</FieldHint>}
                  </>
                ) : (
                  <p className="text-sm text-foreground">{form[key] || '—'}</p>
                )}
              </div>
            );
          })}
          {editing && (
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : 'Save'}
              </Button>
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 border-destructive/30">
        <h3 className="text-sm font-semibold text-destructive mb-1">Danger Zone</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Permanently delete your account, every driver you've added, and all of their violation history. This cannot be undone.
        </p>
        <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="w-4 h-4 mr-2" /> Delete Account
        </Button>
      </motion.div>

      <Dialog open={deleteOpen} onOpenChange={(open) => !deleting && setDeleteOpen(open)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Delete Account</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">
            Are you sure? This will permanently delete your account and all of its drivers' data — profiles, violations, and safety history. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" disabled={deleting} onClick={handleDeleteAccount}>
              {deleting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Deleting...</> : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountManagement;
