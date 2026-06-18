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

/** Home store profile hero card — section entrance. */
export const storeProfileHero = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  },
};

/** Cover image Ken Burns settle. */
export const storeProfileCover = {
  initial: { scale: 1.06 },
  animate: {
    scale: 1.04,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  },
};

/** Avatar pop on hero identity row. */
export const storeProfileAvatarPop = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1, transition: SPRING.pop },
};

/** Coupon dock slide-up after promos load. */
export const storeProfileCouponDock = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: [0.4, 0, 0.2, 1] },
  },
};

export const couponTicketStagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.05, delayChildren: 0.06 } },
};

export const couponTicketItem = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: [0.4, 0, 0.2, 1] },
  },
};

export function getStoreProfileMotionProps({ preview = false, reduced = false } = {}) {
  if (preview || reduced) {
    return { initial: false, animate: 'animate' };
  }
  return { initial: 'initial', animate: 'animate' };
}

/** PDP description expand/collapse — spring height + soft blur fade. */
export const descriptionExpandSpring = {
  type: 'spring',
  damping: 24,
  stiffness: 200,
  mass: 0.85,
};

export const descriptionContentFade = {
  duration: 0.45,
  ease: [0.4, 0, 0.2, 1],
};

export const descriptionOverlayFade = {
  duration: 0.4,
  ease: [0.4, 0, 0.2, 1],
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
