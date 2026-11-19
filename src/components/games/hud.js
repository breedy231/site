// Pure helpers that turn a game definition + progress into HUD pieces:
// inventory tiles, counters, and area summaries.
import { isItemDone } from "./selectors"

// Without a `hud:` block, show one progress bar per kind in use.
export const resolveHud = (hud, items) => {
  if (hud) return { inventory: null, counters: [], ...hud }
  const used = [...new Set(items.map(item => item.kind))].filter(
    kind => kind !== "area",
  )
  return {
    inventory: null,
    counters: used.map(kind => ({ kind, style: "bar" })),
  }
}

// Short tile code: explicit `icon`, else initials of the first three words.
export const iconFor = item =>
  item.icon ||
  item.name
    .split(/[\s—-]+/)
    .filter(Boolean)
    .slice(0, 3)
    .map(word => word[0])
    .join("")
    .toUpperCase()

// Tiles for the inventory kind, grouped by `group` in the order given.
// Within a group, ids listed in `inventory.order` come first, in that order;
// the rest follow in document order.
export const inventoryGroups = (items, inventory) => {
  if (!inventory) return []
  const rank = new Map((inventory.order || []).map((id, i) => [id, i]))
  const sorted = items
    .map((item, i) => [item, rank.has(item.id) ? rank.get(item.id) : 1e6 + i])
    .sort((a, b) => a[1] - b[1])
    .map(([item]) => item)
  const groups = new Map((inventory.groups || []).map(name => [name, []]))
  for (const item of sorted) {
    if (item.kind !== inventory.kind) continue
    const name = item.group || "Other"
    if (!groups.has(name)) groups.set(name, [])
    groups.get(name).push(item)
  }
  return [...groups]
    .filter(([, list]) => list.length > 0)
    .map(([name, list]) => ({ name, items: list }))
}

// A counter normally counts ticked items of its kind. With `stat`, a number
// typed into that stat wins (e.g. missile capacity when you don't know which
// expansions you've found); `max` overrides the total.
export const counterFor = (items, counter, state, achievements) => {
  const list = items.filter(item => item.kind === counter.kind)
  const ticked = list.filter(item =>
    isItemDone(item, state, achievements),
  ).length
  const raw = counter.stat ? state?.stats?.[counter.stat] : undefined
  const fromStat = raw === undefined || raw === "" ? NaN : Number(raw)
  const total = counter.max ?? list.length
  return {
    ...counter,
    items: list,
    done: Number.isFinite(fromStat)
      ? Math.max(0, Math.min(fromStat, total))
      : ticked,
    total,
    ticked,
  }
}

export const areaSummary = (region, custom, state, achievements) => {
  const items = [...region.items, ...((custom || {})[region.id] || [])]
  const done = items.filter(item => isItemDone(item, state, achievements))
  return {
    id: region.id,
    name: region.name,
    total: items.length,
    done: done.length,
    pct: items.length ? Math.round((done.length / items.length) * 100) : 0,
    bosses: items
      .filter(item => item.kind === "boss")
      .map(item => ({
        id: item.id,
        name: item.name,
        done: isItemDone(item, state, achievements),
      })),
  }
}

// Region name for each item id (custom items included).
export const regionIndex = (regions, custom) => {
  const index = {}
  for (const region of regions) {
    for (const item of [
      ...region.items,
      ...((custom || {})[region.id] || []),
    ]) {
      index[item.id] = region
    }
  }
  return index
}
