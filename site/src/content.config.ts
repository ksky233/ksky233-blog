import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			originalDate: z.coerce.date().optional(),
			updatedDate: z.coerce.date().optional(),
			reviewedDate: z.coerce.date().optional(),
			contentStatus: z.enum(['current', 'historical', 'outdated']).default('current'),
			notice: z.string().optional(),
			series: z.string().optional(),
			seriesOrder: z.number().int().positive().optional(),
			category: z.string().default('Agent 工程'),
			tags: z.array(z.string()).default([]),
			featured: z.boolean().default(false),
			draft: z.boolean().default(false),
			heroImage: z.string().optional(),
		}),
});

export const collections = { blog };
