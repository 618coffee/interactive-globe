import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { GlobeScene } from './globe-scene.js';
import { GlobeUI } from './GlobeUI.jsx';
import { DEFAULT_POIS } from './data/pois.js';
import { DEFAULT_LABELS } from './data/labels.js';
import { resolveStrings, resolveControls } from './strings.js';
import './styles.css';

/**
 * <InteractiveGlobe />
 *
 * Props (all optional):
 *   pois              array of { name, lat, lon }
 *   labels            array of { name, lat, lon, type, lod }
 *   ui                'full' | 'minimal' | 'none'                  default: 'full'
 *   language          'zh' | 'en'                                  default: 'zh'
 *   strings           partial overrides for UI text                default: built-in bundle
 *   controls          per-button visibility in the bottom bar:
 *                     { reset, zoomIn, zoomOut, autoRotate, labels,
 *                       markers, clouds, atmosphere } booleans     default: all true
 *   autoRotate        boolean                                       default: true
 *   showClouds        boolean                                       default: true
 *   showAtmosphere    boolean                                       default: true
 *   showLabels        boolean                                       default: true
 *   showMarkers       boolean                                       default: true
 *   exposure          number (renderer tone-mapping exposure)       default: 1.4
 *   textures          { day, spec, bump, clouds } URL overrides     default: 8K Blue Marble
 *   className, style  forwarded to the wrapper div
 *   onReady(api), onLoad(), onPoiClick(poi)
 *
 * Imperative handle (via ref):
 *   reset(), zoomIn(), zoomOut(), flyTo(lat, lon, dist?), getInfo(), getScene()
 */
export const InteractiveGlobe = forwardRef(function InteractiveGlobe(props, ref) {
  const {
    pois           = DEFAULT_POIS,
    labels         = DEFAULT_LABELS,
    ui             = 'full',
    language       = 'zh',
    strings: stringsOverride,
    controls: controlsOverride,
    autoRotate     = true,
    showClouds     = true,
    showAtmosphere = true,
    showLabels     = true,
    showMarkers    = true,
    exposure       = 1.4,
    textures,
    className      = '',
    style,
    onReady,
    onLoad,
    onPoiClick,
  } = props;

  const t        = useMemo(() => resolveStrings(language, stringsOverride), [language, stringsOverride]);
  const controls = useMemo(() => resolveControls(controlsOverride),         [controlsOverride]);

  const canvasRef = useRef(null);
  const labelsRef = useRef(null);
  const sceneRef  = useRef(null);
  const [toggles, setToggles] = useState({
    autoRotate, showClouds, showAtmosphere, showLabels, showMarkers,
  });
  const [loaded, setLoaded] = useState(false);

  // ---- create scene once on mount ------------------------------------------
  useEffect(() => {
    const scene = new GlobeScene(canvasRef.current, labelsRef.current, {
      pois, labels,
      autoRotate, showClouds, showAtmosphere, showLabels, showMarkers,
      exposure,
      textures: textures || undefined,
      onReady: (api) => { if (onReady) onReady(api); },
      onLoad:  () => { setLoaded(true); if (onLoad) onLoad(); },
      onPoiClick,
    });
    sceneRef.current = scene;
    return () => { scene.dispose(); sceneRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- forward reactive prop changes into the scene -------------------------
  useEffect(() => { sceneRef.current?.setOptions({ pois }); }, [pois]);
  useEffect(() => { sceneRef.current?.setOptions({ labels }); }, [labels]);
  useEffect(() => { sceneRef.current?.setOptions({ exposure }); }, [exposure]);
  useEffect(() => { sceneRef.current?.setOptions({ autoRotate: toggles.autoRotate }); }, [toggles.autoRotate]);
  useEffect(() => { sceneRef.current?.setOptions({ showClouds: toggles.showClouds }); }, [toggles.showClouds]);
  useEffect(() => { sceneRef.current?.setOptions({ showAtmosphere: toggles.showAtmosphere }); }, [toggles.showAtmosphere]);
  useEffect(() => { sceneRef.current?.setOptions({ showLabels: toggles.showLabels }); }, [toggles.showLabels]);
  useEffect(() => { sceneRef.current?.setOptions({ showMarkers: toggles.showMarkers }); }, [toggles.showMarkers]);

  // External prop changes mirror into local UI state (controlled overrides)
  useEffect(() => { setToggles(s => ({ ...s, autoRotate })); },     [autoRotate]);
  useEffect(() => { setToggles(s => ({ ...s, showClouds })); },     [showClouds]);
  useEffect(() => { setToggles(s => ({ ...s, showAtmosphere })); }, [showAtmosphere]);
  useEffect(() => { setToggles(s => ({ ...s, showLabels })); },     [showLabels]);
  useEffect(() => { setToggles(s => ({ ...s, showMarkers })); },    [showMarkers]);

  // ---- imperative handle ----------------------------------------------------
  useImperativeHandle(ref, () => ({
    reset:    () => sceneRef.current?.reset(),
    zoomIn:   () => sceneRef.current?.zoom(0.78),
    zoomOut:  () => sceneRef.current?.zoom(1.28),
    flyTo:    (lat, lon, dist) => sceneRef.current?.flyTo(lat, lon, dist),
    getInfo:  () => sceneRef.current?.getInfo(),
    getScene: () => sceneRef.current,
  }), []);

  return (
    <div
      className={`ig-root ${className}`}
      style={style}
      data-ui={ui}
    >
      <canvas ref={canvasRef} className="ig-canvas" />
      <div ref={labelsRef} className="ig-labels-layer" />

      {!loaded && (
        <div className="ig-loader">
          <div className="ig-loader-ring" />
          <div className="ig-loader-text">{t.loadingText}</div>
        </div>
      )}

      {ui !== 'none' && (
        <GlobeUI
          minimal={ui === 'minimal'}
          strings={t}
          controls={controls}
          toggles={toggles}
          onToggle={(k) => setToggles(s => ({ ...s, [k]: !s[k] }))}
          onReset={()    => sceneRef.current?.reset()}
          onZoomIn={()   => sceneRef.current?.zoom(0.78)}
          onZoomOut={()  => sceneRef.current?.zoom(1.28)}
          getInfo={()    => sceneRef.current?.getInfo()}
        />
      )}
    </div>
  );
});
