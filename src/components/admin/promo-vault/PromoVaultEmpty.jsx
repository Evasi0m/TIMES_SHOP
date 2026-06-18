import { Link } from 'react-router-dom';

export default function PromoVaultEmpty({ filtered }) {
  return (
    <div className="promo-vault-empty">
      <p className="promo-vault-empty__title">
        {filtered ? 'ไม่พบโปรที่ตรงเงื่อนไข' : 'ยังไม่มีโปรในคลัง'}
      </p>
      <p className="promo-vault-empty__desc">
        {filtered
          ? 'ลองเปลี่ยนตัวกรองหรือคำค้นหา'
          : 'สร้างโปรแรกแล้วแจกให้ลูกค้าได้รับสิทธิ์ทันที'}
      </p>
      {!filtered && (
        <Link to="/admin/promos/new" className="btn-admin-primary mt-4 inline-flex min-h-[44px]">
          สร้างโปรแรก
        </Link>
      )}
    </div>
  );
}
