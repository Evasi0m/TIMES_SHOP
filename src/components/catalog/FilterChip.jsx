export default function FilterChip({
  label,
  count,
  active = false,
  onClick,
  disabled = false,
  className = '',
  children,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`filter-chip w-full ${active ? 'filter-chip-active' : ''} ${className}`.trim()}
    >
      {children || (
        <>
          <span>{label}</span>
          {count != null && count !== '' && (
            <span className="filter-chip-count">{count.toLocaleString()}</span>
          )}
        </>
      )}
    </button>
  );
}
