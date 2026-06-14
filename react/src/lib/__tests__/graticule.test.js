import { describe, it, expect } from 'vitest';
import { GRATICULE_DEFAULTS, resolveGraticule } from '../graticule.js';

describe('resolveGraticule', () => {
  it('returns the shared defaults object when no overrides (off by default)', () => {
    expect(resolveGraticule()).toBe(GRATICULE_DEFAULTS);
    expect(GRATICULE_DEFAULTS).toEqual({ show: false, spacing: 15, color: '#6b5238', opacity: 0.28 });
  });

  it('merges a partial override onto the defaults', () => {
    expect(resolveGraticule({ show: true })).toEqual({
      show: true, spacing: 15, color: '#6b5238', opacity: 0.28,
    });
  });

  it('takes every field from a full override', () => {
    const full = { show: true, spacing: 10, color: '#123456', opacity: 0.5 };
    expect(resolveGraticule(full)).toEqual(full);
  });

  it('treats explicit zero opacity as a value, not a missing field', () => {
    expect(resolveGraticule({ opacity: 0 }).opacity).toBe(0);
  });
});
