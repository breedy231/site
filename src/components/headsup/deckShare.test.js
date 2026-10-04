import { afterEach, describe, expect, it, vi } from "vitest"
import { decks } from "../../data/headsupCategories"
import { uniqueDeckTitle } from "./customDecks"
import {
  MAX_JSON_BYTES,
  MAX_PAYLOAD_CHARS,
  MAX_SHARE_WORDS,
  SHARE_VERSION,
  buildShareUrl,
  decodeDeck,
  encodeDeck,
  readSharePayload,
} from "./deckShare"

const SITE = { origin: "https://brendanreed.me", pathname: "/headsup" }

const smallDeck = {
  title: "Office Jokes",
  words: [
    "Pizza Friday",
    "Standup meeting",
    "Broken printer",
    "Reply all",
    "Casual Friday",
  ],
}

// hand-built payloads, bypassing encodeDeck's validation
const b64url = text => Buffer.from(text).toString("base64url")
const plainPayload = (value, tag = `${SHARE_VERSION}j`) =>
  `${tag}.${b64url(typeof value === "string" ? value : JSON.stringify(value))}`

async function deflatedPayload(text) {
  const stream = new Blob([text])
    .stream()
    .pipeThrough(new CompressionStream("deflate-raw"))
  const bytes = Buffer.from(await new Response(stream).arrayBuffer())
  return `${SHARE_VERSION}z.${bytes.toString("base64url")}`
}

const expectShareError = (promise, code) =>
  expect(promise).rejects.toMatchObject({ name: "DeckShareError", code })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("round trip", () => {
  it("decodes what it encodes", async () => {
    const payload = await encodeDeck(smallDeck)
    expect(await decodeDeck(payload)).toEqual(smallDeck)
  })

  it("preserves unicode, emoji, and punctuation", async () => {
    const deck = {
      title: "Café ☕ Night",
      words: ["Crème brûlée", "日本", "🎉 Party", 'Say "cheese"', "A, B & C"],
    }
    expect(await decodeDeck(await encodeDeck(deck))).toEqual(deck)
  })

  it("compresses a full-size deck", async () => {
    const deck = { title: "Movies", words: decks[0].words.slice(0, 100) }
    const payload = await encodeDeck(deck)
    expect(payload.startsWith(`${SHARE_VERSION}z.`)).toBe(true)
    expect(await decodeDeck(payload)).toEqual(deck)
  })

  it("falls back to plain JSON without CompressionStream", async () => {
    vi.stubGlobal("CompressionStream", undefined)
    const deck = { title: "Movies", words: decks[0].words.slice(0, 100) }
    const payload = await encodeDeck(deck)
    expect(payload.startsWith(`${SHARE_VERSION}j.`)).toBe(true)
    // a plain payload opens even where DecompressionStream is missing
    vi.stubGlobal("DecompressionStream", undefined)
    expect(await decodeDeck(payload)).toEqual(deck)
  })

  it("trims and dedupes words the same way the create screen does", async () => {
    const payload = plainPayload({
      t: "  Office Jokes  ",
      w: [...smallDeck.words, " pizza friday ", "", "   "],
    })
    expect(await decodeDeck(payload)).toEqual(smallDeck)
  })

  it("builds and reads back a share URL", async () => {
    const payload = await encodeDeck(smallDeck)
    const url = new URL(buildShareUrl(payload, SITE))
    expect(url.origin + url.pathname).toBe("https://brendanreed.me/headsup")
    expect(readSharePayload(url.hash)).toBe(payload)
    expect(await decodeDeck(readSharePayload(url.hash))).toEqual(smallDeck)
  })

  it("ignores URLs that aren't shares", () => {
    expect(readSharePayload("")).toBeNull()
    expect(readSharePayload("#")).toBeNull()
    expect(readSharePayload("#section")).toBeNull()
  })
})

describe("size bound", () => {
  it("keeps a 100-word deck URL under 2KB", async () => {
    // the 100 longest words across the built-in decks: a worst-ish case
    const longest = decks
      .flatMap(deck => deck.words)
      .sort((a, b) => b.length - a.length)
    const words = [...new Set(longest)].slice(0, 100)
    const url = buildShareUrl(
      await encodeDeck({ title: "x".repeat(40), words }),
      SITE,
    )
    expect(url.length).toBeLessThan(2048)
  })

  it("is never longer than the plain JSON encoding", async () => {
    const compressed = await encodeDeck(smallDeck)
    vi.stubGlobal("CompressionStream", undefined)
    const plain = await encodeDeck(smallDeck)
    expect(compressed.length).toBeLessThanOrEqual(plain.length)
  })

  it(`refuses to encode more than ${MAX_SHARE_WORDS} words`, async () => {
    const words = Array.from({ length: MAX_SHARE_WORDS + 1 }, (_, i) => `w${i}`)
    await expectShareError(encodeDeck({ title: "Big", words }), "too-large")
  })

  it("rejects an over-long payload before decoding it", async () => {
    await expectShareError(
      decodeDeck(`${SHARE_VERSION}j.${"A".repeat(MAX_PAYLOAD_CHARS)}`),
      "too-large",
    )
  })

  it("stops inflating a payload that expands past the cap", async () => {
    // ~1MB of spaces deflates to about a kilobyte
    const bomb = `{"t":"Bomb","w":["a","b","c","d","e"],"x":"${" ".repeat(1 << 20)}"}`
    const payload = await deflatedPayload(bomb)
    expect(payload.length).toBeLessThan(MAX_PAYLOAD_CHARS)
    expect(bomb.length).toBeGreaterThan(MAX_JSON_BYTES)
    await expectShareError(decodeDeck(payload), "too-large")
  })
})

describe("malformed input", () => {
  it.each([
    ["empty", ""],
    ["not a string", undefined],
    ["no version tag", b64url(JSON.stringify(smallDeck))],
    ["missing separator", `${SHARE_VERSION}j`],
    ["missing data", `${SHARE_VERSION}j.`],
    ["non-base64url characters", `${SHARE_VERSION}j.abc+/=`],
    ["impossible base64 length", `${SHARE_VERSION}j.abcde`],
    ["not JSON", plainPayload("not json")],
    [
      "invalid UTF-8",
      `${SHARE_VERSION}j.${Buffer.from([0xff, 0xfe]).toString("base64url")}`,
    ],
    ["JSON array", plainPayload([smallDeck.title, smallDeck.words])],
    ["JSON null", plainPayload("null")],
    ["missing title", plainPayload({ w: smallDeck.words })],
    ["blank title", plainPayload({ t: "   ", w: smallDeck.words })],
    ["title too long", plainPayload({ t: "x".repeat(41), w: smallDeck.words })],
    ["missing words", plainPayload({ t: "Deck" })],
    ["words not an array", plainPayload({ t: "Deck", w: "a,b,c,d,e" })],
    [
      "non-string word",
      plainPayload({ t: "Deck", w: [...smallDeck.words, 7] }),
    ],
    ["too few words", plainPayload({ t: "Deck", w: ["a", "b", "c", "d"] })],
    [
      "too few words after dedupe",
      plainPayload({ t: "Deck", w: ["a", "A", "b", "c", "d"] }),
    ],
    [
      "garbage compressed data",
      `${SHARE_VERSION}z.${b64url("definitely not deflate")}`,
    ],
  ])("rejects %s", async (_, payload) => {
    await expectShareError(decodeDeck(payload), "malformed")
  })

  it("rejects a truncated compressed payload", async () => {
    const payload = await encodeDeck({
      title: "Movies",
      words: decks[0].words.slice(0, 100),
    })
    await expectShareError(decodeDeck(payload.slice(0, -40)), "malformed")
  })

  it("rejects compressed data that isn't JSON", async () => {
    await expectShareError(
      decodeDeck(await deflatedPayload("nope")),
      "malformed",
    )
  })

  it("reports browsers that can't decompress", async () => {
    const payload = await deflatedPayload(
      JSON.stringify({ t: smallDeck.title, w: smallDeck.words }),
    )
    vi.stubGlobal("DecompressionStream", undefined)
    await expectShareError(decodeDeck(payload), "unsupported")
  })
})

describe("version tag", () => {
  it(`stamps payloads with version ${SHARE_VERSION}`, async () => {
    expect(await encodeDeck(smallDeck)).toMatch(
      new RegExp(`^${SHARE_VERSION}[zj]\\.[A-Za-z0-9_-]+$`),
    )
  })

  it("asks for a reload on payloads from a newer version", async () => {
    const deck = { t: smallDeck.title, w: smallDeck.words }
    await expectShareError(
      decodeDeck(plainPayload(deck, `${SHARE_VERSION + 1}j`)),
      "version",
    )
    // an unknown codec from the future is still a version problem
    await expectShareError(
      decodeDeck(plainPayload(deck, `${SHARE_VERSION + 1}q`)),
      "version",
    )
  })

  it.each(["0j", "01j", `${SHARE_VERSION}q`, `${SHARE_VERSION}J`, "vj", "-1j"])(
    "rejects tag %s as malformed",
    async tag => {
      const deck = { t: smallDeck.title, w: smallDeck.words }
      await expectShareError(decodeDeck(plainPayload(deck, tag)), "malformed")
    },
  )
})

describe("uniqueDeckTitle", () => {
  const existing = ["Pub Quiz", "pub quiz (2)", "Road Trip"].map(title => ({
    title,
  }))

  it("keeps a title that's free", () => {
    expect(uniqueDeckTitle("Office Jokes", existing)).toBe("Office Jokes")
  })

  it("suffixes a clash, case-insensitively", () => {
    expect(uniqueDeckTitle("Road Trip", existing)).toBe("Road Trip (2)")
    expect(uniqueDeckTitle("PUB QUIZ", existing)).toBe("PUB QUIZ (3)")
  })

  it("keeps a suffixed title within 40 characters", () => {
    const long = "x".repeat(40)
    const title = uniqueDeckTitle(long, [{ title: long }])
    expect(title).toBe("x".repeat(36) + " (2)")
    expect(title.length).toBe(40)
  })
})
