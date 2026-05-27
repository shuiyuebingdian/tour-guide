import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProximityAlert, clearAlertHistory } from '../useProximityAlert';
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

const thirdAttraction: Attraction = {
  id: 'gugong-zhonghedian',
  name: '中和殿',
  areaId: 'gugong',
  location: [116.3975, 39.9165],
  radius: 25,
  image: '',
  segments: [{ text: '中和殿讲解' }],
};

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('navigator', { ...navigator, vibrate: vi.fn() });
});

describe('useProximityAlert', () => {
  it('starts in idle state with empty list', () => {
    const onPlay = vi.fn();
    const { result } = renderHook(() =>
      useProximityAlert({ unplayedNearby: [], onPlay }),
    );
    expect(result.current.status).toBe('idle');
    expect(result.current.target).toBeNull();
  });

  it('transitions to alerting when unplayed nearby appears', () => {
    const onPlay = vi.fn();
    const { result, rerender } = renderHook(
      ({ unplayedNearby }) => useProximityAlert({ unplayedNearby, onPlay }),
      { initialProps: { unplayedNearby: [] as Attraction[] } },
    );

    rerender({ unplayedNearby: [mockAttraction] });

    expect(result.current.status).toBe('alerting');
    expect(result.current.target).toBe(mockAttraction);
    expect(navigator.vibrate).toHaveBeenCalledWith(200);
  });

  it('dismiss sets status to dismissed and records alert', () => {
    const onPlay = vi.fn();
    const { result, rerender } = renderHook(
      ({ unplayedNearby }) => useProximityAlert({ unplayedNearby, onPlay }),
      { initialProps: { unplayedNearby: [] as Attraction[] } },
    );

    rerender({ unplayedNearby: [mockAttraction, otherAttraction] });
    act(() => result.current.dismiss());

    // After dismissing first, second becomes active
    expect(result.current.status).toBe('alerting');
    expect(result.current.target).toBe(otherAttraction);

    const raw = localStorage.getItem('tour-guide-alerts');
    const data = JSON.parse(raw!);
    const today = new Date().toISOString().slice(0, 10);
    expect(data[today]).toContain('gugong-taihedian');
  });

  it('auto-advances to next candidate after dismissing first', () => {
    const onPlay = vi.fn();
    const { result } = renderHook(
      ({ unplayedNearby }) => useProximityAlert({ unplayedNearby, onPlay }),
      { initialProps: { unplayedNearby: [mockAttraction, otherAttraction] as Attraction[] } },
    );

    // First attraction alerts
    expect(result.current.status).toBe('alerting');
    expect(result.current.target).toBe(mockAttraction);

    act(() => result.current.dismiss());

    // Should auto-advance to second attraction
    expect(result.current.status).toBe('alerting');
    expect(result.current.target).toBe(otherAttraction);
  });

  it('advances through chain of dismissals to third candidate', () => {
    const onPlay = vi.fn();
    const list = [mockAttraction, otherAttraction, thirdAttraction];
    const { result, rerender } = renderHook(
      ({ unplayedNearby }) => useProximityAlert({ unplayedNearby, onPlay }),
      { initialProps: { unplayedNearby: [] as Attraction[] } },
    );

    rerender({ unplayedNearby: list });

    expect(result.current.status).toBe('alerting');
    expect(result.current.target).toBe(mockAttraction);
    act(() => result.current.dismiss());

    expect(result.current.status).toBe('alerting');
    expect(result.current.target).toBe(otherAttraction);
    act(() => result.current.dismiss());

    expect(result.current.status).toBe('alerting');
    expect(result.current.target).toBe(thirdAttraction);
  });

  it('goes idle when all candidates dismissed', () => {
    const onPlay = vi.fn();
    const { result, rerender } = renderHook(
      ({ unplayedNearby }) => useProximityAlert({ unplayedNearby, onPlay }),
      { initialProps: { unplayedNearby: [] as Attraction[] } },
    );

    rerender({ unplayedNearby: [mockAttraction] });
    expect(result.current.status).toBe('alerting');

    // No more candidates → goes idle
    rerender({ unplayedNearby: [] });
    expect(result.current.status).toBe('idle');
    expect(result.current.target).toBeNull();
  });

  it('resets to idle when list becomes empty', () => {
    const onPlay = vi.fn();
    const { result, rerender } = renderHook(
      ({ unplayedNearby }) => useProximityAlert({ unplayedNearby, onPlay }),
      { initialProps: { unplayedNearby: [mockAttraction] as Attraction[] } },
    );

    expect(result.current.status).toBe('alerting');

    rerender({ unplayedNearby: [] });
    expect(result.current.status).toBe('idle');
    expect(result.current.target).toBeNull();
  });

  it('markTriggered records alert and calls onPlay', () => {
    const onPlay = vi.fn();
    const { result, rerender } = renderHook(
      ({ unplayedNearby }) => useProximityAlert({ unplayedNearby, onPlay }),
      { initialProps: { unplayedNearby: [] as Attraction[] } },
    );

    rerender({ unplayedNearby: [mockAttraction] });
    act(() => result.current.markTriggered());

    expect(onPlay).toHaveBeenCalledWith(mockAttraction);
    expect(result.current.status).toBe('idle');

    const raw = localStorage.getItem('tour-guide-alerts');
    const data = JSON.parse(raw!);
    const today = new Date().toISOString().slice(0, 10);
    expect(data[today]).toContain('gugong-taihedian');
  });

  it('does not re-alert for an attraction already triggered today', () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(
      'tour-guide-alerts',
      JSON.stringify({ [today]: ['gugong-taihedian'] }),
    );

    const onPlay = vi.fn();
    const { result } = renderHook(() =>
      useProximityAlert({
        unplayedNearby: [mockAttraction],
        onPlay,
      }),
    );

    expect(result.current.status).toBe('idle');
  });

  it('skips already-alerted and picks next in list', () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(
      'tour-guide-alerts',
      JSON.stringify({ [today]: ['gugong-taihedian'] }),
    );

    const onPlay = vi.fn();
    const list = [mockAttraction, otherAttraction];
    const { result } = renderHook(
      ({ unplayedNearby }) => useProximityAlert({ unplayedNearby, onPlay }),
      { initialProps: { unplayedNearby: list } },
    );

    expect(result.current.status).toBe('alerting');
    expect(result.current.target).toBe(otherAttraction);
  });

  it('does not re-alert on return after leaving (alert recorded on entry)', () => {
    const onPlay = vi.fn();
    const { result, rerender } = renderHook(
      ({ unplayedNearby }) => useProximityAlert({ unplayedNearby, onPlay }),
      { initialProps: { unplayedNearby: [] as Attraction[] } },
    );

    rerender({ unplayedNearby: [mockAttraction] });
    expect(result.current.status).toBe('alerting');

    const raw = localStorage.getItem('tour-guide-alerts');
    const data = JSON.parse(raw!);
    const today = new Date().toISOString().slice(0, 10);
    expect(data[today]).toContain('gugong-taihedian');

    // Leave
    rerender({ unplayedNearby: [] });
    expect(result.current.status).toBe('idle');

    // Return — should NOT re-alert
    rerender({ unplayedNearby: [mockAttraction] });
    expect(result.current.status).toBe('idle');
  });

  it('dismiss is no-op when target is null', () => {
    const onPlay = vi.fn();
    const { result } = renderHook(() =>
      useProximityAlert({ unplayedNearby: [], onPlay }),
    );
    act(() => result.current.dismiss());
    expect(result.current.status).toBe('idle');
  });

  it('markTriggered is no-op when target is null', () => {
    const onPlay = vi.fn();
    const { result } = renderHook(() =>
      useProximityAlert({ unplayedNearby: [], onPlay }),
    );
    act(() => result.current.markTriggered());
    expect(result.current.status).toBe('idle');
    expect(onPlay).not.toHaveBeenCalled();
  });

  it('prioritizes overview attractions over individual ones', () => {
    const overview: Attraction = {
      id: 'gugong-overview',
      name: '故宫概览',
      areaId: 'gugong',
      location: [116.397, 39.916],
      radius: 500,
      image: '',
      segments: [{ text: '故宫概览讲解' }],
    };

    const onPlay = vi.fn();
    const list = [mockAttraction, overview]; // individual is closer but overview should win
    const { result } = renderHook(
      ({ unplayedNearby }) => useProximityAlert({ unplayedNearby, onPlay }),
      { initialProps: { unplayedNearby: list } },
    );

    expect(result.current.status).toBe('alerting');
    expect(result.current.target).toBe(overview);
  });

  it('falls through to individual after overview is dismissed', () => {
    const overview: Attraction = {
      id: 'gugong-overview',
      name: '故宫概览',
      areaId: 'gugong',
      location: [116.397, 39.916],
      radius: 500,
      image: '',
      segments: [{ text: '故宫概览讲解' }],
    };

    const onPlay = vi.fn();
    const list = [mockAttraction, overview];
    const { result } = renderHook(
      ({ unplayedNearby }) => useProximityAlert({ unplayedNearby, onPlay }),
      { initialProps: { unplayedNearby: list } },
    );

    expect(result.current.target).toBe(overview);
    act(() => result.current.dismiss());
    expect(result.current.target).toBe(mockAttraction);
  });
});

describe('clearAlertHistory', () => {
  it('removes the alert history key from localStorage', () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(
      'tour-guide-alerts',
      JSON.stringify({ [today]: ['gugong-taihedian'] }),
    );
    clearAlertHistory();
    expect(localStorage.getItem('tour-guide-alerts')).toBeNull();
  });
});
