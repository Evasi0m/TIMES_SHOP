export default function ProductSpecTable({ specs = [] }) {
  if (!specs.length) return null;

  return (
    <div className="card-canvas pdp-spec-table" aria-label="รายละเอียดสเปก">
      {specs.map((spec) => (
        <div key={`${spec.key}-${spec.label}`} className="pdp-spec-table__row">
          <span className="pdp-spec-table__label">{spec.label}</span>
          <span className="pdp-spec-table__value">{spec.value}</span>
        </div>
      ))}
    </div>
  );
}
