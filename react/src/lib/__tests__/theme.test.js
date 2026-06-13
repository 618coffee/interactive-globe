import { describe, it, expect } from 'vitest';
import { resolveTheme } from '../theme.js';

describe('resolveTheme', () => {
  it('defaults to the dark preset for an unknown / missing theme', () => {
    expect(resolveTheme()).toEqual(resolveTheme('dark'));
    expect(resolveTheme('nope')).toEqual(resolveTheme('dark'));
  });

  it('dark preset preserves the current space look', () => {
    const d = resolveTheme('dark');
    expect(d.background).toBe(0x000208);
    expect(d.showStars).toBe(true);
    expect(d.showAtmosphere).toBe(true);
    expect(d.showAurora).toBe(true);
    expect(d.marker.color).toBe('#8cebff');
    expect(d.marker.blending).toBe('additive');
  });

  it('light preset uses a near-white sky and hides additive glow', () => {
    const l = resolveTheme('light');
    expect(l.background).toBe(0xf9fafb);
    expect(l.showStars).toBe(false);
    expect(l.showAtmosphere).toBe(false);
    expect(l.showAurora).toBe(false);
    expect(l.marker.color).toBe('#a67c52');
    expect(l.marker.blending).toBe('normal');
  });
});
