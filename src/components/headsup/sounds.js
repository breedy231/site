// WebAudio sound player for the Heads Up game. Buffers are fetched and
// decoded once per page load; unlock() must be called from a user gesture
// (the Start button) so iOS allows playback. All files are wav/mp3 —
// Safari cannot decode ogg or flac.
const FILES = {
  start: "/sounds/243020__plasterbrain__game-start.mp3",
  correct: "/sounds/131660__bertrof__game-sound-correct.wav",
  wrong: "/sounds/131657__bertrof__game-sound-wrong.wav",
  tick: "/sounds/689900__yeonggille__ticking-of-the-clock-without-reverb.mp3",
  gameOver: "/sounds/382310__mountain_man__game-over-arcade.wav",
}

let ctx = null
let loadPromise = null
const buffers = {}

let muted = false
try {
  muted = localStorage.getItem("headsupMuted") === "true"
} catch {
  // localStorage unavailable — default to unmuted
}

function getCtx() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null
    ctx = new AudioCtx()
    // iOS suspends the context when the tab is backgrounded (or a call comes
    // in) and doesn't always resume it; recover whenever we're visible again.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && ctx.state !== "running") {
        ctx.resume().catch(() => {})
      }
    })
  }
  return ctx
}

function resumeIfNeeded(c) {
  if (c.state !== "running") c.resume().catch(() => {})
}

export const sounds = {
  // Call from a user gesture: resumes the context and plays a silent buffer,
  // which satisfies iOS's gesture requirement for all later playback.
  unlock() {
    // Opt into a "playback" audio session so iOS plays Web Audio even with
    // the ringer/silent switch on — without this the whole game is silent
    // for anyone whose phone is on silent. Safari 16.4+ only; guarded.
    try {
      navigator.audioSession.type = "playback"
    } catch {
      // API absent — older iOS / other browsers
    }
    const c = getCtx()
    if (!c) return
    resumeIfNeeded(c)
    const silent = c.createBuffer(1, 1, 22050)
    const source = c.createBufferSource()
    source.buffer = silent
    source.connect(c.destination)
    source.start(0)
  },

  load() {
    const c = getCtx()
    if (!c) return Promise.resolve()
    if (!loadPromise) {
      loadPromise = Promise.all(
        Object.entries(FILES).map(async ([name, path]) => {
          try {
            const response = await fetch(path)
            const data = await response.arrayBuffer()
            buffers[name] = await c.decodeAudioData(data)
          } catch {
            // missing/undecodable file — that sound stays silent
          }
        }),
      )
    }
    return loadPromise
  },

  play(name) {
    const c = getCtx()
    if (muted || !c || !buffers[name]) return
    resumeIfNeeded(c)
    const source = c.createBufferSource()
    source.buffer = buffers[name]
    source.connect(c.destination)
    source.start(0)
  },

  getAudioDebug() {
    let audioSessionType = "n/a"
    try {
      audioSessionType = navigator.audioSession?.type ?? "unsupported"
    } catch {
      audioSessionType = "unsupported"
    }
    return {
      ctxState: ctx ? ctx.state : "not created",
      buffersLoaded: Object.keys(buffers).length,
      muted,
      audioSessionType,
    }
  },

  isMuted() {
    return muted
  },

  toggleMute() {
    muted = !muted
    try {
      localStorage.setItem("headsupMuted", String(muted))
    } catch {
      // ignore
    }
    return muted
  },
}
