# interactive-globe-react

Reusable React component for the full-screen interactive 3D Earth from the parent repo.

## Run the example

```pwsh
cd react
npm install
npm run dev
```

Opens http://localhost:5173 with the demo (`src/example/App.jsx`).

## Use in another project

Two ways to consume it.

### A. Local file install (recommended for personal projects)

From your host React project, install this package by path:

```pwsh
npm install file:../path/to/interactive-globe/react
```

Then in your code:

```jsx
import { InteractiveGlobe } from 'interactive-globe-react';
import 'interactive-globe-react/styles.css';

export default function Page() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <InteractiveGlobe />
    </div>
  );
}
```

### B. Copy `src/lib/` into your repo

Drop the `react/src/lib/` directory into your project's `src/` and import the same way:

```jsx
import { InteractiveGlobe } from './lib/index.js';
import './lib/styles.css';
```

You still need `three`, `react`, and `react-dom` in your `package.json`.

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

- Sizing comes from the wrapping element. Put `<InteractiveGlobe />` inside something with explicit `width` and `height`.
- The component opens a WebGL context, a render loop, and DOM nodes inside its wrapper. On unmount it disposes all of them cleanly.
- Default textures load from `unpkg.com` (8K Blue Marble) and `threejs.org` (clouds). For offline/self-hosted use, copy those assets and pass URLs via the `textures` prop.
