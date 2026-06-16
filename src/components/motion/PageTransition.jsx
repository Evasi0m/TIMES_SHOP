import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { getPageVariants, useReducedMotion } from '../../lib/motion.js';

export default function PageTransition({ children }) {
  const { pathname } = useLocation();
  const reduced = useReducedMotion();
  const variants = getPageVariants(pathname, reduced);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        className="min-h-0 flex-1"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
