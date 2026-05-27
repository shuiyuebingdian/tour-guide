import { useState, useEffect, useCallback, useRef } from 'react';
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

export type ProximityStatus = 'idle' | 'alerting' | 'dismissed';

interface UseProximityAlertOptions {
  nearestUnplayed: Attraction | null;
  onPlay: (attraction: Attraction) => void;
}

export function useProximityAlert({
  nearestUnplayed,
  onPlay,
}: UseProximityAlertOptions) {
  const [status, setStatus] = useState<ProximityStatus>('idle');
  const [target, setTarget] = useState<Attraction | null>(null);
  const dismissedIdRef = useRef<string | null>(null);
  const onPlayRef = useRef(onPlay);
  onPlayRef.current = onPlay;

  useEffect(() => {
    if (!nearestUnplayed) {
      setStatus('idle');
      setTarget(null);
      dismissedIdRef.current = null;
      return;
    }

    // Already alerted today — never re-alert
    if (hasAlertedToday(nearestUnplayed.id)) {
      return;
    }

    // Still dismissed for this same attraction — don't re-alert
    if (
      status === 'dismissed' &&
      dismissedIdRef.current === nearestUnplayed.id
    ) {
      return;
    }

    // Previous dismissed target no longer nearest — clear ref
    if (
      dismissedIdRef.current !== null &&
      dismissedIdRef.current !== nearestUnplayed.id
    ) {
      dismissedIdRef.current = null;
    }

    // No existing alert for this target — alert!
    if (target?.id !== nearestUnplayed.id || status !== 'alerting') {
      setTarget(nearestUnplayed);
      setStatus('alerting');

      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
    }
  }, [nearestUnplayed]);

  const dismiss = useCallback(() => {
    if (target) {
      recordAlert(target.id);
      dismissedIdRef.current = target.id;
      setStatus('dismissed');
    }
  }, [target]);

  const markTriggered = useCallback(() => {
    if (target) {
      recordAlert(target.id);
      setStatus('idle');
      setTarget(null);
      dismissedIdRef.current = null;
      onPlayRef.current(target);
    }
  }, [target]);

  return { status, target, dismiss, markTriggered } as const;
}
