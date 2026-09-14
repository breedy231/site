// Pinned item wins if it exists and isn't done; otherwise the first undone
// item in document order. `items` must already be in document order.
export const pickNextUp = (items, state) => {
  const done = state?.done || {}
  const pin = state?.pin
  if (pin) {
    const pinned = items.find(item => item.id === pin)
    if (pinned && !done[pinned.id]) return pinned
  }
  return items.find(item => !done[item.id]) || null
}

export const flattenItems = (regions, custom = {}) =>
  regions.flatMap(region => [...region.items, ...(custom[region.id] || [])])
