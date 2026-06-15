import { MinusIcon, PlusIcon } from '../icons.jsx';

export default function QuantityStepper({ value, min = 1, max = 99, onChange, disabled = false }) {
  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        className="icon-btn"
        aria-label="ลดจำนวน"
        disabled={disabled || atMin}
        onClick={() => onChange(value - 1)}
      >
        <MinusIcon size={18} />
      </button>
      <span className="min-w-[2rem] text-center text-base font-semibold text-ink">{value}</span>
      <button
        type="button"
        className="icon-btn"
        aria-label="เพิ่มจำนวน"
        disabled={disabled || atMax}
        onClick={() => onChange(value + 1)}
      >
        <PlusIcon size={18} />
      </button>
    </div>
  );
}
