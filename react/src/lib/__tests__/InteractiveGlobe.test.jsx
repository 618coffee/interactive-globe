import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRef } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ------------------------------------------------------------------
// Mock the heavy Three.js scene class. Tests run in jsdom (no WebGL),
// so we replace GlobeScene with a fake that records calls and fires
// onLoad synchronously so the loader unmounts.
// ------------------------------------------------------------------
const sceneInstances = [];

vi.mock('../globe-scene.js', () => ({
  GlobeScene: class MockGlobeScene {
    constructor(canvas, labelsEl, options = {}) {
      this.canvas   = canvas;
      this.labelsEl = labelsEl;
      this.options  = { ...options };
      this.calls = { setOptions: [], reset: 0, zoom: [], flyTo: [] };
      sceneInstances.push(this);
      // Mirror real GlobeScene: onReady fires synchronously from the
      // constructor; onLoad fires once textures resolve (next microtask
      // here, so the loader unmounts and assertions can see the UI).
      if (options.onReady) options.onReady(this);
      queueMicrotask(() => options.onLoad && options.onLoad());
    }
    setOptions(p) { this.calls.setOptions.push(p); Object.assign(this.options, p); }
    setPois()  {}
    setLabels(){}
    reset()    { this.calls.reset++; }
    zoom(f)    { this.calls.zoom.push(f); }
    flyTo(lat, lon, d) { this.calls.flyTo.push([lat, lon, d]); }
    getInfo()  { return { lat: 12.34, lon: -56.78, dist: 2.5, level: 'L2' }; }
    dispose()  {}
  },
}));

import { InteractiveGlobe } from '../InteractiveGlobe.jsx';
import { STRINGS } from '../strings.js';

beforeEach(() => {
  sceneInstances.length = 0;
});

// Wait for the texture-load callback to fire and the loader to unmount.
async function renderAndLoad(ui) {
  const result = render(ui);
  await waitFor(() => {
    expect(result.container.querySelector('.ig-loader')).toBeNull();
  });
  return result;
}

// ==================================================================
// language prop
// ==================================================================
describe('language prop', () => {
  it('renders Chinese strings by default', async () => {
    await renderAndLoad(<InteractiveGlobe />);
    expect(screen.getByText('重置')).toBeInTheDocument();
    expect(screen.getByText('自转')).toBeInTheDocument();
    expect(screen.getByText('云层')).toBeInTheDocument();
    expect(screen.getByText('交互式地球 · 三维可视化')).toBeInTheDocument();
  });

  it('renders English strings when language="en"', async () => {
    await renderAndLoad(<InteractiveGlobe language="en" />);
    expect(screen.getByText('Reset')).toBeInTheDocument();
    expect(screen.getByText('Auto-rotate')).toBeInTheDocument();
    expect(screen.getByText('Clouds')).toBeInTheDocument();
    expect(screen.queryByText('重置')).not.toBeInTheDocument();
  });
});

// ==================================================================
// strings prop (overrides + icon-only)
// ==================================================================
describe('strings prop', () => {
  it('layers per-key overrides on top of the language bundle', async () => {
    await renderAndLoad(
      <InteractiveGlobe language="en" strings={{ reset: 'Recenter', title: 'My Globe' }} />,
    );
    expect(screen.getByText('Recenter')).toBeInTheDocument();
    expect(screen.getByText('My Globe')).toBeInTheDocument();
    // un-overridden keys still come from en
    expect(screen.getByText('Auto-rotate')).toBeInTheDocument();
  });

  it('empty string makes that button icon-only: no <span>, but icon remains', async () => {
    await renderAndLoad(<InteractiveGlobe strings={{ reset: '' }} />);

    // The reset button is still present (icon)
    const resetBtn = screen.getByRole('button', { name: STRINGS.en.reset });
    expect(resetBtn).toBeInTheDocument();
    expect(resetBtn).toHaveClass('ig-icon-only');
    // No span child, just the SVG
    expect(resetBtn.querySelector('span')).toBeNull();
    expect(resetBtn.querySelector('svg')).toBeInTheDocument();

    // Other buttons still have text
    expect(screen.getByText('自转')).toBeInTheDocument();
  });

  it('icon-only buttons keep an accessible name via English fallback', async () => {
    await renderAndLoad(
      <InteractiveGlobe strings={{ reset: '', autoRotate: '', labels: '' }} />,
    );
    // aria-label falls back to en bundle for screen readers
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Auto-rotate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Labels' })).toBeInTheDocument();
  });

  it('hint lines collapse cleanly when both are empty', async () => {
    const { container } = await renderAndLoad(
      <InteractiveGlobe strings={{ hintLine1: '', hintLine2: '' }} />,
    );
    expect(container.querySelector('.ig-hint')).toBeNull();
  });

  it('renders only one hint line when the other is empty', async () => {
    await renderAndLoad(
      <InteractiveGlobe strings={{ hintLine1: 'Tap and drag', hintLine2: '' }} />,
    );
    expect(screen.getByText('Tap and drag')).toBeInTheDocument();
  });
});

// ==================================================================
// controls prop (per-button visibility)
// ==================================================================
describe('controls prop', () => {
  it('shows every button by default', async () => {
    await renderAndLoad(<InteractiveGlobe />);
    // 8 buttons: reset, zoomIn, zoomOut, autoRotate, labels, markers, clouds, atmosphere
    const buttons = document.querySelectorAll('.ig-bottom .ig-btn');
    expect(buttons.length).toBe(8);
  });

  it('hides individual buttons specified as false', async () => {
    await renderAndLoad(
      <InteractiveGlobe controls={{ atmosphere: false, clouds: false }} />,
    );
    expect(screen.queryByText('大气')).not.toBeInTheDocument();
    expect(screen.queryByText('云层')).not.toBeInTheDocument();
    // The rest still render
    expect(screen.getByText('重置')).toBeInTheDocument();
    expect(screen.getByText('自转')).toBeInTheDocument();
  });

  it('collapses the divider when only toggle buttons remain', async () => {
    const { container } = await renderAndLoad(
      <InteractiveGlobe controls={{ reset: false, zoomIn: false, zoomOut: false }} />,
    );
    expect(container.querySelector('.ig-divider')).toBeNull();
    // Toggle buttons still there
    expect(screen.getByText('自转')).toBeInTheDocument();
  });

  it('collapses the divider when only action buttons remain', async () => {
    const { container } = await renderAndLoad(
      <InteractiveGlobe controls={{
        autoRotate: false, labels: false, markers: false, clouds: false, atmosphere: false,
      }} />,
    );
    expect(container.querySelector('.ig-divider')).toBeNull();
    expect(screen.getByText('重置')).toBeInTheDocument();
  });

  it('unmounts the whole bottom bar when every control is false', async () => {
    const { container } = await renderAndLoad(
      <InteractiveGlobe controls={{
        reset: false, zoomIn: false, zoomOut: false,
        autoRotate: false, labels: false, markers: false, clouds: false, atmosphere: false,
      }} />,
    );
    expect(container.querySelector('.ig-bottom')).toBeNull();
  });

  it('controls.zoom: false hides both + and − buttons via the convenience key', async () => {
    await renderAndLoad(<InteractiveGlobe controls={{ zoom: false }} />);
    // zoomIn / zoomOut buttons have no text label, just the title attr
    expect(screen.queryByRole('button', { name: '放大' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '缩小' })).not.toBeInTheDocument();
    // reset and the toggle buttons still render
    expect(screen.getByText('重置')).toBeInTheDocument();
    expect(screen.getByText('自转')).toBeInTheDocument();
  });
});

// ==================================================================
// panels prop (top-left / top-right / bottom-bar visibility)
// ==================================================================
describe('panels prop', () => {
  it('default (ui="full") shows all three panels', async () => {
    const { container } = await renderAndLoad(<InteractiveGlobe />);
    expect(container.querySelector('.ig-top-left')).toBeInTheDocument();
    expect(container.querySelector('.ig-top-right')).toBeInTheDocument();
    expect(container.querySelector('.ig-bottom')).toBeInTheDocument();
  });

  it('panels={{ title: false }} hides only the top-left card', async () => {
    const { container } = await renderAndLoad(
      <InteractiveGlobe panels={{ title: false }} />,
    );
    expect(container.querySelector('.ig-top-left')).toBeNull();
    expect(container.querySelector('.ig-top-right')).toBeInTheDocument();
    expect(container.querySelector('.ig-bottom')).toBeInTheDocument();
  });

  it('panels={{ info: false }} hides only the top-right card', async () => {
    const { container } = await renderAndLoad(
      <InteractiveGlobe panels={{ info: false }} />,
    );
    expect(container.querySelector('.ig-top-left')).toBeInTheDocument();
    expect(container.querySelector('.ig-top-right')).toBeNull();
    expect(container.querySelector('.ig-bottom')).toBeInTheDocument();
  });

  it('panels={{ bottomBar: false }} hides only the bottom bar', async () => {
    const { container } = await renderAndLoad(
      <InteractiveGlobe panels={{ bottomBar: false }} />,
    );
    expect(container.querySelector('.ig-top-left')).toBeInTheDocument();
    expect(container.querySelector('.ig-top-right')).toBeInTheDocument();
    expect(container.querySelector('.ig-bottom')).toBeNull();
  });

  it('layers panels on top of ui="minimal" (which baselines title/info off, bar on)', async () => {
    const { container } = await renderAndLoad(
      <InteractiveGlobe ui="minimal" panels={{ title: true }} />,
    );
    expect(container.querySelector('.ig-top-left')).toBeInTheDocument();
    expect(container.querySelector('.ig-top-right')).toBeNull();
    expect(container.querySelector('.ig-bottom')).toBeInTheDocument();
  });
});

// ==================================================================
// infoCard prop (per-row visibility inside the top-right card)
// ==================================================================
describe('infoCard prop', () => {
  it('renders every row by default', async () => {
    const { container } = await renderAndLoad(<InteractiveGlobe />);
    // 4 info rows + 1 hint = 5 things; rows have class ig-info-row
    expect(container.querySelectorAll('.ig-top-right .ig-info-row').length).toBe(4);
    expect(container.querySelector('.ig-top-right .ig-hint')).toBeInTheDocument();
  });

  it('hides individual rows when set to false', async () => {
    const { container } = await renderAndLoad(
      <InteractiveGlobe infoCard={{ lat: false, lon: false }} />,
    );
    // 4 rows minus 2 = 2 rows; both label texts gone
    expect(container.querySelectorAll('.ig-top-right .ig-info-row').length).toBe(2);
    expect(screen.queryByText('纬度')).not.toBeInTheDocument();
    expect(screen.queryByText('经度')).not.toBeInTheDocument();
    // others still there
    expect(screen.getByText('视图')).toBeInTheDocument();
    expect(screen.getByText('距离')).toBeInTheDocument();
  });

  it('hint: false hides the hint footer', async () => {
    const { container } = await renderAndLoad(
      <InteractiveGlobe infoCard={{ hint: false }} />,
    );
    expect(container.querySelector('.ig-top-right .ig-hint')).toBeNull();
    // the 4 rows still render
    expect(container.querySelectorAll('.ig-top-right .ig-info-row').length).toBe(4);
  });

  it('hiding every row also collapses the info card itself', async () => {
    const { container } = await renderAndLoad(
      <InteractiveGlobe infoCard={{
        view: false, lat: false, lon: false, distance: false, hint: false,
      }} />,
    );
    expect(container.querySelector('.ig-top-right')).toBeNull();
  });

  it('hint-only mode renders the hint without a divider above it', async () => {
    const { container } = await renderAndLoad(
      <InteractiveGlobe infoCard={{
        view: false, lat: false, lon: false, distance: false,
      }} />,
    );
    const card = container.querySelector('.ig-top-right');
    expect(card).toBeInTheDocument();
    expect(card.querySelectorAll('.ig-info-row').length).toBe(0);
    expect(card.querySelector('.ig-hint')).toBeInTheDocument();
  });

  it('panels.info=false still wins over individual infoCard rows', async () => {
    const { container } = await renderAndLoad(
      <InteractiveGlobe panels={{ info: false }} infoCard={{ lat: true, distance: true }} />,
    );
    expect(container.querySelector('.ig-top-right')).toBeNull();
  });
});

// ==================================================================
// ui preset
// ==================================================================
describe('ui preset', () => {
  it('ui="minimal" hides title and info, keeps bottom bar', async () => {
    const { container } = await renderAndLoad(<InteractiveGlobe ui="minimal" />);
    expect(container.querySelector('.ig-top-left')).toBeNull();
    expect(container.querySelector('.ig-top-right')).toBeNull();
    expect(container.querySelector('.ig-bottom')).toBeInTheDocument();
  });

  it('ui="none" strips all chrome', async () => {
    const { container } = await renderAndLoad(<InteractiveGlobe ui="none" />);
    expect(container.querySelector('.ig-top-left')).toBeNull();
    expect(container.querySelector('.ig-top-right')).toBeNull();
    expect(container.querySelector('.ig-bottom')).toBeNull();
  });
});

// ==================================================================
// Toggle behavior
// ==================================================================
describe('toggle buttons', () => {
  it('clicking 自转 forwards the new value into scene.setOptions({ autoRotate })', async () => {
    const user = userEvent.setup();
    await renderAndLoad(<InteractiveGlobe />);
    const scene = sceneInstances[0];
    const before = scene.calls.setOptions.filter(p => 'autoRotate' in p).length;

    await user.click(screen.getByRole('button', { name: '自转' }));

    const after = scene.calls.setOptions.filter(p => 'autoRotate' in p).length;
    expect(after).toBeGreaterThan(before);
    const last = scene.calls.setOptions.filter(p => 'autoRotate' in p).pop();
    expect(last.autoRotate).toBe(false); // started true, toggled to false
  });

  it('clicking the labels toggle reverses the showLabels option', async () => {
    const user = userEvent.setup();
    await renderAndLoad(<InteractiveGlobe />);
    const scene = sceneInstances[0];

    await user.click(screen.getByRole('button', { name: '标签' }));
    const last = scene.calls.setOptions.filter(p => 'showLabels' in p).pop();
    expect(last.showLabels).toBe(false);
  });
});

// ==================================================================
// Imperative API (forwardRef)
// ==================================================================
describe('imperative ref API', () => {
  it('exposes reset, zoomIn, zoomOut, flyTo, getInfo, getScene', async () => {
    const ref = createRef();
    await renderAndLoad(<InteractiveGlobe ref={ref} />);
    expect(typeof ref.current.reset).toBe('function');
    expect(typeof ref.current.zoomIn).toBe('function');
    expect(typeof ref.current.zoomOut).toBe('function');
    expect(typeof ref.current.flyTo).toBe('function');
    expect(typeof ref.current.getInfo).toBe('function');
    expect(typeof ref.current.getScene).toBe('function');
  });

  it('ref.reset() calls scene.reset()', async () => {
    const ref = createRef();
    await renderAndLoad(<InteractiveGlobe ref={ref} />);
    const scene = sceneInstances[0];
    ref.current.reset();
    expect(scene.calls.reset).toBe(1);
  });

  it('ref.flyTo(lat, lon, dist) forwards args to scene.flyTo', async () => {
    const ref = createRef();
    await renderAndLoad(<InteractiveGlobe ref={ref} />);
    const scene = sceneInstances[0];
    ref.current.flyTo(35.6762, 139.6503, 1.7);
    expect(scene.calls.flyTo).toEqual([[35.6762, 139.6503, 1.7]]);
  });

  it('ref.zoomIn / zoomOut call scene.zoom with the correct factors', async () => {
    const ref = createRef();
    await renderAndLoad(<InteractiveGlobe ref={ref} />);
    const scene = sceneInstances[0];
    ref.current.zoomIn();
    ref.current.zoomOut();
    expect(scene.calls.zoom).toEqual([0.78, 1.28]);
  });

  it('ref.getInfo() returns the scene\'s info snapshot', async () => {
    const ref = createRef();
    await renderAndLoad(<InteractiveGlobe ref={ref} />);
    expect(ref.current.getInfo()).toEqual({ lat: 12.34, lon: -56.78, dist: 2.5, level: 'L2' });
  });
});

// ==================================================================
// onPoiClick + onReady + onLoad callbacks
// ==================================================================
describe('lifecycle callbacks', () => {
  it('calls onReady with the underlying scene', async () => {
    const onReady = vi.fn();
    await renderAndLoad(<InteractiveGlobe onReady={onReady} />);
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it('calls onLoad once textures finish loading', async () => {
    const onLoad = vi.fn();
    await renderAndLoad(<InteractiveGlobe onLoad={onLoad} />);
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('passes onPoiClick through to the scene options', async () => {
    const onPoiClick = vi.fn();
    await renderAndLoad(<InteractiveGlobe onPoiClick={onPoiClick} />);
    expect(sceneInstances[0].options.onPoiClick).toBe(onPoiClick);
  });
});

// ==================================================================
// Initial scene options reflect prop values
// ==================================================================
describe('initial scene construction', () => {
  it('forwards exposure, autoRotate, showClouds, etc. to the scene constructor', async () => {
    await renderAndLoad(
      <InteractiveGlobe
        autoRotate={false}
        showClouds={false}
        showAtmosphere={false}
        exposure={2.0}
      />,
    );
    const scene = sceneInstances[0];
    expect(scene.options.autoRotate).toBe(false);
    expect(scene.options.showClouds).toBe(false);
    expect(scene.options.showAtmosphere).toBe(false);
    expect(scene.options.exposure).toBe(2.0);
  });

  it('forwards custom pois and labels arrays', async () => {
    const pois = [{ name: 'X', lat: 0, lon: 0 }];
    const labels = [{ name: 'Y', lat: 0, lon: 0, type: 'city', lod: 2 }];
    await renderAndLoad(<InteractiveGlobe pois={pois} labels={labels} />);
    expect(sceneInstances[0].options.pois).toBe(pois);
    expect(sceneInstances[0].options.labels).toBe(labels);
  });

  // Regression: 0.1.0 - 0.3.0 silently passed `textures: undefined` into
  // GlobeScene, which wiped DEFAULT_TEXTURES via spread and crashed
  // _initEarth with "Cannot read properties of undefined (reading 'day')".
  // Tests didn't catch it because GlobeScene was mocked. We now guard:
  // when the prop is omitted, textures must NOT be present in the scene
  // options (so GlobeScene's own default wins).
  it('omits textures from scene options when the prop is not passed', async () => {
    await renderAndLoad(<InteractiveGlobe />);
    expect('textures' in sceneInstances[0].options).toBe(false);
  });

  it('forwards textures when explicitly passed', async () => {
    const textures = { day: 'a.jpg', spec: 'b.png', bump: 'c.png', clouds: 'd.png' };
    await renderAndLoad(<InteractiveGlobe textures={textures} />);
    expect(sceneInstances[0].options.textures).toBe(textures);
  });
});

// ==================================================================
// className + style forwarding
// ==================================================================
describe('wrapper styling props', () => {
  it('forwards className to the root', async () => {
    const { container } = await renderAndLoad(<InteractiveGlobe className="custom-wrapper" />);
    expect(container.querySelector('.ig-root')).toHaveClass('custom-wrapper');
  });

  it('forwards style to the root', async () => {
    const { container } = await renderAndLoad(
      <InteractiveGlobe style={{ width: 800, height: 600 }} />,
    );
    const root = container.querySelector('.ig-root');
    expect(root.style.width).toBe('800px');
    expect(root.style.height).toBe('600px');
  });
});

// ==================================================================
// Loader text uses the resolved bundle
// ==================================================================
describe('loader text', () => {
  it('shows loadingText from the language bundle while textures load', async () => {
    const { container } = render(<InteractiveGlobe language="en" />);
    // Loader is mounted before the microtask onLoad fires
    expect(screen.getByText(STRINGS.en.loadingText)).toBeInTheDocument();
    // Let the pending load complete so the act() warning doesn't fire
    await waitFor(() => expect(container.querySelector('.ig-loader')).toBeNull());
  });

  it('respects strings.loadingText overrides', async () => {
    const { container } = render(<InteractiveGlobe strings={{ loadingText: 'Loading...' }} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    await waitFor(() => expect(container.querySelector('.ig-loader')).toBeNull());
  });
});
