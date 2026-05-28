// Copies the hand-written declaration file into dist/ after the Vite library
// build. Run automatically as part of `npm run build`.
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src  = resolve(here, '..', 'src', 'lib', 'index.d.ts');
const dest = resolve(here, '..', 'dist', 'index.d.ts');

if (!existsSync(dirname(dest))) mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
console.log(`copy-types: ${src} -> ${dest}`);
