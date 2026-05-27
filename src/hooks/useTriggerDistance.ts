import { useState, useCallback } from 'react';

const STORAGE_KEY = 'tour-guide-trigger-distance';
const DEFAULT_DISTANCE = 30;
const MIN_DISTANCE = 10;
const MAX_DISTANCE = 200;

function load(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return DEFAULT_DISTANCE;
    const n = Number(raw);
    if (Number.isNaN(n)) return DEFAULT_DISTANCE;
    return Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, n));
  } catch {
    return DEFAULT_DISTANCE;
  }
}

function save(d: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(d));
  } catch {
    // ignore
  }
}

export function useTriggerDistance(): [number, (d: number) => void] {
  const [distance, setDistance] = useState(load);

  const setAndSave = useCallback((d: number) => {
    const clamped = Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, Math.round(d)));
    setDistance(clamped);
    save(clamped);
  }, []);

  return [distance, setAndSave];
}
