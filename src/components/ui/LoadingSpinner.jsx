import { Loader2, ShieldCheck } from 'lucide-react';

/** The one loading spinner used across the whole dashboard — originally only on the
 * main Dashboard page, now shared everywhere a page needs a full-page loading state
 * so it's visually consistent site-wide. */
const LoadingSpinner = ({ label = 'Loading...', className = '' }) => (
  <div className={`flex flex-col items-center justify-center h-full gap-3 py-20 ${className}`}>
    <div className="relative">
      <div className="w-14 h-14 rounded-full border-4 border-primary/20" />
      <ShieldCheck className="w-6 h-6 text-primary absolute inset-0 m-auto" />
      <Loader2 className="w-14 h-14 text-primary animate-spin absolute inset-0" strokeWidth={2.5} />
    </div>
    {label && <p className="text-sm text-muted-foreground animate-pulse">{label}</p>}
  </div>
);

export default LoadingSpinner;
