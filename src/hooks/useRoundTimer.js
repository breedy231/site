import { useCallback, useEffect, useRef, useState } from "react"

// Drift-free countdown: the end time lives in a ref and one 250ms interval
// derives whole seconds from the clock, so a round is exactly as long as it
// claims. secondsLeft only updates when the displayed integer changes, and
// it is never an effect dependency anywhere.
export function useRoundTimer({ onTick, onExpire } = {}) {
  const [secondsLeft, setSecondsLeft] = useState(0)

  const onTickRef = useRef(onTick)
  onTickRef.current = onTick
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  const endAtRef = useRef(0)
  const pausedRemainingRef = useRef(null)
  const intervalRef = useRef(null)
  const lastWholeRef = useRef(null)

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const tick = useCallback(() => {
    const remainingMs = endAtRef.current - Date.now()
    const seconds = Math.max(0, Math.ceil(remainingMs / 1000))
    if (seconds !== lastWholeRef.current) {
      lastWholeRef.current = seconds
      setSecondsLeft(seconds)
      if (seconds > 0) onTickRef.current?.(seconds)
    }
    if (remainingMs <= 0) {
      clear()
      onExpireRef.current?.()
    }
  }, [clear])

  const start = useCallback(
    seconds => {
      clear()
      pausedRemainingRef.current = null
      endAtRef.current = Date.now() + seconds * 1000
      lastWholeRef.current = seconds
      setSecondsLeft(seconds)
      intervalRef.current = setInterval(tick, 250)
    },
    [clear, tick],
  )

  const pause = useCallback(() => {
    if (!intervalRef.current) return
    clear()
    pausedRemainingRef.current = Math.max(0, endAtRef.current - Date.now())
  }, [clear])

  const resume = useCallback(() => {
    if (pausedRemainingRef.current == null) return
    endAtRef.current = Date.now() + pausedRemainingRef.current
    pausedRemainingRef.current = null
    intervalRef.current = setInterval(tick, 250)
  }, [tick])

  const stop = useCallback(() => {
    clear()
    pausedRemainingRef.current = null
  }, [clear])

  useEffect(() => stop, [stop])

  return { secondsLeft, start, pause, resume, stop }
}
