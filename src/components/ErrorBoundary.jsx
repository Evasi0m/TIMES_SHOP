import { Component } from 'react';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="space-y-4 py-16 text-center">
          <p className="font-display text-xl text-ink">เกิดข้อผิดพลาด</p>
          <p className="text-sm text-muted">กรุณารีเฟรชหน้าหรือกลับไปเลือกสินค้าใหม่</p>
          <Link to="/catalog" className="btn-primary inline-flex">
            กลับไปหน้าสินค้า
          </Link>
        </div>
      );
    }
    return this.props.children;
  }
}

export function ProductPageErrorFallback() {
  return (
    <div className="space-y-4 py-16 text-center">
      <p className="font-display text-xl text-ink">โหลดหน้าสินค้าไม่สำเร็จ</p>
      <p className="text-sm text-muted">กรุณารีเฟรชหน้าหรือกลับไปเลือกสินค้าใหม่</p>
      <Link to="/catalog" className="btn-primary inline-flex">
        กลับไปหน้าสินค้า
      </Link>
    </div>
  );
}
