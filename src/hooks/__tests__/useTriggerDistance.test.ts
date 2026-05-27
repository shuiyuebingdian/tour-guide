import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTriggerDistance } from '../useTriggerDistance';

beforeEach(() => {
  localStorage.clear();
});

describe('useTriggerDistance', () => {
  it('returns default 30m', () => {
    const { result } = renderHook(() => useTriggerDistance());
    expect(result.current[0]).toBe(30);
  });

  it('persists the value to localStorage', () => {
    const { result } = renderHook(() => useTriggerDistance());
    act(() => result.current[1](50));
    expect(result.current[0]).toBe(50);
    expect(localStorage.getItem('tour-guide-trigger-distance')).toBe('50');
  });

  it('clamps value below minimum', () => {
    const { result } = renderHook(() => useTriggerDistance());
    act(() => result.current[1](5));
    expect(result.current[0]).toBe(10);
  });

  it('clamps value above maximum', () => {
    const { result } = renderHook(() => useTriggerDistance());
    act(() => result.current[1](999));
    expect(result.current[0]).toBe(200);
  });

  it('loads saved value from localStorage', () => {
    localStorage.setItem('tour-guide-trigger-distance', '100');
    const { result } = renderHook(() => useTriggerDistance());
    expect(result.current[0]).toBe(100);
  });
});
