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

// Must match ID_RE in netlify/functions/game-progress.js, or progress for
// the item is silently dropped on save.
const progressId = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/)

const gameItem = z.object({
  id: progressId,
  // Must be a default kind (boss/quest/item/area) or one declared in `kinds`.
  kind: z.string(),
  name: z.string(),
  hint: z.string().optional(),
  // HUD inventory tile: short code (else initials) and grouping heading.
  icon: z.string().max(4).optional(),
  group: z.string().optional(),
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
      // Small print under the visor (e.g. "fan-made, unofficial").
      footnote: z.string().optional(),
      // Visual theme; see src/styles/game-themes.css.
      theme: z.enum(["plain", "visor", "erdtree"]).default("plain"),
      // HUD layout. Without it, every kind gets a progress bar.
      hud: z
        .object({
          // One kind shown as a tile grid (owned = lit), grouped by item `group`.
          inventory: z
            .object({
              kind: z.string(),
              title: z.string().optional(),
              groups: z.array(z.string()).default([]),
              // Tile order within groups (item ids); others follow page order.
              order: z.array(z.string()).default([]),
            })
            .optional(),
          counters: z
            .array(
              z.object({
                kind: z.string(),
                label: z.string().optional(),
                style: z.enum(["bar", "pips", "slots"]).default("bar"),
              }),
            )
            .default([]),
          // Vitals on the visor view (default: the first two counters).
          readouts: z
            .array(
              z.object({
                kind: z.string(),
                label: z.string().optional(),
                style: z.enum(["bar", "pips"]).default("bar"),
              }),
            )
            .default([]),
          // Button that opens inventory/areas/checklist from the visor.
          logLabel: z.string().optional(),
        })
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
            id: progressId,
            name: z.string(),
            // Tints the HUD while the objective is in this region.
            accent: z
              .string()
              .regex(/^#[0-9a-fA-F]{6}$/)
              .optional(),
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
          if (!Object.hasOwn(kinds, item.kind)) {
            ctx.addIssue({
              code: "custom",
              message: `Item "${item.id}" has unknown kind "${item.kind}"`,
            })
          }
        }
      }
      const hudKinds = [
        game.hud?.inventory?.kind,
        ...(game.hud?.counters || []).map(c => c.kind),
        ...(game.hud?.readouts || []).map(c => c.kind),
      ].filter(Boolean)
      for (const kind of hudKinds) {
        if (!Object.hasOwn(kinds, kind)) {
          ctx.addIssue({
            code: "custom",
            message: `hud references unknown kind "${kind}"`,
          })
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
