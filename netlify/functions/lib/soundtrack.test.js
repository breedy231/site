import { describe, expect, it, vi } from "vitest"
import {
  VOCAL_HINTS,
  albumMatches,
  filterTracks,
  slugify,
  soundtrackKey,
} from "./soundtrack.js"

const item = (name, ...artists) => ({
  name,
  artists: artists.map(a => ({ name: a })),
})

describe("albumMatches", () => {
  it("ignores differing soundtrack qualifiers", () => {
    const got = item(
      "Chernobyl (Music from the Original TV Series)",
      "Hildur Guðnadóttir",
    )
    expect(
      albumMatches(
        "Hildur Guðnadóttir",
        "Chernobyl (Original Series Soundtrack)",
        got,
      ),
    ).toBe(true)
  })

  it("handles dash qualifiers", () => {
    const got = item(
      "1917 (Original Motion Picture Soundtrack)",
      "Thomas Newman",
    )
    expect(
      albumMatches(
        "Thomas Newman",
        "1917 - Original Motion Picture Soundtrack",
        got,
      ),
    ).toBe(true)
  })

  it("matches any of several credited artists", () => {
    const got = item(
      "All Quiet on the Western Front (Soundtrack from the Netflix Film)",
      "Volker Bertelmann",
      "Hauschka",
    )
    expect(
      albumMatches("Volker Bertelmann", "All Quiet on the Western Front", got),
    ).toBe(true)
  })

  it("treats accented and unaccented names as equal", () => {
    expect(
      albumMatches(
        "Arvo Part",
        "Tabula Rasa",
        item("Tabula Rasa", "Arvo Pärt"),
      ),
    ).toBe(true)
  })

  it("rejects the wrong artist", () => {
    expect(
      albumMatches(
        "Max Richter",
        "Sleep",
        item("Sleep", "Some Sleep Sounds Collective"),
      ),
    ).toBe(false)
  })

  it("rejects a different album by the same artist", () => {
    expect(
      albumMatches(
        "Max Richter",
        "Sleep",
        item("The Blue Notebooks", "Max Richter"),
      ),
    ).toBe(false)
  })

  it("rejects names that normalize to nothing", () => {
    expect(
      albumMatches("Max Richter", "(Deluxe)", item("Sleep", "Max Richter")),
    ).toBe(false)
  })
})

describe("filterTracks", () => {
  const t = (name, sec) => ({ name, duration_ms: sec * 1000, uri: name })

  it("drops vocal-flagged and very short tracks, then caps per album", () => {
    const tracks = [
      t("Intro", 30),
      t("Night Song (feat. Someone)", 200),
      t("A", 200),
      t("B", 200),
      t("C", 200),
    ]
    expect(filterTracks(tracks, 2).map(x => x.name)).toEqual(["A", "B"])
  })

  it("keeps short cues when an album has nothing longer", () => {
    expect(filterTracks([t("x", 20), t("y", 40)], 6)).toHaveLength(2)
  })
})

describe("VOCAL_HINTS", () => {
  it("flags features but not instrumental titles with 'song'", () => {
    expect(VOCAL_HINTS.test("Lament (feat. A Singer)")).toBe(true)
    expect(VOCAL_HINTS.test("Vocal Version")).toBe(true)
    expect(VOCAL_HINTS.test("On the Nature of Daylight")).toBe(false)
    expect(VOCAL_HINTS.test("Song for the Fallen")).toBe(false)
  })
})

describe("keys", () => {
  it("slugifies titles with accents and punctuation", () => {
    expect(slugify("Angel Down: A Novel")).toBe("angel-down-a-novel")
    expect(slugify("Jóhann's Orphée")).toBe("johann-s-orphee")
  })

  it("separates book and scene playlists", () => {
    expect(soundtrackKey("Angel Down")).toBe("angel-down")
    expect(soundtrackKey("Angel Down", "No Man's Land")).toBe(
      "angel-down--no-man-s-land",
    )
  })
})

describe("pickAlbums", () => {
  it("sends a JSON-schema request to Haiku and parses the picks", async () => {
    const create = vi.fn().mockResolvedValue({
      stop_reason: "end_turn",
      content: [
        {
          type: "text",
          text: JSON.stringify({
            summary: "WWI dread",
            mood_tags: ["dread"],
            picks: [{ artist: "Thomas Newman", album: "1917", why: "WWI" }],
          }),
        },
      ],
    })
    vi.doMock("@anthropic-ai/sdk", () => ({
      default: class {
        messages = { create }
      },
    }))
    vi.resetModules()
    const { pickAlbums } = await import("./soundtrack.js")

    const data = await pickAlbums({
      title: "Angel Down",
      author: "Daniel Kraus",
      chapter: "No Man's Land",
      about: "A WWI novel",
    })

    expect(data.picks).toEqual([
      { artist: "Thomas Newman", album: "1917", why: "WWI" },
    ])
    const req = create.mock.calls[0][0]
    expect(req.model).toBe("claude-haiku-4-5")
    expect(req.output_config.format.type).toBe("json_schema")
    expect(req.messages[0].content).toContain("A WWI novel")
    expect(req.messages[0].content).toContain("No Man's Land")
    vi.doUnmock("@anthropic-ai/sdk")
  })
})
