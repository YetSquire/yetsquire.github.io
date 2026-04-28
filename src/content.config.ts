import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  schema: z.object({
    id: z.string(),
    pathname: z.string(),
    link: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
    date: z.string(),
    tags: z.array(z.string()).optional(),
    cover: z.string().optional(),
    images: z.array(z.string()).optional(),
    videos: z.array(z.string()).optional(),
  }),
});

export const collections = {
  posts,
};
