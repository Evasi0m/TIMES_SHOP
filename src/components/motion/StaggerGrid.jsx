import { Children } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, useReducedMotion } from '../../lib/motion.js';

export default function StaggerGrid({ className = '', children }) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {Children.map(children, (child) =>
        child != null ? (
          <motion.div key={child.key} variants={staggerItem} className="min-w-0">
            {child}
          </motion.div>
        ) : null
      )}
    </motion.div>
  );
}
