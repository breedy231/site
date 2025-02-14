class SoundManager {
  constructor() {
    this.sounds = {}
    this.muted = false

    // Try to load mute preference from localStorage
    try {
      this.muted = localStorage.getItem("headsupMuted") === "true"
    } catch (e) {
      console.warn("Could not access localStorage for mute preference")
    }
  }

  async loadSounds() {
    const soundFiles = {
      start: "/243020__plasterbrain__game-start.ogg",
      correct: "/131660__bertrof__game-sound-correct.wav",
      wrong: "/131657__bertrof__game-sound-wrong.wav",
      timerWarning:
        "/689900__yeonggille__ticking-of-the-clock-without-reverb.flac",
      gameOver: "/382310__mountain_man__game-over-arcade.wav",
    }

    // Preload all sounds
    for (const [name, path] of Object.entries(soundFiles)) {
      try {
        const audio = new Audio(path)
        // Ensure audio is loaded
        await audio.load()
        this.sounds[name] = audio
      } catch (error) {
        console.warn(`Failed to load sound: ${name}`, error)
      }
    }
  }

  play(soundName) {
    if (this.muted || !this.sounds[soundName]) return

    try {
      // Stop the sound if it's already playing
      this.sounds[soundName].currentTime = 0
      // Play the sound
      this.sounds[soundName].play().catch(error => {
        console.warn(`Failed to play sound: ${soundName}`, error)
      })
    } catch (error) {
      console.warn(`Error playing sound: ${soundName}`, error)
    }
  }

  toggleMute() {
    this.muted = !this.muted
    // Save preference to localStorage
    try {
      localStorage.setItem("headsupMuted", this.muted.toString())
    } catch (e) {
      console.warn("Could not save mute preference to localStorage")
    }
    return this.muted
  }

  isMuted() {
    return this.muted
  }
}

// Create a singleton instance
const soundManager = new SoundManager()
export default soundManager
