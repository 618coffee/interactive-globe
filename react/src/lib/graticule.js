// Pure resolver for the lat/lon graticule overlay config. Kept WebGL-free and
// unit-testable, mirroring theme.js. Defaults to OFF so existing consumers that
// pass no `graticule` prop see zero change.

export const GRATICULE_DEFAULTS = Object.freeze({
  show: false,
  spacing: 15,     // degrees between grid lines
  color: '#6b5238', // warm sepia line ink
  opacity: 0.28,
});

/**
 * Resolve caller graticule overrides onto the defaults.
 * Returns the shared frozen defaults object (stable identity) when there are no
 * overrides; a fresh merged object otherwise. Uses `??` so explicit `0`/`false`
 * are respected.
 * @param {{ show?: boolean, spacing?: number, color?: string, opacity?: number }} [overrides]
 */
export function resolveGraticule(overrides) {
  if (!overrides) return GRATICULE_DEFAULTS;
  return {
    show:    overrides.show    ?? GRATICULE_DEFAULTS.show,
    spacing: overrides.spacing ?? GRATICULE_DEFAULTS.spacing,
    color:   overrides.color   ?? GRATICULE_DEFAULTS.color,
    opacity: overrides.opacity ?? GRATICULE_DEFAULTS.opacity,
  };
}
