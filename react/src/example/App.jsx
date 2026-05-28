import { useRef, useState } from 'react';
import { InteractiveGlobe } from '../lib/index.js';
import './example.css';

const SPOTS = [
  { name: '北京 Beijing',     lat: 39.9042, lon: 116.4074 },
  { name: '伦敦 London',      lat: 51.5074, lon: -0.1278  },
  { name: '纽约 New York',    lat: 40.7128, lon: -74.0060 },
  { name: '悉尼 Sydney',      lat: -33.87,  lon: 151.21   },
  { name: '里约 Rio',         lat: -22.91,  lon: -43.17   },
];

export default function App() {
  const globe = useRef(null);
  const [lastClick, setLastClick] = useState(null);

  return (
    <div className="page">
      <InteractiveGlobe
        ref={globe}
        onPoiClick={(poi) => setLastClick(poi)}
      />

      <div className="side ig-glass">
        <div className="side-title">FLY TO</div>
        {SPOTS.map(s => (
          <button
            key={s.name}
            className="side-btn"
            onClick={() => globe.current?.flyTo(s.lat, s.lon, 1.7)}
          >
            {s.name}
          </button>
        ))}
        {lastClick && (
          <div className="last-click">
            <div className="side-title">CLICKED</div>
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
