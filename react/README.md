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

## Props

All optional.

| Prop             | Type                                  | Default                | Notes |
|------------------|---------------------------------------|------------------------|-------|
| `pois`           | `{ name, lat, lon }[]`                | 30 cities              | Glowing markers on the globe. |
| `labels`         | `{ name, lat, lon, type, lod }[]`     | continents → mountains | `lod` 0–3, smaller = zoom further in to see. |
| `ui`             | `'full' \| 'minimal' \| 'none'`       | `'full'`               | `minimal` keeps only the bottom button bar; `none` strips all chrome. |
| `autoRotate`     | `boolean`                             | `true`                 | |
| `showClouds`     | `boolean`                             | `true`                 | |
| `showAtmosphere` | `boolean`                             | `true`                 | Fresnel atmosphere glow. |
| `showLabels`     | `boolean`                             | `true`                 | |
| `showMarkers`    | `boolean`                             | `true`                 | |
| `exposure`       | `number`                              | `1.4`                  | Renderer tone-mapping exposure (brightness). |
| `textures`       | `{ day, spec, bump, clouds }`         | 8K Blue Marble set     | URL overrides. |
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
| `flyTo(lat, lon, dist?)`              | Animate camera to a lat/lon at the given distance (default 1.8). Disables auto-rotate. |
| `getInfo()`                           | Returns `{ lat, lon, dist, level }` for the current camera. |
| `getScene()`                          | Returns the underlying `GlobeScene` instance for advanced use. |

## Notes

- The component opens a WebGL context, a render loop, and DOM nodes inside its wrapper. On unmount it disposes all of them cleanly (safe inside React StrictMode and routed pages).
- Default textures load from `unpkg.com` (8K Blue Marble) and `threejs.org` (clouds). For offline / self-hosted use, copy those assets and pass URLs via the `textures` prop.
- Sizing is tracked with `ResizeObserver`, so the canvas reflows correctly when its container resizes (not just on window resize).

---

## Development

```pwsh
cd react
npm install
npm run dev          # runs the Vite example app at http://localhost:5173
```

`src/example/App.jsx` demos `flyTo()` and `onPoiClick`.

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
