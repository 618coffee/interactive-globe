import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Library build: emits dist/index.mjs, dist/index.cjs, dist/styles.css.
// React, three, and three/addons/* stay external — consumers provide them
// via peerDependencies. The example app uses vite.config.js instead.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    // Textures in public/ are served to consumers via jsDelivr-gh (see
    // DEFAULT_TEXTURES), not bundled — keep the npm tarball small.
    copyPublicDir: false,
    lib: {
      entry: 'src/lib/index.js',
      formats: ['es', 'cjs'],
      fileName: (fmt) => (fmt === 'es' ? 'index.mjs' : 'index.cjs'),
    },
    rollupOptions: {
      external: (id) =>
        id === 'react' ||
        id === 'react-dom' ||
        id === 'react/jsx-runtime' ||
        id === 'three' ||
        id.startsWith('three/'),
      output: {
        assetFileNames: (asset) => {
          if (asset.name && asset.name.endsWith('.css')) return 'styles.css';
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});
