# @618coffee/interactive-globe

Full-screen interactive 3D Earth as a drop-in React component. Three.js renders the surface from real Blue Marble textures (8K), with animated POI markers, LOD geographic labels, and a dark glass-morphism control bar.

## Install

```pwsh
npm install @618coffee/interactive-globe three
```

`react`, `react-dom`, and `three` are peer dependencies — the host project provides them. TypeScript declarations ship in the package; no `@types/...` install needed.

## Use it

```jsx
import { InteractiveGlobe } from '@618coffee/interactive-globe';
import '@618coffee/interactive-globe/styles.css';

export default function Page() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <InteractiveGlobe />
    </div>
  );
}
```

The component fills its parent — wrap it in something with an explicit width and height.

### English UI, only a subset of buttons

```jsx
<InteractiveGlobe
  language="en"
  controls={{ atmosphere: false, clouds: false }}   // hide those two toggles
/>
```

### Custom string overrides on top of a built-in language

```jsx
<InteractiveGlobe
  language="en"
  strings={{ title: 'Mission Globe', reset: 'Recenter' }}
/>
```

### Hide the top panels, keep only the button bar (no text on buttons)

```jsx
<InteractiveGlobe
  panels={{ title: false, info: false }}             // hide top-left + top-right cards
  strings={{                                          // empty string => icon-only
    reset: '', zoomIn: '', zoomOut: '',
    autoRotate: '', labels: '', poi: '', clouds: '', atmosphere: '',
  }}
/>
```

## Props

All optional.

| Prop             | Type                                  | Default                | Notes |
|------------------|---------------------------------------|------------------------|-------|
| `pois`           | `{ name, lat, lon }[]`                | 30 cities              | Glowing markers on the globe. |
| `labels`         | `{ name, lat, lon, type, lod }[]`     | continents → mountains | `lod` 0–3, smaller = zoom further in to see. |
| `ui`             | `'full' \| 'minimal' \| 'none'`       | `'full'`               | Preset: `minimal` keeps only the bottom button bar; `none` strips all chrome. |
| `panels`         | `{ title?, info?, bottomBar? }`       |                        | Fine-grained overrides on top of `ui`. Omitted keys inherit from the preset. |
| `language`       | `'zh' \| 'en'`                        | `'zh'`                 | Built-in UI language. |
| `strings`        | `Partial<UIStrings>`                  |                        | Override specific UI strings on top of the language bundle. Pass an empty string for a button label to render it **icon-only** (icon always shows; tooltip falls back to English). |
| `controls`       | `{ reset, zoom, zoomIn, zoomOut, autoRotate, labels, markers, clouds, atmosphere, aurora }` (all booleans) | all `true` | Per-button visibility in the bottom bar. Omitted keys default to `true`. `zoom` is a convenience that toggles both `zoomIn` and `zoomOut` at once; explicit `zoomIn` / `zoomOut` still win. Hiding a button does **not** change scene state — pair with `showLabels` / `showClouds` etc. if you want the underlying layer off too. |
| `infoCard`       | `{ view, lat, lon, distance, hint }` (all booleans) | all `true` | Per-row visibility inside the top-right info card. Hiding every row collapses the card entirely (same effect as `panels.info: false`). |
| `autoRotate`     | `boolean`                             | `true`                 | |
| `enableZoom`     | `boolean`                             | `true`                 | Wheel/pinch zoom of the camera. Set `false` so page scroll passes through the canvas instead of zooming the globe. |
| `enableRotate`   | `boolean`                             | `true`                 | Pointer-drag rotation. Independent of `autoRotate` — set `false` to lock manual rotation while keeping the idle spin. |
| `showClouds`     | `boolean`                             | `true`                 | |
| `showAtmosphere` | `boolean`                             | `true`                 | Fresnel atmosphere glow. |
| `showAurora`     | `boolean`                             | `true`                 | Animated polar-cap aurora rings (65°–78° N/S). Independent of `showAtmosphere`. |
| `showLabels`     | `boolean`                             | `true`                 | |
| `showMarkers`    | `boolean`                             | `true`                 | |
| `exposure`       | `number`                              | `1.4`                  | Renderer tone-mapping exposure (brightness). |
| `textures`       | `{ day, spec, bump, clouds }`         | 8K Blue Marble set     | URL overrides. |
| `initialView`    | `{ lat, lon }`                        |                        | Start centered on this point on the first frame (both modes). Pass the outgoing globe's `getInfo()` here for a jump-free rotation handoff across a theme/mode switch. |
| `showLoader`     | `boolean`                             | `true`                 | Built-in loading overlay. Set `false` to suppress it (e.g. when cross-fading from a previously rendered globe). |
| `idleTiltDeg`    | `number`                              | `12`                   | Latitude shown at the disc centre while auto-rotating (both modes). |
| `spinDegPerSec`  | `number`                              | `6`                    | Auto-rotation speed in degrees/second (both modes, frame-rate independent). |
| `cameraFov`      | `number`                              | `45`                   | Perspective field-of-view in degrees (webgl only). Lower = flatter, toward the flat globe's orthographic look. |
| `className`      | `string`                              |                        | Forwarded to the wrapper. |
| `style`          | `CSSProperties`                       |                        | Forwarded to the wrapper. |
| `onReady`        | `(api) => void`                       |                        | Fires once scene is constructed. |
| `onLoad`         | `() => void`                          |                        | Fires once textures finish loading. |
| `onPoiClick`     | `(poi) => void`                       |                        | Fires on marker click. |

## Imperative API

Forward a ref to call methods on the globe:

```jsx
const globe = useRef(null);

<InteractiveGlobe ref={globe} />
<button onClick={() => globe.current?.flyTo(35.6762, 139.6503, 1.7)}>
  Fly to Tokyo
</button>
```

| Method                                | Description |
|---------------------------------------|-------------|
| `reset()`                             | Animate camera back to the default view. |
| `zoomIn()` / `zoomOut()`              | Smoothly step the dolly distance. |
| `flyTo(lat, lon, dist?, opts?)`       | Animate camera to a lat/lon at the given distance (default 1.8). Disables auto-rotate. `opts` = `{ durationMs?, easing? }` — `durationMs` defaults to 900; `easing` is `'linear' \| 'easeInCubic' \| 'easeOutCubic' \| 'easeInOutCubic'` or a custom `(t) => number` (default `'easeOutCubic'`). |
| `getInfo()`                           | Returns `{ lat, lon, dist, level }` for the current camera. |
| `getScene()`                          | Returns the underlying `GlobeScene` instance for advanced use. |

```jsx
// Slow, cinematic ease-in-out fly
globe.current?.flyTo(31.2990, 120.5853, 1.7, { durationMs: 2600, easing: 'easeInOutCubic' });
```

## Notes

- The component opens a WebGL context, a render loop, and DOM nodes inside its wrapper. On unmount it disposes all of them cleanly (safe inside React StrictMode and routed pages).
- The default day map is a real NASA Blue Marble Next Gen texture (8192×4096) and the clouds are a NASA composite (2048×1024), both served with CORS via jsDelivr from this repo; the water/topology masks load from `unpkg.com`. For offline / self-hosted use, copy those assets and pass URLs via the `textures` prop.
- Sizing is tracked with `ResizeObserver`, so the canvas reflows correctly when its container resizes (not just on window resize).

---

## Development

```pwsh
cd react
npm install
npm run dev          # runs the Vite example app at http://localhost:5173
npm test             # vitest watch mode
npm run test:ci      # single run, used by CI + prepublishOnly
```

`src/example/App.jsx` demos `flyTo()` and `onPoiClick`.

## Testing

Unit + UI tests live next to the source in `src/lib/__tests__/`. They run
in jsdom with `GlobeScene` mocked so they're fast and don't need WebGL.

What's covered:

- **`strings.test.js`** — `resolveStrings` / `resolveControls` / `resolvePanels`
  merge semantics; empty-string preservation for icon-only intent.
- **`InteractiveGlobe.test.jsx`** — every prop combination from v0.2.0 /
  v0.3.0: language switching, per-key string overrides, icon-only button
  mode (including a11y fallback), per-button `controls`, divider collapse
  rules, `panels` layered on top of `ui` presets, toggle button click
  behavior, imperative ref API (`flyTo`, `reset`, `zoomIn/Out`,
  `getInfo`), and lifecycle callbacks (`onReady`, `onLoad`, `onPoiClick`).

Tests run on every push via [.github/workflows/ci.yml](../.github/workflows/ci.yml)
and gate the release flow (`prepublishOnly` runs `test:ci` before build).

## Publishing to npm

The package builds from `react/src/lib/` into `react/dist/` via Vite library mode. `react`, `react-dom`, and `three` stay external as peer dependencies.

### Automated (GitHub Actions)

Push a version tag and CI handles the rest:

```pwsh
cd react
npm version patch          # bumps package.json + commits + creates tag
git push --follow-tags     # triggers .github/workflows/release.yml
```

The workflow installs deps, runs `npm run build`, verifies the tarball, and publishes with [npm provenance](https://docs.npmjs.com/generating-provenance-statements) (signed attestation linking the package to this exact commit).

One-time setup: add an `NPM_TOKEN` secret to the GitHub repo
(Settings → Secrets and variables → Actions → New repository secret).
Generate the token at https://www.npmjs.com/settings/<your-account>/tokens with type **Automation**.

### Manual

```pwsh
cd react
npm run build              # emits dist/index.{mjs,cjs,d.ts} + dist/styles.css
npm pack --dry-run         # lists what would be uploaded
npm login                  # one-time
npm publish                # publishConfig.access=public is already set
```

The `prepublishOnly` script runs `npm run build` automatically, so `dist/` is always fresh.

**Publish is effectively irreversible.** You can't unpublish after 72 hours, and the `name@version` is permanently reserved. Use `npm pack --dry-run` to verify the tarball contents first.
