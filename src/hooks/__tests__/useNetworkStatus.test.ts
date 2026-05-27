import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNetworkStatus } from '../useNetworkStatus';

describe('useNetworkStatus', () => {
  let onlineSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onlineSpy = vi.fn(() => true);
    Object.defineProperty(navigator, 'onLine', {
      get: onlineSpy,
      configurable: true,
    });
  });

  it('returns isOnline=true when navigator.onLine is true', () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(false);
  });

  it('returns isOnline=false when navigator.onLine is false', () => {
    onlineSpy.mockReturnValue(false);
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(false);
  });

  it('sets wasOffline=true after recovering from offline', () => {
    onlineSpy.mockReturnValue(false);
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(false);
    expect(result.current.wasOffline).toBe(false);

    // Simulate going back online
    onlineSpy.mockReturnValue(true);
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(true);
  });

  it('waits to skip initial offline state on mount', () => {
    onlineSpy.mockReturnValue(false);
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.wasOffline).toBe(false);
  });
});
