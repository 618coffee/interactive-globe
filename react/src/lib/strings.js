// Built-in language bundles for the GlobeUI overlay.
// Hosts can pick one via the `language` prop or override individual keys
// via the `strings` prop on <InteractiveGlobe />.

export const STRINGS = {
  zh: {
    eyebrow:     'Interactive Globe',
    title:       '交互式地球 · 三维可视化',
    view:        '视图',
    lat:         '纬度',
    lon:         '经度',
    distance:    '距离',
    hintLine1:   '拖拽旋转 · 滚轮缩放',
    hintLine2:   '触控板双指捏合',
    loadingText: 'LOADING EARTH',
    reset:       '重置',
    zoomIn:      '放大',
    zoomOut:     '缩小',
    autoRotate:  '自转',
    labels:      '标签',
    poi:         'POI',
    clouds:      '云层',
    atmosphere:  '大气',
    aurora:      '极光',
  },
  en: {
    eyebrow:     'Interactive Globe',
    title:       '3D Earth Visualization',
    view:        'View',
    lat:         'Lat',
    lon:         'Lon',
    distance:    'Distance',
    hintLine1:   'Drag to rotate · Scroll to zoom',
    hintLine2:   'Pinch on trackpad',
    loadingText: 'LOADING EARTH',
    reset:       'Reset',
    zoomIn:      'Zoom in',
    zoomOut:     'Zoom out',
    autoRotate:  'Auto-rotate',
    labels:      'Labels',
    poi:         'POI',
    clouds:      'Clouds',
    atmosphere:  'Atmosphere',
    aurora:      'Aurora',
  },
};

export function resolveStrings(language = 'zh', overrides) {
  const base = STRINGS[language] || STRINGS.zh;
  return overrides ? { ...base, ...overrides } : base;
}

export const DEFAULT_CONTROLS = {
  reset:      true,
  zoomIn:     true,
  zoomOut:    true,
  autoRotate: true,
  labels:     true,
  markers:    true,
  clouds:     true,
  atmosphere: true,
  aurora:     true,
};

export function resolveControls(overrides) {
  if (!overrides) return DEFAULT_CONTROLS;
  const merged = { ...DEFAULT_CONTROLS, ...overrides };
  // Convenience: `controls.zoom` toggles both zoomIn and zoomOut at once
  // (since they almost always travel as a pair). Explicit zoomIn/zoomOut
  // still win — pass `{ zoom: false, zoomIn: true }` to keep only +.
  if ('zoom' in overrides) {
    if (!('zoomIn'  in overrides)) merged.zoomIn  = overrides.zoom;
    if (!('zoomOut' in overrides)) merged.zoomOut = overrides.zoom;
  }
  return merged;
}

// Per-row visibility inside the top-right info card. Omitted keys
// default to `true`. Setting them all to false collapses the card the
// same way `panels.info: false` does.
export const DEFAULT_INFO_CARD = {
  view:     true,
  lat:      true,
  lon:      true,
  distance: true,
  hint:     true,
};

export function resolveInfoCard(overrides) {
  return overrides ? { ...DEFAULT_INFO_CARD, ...overrides } : DEFAULT_INFO_CARD;
}

// Top-level panel visibility. `ui` ('full' | 'minimal' | 'none') sets the
// baseline; the `panels` prop overrides individual entries on top.
const UI_PRESETS = {
  full:    { title: true,  info: true,  bottomBar: true  },
  minimal: { title: false, info: false, bottomBar: true  },
  none:    { title: false, info: false, bottomBar: false },
};

export function resolvePanels(ui = 'full', overrides) {
  const base = UI_PRESETS[ui] || UI_PRESETS.full;
  return overrides ? { ...base, ...overrides } : base;
}
