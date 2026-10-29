import { useCallback, useEffect, useState } from "react"
import PropTypes from "prop-types"

// Lyrics-free Spotify soundtrack for the current book. Only renders for a device
// holding the tracker write key (same localStorage key as the game tracker).
// With ?admin and no key, shows an unlock field.

const KEY_STORAGE = "tracker-key"

const apiUrl = name =>
  import.meta.env.DEV ? `/api/${name}` : `/.netlify/functions/${name}`

const readKey = () => {
  try {
    return window.localStorage.getItem(KEY_STORAGE)
  } catch {
    return null
  }
}

const formatDuration = min =>
  min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${min}m`

async function postJson(url, key, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Tracker-Key": key },
    body: JSON.stringify(body ?? {}),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

// Goodreads titles carry series info: "Title (Series, #1)".
const cleanTitle = title =>
  title.replace(/\s*\([^)]*#\d+[^)]*\)\s*$/, "").trim()

const ReadingSoundtrack = ({ book: goodreadsBook }) => {
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [key, setKey] = useState(null)
  const [showUnlock, setShowUnlock] = useState(false)
  const [keyInput, setKeyInput] = useState("")
  const [status, setStatus] = useState(null) // { result, spotifyConnected }
  const [phase, setPhase] = useState("idle") // idle | picking | building
  const [picks, setPicks] = useState(null)
  const [scene, setScene] = useState("")
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    setKey(readKey())
    const params = new URLSearchParams(window.location.search)
    setShowUnlock(params.has("admin"))
    const spotify = params.get("spotify")
    if (spotify === "connected") setNotice("Spotify connected.")
    else if (spotify) setError(`Spotify connect ${spotify}. Try again.`)
  }, [])

  // Prefill from Goodreads "currently reading"; any book can be typed instead.
  useEffect(() => {
    if (!goodreadsBook) return
    setTitle(cleanTitle(goodreadsBook.title))
    setAuthor(goodreadsBook.author || "")
  }, [goodreadsBook])

  const loadStatus = useCallback(forTitle => {
    const params = new URLSearchParams()
    if (forTitle.trim()) params.set("title", forTitle.trim())
    return fetch(`${apiUrl("reading-soundtrack")}?${params}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => data && setStatus(data))
      .catch(() => {})
  }, [])

  const prefilledTitle = goodreadsBook ? cleanTitle(goodreadsBook.title) : ""
  useEffect(() => {
    if (key) loadStatus(prefilledTitle)
  }, [key, loadStatus, prefilledTitle])

  const handleAuthError = err => {
    if (err.status === 401) {
      try {
        window.localStorage.removeItem(KEY_STORAGE)
      } catch {
        // ignore storage failures
      }
      setKey(null)
      setShowUnlock(true)
      setError("Key rejected. Unlock again.")
      return true
    }
    return false
  }

  const connectSpotify = async () => {
    setError(null)
    try {
      const { url } = await postJson(apiUrl("spotify-auth"), key)
      window.location.href = url
    } catch (err) {
      if (!handleAuthError(err)) setError(err.message)
    }
  }

  const build = async () => {
    setError(null)
    setNotice(null)
    setPicks(null)
    const chapter = scene.trim() || undefined
    const bookBody = {
      title: title.trim(),
      author: author.trim() || undefined,
      chapter,
    }
    try {
      setPhase("picking")
      const picked = await postJson(
        `${apiUrl("reading-soundtrack")}?step=picks`,
        key,
        bookBody,
      )
      setPicks(picked.picks)
      setPhase("building")
      const result = await postJson(
        `${apiUrl("reading-soundtrack")}?step=build`,
        key,
        { ...bookBody, ...picked },
      )
      setStatus({ result, spotifyConnected: true })
      setPicks(null)
    } catch (err) {
      if (handleAuthError(err)) return
      if (err.message === "spotify_not_connected") {
        setStatus(s => ({ ...s, spotifyConnected: false }))
        setError("Connect Spotify first.")
      } else {
        setError(err.message)
      }
    } finally {
      setPhase("idle")
    }
  }

  const unlock = e => {
    e.preventDefault()
    const value = keyInput.trim()
    if (!value) return
    try {
      window.localStorage.setItem(KEY_STORAGE, value)
    } catch {
      // ignore storage failures
    }
    setKey(value)
    setKeyInput("")
    setError(null)
  }

  if (!key) {
    if (!showUnlock) return null
    return (
      <form onSubmit={unlock} className="mt-3 flex gap-2">
        <input
          type="password"
          value={keyInput}
          onChange={e => setKeyInput(e.target.value)}
          placeholder="Tracker key"
          className="min-w-0 flex-grow rounded border border-gray-300 bg-transparent px-2 py-1 text-sm dark:border-gray-600"
        />
        <button
          type="submit"
          className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
        >
          Unlock
        </button>
        {error && <div className="text-sm text-red-600">{error}</div>}
      </form>
    )
  }

  const result = status?.result
  const busy = phase !== "idle"
  const missing = result?.albums?.filter(a => !a.found) ?? []

  return (
    <div className="mt-3 rounded border border-gray-300 p-3 dark:border-gray-600">
      <div className="mb-2 text-sm font-semibold">🎧 Reading soundtrack</div>

      {result && (
        <div className="mb-3">
          <a
            href={result.playlistUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
          >
            Open in Spotify
          </a>
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            {result.name}: {result.trackCount} tracks,{" "}
            {formatDuration(result.durationMin)}
          </div>
          {result.summary && (
            <div className="mt-1 text-xs text-gray-600 italic dark:text-gray-400">
              {result.summary}
            </div>
          )}
          {missing.length > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              Not on Spotify: {missing.map(a => a.album).join(", ")}
            </div>
          )}
        </div>
      )}

      {status && status.spotifyConnected === false ? (
        <button
          onClick={connectSpotify}
          className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
        >
          Connect Spotify
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={() => loadStatus(title)}
            disabled={busy}
            placeholder="Book title"
            className="rounded border border-gray-300 bg-transparent px-2 py-1 text-sm dark:border-gray-600"
          />
          <input
            type="text"
            value={author}
            onChange={e => setAuthor(e.target.value)}
            disabled={busy}
            placeholder="Author (optional)"
            className="rounded border border-gray-300 bg-transparent px-2 py-1 text-sm dark:border-gray-600"
          />
          <input
            type="text"
            value={scene}
            onChange={e => setScene(e.target.value)}
            disabled={busy}
            placeholder="Scene or chapter (optional)"
            className="rounded border border-gray-300 bg-transparent px-2 py-1 text-sm dark:border-gray-600"
          />
          <button
            onClick={build}
            disabled={busy || !title.trim()}
            className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600 disabled:opacity-60"
          >
            {phase === "picking"
              ? "Picking albums…"
              : phase === "building"
                ? "Building playlist…"
                : result
                  ? "Rebuild"
                  : "Build soundtrack"}
          </button>
        </div>
      )}

      {picks && (
        <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          {picks.map(p => (
            <li key={`${p.artist}-${p.album}`}>
              {p.artist} — {p.album}
            </li>
          ))}
        </ul>
      )}
      {notice && <div className="mt-2 text-xs text-green-600">{notice}</div>}
      {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
    </div>
  )
}

ReadingSoundtrack.propTypes = {
  book: PropTypes.shape({
    title: PropTypes.string.isRequired,
    author: PropTypes.string,
  }),
}

export default ReadingSoundtrack
