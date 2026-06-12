import { useRef, useState } from 'react';
import { InteractiveGlobe } from '../lib/index.js';
import './example.css';

const SPOTS = [
  { name: { zh: '北京',       en: 'Beijing'      }, lat: 39.9042, lon: 116.4074 },
  { name: { zh: '伦敦',       en: 'London'       }, lat: 51.5074, lon: -0.1278  },
  { name: { zh: '纽约',       en: 'New York'     }, lat: 40.7128, lon: -74.0060 },
  { name: { zh: '悉尼',       en: 'Sydney'       }, lat: -33.87,  lon: 151.21   },
  { name: { zh: '里约',       en: 'Rio'          }, lat: -22.91,  lon: -43.17   },
];

// Empty-string entries make the matching button render icon-only.
const ICON_ONLY_OVERRIDES = {
  reset: '', zoomIn: '', zoomOut: '',
  autoRotate: '', labels: '', poi: '', clouds: '', atmosphere: '',
};

export default function App() {
  const globe = useRef(null);
  const [lastClick, setLastClick] = useState(null);

  const [language,   setLanguage]   = useState('zh');     // 'zh' | 'en'
  const [showTitle,  setShowTitle]  = useState(true);
  const [showInfo,   setShowInfo]   = useState(true);
  const [showBar,    setShowBar]    = useState(true);
  const [iconOnly,   setIconOnly]   = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  // Per-row visibility inside the top-right info card
  const [showView, setShowView]         = useState(true);
  const [showLat,  setShowLat]          = useState(true);
  const [showLon,  setShowLon]          = useState(true);
  const [showDist, setShowDist]         = useState(true);
  const [showHint, setShowHint]         = useState(true);

  // Per-button visibility in the bottom bar
  const [btnReset,      setBtnReset]      = useState(true);
  const [btnZoom,       setBtnZoom]       = useState(true);   // controls both + and −
  const [btnAutoRotate, setBtnAutoRotate] = useState(true);
  const [btnLabels,     setBtnLabels]     = useState(true);
  const [btnMarkers,    setBtnMarkers]    = useState(true);
  const [btnClouds,     setBtnClouds]     = useState(true);
  const [btnAtmos,      setBtnAtmos]      = useState(true);
  const [btnAurora,     setBtnAurora]     = useState(true);

  const labels = {
    zh: { title: '配置 · 实时切换', flyTo: '飞往', clicked: '已选 POI', langLabel: '语言',
          panelsLabel: '面板', iconOnlyLabel: '按钮仅图标', autoLabel: '自动旋转',
          title_t: '标题', info_t: '信息卡', bar_t: '底栏',
          infoRowsLabel: '信息卡内容',
          view_r: '视图', lat_r: '纬度', lon_r: '经度', dist_r: '距离', hint_r: '提示',
          barButtonsLabel: '底栏按钮',
          b_reset: '重置', b_zoom: '缩放', b_auto: '自转', b_labels: '标签',
          b_poi: 'POI', b_clouds: '云层', b_atmos: '大气', b_aurora: '极光' },
    en: { title: 'Config · live toggles',  flyTo: 'Fly to', clicked: 'Clicked POI', langLabel: 'Language',
          panelsLabel: 'Panels', iconOnlyLabel: 'Icon-only buttons', autoLabel: 'Auto-rotate',
          title_t: 'Title', info_t: 'Info card', bar_t: 'Bottom bar',
          infoRowsLabel: 'Info card rows',
          view_r: 'View', lat_r: 'Lat', lon_r: 'Lon', dist_r: 'Distance', hint_r: 'Hint',
          barButtonsLabel: 'Bottom bar buttons',
          b_reset: 'Reset', b_zoom: 'Zoom', b_auto: 'Auto-rotate', b_labels: 'Labels',
          b_poi: 'POI', b_clouds: 'Clouds', b_atmos: 'Atmosphere', b_aurora: 'Aurora' },
  }[language];

  return (
    <div className="page">
      <InteractiveGlobe
        ref={globe}
        language={language}
        autoRotate={autoRotate}
        textures={{
          day:    '/textures/earth-blue-marble-8k.jpg',  // NASA Blue Marble Next Gen, 8192×4096 (local)
          clouds: '/textures/earth-clouds-2k.jpg',        // NASA cloud composite, 2048×1024 (local)
        }}
        panels={{ title: showTitle, info: showInfo, bottomBar: showBar }}
        infoCard={{
          view: showView, lat: showLat, lon: showLon,
          distance: showDist, hint: showHint,
        }}
        controls={{
          reset:      btnReset,
          zoom:       btnZoom,       // sugar: both + and − follow this one toggle
          autoRotate: btnAutoRotate,
          labels:     btnLabels,
          markers:    btnMarkers,
          clouds:     btnClouds,
          atmosphere: btnAtmos,
          aurora:     btnAurora,
        }}
        strings={iconOnly ? ICON_ONLY_OVERRIDES : undefined}
        onPoiClick={(poi) => setLastClick(poi)}
      />

      <div className="side ig-glass">
        <div className="side-title">{labels.title}</div>

        <label className="row">
          <span>{labels.langLabel}</span>
          <select value={language} onChange={e => setLanguage(e.target.value)}>
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
        </label>

        <div className="row-group">
          <div className="side-title-sm">{labels.panelsLabel}</div>
          <Toggle label={labels.title_t} value={showTitle} onChange={setShowTitle} />
          <Toggle label={labels.info_t}  value={showInfo}  onChange={setShowInfo} />
          <Toggle label={labels.bar_t}   value={showBar}   onChange={setShowBar} />
        </div>

        <div className="row-group">
          <div className="side-title-sm">{labels.infoRowsLabel}</div>
          <Toggle label={labels.view_r} value={showView} onChange={setShowView} />
          <Toggle label={labels.lat_r}  value={showLat}  onChange={setShowLat} />
          <Toggle label={labels.lon_r}  value={showLon}  onChange={setShowLon} />
          <Toggle label={labels.dist_r} value={showDist} onChange={setShowDist} />
          <Toggle label={labels.hint_r} value={showHint} onChange={setShowHint} />
        </div>

        <div className="row-group">
          <div className="side-title-sm">{labels.barButtonsLabel}</div>
          <Toggle label={labels.b_reset}  value={btnReset}      onChange={setBtnReset} />
          <Toggle label={labels.b_zoom}   value={btnZoom}       onChange={setBtnZoom} />
          <Toggle label={labels.b_auto}   value={btnAutoRotate} onChange={setBtnAutoRotate} />
          <Toggle label={labels.b_labels} value={btnLabels}     onChange={setBtnLabels} />
          <Toggle label={labels.b_poi}    value={btnMarkers}    onChange={setBtnMarkers} />
          <Toggle label={labels.b_clouds} value={btnClouds}     onChange={setBtnClouds} />
          <Toggle label={labels.b_atmos}  value={btnAtmos}      onChange={setBtnAtmos} />
          <Toggle label={labels.b_aurora} value={btnAurora}     onChange={setBtnAurora} />
        </div>

        <Toggle label={labels.iconOnlyLabel} value={iconOnly}   onChange={setIconOnly} />
        <Toggle label={labels.autoLabel}     value={autoRotate} onChange={setAutoRotate} />

        <div className="side-title">{labels.flyTo}</div>
        {SPOTS.map(s => (
          <button
            key={s.name.en}
            className="side-btn"
            onClick={() => globe.current?.flyTo(s.lat, s.lon, 1.7)}
          >
            {s.name[language]}
          </button>
        ))}

        {lastClick && (
          <div className="last-click">
            <div className="side-title">{labels.clicked}</div>
            <div className="click-name">{lastClick.name}</div>
            <div className="click-coords">
              {lastClick.lat.toFixed(2)}°, {lastClick.lon.toFixed(2)}°
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <label className="row">
      <span>{label}</span>
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} />
    </label>
  );
}
