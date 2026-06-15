const STATUS_STYLES = {
  pending: 'bg-warning/10 text-warning',
  active: 'bg-accent-teal/10 text-accent-teal',
  voided: 'bg-muted/10 text-muted',
  pending_review: 'bg-accent-amber/10 text-accent-amber',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-error/10 text-error',
};

const STATUS_LABELS = {
  pending: 'รอยืนยัน',
  active: 'กำลังจัดเตรียม',
  voided: 'ยกเลิก',
  pending_review: 'รอตรวจสลิป',
  approved: 'อนุมัติแล้ว',
  rejected: 'ไม่ผ่าน',
};

export default function StatusBadge({ status, label }) {
  const style = STATUS_STYLES[status] || 'bg-surface-card/80 text-body';
  const text = label || STATUS_LABELS[status] || status;

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${style}`}>
      {text}
    </span>
  );
}
