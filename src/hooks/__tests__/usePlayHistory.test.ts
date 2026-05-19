import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlayHistory } from '../usePlayHistory';

beforeEach(() => {
  localStorage.clear();
});

describe('usePlayHistory', () => {
  it('marks an attraction as played', () => {
    const { result } = renderHook(() => usePlayHistory());
    act(() => result.current.markPlayed('gugong-taihedian'));
    expect(result.current.hasPlayedToday('gugong-taihedian')).toBe(true);
  });

  it('returns false for unplayed attraction', () => {
    const { result } = renderHook(() => usePlayHistory());
    expect(result.current.hasPlayedToday('gugong-wumen')).toBe(false);
  });

  it('filters out played attractions from a list', () => {
    const { result } = renderHook(() => usePlayHistory());
    act(() => result.current.markPlayed('a'));
    const remaining = result.current.filterUnplayed(['a', 'b', 'c']);
    expect(remaining).toEqual(['b', 'c']);
  });
});
