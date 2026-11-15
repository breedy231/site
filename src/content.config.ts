import { defineCollection, z } from "astro:content"
import { glob } from "astro/loaders"
import { KIND_COLOR_NAMES, resolveKinds } from "./components/games/kinds.js"

const blog = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./blog" }),
  schema: z.object({
    name: z.string(),
    datePublished: z.string(),
    author: z.string(),
    slug: z.string(),
  }),
})

const gameItem = z.object({
  id: z.string(),
  // Must be a default kind (boss/quest/item/area) or one declared in `kinds`.
  kind: z.string(),
  name: z.string(),
  hint: z.string().optional(),
  // Steam achievement apiname(s). Any one unlocked marks the
  // item done (Elden Ring's endings are three separate names).
  steam: z.union([z.string(), z.array(z.string())]).optional(),
})

const games = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/games" }),
  schema: z
    .object({
      slug: z.string(),
      title: z.string(),
      character: z.string().optional(),
      // Steam app this game maps to; enables achievement/playtime sync.
      steam: z.object({ appid: z.number() }).optional(),
      links: z
        .object({
          map: z.string().optional(),
          wiki: z.string().optional(),
        })
        .optional(),
      // Extra item kinds for this game, merged over the defaults.
      kinds: z
        .record(
          z.string(),
          z.object({
            label: z.string(),
            color: z.enum(KIND_COLOR_NAMES),
          }),
        )
        .optional(),
      // Short markdown shown under "Next up": tips, where I'm stuck.
      notes: z.string().optional(),
      // Suggested order of item ids. "Next up" = pin, else the first undone
      // route item, else the first undone item on the page.
      route: z.array(z.string()).default([]),
      stats: z
        .array(z.object({ key: z.string(), label: z.string() }))
        .default([]),
      regions: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
            items: z.array(gameItem).default([]),
          }),
        )
        .default([]),
    })
    .superRefine((game, ctx) => {
      const kinds = resolveKinds(game.kinds)
      const ids = new Set()
      for (const region of game.regions) {
        for (const item of region.items) {
          if (ids.has(item.id)) {
            ctx.addIssue({
              code: "custom",
              message: `Duplicate item id "${item.id}"`,
            })
          }
          ids.add(item.id)
          if (!kinds[item.kind]) {
            ctx.addIssue({
              code: "custom",
              message: `Item "${item.id}" has unknown kind "${item.kind}"`,
            })
          }
        }
      }
      for (const id of game.route) {
        if (!ids.has(id)) {
          ctx.addIssue({
            code: "custom",
            message: `Route references unknown item "${id}"`,
          })
        }
      }
    }),
})

export const collections = { blog, games }
