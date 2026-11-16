import { describe, expect, it } from "vitest"
import {
  areaSummary,
  counterFor,
  iconFor,
  inventoryGroups,
  regionIndex,
  resolveHud,
} from "./hud"

const items = [
  { id: "u1", kind: "upgrade", name: "Charge Beam", group: "Beams" },
  { id: "u2", kind: "upgrade", name: "Morph Ball", group: "Morph Ball" },
  { id: "u3", kind: "upgrade", name: "Wave Beam", group: "Beams", icon: "WAV" },
  { id: "u4", kind: "upgrade", name: "Mystery Thing" },
  { id: "e1", kind: "etank", name: "Room — Energy Tank" },
  { id: "e2", kind: "etank", name: "Other — Energy Tank" },
  { id: "b1", kind: "boss", name: "Boss" },
  { id: "x1", kind: "area", name: "Somewhere" },
]
const state = { done: { u1: true, e2: true, b1: true }, pin: null }

describe("resolveHud", () => {
  it("defaults to one bar per kind in use, skipping area", () => {
    expect(resolveHud(undefined, items).counters).toEqual([
      { kind: "upgrade", style: "bar" },
      { kind: "etank", style: "bar" },
      { kind: "boss", style: "bar" },
    ])
  })

  it("keeps a configured hud as-is", () => {
    const hud = { counters: [{ kind: "etank", style: "pips" }] }
    expect(resolveHud(hud, items)).toEqual({ inventory: null, ...hud })
  })
})

describe("iconFor", () => {
  it("prefers the explicit icon", () => {
    expect(iconFor(items[2])).toBe("WAV")
  })
  it("falls back to initials, ignoring the room separator", () => {
    expect(iconFor(items[0])).toBe("CB")
    expect(iconFor(items[4])).toBe("RET")
  })
})

describe("inventoryGroups", () => {
  it("groups tiles in the configured order, unknown groups last", () => {
    const groups = inventoryGroups(items, {
      kind: "upgrade",
      groups: ["Morph Ball", "Beams", "Unused"],
    })
    expect(groups.map(g => [g.name, g.items.map(i => i.id)])).toEqual([
      ["Morph Ball", ["u2"]],
      ["Beams", ["u1", "u3"]],
      ["Other", ["u4"]],
    ])
  })
  it("returns nothing without an inventory", () => {
    expect(inventoryGroups(items, null)).toEqual([])
  })
})

describe("counterFor", () => {
  it("counts done items of the kind", () => {
    const c = counterFor(items, { kind: "etank", style: "pips" }, state, null)
    expect([c.done, c.total, c.style]).toEqual([1, 2, "pips"])
  })
})

describe("areaSummary / regionIndex", () => {
  const region = { id: "r", name: "R", items: items.slice(4) }
  const custom = { r: [{ id: "c1", kind: "area", name: "Mine" }] }

  it("includes custom items and boss status", () => {
    const a = areaSummary(region, custom, state, null)
    expect([a.done, a.total, a.pct]).toEqual([2, 5, 40])
    expect(a.bosses).toEqual([{ id: "b1", name: "Boss", done: true }])
  })

  it("maps item ids (custom too) to their region", () => {
    const index = regionIndex([region], custom)
    expect(index.c1.id).toBe("r")
    expect(index.e1.id).toBe("r")
  })
})

describe("inventoryGroups order", () => {
  it("puts listed ids first within each group", () => {
    const groups = inventoryGroups(items, {
      kind: "upgrade",
      groups: ["Beams"],
      order: ["u3", "u1"],
    })
    expect(groups[0].items.map(i => i.id)).toEqual(["u3", "u1"])
  })
})
