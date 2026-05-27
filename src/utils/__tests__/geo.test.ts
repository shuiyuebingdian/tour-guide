import { describe, it, expect } from 'vitest';
import { haversineDistance, isNearby, sortByDistance, wgs84ToGcj02 } from '../geo';
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
    const attraction = { location: [116.397, 39.915] as number[], radius: 50 };
    expect(isNearby([116.397, 39.9151], attraction)).toBe(true);
  });

  it('returns false when outside radius', () => {
    const attraction = { location: [116.397, 39.915] as number[], radius: 50 };
    expect(isNearby([116.397, 39.920], attraction)).toBe(false);
  });

  it('uses triggerDistance override when provided', () => {
    const attraction = { location: [116.397, 39.915] as number[], radius: 10 };
    // Outside attraction radius but within trigger distance
    expect(isNearby([116.397, 39.9151], attraction, 200)).toBe(true);
  });

  it('treats outside triggerDistance as not nearby', () => {
    const attraction = { location: [116.397, 39.915] as number[], radius: 100 };
    // Inside attraction radius but outside trigger distance
    expect(isNearby([116.397, 39.9151], attraction, 1)).toBe(false);
  });
});

describe('wgs84ToGcj02', () => {
  it('returns different coords for a Beijing location', () => {
    const [lng, lat] = wgs84ToGcj02([116.397, 39.916]);
    // GCJ-02 should shift the point in China
    expect(lng).not.toBe(116.397);
    expect(lat).not.toBe(39.916);
  });

  it('shifts Beijing east and north (GCJ-02 offset)', () => {
    const [lng, lat] = wgs84ToGcj02([116.397, 39.916]);
    // GCJ-02 offset for Beijing is roughly +0.006° lng, +0.004° lat
    expect(lng).toBeGreaterThan(116.397);
    expect(lat).toBeGreaterThan(39.916);
  });

  it('returns unchanged coords for locations outside China', () => {
    // Tokyo
    const [lng, lat] = wgs84ToGcj02([139.6917, 35.6895]);
    expect(lng).toBe(139.6917);
    expect(lat).toBe(35.6895);
  });

  it('is deterministic', () => {
    const a = wgs84ToGcj02([116.397, 39.916]);
    const b = wgs84ToGcj02([116.397, 39.916]);
    expect(a[0]).toBe(b[0]);
    expect(a[1]).toBe(b[1]);
  });
});

describe('sortByDistance', () => {
  it('sorts attractions by distance ascending', () => {
    const current: number[] = [116.397, 39.915];
    const items = [
      { id: 'far', location: [116.397, 39.920], radius: 30 } as unknown as Attraction,
      { id: 'near', location: [116.397, 39.9151], radius: 30 } as unknown as Attraction,
    ];
    const sorted = sortByDistance(current, items);
    expect(sorted[0].id).toBe('near');
    expect(sorted[1].id).toBe('far');
  });
});
