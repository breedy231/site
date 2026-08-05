import { useCallback, useEffect, useRef, useState } from "react"

// Tuning constants — displayed by the /motion-test harness. Angles in degrees,
// accelerations in m/s².
export const TILT_TUNING = {
  // Exponential low-pass factor per devicemotion sample (~100ms at 60Hz)
  ALPHA: 0.2,
  // |pitch| beyond this fires an action
  TRIGGER_DEG: 45,
  // pitch must return inside this band to re-arm
  RESET_DEG: 20,
  // ...and stay there this long
  REARM_MS: 100,
  // hard floor between fires, shared with tap/keyboard input
  MIN_ACTION_GAP_MS: 250,
  // calibration requires this much gravity on the vertical (device x) axis,
  // i.e. the phone is actually held upright in landscape
  MIN_VERTICAL_G: 4,
  // skip samples where |g| deviates from 9.81 by more than this (violent shake)
  SPIKE_G: 8,
}

const isIOS = () =>
  typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1))

// Tilt detection for landscape forehead play, built on devicemotion's
// accelerationIncludingGravity. Pitch is derived from the gravity vector
// (atan2 of the screen-normal component vs the vertical-axis component),
// which is stable at the vertical play position — unlike deviceorientation
// Euler angles, which hit gimbal lock exactly there.
//
// One stable listener; every fast-changing value lives in a ref. No React
// state is ever set from the sensor path — consumers poll getDebugState().
export function useTiltControls({ onAction } = {}) {
  const supported =
    typeof window !== "undefined" && "DeviceMotionEvent" in window

  const [permission, setPermission] = useState(
    supported ? "unknown" : "unavailable",
  )

  const onActionRef = useRef(onAction)
  onActionRef.current = onAction

  const enabledRef = useRef(false)
  // smoothed gravity, spec sign convention (skyward axis reads +9.8)
  const gRef = useRef({ x: 0, y: 0, z: 9.81 })
  const vertSignRef = useRef(1)
  const armRef = useRef("armed") // "armed" | "triggered"
  const neutralSinceRef = useRef(null)
  const lastActionAtRef = useRef(0)
  const debugRef = useRef({
    pitch: 0,
    zone: "neutral",
    armState: "armed",
    gravity: { x: 0, y: 0, z: 0 },
    sampleCount: 0,
    lastSampleAt: 0,
    lastAction: null,
    vertSign: 1,
  })

  const handleMotion = useCallback(event => {
    const a = event.accelerationIncludingGravity
    if (!a || a.x == null) return

    // iOS reports gravity with the sign flipped relative to the spec;
    // normalize so the skyward device axis always reads positive.
    const k = isIOS() ? -1 : 1
    const gx = k * a.x
    const gy = k * a.y
    const gz = k * a.z

    const debug = debugRef.current
    debug.sampleCount += 1
    debug.lastSampleAt = Date.now()

    const mag = Math.sqrt(gx * gx + gy * gy + gz * gz)
    if (Math.abs(mag - 9.81) > TILT_TUNING.SPIKE_G) return

    const g = gRef.current
    g.x += TILT_TUNING.ALPHA * (gx - g.x)
    g.y += TILT_TUNING.ALPHA * (gy - g.y)
    g.z += TILT_TUNING.ALPHA * (gz - g.z)

    // Landscape play: device x is the vertical axis; vertSign captures which
    // of the two landscape rotations the phone is in.
    const pitch = (Math.atan2(-g.z, vertSignRef.current * g.x) * 180) / Math.PI

    const abs = Math.abs(pitch)
    debug.pitch = pitch
    debug.gravity = { x: g.x, y: g.y, z: g.z }
    debug.zone =
      abs < TILT_TUNING.RESET_DEG
        ? "neutral"
        : abs < TILT_TUNING.TRIGGER_DEG
          ? "pending"
          : "action"
    debug.armState = armRef.current
    debug.vertSign = vertSignRef.current

    if (!enabledRef.current) {
      armRef.current = "armed"
      neutralSinceRef.current = null
      return
    }

    const now = event.timeStamp || Date.now()

    if (armRef.current === "triggered") {
      // must return to neutral and stay there before the next action
      if (abs < TILT_TUNING.RESET_DEG) {
        if (neutralSinceRef.current == null) {
          neutralSinceRef.current = now
        } else if (now - neutralSinceRef.current >= TILT_TUNING.REARM_MS) {
          armRef.current = "armed"
          neutralSinceRef.current = null
        }
      } else {
        neutralSinceRef.current = null
      }
      return
    }

    if (abs > TILT_TUNING.TRIGGER_DEG) {
      if (now - lastActionAtRef.current < TILT_TUNING.MIN_ACTION_GAP_MS) return
      lastActionAtRef.current = now
      armRef.current = "triggered"
      neutralSinceRef.current = null
      const action = pitch > 0 ? "correct" : "pass"
      debug.lastAction = { action, pitch, at: Date.now() }
      onActionRef.current?.(action)
    }
  }, [])

  // Capture which way is up. Called at countdown "GO" and after rotation.
  // Keeps the previous sign if the phone isn't actually held upright.
  const calibrate = useCallback(() => {
    const g = gRef.current
    if (Math.abs(g.x) < TILT_TUNING.MIN_VERTICAL_G) return false
    vertSignRef.current = Math.sign(g.x)
    return true
  }, [])

  const requestPermission = useCallback(async () => {
    if (!supported) return "unavailable"
    try {
      if (typeof DeviceMotionEvent.requestPermission === "function") {
        const result = await DeviceMotionEvent.requestPermission()
        const state = result === "granted" ? "granted" : "denied"
        setPermission(state)
        return state
      }
      setPermission("granted")
      return "granted"
    } catch {
      setPermission("denied")
      return "denied"
    }
  }, [supported])

  const setEnabled = useCallback(enabled => {
    enabledRef.current = enabled
    if (!enabled) {
      armRef.current = "armed"
      neutralSinceRef.current = null
    }
  }, [])

  const getDebugState = useCallback(() => ({ ...debugRef.current }), [])

  useEffect(() => {
    if (permission !== "granted") return
    window.addEventListener("devicemotion", handleMotion)

    let recalTimer
    const handleRotate = () => {
      clearTimeout(recalTimer)
      recalTimer = setTimeout(calibrate, 500)
    }
    window.addEventListener("orientationchange", handleRotate)
    screen.orientation?.addEventListener?.("change", handleRotate)

    return () => {
      window.removeEventListener("devicemotion", handleMotion)
      window.removeEventListener("orientationchange", handleRotate)
      screen.orientation?.removeEventListener?.("change", handleRotate)
      clearTimeout(recalTimer)
    }
  }, [permission, handleMotion, calibrate])

  return {
    supported,
    permission,
    requestPermission,
    calibrate,
    setEnabled,
    getDebugState,
  }
}
