import { useEffect, useState } from "react"

const getApiUrl = () =>
  import.meta.env.DEV ? "/api/steam" : "/.netlify/functions/steam"

const EMPTY = {
  achievements: {},
  playtime2w: null,
  playtimeForever: null,
  lastPlayed: null,
  warning: null,
}

const DAY_MS = 24 * 60 * 60 * 1000

export const formatUnlockDate = unixSeconds => {
  if (!unixSeconds) return null
  return new Date(unixSeconds * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// "3.2h this week · last played Sun" — omits whichever half is unknown.
export const formatPlaytimeLine = ({ playtime2w, lastPlayed }) => {
  const parts = []
  if (playtime2w) parts.push(`${(playtime2w / 60).toFixed(1)}h this week`)
  if (lastPlayed) {
    const when = new Date(lastPlayed * 1000)
    const ageMs = Date.now() - when.getTime()
    const label =
      ageMs < 7 * DAY_MS
        ? when.toLocaleDateString(undefined, { weekday: "short" })
        : when.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    parts.push(`last played ${label}`)
  }
  return parts.length > 0 ? parts.join(" · ") : null
}

// Read-only Steam overlay for a game. Fails soft: any error leaves the
// achievement map empty and the tracker behaves exactly as before.
export default function useSteam(appid) {
  const [data, setData] = useState(EMPTY)
  const [loading, setLoading] = useState(Boolean(appid))

  useEffect(() => {
    if (!appid || typeof window === "undefined") {
      setData(EMPTY)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    fetch(`${getApiUrl()}?appid=${encodeURIComponent(appid)}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(payload => {
        if (cancelled) return
        setData({
          achievements: payload?.achievements || {},
          playtime2w: payload?.playtime2w ?? null,
          playtimeForever: payload?.playtimeForever ?? null,
          lastPlayed: payload?.lastPlayed ?? null,
          warning: payload?.warning ?? null,
        })
      })
      .catch(() => {
        if (!cancelled) setData(EMPTY)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [appid])

  return { ...data, loading }
}
