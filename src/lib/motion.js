import { useReducedMotion as useFramerReducedMotion } from 'framer-motion';

export const DURATION = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.35,
};

export const SPRING = {
  sheet: { type: 'spring', damping: 28, stiffness: 320 },
  gentle: { type: 'spring', damping: 32, stiffness: 280 },
  pop: { type: 'spring', damping: 18, stiffness: 400 },
};

export const sheetBackdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.normal } },
  exit: { opacity: 0, transition: { duration: DURATION.fast } },
};

export function getSheetPanel(side = 'bottom', reduced = false) {
  if (reduced) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: DURATION.fast } },
      exit: { opacity: 0, transition: { duration: DURATION.fast } },
    };
  }
  if (side === 'right') {
    return {
      hidden: { x: '100%', opacity: 0.8 },
      visible: { x: 0, opacity: 1, transition: SPRING.sheet },
      exit: { x: '100%', opacity: 0, transition: { duration: DURATION.normal, ease: [0.4, 0, 0.2, 1] } },
    };
  }
  return {
    hidden: { y: '100%', opacity: 0.6 },
    visible: { y: 0, opacity: 1, transition: SPRING.sheet },
    exit: { y: '100%', opacity: 0, transition: { duration: DURATION.normal, ease: [0.4, 0, 0.2, 1] } },
  };
}

export const pageFade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATION.normal, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -4, transition: { duration: DURATION.fast } },
};

export const pageFadeOnly = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: DURATION.normal } },
  exit: { opacity: 0, transition: { duration: DURATION.fast } },
};

export const staggerContainer = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: [0.4, 0, 0.2, 1] },
  },
};

export const toastMotion = {
  initial: { opacity: 0, y: 16, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1, transition: SPRING.gentle },
  exit: { opacity: 0, y: 8, scale: 0.98, transition: { duration: DURATION.fast } },
};

export function useReducedMotion() {
  return useFramerReducedMotion();
}

export function getPageVariants(pathname, reduced) {
  if (reduced) return pageFadeOnly;
  if (pathname.startsWith('/product')) {
    return {
      initial: false,
      animate: { opacity: 1 },
      exit: { opacity: 0, transition: { duration: DURATION.fast } },
    };
  }
  return pageFade;
}
