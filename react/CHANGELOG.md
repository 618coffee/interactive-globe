# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/618coffee/interactive-globe/compare/v0.3.1...HEAD
[0.3.1]: https://github.com/618coffee/interactive-globe/releases/tag/v0.3.1
[0.3.0]: https://github.com/618coffee/interactive-globe/releases/tag/v0.3.0
[0.2.0]: https://github.com/618coffee/interactive-globe/releases/tag/v0.2.0
[0.1.0]: https://github.com/618coffee/interactive-globe/releases/tag/v0.1.0
