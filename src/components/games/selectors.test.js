import { describe, expect, it } from "vitest"
import { pickNextUp } from "./selectors"
import { DEFAULT_KINDS, KIND_COLORS, kindBadge, resolveKinds } from "./kinds"

const items = [
  { id: "a", kind: "boss", name: "A" },
  { id: "b", kind: "boss", name: "B" },
  { id: "c", kind: "boss", name: "C" },
  { id: "d", kind: "boss", name: "D" },
]
const state = (done = [], pin = null) => ({
  done: Object.fromEntries(done.map(id => [id, true])),
  pin,
})

describe("pickNextUp", () => {
  it("falls back to the first undone item in document order", () => {
    expect(pickNextUp(items, state(["a"]))?.id).toBe("b")
  })

  it("prefers an undone pin over the route", () => {
    expect(pickNextUp(items, state([], "d"), null, ["c"])?.id).toBe("d")
  })

  it("follows the route once the pin is done", () => {
    expect(
      pickNextUp(items, state(["d"], "d"), null, ["d", "c", "b"])?.id,
    ).toBe("c")
  })

  it("skips route ids that don't exist", () => {
    expect(pickNextUp(items, state(), null, ["zzz", "c"])?.id).toBe("c")
  })

  it("falls back to document order when the route is all done", () => {
    expect(pickNextUp(items, state(["c"]), null, ["c"])?.id).toBe("a")
  })

  it("treats Steam-unlocked route items as done", () => {
    const withSteam = [
      ...items,
      { id: "e", kind: "boss", name: "E", steam: "X" },
    ]
    expect(
      pickNextUp(withSteam, state(), { X: 1700000000 }, ["e", "b"])?.id,
    ).toBe("b")
  })

  it("returns null when everything is done", () => {
    expect(pickNextUp(items, state(["a", "b", "c", "d"]), null, ["a"])).toBe(
      null,
    )
  })
})

describe("kinds", () => {
  it("merges game kinds over the defaults", () => {
    const kinds = resolveKinds({
      etank: { label: "Energy Tank", color: "green" },
    })
    expect(kinds.area).toEqual(DEFAULT_KINDS.area)
    expect(kindBadge(kinds, "etank")).toEqual({
      label: "Energy Tank",
      className: KIND_COLORS.green,
    })
  })

  it("renders unknown kinds as the area badge", () => {
    expect(kindBadge(resolveKinds(), "nope").className).toBe(KIND_COLORS.gray)
  })
})
