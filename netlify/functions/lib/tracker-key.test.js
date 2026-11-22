import { afterEach, describe, expect, it } from "vitest"
import { isAuthedForWrite } from "./tracker-key.js"

const req = key =>
  new Request("https://x.test/", {
    headers: key === undefined ? {} : { "x-tracker-key": key },
  })

describe("isAuthedForWrite", () => {
  const saved = { ...process.env }
  afterEach(() => {
    process.env = { ...saved }
  })

  it("checks TRACKER_KEY by default", () => {
    process.env.TRACKER_KEY = "strong-token"
    expect(isAuthedForWrite(req("strong-token"))).toEqual({
      ok: true,
      configured: true,
    })
    expect(isAuthedForWrite(req("nope")).ok).toBe(false)
    expect(isAuthedForWrite(req()).ok).toBe(false)
  })

  it("checks a named env var when given", () => {
    process.env.TRACKER_KEY = "strong-token"
    process.env.GAME_TRACKER_KEY = "short-passphrase"
    expect(isAuthedForWrite(req("short-passphrase"), "GAME_TRACKER_KEY").ok).toBe(
      true,
    )
    expect(isAuthedForWrite(req("strong-token"), "GAME_TRACKER_KEY").ok).toBe(
      false,
    )
  })

  it("reports unconfigured when the env var is missing", () => {
    delete process.env.GAME_TRACKER_KEY
    expect(isAuthedForWrite(req("x"), "GAME_TRACKER_KEY")).toEqual({
      ok: false,
      configured: false,
    })
  })
})
