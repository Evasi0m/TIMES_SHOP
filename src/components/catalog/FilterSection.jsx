export default function FilterSection({ title, hint, children, hidden }) {
  if (hidden) return null;

  return (
    <section className="card-canvas space-y-3 p-4">
      <div>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {hint && <p className="mt-1 text-xs leading-relaxed text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}
