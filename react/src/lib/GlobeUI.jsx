import { useEffect, useState } from 'react';
import { STRINGS } from './strings.js';

// Always-present English bundle used as the accessibility-label fallback
// when a host passes an empty string for a button (icon-only mode).
const A11Y = STRINGS.en;

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

/**
 * Toolbar button. The icon always renders; the label only renders when
 * `label` is a non-empty string. `tooltip` is what we put on the title +
 * aria-label attributes — falls back to the English bundle so icon-only
 * buttons stay accessible.
 */
function ToolBtn({ active, onClick, label, tooltip, children }) {
  const a11y = label || tooltip;
  return (
    <button
      type="button"
      className={`ig-btn ${active ? 'ig-active' : ''} ${label ? '' : 'ig-icon-only'}`}
      onClick={onClick}
      title={a11y}
      aria-label={a11y}
    >
      {children}
      {label ? <span>{label}</span> : null}
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
  panels,
  strings,
  controls,
  infoCard,
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
  const showBar = panels.bottomBar && (showAction || showToggle);

  const anyInfoRow = infoCard.view || infoCard.lat || infoCard.lon || infoCard.distance;
  const hintVisible = infoCard.hint && (strings.hintLine1 || strings.hintLine2);
  const showInfoCard = panels.info && (anyInfoRow || hintVisible);

  return (
    <>
      {panels.title && (
        <div className="ig-top-left ig-glass">
          <div className="ig-dot" />
          <div>
            <div className="ig-eyebrow">{strings.eyebrow}</div>
            <div className="ig-title">{strings.title}</div>
          </div>
        </div>
      )}

      {showInfoCard && (
        <div className="ig-top-right ig-glass">
          {infoCard.view && (
            <div className="ig-info-row ig-eyebrow ig-spread">
              <span>{strings.view}</span><span>{info.level}</span>
            </div>
          )}
          {infoCard.lat && (
            <div className="ig-info-row ig-spread"><span className="ig-dim">{strings.lat}</span><span className="ig-num">{info.lat.toFixed(2)}°</span></div>
          )}
          {infoCard.lon && (
            <div className="ig-info-row ig-spread"><span className="ig-dim">{strings.lon}</span><span className="ig-num">{info.lon.toFixed(2)}°</span></div>
          )}
          {infoCard.distance && (
            <div className="ig-info-row ig-spread"><span className="ig-dim">{strings.distance}</span><span className="ig-num">{info.dist.toFixed(2)}</span></div>
          )}
          {hintVisible && (
            <div className="ig-hint">
              {strings.hintLine1}
              {strings.hintLine1 && strings.hintLine2 && <br/>}
              {strings.hintLine2}
            </div>
          )}
        </div>
      )}

      {showBar && (
        <div className="ig-bottom ig-glass">
          {controls.reset && (
            <ToolBtn onClick={onReset} label={strings.reset} tooltip={A11Y.reset}><Icon.reset/></ToolBtn>
          )}
          {controls.zoomIn && (
            <ToolBtn onClick={onZoomIn} label={strings.zoomIn} tooltip={A11Y.zoomIn}><Icon.zoomIn/></ToolBtn>
          )}
          {controls.zoomOut && (
            <ToolBtn onClick={onZoomOut} label={strings.zoomOut} tooltip={A11Y.zoomOut}><Icon.zoomOut/></ToolBtn>
          )}
          {showDivider && <span className="ig-divider" />}
          {controls.autoRotate && (
            <ToolBtn active={toggles.autoRotate}     onClick={() => onToggle('autoRotate')}     label={strings.autoRotate} tooltip={A11Y.autoRotate}><Icon.rotate/></ToolBtn>
          )}
          {controls.labels && (
            <ToolBtn active={toggles.showLabels}     onClick={() => onToggle('showLabels')}     label={strings.labels}     tooltip={A11Y.labels}><Icon.labels/></ToolBtn>
          )}
          {controls.markers && (
            <ToolBtn active={toggles.showMarkers}    onClick={() => onToggle('showMarkers')}    label={strings.poi}        tooltip={A11Y.poi}><Icon.poi/></ToolBtn>
          )}
          {controls.clouds && (
            <ToolBtn active={toggles.showClouds}     onClick={() => onToggle('showClouds')}     label={strings.clouds}     tooltip={A11Y.clouds}><Icon.cloud/></ToolBtn>
          )}
          {controls.atmosphere && (
            <ToolBtn active={toggles.showAtmosphere} onClick={() => onToggle('showAtmosphere')} label={strings.atmosphere} tooltip={A11Y.atmosphere}><Icon.atmos/></ToolBtn>
          )}
        </div>
      )}
    </>
  );
}
