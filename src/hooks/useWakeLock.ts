import { useState, useCallback, useEffect, useRef } from 'react';

const STORAGE_KEY = 'tour-guide-wakelock';

function loadPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function savePreference(v: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(v));
  } catch {
    // ignore
  }
}

export function useWakeLock(): [boolean, (v: boolean) => void] {
  const [enabled, setEnabled] = useState(loadPreference);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => {
          wakeLockRef.current = null;
        });
      }
    } catch {
      // wake lock not supported or denied
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  }, []);

  const setAndSave = useCallback(
    (v: boolean) => {
      setEnabled(v);
      savePreference(v);
      if (v) {
        requestWakeLock();
      } else {
        releaseWakeLock();
      }
    },
    [requestWakeLock, releaseWakeLock],
  );

  // Re-acquire wake lock when page becomes visible again
  useEffect(() => {
    if (!enabled) return;

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [enabled, requestWakeLock]);

  // Request on initial mount if enabled
  useEffect(() => {
    if (enabled) {
      requestWakeLock();
    }
    return () => releaseWakeLock();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return [enabled, setAndSave];
}
