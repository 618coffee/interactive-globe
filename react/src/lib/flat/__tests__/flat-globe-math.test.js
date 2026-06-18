import { describe, it, expect } from 'vitest';
import {
  easeInOutCubic,
  fitRadiusPx,
  isPointVisible,
  lerpRotation,
  rotationForCity,
  shortestLonDelta,
  spinLongitude,
  wrapLongitude,
} from '../flat-globe-math.js';

describe('rotationForCity', () => {
  it('centres a city by negating its lon/lat', () => {
    expect(rotationForCity(40, 116)).toEqual([-116, -40]);
    expect(rotationForCity(-33.9, 151.2)).toEqual([-151.2, 33.9]);
  });
});

describe('easeInOutCubic', () => {
  it('pins the endpoints and the midpoint', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 6);
  });
});

describe('wrapLongitude', () => {
  it('keeps values inside (-180, 180]', () => {
    expect(wrapLongitude(0)).toBe(0);
    expect(wrapLongitude(190)).toBe(-170);
    expect(wrapLongitude(-190)).toBe(170);
    expect(wrapLongitude(540)).toBe(180);
  });
});

describe('shortestLonDelta', () => {
  it('takes the short way around the ±180° seam', () => {
    expect(shortestLonDelta(170, -170)).toBe(20);
    expect(shortestLonDelta(-170, 170)).toBe(-20);
  });
  it('matches plain difference away from the seam', () => {
    expect(shortestLonDelta(0, 90)).toBe(90);
    expect(shortestLonDelta(0, -90)).toBe(-90);
  });
});

describe('lerpRotation', () => {
  it('interpolates latitude linearly', () => {
    expect(lerpRotation([0, 0], [0, 40], 0.5)).toEqual([0, 20]);
  });
  it('interpolates longitude along the shortest path', () => {
    const [lon, lat] = lerpRotation([170, 0], [-170, 0], 0.5);
    expect(lon).toBeCloseTo(180, 6);
    expect(lat).toBe(0);
  });
  it('returns the endpoints at t=0 and t=1', () => {
    expect(lerpRotation([10, -5], [80, 30], 0)).toEqual([10, -5]);
    const end = lerpRotation([10, -5], [80, 30], 1);
    expect(end[0]).toBeCloseTo(80, 6);
    expect(end[1]).toBeCloseTo(30, 6);
  });
});

describe('spinLongitude', () => {
  it('advances by degPerSec scaled to elapsed time', () => {
    expect(spinLongitude(0, 500, 20)).toBeCloseTo(10, 6);
  });
  it('wraps across the seam', () => {
    expect(spinLongitude(170, 1000, 20)).toBeCloseTo(-170, 6);
  });
});

describe('isPointVisible', () => {
  it('the point under the projection centre is visible', () => {
    expect(isPointVisible(0, 0, [0, 0])).toBe(true);
  });
  it('the antipode of the centre is hidden', () => {
    expect(isPointVisible(180, 0, [0, 0])).toBe(false);
  });
  it('respects the rotation when deciding the visible hemisphere', () => {
    const rot = rotationForCity(40, 116);
    expect(isPointVisible(116, 40, rot)).toBe(true);
    expect(isPointVisible(116 - 180, -40, rot)).toBe(false);
  });
});

describe('fitRadiusPx', () => {
  it('takes the smaller of the width/height fractions', () => {
    // wide: width is not the limit, height is
    expect(fitRadiusPx(2000, 1000)).toBe(580); // min(0.42*2000=840, 0.58*1000=580)
    // tall/narrow: width limits
    expect(fitRadiusPx(400, 1000)).toBe(168); // min(0.42*400=168, 0.58*1000=580)
  });
  it('honours custom ratios', () => {
    expect(fitRadiusPx(1000, 1000, 0.5, 0.5)).toBe(500);
  });
});
