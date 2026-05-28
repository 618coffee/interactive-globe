import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 8K NASA Blue Marble textures (three-globe CDN) + clouds from three.js examples.
const DEFAULT_TEXTURES = {
  day:    'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
  spec:   'https://unpkg.com/three-globe/example/img/earth-water.png',
  bump:   'https://unpkg.com/three-globe/example/img/earth-topology.png',
  clouds: 'https://threejs.org/examples/textures/planets/earth_clouds_1024.png',
};

function latLonToVec3(lat, lon, r = 1) {
  const phi   = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  );
}

function makeMarkerTexture() {
  const size = 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const cx = size / 2, cy = size / 2;
  ctx.strokeStyle = 'rgba(140, 235, 255, 0.95)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, 38, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(140, 235, 255, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.stroke();
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18);
  g.addColorStop(0,   'rgba(190, 250, 255, 0.95)');
  g.addColorStop(0.5, 'rgba(140, 235, 255, 0.40)');
  g.addColorStop(1,   'rgba(140, 235, 255, 0.00)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(220, 250, 255, 1)';
  ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
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
      showClouds: true,
      showAtmosphere: true,
      showLabels: true,
      showMarkers: true,
      exposure: 1.4,
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
    this._sunOff   = new THREE.Vector3();
    this._yAxis    = new THREE.Vector3(0, 1, 0);

    this._initRenderer();
    this._initScene();
    this._initEarth();
    this._initMarkers();
    this._initLabels();
    this._initInteraction();
    this._applyVisibility();
    this._loop = this._loop.bind(this);
    this._rafId = requestAnimationFrame(this._loop);

    if (this.options.onReady) this.options.onReady(this);
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
    this.scene.background = new THREE.Color(0x000208);

    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.05, 2000);
    this.camera.position.set(0, 0.3, 3);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping   = true;
    this.controls.dampingFactor   = 0.08;
    this.controls.rotateSpeed     = 0.55;
    this.controls.zoomSpeed       = 0.9;
    this.controls.minDistance     = 1.25;
    this.controls.maxDistance     = 8;
    this.controls.enablePan       = false;
    this.controls.autoRotate      = this.options.autoRotate;
    this.controls.autoRotateSpeed = 0.35;

    this.stars = makeStars();
    this.scene.add(this.stars);

    this.sun = new THREE.DirectionalLight(0xfff5e6, 1.6);
    this.sun.position.set(5, 2, 3);
    this.scene.add(this.sun);
    this.scene.add(new THREE.AmbientLight(0xb8c8e0, 1.0));
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
        emissiveIntensity: 0.55,
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

    this.atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.07, 64, 64),
      new THREE.ShaderMaterial({
        uniforms: { glowColor: { value: new THREE.Color(0x4fc3ff) } },
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          varying vec3 vNormal;
          uniform vec3 glowColor;
          void main() {
            float f = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
            gl_FragColor = vec4(glowColor, 1.0) * f;
          }`,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      })
    );
    this.scene.add(this.atmosphere);

    this._textures = { dayTex, specTex, bumpTex, cloudTex };
  }

  _initMarkers() {
    this.markerTex = makeMarkerTexture();
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
    if ('exposure'   in partial) this.renderer.toneMappingExposure = partial.exposure;
    if ('autoRotate' in partial) this.controls.autoRotate = partial.autoRotate;
    if ('pois'   in partial) this.setPois(partial.pois);
    if ('labels' in partial) this.setLabels(partial.labels);
    this._applyVisibility();
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
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
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
      this.camera.position.clone(), new THREE.Vector3(0, 0.3, 3),
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
   * @param {number} [distance=1.8]
   */
  flyTo(lat, lon, distance = 1.8) {
    const target = latLonToVec3(lat, lon, distance);
    this._tween(this.camera.position.clone(), target, this.controls.target.clone(), new THREE.Vector3(0,0,0), 900);
    this.controls.autoRotate = false;
    this.options.autoRotate  = false;
  }

  getInfo() {
    const dist = this.camera.position.distanceTo(this.controls.target);
    const o = this.camera.position.clone().sub(this.controls.target);
    const r = o.length();
    const lat = 90 - Math.acos(THREE.MathUtils.clamp(o.y / r, -1, 1)) * 180 / Math.PI;
    let lon = Math.atan2(o.x, o.z) * 180 / Math.PI;
    lon = ((lon + 540) % 360) - 180;
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
    this.markerTex.dispose();
    this.renderer.dispose();
  }

  // -------------------------------------------------------------- internals

  _applyVisibility() {
    this.clouds.visible     = this.options.showClouds;
    this.markers.visible    = this.options.showMarkers;
    this.atmosphere.visible = this.options.showAtmosphere;
    // labels handled per-frame via showLabels
  }

  _tween(sPos, ePos, sTar, eTar, dur) {
    const t0 = performance.now();
    const step = (t) => {
      if (this._disposed) return;
      const u = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - u, 3);
      this.camera.position.lerpVectors(sPos, ePos, e);
      if (sTar && eTar) this.controls.target.lerpVectors(sTar, eTar, e);
      if (u < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  _resize() {
    const w = this.canvas.clientWidth  || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    if (this.camera) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
  }

  _loop() {
    if (this._disposed) return;
    this._rafId = requestAnimationFrame(this._loop);
    if (!this._clock) this._clock = new THREE.Clock();
    const dt = Math.min(this._clock.getDelta(), 0.05);
    const t  = this._clock.elapsedTime;

    if (this.options.showClouds) this.clouds.rotation.y += dt * 0.012;

    // Sun tracks the camera so the visible hemisphere stays lit.
    this._sunOff.copy(this.camera.position).applyAxisAngle(this._yAxis, 0.35);
    this.sun.position.copy(this._sunOff);

    if (this.options.showMarkers) {
      for (const m of this.markerMeshes) {
        const p = (Math.sin(t * 2.2 + m.userData.phase) * 0.5 + 0.5);
        m.scale.setScalar(0.055 + p * 0.018);
        m.material.opacity = 0.55 + p * 0.45;
      }
    }

    this.controls.update();
    this._updateLabels();
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
