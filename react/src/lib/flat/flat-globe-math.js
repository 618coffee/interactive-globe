import { geoDistance } from 'd3-geo';

// Pure, WebGL-free math for the flat geoOrthographic globe mode. Mirrors the
// style of theme.js / graticule.js (framework-agnostic + unit-tested). The
// d3-geo import keeps this module in the lazily-loaded flat chunk, so webgl-only
// consumers never download it.

/** @typedef {[number, number]} Rotation `[lambda, phi]` in degrees (lon, lat). */

/**
 * `geoOrthographic().rotate(...)` value that centres a city on the visible disc.
 * The projection centre is `[-rotate[0], -rotate[1]]`, so we negate. Roll = 0.
 * @param {number} lat @param {number} lon @returns {Rotation}
 */
export function rotationForCity(lat, lon) {
  return [-lon, -lat];
}

/** Standard ease-in-out cubic on `[0, 1]`. */
export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Normalise a longitude into `(-180, 180]`. */
export function wrapLongitude(lon) {
  let x = ((((lon + 180) % 360) + 360) % 360) - 180;
  if (x === -180) x = 180;
  return x;
}

/** Signed shortest angular step (deg) from `from` to `to`, across the ±180° seam. */
export function shortestLonDelta(from, to) {
  return wrapLongitude(to - from);
}

/**
 * Interpolate a rotation: longitude eases the short way across the seam,
 * latitude linearly. `t` expected in `[0, 1]` (not clamped).
 * @param {Rotation} from @param {Rotation} to @param {number} t @returns {Rotation}
 */
export function lerpRotation(from, to, t) {
  const lon = wrapLongitude(from[0] + shortestLonDelta(from[0], to[0]) * t);
  const lat = from[1] + (to[1] - from[1]) * t;
  return [lon, lat];
}

/** Advance a longitude by `degPerSec` over `dtMs`, wrapped into `(-180, 180]`. */
export function spinLongitude(lon, dtMs, degPerSec) {
  return wrapLongitude(lon + (degPerSec * dtMs) / 1000);
}

/**
 * Whether `[lon, lat]` is on the near (visible) hemisphere at `rotation`.
 * The projection centre is `[-lambda, -phi]`; visible when the great-circle
 * distance from the centre is under 90°.
 * @param {number} lon @param {number} lat @param {Rotation} rotation
 */
export function isPointVisible(lon, lat, rotation) {
  const center = [-rotation[0], -rotation[1]];
  return geoDistance([lon, lat], center) < Math.PI / 2;
}

/**
 * Globe radius in px for a container, as `min(wRatio·w, hRatio·h)`. Shared by
 * both modes (flat = projection scale; webgl = camera distance) so they match.
 * @param {number} w @param {number} h @param {number} [wRatio] @param {number} [hRatio]
 */
export function fitRadiusPx(w, h, wRatio = 0.42, hRatio = 0.58) {
  return Math.min(wRatio * w, hRatio * h);
}
