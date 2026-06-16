import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { toastMotion, useReducedMotion } from '../lib/motion.js';

const ToastContext = createContext(null);

let nextId = 1;

function shouldHideBottomNav(pathname) {
  if (pathname.startsWith('/checkout')) return true;
  if (pathname.startsWith('/auth')) return true;
  if (pathname.startsWith('/admin')) return true;
  return false;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});
  const { pathname } = useLocation();
  const noTab = shouldHideBottomNav(pathname);
  const reduced = useReducedMotion();

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const push = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, type }]);
      timers.current[id] = setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      info: (m, d) => push(m, 'info', d),
      success: (m, d) => push(m, 'success', d),
      error: (m, d) => push(m, 'error', d),
      dismiss,
    }),
    [push, dismiss]
  );

  const toastVariants = reduced
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : toastMotion;

  return (
    <ToastContext.Provider value={api}>
      {children}
      <LayoutGroup>
        <div className={`toast-stack ${noTab ? 'toast-stack--no-tab' : ''}`}>
          <AnimatePresence mode="popLayout">
            {toasts.map((t) => (
              <motion.button
                type="button"
                key={t.id}
                layout={!reduced}
                onClick={() => dismiss(t.id)}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={toastVariants}
                className={`toast-item pointer-events-auto w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-on-dark ${
                  t.type === 'success'
                    ? 'border-l-4 border-accent-teal bg-nightshade'
                    : t.type === 'error'
                      ? 'border-l-4 border-error bg-nightshade'
                      : 'bg-nightshade'
                }`}
              >
                {t.message}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </LayoutGroup>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
