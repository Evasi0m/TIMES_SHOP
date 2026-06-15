import { useCallback, useEffect, useState } from 'react';
import { isNewVersionAvailable, reloadApp } from '../lib/appVersion.js';

const POLL_MS = 5 * 60 * 1000;

export function useAppUpdateCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const check = useCallback(async () => {
    if (import.meta.env.DEV) return;
    const available = await isNewVersionAvailable();
    if (available) setUpdateAvailable(true);
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV) return undefined;

    check();
    const intervalId = window.setInterval(check, POLL_MS);

    const onVisibilityChange = () => {
      if (!document.hidden) check();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [check]);

  const reload = useCallback(() => {
    reloadApp();
  }, []);

  return { updateAvailable, reload };
}
