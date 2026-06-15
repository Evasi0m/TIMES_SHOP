export default function BadgePill({ children, className = '' }) {
  return <span className={`badge-pill ${className}`.trim()}>{children}</span>;
}
