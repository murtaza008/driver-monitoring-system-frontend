export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function normalizePhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('92') && digits.length === 12) digits = '0' + digits.slice(2);
  if (digits.length === 10 && digits.startsWith('3')) digits = '0' + digits;
  return digits;
}

export function normalizePlate(plate) {
  return String(plate || '').trim().toUpperCase().replace(/\s+/g, '');
}

export function normalizeCnic(cnic) {
  return String(cnic || '').replace(/\D/g, '');
}

export function normalizeLicense(license) {
  return String(license || '').trim().toUpperCase().replace(/\s+/g, '');
}

export function normalizeName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ');
}

export function isValidPakistanPhone(phone) {
  return /^03\d{9}$/.test(normalizePhone(phone));
}

export function isValidCnic(cnic) {
  return /^\d{13}$/.test(normalizeCnic(cnic));
}

export function parseFleetSize(value) {
  const n = parseInt(String(value || '').replace(/\D/g, ''), 10);
  return Number.isFinite(n) && n >= 1 ? n : null;
}

export function validateDriverForm(form, { isEdit = false } = {}) {
  const errors = {};
  const add = (field, message) => { errors[field] = message; };

  if (!normalizeName(`${form.firstName || ''} ${form.lastName || ''}`.trim())) {
    add('firstName', 'Driver name is required.');
  }
  if (!normalizeEmail(form.email)) add('email', 'Valid email is required.');
  if (!isEdit && (!form.password || form.password.length < 6)) {
    add('password', 'Password must be at least 6 characters.');
  }
  if (isEdit && form.password && form.password.length < 6) {
    add('password', 'New password must be at least 6 characters.');
  }
  if (!isValidPakistanPhone(form.phone)) {
    add('phone', 'Enter a valid Pakistan mobile (11 digits, e.g. 03001234567).');
  }
  if (!normalizePlate(form.vehiclePlate)) add('vehiclePlate', 'Vehicle plate is required.');
  if (!isValidCnic(form.cnicNumber)) add('cnicNumber', 'CNIC must be 13 digits.');
  if (!normalizeLicense(form.licenseNumber)) add('licenseNumber', 'License number is required.');

  const eName = normalizeName(form.emergencyContactName);
  const ePhone = normalizePhone(form.emergencyContactNumber);
  const dPhone = normalizePhone(form.phone);

  // Both optional — but if either is filled in, the other becomes required too.
  if (eName || ePhone) {
    if (!eName) add('emergencyContactName', 'Emergency contact name is required when a number is provided.');
    if (!isValidPakistanPhone(form.emergencyContactNumber)) {
      add('emergencyContactNumber', 'Enter a valid emergency contact number.');
    }
    if (ePhone && dPhone && ePhone === dPhone) {
      add('emergencyContactNumber', 'Must differ from the driver phone.');
    }
  }

  const firstError = Object.values(errors)[0] || null;
  return { valid: Object.keys(errors).length === 0, errors, message: firstError };
}

export function validateCompanyRegistration(form) {
  const errors = {};
  const add = (field, message) => { errors[field] = message; };

  if (!normalizeName(form.companyName)) add('companyName', 'Company name is required.');
  if (!normalizeName(form.adminName)) add('adminName', 'Admin name is required.');
  if (!normalizeEmail(form.email)) add('email', 'Valid email is required.');
  if (!form.password || form.password.length < 6) add('password', 'Password must be at least 6 characters.');
  if (!isValidPakistanPhone(form.phone)) add('phone', 'Enter a valid Pakistan mobile (11 digits).');
  if (!form.industry) add('industry', 'Select an industry.');
  if (!parseFleetSize(form.fleetSize)) add('fleetSize', 'Fleet size must be at least 1.');
  if (!normalizeName(form.address)) add('address', 'Address is required.');
  if (!String(form.ntnNumber || '').trim()) add('ntnNumber', 'NTN number is required.');

  const firstError = Object.values(errors)[0] || null;
  return { valid: Object.keys(errors).length === 0, errors, message: firstError };
}

export function validateCompanyProfile(form) {
  const errors = {};
  const add = (field, message) => { errors[field] = message; };

  if (!normalizeName(form.companyName)) add('companyName', 'Company name is required.');
  if (!normalizeName(form.adminName)) add('adminName', 'Admin name is required.');
  if (!isValidPakistanPhone(form.phone)) add('phone', 'Enter a valid Pakistan mobile (11 digits).');
  if (!parseFleetSize(form.fleetSize)) add('fleetSize', 'Fleet size must be at least 1.');
  if (!normalizeName(form.address)) add('address', 'Address is required.');
  if (!String(form.ntnNumber || '').trim()) add('ntnNumber', 'NTN number is required.');

  const firstError = Object.values(errors)[0] || null;
  return { valid: Object.keys(errors).length === 0, errors, message: firstError };
}
