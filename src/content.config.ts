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

const games = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/games" }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    character: z.string().optional(),
    links: z
      .object({
        map: z.string().optional(),
        wiki: z.string().optional(),
      })
      .optional(),
    stats: z
      .array(z.object({ key: z.string(), label: z.string() }))
      .default([]),
    regions: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          items: z
            .array(
              z.object({
                id: z.string(),
                kind: z.enum(["boss", "item", "quest", "area"]),
                name: z.string(),
                hint: z.string().optional(),
              }),
            )
            .default([]),
        }),
      )
      .default([]),
  }),
})

export const collections = { blog, games }
