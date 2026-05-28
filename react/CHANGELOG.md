# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/618coffee/interactive-globe/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/618coffee/interactive-globe/releases/tag/v0.2.0
[0.1.0]: https://github.com/618coffee/interactive-globe/releases/tag/v0.1.0
