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

  const labels = {
    zh: { title: '配置 · 实时切换', flyTo: '飞往', clicked: '已选 POI', langLabel: '语言',
          panelsLabel: '面板', iconOnlyLabel: '按钮仅图标', autoLabel: '自动旋转',
          title_t: '标题', info_t: '信息卡', bar_t: '底栏' },
    en: { title: 'Config · live toggles',  flyTo: 'Fly to', clicked: 'Clicked POI', langLabel: 'Language',
          panelsLabel: 'Panels', iconOnlyLabel: 'Icon-only buttons', autoLabel: 'Auto-rotate',
          title_t: 'Title', info_t: 'Info card', bar_t: 'Bottom bar' },
  }[language];

  return (
    <div className="page">
      <InteractiveGlobe
        ref={globe}
        language={language}
        autoRotate={autoRotate}
        panels={{ title: showTitle, info: showInfo, bottomBar: showBar }}
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
