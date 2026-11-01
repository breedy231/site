import { beforeEach, describe, expect, it, vi } from "vitest"

const store = {
  get: vi.fn(),
  setJSON: vi.fn(),
}

vi.mock("@netlify/blobs", () => ({
  getStore: vi.fn(() => store),
}))

vi.mock("./lib/auth-cookie.js", () => ({
  isAuthed: vi.fn(() => true),
}))

const { getStore } = await import("@netlify/blobs")
const { isAuthed } = await import("./lib/auth-cookie.js")
const handler = (await import("./progress.js")).default

function req(url, { method = "GET", body } = {}) {
  return new Request(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
}

beforeEach(() => {
  store.get.mockReset()
  store.setJSON.mockReset()
  isAuthed.mockReset().mockReturnValue(true)
})

describe("progress.js auth", () => {
  it("rejects unauthenticated requests", async () => {
    isAuthed.mockReturnValue(false)
    const res = await handler(req("https://x/api/progress"))
    expect(res.status).toBe(401)
  })
})

describe("progress.js plan selection", () => {
  it("defaults to the honeymoon key/start with no plan param", async () => {
    store.get.mockResolvedValue(null)
    const res = await handler(req("https://x/api/progress"))
    const body = await res.json()
    expect(getStore).toHaveBeenCalledWith({
      name: "lang-plan",
      consistency: "strong",
    })
    expect(store.get).toHaveBeenCalledWith("progress", { type: "json" })
    expect(body).toEqual({ checked: {}, start: "2026-06-08" })
  })

  it("uses the spanish key/start for plan=spanish", async () => {
    store.get.mockResolvedValue(null)
    const res = await handler(req("https://x/api/progress?plan=spanish"))
    const body = await res.json()
    expect(store.get).toHaveBeenCalledWith("spanish", { type: "json" })
    expect(body).toEqual({ checked: {}, start: "2026-11-02" })
  })

  it("rejects an unknown plan", async () => {
    const res = await handler(req("https://x/api/progress?plan=klingon"))
    expect(res.status).toBe(400)
  })

  it("returns stored data as-is when present", async () => {
    store.get.mockResolvedValue({
      checked: { "w1a-d0": 1 },
      start: "2026-11-09",
    })
    const res = await handler(req("https://x/api/progress?plan=spanish"))
    const body = await res.json()
    expect(body).toEqual({ checked: { "w1a-d0": 1 }, start: "2026-11-09" })
  })
})

describe("progress.js POST sanitize", () => {
  it("writes to the plan-specific key and strips unknown fields", async () => {
    const res = await handler(
      req("https://x/api/progress?plan=spanish", {
        method: "POST",
        body: {
          checked: { w1a0: 1, bogus: 0 },
          start: "2026-11-09",
          evil: "x",
        },
      }),
    )
    expect(res.status).toBe(204)
    expect(store.setJSON).toHaveBeenCalledWith("spanish", {
      checked: { w1a0: 1 },
      start: "2026-11-09",
    })
  })

  it("falls back to the plan default start when start is missing", async () => {
    await handler(
      req("https://x/api/progress", {
        method: "POST",
        body: { checked: {} },
      }),
    )
    expect(store.setJSON).toHaveBeenCalledWith("progress", {
      checked: {},
      start: "2026-06-08",
    })
  })

  it("400s on malformed JSON body", async () => {
    const malformed = new Request("https://x/api/progress", {
      method: "POST",
      body: "{not json",
    })
    const res = await handler(malformed)
    expect(res.status).toBe(400)
  })
})

describe("progress.js method handling", () => {
  it("405s on unsupported methods", async () => {
    const res = await handler(
      req("https://x/api/progress", { method: "DELETE" }),
    )
    expect(res.status).toBe(405)
  })
})
