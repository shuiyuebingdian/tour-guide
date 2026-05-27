import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWakeLock } from '../useWakeLock';

function mockWakeLock() {
  const release = vi.fn().mockResolvedValue(undefined);
  const sentinel = { release, addEventListener: vi.fn() };
  const request = vi.fn().mockResolvedValue(sentinel);
  Object.defineProperty(navigator, 'wakeLock', {
    value: { request },
    configurable: true,
    writable: true,
  });
  return { request, sentinel, release };
}

beforeEach(() => {
  localStorage.clear();
  // Remove wakeLock from navigator by default
  Object.defineProperty(navigator, 'wakeLock', {
    value: undefined,
    configurable: true,
    writable: true,
  });
});

describe('useWakeLock', () => {
  it('defaults to disabled', () => {
    const { result } = renderHook(() => useWakeLock());
    expect(result.current[0]).toBe(false);
  });

  it('enables and saves preference', () => {
    mockWakeLock();
    const { result } = renderHook(() => useWakeLock());
    act(() => result.current[1](true));
    expect(result.current[0]).toBe(true);
    expect(localStorage.getItem('tour-guide-wakelock')).toBe('true');
  });

  it('disables and saves preference', () => {
    mockWakeLock();
    const { result } = renderHook(() => useWakeLock());
    act(() => result.current[1](true));
    act(() => result.current[1](false));
    expect(result.current[0]).toBe(false);
    expect(localStorage.getItem('tour-guide-wakelock')).toBe('false');
  });

  it('loads saved preference from localStorage', () => {
    localStorage.setItem('tour-guide-wakelock', 'true');
    mockWakeLock();
    const { result } = renderHook(() => useWakeLock());
    expect(result.current[0]).toBe(true);
  });

  it('requests wake lock on mount when preference is enabled', () => {
    localStorage.setItem('tour-guide-wakelock', 'true');
    const { request } = mockWakeLock();
    renderHook(() => useWakeLock());
    expect(request).toHaveBeenCalledWith('screen');
  });

  it('does not throw when wakeLock is unsupported', () => {
    const { result } = renderHook(() => useWakeLock());
    expect(() => act(() => result.current[1](true))).not.toThrow();
    expect(result.current[0]).toBe(true);
  });
});
