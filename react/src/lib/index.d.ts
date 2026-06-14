import type {
  CSSProperties,
  ForwardRefExoticComponent,
  RefAttributes,
} from 'react';

// ----------------------------------------------------------------------------
// Data types
// ----------------------------------------------------------------------------

export interface POI {
  name: string;
  /** Latitude in degrees, -90 to 90 */
  lat: number;
  /** Longitude in degrees, -180 to 180 */
  lon: number;
}

export type LabelType = 'continent' | 'ocean' | 'country' | 'city' | 'mountain';

/**
 * `lod` controls which camera zoom range the label is visible at:
 *   0 = always visible (continents, oceans)
 *   1 = visible while camera distance < 4.5 (countries, seas)
 *   2 = visible while camera distance < 2.5 (mountains, cities)
 *   3 = visible while camera distance < 1.7 (individual peaks)
 */
export interface LabelItem {
  name: string;
  lat: number;
  lon: number;
  type: LabelType;
  lod: 0 | 1 | 2 | 3;
}

export interface GlobeTextures {
  /** Day-side color map (e.g. NASA Blue Marble) */
  day: string;
  /** Specular / water mask */
  spec: string;
  /** Bump / height map */
  bump: string;
  /** Cloud layer alpha map */
  clouds: string;
}

export interface GlobeInfo {
  /** Camera-derived latitude in degrees */
  lat: number;
  /** Camera-derived longitude in degrees */
  lon: number;
  /** Distance from camera to globe center */
  dist: number;
  /** Discrete zoom level for UI display */
  level: 'L0' | 'L1' | 'L2' | 'L3';
}

/** Built-in easing-curve names accepted by {@link FlyToOptions.easing}. */
export type EasingName = 'linear' | 'easeInCubic' | 'easeOutCubic' | 'easeInOutCubic';

/** Options for {@link InteractiveGlobeHandle.flyTo} / {@link GlobeScene.flyTo}. */
export interface FlyToOptions {
  /** Animation duration in milliseconds. Default `900`. */
  durationMs?: number;
  /**
   * Easing curve: a built-in {@link EasingName} or a custom function mapping a
   * normalized time `t` in `[0,1]` to eased progress in `[0,1]`.
   * Default `'easeOutCubic'`.
   */
  easing?: EasingName | ((t: number) => number);
}

// ----------------------------------------------------------------------------
// UI configuration: language + per-button visibility
// ----------------------------------------------------------------------------

/** Built-in language bundle keys, used by both the top panels and the bottom button bar. */
export interface UIStrings {
  eyebrow: string;
  title: string;
  view: string;
  lat: string;
  lon: string;
  distance: string;
  hintLine1: string;
  hintLine2: string;
  loadingText: string;
  reset: string;
  zoomIn: string;
  zoomOut: string;
  autoRotate: string;
  labels: string;
  poi: string;
  clouds: string;
  atmosphere: string;
  aurora: string;
}

export type Language = 'zh' | 'en';

/**
 * Per-button visibility in the bottom bar. Omitted keys default to `true`.
 * Hiding a button does **not** change the underlying scene state — pair it
 * with the matching `show*` prop (or imperative call) if you want to force
 * the layer on/off too.
 */
export interface BottomControlsConfig {
  reset?: boolean;
  /**
   * Convenience: toggles both `zoomIn` and `zoomOut` at once. Explicit
   * `zoomIn` / `zoomOut` keys still win — pass
   * `{ zoom: false, zoomIn: true }` to keep only the `+` button.
   */
  zoom?: boolean;
  zoomIn?: boolean;
  zoomOut?: boolean;
  autoRotate?: boolean;
  labels?: boolean;
  markers?: boolean;
  clouds?: boolean;
  atmosphere?: boolean;
  /** Animated polar-cap aurora rings (65°–78° N/S). */
  aurora?: boolean;
}

/**
 * Top-level panel visibility. Layered on top of the `ui` preset
 * (`'full' | 'minimal' | 'none'`). Omitted keys inherit from the preset.
 */
export interface PanelsConfig {
  /** Top-left title chip. */
  title?: boolean;
  /** Top-right live lat/lon/distance readout. */
  info?: boolean;
  /** Bottom button bar (further filtered by `controls`). */
  bottomBar?: boolean;
}

/**
 * Per-row visibility inside the top-right info card. Omitted keys
 * default to `true`. Setting them all to false collapses the card the
 * same way `panels.info: false` does.
 */
export interface InfoCardConfig {
  /** Top "VIEW / Lx" row. */
  view?: boolean;
  /** Latitude readout. */
  lat?: boolean;
  /** Longitude readout. */
  lon?: boolean;
  /** Camera distance readout. */
  distance?: boolean;
  /** Two-line hint footer ("drag to rotate · scroll to zoom" / "pinch on trackpad"). */
  hint?: boolean;
}

// ----------------------------------------------------------------------------
// Scene class (framework-agnostic)
// ----------------------------------------------------------------------------

export interface GlobeSceneOptions {
  pois?: POI[];
  labels?: LabelItem[];
  autoRotate?: boolean;
  /** Allow wheel/pinch zoom of the camera. Default `true`. Set `false` so page scroll passes through the canvas. */
  enableZoom?: boolean;
  /** Allow pointer-drag rotation of the camera. Default `true`. (`autoRotate` is independent.) */
  enableRotate?: boolean;
  showClouds?: boolean;
  showAtmosphere?: boolean;
  /** Polar-cap aurora rings (animated curtain shader at 65°–78° N/S). */
  showAurora?: boolean;
  showLabels?: boolean;
  showMarkers?: boolean;
  /** Renderer tone-mapping exposure (brightness multiplier). Default 1.4. */
  exposure?: number;
  /** Color theme. `'light'` uses a near-white sky, hides stars/atmosphere/aurora, and draws solid markers. Default `'dark'`. */
  theme?: 'light' | 'dark';
  textures?: Partial<GlobeTextures>;
  onReady?: (scene: GlobeScene) => void;
  onLoad?: () => void;
  onPoiClick?: (poi: POI) => void;
}

/**
 * Framework-agnostic Three.js scene manager.
 *
 * You don't need to construct this directly when using `<InteractiveGlobe />` —
 * but if you want to embed the globe outside React, instantiate this against
 * a `<canvas>` and a labels container.
 */
export class GlobeScene {
  constructor(
    canvas: HTMLCanvasElement,
    labelsEl: HTMLElement,
    options?: GlobeSceneOptions,
  );

  /** Patch any subset of options. Visibility and exposure apply immediately. */
  setOptions(partial: Partial<GlobeSceneOptions>): void;
  setPois(pois: POI[]): void;
  setLabels(labels: LabelItem[]): void;

  reset(): void;
  zoom(factor: number): void;
  /** Smoothly fly the camera to a lat/lon. Disables auto-rotate. */
  flyTo(lat: number, lon: number, distance?: number, opts?: FlyToOptions): void;
  getInfo(): GlobeInfo;

  /** Tear down WebGL context, controls, observers, and label DOM. */
  dispose(): void;
}

// ----------------------------------------------------------------------------
// React component
// ----------------------------------------------------------------------------

export interface InteractiveGlobeHandle {
  reset(): void;
  zoomIn(): void;
  zoomOut(): void;
  flyTo(lat: number, lon: number, dist?: number, opts?: FlyToOptions): void;
  getInfo(): GlobeInfo | undefined;
  getScene(): GlobeScene | null;
}

export interface InteractiveGlobeProps {
  pois?: POI[];
  labels?: LabelItem[];
  /** Coarse preset: `'full'` keeps all chrome, `'minimal'` only the bottom bar, `'none'` strips all UI. */
  ui?: 'full' | 'minimal' | 'none';
  /** Fine-grained panel toggles layered on top of `ui`. Omitted keys inherit from the preset. */
  panels?: PanelsConfig;
  /** Built-in UI language. Default `'zh'`. */
  language?: Language;
  /**
   * Partial overrides for individual UI strings (merged on top of the
   * language bundle). Pass an empty string for a button label to render
   * that button **icon-only** — the icon is always present, the SVG
   * stays the same, and the tooltip falls back to the English bundle
   * so screen readers still get a meaningful name.
   */
  strings?: Partial<UIStrings>;
  /** Per-button visibility in the bottom bar. Omitted keys default to `true`. */
  controls?: BottomControlsConfig;
  /** Per-row visibility inside the top-right info card. Omitted keys default to `true`. */
  infoCard?: InfoCardConfig;
  autoRotate?: boolean;
  /** Allow wheel/pinch zoom of the camera. Default `true`. Set `false` so page scroll passes through the canvas. */
  enableZoom?: boolean;
  /** Allow pointer-drag rotation of the camera. Default `true`. (`autoRotate` is independent.) */
  enableRotate?: boolean;
  showClouds?: boolean;
  showAtmosphere?: boolean;
  /** Polar-cap aurora rings (animated curtain shader at 65°–78° N/S). */
  showAurora?: boolean;
  showLabels?: boolean;
  showMarkers?: boolean;
  /** Renderer tone-mapping exposure (brightness multiplier). Default 1.4. */
  exposure?: number;
  /** Color theme. `'light'` uses a near-white sky, hides stars/atmosphere/aurora, and draws solid markers. Default `'dark'`. */
  theme?: 'light' | 'dark';
  textures?: Partial<GlobeTextures>;
  className?: string;
  style?: CSSProperties;
  onReady?: (scene: GlobeScene) => void;
  onLoad?: () => void;
  onPoiClick?: (poi: POI) => void;
}

export const InteractiveGlobe: ForwardRefExoticComponent<
  InteractiveGlobeProps & RefAttributes<InteractiveGlobeHandle>
>;

// ----------------------------------------------------------------------------
// Default datasets
// ----------------------------------------------------------------------------

export const DEFAULT_POIS: POI[];
export const DEFAULT_LABELS: LabelItem[];

/** Built-in language bundles, keyed by `Language`. */
export const STRINGS: Record<Language, UIStrings>;
