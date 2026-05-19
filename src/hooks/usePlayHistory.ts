import { useCallback } from 'react';

const STORAGE_KEY = 'tour-guide-played';

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getPlayedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const data = JSON.parse(raw) as Record<string, string[]>;
    const todayIds = data[getTodayKey()] ?? [];
    return new Set(todayIds);
  } catch {
    return new Set();
  }
}

function savePlayedSet(set: Set<string>): void {
  const data: Record<string, string[]> = {};
  data[getTodayKey()] = Array.from(set);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function usePlayHistory() {
  const hasPlayedToday = useCallback((id: string): boolean => {
    return getPlayedSet().has(id);
  }, []);

  const markPlayed = useCallback((id: string): void => {
    const set = getPlayedSet();
    set.add(id);
    savePlayedSet(set);
  }, []);

  const filterUnplayed = useCallback((ids: string[]): string[] => {
    const set = getPlayedSet();
    return ids.filter((id) => !set.has(id));
  }, []);

  return { hasPlayedToday, markPlayed, filterUnplayed };
}
