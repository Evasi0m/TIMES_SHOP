const SPEC_SHORT_LABEL = {
  case_size: 'ขนาด',
  weight: 'น้ำหนัก',
  water_resist: 'กันน้ำ',
  battery_life: 'แบตเตอรี่',
  case_material: 'วัสดุ',
  strap: 'สาย',
  structure: 'โครงสร้าง',
  sensors: 'เซนเซอร์',
  training: 'ฝึกซ้อม',
  power: 'พลังงาน',
  crystal: 'กระจก',
  dial: 'หน้าปัด',
};

function shortLabel(spec) {
  return SPEC_SHORT_LABEL[spec.key] || spec.label;
}

export default function ProductSpecSummary({ specs = [] }) {
  if (!specs.length) return null;

  return (
    <div className="pdp-spec-summary" aria-label="สเปกหลัก">
      {specs.map((spec) => (
        <div key={`${spec.key}-${spec.label}`} className="pdp-spec-tile card-canvas">
          <span className="pdp-spec-tile__label">{shortLabel(spec)}</span>
          <span className="pdp-spec-tile__value">{spec.value}</span>
        </div>
      ))}
    </div>
  );
}
