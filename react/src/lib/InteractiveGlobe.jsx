import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { GlobeScene } from './globe-scene.js';
import { GlobeUI } from './GlobeUI.jsx';
import { DEFAULT_POIS } from './data/pois.js';
import { DEFAULT_LABELS } from './data/labels.js';
import './styles.css';

/**
 * <InteractiveGlobe />
 *
 * Props (all optional):
 *   pois              array of { name, lat, lon }                     default: 30 cities
 *   labels            array of { name, lat, lon, type, lod }          default: continents/oceans/countries/cities/mountains
 *   ui                'full' | 'none' | 'minimal'                     default: 'full'
 *   autoRotate        boolean                                          default: true
 *   showClouds        boolean                                          default: true
 *   showAtmosphere    boolean                                          default: true
 *   showLabels        boolean                                          default: true
 *   showMarkers       boolean                                          default: true
 *   exposure          number  (renderer tone-mapping exposure)         default: 1.4
 *   textures          { day, spec, bump, clouds } URL overrides        default: 8K Blue Marble set
 *   className, style  forwarded to the wrapper div
 *   onReady(api)      called once the scene is constructed
 *   onLoad()          called once all textures have loaded
 *   onPoiClick(poi)   called when a marker is clicked
 *
 * Imperative handle (via ref):
 *   reset(), zoomIn(), zoomOut(), flyTo(lat, lon, dist?), getInfo(), getScene()
 */
export const InteractiveGlobe = forwardRef(function InteractiveGlobe(props, ref) {
  const {
    pois           = DEFAULT_POIS,
    labels         = DEFAULT_LABELS,
    ui             = 'full',
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
  useEffect(() => { setToggles(t => ({ ...t, autoRotate })); },     [autoRotate]);
  useEffect(() => { setToggles(t => ({ ...t, showClouds })); },     [showClouds]);
  useEffect(() => { setToggles(t => ({ ...t, showAtmosphere })); }, [showAtmosphere]);
  useEffect(() => { setToggles(t => ({ ...t, showLabels })); },     [showLabels]);
  useEffect(() => { setToggles(t => ({ ...t, showMarkers })); },    [showMarkers]);

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
          <div className="ig-loader-text">LOADING EARTH</div>
        </div>
      )}

      {ui !== 'none' && (
        <GlobeUI
          minimal={ui === 'minimal'}
          toggles={toggles}
          onToggle={(k) => setToggles(t => ({ ...t, [k]: !t[k] }))}
          onReset={()    => sceneRef.current?.reset()}
          onZoomIn={()   => sceneRef.current?.zoom(0.78)}
          onZoomOut={()  => sceneRef.current?.zoom(1.28)}
          getInfo={()    => sceneRef.current?.getInfo()}
        />
      )}
    </div>
  );
});
