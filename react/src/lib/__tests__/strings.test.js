import { describe, it, expect } from 'vitest';
import {
  STRINGS,
  resolveStrings,
  resolveControls,
  resolveInfoCard,
  resolvePanels,
  DEFAULT_CONTROLS,
  DEFAULT_INFO_CARD,
} from '../strings.js';

describe('strings module', () => {
  describe('STRINGS bundles', () => {
    it('ships both zh and en bundles', () => {
      expect(STRINGS.zh).toBeTruthy();
      expect(STRINGS.en).toBeTruthy();
    });

    it('en and zh expose the same keys', () => {
      expect(Object.keys(STRINGS.en).sort()).toEqual(Object.keys(STRINGS.zh).sort());
    });

    it('zh values are Chinese (sanity check on a few)', () => {
      expect(STRINGS.zh.reset).toBe('重置');
      expect(STRINGS.zh.autoRotate).toBe('自转');
      expect(STRINGS.zh.clouds).toBe('云层');
      expect(STRINGS.zh.aurora).toBe('极光');
    });

    it('en values are English (sanity check on a few)', () => {
      expect(STRINGS.en.reset).toBe('Reset');
      expect(STRINGS.en.autoRotate).toBe('Auto-rotate');
      expect(STRINGS.en.clouds).toBe('Clouds');
      expect(STRINGS.en.aurora).toBe('Aurora');
    });
  });

  describe('resolveStrings', () => {
    it('returns the zh bundle by default', () => {
      expect(resolveStrings()).toEqual(STRINGS.zh);
    });

    it('returns the en bundle when language="en"', () => {
      expect(resolveStrings('en')).toEqual(STRINGS.en);
    });

    it('falls back to zh for unknown languages', () => {
      expect(resolveStrings('jp')).toEqual(STRINGS.zh);
    });

    it('layers overrides on top of the bundle', () => {
      const result = resolveStrings('en', { reset: 'Recenter', title: 'My Globe' });
      expect(result.reset).toBe('Recenter');
      expect(result.title).toBe('My Globe');
      // untouched keys come from en
      expect(result.clouds).toBe(STRINGS.en.clouds);
    });

    it('preserves empty-string overrides (icon-only intent)', () => {
      const result = resolveStrings('zh', { reset: '', zoomIn: '' });
      expect(result.reset).toBe('');
      expect(result.zoomIn).toBe('');
      // others stay from zh
      expect(result.autoRotate).toBe(STRINGS.zh.autoRotate);
    });
  });

  describe('resolveControls', () => {
    it('returns all-true by default', () => {
      expect(resolveControls()).toEqual(DEFAULT_CONTROLS);
    });

    it('layers overrides on top of all-true defaults', () => {
      const result = resolveControls({ atmosphere: false, clouds: false });
      expect(result.atmosphere).toBe(false);
      expect(result.clouds).toBe(false);
      expect(result.reset).toBe(true);
      expect(result.autoRotate).toBe(true);
    });

    it('controls.zoom is a convenience that toggles both zoomIn and zoomOut', () => {
      const result = resolveControls({ zoom: false });
      expect(result.zoomIn).toBe(false);
      expect(result.zoomOut).toBe(false);
      // unrelated keys untouched
      expect(result.reset).toBe(true);
      expect(result.autoRotate).toBe(true);
    });

    it('explicit zoomIn / zoomOut win over controls.zoom (more specific wins)', () => {
      const result = resolveControls({ zoom: false, zoomIn: true });
      expect(result.zoomIn).toBe(true);   // explicit override
      expect(result.zoomOut).toBe(false); // inherited from zoom
    });
  });

  describe('resolveInfoCard', () => {
    it('returns all-true by default', () => {
      expect(resolveInfoCard()).toEqual(DEFAULT_INFO_CARD);
    });

    it('layers overrides on top of all-true defaults', () => {
      const result = resolveInfoCard({ lat: false, lon: false });
      expect(result.lat).toBe(false);
      expect(result.lon).toBe(false);
      expect(result.view).toBe(true);
      expect(result.distance).toBe(true);
      expect(result.hint).toBe(true);
    });
  });

  describe('resolvePanels', () => {
    it('full preset shows everything', () => {
      expect(resolvePanels('full')).toEqual({ title: true, info: true, bottomBar: true });
    });

    it('minimal preset shows only the bottom bar', () => {
      expect(resolvePanels('minimal')).toEqual({ title: false, info: false, bottomBar: true });
    });

    it('none preset hides everything', () => {
      expect(resolvePanels('none')).toEqual({ title: false, info: false, bottomBar: false });
    });

    it('panels prop overrides individual keys from the preset', () => {
      // full preset + override info=false => title and bottomBar still on
      expect(resolvePanels('full', { info: false }))
        .toEqual({ title: true, info: false, bottomBar: true });
    });

    it('panels prop can also turn entries back on', () => {
      // minimal preset + override title=true => title and bottomBar on, info off
      expect(resolvePanels('minimal', { title: true }))
        .toEqual({ title: true, info: false, bottomBar: true });
    });

    it('defaults to full preset when ui is undefined', () => {
      expect(resolvePanels()).toEqual({ title: true, info: true, bottomBar: true });
    });
  });
});
