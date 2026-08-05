import { useCallback, useEffect, useRef } from "react"

// Keeps the screen awake during a round. No-op where the Wake Lock API is
// unsupported. The lock is dropped by the OS whenever the tab is hidden, so
// re-acquire on visibilitychange while a round wants it held.
export function useWakeLock() {
  const lockRef = useRef(null)
  const wantedRef = useRef(false)

  const acquire = useCallback(async () => {
    wantedRef.current = true
    if (!navigator.wakeLock) return
    try {
      lockRef.current = await navigator.wakeLock.request("screen")
    } catch {
      // denied (e.g. low battery) — play continues without it
    }
  }, [])

  const release = useCallback(() => {
    wantedRef.current = false
    lockRef.current?.release().catch(() => {})
    lockRef.current = null
  }, [])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && wantedRef.current) {
        acquire()
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility)
      lockRef.current?.release().catch(() => {})
      lockRef.current = null
    }
  }, [acquire])

  return { acquire, release }
}
