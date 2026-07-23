import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import FieldError from '@/components/ui/FieldError';
import FieldHint from '@/components/ui/FieldHint';
import { validateCompanyRegistration } from '@/utils/validation';
import { parseApiError } from '@/utils/apiErrors';

const Register = () => {
  const [form, setForm] = useState({
    companyName: '', adminName: '', email: '', password: '', phone: '',
    industry: '', fleetSize: '', address: '', ntnNumber: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const update = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    setFieldErrors(e => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const check = validateCompanyRegistration(form);
    if (!check.valid) {
      setFieldErrors(check.errors);
      toast({ title: 'Please fix the form', description: check.message, variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      await register(form);
      toast({ title: 'Registration successful!', description: 'Welcome to DMS Admin Dashboard.' });
      navigate('/');
    } catch (error) {
      const { message, detail, fieldErrors: apiFields } = parseApiError(error);
      setFieldErrors(prev => ({ ...prev, ...apiFields }));
      toast({ title: message, description: detail, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">DMS Admin</span>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold text-foreground mb-1">Register Company</h2>
          <p className="text-muted-foreground mb-6">Set up your fleet monitoring account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input value={form.companyName} onChange={e => update('companyName', e.target.value)} required className="bg-muted/50" />
                <FieldError message={fieldErrors.companyName} />
                <FieldHint>Required.</FieldHint>
              </div>
              <div className="space-y-2">
                <Label>Admin Name</Label>
                <Input value={form.adminName} onChange={e => update('adminName', e.target.value)} required className="bg-muted/50" />
                <FieldError message={fieldErrors.adminName} />
                <FieldHint>Required.</FieldHint>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="admin@fleet.com" value={form.email} onChange={e => update('email', e.target.value)} required className="bg-muted/50" />
                <FieldError message={fieldErrors.email} />
                <FieldHint>Must be a valid, unique email.</FieldHint>
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} required className="bg-muted/50 pr-10" />
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FieldError message={fieldErrors.password} />
                <FieldHint>At least 6 characters.</FieldHint>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="03001234567" value={form.phone} onChange={e => update('phone', e.target.value)} required className="bg-muted/50" />
                <FieldError message={fieldErrors.phone} />
                <FieldHint>Pakistan mobile number, 11 digits starting with 03. Must be unique.</FieldHint>
              </div>
              <div className="space-y-2">
                <Label>Industry</Label>
                <Select value={form.industry} onValueChange={v => update('industry', v)}>
                  <SelectTrigger className="bg-muted/50"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {['Transportation', 'Logistics', 'Delivery', 'Construction', 'Mining', 'Other'].map(i => (
                      <SelectItem key={i} value={i}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={fieldErrors.industry} />
                <FieldHint>Required.</FieldHint>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fleet Size</Label>
                <Input placeholder="50" value={form.fleetSize} onChange={e => update('fleetSize', e.target.value)} required className="bg-muted/50" />
                <FieldError message={fieldErrors.fleetSize} />
                <FieldHint>Number of drivers you plan to add, at least 1.</FieldHint>
              </div>
              <div className="space-y-2">
                <Label>NTN Number</Label>
                <Input value={form.ntnNumber} onChange={e => update('ntnNumber', e.target.value)} required className="bg-muted/50" />
                <FieldError message={fieldErrors.ntnNumber} />
                <FieldHint>Required.</FieldHint>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={e => update('address', e.target.value)} required className="bg-muted/50" />
              <FieldError message={fieldErrors.address} />
              <FieldHint>Required.</FieldHint>
            </div>
            <Button type="submit" className="w-full mt-2" disabled={submitting}>
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating account...</> : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account? <Link to="/login" className="text-primary hover:underline font-medium">Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
