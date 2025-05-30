// Audio handler that runs in ALL tabs automatically
console.log("Audio handler loaded in tab:", window.location.href)

let audioPlayer = null
let currentSound = null
let currentVolume = 0.5
let userGestureReceived = false

// Handle user gesture to unlock audio
function handleUserGesture() {
  if (!userGestureReceived) {
    console.log("User gesture received, audio unlocked")
    userGestureReceived = true
  }
}

// Add event listeners for user gestures
document.addEventListener("click", handleUserGesture, { once: false })
document.addEventListener("keydown", handleUserGesture, { once: false })
document.addEventListener("touchstart", handleUserGesture, { once: false })

// Listen for messages from background script
if (typeof chrome !== "undefined" && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Audio handler received message:", message)

    switch (message.action) {
      case "playSound":
        playSound(message.sound, message.volume)
          .then(() => sendResponse({ success: true, playing: message.sound }))
          .catch((err) => sendResponse({ success: false, error: err.message }))
        return true
      case "stopSound":
        stopSound()
        sendResponse({ success: true, playing: null })
        break
      case "setVolume":
        setVolume(message.volume)
        sendResponse({ success: true, volume: message.volume })
        break
    }

    return true
  })

  // Audio playback functions using actual MP3 files
  async function playSound(sound, volume = 0.5) {
    console.log(`Audio handler: Playing sound ${sound} at volume ${volume}`)

    stopSound()

    try {
      currentSound = sound
      currentVolume = volume

      // Map sound names to actual MP3 files
      const soundFiles = {
        rain: "sounds/rain.mp3",
        cafe: "sounds/cafe.mp3",
        study: "sounds/study.mp3",
        focus: "sounds/focus.mp3",
      }

      const soundFile = soundFiles[sound]
      if (!soundFile) {
        throw new Error(`Unknown sound: ${sound}`)
      }

      // Get the full URL for the sound file
      const soundUrl = chrome.runtime.getURL(soundFile)
      console.log(`Loading sound from: ${soundUrl}`)

      // Create audio element
      const audio = new Audio(soundUrl)
      audio.loop = true
      audio.volume = volume
      audio.preload = "auto"

      // Wait for audio to be ready
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Audio loading timeout"))
        }, 5000)

        audio.addEventListener(
          "canplaythrough",
          () => {
            clearTimeout(timeout)
            resolve()
          },
          { once: true },
        )

        audio.addEventListener(
          "error",
          (e) => {
            clearTimeout(timeout)
            reject(new Error(`Audio loading failed: ${e.message || "Unknown error"}`))
          },
          { once: true },
        )

        // Start loading
        audio.load()
      })

      // Play the audio
      await audio.play()

      // Store for stopping later
      audioPlayer = {
        pause: () => {
          try {
            audio.pause()
            audio.currentTime = 0
          } catch (err) {
            console.log("Audio handler: Audio already stopped")
          }
        },
        audio: audio,
        setVolume: (vol) => {
          audio.volume = vol
        },
      }

      console.log(`Audio handler: Sound ${sound} playing from ${soundFile}`)

      // Report to background script
      chrome.runtime
        .sendMessage({
          action: "audioStarted",
          sound: sound,
        })
        .catch(() => {
          // Background script might not be ready
        })
    } catch (err) {
      console.error(`Audio handler: Error playing sound ${sound}:`, err)

      // Try fallback with different approach
      try {
        await playFallbackSound(sound, volume)
      } catch (fallbackErr) {
        console.error("Fallback sound also failed:", fallbackErr)
        throw err
      }
    }
  }

  // Fallback sound method
  async function playFallbackSound(sound, volume) {
    console.log("Audio handler: Using fallback sound method")

    const soundFiles = {
      rain: "sounds/rain.mp3",
      cafe: "sounds/cafe.mp3",
      study: "sounds/study.mp3",
      focus: "sounds/focus.mp3",
    }

    const soundFile = soundFiles[sound]
    if (!soundFile) {
      throw new Error(`Unknown sound: ${sound}`)
    }

    // Try fetching the file directly
    const soundUrl = chrome.runtime.getURL(soundFile)
    const response = await fetch(soundUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch sound file: ${response.status}`)
    }

    const blob = await response.blob()
    const audioUrl = URL.createObjectURL(blob)

    const audio = new Audio(audioUrl)
    audio.loop = true
    audio.volume = volume

    await audio.play()

    audioPlayer = {
      pause: () => {
        try {
          audio.pause()
          audio.currentTime = 0
          URL.revokeObjectURL(audioUrl)
        } catch (err) {
          console.log("Audio handler: Fallback audio already stopped")
        }
      },
      audio: audio,
      setVolume: (vol) => {
        audio.volume = vol
      },
    }

    console.log(`Audio handler: Fallback sound ${sound} playing`)
  }

  function stopSound() {
    console.log("Audio handler: Stopping sound")

    if (audioPlayer) {
      try {
        if (typeof audioPlayer.pause === "function") {
          audioPlayer.pause()
        }
        audioPlayer = null
        currentSound = null
        console.log("Audio handler: Sound stopped")

        // Report to background script
        chrome.runtime
          .sendMessage({
            action: "audioStopped",
          })
          .catch(() => {
            // Background script might not be ready
          })
      } catch (err) {
        console.error("Audio handler: Error stopping sound:", err)
      }
    }
  }

  function setVolume(volume) {
    console.log(`Audio handler: Setting volume to ${volume}`)

    currentVolume = volume

    if (audioPlayer && audioPlayer.setVolume) {
      try {
        audioPlayer.setVolume(volume)
        console.log("Audio handler: Volume updated")
      } catch (err) {
        console.error("Audio handler: Error setting volume:", err)
      }
    }
  }

  // Resume audio on page load if it was playing (with delay to allow user gesture)
  chrome.storage.local.get(["currentSound", "volume"], (data) => {
    if (data.currentSound) {
      console.log(`Audio handler: Will resume sound: ${data.currentSound} after user gesture`)

      // Wait for user gesture before trying to play
      const tryResumeAudio = () => {
        if (userGestureReceived) {
          playSound(data.currentSound, (data.volume || 50) / 100)
        } else {
          // Try again in a bit
          setTimeout(tryResumeAudio, 1000)
        }
      }

      // Start trying after a short delay
      setTimeout(tryResumeAudio, 2000)
    }
  })
} else {
  console.log("Chrome runtime is not available. This script is likely running outside of a Chrome extension context.")
}
