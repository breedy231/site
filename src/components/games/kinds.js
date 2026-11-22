// Item kinds drive the badge on each checklist row. Every game gets the
// defaults (custom items added on the page are always "area"); a game YAML can
// add its own under `kinds:` or relabel/recolor a default.

// Full class strings so Tailwind can see them at build time.
export const KIND_COLORS = {
  red: "border-red-400 text-red-600 dark:border-red-500 dark:text-red-300",
  blue: "border-blue-400 text-blue-600 dark:border-blue-400 dark:text-blue-300",
  amber:
    "border-amber-500 text-amber-700 dark:border-amber-400 dark:text-amber-300",
  gray: "border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-300",
  green:
    "border-green-500 text-green-700 dark:border-green-400 dark:text-green-300",
  orange:
    "border-orange-400 text-orange-600 dark:border-orange-400 dark:text-orange-300",
  purple:
    "border-purple-400 text-purple-600 dark:border-purple-400 dark:text-purple-300",
  sky: "border-sky-500 text-sky-700 dark:border-sky-400 dark:text-sky-300",
}

export const KIND_COLOR_NAMES = Object.keys(KIND_COLORS)

export const DEFAULT_KINDS = {
  boss: { label: "Boss", color: "red" },
  quest: { label: "Quest", color: "blue" },
  item: { label: "Item", color: "amber" },
  area: { label: "Area", color: "gray" },
}

export const resolveKinds = gameKinds => ({
  ...DEFAULT_KINDS,
  ...(gameKinds || {}),
})

export const kindBadge = (kinds, kind) => {
  const entry = kinds[kind] || DEFAULT_KINDS.area
  return {
    label: entry.label || kind,
    className: KIND_COLORS[entry.color] || KIND_COLORS.gray,
  }
}
