import React, { useState, useEffect, useRef } from "react"
import Layout from "../components/layout"
import { Helmet } from "react-helmet"

// Motion detection constants (matching headsup.js)
const MOTION_ZONES = {
  NEUTRAL: { min: -15, max: 15 },
  WARNING: { min: -25, max: 25 },
  ACTION: { threshold: 25 },
}

const MOTION_SETTINGS = {
  COOLDOWN: 500,
  INTENSITY_THRESHOLD: 15,
  SMOOTHING_FACTOR: 0.3,
}

const MotionTest = () => {
  // State
  const [deviceType, setDeviceType] = useState("unknown")
  const [permissionStatus, setPermissionStatus] = useState("unknown")
  const [orientationLocked, setOrientationLocked] = useState(false)
  const [currentTilt, setCurrentTilt] = useState(0)
  const [motionIntensity, setMotionIntensity] = useState(0)
  const [currentZone, setCurrentZone] = useState("neutral")
  const [lastMotion, setLastMotion] = useState("None")
  const [eventLogs, setEventLogs] = useState([])
  const [foreheadMode, setForeheadMode] = useState(true) // Default to forehead mode since that's how the game is played
  const [neutralBeta, setNeutralBeta] = useState(90) // Default neutral position
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [calibrationStep, setCalibrationStep] = useState(0) // 0: not started, 1-3: countdown, 4: collecting, 5: done
  const [calibrationProgress, setCalibrationProgress] = useState(0)
  const calibrationReadings = useRef([])
  const calibrationTimer = useRef(null)

  // Refs for motion tracking
  const prevTiltAngles = useRef([0, 0, 0])
  const smoothedIntensity = useRef(0)
  const lastActionTime = useRef(0)

  const addLog = message => {
    const timestamp = new Date().toLocaleTimeString()
    setEventLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 100))
  }

  const calculateMovingAverage = newValue => {
    prevTiltAngles.current = [...prevTiltAngles.current.slice(1), newValue]
    return (
      prevTiltAngles.current.reduce((a, b) => a + b, 0) /
      prevTiltAngles.current.length
    )
  }

  const updateMotionIntensity = newIntensity => {
    smoothedIntensity.current =
      MOTION_SETTINGS.SMOOTHING_FACTOR * newIntensity +
      (1 - MOTION_SETTINGS.SMOOTHING_FACTOR) * smoothedIntensity.current
    return smoothedIntensity.current
  }

  const getMotionZone = angle => {
    const absAngle = Math.abs(angle)
    if (absAngle <= MOTION_ZONES.NEUTRAL.max) return "neutral"
    if (absAngle <= MOTION_ZONES.WARNING.max) return "warning"
    return "action"
  }

  const requestOrientationPermission = async () => {
    try {
      const isIOS =
        typeof window !== "undefined" &&
        /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !window.MSStream
      setDeviceType(isIOS ? "iOS" : "non-iOS")
      addLog(`Device type: ${isIOS ? "iOS" : "non-iOS"}`)

      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        addLog("Requesting permission...")
        const permission = await DeviceOrientationEvent.requestPermission()
        setPermissionStatus(permission)
        addLog(`Permission response: ${permission}`)

        if (permission === "granted") {
          window.addEventListener("deviceorientation", handleOrientation, true)
          addLog("Motion listener activated")
        }
      } else {
        setPermissionStatus("granted (no permission needed)")
        window.addEventListener("deviceorientation", handleOrientation, true)
        addLog("Motion listener activated (no permission needed)")
      }
    } catch (error) {
      addLog(`Permission error: ${error.message}`)
      setPermissionStatus("error")
    }
  }

  const toggleOrientation = async () => {
    try {
      if (screen.orientation && screen.orientation.lock) {
        if (!orientationLocked) {
          await screen.orientation.lock("landscape")
          setOrientationLocked(true)
          addLog("Screen locked to landscape")
        } else {
          await screen.orientation.unlock()
          setOrientationLocked(false)
          addLog("Screen orientation unlocked")
        }
      } else {
        addLog("Screen orientation locking not supported")
      }
    } catch (error) {
      addLog(`Orientation error: ${error.message}`)
    }
  }

  const handleOrientation = event => {
    try {
      const now = Date.now()
      const beta = event.beta || 0
      const gamma = event.gamma || 0

      // Always process calibration events
      if (isCalibrating) {
        // Log position during countdown
        if (calibrationStep < 4) {
          if (now % 500 < 100) {
            // Log every 500ms during countdown
            addLog(
              `Current position - Beta: ${beta.toFixed(
                1
              )}°, Gamma: ${gamma.toFixed(1)}°`
            )
          }
          return
        }

        // Collect calibration readings
        if (calibrationStep === 4) {
          if (
            !calibrationTimer.current ||
            now - calibrationTimer.current >= 100
          ) {
            calibrationTimer.current = now
            calibrationReadings.current.push(beta)
            setCalibrationProgress(calibrationReadings.current.length)

            if (calibrationReadings.current.length >= 10) {
              const avgBeta =
                calibrationReadings.current.reduce((a, b) => a + b, 0) /
                calibrationReadings.current.length
              setNeutralBeta(avgBeta)
              setIsCalibrating(false)
              setCalibrationStep(5)
              calibrationReadings.current = []
              addLog(
                `Calibration complete. Neutral position set to ${avgBeta.toFixed(
                  1
                )}°`
              )
            }
          }
          return
        }
      }

      // Position validation based on mode
      if (foreheadMode) {
        // In forehead mode, gamma should be close to ±90°
        if (Math.abs(Math.abs(gamma) - 90) > 20) {
          // Allow ±20° from vertical
          if (now % 1000 < 100) {
            // Limit warning frequency
            addLog(
              `Phone position warning: gamma=${gamma.toFixed(
                1
              )}° | Hold phone more vertical against forehead`
            )
          }
          return
        }
      } else {
        // In flat mode, gamma should be close to 0°
        if (Math.abs(gamma) > 20) {
          // Allow ±20° from horizontal
          if (now % 1000 < 100) {
            addLog(
              `Phone position warning: gamma=${gamma.toFixed(
                1
              )}° | Hold phone more level`
            )
          }
          return
        }
      }

      // Apply cooldown only for motion detection
      if (now - lastActionTime.current < MOTION_SETTINGS.COOLDOWN) return

      // Calculate tilt angle relative to neutral position
      let rawTiltAngle
      if (foreheadMode) {
        // In forehead mode, measure relative to calibrated neutral position
        rawTiltAngle = beta - neutralBeta
      } else {
        // In flat mode, use original normalization
        rawTiltAngle = (beta < 0 ? beta + 180 : beta) - 90
      }

      const tiltAngle = calculateMovingAverage(rawTiltAngle)

      // Calculate motion intensity
      const intensity = updateMotionIntensity(
        Math.abs(tiltAngle - prevTiltAngles.current[1])
      )

      // Update state
      setCurrentTilt(tiltAngle)
      setMotionIntensity(intensity)
      const zone = getMotionZone(tiltAngle)
      setCurrentZone(zone)

      // Check for valid motion
      if (
        zone === "action" &&
        intensity > MOTION_SETTINGS.INTENSITY_THRESHOLD
      ) {
        lastActionTime.current = now

        if (tiltAngle < -MOTION_ZONES.ACTION.threshold) {
          setLastMotion("DOWN")
          addLog(`Motion detected: DOWN (${tiltAngle.toFixed(1)}°)`)
        } else if (tiltAngle > MOTION_ZONES.ACTION.threshold) {
          setLastMotion("UP")
          addLog(`Motion detected: UP (${tiltAngle.toFixed(1)}°)`)
        }
      }

      // Log detailed motion data periodically
      if (now % 1000 < 100) {
        // Log roughly every second
        addLog(
          `Tilt: ${tiltAngle.toFixed(1)}° | Intensity: ${intensity.toFixed(
            1
          )} | Zone: ${zone}`
        )
      }
    } catch (error) {
      addLog(`Orientation error: ${error.message}`)
    }
  }

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("deviceorientation", handleOrientation, true)
      }
    }
  }, [])

  return (
    <Layout>
      <Helmet>
        <title>Motion Controls Test</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </Helmet>

      <div className="min-h-screen bg-gray-100 p-4">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-8 text-center text-4xl font-bold">
            Motion Controls Test
          </h1>

          <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-2xl font-bold">Debug Panel</h2>

            <div className="mb-4 space-y-2">
              <div>
                <strong>Device Type:</strong> {deviceType}
              </div>
              <div>
                <strong>Permission Status:</strong> {permissionStatus}
              </div>
              <div>
                <strong>Orientation Lock:</strong>{" "}
                {orientationLocked ? "Locked" : "Unlocked"}
              </div>
              <div>
                <strong>Mode:</strong>{" "}
                {foreheadMode ? "Forehead Position" : "Flat Position"}
              </div>
              <div>
                <strong>Neutral Position:</strong> {neutralBeta.toFixed(1)}°
              </div>
              {calibrationStep > 0 && calibrationStep < 5 && (
                <div className="p-4 text-center text-xl font-bold text-yellow-600">
                  {calibrationStep < 4
                    ? `Get Ready... ${4 - calibrationStep}`
                    : `Calibrating... ${calibrationProgress}/10`}
                </div>
              )}
              {calibrationStep === 5 && (
                <div className="p-4 text-center text-xl font-bold text-green-600">
                  Calibration Complete!
                </div>
              )}
            </div>

            <div className="mb-4">
              <button
                onClick={() => {
                  setCalibrationStep(1)
                  setIsCalibrating(true)
                  calibrationReadings.current = []
                  addLog("Starting calibration countdown...")

                  // Start countdown
                  const startCountdown = () => {
                    let count = 1
                    const countInterval = setInterval(() => {
                      count++
                      setCalibrationStep(count)
                      if (count === 4) {
                        clearInterval(countInterval)
                        setCalibrationProgress(0)
                        calibrationTimer.current = null
                      }
                    }, 1000)
                  }
                  startCountdown()
                }}
                className="mb-2 w-full rounded-lg bg-yellow-500 px-4 py-2 font-medium text-white hover:bg-yellow-600"
                disabled={calibrationStep > 0 && calibrationStep < 5}
              >
                Calibrate Neutral Position
              </button>
              <button
                onClick={() => {
                  setForeheadMode(!foreheadMode)
                  addLog(
                    `Switched to ${
                      !foreheadMode ? "Forehead" : "Flat"
                    } Position mode`
                  )
                }}
                className="w-full rounded-lg bg-purple-500 px-4 py-2 font-medium text-white hover:bg-purple-600"
              >
                Toggle Position Mode
              </button>
              <div className="mt-2 text-sm text-gray-600">
                {foreheadMode
                  ? "Forehead Position: Phone held up to forehead in landscape"
                  : "Flat Position: Phone held flat in landscape"}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="mb-2 text-lg font-semibold">Tilt Meter</h3>
              <div className="relative h-5 w-full rounded-full bg-gray-200">
                <div
                  className="absolute h-full w-1 transform rounded-full transition-all duration-100"
                  style={{
                    left: `${Math.min(
                      Math.max((currentTilt + 45) * (100 / 90), 0),
                      100
                    )}%`,
                    backgroundColor:
                      currentZone === "action"
                        ? "#EF4444"
                        : currentZone === "warning"
                        ? "#F59E0B"
                        : "#3B82F6",
                  }}
                />
              </div>
              <div className="mt-1 flex justify-between text-sm text-gray-500">
                <span>-45°</span>
                <span>0°</span>
                <span>45°</span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="mb-2 text-lg font-semibold">Motion Intensity</h3>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="absolute h-full rounded-full bg-green-500 transition-all duration-100"
                  style={{ width: `${Math.min(motionIntensity * 2, 100)}%` }}
                />
              </div>
              <div className="mt-1 text-center text-sm text-gray-500">
                {motionIntensity.toFixed(1)}
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="font-semibold">Zone</div>
                <div
                  className={`mt-1 rounded-md px-3 py-1 font-medium ${
                    currentZone === "action"
                      ? "bg-red-100 text-red-700"
                      : currentZone === "warning"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-blue-100 text-blue-700"
                  } `}
                >
                  {currentZone.toUpperCase()}
                </div>
              </div>
              <div className="text-center">
                <div className="font-semibold">Last Motion</div>
                <div className="mt-1 rounded-md bg-gray-100 px-3 py-1 font-medium text-gray-700">
                  {lastMotion}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 space-y-2">
            <button
              onClick={requestOrientationPermission}
              className="w-full rounded-lg bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600"
            >
              Request Motion Permission
            </button>
            <button
              onClick={toggleOrientation}
              className="w-full rounded-lg bg-green-500 px-4 py-2 font-medium text-white hover:bg-green-600"
            >
              Toggle Orientation Lock
            </button>
            <button
              onClick={() => setEventLogs([])}
              className="w-full rounded-lg bg-gray-500 px-4 py-2 font-medium text-white hover:bg-gray-600"
            >
              Clear Log
            </button>
          </div>

          <div className="rounded-lg bg-gray-800 p-4">
            <h3 className="mb-2 text-lg font-semibold text-white">Event Log</h3>
            <div className="h-48 overflow-y-auto font-mono text-sm text-gray-300">
              {eventLogs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default MotionTest
