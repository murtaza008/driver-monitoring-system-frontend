const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0]?.[0] || '?').toUpperCase();
};

/** Small round driver photo (falling back to initials), matching Driver List's look —
 * used everywhere a driver's name shows up in a row so they're identifiable by face too. */
const DriverAvatar = ({ photoUrl, name, size = 'w-8 h-8', textSize = 'text-xs', className = '' }) => (
  photoUrl ? (
    <img
      src={photoUrl}
      alt={name || 'Driver'}
      className={`${size} rounded-full object-cover flex-shrink-0 border border-primary/20 ${className}`}
    />
  ) : (
    <div className={`${size} rounded-full bg-primary/20 flex items-center justify-center text-primary ${textSize} font-bold flex-shrink-0 ${className}`}>
      {getInitials(name)}
    </div>
  )
);

export default DriverAvatar;
