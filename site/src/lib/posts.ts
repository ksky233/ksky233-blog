import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

export async function getVisiblePosts(): Promise<BlogPost[]> {
	const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
	return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function getPostUrl(post: BlogPost): string {
	return `/posts/${post.id}/`;
}

export function getSeriesMap(posts: BlogPost[]): Map<string, BlogPost[]> {
	const groups = new Map<string, BlogPost[]>();
	for (const post of posts) {
		if (!post.data.series) continue;
		const group = groups.get(post.data.series) ?? [];
		group.push(post);
		groups.set(post.data.series, group);
	}
	for (const group of groups.values()) {
		group.sort((a, b) => (a.data.seriesOrder ?? 999) - (b.data.seriesOrder ?? 999));
	}
	return groups;
}
