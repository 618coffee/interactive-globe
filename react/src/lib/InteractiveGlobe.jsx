import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { GlobeScene } from './globe-scene.js';
import { GlobeUI } from './GlobeUI.jsx';
import { DEFAULT_POIS } from './data/pois.js';
import { DEFAULT_LABELS } from './data/labels.js';
import { resolveStrings, resolveControls, resolvePanels, resolveInfoCard } from './strings.js';
import './styles.css';

/**
 * <InteractiveGlobe />
 *
 * Props (all optional):
 *   pois              array of { name, lat, lon }
 *   labels            array of { name, lat, lon, type, lod }
 *   ui                'full' | 'minimal' | 'none'                  default: 'full'
 *   panels            granular panel overrides on top of `ui`:
 *                     { title, info, bottomBar } booleans          default: derived from `ui`
 *   language          'zh' | 'en'                                  default: 'zh'
 *   strings           partial overrides for UI text. Pass an empty
 *                     string for a button label to render that
 *                     button icon-only.                            default: built-in bundle
 *   controls          per-button visibility in the bottom bar:
 *                     { reset, zoomIn, zoomOut, autoRotate, labels,
 *                       markers, clouds, atmosphere } booleans     default: all true
 *   infoCard          per-row visibility inside the top-right info
 *                     readout: { view, lat, lon, distance, hint }
 *                     booleans                                      default: all true
 *   autoRotate        boolean                                       default: true
 *   showClouds        boolean                                       default: true
 *   showAtmosphere    boolean                                       default: true
 *   showAurora        boolean (polar auroral oval rings)            default: true
 *   showLabels        boolean                                       default: true
 *   showMarkers       boolean                                       default: true
 *   exposure          number (renderer tone-mapping exposure)       default: 1.4
 *   theme             'light' | 'dark' (light sky preset)           default: 'dark'
 *   themeColors       { background?, marker? } color overrides       default: theme preset
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
    panels: panelsOverride,
    language       = 'zh',
    strings: stringsOverride,
    controls: controlsOverride,
    infoCard: infoCardOverride,
    autoRotate     = true,
    enableZoom     = true,
    enableRotate   = true,
    showClouds     = true,
    showAtmosphere = true,
    showAurora     = true,
    showLabels     = true,
    showMarkers    = true,
    exposure       = 1.4,
    theme          = 'dark',
    themeColors,
    textures,
    graticule,
    className      = '',
    style,
    onReady,
    onLoad,
    onPoiClick,
  } = props;

  const t        = useMemo(() => resolveStrings(language, stringsOverride), [language, stringsOverride]);
  const controls = useMemo(() => resolveControls(controlsOverride),         [controlsOverride]);
  const infoCard = useMemo(() => resolveInfoCard(infoCardOverride),         [infoCardOverride]);
  const panels   = useMemo(() => resolvePanels(ui, panelsOverride),         [ui, panelsOverride]);
  const anyPanel = panels.title || panels.info || panels.bottomBar;

  const canvasRef = useRef(null);
  const labelsRef = useRef(null);
  const sceneRef  = useRef(null);
  const texturesInitedRef = useRef(false);
  const [toggles, setToggles] = useState({
    autoRotate, showClouds, showAtmosphere, showAurora, showLabels, showMarkers,
  });
  const [loaded, setLoaded] = useState(false);

  // ---- create scene once on mount ------------------------------------------
  useEffect(() => {
    const sceneOpts = {
      pois, labels,
      autoRotate, enableZoom, enableRotate,
      showClouds, showAtmosphere, showAurora, showLabels, showMarkers,
      exposure,
      theme,
      themeColors,
      onReady: (api) => { if (onReady) onReady(api); },
      onLoad:  () => { setLoaded(true); if (onLoad) onLoad(); },
      onPoiClick,
    };
    if (textures) sceneOpts.textures = textures;
    if (graticule) sceneOpts.graticule = graticule;
    const scene = new GlobeScene(canvasRef.current, labelsRef.current, sceneOpts);
    sceneRef.current = scene;
    return () => { scene.dispose(); sceneRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- forward reactive prop changes into the scene -------------------------
  useEffect(() => { sceneRef.current?.setOptions({ pois }); }, [pois]);
  useEffect(() => { sceneRef.current?.setOptions({ labels }); }, [labels]);
  useEffect(() => { sceneRef.current?.setOptions({ exposure }); }, [exposure]);
  useEffect(() => { sceneRef.current?.setOptions({ theme }); }, [theme]);
  // Serialize the color overrides so an inline object literal from the caller
  // doesn't re-run this (and rebuild the marker texture) on every render — only
  // when the actual colors change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { sceneRef.current?.setOptions({ themeColors }); }, [JSON.stringify(themeColors ?? null)]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { sceneRef.current?.setOptions({ graticule }); }, [JSON.stringify(graticule ?? null)]);
  // Textures are applied once at construction; skip the mount-time run so we
  // don't redundantly re-fetch them, then reload live on any later change (e.g.
  // a theme toggle swapping in a vintage map / back to the default).
  useEffect(() => {
    if (!texturesInitedRef.current) { texturesInitedRef.current = true; return; }
    sceneRef.current?.setOptions({ textures });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(textures ?? null)]);
  useEffect(() => { sceneRef.current?.setOptions({ enableZoom }); }, [enableZoom]);
  useEffect(() => { sceneRef.current?.setOptions({ enableRotate }); }, [enableRotate]);
  useEffect(() => { sceneRef.current?.setOptions({ autoRotate: toggles.autoRotate }); }, [toggles.autoRotate]);
  useEffect(() => { sceneRef.current?.setOptions({ showClouds: toggles.showClouds }); }, [toggles.showClouds]);
  useEffect(() => { sceneRef.current?.setOptions({ showAtmosphere: toggles.showAtmosphere }); }, [toggles.showAtmosphere]);
  useEffect(() => { sceneRef.current?.setOptions({ showAurora:     toggles.showAurora }); },     [toggles.showAurora]);
  useEffect(() => { sceneRef.current?.setOptions({ showLabels: toggles.showLabels }); }, [toggles.showLabels]);
  useEffect(() => { sceneRef.current?.setOptions({ showMarkers: toggles.showMarkers }); }, [toggles.showMarkers]);

  // External prop changes mirror into local UI state (controlled overrides)
  useEffect(() => { setToggles(s => ({ ...s, autoRotate })); },     [autoRotate]);
  useEffect(() => { setToggles(s => ({ ...s, showClouds })); },     [showClouds]);
  useEffect(() => { setToggles(s => ({ ...s, showAtmosphere })); }, [showAtmosphere]);
  useEffect(() => { setToggles(s => ({ ...s, showAurora })); },     [showAurora]);
  useEffect(() => { setToggles(s => ({ ...s, showLabels })); },     [showLabels]);
  useEffect(() => { setToggles(s => ({ ...s, showMarkers })); },    [showMarkers]);

  // ---- imperative handle ----------------------------------------------------
  useImperativeHandle(ref, () => ({
    reset:    () => sceneRef.current?.reset(),
    zoomIn:   () => sceneRef.current?.zoom(0.78),
    zoomOut:  () => sceneRef.current?.zoom(1.28),
    flyTo:    (lat, lon, dist, opts) => sceneRef.current?.flyTo(lat, lon, dist, opts),
    getInfo:  () => sceneRef.current?.getInfo(),
    getScene: () => sceneRef.current,
  }), []);

  return (
    <div
      className={`ig-root ${className}`}
      style={style}
      data-ui={ui}
      data-theme={theme}
    >
      <canvas ref={canvasRef} className="ig-canvas" />
      <div ref={labelsRef} className="ig-labels-layer" />

      {!loaded && (
        <div className="ig-loader">
          <div className="ig-loader-ring" />
          <div className="ig-loader-text">{t.loadingText}</div>
        </div>
      )}

      {anyPanel && (
        <GlobeUI
          panels={panels}
          strings={t}
          controls={controls}
          infoCard={infoCard}
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
