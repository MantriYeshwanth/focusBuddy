// Offscreen document for PERSISTENT audio playback that works EVERYWHERE
console.log("Offscreen audio handler loaded - PERSISTENT AUDIO ACTIVE")

const currentAudioState = {
  playing: false,
  sound: null,
  volume: 0.5,
  audioElement: null,
}

// Update status display
function updateStatus(message) {
  const statusDiv = document.getElementById("audio-status")
  if (statusDiv) {
    statusDiv.textContent = message
  }
  console.log("Audio Status:", message)
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Offscreen received message:", message)

  // Only handle messages targeted to offscreen
  if (message.target !== "offscreen") {
    return
  }

  switch (message.action) {
    case "playSound":
      playSound(message.sound, message.volume)
        .then(() => {
          sendResponse({ success: true, playing: message.sound })
          updateStatus(`Playing: ${message.sound} at ${Math.round(message.volume * 100)}% volume`)
        })
        .catch((err) => {
          sendResponse({ success: false, error: err.message })
          updateStatus(`Error: ${err.message}`)
        })
      return true
    case "stopSound":
      stopSound()
      sendResponse({ success: true, playing: null })
      updateStatus("Audio stopped")
      break
    case "setVolume":
      setVolume(message.volume)
      sendResponse({ success: true, volume: message.volume })
      updateStatus(`Volume set to ${Math.round(message.volume * 100)}%`)
      break
    case "getAudioStatus":
      sendResponse({
        success: true,
        playing: currentAudioState.sound,
        volume: currentAudioState.volume,
      })
      break
  }

  return true
})

// Audio playback functions using actual MP3 files
async function playSound(sound, volume = 0.5) {
  console.log(`Offscreen: Playing sound ${sound} at volume ${volume}`)

  stopSound()

  try {
    currentAudioState.sound = sound
    currentAudioState.volume = volume

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
    console.log(`Offscreen: Loading sound from: ${soundUrl}`)

    // Create audio element
    const audio = new Audio(soundUrl)
    audio.loop = true
    audio.volume = volume
    audio.preload = "auto"

    // Wait for audio to be ready
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Audio loading timeout"))
      }, 10000)

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
          reject(new Error(`Audio loading failed: ${audio.error?.message || "Unknown error"}`))
        },
        { once: true },
      )

      // Start loading
      audio.load()
    })

    // Play the audio
    await audio.play()

    // Store audio element
    currentAudioState.audioElement = audio
    currentAudioState.playing = true

    console.log(`Offscreen: Sound ${sound} playing from ${soundFile} - PERSISTENT AUDIO ACTIVE`)

    // Report to background script
    chrome.runtime.sendMessage({
      action: "audioStarted",
      sound: sound,
    })
  } catch (err) {
    console.error(`Offscreen: Error playing sound ${sound}:`, err)
    throw err
  }
}

function stopSound() {
  console.log("Offscreen: Stopping sound")

  if (currentAudioState.audioElement) {
    try {
      currentAudioState.audioElement.pause()
      currentAudioState.audioElement.currentTime = 0
      currentAudioState.audioElement = null
    } catch (err) {
      console.log("Offscreen: Audio already stopped")
    }
  }

  currentAudioState.playing = false
  currentAudioState.sound = null

  // Report to background script
  chrome.runtime.sendMessage({
    action: "audioStopped",
  })
}

function setVolume(volume) {
  console.log(`Offscreen: Setting volume to ${volume}`)

  currentAudioState.volume = volume

  if (currentAudioState.audioElement) {
    try {
      currentAudioState.audioElement.volume = volume
      console.log("Offscreen: Volume updated")
    } catch (err) {
      console.error("Offscreen: Error setting volume:", err)
    }
  }
}

// Auto-resume audio on load if it was playing
chrome.storage.local.get(["currentSound", "volume"], (data) => {
  if (data.currentSound) {
    console.log(`Offscreen: Auto-resuming sound: ${data.currentSound}`)
    updateStatus(`Resuming: ${data.currentSound}`)

    // Small delay to ensure everything is ready
    setTimeout(() => {
      playSound(data.currentSound, (data.volume || 50) / 100)
        .then(() => {
          console.log("Offscreen: Auto-resume successful")
        })
        .catch((err) => {
          console.error("Offscreen: Auto-resume failed:", err)
          updateStatus(`Auto-resume failed: ${err.message}`)
        })
    }, 1000)
  } else {
    updateStatus("Ready for audio playback")
  }
})

updateStatus("Offscreen audio handler ready - PERSISTENT AUDIO SYSTEM ACTIVE")





