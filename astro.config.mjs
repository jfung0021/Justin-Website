import notebookBlocks from './plugins/remark-blocks.mjs';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import basePaths from './plugins/rehype-base-path.mjs';
const base = '/Justin-Website';
export default defineConfig({ site: 'https://jfung0021.github.io', base, output: 'static', integrations: [mdx()], markdown: { remarkPlugins: [notebookBlocks, remarkMath], rehypePlugins: [rehypeKatex, [basePaths, { base }]], shikiConfig: { theme: 'github-light' } } });

