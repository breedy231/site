// An item is "done" if it was hand-ticked in the progress blob OR Steam says
// one of its achievements is unlocked. Steam-derived done flags are never
// written back to the blob — they're a read-only overlay.

export const steamNamesFor = item => {
  const steam = item?.steam
  if (!steam) return []
  return Array.isArray(steam) ? steam : [steam]
}

// Unlock timestamp (unix seconds) if Steam confirms this item, else null.
export const steamUnlockAt = (item, achievements) => {
  if (!achievements) return null
  for (const name of steamNamesFor(item)) {
    const at = achievements[name]
    if (at !== undefined && at !== null) return at
  }
  return null
}

export const isItemDone = (item, state, achievements) =>
  Boolean(state?.done?.[item.id]) || steamUnlockAt(item, achievements) !== null

export const countDone = (items, state, achievements) =>
  items.filter(item => isItemDone(item, state, achievements)).length

// What to do next, in priority order:
//   1. the pinned item, if it exists and isn't done
//   2. the first undone item on the game's suggested `route` (ids)
//   3. the first undone item in document order
// `items` must already be in document order.
export const pickNextUp = (items, state, achievements, route = []) => {
  const undone = item => item && !isItemDone(item, state, achievements)
  const byId = id => items.find(item => item.id === id)

  const pin = state?.pin
  if (pin) {
    const pinned = byId(pin)
    if (undone(pinned)) return pinned
  }
  for (const id of route) {
    const step = byId(id)
    if (undone(step)) return step
  }
  return items.find(undone) || null
}

export const flattenItems = (regions, custom = {}) =>
  regions.flatMap(region => [...region.items, ...(custom[region.id] || [])])

// The route steps after the current objective that are still undone.
export const pickWaypoints = (
  items,
  state,
  achievements,
  route = [],
  currentId = null,
  limit = 2,
) => {
  const out = []
  for (const id of route) {
    if (id === currentId) continue
    const item = items.find(i => i.id === id)
    if (!item || isItemDone(item, state, achievements)) continue
    out.push(item)
    if (out.length >= limit) break
  }
  return out
}
