import { useState, useCallback } from 'react';

const STORAGE_KEY = 'speech-rate';
const DEFAULT_RATE = 1.0;

function loadRate(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const n = Number(stored);
      if (n >= 0.5 && n <= 2.0) return n;
    }
  } catch {
    // localStorage disabled or quota exceeded
  }
  return DEFAULT_RATE;
}

function saveRate(rate: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(rate));
  } catch {
    // ignore
  }
}

export function useRatePreference(): [number, (rate: number) => void] {
  const [rate, setRate] = useState(loadRate);

  const setAndSave = useCallback((r: number) => {
    setRate(r);
    saveRate(r);
  }, []);

  return [rate, setAndSave];
}
