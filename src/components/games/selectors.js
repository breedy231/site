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

// Pinned item wins if it exists and isn't done; otherwise the first undone
// item in document order. `items` must already be in document order.
export const pickNextUp = (items, state, achievements) => {
  const pin = state?.pin
  if (pin) {
    const pinned = items.find(item => item.id === pin)
    if (pinned && !isItemDone(pinned, state, achievements)) return pinned
  }
  return items.find(item => !isItemDone(item, state, achievements)) || null
}

export const flattenItems = (regions, custom = {}) =>
  regions.flatMap(region => [...region.items, ...(custom[region.id] || [])])
