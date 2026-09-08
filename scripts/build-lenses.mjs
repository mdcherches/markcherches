import { build } from 'esbuild';
import { copyFile } from 'node:fs/promises';

await build({
  entryPoints: ['node_modules/@snap/camera-kit/dist/index.js'],
  bundle: true,
  format: 'esm',
  minify: true,
  legalComments: 'external',
  outfile: 'assets/lenses/camera-kit.js'
});
await copyFile('node_modules/@snap/camera-kit/LICENSE.md', 'assets/lenses/LICENSE.md');
