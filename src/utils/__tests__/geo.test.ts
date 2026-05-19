import { describe, it, expect } from 'vitest';
import { haversineDistance, isNearby, sortByDistance } from '../geo';
import type { Attraction } from '../../types';

describe('haversineDistance', () => {
  it('returns 0 for the same point', () => {
    const d = haversineDistance([116.397, 39.916], [116.397, 39.916]);
    expect(d).toBe(0);
  });

  it('calculates distance between two known points (approx)', () => {
    const d = haversineDistance([116.397, 39.915], [116.397, 39.916]);
    expect(d).toBeGreaterThan(100);
    expect(d).toBeLessThan(120);
  });
});

describe('isNearby', () => {
  it('returns true when within radius', () => {
    const attraction = { location: [116.397, 39.915] as [number, number], radius: 50 };
    expect(isNearby([116.397, 39.9151], attraction)).toBe(true);
  });

  it('returns false when outside radius', () => {
    const attraction = { location: [116.397, 39.915] as [number, number], radius: 50 };
    expect(isNearby([116.397, 39.920], attraction)).toBe(false);
  });
});

describe('sortByDistance', () => {
  it('sorts attractions by distance ascending', () => {
    const current: [number, number] = [116.397, 39.915];
    const items = [
      { id: 'far', location: [116.397, 39.920], radius: 30 } as unknown as Attraction,
      { id: 'near', location: [116.397, 39.9151], radius: 30 } as unknown as Attraction,
    ];
    const sorted = sortByDistance(current, items);
    expect(sorted[0].id).toBe('near');
    expect(sorted[1].id).toBe('far');
  });
});
