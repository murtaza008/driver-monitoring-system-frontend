import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, UserCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import ImageCropperModal from '@/components/ui/ImageCropperModal';
import FieldError from '@/components/ui/FieldError';
import FieldHint from '@/components/ui/FieldHint';
import { validateDriverForm } from '@/utils/validation';
import { parseApiError } from '@/utils/apiErrors';
import api from '@/lib/api';

const AddDriver = () => {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '', vehiclePlate: '',
    cnicNumber: '', licenseNumber: '', emergencyContactName: '', emergencyContactNumber: '',
  });
  const [files, setFiles] = useState({ photo: null, cnicFront: null, cnicBack: null, licenseFront: null, licenseBack: null });
  const [previews, setPreviews] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [currentCropImage, setCurrentCropImage] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: fleetStatus } = useQuery({
    queryKey: ['fleet-status'],
    queryFn: async () => {
      const { data } = await api.get('/drivers/fleet-status');
      return data;
    },
  });

  const update = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setFieldErrors(e => ({ ...e, [k]: undefined }));
  };

  const handleFileChange = (e, key) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (key === 'photo') {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentCropImage(reader.result);
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    } else {
      setFiles(prev => ({ ...prev, [key]: file }));
      const reader = new FileReader();
      reader.onloadend = () => setPreviews(prev => ({ ...prev, [key]: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedBlob) => {
    const croppedFile = new File([croppedBlob], 'profile_photo.jpg', { type: 'image/jpeg' });
    setFiles(prev => ({ ...prev, photo: croppedFile }));
    setPreviews(prev => ({ ...prev, photo: URL.createObjectURL(croppedBlob) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const check = validateDriverForm(form);
    if (!check.valid) {
      setFieldErrors(check.errors);
      toast({ title: 'Please fix the form', description: check.message, variant: 'destructive' });
      return;
    }
    if (fleetStatus && !fleetStatus.canAdd) {
      toast({
        title: 'Fleet limit reached',
        description: `You have ${fleetStatus.totalCount} of ${fleetStatus.fleetSize} drivers (including demo).`,
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('name', `${form.firstName} ${form.lastName}`.trim());
    formData.append('email', form.email);
    formData.append('password', form.password);
    formData.append('phone', form.phone);
    formData.append('licenseNumber', form.licenseNumber);
    formData.append('vehiclePlate', form.vehiclePlate);
    formData.append('cnicNumber', form.cnicNumber);
    formData.append('emergencyContactName', form.emergencyContactName);
    formData.append('emergencyContactNumber', form.emergencyContactNumber);
    Object.entries(files).forEach(([key, file]) => { if (file) formData.append(key, file); });

    try {
      await api.post('/drivers', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast({ title: 'Driver added', description: `${form.firstName} ${form.lastName} has been registered.` });
      navigate('/drivers');
    } catch (error) {
      const { message, detail, fieldErrors: apiFields } = parseApiError(error);
      setFieldErrors(prev => ({ ...prev, ...apiFields }));
      toast({ title: message, description: detail, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const FileUpload = ({ label, id }) => (
    <div className="relative">
      <label htmlFor={id} className="cursor-pointer">
        <div className={`border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors ${previews[id] ? 'bg-primary/5' : ''}`}>
          {previews[id] ? (
            <img src={previews[id]} alt={label} className="w-full h-12 object-contain rounded" />
          ) : (
            <>
              <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">{label}</p>
            </>
          )}
        </div>
      </label>
      <input id={id} type="file" accept="image/*" onChange={(e) => handleFileChange(e, id)} className="hidden" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Add New Driver</h1>
        <p className="text-muted-foreground text-sm">Register a new driver to the fleet</p>
        {fleetStatus && (
          <p className={`text-sm mt-2 ${fleetStatus.canAdd ? 'text-muted-foreground' : 'text-destructive font-medium'}`}>
            Fleet usage: {fleetStatus.totalCount} / {fleetStatus.fleetSize} drivers
            {fleetStatus.demoCount > 0 && ` (includes ${fleetStatus.demoCount} demo)`}
            {!fleetStatus.canAdd && ' — limit reached'}
          </p>
        )}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col items-center gap-3">
            <label htmlFor="photo" className="cursor-pointer group">
              {previews.photo ? (
                <img src={previews.photo} alt="Driver" className="w-24 h-24 rounded-full object-cover border-2 border-primary/30" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
                  <UserCircle className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
            </label>
            <input id="photo" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'photo')} className="hidden" />
            <p className="text-xs text-muted-foreground">Click to upload driver photo</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input value={form.firstName} onChange={e => update('firstName', e.target.value)} required className="bg-muted/50" />
              <FieldError message={fieldErrors.firstName} />
              <FieldHint>Required.</FieldHint>
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input value={form.lastName} onChange={e => update('lastName', e.target.value)} required className="bg-muted/50" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} required autoComplete="off" className="bg-muted/50" />
              <FieldError message={fieldErrors.email} />
              <FieldHint>Must be a valid, unique email — not already used by another driver or company account.</FieldHint>
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} required minLength={6} autoComplete="new-password" className="bg-muted/50 pr-10" />
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
              <Label>Phone Number</Label>
              <Input placeholder="03001234567" value={form.phone} onChange={e => update('phone', e.target.value)} required className="bg-muted/50" />
              <FieldError message={fieldErrors.phone} />
              <FieldHint>Pakistan mobile number, 11 digits starting with 03. Must be unique.</FieldHint>
            </div>
            <div className="space-y-2">
              <Label>Vehicle Plate</Label>
              <Input placeholder="LHR-1234" value={form.vehiclePlate} onChange={e => update('vehiclePlate', e.target.value)} required className="bg-muted/50" />
              <FieldError message={fieldErrors.vehiclePlate} />
              <FieldHint>Required and must be unique across all drivers.</FieldHint>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Emergency Contact Name <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
              <Input value={form.emergencyContactName} onChange={e => update('emergencyContactName', e.target.value)} className="bg-muted/50" />
              <FieldError message={fieldErrors.emergencyContactName} />
              <FieldHint>Optional — but if you set a contact number, a name is required too.</FieldHint>
            </div>
            <div className="space-y-2">
              <Label>Emergency Contact Number <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
              <Input placeholder="03001234567" value={form.emergencyContactNumber} onChange={e => update('emergencyContactNumber', e.target.value)} className="bg-muted/50" />
              <FieldError message={fieldErrors.emergencyContactNumber} />
              <FieldHint>Optional — but if you set a name, a valid number is required too (and must differ from the driver's own phone).</FieldHint>
            </div>
          </div>

          <div className="space-y-2">
            <Label>CNIC Number</Label>
            <Input placeholder="1234512345671 (13 digits)" value={form.cnicNumber} onChange={e => update('cnicNumber', e.target.value)} required className="bg-muted/50" />
            <FieldError message={fieldErrors.cnicNumber} />
            <FieldHint>Exactly 13 digits, no dashes. Must be unique. (Front/back photos below are optional.)</FieldHint>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <FileUpload label="CNIC Front" id="cnicFront" />
              <FileUpload label="CNIC Back" id="cnicBack" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>License Number</Label>
            <Input placeholder="LIC-123456" value={form.licenseNumber} onChange={e => update('licenseNumber', e.target.value)} required className="bg-muted/50" />
            <FieldError message={fieldErrors.licenseNumber} />
            <FieldHint>Required and must be unique across all drivers. (Front/back photos below are optional.)</FieldHint>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <FileUpload label="License Front" id="licenseFront" />
              <FileUpload label="License Back" id="licenseBack" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1 font-semibold" disabled={submitting || fleetStatus?.canAdd === false}>
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Adding...</> : 'Add Driver'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/drivers')}>Cancel</Button>
          </div>
        </form>
      </motion.div>

      <ImageCropperModal isOpen={isCropperOpen} onClose={() => setIsCropperOpen(false)} imageSrc={currentCropImage} onCropCompleteAction={handleCropComplete} />
    </div>
  );
};

export default AddDriver;
