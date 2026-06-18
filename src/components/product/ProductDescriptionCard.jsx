import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { motion, useAnimation } from 'framer-motion';
import {
  getDescriptionToggleLabel,
  isDescriptionCollapsible,
  PDP_DESCRIPTION_COLLAPSED_MAX_PX,
} from '../../lib/product-description.js';
import {
  descriptionContentFade,
  descriptionExpandSpring,
  descriptionOverlayFade,
  useReducedMotion,
} from '../../lib/motion.js';

const CONTENT_SHARP = { opacity: 1, filter: 'blur(0px)', y: 0 };
const CONTENT_EXPAND_FROM = { opacity: 0.86, filter: 'blur(5px)', y: -6 };
const CONTENT_COLLAPSE_TO = { opacity: 0.88, filter: 'blur(4px)', y: -4 };

export default function ProductDescriptionCard({ description, html = false }) {
  const contentRef = useRef(null);
  const contentId = useId();
  const contentControls = useAnimation();
  const reducedMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const [collapsible, setCollapsible] = useState(false);
  const [fullHeight, setFullHeight] = useState(0);
  const [motionPhase, setMotionPhase] = useState('idle');

  const measure = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;

    const height = el.scrollHeight;
    setFullHeight(height);
    setCollapsible(isDescriptionCollapsible(height));
  }, []);

  useLayoutEffect(() => {
    setExpanded(false);
    setMotionPhase('idle');
    contentControls.set(CONTENT_SHARP);
    measure();
  }, [contentControls, description, html, measure]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [description, html, measure]);

  const collapsed = collapsible && !expanded;
  const instant = reducedMotion ? { duration: 0.01 } : undefined;

  const bodyClassName = [
    'pdp-description-card__body p-4 text-sm leading-relaxed text-body',
    html ? 'pdp-description-html' : 'whitespace-pre-wrap',
  ].join(' ');

  const bodyContent = html
    ? { dangerouslySetInnerHTML: { __html: description } }
    : { children: description };

  const handleToggle = () => {
    if (reducedMotion) {
      setExpanded((value) => !value);
      return;
    }

    if (expanded) {
      setMotionPhase('collapsing');
      setExpanded(false);
      void contentControls.start(CONTENT_COLLAPSE_TO, instant ?? descriptionContentFade);
      return;
    }

    setMotionPhase('expanding');
    setExpanded(true);
    contentControls.set(CONTENT_EXPAND_FROM);
    void contentControls.start(CONTENT_SHARP, instant ?? descriptionContentFade);
  };

  const handleShellAnimationComplete = () => {
    if (motionPhase === 'collapsing') {
      contentControls.set(CONTENT_SHARP);
    }
    setMotionPhase('idle');
  };

  return (
    <div className="card-canvas pdp-description-card">
      {collapsible ? (
        <motion.div
          className="pdp-description-card__shell"
          initial={false}
          animate={{
            height: expanded ? fullHeight : PDP_DESCRIPTION_COLLAPSED_MAX_PX,
          }}
          transition={instant ?? descriptionExpandSpring}
          onAnimationComplete={handleShellAnimationComplete}
        >
          <motion.div animate={contentControls} initial={CONTENT_SHARP}>
            <div
              id={contentId}
              ref={contentRef}
              className={bodyClassName}
              {...bodyContent}
            />
          </motion.div>
          <motion.div
            className="pdp-description-card__fade"
            initial={false}
            animate={{ opacity: collapsed || motionPhase === 'collapsing' ? 1 : 0 }}
            transition={instant ?? descriptionOverlayFade}
            aria-hidden
          />
        </motion.div>
      ) : (
        <div
          id={contentId}
          ref={contentRef}
          className={bodyClassName}
          {...bodyContent}
        />
      )}
      {collapsible ? (
        <button
          type="button"
          className="pdp-description-card__toggle"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={handleToggle}
        >
          {getDescriptionToggleLabel(expanded)}
        </button>
      ) : null}
    </div>
  );
}
