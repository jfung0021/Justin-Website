import notebookBlocks from './plugins/remark-blocks.mjs';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
export default defineConfig({ output: 'static', integrations: [mdx()], markdown: { remarkPlugins: [notebookBlocks, remarkMath], rehypePlugins: [rehypeKatex], shikiConfig: { theme: 'github-light' } } });

