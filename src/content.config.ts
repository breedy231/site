import { defineCollection, z } from "astro:content"
import { glob } from "astro/loaders"

const blog = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./blog" }),
  schema: z.object({
    name: z.string(),
    datePublished: z.string(),
    author: z.string(),
    slug: z.string(),
  }),
})

export const collections = { blog }
