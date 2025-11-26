import type {APIRoute} from 'astro';
import {getCollection} from 'astro:content';

export const GET: APIRoute = async () => {
  const posts = await getCollection('blog', ({data}) => {
    return data.draft !== true;
  });

  const searchIndex = posts.map((post) => ({
    slug: post.id,
    title: post.data.title,
    description: post.data.description,
    tags: post.data.tags || [],
    pubDate: post.data.pubDate.toISOString(),
  }));

  return new Response(JSON.stringify(searchIndex), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
