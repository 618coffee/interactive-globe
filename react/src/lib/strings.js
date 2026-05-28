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
};

export function resolveControls(overrides) {
  return overrides ? { ...DEFAULT_CONTROLS, ...overrides } : DEFAULT_CONTROLS;
}
