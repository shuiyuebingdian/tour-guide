import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRatePreference } from '../useRatePreference';

describe('useRatePreference', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default rate of 1.0 when nothing stored', () => {
    const { result } = renderHook(() => useRatePreference());
    expect(result.current[0]).toBe(1.0);
  });

  it('loads previously stored rate from localStorage', () => {
    localStorage.setItem('speech-rate', '1.5');
    const { result } = renderHook(() => useRatePreference());
    expect(result.current[0]).toBe(1.5);
  });

  it('saves rate to localStorage on change', () => {
    const { result } = renderHook(() => useRatePreference());
    act(() => result.current[1](0.8));
    expect(result.current[0]).toBe(0.8);
    expect(localStorage.getItem('speech-rate')).toBe('0.8');
  });

  it('clamps out-of-range stored values to default', () => {
    localStorage.setItem('speech-rate', '3.0');
    const { result } = renderHook(() => useRatePreference());
    expect(result.current[0]).toBe(1.0);
  });
});
