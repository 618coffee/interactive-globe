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
    expect(d.marker.highlight).toBe('#befaff');
    expect(d.marker.core).toBe('#dcfaff');
    expect(d.marker.blending).toBe('additive');
  });

  it('light preset uses a near-white sky and hides additive glow', () => {
    const l = resolveTheme('light');
    expect(l.background).toBe(0xf9fafb);
    expect(l.showStars).toBe(false);
    expect(l.showAtmosphere).toBe(false);
    expect(l.showAurora).toBe(false);
    expect(l.marker.color).toBe('#a67c52');
    expect(l.marker.highlight).toBe('#c89a6a');
    expect(l.marker.core).toBe('#efe2d2');
    expect(l.marker.blending).toBe('normal');
  });
});

describe('resolveTheme color overrides', () => {
  it('returns the base preset unchanged when no overrides are given', () => {
    expect(resolveTheme('light', undefined)).toEqual(resolveTheme('light'));
    expect(resolveTheme('light', {})).toEqual(resolveTheme('light'));
  });

  it('overrides only the background, keeping every other field', () => {
    const l = resolveTheme('light', { background: '#f4efe7' });
    expect(l.background).toBe('#f4efe7');
    // semantic + marker fields stay from the light preset
    expect(l.showStars).toBe(false);
    expect(l.showAtmosphere).toBe(false);
    expect(l.showAurora).toBe(false);
    expect(l.marker.color).toBe('#a67c52');
    expect(l.marker.blending).toBe('normal');
  });

  it('merges marker color overrides onto the preset marker, preserving blending', () => {
    const l = resolveTheme('light', { marker: { color: '#3a2c1e' } });
    expect(l.marker.color).toBe('#3a2c1e');
    // un-overridden marker fields and blending are inherited
    expect(l.marker.highlight).toBe('#c89a6a');
    expect(l.marker.core).toBe('#efe2d2');
    expect(l.marker.blending).toBe('normal');
    // background untouched
    expect(l.background).toBe(0xf9fafb);
  });

  it('accepts overrides on the dark theme too and does not mutate the shared preset', () => {
    const d = resolveTheme('dark', { background: '#101820' });
    expect(d.background).toBe('#101820');
    expect(d.marker.blending).toBe('additive');
    // the shared dark preset is not mutated by the override call
    expect(resolveTheme('dark').background).toBe(0x000208);
  });
});

