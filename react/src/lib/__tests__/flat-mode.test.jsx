import { describe, it, expect, beforeAll } from 'vitest';
import { createRef } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { InteractiveGlobe } from '../InteractiveGlobe.jsx';

// FlatGlobe uses ResizeObserver (absent in jsdom) and is lazy-loaded.
beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

describe('mode="flat"', () => {
  it('renders the flat SVG globe (not the webgl canvas) with POI labels', async () => {
    const pois = [{ name: 'Beijing', lat: 39.9, lon: 116.4 }];
    const { container } = render(<InteractiveGlobe mode="flat" ui="none" pois={pois} />);
    await waitFor(() => {
      expect(container.querySelector('.ig-flat')).not.toBeNull();
    });
    // The webgl canvas is not rendered in flat mode.
    expect(container.querySelector('.ig-canvas')).toBeNull();
    expect(screen.getByText('Beijing')).toBeInTheDocument();
  });

  it('exposes a flyTo/getInfo handle that delegates to the flat controller', async () => {
    const ref = createRef();
    const { container } = render(
      <InteractiveGlobe ref={ref} mode="flat" ui="none" pois={[{ name: 'A', lat: 0, lon: 0 }]} />,
    );
    await waitFor(() => expect(container.querySelector('.ig-flat')).not.toBeNull());
    expect(() => ref.current.flyTo(10, 20)).not.toThrow();
    expect(ref.current.getInfo()).toMatchObject({ level: 'L2' });
    expect(ref.current.getScene()).not.toBeNull();
  });
});
