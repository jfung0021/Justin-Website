import { build } from 'esbuild'; await build({ entryPoints: ['editor/vendor-entry.js'], bundle: true, outfile: 'editor/vendor.js', format: 'iife', platform: 'browser', minify: true });
