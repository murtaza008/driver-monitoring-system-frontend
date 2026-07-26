import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Eye, EyeOff, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { parseApiError } from '@/utils/apiErrors';
import api from '@/lib/api';
import FieldError from '@/components/ui/FieldError';
import { validateForgotPasswordForm } from '@/utils/validation';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();
  const { toast } = useToast();

  const update = (setter, key) => (e) => {
    setter(e.target.value);
    setFieldErrors(f => ({ ...f, [key]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const check = validateForgotPasswordForm({ email, phone, newPassword, confirmPassword });
    if (!check.valid) {
      setFieldErrors(check.errors);
      toast({ title: 'Please fix the form', description: check.message, variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      await api.post('/auth/reset-password', { email, phone, newPassword });
      toast({ title: 'Password reset!', description: 'You can now log in with your new password.' });
      navigate('/login');
    } catch (error) {
      const { message, detail, fieldErrors: apiFields } = parseApiError(error);
      setFieldErrors(prev => ({ ...prev, ...apiFields }));
      toast({ title: message || 'Reset failed', description: detail || 'Please check your details and try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 via-background to-background items-center justify-center p-12">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-8">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Driver Monitoring System</h1>
          <p className="text-lg text-muted-foreground">AI-powered fleet safety monitoring. Track driver behavior, reduce accidents, and improve fleet performance in real-time.</p>
        </motion.div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">DMS Admin</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Reset password</h2>
          </div>
          <p className="text-muted-foreground mb-8">Confirm your email and phone number to set a new password. This works for both admin and driver accounts.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@fleet.com" value={email} onChange={update(setEmail, 'email')} required className="bg-muted/50" />
              <FieldError message={fieldErrors.email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="03001234567" value={phone} onChange={update(setPhone, 'phone')} required className="bg-muted/50" />
              <FieldError message={fieldErrors.phone} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input id="newPassword" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={newPassword} onChange={update(setNewPassword, 'newPassword')} required minLength={6} className="bg-muted/50 pr-10" />
                <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <FieldError message={fieldErrors.newPassword} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword} onChange={update(setConfirmPassword, 'confirmPassword')} required minLength={6} className="bg-muted/50" />
              <FieldError message={fieldErrors.confirmPassword} />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>{saving ? 'Resetting...' : 'Reset Password'}</Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Remembered your password?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">Back to Sign In</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
