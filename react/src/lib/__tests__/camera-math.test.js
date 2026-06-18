import { describe, it, expect } from 'vitest';
import { slerpPosition } from '../camera-math.js';

const radius = (p) => Math.hypot(p.x, p.y, p.z);

describe('slerpPosition', () => {
  it('returns the endpoints at t=0 and t=1', () => {
    const a = { x: 2, y: 0, z: 0 };
    const b = { x: 0, y: 0, z: 2 };
    const p0 = slerpPosition(a, b, 0);
    const p1 = slerpPosition(a, b, 1);
    expect(p0.x).toBeCloseTo(2, 6);
    expect(p0.z).toBeCloseTo(0, 6);
    expect(p1.x).toBeCloseTo(0, 6);
    expect(p1.z).toBeCloseTo(2, 6);
  });

  it('keeps a CONSTANT radius for equal-radius endpoints (the no-zoom fix)', () => {
    const a = { x: 2.7, y: 0, z: 0 };
    const b = { x: 0, y: 0, z: 2.7 };
    for (let i = 0; i <= 10; i++) {
      // A straight lerp would dip to ~1.91 at the midpoint; slerp holds 2.7.
      expect(radius(slerpPosition(a, b, i / 10))).toBeCloseTo(2.7, 4);
    }
  });

  it('lerps the radius when the endpoints differ', () => {
    const a = { x: 2, y: 0, z: 0 };
    const b = { x: 0, y: 0, z: 4 };
    expect(radius(slerpPosition(a, b, 0.5))).toBeCloseTo(3, 6); // (2 + 4) / 2
  });

  it('handles a near-zero hop without NaN', () => {
    const a = { x: 2.7, y: 0, z: 0 };
    const b = { x: 2.7 + 1e-9, y: 0, z: 0 };
    const p = slerpPosition(a, b, 0.5);
    expect(Number.isNaN(p.x)).toBe(false);
    expect(Number.isNaN(p.y)).toBe(false);
    expect(Number.isNaN(p.z)).toBe(false);
    expect(radius(p)).toBeCloseTo(2.7, 6);
  });
});
