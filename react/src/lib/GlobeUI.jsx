import { useEffect, useRef, useState } from 'react';

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

export function GlobeUI({ minimal, toggles, onToggle, onReset, onZoomIn, onZoomOut, getInfo }) {
  const info = useInfoTick(getInfo);

  return (
    <>
      {!minimal && (
        <>
          <div className="ig-top-left ig-glass">
            <div className="ig-dot" />
            <div>
              <div className="ig-eyebrow">Interactive Globe</div>
              <div className="ig-title">交互式地球 · 三维可视化</div>
            </div>
          </div>

          <div className="ig-top-right ig-glass">
            <div className="ig-info-row ig-eyebrow ig-spread">
              <span>视图</span><span>{info.level}</span>
            </div>
            <div className="ig-info-row ig-spread"><span className="ig-dim">纬度</span><span className="ig-num">{info.lat.toFixed(2)}°</span></div>
            <div className="ig-info-row ig-spread"><span className="ig-dim">经度</span><span className="ig-num">{info.lon.toFixed(2)}°</span></div>
            <div className="ig-info-row ig-spread"><span className="ig-dim">距离</span><span className="ig-num">{info.dist.toFixed(2)}</span></div>
            <div className="ig-hint">拖拽旋转 · 滚轮缩放<br/>触控板双指捏合</div>
          </div>
        </>
      )}

      <div className="ig-bottom ig-glass">
        <Btn onClick={onReset}   title="重置视角"><Icon.reset/><span>重置</span></Btn>
        <Btn onClick={onZoomIn}  title="放大"><Icon.zoomIn/></Btn>
        <Btn onClick={onZoomOut} title="缩小"><Icon.zoomOut/></Btn>
        <span className="ig-divider" />
        <Btn active={toggles.autoRotate}     onClick={() => onToggle('autoRotate')}     title="自动旋转"><Icon.rotate/><span>自转</span></Btn>
        <Btn active={toggles.showLabels}     onClick={() => onToggle('showLabels')}     title="地理标签"><Icon.labels/><span>标签</span></Btn>
        <Btn active={toggles.showMarkers}    onClick={() => onToggle('showMarkers')}    title="POI"><Icon.poi/><span>POI</span></Btn>
        <Btn active={toggles.showClouds}     onClick={() => onToggle('showClouds')}     title="云层"><Icon.cloud/><span>云层</span></Btn>
        <Btn active={toggles.showAtmosphere} onClick={() => onToggle('showAtmosphere')} title="大气层"><Icon.atmos/><span>大气</span></Btn>
      </div>
    </>
  );
}
