import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <p className="font-display text-5xl text-primary">404</p>
      <h1 className="font-display text-xl text-ink">ไม่พบหน้าที่คุณค้นหา</h1>
      <Link to="/" className="btn-primary">
        กลับหน้าแรก
      </Link>
    </div>
  );
}
