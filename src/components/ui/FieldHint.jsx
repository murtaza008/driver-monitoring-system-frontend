function FieldHint({ children }) {
  if (!children) return null;
  return <p className="text-xs text-muted-foreground mt-1">{children}</p>;
}

export default FieldHint;
