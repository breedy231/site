import { useEffect, useRef, useState } from "react"
import { useTiltControls, TILT_TUNING } from "../hooks/useTiltControls"

// Thin diagnostic harness over the exact tilt hook the Heads Up game uses,
// so the harness and the game can never drift apart. Visit /motion-test on a
// phone (HTTPS required for sensors) to tune and verify tilt detection.
const MotionTest = () => {
  const [log, setLog] = useState([])
  const [armed, setArmed] = useState(false)
  const [snapshot, setSnapshot] = useState(null)
  const [hz, setHz] = useState(0)
  const lastCountRef = useRef({ count: 0, at: 0 })

  const {
    supported,
    permission,
    requestPermission,
    calibrate,
    setEnabled,
    getDebugState,
  } = useTiltControls({
    onAction: action => {
      setLog(prev =>
        [
          {
            action,
            at: new Date().toLocaleTimeString(),
            key: Date.now() + Math.random(),
          },
          ...prev,
        ].slice(0, 20),
      )
      if (navigator.vibrate) navigator.vibrate(action === "correct" ? 60 : 30)
    },
  })

  useEffect(() => {
    setEnabled(armed)
  }, [armed, setEnabled])

  // Poll debug refs at 5Hz — the hook never sets React state from the sensor
  // path, so this interval is the only render driver.
  useEffect(() => {
    if (permission !== "granted") return
    const interval = setInterval(() => {
      const state = getDebugState()
      setSnapshot(state)
      const now = Date.now()
      const last = lastCountRef.current
      if (last.at > 0) {
        const elapsed = (now - last.at) / 1000
        setHz(Math.round((state.sampleCount - last.count) / elapsed))
      }
      lastCountRef.current = { count: state.sampleCount, at: now }
    }, 200)
    return () => clearInterval(interval)
  }, [permission, getDebugState])

  const pitch = snapshot?.pitch ?? 0
  const zoneColor =
    snapshot?.zone === "action"
      ? "bg-red-500"
      : snapshot?.zone === "pending"
        ? "bg-yellow-500"
        : "bg-green-500"

  return (
    <div className="mx-auto min-h-screen max-w-md space-y-4 p-4 text-gray-900 dark:text-white">
      <h1 className="text-2xl font-bold">Motion Test</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Diagnostic harness for the Heads Up tilt hook. Hold the phone vertical
        in landscape (forehead position), screen facing away from you.
      </p>

      <div className="rounded-lg bg-white p-4 text-sm shadow dark:bg-gray-700">
        <div>Sensor support: {supported ? "yes" : "no"}</div>
        <div>Permission: {permission}</div>
        <div>Sample rate: {hz} Hz</div>
        <div>Vertical sign: {snapshot?.vertSign ?? "-"}</div>
      </div>

      {permission !== "granted" && (
        <button
          onClick={requestPermission}
          className="w-full rounded-lg bg-blue-500 p-4 text-xl text-white shadow hover:bg-blue-600"
        >
          Enable Motion (tap required on iOS)
        </button>
      )}

      {permission === "granted" && (
        <>
          <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-700">
            <div className="mb-1 flex justify-between text-sm">
              <span>Pitch</span>
              <span className="font-mono">{pitch.toFixed(1)}°</span>
            </div>
            <div className="relative h-6 overflow-hidden rounded bg-gray-200 dark:bg-gray-600">
              {/* trigger zone markers at ±45° on a ±90° bar */}
              <div className="absolute inset-y-0 left-1/4 w-px bg-red-400" />
              <div className="absolute inset-y-0 left-3/4 w-px bg-red-400" />
              <div className="absolute inset-y-0 left-1/2 w-px bg-gray-400" />
              <div
                className={`absolute top-0 h-full w-2 rounded ${zoneColor}`}
                style={{
                  left: `${Math.min(98, Math.max(0, 50 + (pitch / 90) * 50))}%`,
                }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>-90° (pass / tilt up)</span>
              <span>+90° (correct / tilt down)</span>
            </div>
            <div className="mt-2 text-sm">
              Zone: <span className="font-mono">{snapshot?.zone}</span> · Arm
              state: <span className="font-mono">{snapshot?.armState}</span>
            </div>
            <div className="mt-1 font-mono text-xs text-gray-500 dark:text-gray-400">
              g = ({snapshot?.gravity.x.toFixed(1)},{" "}
              {snapshot?.gravity.y.toFixed(1)}, {snapshot?.gravity.z.toFixed(1)}
              )
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setArmed(prev => !prev)}
              className={`flex-1 rounded-lg p-3 text-white shadow ${
                armed
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {armed ? "Disarm actions" : "Arm actions"}
            </button>
            <button
              onClick={() => {
                const ok = calibrate()
                setLog(prev =>
                  [
                    {
                      action: ok ? "calibrated" : "calibrate rejected",
                      at: new Date().toLocaleTimeString(),
                      key: Date.now() + Math.random(),
                    },
                    ...prev,
                  ].slice(0, 20),
                )
              }}
              className="flex-1 rounded-lg bg-blue-500 p-3 text-white shadow hover:bg-blue-600"
            >
              Calibrate
            </button>
          </div>

          <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-700">
            <h2 className="mb-2 font-bold">Action log</h2>
            {log.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Arm actions, then tilt past ±{TILT_TUNING.TRIGGER_DEG}°.
              </p>
            )}
            <ul className="space-y-1 font-mono text-sm">
              {log.map(entry => (
                <li key={entry.key}>
                  {entry.at} — {entry.action}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-700">
        <h2 className="mb-2 font-bold">Tuning constants</h2>
        <ul className="font-mono text-xs">
          {Object.entries(TILT_TUNING).map(([key, value]) => (
            <li key={key}>
              {key} = {value}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default MotionTest
