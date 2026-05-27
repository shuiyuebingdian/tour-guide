import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Attraction } from '../types';

const STORAGE_KEY = 'tour-guide-alerts';

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function hasAlertedToday(id: string): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw) as Record<string, string[]>;
    return (data[getTodayKey()] ?? []).includes(id);
  } catch {
    return false;
  }
}

function recordAlert(id: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data: Record<string, string[]> = raw ? JSON.parse(raw) : {};
    const today = getTodayKey();
    if (!data[today]) data[today] = [];
    if (!data[today].includes(id)) {
      data[today].push(id);
    }
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    for (const key of Object.keys(data)) {
      if (key < cutoffStr) {
        delete data[key];
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

export function clearAlertHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export type ProximityStatus = 'idle' | 'alerting' | 'dismissed';

interface UseProximityAlertOptions {
  unplayedNearby: Attraction[];
  onPlay: (attraction: Attraction) => void;
}

export function useProximityAlert({
  unplayedNearby,
  onPlay,
}: UseProximityAlertOptions) {
  const [status, setStatus] = useState<ProximityStatus>('idle');
  const [target, setTarget] = useState<Attraction | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const onPlayRef = useRef(onPlay);
  onPlayRef.current = onPlay;
  const statusRef = useRef(status);
  statusRef.current = status;
  const targetRef = useRef(target);
  targetRef.current = target;
  const lastRecordedRef = useRef<string | null>(null);

  const candidate = useMemo(() => {
    const isEligible = (a: Attraction) => {
      if (hasAlertedToday(a.id) && a.id !== lastRecordedRef.current) return false;
      if (dismissedId === a.id) return false;
      return true;
    };

    // Prioritize scenic area overview first, then individual attractions
    const overview = unplayedNearby.find((a) => a.id.endsWith('-overview') && isEligible(a));
    if (overview) return overview;

    return unplayedNearby.find(isEligible) ?? null;
  }, [unplayedNearby, dismissedId]);

  useEffect(() => {
    const id = candidate?.id ?? null;

    if (id === null) {
      setStatus('idle');
      setTarget(null);
      lastRecordedRef.current = null;
      return;
    }

    if (targetRef.current?.id === id && statusRef.current === 'alerting') {
      return;
    }

    setTarget(candidate);
    setStatus('alerting');
    recordAlert(id);
    lastRecordedRef.current = id;

    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
  }, [candidate?.id ?? null]);

  const dismiss = useCallback(() => {
    if (target) {
      setDismissedId(target.id);
      setStatus('dismissed');
    }
  }, [target]);

  const markTriggered = useCallback(() => {
    if (target) {
      setDismissedId(null);
      setStatus('idle');
      setTarget(null);
      onPlayRef.current(target);
    }
  }, [target]);

  return { status, target, dismiss, markTriggered };
}
