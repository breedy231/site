import { useCallback, useEffect } from "react"

// Fullscreen + best-effort landscape lock for play. iPhone Safari has no
// element fullscreen API — there this is a no-op and the game relies on the
// minimal GameLayout + 100dvh instead. Orientation lock only works inside
// fullscreen (Android Chrome) and throws elsewhere, hence the swallowed
// rejection.
export function useFullscreen() {
  const enter = useCallback(async element => {
    const el = element || document.documentElement
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen({ navigationUI: "hide" })
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen()
      }
    } catch {
      return
    }
    try {
      await screen.orientation?.lock?.("landscape")
    } catch {
      // unsupported outside fullscreen / on iOS — landscape gate handles it
    }
  }, [])

  const exit = useCallback(() => {
    try {
      screen.orientation?.unlock?.()
    } catch {
      // ignore
    }
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
  }, [])

  useEffect(() => exit, [exit])

  return { enter, exit }
}
