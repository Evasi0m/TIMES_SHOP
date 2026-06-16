import { motion } from 'framer-motion';
import { sheetBackdrop } from '../../lib/motion.js';

export default function OverlayBackdrop({ onClose, ariaLabel = 'ปิด', zIndex = 50 }) {
  return (
    <motion.button
      type="button"
      className="fixed inset-0 bg-ink/40 backdrop-blur-sm"
      style={{ zIndex }}
      aria-label={ariaLabel}
      onClick={onClose}
      variants={sheetBackdrop}
      initial="hidden"
      animate="visible"
      exit="exit"
    />
  );
}
