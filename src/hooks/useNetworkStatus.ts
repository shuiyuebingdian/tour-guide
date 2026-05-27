import { useState, useEffect, useRef } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (mountedRef.current) {
        setWasOffline(true);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    mountedRef.current = true;

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!wasOffline) return;
    const timer = setTimeout(() => setWasOffline(false), 2000);
    return () => clearTimeout(timer);
  }, [wasOffline]);

  return { isOnline, wasOffline };
}
