import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProximityAlert } from '../useProximityAlert';
import type { Attraction } from '../../types';

const mockAttraction: Attraction = {
  id: 'gugong-taihedian',
  name: '太和殿',
  areaId: 'gugong',
  location: [116.397, 39.916],
  radius: 40,
  image: '',
  segments: [{ text: '太和殿讲解' }],
};

const otherAttraction: Attraction = {
  id: 'gugong-wumen',
  name: '午门',
  areaId: 'gugong',
  location: [116.397, 39.915],
  radius: 30,
  image: '',
  segments: [{ text: '午门讲解' }],
};

beforeEach(() => {
  localStorage.clear();
  // mock vibrate
  vi.stubGlobal('navigator', { ...navigator, vibrate: vi.fn() });
});

describe('useProximityAlert', () => {
  it('starts in idle state with no target', () => {
    const onPlay = vi.fn();
    const { result } = renderHook(() =>
      useProximityAlert({ nearestUnplayed: null, onPlay }),
    );
    expect(result.current.status).toBe('idle');
    expect(result.current.target).toBeNull();
  });

  it('transitions to alerting when nearestUnplayed appears', () => {
    const onPlay = vi.fn();
    const { result, rerender } = renderHook(
      ({ nearestUnplayed }) => useProximityAlert({ nearestUnplayed, onPlay }),
      { initialProps: { nearestUnplayed: null as Attraction | null } },
    );

    rerender({ nearestUnplayed: mockAttraction });

    expect(result.current.status).toBe('alerting');
    expect(result.current.target).toBe(mockAttraction);
    expect(navigator.vibrate).toHaveBeenCalledWith(200);
  });

  it('dismiss sets status to dismissed and records alert', () => {
    const onPlay = vi.fn();
    const { result, rerender } = renderHook(
      ({ nearestUnplayed }) => useProximityAlert({ nearestUnplayed, onPlay }),
      { initialProps: { nearestUnplayed: null as Attraction | null } },
    );

    rerender({ nearestUnplayed: mockAttraction });
    act(() => result.current.dismiss());

    expect(result.current.status).toBe('dismissed');

    // verify localStorage record (recorded immediately by the effect on alert)
    const raw = localStorage.getItem('tour-guide-alerts');
    const data = JSON.parse(raw!);
    const today = new Date().toISOString().slice(0, 10);
    expect(data[today]).toContain('gugong-taihedian');
  });

  it('does not re-alert for the same target after dismiss (stays dismissed)', () => {
    const onPlay = vi.fn();
    const { result, rerender } = renderHook(
      ({ nearestUnplayed }) => useProximityAlert({ nearestUnplayed, onPlay }),
      { initialProps: { nearestUnplayed: null as Attraction | null } },
    );

    rerender({ nearestUnplayed: mockAttraction });
    act(() => result.current.dismiss());

    // rerender with same nearestUnplayed should stay dismissed
    rerender({ nearestUnplayed: mockAttraction });
    expect(result.current.status).toBe('dismissed');
  });

  it('resets to idle when nearestUnplayed becomes null after alerting', () => {
    const onPlay = vi.fn();
    const { result, rerender } = renderHook(
      ({ nearestUnplayed }) => useProximityAlert({ nearestUnplayed, onPlay }),
      { initialProps: { nearestUnplayed: null as Attraction | null } },
    );

    rerender({ nearestUnplayed: mockAttraction });
    expect(result.current.status).toBe('alerting');

    rerender({ nearestUnplayed: null });
    expect(result.current.status).toBe('idle');
    expect(result.current.target).toBeNull();
  });

  it('alerts for a new attraction after dismiss of previous', () => {
    const onPlay = vi.fn();
    const { result, rerender } = renderHook(
      ({ nearestUnplayed }) => useProximityAlert({ nearestUnplayed, onPlay }),
      { initialProps: { nearestUnplayed: null as Attraction | null } },
    );

    // alert for first
    rerender({ nearestUnplayed: mockAttraction });
    act(() => result.current.dismiss());

    // switch to other
    rerender({ nearestUnplayed: otherAttraction });
    expect(result.current.status).toBe('alerting');
    expect(result.current.target).toBe(otherAttraction);
  });

  it('markTriggered records alert and calls onPlay', () => {
    const onPlay = vi.fn();
    const { result, rerender } = renderHook(
      ({ nearestUnplayed }) => useProximityAlert({ nearestUnplayed, onPlay }),
      { initialProps: { nearestUnplayed: null as Attraction | null } },
    );

    rerender({ nearestUnplayed: mockAttraction });
    act(() => result.current.markTriggered());

    expect(onPlay).toHaveBeenCalledWith(mockAttraction);
    expect(result.current.status).toBe('idle');

    // verify localStorage record (recorded immediately by the effect on alert)
    const raw = localStorage.getItem('tour-guide-alerts');
    const data = JSON.parse(raw!);
    const today = new Date().toISOString().slice(0, 10);
    expect(data[today]).toContain('gugong-taihedian');
  });

  it('does not re-alert for an attraction already triggered today', () => {
    // pre-set localStorage
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(
      'tour-guide-alerts',
      JSON.stringify({ [today]: ['gugong-taihedian'] }),
    );

    const onPlay = vi.fn();
    const { result } = renderHook(
      ({ nearestUnplayed }) => useProximityAlert({ nearestUnplayed, onPlay }),
      { initialProps: { nearestUnplayed: mockAttraction as Attraction | null } },
    );

    expect(result.current.status).toBe('idle');
  });

  it('does not re-alert after leave and return (alert recorded immediately on entry)', () => {
    const onPlay = vi.fn();
    const { result, rerender } = renderHook(
      ({ nearestUnplayed }) => useProximityAlert({ nearestUnplayed, onPlay }),
      { initialProps: { nearestUnplayed: null as Attraction | null } },
    );

    // Enter proximity → alert fires, recordAlert called immediately in effect
    rerender({ nearestUnplayed: mockAttraction });
    expect(result.current.status).toBe('alerting');

    // Verify localStorage record was created without user interaction
    const raw = localStorage.getItem('tour-guide-alerts');
    const data = JSON.parse(raw!);
    const today = new Date().toISOString().slice(0, 10);
    expect(data[today]).toContain('gugong-taihedian');

    // User leaves (nearestUnplayed becomes null)
    rerender({ nearestUnplayed: null });
    expect(result.current.status).toBe('idle');

    // User returns to same attraction — should NOT re-alert
    rerender({ nearestUnplayed: mockAttraction });
    expect(result.current.status).toBe('idle');
  });

  it('dismiss is no-op when target is null', () => {
    const onPlay = vi.fn();
    const { result } = renderHook(() =>
      useProximityAlert({ nearestUnplayed: null, onPlay }),
    );
    act(() => result.current.dismiss());
    expect(result.current.status).toBe('idle');
  });

  it('markTriggered is no-op when target is null', () => {
    const onPlay = vi.fn();
    const { result } = renderHook(() =>
      useProximityAlert({ nearestUnplayed: null, onPlay }),
    );
    act(() => result.current.markTriggered());
    expect(result.current.status).toBe('idle');
    expect(onPlay).not.toHaveBeenCalled();
  });
});
