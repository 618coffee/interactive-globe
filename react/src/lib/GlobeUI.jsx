import { useEffect, useState } from 'react';

const Icon = {
  reset:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>,
  zoomIn:   () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M11 8v6M8 11h6M20 20l-3.5-3.5"/></svg>,
  zoomOut:  () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M8 11h6M20 20l-3.5-3.5"/></svg>,
  rotate:   () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v3M22 12h-3M12 22v-3M2 12h3"/><circle cx="12" cy="12" r="5"/></svg>,
  labels:   () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 17l9 4 9-4"/><path d="M3 12l9 4 9-4"/></svg>,
  poi:      () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-7.5-7-12a7 7 0 1 1 14 0c0 4.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>,
  cloud:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 18a5 5 0 1 1 .5-9.97A6 6 0 0 1 19 11a4 4 0 0 1 0 8H7z"/></svg>,
  atmos:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>,
};

function Btn({ active, onClick, title, children }) {
  return (
    <button
      type="button"
      className={`ig-btn ${active ? 'ig-active' : ''}`}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}

function useInfoTick(getInfo, interval = 100) {
  const [info, setInfo] = useState({ lat: 0, lon: 0, dist: 3, level: 'L1' });
  useEffect(() => {
    const id = setInterval(() => {
      const v = getInfo?.();
      if (v) setInfo(v);
    }, interval);
    return () => clearInterval(id);
  }, [getInfo, interval]);
  return info;
}

export function GlobeUI({
  minimal,
  strings,
  controls,
  toggles,
  onToggle,
  onReset,
  onZoomIn,
  onZoomOut,
  getInfo,
}) {
  const info = useInfoTick(getInfo);

  const showAction = controls.reset || controls.zoomIn || controls.zoomOut;
  const showToggle = controls.autoRotate || controls.labels || controls.markers
                   || controls.clouds   || controls.atmosphere;
  const showDivider = showAction && showToggle;
  const showBar = showAction || showToggle;

  return (
    <>
      {!minimal && (
        <>
          <div className="ig-top-left ig-glass">
            <div className="ig-dot" />
            <div>
              <div className="ig-eyebrow">{strings.eyebrow}</div>
              <div className="ig-title">{strings.title}</div>
            </div>
          </div>

          <div className="ig-top-right ig-glass">
            <div className="ig-info-row ig-eyebrow ig-spread">
              <span>{strings.view}</span><span>{info.level}</span>
            </div>
            <div className="ig-info-row ig-spread"><span className="ig-dim">{strings.lat}</span><span className="ig-num">{info.lat.toFixed(2)}°</span></div>
            <div className="ig-info-row ig-spread"><span className="ig-dim">{strings.lon}</span><span className="ig-num">{info.lon.toFixed(2)}°</span></div>
            <div className="ig-info-row ig-spread"><span className="ig-dim">{strings.distance}</span><span className="ig-num">{info.dist.toFixed(2)}</span></div>
            <div className="ig-hint">{strings.hintLine1}<br/>{strings.hintLine2}</div>
          </div>
        </>
      )}

      {showBar && (
        <div className="ig-bottom ig-glass">
          {controls.reset && (
            <Btn onClick={onReset} title={strings.reset}><Icon.reset/><span>{strings.reset}</span></Btn>
          )}
          {controls.zoomIn && (
            <Btn onClick={onZoomIn} title={strings.zoomIn}><Icon.zoomIn/></Btn>
          )}
          {controls.zoomOut && (
            <Btn onClick={onZoomOut} title={strings.zoomOut}><Icon.zoomOut/></Btn>
          )}
          {showDivider && <span className="ig-divider" />}
          {controls.autoRotate && (
            <Btn active={toggles.autoRotate}     onClick={() => onToggle('autoRotate')}     title={strings.autoRotate}><Icon.rotate/><span>{strings.autoRotate}</span></Btn>
          )}
          {controls.labels && (
            <Btn active={toggles.showLabels}     onClick={() => onToggle('showLabels')}     title={strings.labels}><Icon.labels/><span>{strings.labels}</span></Btn>
          )}
          {controls.markers && (
            <Btn active={toggles.showMarkers}    onClick={() => onToggle('showMarkers')}    title={strings.poi}><Icon.poi/><span>{strings.poi}</span></Btn>
          )}
          {controls.clouds && (
            <Btn active={toggles.showClouds}     onClick={() => onToggle('showClouds')}     title={strings.clouds}><Icon.cloud/><span>{strings.clouds}</span></Btn>
          )}
          {controls.atmosphere && (
            <Btn active={toggles.showAtmosphere} onClick={() => onToggle('showAtmosphere')} title={strings.atmosphere}><Icon.atmos/><span>{strings.atmosphere}</span></Btn>
          )}
        </div>
      )}
    </>
  );
}
