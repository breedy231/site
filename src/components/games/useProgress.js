import { useCallback, useEffect, useRef, useState } from "react"

const KEY_STORAGE = "tracker-key"
const SAVE_DEBOUNCE_MS = 300

const getApiUrl = () =>
  import.meta.env.DEV
    ? "/api/game-progress"
    : "/.netlify/functions/game-progress"

export const EMPTY_STATE = {
  stats: {},
  done: {},
  notes: {},
  pin: null,
  custom: {},
  closed: {},
}

const normalize = raw => ({
  stats: raw?.stats ?? {},
  done: raw?.done ?? {},
  notes: raw?.notes ?? {},
  pin: raw?.pin ?? null,
  custom: raw?.custom ?? {},
  closed: raw?.closed ?? {},
})

const readStoredKey = () => {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage.getItem(KEY_STORAGE)
  } catch {
    return null
  }
}

export default function useProgress(slug) {
  const [state, setState] = useState(EMPTY_STATE)
  const [status, setStatus] = useState("loading")
  const [error, setError] = useState(null)
  const [key, setKeyState] = useState(null)

  const keyRef = useRef(null)
  const stateRef = useRef(EMPTY_STATE)
  const timerRef = useRef(null)
  const dirtyRef = useRef(false)
  const loadedRef = useRef(false)

  stateRef.current = state
  keyRef.current = key

  useEffect(() => {
    setKeyState(readStoredKey())
  }, [])

  const url = `${getApiUrl()}?game=${encodeURIComponent(slug)}`

  const clearKey = useCallback(() => {
    try {
      window.localStorage.removeItem(KEY_STORAGE)
    } catch {
      // ignore storage failures
    }
    setKeyState(null)
  }, [])

  const save = useCallback(
    (payload, keepalive = false) => {
      const writeKey = keyRef.current
      if (!writeKey) return Promise.resolve()
      dirtyRef.current = false
      setStatus("saving")
      return fetch(url, {
        method: "PUT",
        keepalive,
        headers: {
          "Content-Type": "application/json",
          "X-Tracker-Key": writeKey,
        },
        body: JSON.stringify(payload),
      })
        .then(res => {
          if (res.status === 401) {
            clearKey()
            setError("Write key rejected. Unlock again.")
            setStatus("error")
            return
          }
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          setStatus("saved")
          setError(null)
        })
        .catch(err => {
          setError(`Save failed: ${err.message}`)
          setStatus("error")
        })
    },
    [url, clearKey],
  )

  // Initial load.
  useEffect(() => {
    let cancelled = false
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        if (cancelled) return
        setState(normalize(data))
        loadedRef.current = true
        setStatus("idle")
      })
      .catch(err => {
        if (cancelled) return
        setError(`Could not load progress: ${err.message}`)
        setStatus("error")
      })
    return () => {
      cancelled = true
    }
  }, [url])

  const update = useCallback(
    fn => {
      if (!keyRef.current || !loadedRef.current) return
      setState(prev => {
        const next = fn(prev)
        stateRef.current = next
        dirtyRef.current = true
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          timerRef.current = null
          save(stateRef.current)
        }, SAVE_DEBOUNCE_MS)
        return next
      })
    },
    [save],
  )

  // Flush a pending save when the page is hidden (phone lock, tab switch).
  useEffect(() => {
    const flush = () => {
      if (!dirtyRef.current || !keyRef.current) return
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      save(stateRef.current, true)
    }
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush()
    }
    window.addEventListener("pagehide", flush)
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      window.removeEventListener("pagehide", flush)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [save])

  const setKey = useCallback(
    value => {
      const trimmed = (value || "").trim()
      if (!trimmed) return
      try {
        window.localStorage.setItem(KEY_STORAGE, trimmed)
      } catch {
        // ignore storage failures
      }
      keyRef.current = trimmed
      setKeyState(trimmed)
      setError(null)
      // Verify the key immediately by writing the current state back,
      // but never before the initial load has landed (would wipe the blob).
      if (loadedRef.current) save(stateRef.current)
    },
    [save],
  )

  return {
    state,
    update,
    status,
    canWrite: Boolean(key),
    setKey,
    clearKey,
    error,
    dismissError: () => setError(null),
  }
}
