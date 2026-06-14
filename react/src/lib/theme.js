// Theme presets for the globe scene. A "theme" bundles every render choice
// that has to change together between the dark "space" look and a light look:
// sky color, which additive-blended layers are visible (they wash out on a
// light background), and the marker color/blending. Kept as a pure resolver
// (like strings.js) so it is unit-testable without WebGL.
//
// Colors are intentionally minimal — the package ships ONE preset per theme and
// lets callers pass exact colors via the `overrides` argument (the `themeColors`
// prop on <InteractiveGlobe>), so it never accumulates a catalog of styles.

const PRESETS = {
  dark: {
    background: 0x000208,
    showStars: true,
    showAtmosphere: true,
    showAurora: true,
    marker: { color: '#8cebff', highlight: '#befaff', core: '#dcfaff', blending: 'additive' },
  },
  light: {
    background: 0xf9fafb,
    showStars: false,
    showAtmosphere: false,
    showAurora: false,
    marker: { color: '#a67c52', highlight: '#c89a6a', core: '#efe2d2', blending: 'normal' },
  },
};

/**
 * Resolve a theme name to its render preset, optionally merging caller-provided
 * color overrides on top. Unknown / missing theme -> dark.
 *
 * @param {'light'|'dark'} [theme]
 * @param {{ background?: number|string,
 *           marker?: { color?: string, highlight?: string, core?: string } }} [overrides]
 *   Color-only overrides. `background` accepts a CSS string or 0xRRGGBB int.
 *   `marker` is merged onto the preset marker; `blending` stays theme-driven.
 *   Semantic fields (showStars/showAtmosphere/showAurora) are not overridable —
 *   they are tied to the theme, not to a color.
 * @returns the resolved preset. Returns the shared preset object unchanged when
 *   there are no overrides (so existing callers and equality checks are stable);
 *   returns a fresh merged object when overrides are applied.
 */
export function resolveTheme(theme, overrides) {
  const base = PRESETS[theme] || PRESETS.dark;
  if (!overrides) return base;
  const { background, marker } = overrides;
  if (background === undefined && marker === undefined) return base;
  return {
    ...base,
    ...(background !== undefined ? { background } : null),
    marker: marker ? { ...base.marker, ...marker } : base.marker,
  };
}

