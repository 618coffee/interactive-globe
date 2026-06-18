// Pure, framework-free camera-path math (no THREE), so it can be unit-tested
// without a WebGL context. Used by GlobeScene's flyTo tween.

/**
 * Interpolate from `start` to `end` (each `{x,y,z}`) by spherically interpolating
 * the DIRECTION and linearly interpolating the RADIUS. Equal-radius endpoints
 * therefore stay at a constant radius for every `t` — a pure rotation, with none
 * of the inward "chord dip" (apparent zoom-in) a straight `lerp` produces.
 * Returns a plain `{x,y,z}`.
 * @param {{x:number,y:number,z:number}} start
 * @param {{x:number,y:number,z:number}} end
 * @param {number} t
 */
export function slerpPosition(start, end, t) {
  const rs = Math.hypot(start.x, start.y, start.z) || 1;
  const re = Math.hypot(end.x, end.y, end.z) || 1;
  const ux = start.x / rs, uy = start.y / rs, uz = start.z / rs;
  const vx = end.x / re,   vy = end.y / re,   vz = end.z / re;
  let dot = ux * vx + uy * vy + uz * vz;
  dot = Math.max(-1, Math.min(1, dot));
  const omega = Math.acos(dot);
  const r = rs + (re - rs) * t;
  let dx, dy, dz;
  if (omega < 1e-4) {
    // Nearly colinear: a normalized linear blend avoids dividing by sin(0).
    dx = ux + (vx - ux) * t;
    dy = uy + (vy - uy) * t;
    dz = uz + (vz - uz) * t;
    const l = Math.hypot(dx, dy, dz) || 1;
    dx /= l; dy /= l; dz /= l;
  } else {
    const sin = Math.sin(omega);
    const wa = Math.sin((1 - t) * omega) / sin;
    const wb = Math.sin(t * omega) / sin;
    dx = ux * wa + vx * wb;
    dy = uy * wa + vy * wb;
    dz = uz * wa + vz * wb;
  }
  return { x: dx * r, y: dy * r, z: dz * r };
}
