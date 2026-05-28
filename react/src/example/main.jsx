import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// NOTE: StrictMode intentionally omitted here. StrictMode double-mounts
// effects, which on this component disposes the WebGL context and then
// tries to recreate it on the same canvas — Three.js refuses, and the
// app silently renders nothing. The library is StrictMode-safe in
// tests (GlobeScene is mocked there); the real WebGL path needs the
// dispose-then-recreate behavior to be friendlier before we can turn
// StrictMode back on in the demo.
createRoot(document.getElementById('root')).render(<App />);
