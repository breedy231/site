// Build search-friendly link targets from an item name using the templates in
// the game YAML. `{q}` -> encodeURIComponent, `{q+}` -> words joined with "+".

const SEPARATORS = [" — ", " (", " →", " + "]

export const queryName = name => {
  let cut = name
  for (const sep of SEPARATORS) {
    const idx = cut.indexOf(sep)
    if (idx > 0) cut = cut.slice(0, idx)
  }
  return cut.trim()
}

export const buildLink = (template, name) => {
  if (!template) return null
  const q = queryName(name)
  return template
    .replace(
      "{q+}",
      encodeURIComponent(q.split(/\s+/).join("+")).replace(/%2B/g, "+"),
    )
    .replace("{q}", encodeURIComponent(q))
}
