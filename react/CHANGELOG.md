# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.15.0] - 2026-06-21

### Removed
- **`projection` and `cameraFov` props (BREAKING).** The webgl globe is now always
  **orthographic** (parallel projection), matching the flat D3 `geoOrthographic` globe, so
  the perspective camera, its FOV control, the perspective `_applyFit` distance branch, and
  the projection-aware atmosphere intensity are gone. Callers passing `projection` /
  `cameraFov` should drop them (the globe already rendered orthographic in practice).

### Changed
- **Marker dots are larger and more opaque** so the webgl pins read as crisp, flat-comparable
  dots over a bright day-map: render-loop base scale `0.40` (was `0.46`) and opacity floor
  `0.9` (was `0.78`).

## [0.14.4] - 2026-06-20

### Fixed
- **WebGL markers were invisible on bright day-map globes.** The webgl marker sprite was a
  thin ring + faint radial glow scaled to `~0.06 * 0.055` world units (sub-pixel at typical
  globe sizes), so place pins were effectively invisible in webgl/dark mode — only the flat
  (light) renderer showed them. The sprite is now a **solid filled dot** (with a soft glow
  halo) and the base scale is `0.46` (was `0.055`), so markers render as crisp, flat-comparable
  dots. Marker opacity floor raised to `0.78`.

### Added
- **`themeColors.marker.blending`** (`'normal' | 'additive'`) is now an overridable per-call
  field (previously fixed to the theme preset). The dark theme still defaults to `'additive'`
  (glows nicely on a night globe); pass `'normal'` for solid, opaque pins on a bright day-map
  texture.

## [0.14.3] - 2026-06-20

### Added
- **`markerSize` prop** (`GlobeSceneOptions.markerSize` + `InteractiveGlobeProps.markerSize`)
  — a marker dot size multiplier (`1` = the current default, `<1` = smaller). Applies to
  both modes: webgl scales the marker sprite (`scale.setScalar((0.055 + p*0.018) * markerSize)`)
  and flat scales the city dot + halo radii (`r = 3.5 / 15 * markerSize`). Reactive. Lets
  callers shrink dense marker clusters so nearby pins don't overlap.

## [0.14.2] - 2026-06-18

### Fixed
- **Atmosphere halo too bright under `projection: 'orthographic'`.** The rim-glow
  shader approximates the silhouette with a constant view direction (`(0,0,1)`, a
  parallel-projection assumption). Under a perspective camera the true silhouette
  never reached `dot==0`, so the visible rim peaked well below the shader's `0.6`
  factor; orthographic made that assumption exact and exposed the full-strength
  halo. The orthographic glow intensity is now scaled down (to `0.18`) so the
  atmosphere reads as a soft rim instead of a hard ring. Perspective is unchanged.

## [0.14.1] - 2026-06-18

### Added
- **`projection` prop (`'perspective' | 'orthographic'`, default `'perspective'`,
  webgl only).** `'orthographic'` renders the webgl globe with a parallel
  projection — no perspective bulge — matching the flat globe's look. It's sized via
  the orthographic frustum, so the on-screen radius still honours `fit`.

## [0.14.0] - 2026-06-18

### Added
- **`idleTiltDeg`, `spinDegPerSec`, and `cameraFov` props** to tune the globe's
  look without forking the package. `idleTiltDeg` (default `12`) is the latitude
  shown at the disc centre while auto-rotating (both modes); `spinDegPerSec`
  (default `6`) is the auto-rotation speed (both modes, frame-rate independent);
  `cameraFov` (default `45`, webgl only) is the perspective field-of-view — lower
  values flatten the perspective toward the flat globe's orthographic look. All
  three are reactive (change them live via a re-render / `setOptions`).

## [0.13.3] - 2026-06-18

### Fixed
- **The webgl globe's idle auto-rotation now matches the flat globe's speed and
  is frame-rate independent.** It spun ~4.2 deg/s on a 120Hz display (and ~2.1 deg/s
  on 60Hz) because `controls.update()` ran without a delta time, while the flat
  globe spins a steady 6 deg/s. The loop now passes the frame delta to
  `controls.update(dt)` and `autoRotateSpeed` is set so both modes rotate at
  6 deg/s on any display.

## [0.13.2] - 2026-06-18

### Changed
- **The webgl globe's idle auto-rotation tilt now matches the flat globe.** The
  default camera sat at a ~5.7° elevation while the flat globe idles at a 12°
  tilt (`IDLE_TILT`), so the two renderers spun at visibly different axial tilts.
  The webgl camera now starts at the same 12° centre latitude (`reset()` too).

## [0.13.1] - 2026-06-18

### Fixed
- **`getInfo()` reported a longitude 90° east of the actual centered point.** It
  now exactly inverts the marker / `flyTo` / `initialView` placement
  (`latLonToVec3`), so reading `getInfo()` and feeding it straight back as
  `initialView` — e.g. handing rotation from one globe to the next across a
  theme/mode switch — keeps the longitude instead of drifting ~90° on every
  `webgl`→`flat` handoff. The lat/lon↔vector math is centralized in
  `camera-math.js` (`latLonToCoords` / `vec3ToLatLon`) with a round-trip test.

## [0.13.0] - 2026-06-18

### Added
- **`initialView` prop (`{ lat, lon }`).** Starts the globe centered on a given
  geographic point on its first frame, in both modes (webgl camera placement /
  flat projection rotation). Lets a freshly-mounted globe inherit the rotation of
  a previous one — e.g. read `getInfo()` from the outgoing globe before a theme
  switch and pass it as `initialView` to the incoming one for a seamless,
  jump-free handoff. Omitted ⇒ the previous default (first POI / fixed angle).
- **`showLoader` prop (`boolean`, default `true`).** Set `false` to suppress the
  built-in loading overlay (e.g. when the host cross-fades from a previously
  rendered globe and doesn't want a spinner flashing during the swap).

## [0.12.1] - 2026-06-18

### Fixed
- **`flyTo` no longer appears to zoom during a same-distance rotation.** The
  camera tween interpolated position linearly, so the straight chord between two
  equidistant points dipped inward mid-flight (an apparent zoom-in, then out).
  `flyTo` now follows a constant-radius arc (slerp the direction, lerp the
  radius), so a distance-less `flyTo` is a true pure rotation. `reset` / `zoom`
  are unchanged.

## [0.12.0] - 2026-06-18

### Added
- **`mode` prop (`'webgl' | 'flat'`, default `'webgl'`).** A second globe
  renderer: `'flat'` is a lazy-loaded D3 `geoOrthographic` SVG globe — a warm
  "paper map" with a graticule, world country outlines, and the `pois` rendered
  as dots (the most-recently `flyTo`'d POI highlights amber with a label). It
  honours `theme` (warm paper in light), `graticule.spacing`, `showMarkers`,
  `showLabels`, and `autoRotate` (slow idle spin). Its d3 + world-atlas payload
  only loads when flat mode is actually used. Backward compatible (default webgl).
- **`fit` prop (`{ wRatio?, hRatio? }`).** Sizes the globe so its on-screen
  radius is `min(wRatio·w, hRatio·h)` px, applied to **both** modes (webgl camera
  distance / flat projection scale) so they render at the same size. New exported
  `FitConfig` type.

### Changed
- **`flyTo(lat, lon)` with no `distance` now keeps the current camera distance**
  — a pure rotation with no zoom change (pass an explicit `distance` to also
  zoom, as before). Makes city-to-city tours rotate in place.

## [0.11.1] - 2026-06-14

### Improved
- **Theme switching now transitions smoothly** instead of hard-cutting visual
  layers. During light/dark changes, the sky background, stars, atmosphere, and
  aurora now animate over ~560ms with eased interpolation, matching host-site
  theme cadence more closely.
- **Earth surface map swaps now cross-fade** on theme texture changes, so
  switching between antique/light and Blue Marble/dark looks less abrupt.

## [0.11.0] - 2026-06-14

### Added
- **`graticule` prop** (`{ show?, spacing?, color?, opacity? }`, default off):
  a parametric lat/lon grid overlay drawn on the globe surface with
  screen-space-constant line width, so it stays crisp at any zoom. Backward
  compatible — consumers that don't pass `graticule` are unchanged. New exported
  `GraticuleConfig` type; new key on `GlobeSceneOptions` and `InteractiveGlobeProps`.

### Fixed
- **`textures` now updates live, smoothly.** Previously the surface textures were
  only applied at scene construction, so changing the `textures` prop after mount
  (e.g. swapping a vintage day map in/out on a theme toggle) had no effect. The
  scene now reloads textures on `setOptions({ textures })` and caches decoded
  textures by URL: the first switch to a given map loads it once, and every
  later switch back is a synchronous reference swap — same frame as the rest of
  the theme change, with no re-decode, re-upload, or jank. A map is only
  reassigned when its URL actually changes, so unchanged layers are free.
  Clearing the prop reverts to the built-in Blue Marble set.

## [0.10.0] - 2026-06-14

### Added
- **`themeColors` prop** (and `GlobeSceneOptions.themeColors`) for caller-provided
  color overrides merged on top of the active `theme` preset:
  `{ background?: number | string, marker?: { color?, highlight?, core? } }`.
  Lets consumers pick exact sky / marker colors (e.g. a warm `#f4efe7` paper
  sky) without the package shipping a catalog of style presets — the package
  keeps one preset per theme and the caller passes the palette. Semantic choices
  (which layers are visible, marker blending) stay tied to `theme`. Forwards live
  through `setOptions`; the wrapper diffs overrides by value so an inline object
  literal doesn't rebuild the marker texture every render. New exported
  `ThemeColors` type. `resolveTheme(theme, overrides)` gains the merge argument.

### Notes
- 4 new resolver tests (override merge, back-compat, no-mutation) and 3 new
  wrapper tests (initial forward, live change, value-equal no-op).

## [0.9.0] - 2026-06-13

### Added
- **`theme` prop** (`'light' | 'dark'`, default `'dark'`) on `<InteractiveGlobe>`
  and `GlobeSceneOptions`. `theme="light"` renders a near-white sky (`#f9fafb`),
  hides the starfield, atmosphere glow, and aurora (all additive-blended and so
  invisible on a light background), draws solid coffee-accent (`#a67c52`)
  markers, and switches labels/loader/chrome to dark-on-light via
  `data-theme="light"` on `.ig-root`. Forwards live through `setOptions`. Dark
  is unchanged and remains the default. New pure `resolveTheme()` resolver.

### Notes
- New `theme.js` resolver with 3 unit tests; 3 new wrapper tests (default dark,
  light forwarding, live switch).

## [0.8.0] - 2026-06-13

### Added
- **`enableZoom` / `enableRotate` props** (both default `true`). `enableZoom={false}`
  disables wheel/pinch zoom so page scroll passes through the canvas instead of
  zooming the globe; `enableRotate={false}` locks pointer-drag rotation while
  leaving `autoRotate` and `flyTo` untouched. Both forward live through
  `setOptions` and are mirrored on `GlobeScene` (`OrbitControls.enableZoom` /
  `.enableRotate`). New keys on `GlobeSceneOptions` and `InteractiveGlobeProps`.

### Notes
- 4 new tests: constructor forwarding (on + default), live `setOptions`
  forwarding.

## [0.7.0] - 2026-06-13

### Added
- **`flyTo` easing + duration.** `flyTo(lat, lon, distance?, opts?)` now takes an
  optional `opts` object: `durationMs` (default `900`) and `easing` — one of
  `'linear' | 'easeInCubic' | 'easeOutCubic' | 'easeInOutCubic'` or a custom
  `(t: number) => number`. Defaults reproduce the previous behavior (900 ms,
  ease-out-cubic), so existing callers are unaffected. New `EasingName` and
  `FlyToOptions` types are exported.

### Changed
- **High-res default day map.** `DEFAULT_TEXTURES.day` now points at the real
  NASA Blue Marble Next Gen texture (8192×4096) and `DEFAULT_TEXTURES.clouds` at
  a NASA cloud composite (2048×1024), both committed in this repo and served
  with CORS via jsDelivr-gh. The previous default was the ~2K three-globe
  example image. Water/topology masks are unchanged. Pass the `textures` prop to
  override (e.g. a smaller day map on memory-constrained devices).

### Notes
- `_tween` takes an easing function; `reset()` and `zoom()` keep ease-out-cubic.
- 1 new test: `flyTo` forwards `{ durationMs, easing }` through the React handle.

## [0.6.0] - 2026-05-28

### Added
- **Polar aurora rings.** Two annular bands of sphere geometry hover
  just above the surface at **65°–78° N and S** (the real auroral oval),
  driven by a custom GLSL shader: two-octave fBm noise sharpened into
  curtain-like vertical streaks, drifting around the pole by `uTime`.
  Vertical color drift from oxygen-green (`0x3affb0`) at the
  equatorward edge to a warm pink-red (`0xff6da8`) at the poleward
  edge. Sin-shaped width envelope so the band fades smoothly into the
  sky on both sides. Additive blending.
- **`showAurora` prop** — boolean, default `true`. Aurora visibility is
  decoupled from `showAtmosphere`; flipping the atmosphere off no
  longer also hides the aurora.
- **`controls.aurora`** — adds a dedicated `极光 / Aurora` button to the
  bottom bar with a curtain-shaped icon. Same rules as the other
  per-button keys: omitted = `true`, hide entirely with
  `controls={{ aurora: false }}`.
- **`UIStrings.aurora`** in both `zh` ("极光") and `en` ("Aurora")
  bundles, so the new button picks up the chosen language.

### Notes
- 2 new tests: clicking the aurora toggle forwards
  `setOptions({ showAurora: false })` into the scene, and
  `showAurora={false}` is reflected on the scene constructor options.
  67 tests total.
- Default button count is now 9 (existing "all buttons" assertion
  updated accordingly).
- Example app exposes the new toggle alongside the other six
  bottom-bar buttons.

## [0.5.1] - 2026-05-28

### Changed
- **Oceans no longer read as near-black at the default exposure.** The
  Blue Marble texture's water pixels absorb more light than land, so at
  the same tone-mapping exposure oceans always looked darker than the
  surrounding continents. Reusing the existing water mask (`specTex`)
  as an `emissiveMap` with a deep-blue `emissive` color
  (`0x12365c`, intensity 0.55) gives ocean pixels a small self-light
  contribution; land pixels are zero in the mask, so continents are
  unchanged. No new prop, no API surface affected.

## [0.5.0] - 2026-05-28

### Added
- **`controls.zoom` convenience key** — sets both `zoomIn` and `zoomOut`
  in one shot, since the two almost always travel together. Explicit
  `zoomIn` / `zoomOut` still win when present, so e.g.
  `controls={{ zoom: false, zoomIn: true }}` keeps only the `+` button.
- Example app now has a **"底栏按钮 / Bottom bar buttons"** group with
  seven checkboxes — reset, zoom (combined), auto-rotate, labels, POI,
  clouds, atmosphere — so every bottom-bar button is live-toggleable.
  (Per-button visibility was always supported via `controls`; this just
  surfaces it in the demo.)

### Notes
- 3 new tests around `controls.zoom`: convenience-toggles-both, explicit
  zoomIn/zoomOut precedence, and end-to-end DOM assertion that both
  buttons disappear when `controls={{ zoom: false }}`. 65 tests total.
- All-controls-false still collapses the whole bottom bar (existing
  behavior, covered by an existing test).

## [0.4.0] - 2026-05-28

### Added
- **`infoCard` prop** — per-row visibility inside the top-right info card.
  Same shape as `controls`: `{ view, lat, lon, distance, hint }` booleans,
  omitted keys default to `true`. Setting every row to `false` collapses
  the card the same way `panels.info: false` does. `panels.info: false`
  still wins as a coarse switch — `infoCard` is only consulted while the
  card itself is showing.
- Hint footer auto-strips its top divider when every row above it is
  hidden (so a hint-only card doesn't render an orphaned border).
- Example app exposes a new "Info card rows" group with five checkboxes
  so you can see each row toggle live.

### Notes
- New `InfoCardConfig` exported from the type declarations.
- 8 new tests cover row-level visibility, full-card collapse, hint-only
  rendering, and `panels.info: false` precedence (62 tests total).

## [0.3.1] - 2026-05-28

### Fixed
- **Blank-screen crash when mounting `<InteractiveGlobe />` without the
  `textures` prop** (latent since 0.1.0). The component was passing
  `textures: undefined` into `GlobeScene`'s options spread, which wiped
  the constructor's `DEFAULT_TEXTURES` baseline. `_initEarth` then
  threw `Cannot read properties of undefined (reading 'day')` and the
  whole React tree unmounted. Two-sided fix:
  - `InteractiveGlobe` only includes `textures` in the scene options
    when the prop is actually set.
  - `GlobeScene` resolves `textures` *after* the spread and merges
    incoming texture URLs on top of `DEFAULT_TEXTURES`, so a partial
    `textures={{ day: '...' }}` now only overrides `day` and inherits
    the rest. (Previously it would have ended up with only `day`.)
- The unit tests didn't catch this because `GlobeScene` was mocked.
  Added two regression tests asserting (a) `textures` is omitted from
  scene options when the prop is absent and (b) it is forwarded
  verbatim when present.

### Added
- Vitest + React Testing Library suite covering every prop combination
  introduced in 0.2.0 / 0.3.0 (language, strings overrides, icon-only
  buttons, `controls` per-button visibility, `panels` layered on `ui`,
  toggle clicks, imperative ref API, lifecycle callbacks). 54 tests,
  jsdom, GlobeScene mocked so no WebGL is required.
- `npm run test:ci` script; `prepublishOnly` now runs tests **before**
  the library build, so a regression blocks publish.
- `.github/workflows/ci.yml` runs the suite on every push / PR to main.
- `.github/workflows/release.yml` runs the suite before publish too,
  matching the local `prepublishOnly` gate.
- `scripts/inspect-page.mjs` — Playwright-based smoke probe that loads
  the dev server, captures console + page errors + failed requests,
  and screenshots the result. Used to find the bug above (which the
  jsdom-based unit tests couldn't see).

## [0.3.0] - 2026-05-28

### Added
- **`panels` prop** for granular control over the three UI panels
  (`title`, `info`, `bottomBar`). Layered on top of the existing `ui`
  preset — omitted keys inherit from the preset. So e.g.
  `ui="full" panels={{ info: false }}` keeps the title chip and the
  bottom bar but hides the live lat/lon readout.
- **Icon-only button mode.** Passing an empty string for any button
  label in `strings` renders that button icon-only (the icon stays,
  the text span is omitted, padding tightens). The `title` and
  `aria-label` attributes fall back to the English bundle so the
  button remains accessible.

### Fixed
- Bottom-bar button labels containing CJK characters could wrap to
  multiple lines on narrow buttons (e.g. 重置 stacking each character
  vertically). Added `white-space: nowrap` + `flex: 0 0 auto` to
  `.ig-btn`.

## [0.2.0] - 2026-05-28

### Added
- **`language` prop** (`'zh' | 'en'`, default `'zh'`) selects the bundled UI
  language. English bundle ships alongside the existing Chinese one.
- **`strings` prop** accepts a `Partial<UIStrings>` for fine-grained text
  overrides on top of the chosen language.
- **`controls` prop** controls per-button visibility in the bottom bar:
  `{ reset, zoomIn, zoomOut, autoRotate, labels, markers, clouds, atmosphere }`.
  Omitted keys default to `true`. The action / toggle divider auto-collapses
  when one side is fully hidden.
- Exported `STRINGS` constant so hosts can read the built-in bundles
  directly (e.g. to seed a partial `strings` override).

### Notes
- Hiding a control button does **not** change the underlying scene state.
  Pair `controls.labels: false` with `showLabels={false}` if you also want
  the labels themselves off.

## [0.1.0] - 2026-05-28

### Added
- `<InteractiveGlobe />` React component with `forwardRef` imperative handle
  (`reset`, `zoomIn`, `zoomOut`, `flyTo`, `getInfo`, `getScene`).
- Framework-agnostic `GlobeScene` class exposing the same operations for
  non-React hosts.
- Three.js scene rendering an 8K NASA Blue Marble Earth (day / specular /
  bump) on a 128×128 sphere with a cloud layer and a back-side Fresnel
  atmosphere shader.
- Camera-tracked sun lighting so the visible hemisphere is always lit while
  preserving ocean specular and bump-map relief.
- 30 default POIs rendered as flat-on-surface, pulsing concentric-ring
  markers; clickable via `onPoiClick`.
- Default geographic label set across four LOD bands: continents/oceans
  always visible, countries/seas at `dist < 4.5`, mountains/cities at
  `dist < 2.5`, individual peaks at `dist < 1.7`.
- Glass-morphism UI overlay with title chip, live lat/lon/distance/zoom
  readout, and a bottom button bar (reset, zoom, auto-rotate, labels, POI,
  clouds, atmosphere). Bundled but toggleable via `ui="full" | "minimal" |
  "none"`.
- Star-field backdrop (4500 procedurally placed points).
- `ResizeObserver`-backed sizing so the canvas reflows when its container
  resizes, not just the window.
- Full cleanup on unmount (WebGL context, controls, observers, label DOM).
- Hand-written TypeScript declarations (`index.d.ts`).
- MIT license.

[Unreleased]: https://github.com/618coffee/interactive-globe/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/618coffee/interactive-globe/releases/tag/v0.6.0
[0.5.1]: https://github.com/618coffee/interactive-globe/releases/tag/v0.5.1
[0.5.0]: https://github.com/618coffee/interactive-globe/releases/tag/v0.5.0
[0.4.0]: https://github.com/618coffee/interactive-globe/releases/tag/v0.4.0
[0.3.1]: https://github.com/618coffee/interactive-globe/releases/tag/v0.3.1
[0.3.0]: https://github.com/618coffee/interactive-globe/releases/tag/v0.3.0
[0.2.0]: https://github.com/618coffee/interactive-globe/releases/tag/v0.2.0
[0.1.0]: https://github.com/618coffee/interactive-globe/releases/tag/v0.1.0
