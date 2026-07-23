export function parseApiError(error) {
  const data = error?.response?.data;
  const errors = Array.isArray(data?.errors) ? data.errors : [];
  const message =
    data?.message ||
    data?.error ||
    error?.message ||
    'Something went wrong. Please try again.';

  const fieldErrors = {};
  errors.forEach(({ field, message: msg }) => {
    if (field && field !== 'general') fieldErrors[field] = msg;
  });

  const detail = errors.length
    ? errors.map(e => e.message).filter(Boolean).join(' ')
    : message;

  return { message, detail, errors, fieldErrors };
}
