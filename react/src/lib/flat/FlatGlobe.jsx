import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { geoGraticule, geoOrthographic, geoPath } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import countries110m from 'world-atlas/countries-110m.json';
import {
  easeInOutCubic,
  fitRadiusPx,
  isPointVisible,
  lerpRotation,
  rotationForCity,
  spinLongitude,
} from './flat-globe-math.js';

const DEFAULT_SPIN_DEG_PER_SEC = 6;
const DEFAULT_IDLE_TILT_DEG = 12;
const DEFAULT_FLY_MS = 2600;
const INITIAL_LON = -20;

const EASINGS = {
  linear: (t) => t,
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic,
};
function resolveEasing(easing) {
  if (typeof easing === 'function') return easing;
  return EASINGS[easing] || easeInOutCubic;
}

/**
 * Flat `geoOrthographic` SVG globe — the `mode="flat"` renderer. A warm-paper
 * disc with a graticule, world country outlines, and the `pois` as dots (the
 * one most recently {@link flyTo}'d to highlights amber with a label). Idles
 * with a slow auto-spin; `flyTo` eases the rotation to centre a point (pure
 * rotation, never zoom). Lazily imported by InteractiveGlobe so its d3 / world
 * data stay out of webgl-only bundles.
 *
 * Imperative handle: `flyTo(lat, lon, dist?, opts?)`, `reset()`, `getInfo()`.
 */
export const FlatGlobe = forwardRef(function FlatGlobe(props, ref) {
  const {
    pois = [],
    autoRotate = true,
    graticule,
    showLabels = true,
    showMarkers = true,
    fit,
    initialView,
    spinDegPerSec = DEFAULT_SPIN_DEG_PER_SEC,
    idleTiltDeg = DEFAULT_IDLE_TILT_DEG,
    markerSize = 1,
    onLoad,
    onReady,
    className = '',
  } = props;

  const rawId = useId();
  const uid = rawId.replace(/:/g, '');
  const clipId = `ig-flat-clip-${uid}`;
  const glowId = `ig-flat-glow-${uid}`;

  const world = useMemo(() => {
    const topology = countries110m;
    return {
      land: feature(topology, topology.objects.countries),
      borders: mesh(topology, topology.objects.countries),
    };
  }, []);
  const spacing = graticule?.spacing ?? 15;
  const graticuleGeo = useMemo(() => geoGraticule().step([spacing, spacing])(), [spacing]);

  const svgRef = useRef(null);
  const discRef = useRef(null);
  const ringRef = useRef(null);
  const clipRef = useRef(null);
  const graticuleRef = useRef(null);
  const landRef = useRef(null);
  const bordersRef = useRef(null);
  const cityRefs = useRef([]);

  const rotationRef = useRef([INITIAL_LON, -idleTiltDeg]);
  const animRef = useRef(null); // { from, to, start, dur, ease }
  const activeTargetRef = useRef(null); // { lat, lon } of the last flyTo

  // Mirror latest props into refs so the long-lived rAF loop reads them without
  // being torn down on every render.
  const autoRotateRef = useRef(autoRotate);
  const poisRef = useRef(pois);
  const showMarkersRef = useRef(showMarkers);
  const onLoadRef = useRef(onLoad);
  const spinDegPerSecRef = useRef(spinDegPerSec);
  const idleTiltDegRef = useRef(idleTiltDeg);
  useEffect(() => {
    autoRotateRef.current = autoRotate;
    poisRef.current = pois;
    showMarkersRef.current = showMarkers;
    onLoadRef.current = onLoad;
    spinDegPerSecRef.current = spinDegPerSec;
    idleTiltDegRef.current = idleTiltDeg;
  });

  // Imperative handle (stable identity; closes over the refs above).
  const apiRef = useRef(null);
  if (!apiRef.current) {
    apiRef.current = {
      flyTo: (lat, lon, _dist, opts = {}) => {
        animRef.current = {
          from: [...rotationRef.current],
          to: rotationForCity(lat, lon),
          start: performance.now(),
          dur: opts.durationMs ?? DEFAULT_FLY_MS,
          ease: resolveEasing(opts.easing),
        };
        activeTargetRef.current = { lat, lon };
      },
      reset: () => {
        animRef.current = null;
        activeTargetRef.current = null;
        const first = poisRef.current[0];
        rotationRef.current = first
          ? rotationForCity(first.lat, first.lon)
          : [INITIAL_LON, -idleTiltDegRef.current];
      },
      getInfo: () => ({
        lat: -rotationRef.current[1],
        lon: -rotationRef.current[0],
        dist: 2,
        level: 'L2',
      }),
    };
  }
  useImperativeHandle(ref, () => apiRef.current, []);

  // Start centred on `initialView` (cross-mode rotation handoff) when provided,
  // else on the first POI so the idle / reduced-motion view is sensible.
  useEffect(() => {
    if (initialView && Number.isFinite(initialView.lat) && Number.isFinite(initialView.lon)) {
      rotationRef.current = rotationForCity(initialView.lat, initialView.lon);
    } else {
      const first = pois[0];
      if (first) rotationRef.current = rotationForCity(first.lat, first.lon);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Size the projection to the container and run the draw loop. Re-runs only on
  // static inputs; live state flows through the refs above.
  useEffect(() => {
    const svg = svgRef.current;
    const parent = svg?.parentElement;
    if (!svg || !parent) return undefined;

    const projection = geoOrthographic().clipAngle(90);
    const path = geoPath(projection);

    const measure = () => {
      const rect = parent.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      const radius = fitRadiusPx(w, h, fit?.wRatio, fit?.hRatio);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      projection.scale(radius).translate([w / 2, h / 2]);
      const cx = String(w / 2);
      const cy = String(h / 2);
      const r = String(radius);
      for (const c of [discRef.current, clipRef.current, ringRef.current]) {
        if (!c) continue;
        c.setAttribute('cx', cx);
        c.setAttribute('cy', cy);
        c.setAttribute('r', r);
      }
    };

    const sameCity = (poi, target) =>
      target &&
      Math.abs(poi.lat - target.lat) < 1e-6 &&
      Math.abs(poi.lon - target.lon) < 1e-6;

    const drawCities = (rot) => {
      const list = poisRef.current;
      const target = autoRotateRef.current ? null : activeTargetRef.current;
      const markers = showMarkersRef.current;
      for (let i = 0; i < list.length; i++) {
        const g = cityRefs.current[i];
        if (!g) continue;
        const poi = list[i];
        const pt = markers ? projection([poi.lon, poi.lat]) : null;
        const visible = pt != null && isPointVisible(poi.lon, poi.lat, rot);
        if (!visible) {
          g.style.opacity = '0';
          continue;
        }
        g.style.opacity = '1';
        g.setAttribute('transform', `translate(${pt[0]},${pt[1]})`);
        g.classList.toggle('is-active', Boolean(sameCity(poi, target)));
      }
    };

    const renderFrame = (rot) => {
      projection.rotate([rot[0], rot[1]]);
      graticuleRef.current?.setAttribute('d', path(graticuleGeo) ?? '');
      landRef.current?.setAttribute('d', path(world.land) ?? '');
      bordersRef.current?.setAttribute('d', path(world.borders) ?? '');
      drawCities(rot);
    };

    measure();
    if (onReady) onReady(apiRef.current);

    let raf = 0;
    let last = performance.now();
    let loaded = false;
    const tick = (now) => {
      const dt = Math.min(64, now - last);
      last = now;
      let rot = rotationRef.current;
      const anim = animRef.current;
      if (autoRotateRef.current) {
        rot = [
          spinLongitude(rot[0], dt, spinDegPerSecRef.current),
          rot[1] + (-idleTiltDegRef.current - rot[1]) * Math.min(1, dt / 400),
        ];
        animRef.current = null;
        activeTargetRef.current = null;
      } else if (anim) {
        const tt = Math.min(1, (now - anim.start) / anim.dur);
        rot = lerpRotation(anim.from, anim.to, anim.ease(tt));
      }
      rotationRef.current = rot;
      renderFrame(rot);
      if (!loaded) {
        loaded = true;
        onLoadRef.current?.();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => measure()) : null;
    ro?.observe(parent);

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world, graticuleGeo, fit?.wRatio, fit?.hRatio]);

  return (
    <svg
      ref={svgRef}
      className={`ig-flat ${className}`.trim()}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <clipPath id={clipId}>
          <circle ref={clipRef} />
        </clipPath>
        <filter id={glowId} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <circle ref={discRef} className="ig-flat-disc" />
      <g clipPath={`url(#${clipId})`}>
        <path ref={graticuleRef} className="ig-flat-graticule" />
        <path ref={landRef} className="ig-flat-land" />
        <path ref={bordersRef} className="ig-flat-borders" />
      </g>
      <circle ref={ringRef} className="ig-flat-ring" />
      <g className="ig-flat-cities">
        {pois.map((poi, i) => (
          <g
            key={`${poi.name}-${i}`}
            className="ig-flat-city"
            ref={(el) => {
              cityRefs.current[i] = el;
            }}
          >
            <circle className="ig-flat-city-halo" r={15 * markerSize} filter={`url(#${glowId})`} />
            <circle className="ig-flat-city-dot" r={3.5 * markerSize} />
            {showLabels && (
              <text className="ig-flat-city-label" x="11" y="4">
                {poi.name}
              </text>
            )}
          </g>
        ))}
      </g>
    </svg>
  );
});
