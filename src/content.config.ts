import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
const posts = defineCollection({ loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }), schema: z.object({ title: z.string(), date: z.coerce.date(), category: z.enum(['Markets & Trades', 'Research & Models', 'Learning Notes', 'Thinking']), description: z.string(), type: z.enum(['Note', 'Research', 'Trade Review', 'Essay', 'Working Paper']), showToc: z.boolean().default(true), tags: z.array(z.string().max(40)).max(15).default([]), example: z.boolean().default(false) }) });
export const collections = { posts };
