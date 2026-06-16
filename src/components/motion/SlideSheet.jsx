import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getSheetPanel, useReducedMotion } from '../../lib/motion.js';
import OverlayBackdrop from './OverlayBackdrop.jsx';

export default function SlideSheet({
  open,
  onClose,
  side = 'bottom',
  ariaLabel,
  ariaLabelledBy,
  panelClassName = '',
  zIndex = 50,
  children,
}) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const panelVariants = getSheetPanel(side, reduced);
  const isRight = side === 'right';

  return (
    <AnimatePresence>
      {open && (
        <div
          className={
            isRight
              ? 'fixed inset-0 z-[var(--sheet-z,50)]'
              : 'fixed inset-0 z-[var(--sheet-z,50)] flex items-end justify-center lg:items-center'
          }
          style={{ '--sheet-z': zIndex }}
        >
          <OverlayBackdrop onClose={onClose} zIndex={zIndex} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            className={
              isRight
                ? `fixed bottom-0 right-0 top-0 flex h-full w-full max-w-md flex-col bg-canvas shadow-xl ${panelClassName}`.trim()
                : `relative z-10 ${panelClassName}`.trim()
            }
            style={isRight ? { zIndex: zIndex + 1 } : { zIndex: zIndex + 1 }}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
