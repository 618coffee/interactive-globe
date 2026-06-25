import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { resolveTheme } from './theme.js';
import { resolveGraticule } from './graticule.js';
import { slerpPosition, latLonToCoords, vec3ToLatLon } from './camera-math.js';

// Real NASA Blue Marble Next Gen day map (8192×4096) + NASA cloud composite
// (2048×1024), committed in this repo and served with CORS via jsDelivr-gh so the
// published package ships a high-res globe by default. The water/topology masks
// stay on the three-globe CDN. Override any of these through the `textures` prop.
const TEXTURE_BASE =
  'https://cdn.jsdelivr.net/gh/618coffee/interactive-globe@v0.7.0/react/public/textures';
const DEFAULT_TEXTURES = {
  day:    `${TEXTURE_BASE}/earth-blue-marble-8k.jpg`,
  spec:   'https://unpkg.com/three-globe/example/img/earth-water.png',
  bump:   'https://unpkg.com/three-globe/example/img/earth-topology.png',
  clouds: `${TEXTURE_BASE}/earth-clouds-2k.jpg`,
};

// Align with the host site's theme token transition cadence for perceived sync.
const THEME_TRANSITION_MS = 560;

// Defaults for the configurable "look" props. idleTiltDeg = latitude shown at the
// disc centre while auto-rotating (matches the flat globe's tilt); spinDegPerSec =
// auto-rotation speed (matches the flat globe).
const DEFAULT_IDLE_TILT_DEG    = 12;
const DEFAULT_SPIN_DEG_PER_SEC = 6;

// Camera position whose elevation centres `tiltDeg` of latitude. _applyFit
// rescales the distance, so only this direction (elevation) matters.
function idleCameraVec(tiltDeg) {
  return new THREE.Vector3(0, 3 * Math.tan((tiltDeg * Math.PI) / 180), 3);
}

// OrbitControls.autoRotateSpeed that yields `degPerSec` when update(dt) is used:
// the per-second angle is 2*PI/60 * speed = 6*speed deg, so speed = degPerSec/6.
function autoRotateSpeedFor(degPerSec) {
  return degPerSec / 6;
}

function latLonToVec3(lat, lon, r = 1) {
  const { x, y, z } = latLonToCoords(lat, lon, r);
  return new THREE.Vector3(x, y, z);
}

// Named easing curves for camera tweens. Each maps a normalized time t in
// [0,1] to an eased progress in [0,1]. `flyTo` accepts any of these keys or a
// custom function.
const EASINGS = {
  linear:         (t) => t,
  easeInCubic:    (t) => t * t * t,
  easeOutCubic:   (t) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
};

function resolveEasing(easing) {
  if (typeof easing === 'function') return easing;
  return EASINGS[easing] || EASINGS.easeOutCubic;
}

// Parse '#rrggbb' to an {r,g,b} byte triple.
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
const rgba = ({ r, g, b }, a) => `rgba(${r}, ${g}, ${b}, ${a})`;

// Radial marker sprite. `palette` = { color, highlight, core }; defaults keep
// the original cyan look so dark mode is unchanged.
function makeMarkerTexture(palette = { color: '#8cebff', highlight: '#befaff', core: '#dcfaff' }) {
  const base = hexToRgb(palette.color);
  const hi   = hexToRgb(palette.highlight);
  const size = 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const cx = size / 2, cy = size / 2;
  // Soft outer glow so the pin still reads on bright / busy day-map textures.
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 62);
  glow.addColorStop(0,    rgba(base, 0.45));
  glow.addColorStop(0.55, rgba(base, 0.18));
  glow.addColorStop(1,    rgba(base, 0.00));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);
  // Solid filled dot (stays legible when small) with a soft edge + lighter center.
  const fill = ctx.createRadialGradient(cx, cy, 2, cx, cy, 46);
  fill.addColorStop(0,    rgba(hi,   1));
  fill.addColorStop(0.55, rgba(base, 1));
  fill.addColorStop(0.90, rgba(base, 1));
  fill.addColorStop(1,    rgba(base, 0.00));
  ctx.fillStyle = fill;
  ctx.beginPath(); ctx.arc(cx, cy, 46, 0, Math.PI * 2); ctx.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeStars() {
  const geo = new THREE.BufferGeometry();
  const count = 4500;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 90 + Math.random() * 250;
    const u = Math.random(), v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi   = Math.acos(2 * v - 1);
    pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    pos[i*3+1] = r * Math.cos(phi);
    pos[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
    const t = 0.65 + Math.random() * 0.35;
    const tint = Math.random();
    col[i*3]   = t * (tint > 0.9 ? 0.85 : 1);
    col[i*3+1] = t;
    col[i*3+2] = t * (tint < 0.1 ? 0.85 : 1);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.7, vertexColors: true, sizeAttenuation: true,
    transparent: true, opacity: 0.85, depthWrite: false,
  }));
}

function lodDistanceCap(lod) {
  switch (lod) {
    case 0: return Infinity;
    case 1: return 4.5;
    case 2: return 2.5;
    case 3: return 1.7;
    default: return 0;
  }
}

/**
 * Framework-agnostic Three.js Earth scene manager.
 *
 * @param {HTMLCanvasElement} canvas    Target canvas
 * @param {HTMLElement}       labelsEl  Empty <div> that the scene fills with positioned label nodes
 * @param {object} options
 *   pois, labels, autoRotate, showClouds, showAtmosphere, showLabels,
 *   showMarkers, exposure, textures, onReady, onLoad, onPoiClick
 */
export class GlobeScene {
  constructor(canvas, labelsEl, options = {}) {
    this.canvas    = canvas;
    this.labelsEl  = labelsEl;
    this.options   = {
      pois: [],
      labels: [],
      autoRotate: true,
      enableZoom: true,
      enableRotate: true,
      showClouds: true,
      showAtmosphere: true,
      showAurora: true,
      showLabels: true,
      showMarkers: true,
      markerSize: 1,
      exposure: 1.4,
      theme: 'dark',
      initialView: null,
      idleTiltDeg: DEFAULT_IDLE_TILT_DEG,
      spinDegPerSec: DEFAULT_SPIN_DEG_PER_SEC,
      onReady: null,
      onLoad: null,
      onPoiClick: null,
      ...options,
      // Resolve textures AFTER the spread so callers passing
      // `textures: undefined` don't wipe the defaults.
      textures: { ...DEFAULT_TEXTURES, ...(options.textures || {}) },
    };

    this._disposed = false;
    this._rafId    = null;
    this._tmpVec   = new THREE.Vector3();
    this._tmpNor   = new THREE.Vector3();

    this._theme = resolveTheme(this.options.theme, this.options.themeColors);

    this._initRenderer();
    this._initScene();
    this._initEarth();
    this._initGraticule();
    this._initMarkers();
    this._initLabels();
    this._initInteraction();
    this._applyVisibility();
    this._applyFit();
    this._applyInitialView();
    this._loop = this._loop.bind(this);
    this._rafId = requestAnimationFrame(this._loop);

    if (this.options.onReady) this.options.onReady(this);
  }

  // Center the camera on a starting lat/lon (cross-mode rotation handoff).
  // Keeps the fitted distance — same end-state as flyTo, applied instantly so
  // the globe renders pre-rotated on the first frame.
  _applyInitialView() {
    const v = this.options.initialView;
    if (!v || !Number.isFinite(v.lat) || !Number.isFinite(v.lon)) return;
    const dist = this.camera.position.distanceTo(this.controls.target);
    this.camera.position.copy(latLonToVec3(v.lat, v.lon, dist));
    this.controls.update();
  }

  // Re-orient the idle camera to a new tilt (centre latitude), keeping the
  // current longitude + distance. Used when `idleTiltDeg` changes live.
  _applyIdleTilt(tiltDeg) {
    const { lon } = this.getInfo();
    const dist = this.camera.position.distanceTo(this.controls.target);
    this.camera.position.copy(latLonToVec3(tiltDeg, lon, dist));
    this.controls.update();
  }

  // -------------------------------------------------------------- init

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping      = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.options.exposure;
    this._resize();
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this._backgroundColor = new THREE.Color(this._theme.background);
    // Stars render in their own scene via a perspective camera (see _loop): the
    // orthographic main camera's tight frustum clips the distant star sphere, so
    // the backdrop (sky color + stars) is drawn in a separate pass that fills the
    // viewport and parallaxes with the orbit. The main scene stays transparent.
    this.scene.background = null;
    this.starScene = new THREE.Scene();
    this.starScene.background = this._backgroundColor;
    this.starCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 4000);

    // Orthographic (parallel) projection — matches the flat D3 geoOrthographic globe
    // (no perspective bulge). On-screen size comes from the frustum, set in _applyFit.
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.05, 2000);
    this.camera.position.copy(idleCameraVec(this.options.idleTiltDeg));

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping   = true;
    this.controls.dampingFactor   = 0.08;
    this.controls.rotateSpeed     = 0.55;
    this.controls.zoomSpeed       = 0.9;
    this.controls.minDistance     = 1.25;
    this.controls.maxDistance     = 8;
    this.controls.enablePan       = false;
    this.controls.enableZoom      = this.options.enableZoom;
    this.controls.enableRotate    = this.options.enableRotate;
    this.controls.autoRotate      = this.options.autoRotate;
    // Frame-rate independent via controls.update(dt) in the loop; the speed is
    // derived from spinDegPerSec so it matches the flat globe (default 6 deg/s).
    this.controls.autoRotateSpeed = autoRotateSpeedFor(this.options.spinDegPerSec);

    this.stars = makeStars();
    this.starScene.add(this.stars);
    this.stars.material.opacity = this._theme.showStars ? 0.85 : 0;
    this.stars.visible = this.stars.material.opacity > 0.001;

    this.scene.add(new THREE.AmbientLight(0xdfe9f5, 2.6));
  }

  _initEarth() {
    const T = this.options.textures;
    const manager = new THREE.LoadingManager(() => {
      if (this.options.onLoad) this.options.onLoad();
    });
    const loader = new THREE.TextureLoader(manager);
    loader.crossOrigin = 'anonymous';
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();

    const dayTex   = loader.load(T.day);
    const specTex  = loader.load(T.spec);
    const bumpTex  = loader.load(T.bump);
    const cloudTex = loader.load(T.clouds);
    dayTex.colorSpace = THREE.SRGBColorSpace;
    [dayTex, specTex, bumpTex, cloudTex].forEach(t => { t.anisotropy = maxAniso; });

    // Oceans look dull at the same exposure because water absorbs more
    // light than land in the Blue Marble texture. Use the water mask
    // (specTex — white over water, black over land) as an emissive map
    // with a deep-blue emissive color, so ocean pixels self-light a bit
    // and the land/water brightness ratio looks more balanced. Land is
    // black in the mask, so it gets zero emissive contribution.
    this.earth = new THREE.Mesh(
      new THREE.SphereGeometry(1, 128, 128),
      new THREE.MeshPhongMaterial({
        map: dayTex, specularMap: specTex,
        bumpMap: bumpTex, bumpScale: 0.04,
        specular: new THREE.Color(0x3a4a66), shininess: 22,
        emissive: new THREE.Color(0x12365c),
        emissiveMap: specTex,
        emissiveIntensity: 0.75,
      })
    );
    this.scene.add(this.earth);

    this.clouds = new THREE.Mesh(
      new THREE.SphereGeometry(1.012, 128, 128),
      new THREE.MeshLambertMaterial({
        map: cloudTex, transparent: true, opacity: 0.5, depthWrite: false,
      })
    );
    this.scene.add(this.clouds);

    // The rim-glow shader approximates the silhouette with a constant view
    // direction (0,0,1), which is exact under the orthographic (parallel) projection.
    // The full-strength factor would read as a harsh halo, so scale it to a soft rim.
    const atmosphereIntensity = 0.18;
    this.atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.07, 64, 64),
      new THREE.ShaderMaterial({
        uniforms: {
          glowColor: { value: new THREE.Color(0x4fc3ff) },
          uIntensity: { value: atmosphereIntensity },
        },
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          varying vec3 vNormal;
          uniform vec3 glowColor;
          uniform float uIntensity;
          void main() {
            float f = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
            gl_FragColor = vec4(glowColor, 1.0) * f * uIntensity;
          }`,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      })
    );
    this.scene.add(this.atmosphere);
    this.atmosphere.material.opacity = this._theme.showAtmosphere ? 1 : 0;
    this.atmosphere.visible = this.atmosphere.material.opacity > 0.001;

    // ---------- Aurora -----------------------------------------------
    // Real auroras hug the auroral oval — roughly 65°–78° magnetic
    // latitude around each pole. We draw two thin annular bands of a
    // sphere shell just above the surface and run an fBm-driven shader
    // that simulates flowing curtain patterns. Green dominates (oxygen
    // at ~100 km), with a subtle warm-red tint near the high-altitude
    // edge of the band (oxygen at ~300 km).
    this.auroraMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:        { value: 0 },
        uColorLow:    { value: new THREE.Color(0x3affb0) }, // oxygen green
        uColorHigh:   { value: new THREE.Color(0xff6da8) }, // upper-altitude pink-red
        uIntensity:   { value: 0.8 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3  uColorLow;
        uniform vec3  uColorHigh;
        uniform float uIntensity;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
            u.y);
        }
        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p *= 2.0;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          // vUv.x runs around the longitude band, vUv.y across its width.
          float u = vUv.x;
          float v = vUv.y;
          float t = uTime * 0.08;

          // Two fBm layers: slow-drifting broad shape + faster fine
          // detail. Output is the impression of curtains shifting around
          // the auroral oval.
          float pattern = fbm(vec2(u * 14.0 + t,        v * 3.0)) * 0.75
                        + fbm(vec2(u * 28.0 - t * 1.4,  v * 7.0 + t * 0.6)) * 0.25;
          // Lift contrast but keep softer edges than a binary mask.
          pattern = smoothstep(0.25, 0.75, pattern);

          // Width envelope: sin gives a smooth bulge with zero at both
          // edges. pow widens the peak so the band is bright in the
          // middle and only fades very close to the edges.
          float band = pow(sin(v * 3.14159265), 1.2);

          // Color drifts from green at the equatorward (v=0) edge to a
          // warm pink-red at the poleward (v=1) edge.
          vec3 color = mix(uColorLow, uColorHigh, pow(v, 1.2));

          // AdditiveBlending uses src.rgb * src.a + dest. Output raw
          // color and use alpha as the gate — avoids the alpha²
          // dimming you'd get from pre-multiplying.
          float alpha = pattern * band * uIntensity;
          gl_FragColor = vec4(color, alpha);
        }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    // North auroral oval: 65°N–78°N. SphereGeometry phi runs from 0
    // (top) to π (bottom), so phi for latitude L (N) is (90° − L).
    const PHI = (latDeg) => THREE.MathUtils.degToRad(90 - latDeg);
    const NORTH_HI = PHI(78), NORTH_LO = PHI(65);
    const SOUTH_HI = PHI(-65), SOUTH_LO = PHI(-78);
    this.auroraNorth = new THREE.Mesh(
      new THREE.SphereGeometry(1.022, 96, 8,
        0, Math.PI * 2,
        NORTH_HI,  NORTH_LO - NORTH_HI),
      this.auroraMat,
    );
    this.auroraSouth = new THREE.Mesh(
      new THREE.SphereGeometry(1.022, 96, 8,
        0, Math.PI * 2,
        SOUTH_HI,  SOUTH_LO - SOUTH_HI),
      this.auroraMat,
    );
    // Children of the earth so they ride along if it ever rotates.
    this.earth.add(this.auroraNorth);
    this.earth.add(this.auroraSouth);
    const auroraOn = this.options.showAurora && this._theme.showAurora;
    this.auroraMat.uniforms.uIntensity.value = auroraOn ? 0.8 : 0;
    this.auroraNorth.visible = auroraOn;
    this.auroraSouth.visible = auroraOn;

    // Cache decoded textures by URL so a later theme toggle that swaps the
    // surface map can reuse an already-uploaded GPU texture (a synchronous
    // reference swap, in the same frame as the sky change — no re-decode, no
    // re-upload, no jank) instead of re-loading a multi-megabyte image every
    // time. Seeded with the initial set so toggling back to it is instant too.
    this._texCache = new Map([
      [T.day, dayTex], [T.spec, specTex], [T.bump, bumpTex], [T.clouds, cloudTex],
    ]);
  }

  // Live-swap the surface textures (e.g. when the theme toggles between the
  // default Blue Marble and a caller-provided vintage map). Textures are cached
  // by URL: a cache hit applies synchronously (same frame as the sky change, no
  // decode/upload, no jank); a miss loads once via a bare loader (no loader
  // overlay), caches, then applies. A map is only reassigned when its URL
  // actually changed, so identical layers (e.g. bump/clouds shared across
  // themes) cost nothing and don't trigger a material recompile.
  _reloadTextures() {
    const T = this.options.textures;
    const mat = this.earth.material;
    const cloudMat = this.clouds.material;
    this._swapTexture(T.day, true, (tex) => {
      if (mat.map !== tex) {
        this._startSurfaceCrossfade(mat.map);
        mat.map = tex;
        mat.needsUpdate = true;
      }
    });
    this._swapTexture(T.spec, false, (tex) => {
      if (mat.specularMap !== tex) {
        mat.specularMap = tex;
        mat.emissiveMap = tex;
        mat.needsUpdate = true;
      }
    });
    this._swapTexture(T.bump, false, (tex) => {
      if (mat.bumpMap !== tex) { mat.bumpMap = tex; mat.needsUpdate = true; }
    });
    this._swapTexture(T.clouds, false, (tex) => {
      if (cloudMat.map !== tex) { cloudMat.map = tex; cloudMat.needsUpdate = true; }
    });
  }

  // Resolve a texture URL to a THREE.Texture via the per-scene cache. On a cache
  // hit `apply` runs synchronously; on a miss the texture is loaded once (bare
  // loader, so the initial-load overlay isn't re-triggered), configured, cached,
  // then applied. Cached textures are owned by the scene and freed in dispose().
  _swapTexture(url, srgb, apply) {
    const cached = this._texCache.get(url);
    if (cached) { apply(cached); return; }
    if (!this._texLoader) {
      this._texLoader = new THREE.TextureLoader();
      this._texLoader.crossOrigin = 'anonymous';
    }
    this._texLoader.load(url, (tex) => {
      if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
      this._texCache.set(url, tex);
      apply(tex);
    });
  }

  _initGraticule() {
    const g = resolveGraticule(this.options.graticule);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uSpacing: { value: g.spacing },
        uColor:   { value: new THREE.Color(g.color) },
        uOpacity: { value: g.opacity },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform float uSpacing;
        uniform vec3  uColor;
        uniform float uOpacity;
        // Anti-aliased line near each multiple of 'spacing', width held constant
        // in screen space via derivatives so it stays crisp at any zoom.
        float gridLine(float coord, float spacing) {
          float c = coord / spacing;
          float d = abs(fract(c - 0.5) - 0.5) / max(fwidth(c), 1e-5);
          return 1.0 - clamp(d - 0.6, 0.0, 1.0);
        }
        void main() {
          float lon = vUv.x * 360.0;
          float lat = vUv.y * 180.0;
          float gl = max(gridLine(lon, uSpacing), gridLine(lat, uSpacing));
          if (gl < 0.01) discard;
          gl_FragColor = vec4(uColor, gl * uOpacity);
        }`,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
      extensions: { derivatives: true },
    });
    // Radius just above the earth (1.0) and below the clouds (1.012). Child of
    // the earth so it co-rotates with the surface and aligns with the markers.
    this.graticule = new THREE.Mesh(new THREE.SphereGeometry(1.001, 96, 96), material);
    this.graticule.visible = g.show;
    this.earth.add(this.graticule);
  }

  _applyGraticule() {
    if (!this.graticule) return;
    const g = resolveGraticule(this.options.graticule);
    this.graticule.visible = g.show;
    const u = this.graticule.material.uniforms;
    u.uSpacing.value = g.spacing;
    u.uColor.value.set(g.color);
    u.uOpacity.value = g.opacity;
  }

  _initMarkers() {
    this.markerTex = makeMarkerTexture(this._theme.marker);
    this.markers = new THREE.Group();
    this.markerMeshes = [];
    this.setPois(this.options.pois);
    this.earth.add(this.markers);
  }

  _initLabels() {
    this._labelEntries = [];
    this.setLabels(this.options.labels);
  }

  _initInteraction() {
    // Raycast on click to find which marker was hit (for onPoiClick).
    this._raycaster = new THREE.Raycaster();
    this._pointer   = new THREE.Vector2();
    this._downXY    = null;

    this._onPointerDown = (e) => {
      this._downXY = { x: e.clientX, y: e.clientY };
    };
    this._onPointerUp = (e) => {
      if (!this._downXY) return;
      const dx = e.clientX - this._downXY.x;
      const dy = e.clientY - this._downXY.y;
      this._downXY = null;
      if (dx * dx + dy * dy > 16) return; // dragged, not a click
      if (!this.options.onPoiClick || !this.options.showMarkers) return;
      const rect = this.canvas.getBoundingClientRect();
      this._pointer.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      this._pointer.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      this._raycaster.setFromCamera(this._pointer, this.camera);
      const hits = this._raycaster.intersectObjects(this.markerMeshes, false);
      if (hits.length) this.options.onPoiClick(hits[0].object.userData.poi);
    };
    this.canvas.addEventListener('pointerdown', this._onPointerDown);
    this.canvas.addEventListener('pointerup',   this._onPointerUp);

    this._onResize = () => this._resize();
    window.addEventListener('resize', this._onResize);
    // Track container size changes too (host can be inside a flex/grid panel).
    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObs = new ResizeObserver(() => this._resize());
      this._resizeObs.observe(this.canvas);
    }
  }

  // -------------------------------------------------------------- public api

  setOptions(partial) {
    Object.assign(this.options, partial);
    if ('exposure'     in partial) this.renderer.toneMappingExposure = partial.exposure;
    if ('autoRotate'   in partial) this.controls.autoRotate = partial.autoRotate;
    if ('enableZoom'   in partial) this.controls.enableZoom = partial.enableZoom;
    if ('enableRotate' in partial) this.controls.enableRotate = partial.enableRotate;
    if ('spinDegPerSec' in partial) this.controls.autoRotateSpeed = autoRotateSpeedFor(partial.spinDegPerSec ?? DEFAULT_SPIN_DEG_PER_SEC);
    if ('idleTiltDeg' in partial) this._applyIdleTilt(partial.idleTiltDeg ?? DEFAULT_IDLE_TILT_DEG);
    const themeChanged = 'theme' in partial || 'themeColors' in partial;
    if (themeChanged) this._applyTheme();
    if ('pois'   in partial) this.setPois(partial.pois);
    else if (themeChanged) this.setPois(this.options.pois); // rebuild markers in new palette
    if ('labels' in partial) this.setLabels(partial.labels);
    if ('graticule' in partial) this._applyGraticule();
    if ('fit' in partial) this._applyFit();
    if ('textures' in partial) {
      // Re-resolve against the defaults so passing `textures: undefined` (e.g.
      // reverting to the built-in Blue Marble) restores every map, not wipes it.
      this.options.textures = { ...DEFAULT_TEXTURES, ...(partial.textures || {}) };
      this._reloadTextures();
    }
    this._applyVisibility();
  }

  // Re-resolve the theme (name + caller color overrides) and apply the parts
  // that live outside _applyVisibility: sky color and the marker sprite palette.
  // Marker meshes are rebuilt by the setPois call in setOptions (so their
  // blending updates too). Reads from this.options so a themeColors-only change
  // re-resolves correctly.
  _applyTheme() {
    const prevTheme = this._theme;
    this._theme = resolveTheme(this.options.theme, this.options.themeColors);
    if (this.scene) {
      const themeNameChanged = prevTheme && prevTheme !== this._theme;
      this._startThemeTransition(themeNameChanged);
    }
    if (this.markerTex) this.markerTex.dispose();
    this.markerTex = makeMarkerTexture(this._theme.marker);
  }

  setPois(pois) {
    // Tear down old markers
    for (const m of this.markerMeshes) {
      m.geometry.dispose();
      m.material.dispose();
      this.markers.remove(m);
    }
    this.markerMeshes = [];

    for (let i = 0; i < pois.length; i++) {
      const poi = pois[i];
      const pos = latLonToVec3(poi.lat, poi.lon, 1.005);
      const mat = new THREE.MeshBasicMaterial({
        map: this.markerTex,
        transparent: true, depthWrite: false,
        blending: this._theme.marker.blending === 'normal'
          ? THREE.NormalBlending
          : THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.06), mat);
      m.position.copy(pos);
      m.lookAt(pos.clone().multiplyScalar(2));
      m.userData = { poi, phase: i * 0.42 };
      this.markers.add(m);
      this.markerMeshes.push(m);
    }
    this.options.pois = pois;
  }

  setLabels(labels) {
    // Tear down old labels
    for (const ld of this._labelEntries) {
      if (ld.el.parentNode) ld.el.parentNode.removeChild(ld.el);
    }
    this._labelEntries = [];

    for (const item of labels) {
      const el = document.createElement('div');
      el.className = `ig-label ig-${item.type}`;
      el.textContent = item.name;
      this.labelsEl.appendChild(el);
      this._labelEntries.push({
        el,
        type: item.type,
        lod:  item.lod,
        pos:  latLonToVec3(item.lat, item.lon, item.type === 'continent' ? 1.0 : 1.02),
        visible: false,
      });
    }
    this.options.labels = labels;
  }

  reset() {
    this._tween(
      this.camera.position.clone(), idleCameraVec(this.options.idleTiltDeg),
      this.controls.target.clone(),  new THREE.Vector3(0, 0, 0),
      700,
    );
  }

  zoom(factor) {
    const dir = this.camera.position.clone().sub(this.controls.target).normalize();
    const cur = this.camera.position.distanceTo(this.controls.target);
    const next = THREE.MathUtils.clamp(cur * factor, this.controls.minDistance, this.controls.maxDistance);
    const ePos = this.controls.target.clone().add(dir.multiplyScalar(next));
    this._tween(this.camera.position.clone(), ePos, null, null, 320);
  }

  /**
   * Smoothly fly the camera to a lat/lon.
   * @param {number} lat
   * @param {number} lon
   * @param {number} [distance] Target camera distance. Omit to keep the CURRENT
   *   distance — a pure rotation with no zoom change.
   * @param {{ durationMs?: number, easing?: ('linear'|'easeInCubic'|'easeOutCubic'|'easeInOutCubic'|((t:number)=>number)) }} [opts]
   *   `durationMs` defaults to 900; `easing` defaults to `'easeOutCubic'`.
   */
  flyTo(lat, lon, distance, opts = {}) {
    const { durationMs = 900, easing = 'easeOutCubic' } = opts;
    const dist = distance == null
      ? this.camera.position.distanceTo(this.controls.target)
      : distance;
    const target = latLonToVec3(lat, lon, dist);
    this._tween(
      this.camera.position.clone(), target,
      this.controls.target.clone(), new THREE.Vector3(0, 0, 0),
      durationMs, easing, true,
    );
    this.controls.autoRotate = false;
    this.options.autoRotate  = false;
  }

  getInfo() {
    const dist = this.camera.position.distanceTo(this.controls.target);
    const o = this.camera.position.clone().sub(this.controls.target);
    const { lat, lon } = vec3ToLatLon(o);
    const level = dist < 1.7 ? 'L3' : dist < 2.5 ? 'L2' : dist < 4.5 ? 'L1' : 'L0';
    return { lat, lon, dist, level };
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    cancelAnimationFrame(this._rafId);
    window.removeEventListener('resize', this._onResize);
    if (this._resizeObs) this._resizeObs.disconnect();
    this.canvas.removeEventListener('pointerdown', this._onPointerDown);
    this.canvas.removeEventListener('pointerup',   this._onPointerUp);
    this.controls.dispose();

    for (const ld of this._labelEntries) {
      if (ld.el.parentNode) ld.el.parentNode.removeChild(ld.el);
    }
    this._labelEntries = [];

    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
          for (const k of Object.keys(m)) {
            if (m[k] && m[k].isTexture) m[k].dispose();
          }
          m.dispose();
        }
      }
    });
    // Stars live in their own scene (see _initScene); the traversal above
    // doesn't reach them.
    this.stars.geometry.dispose();
    this.stars.material.dispose();
    this.markerTex.dispose();
    // Free every cached texture (including theme variants no longer attached to
    // a material, which the scene.traverse above would not reach).
    if (this._texCache) {
      for (const tex of this._texCache.values()) tex.dispose();
      this._texCache.clear();
    }
    this.renderer.dispose();
  }

  // -------------------------------------------------------------- internals

  _applyVisibility() {
    this.clouds.visible      = this.options.showClouds;
    this.markers.visible     = this.options.showMarkers;
    this._syncThemeLayerTargets();
    // labels handled per-frame via showLabels
  }

  _syncThemeLayerTargets() {
    const starsTarget = this._theme.showStars ? 0.85 : 0;
    const atmoTarget = (this.options.showAtmosphere && this._theme.showAtmosphere) ? 1 : 0;
    const auroraTarget = (this.options.showAurora && this._theme.showAurora) ? 0.8 : 0;
    // Keep additive layers visible while fading out so the transition is smooth.
    this.stars.visible = starsTarget > 0 || this.stars.material.opacity > 0.001;
    this.atmosphere.visible = atmoTarget > 0 || this.atmosphere.material.opacity > 0.001;
    this.auroraNorth.visible = auroraTarget > 0 || this.auroraMat.uniforms.uIntensity.value > 0.001;
    this.auroraSouth.visible = auroraTarget > 0 || this.auroraMat.uniforms.uIntensity.value > 0.001;

    if (this._themeTransition && this._themeTransition.active) {
      this._themeTransition.to.starsOpacity = starsTarget;
      this._themeTransition.to.atmosphereOpacity = atmoTarget;
      this._themeTransition.to.auroraIntensity = auroraTarget;
      return;
    }
    this.stars.material.opacity = starsTarget;
    this.atmosphere.material.opacity = atmoTarget;
    this.auroraMat.uniforms.uIntensity.value = auroraTarget;
    this.stars.visible = this.stars.material.opacity > 0.001;
    this.atmosphere.visible = this.atmosphere.material.opacity > 0.001;
    this.auroraNorth.visible = this.auroraMat.uniforms.uIntensity.value > 0.001;
    this.auroraSouth.visible = this.auroraMat.uniforms.uIntensity.value > 0.001;
  }

  _startThemeTransition(animate) {
    const to = {
      background: new THREE.Color(this._theme.background),
      starsOpacity: this._theme.showStars ? 0.85 : 0,
      atmosphereOpacity: (this.options.showAtmosphere && this._theme.showAtmosphere) ? 1 : 0,
      auroraIntensity: (this.options.showAurora && this._theme.showAurora) ? 0.8 : 0,
    };

    if (!animate) {
      this._backgroundColor.copy(to.background);
      this.stars.material.opacity = to.starsOpacity;
      this.atmosphere.material.opacity = to.atmosphereOpacity;
      this.auroraMat.uniforms.uIntensity.value = to.auroraIntensity;
      this.stars.visible = this.stars.material.opacity > 0.001;
      this.atmosphere.visible = this.atmosphere.material.opacity > 0.001;
      this.auroraNorth.visible = this.auroraMat.uniforms.uIntensity.value > 0.001;
      this.auroraSouth.visible = this.auroraMat.uniforms.uIntensity.value > 0.001;
      return;
    }

    this._themeTransition = {
      active: true,
      startMs: performance.now(),
      durationMs: THEME_TRANSITION_MS,
      from: {
        background: this._backgroundColor.clone(),
        starsOpacity: this.stars.material.opacity,
        atmosphereOpacity: this.atmosphere.material.opacity,
        auroraIntensity: this.auroraMat.uniforms.uIntensity.value,
      },
      to,
    };
  }

  _tickThemeTransition(nowMs) {
    const tr = this._themeTransition;
    if (!tr || !tr.active) return;
    const u = Math.min(1, (nowMs - tr.startMs) / tr.durationMs);
    const eased = 1 - Math.pow(1 - u, 3);

    this._backgroundColor.copy(tr.from.background).lerp(tr.to.background, eased);
    this.stars.material.opacity = THREE.MathUtils.lerp(tr.from.starsOpacity, tr.to.starsOpacity, eased);
    this.atmosphere.material.opacity = THREE.MathUtils.lerp(tr.from.atmosphereOpacity, tr.to.atmosphereOpacity, eased);
    this.auroraMat.uniforms.uIntensity.value = THREE.MathUtils.lerp(tr.from.auroraIntensity, tr.to.auroraIntensity, eased);

    this.stars.visible = this.stars.material.opacity > 0.001;
    this.atmosphere.visible = this.atmosphere.material.opacity > 0.001;
    this.auroraNorth.visible = this.auroraMat.uniforms.uIntensity.value > 0.001;
    this.auroraSouth.visible = this.auroraMat.uniforms.uIntensity.value > 0.001;

    if (u >= 1) tr.active = false;
  }

  _startSurfaceCrossfade(previousTexture) {
    if (!previousTexture) return;
    if (!this._surfaceFadeMesh) {
      this._surfaceFadeMesh = new THREE.Mesh(
        new THREE.SphereGeometry(1.0008, 128, 128),
        new THREE.MeshPhongMaterial({
          transparent: true,
          depthWrite: false,
          side: THREE.FrontSide,
        }),
      );
      this.earth.add(this._surfaceFadeMesh);
    }
    const mat = this._surfaceFadeMesh.material;
    mat.map = previousTexture;
    mat.opacity = 1;
    mat.needsUpdate = true;
    this._surfaceFadeMesh.visible = true;
    this._surfaceFade = {
      startMs: performance.now(),
      durationMs: THEME_TRANSITION_MS,
    };
  }

  _tickSurfaceCrossfade(nowMs) {
    if (!this._surfaceFade || !this._surfaceFadeMesh) return;
    const u = Math.min(1, (nowMs - this._surfaceFade.startMs) / this._surfaceFade.durationMs);
    const eased = 1 - Math.pow(1 - u, 3);
    this._surfaceFadeMesh.material.opacity = 1 - eased;
    if (u >= 1) {
      this._surfaceFadeMesh.visible = false;
      this._surfaceFadeMesh.material.map = null;
      this._surfaceFade = null;
    }
  }

  _tween(sPos, ePos, sTar, eTar, dur, easing, spherical = false) {
    const ease = resolveEasing(easing);
    const t0 = performance.now();
    const step = (t) => {
      if (this._disposed) return;
      const u = Math.min(1, (t - t0) / dur);
      const e = ease(u);
      if (spherical) {
        // Constant-radius arc (slerp direction + lerp radius) so a same-distance
        // flyTo is a pure rotation — no inward chord dip / apparent zoom.
        const p = slerpPosition(sPos, ePos, e);
        this.camera.position.set(p.x, p.y, p.z);
      } else {
        this.camera.position.lerpVectors(sPos, ePos, e);
      }
      if (sTar && eTar) this.controls.target.lerpVectors(sTar, eTar, e);
      if (u < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  _resize() {
    const w = this.canvas.clientWidth  || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    if (this.starCamera) {
      this.starCamera.aspect = h > 0 ? w / h : 1;
      this.starCamera.updateProjectionMatrix();
    }
    this._applyFit();
  }

  /**
   * When `options.fit` is set, size the orthographic frustum so the globe's
   * on-screen radius is `min(fit.wRatio·w, fit.hRatio·h)` px — matching the flat
   * mode's radius so the two modes render at the same size. Sphere radius 1.
   */
  _applyFit() {
    const fit = this.options.fit;
    if (!fit || !this.camera || !this.controls) return;
    const w = this.canvas.clientWidth  || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    const radiusPx = Math.min((fit.wRatio ?? 0.42) * w, (fit.hRatio ?? 0.58) * h);
    if (radiusPx <= 0) return;
    // Parallel projection: size comes from the frustum, not distance. The viewport
    // height h spans the frustum height, so map the unit-sphere radius to radiusPx
    // with a half-height of h / (2 * radiusPx).
    const halfH = h / (2 * radiusPx);
    const halfW = halfH * (w / h);
    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }

  _loop() {
    if (this._disposed) return;
    this._rafId = requestAnimationFrame(this._loop);
    if (!this._clock) this._clock = new THREE.Clock();
    const dt = Math.min(this._clock.getDelta(), 0.05);
    const t  = this._clock.elapsedTime;
    const nowMs = performance.now();

    this._tickThemeTransition(nowMs);
    this._tickSurfaceCrossfade(nowMs);

    if (this.options.showClouds) this.clouds.rotation.y += dt * 0.012;

    // Drive the aurora curtain animation.
    this.auroraMat.uniforms.uTime.value = t;

    if (this.options.showMarkers) {
      const markerScale = this.options.markerSize ?? 1;
      for (const m of this.markerMeshes) {
        const p = (Math.sin(t * 2.2 + m.userData.phase) * 0.5 + 0.5);
        m.scale.setScalar((0.40 + p * 0.08) * markerScale);
        m.material.opacity = 0.9 + p * 0.1;
      }
    }

    this.controls.update(dt);
    this._updateLabels();

    // Backdrop pass: a perspective camera mirroring the main camera draws the
    // sky color + stars so the distant star sphere fills the frame and
    // parallaxes as the camera orbits. The orthographic main camera's tight
    // frustum would clip every star, so the globe is composited on top in a
    // second pass (depth cleared, main scene background transparent).
    this.starCamera.position.copy(this.camera.position);
    this.starCamera.quaternion.copy(this.camera.quaternion);
    this.renderer.autoClear = true;
    this.renderer.render(this.starScene, this.starCamera);
    this.renderer.autoClear = false;
    this.renderer.clearDepth();
    this.renderer.render(this.scene, this.camera);
  }

  _updateLabels() {
    if (!this.labelsEl) return;
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    const halfW = w * 0.5, halfH = h * 0.5;
    const dist = this.camera.position.distanceTo(this.controls.target);
    const showAny = this.options.showLabels;

    for (const ld of this._labelEntries) {
      const cap = lodDistanceCap(ld.lod);
      if (!showAny || dist > cap) {
        if (ld.visible) { ld.el.style.opacity = '0'; ld.visible = false; }
        continue;
      }
      this._tmpVec.copy(ld.pos).applyMatrix4(this.earth.matrixWorld);
      this._tmpNor.copy(this._tmpVec).normalize();
      const toCam = this._tmpVec.clone().sub(this.camera.position).normalize();
      const facing = -this._tmpNor.dot(toCam);
      if (facing < 0.08) {
        if (ld.visible) { ld.el.style.opacity = '0'; ld.visible = false; }
        continue;
      }
      const ndc = this._tmpVec.clone().project(this.camera);
      if (ndc.z > 1) {
        if (ld.visible) { ld.el.style.opacity = '0'; ld.visible = false; }
        continue;
      }
      const x = ndc.x * halfW + halfW;
      const y = -ndc.y * halfH + halfH;
      const dy = ld.type === 'city' ? -14 : 0;
      const rim = THREE.MathUtils.clamp((facing - 0.08) / 0.22, 0, 1);
      const lodFade = cap === Infinity ? 1 :
        THREE.MathUtils.clamp((cap - dist) / (cap * 0.18), 0, 1);
      ld.el.style.transform = `translate3d(${x|0}px, ${(y + dy)|0}px, 0) translate(-50%, -50%)`;
      ld.el.style.opacity   = (rim * lodFade).toFixed(2);
      ld.visible = true;
    }
  }
}
