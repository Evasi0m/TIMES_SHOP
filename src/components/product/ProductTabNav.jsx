const TABS = [
  { id: 'overview', label: 'ภาพรวม' },
  { id: 'description', label: 'คำอธิบาย' },
  { id: 'related', label: 'รายการแนะนำ' },
];

export default function ProductTabNav({ activeId, onSelect }) {
  return (
    <nav className="pdp-tab-nav" aria-label="ส่วนข้อมูลสินค้า">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`pdp-tab-btn ${activeId === tab.id ? 'pdp-tab-btn--active' : ''}`}
          onClick={() => onSelect(tab.id)}
          aria-current={activeId === tab.id ? 'true' : undefined}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export { TABS as PDP_TABS };
