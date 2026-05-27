import { useState, useCallback } from 'react';

const STORAGE_KEY = 'autoplay-preference';

function load(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function save(value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // ignore
  }
}

export function useAutoPlayPreference(): [boolean, (v: boolean) => void] {
  const [autoPlay, setAutoPlay] = useState(load);

  const setAndSave = useCallback((v: boolean) => {
    setAutoPlay(v);
    save(v);
  }, []);

  return [autoPlay, setAndSave];
}
