// Theme presets for the globe scene. A "theme" bundles every render choice
// that has to change together between the dark "space" look and a light look:
// sky color, which additive-blended layers are visible (they wash out on a
// light background), and the marker color/blending. Kept as a pure resolver
// (like strings.js) so it is unit-testable without WebGL.

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

/** Resolve a theme name to its render preset. Unknown / missing -> dark. */
export function resolveTheme(theme) {
  return PRESETS[theme] || PRESETS.dark;
}
