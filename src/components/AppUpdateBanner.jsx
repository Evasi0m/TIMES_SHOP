export default function AppUpdateBanner({ visible, onReload }) {
  if (!visible) return null;

  return (
    <div className="app-update-banner" role="status" aria-live="polite">
      <p className="app-update-banner__text">มีเวอร์ชันใหม่ กดอัปเดตเพื่อใช้งานล่าสุด</p>
      <button type="button" className="app-update-banner__action btn-primary" onClick={onReload}>
        อัปเดตทันที
      </button>
    </div>
  );
}
