// Audio handler that runs in content script context - persists when popup closes
console.log("Audio handler loaded")

let audioPlayer = null
let currentSound = null
let currentVolume = 0.5

// Listen for messages from popup and background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Audio handler received message:", message)

  switch (message.action) {
    case "playSound":
      playSound(message.sound, message.volume)
      sendResponse({ success: true, playing: message.sound })
      break
    case "stopSound":
      stopSound()
      sendResponse({ success: true, playing: null })
      break
    case "setVolume":
      setVolume(message.volume)
      sendResponse({ success: true, volume: message.volume })
      break
    case "checkAudioStatus":
      sendResponse({
        success: true,
        playing: currentSound,
        volume: currentVolume,
      })
      break
  }

  return true
})

// Audio playback functions
function playSound(sound, volume = 0.5) {
  console.log(`Audio handler: Playing sound ${sound} at volume ${volume}`)

  stopSound()

  try {
    currentSound = sound
    currentVolume = volume

    // Try to load actual MP3 file first
    const soundUrl = chrome.runtime.getURL(`sounds/${sound}.mp3`)
    console.log(`Audio handler: Sound URL: ${soundUrl}`)

    audioPlayer = new Audio()
    audioPlayer.src = soundUrl
    audioPlayer.loop = true
    audioPlayer.volume = volume

    // Add error handler for missing files
    audioPlayer.addEventListener("error", (e) => {
      console.warn(`Audio handler: MP3 file not found for ${sound}, using test tone`)

      // Fallback to test sounds using Web Audio API
      createTestTone(sound, volume)
    })

    audioPlayer.addEventListener("canplay", () => {
      console.log(`Audio handler: Sound ${sound} loaded and ready to play`)
    })

    audioPlayer.addEventListener("playing", () => {
      console.log(`Audio handler: Sound ${sound} is now playing`)
    })

    // Try to play
    audioPlayer
      .play()
      .then(() => {
        console.log(`Audio handler: Sound ${sound} playing successfully`)
        // Store current sound in storage
        chrome.storage.local.set({ currentSound: sound })
      })
      .catch((err) => {
        console.error(`Audio handler: Failed to play ${sound}:`, err)
        // Try test tone fallback
        createTestTone(sound, volume)
      })
  } catch (err) {
    console.error(`Audio handler: Error setting up audio for ${sound}:`, err)
    createTestTone(sound, volume)
  }
}

function createTestTone(sound, volume) {
  try {
    console.log(`Audio handler: Creating test tone for ${sound}`)

    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Different frequencies for different sounds
    const frequencies = {
      rain: 200,
      cafe: 300,
      study: 400,
      focus: 500,
    }

    oscillator.frequency.value = frequencies[sound] || 300
    oscillator.type = "sine"
    gainNode.gain.value = volume * 0.1 // Lower volume for test tones

    oscillator.start()

    // Store for stopping later
    audioPlayer = {
      pause: () => {
        try {
          oscillator.stop()
          audioContext.close()
        } catch (err) {
          console.log("Audio handler: Audio context already closed")
        }
      },
      volume: gainNode.gain.value,
      gainNode: gainNode,
    }

    console.log(`Audio handler: Test tone playing for ${sound} at ${frequencies[sound]}Hz`)
    chrome.storage.local.set({ currentSound: sound })
  } catch (err) {
    console.error(`Audio handler: Error creating test tone:`, err)
  }
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
      chrome.storage.local.set({ currentSound: null })
    } catch (err) {
      console.error("Audio handler: Error stopping sound:", err)
    }
  }
}

function setVolume(volume) {
  console.log(`Audio handler: Setting volume to ${volume}`)

  currentVolume = volume

  if (audioPlayer) {
    try {
      if (audioPlayer.volume !== undefined) {
        audioPlayer.volume = volume
      } else if (audioPlayer.gainNode) {
        audioPlayer.gainNode.gain.value = volume * 0.1
      }
      console.log("Audio handler: Volume updated")
    } catch (err) {
      console.error("Audio handler: Error setting volume:", err)
    }
  }
}

// Resume audio on page load if it was playing
chrome.storage.local.get(["currentSound", "volume"], (data) => {
  if (data.currentSound) {
    console.log(`Audio handler: Resuming sound: ${data.currentSound}`)
    // Small delay to ensure page is ready
    setTimeout(() => {
      playSound(data.currentSound, (data.volume || 50) / 100)
    }, 1000)
  }
})

// Keep audio playing when navigating
window.addEventListener("beforeunload", () => {
  // Don't stop audio on navigation - let it continue
  console.log("Audio handler: Page unloading, keeping audio alive")
})
