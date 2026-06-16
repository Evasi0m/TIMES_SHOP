export default function OrderTimeline({ steps = [] }) {
  if (!steps.length) return null;

  return (
    <ol className="space-y-3 text-left">
      {steps.map((step, idx) => (
        <li key={step.id} className="flex items-start gap-3">
          <span
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              step.done ? 'bg-success/15 text-success' : 'bg-canvas text-muted ring-1 ring-hairline'
            }`}
            aria-hidden="true"
          >
            {step.done ? '✓' : idx + 1}
          </span>
          <div>
            <p className={`text-sm font-medium ${step.done ? 'text-ink' : 'text-muted'}`}>
              {step.label}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
