// document.addEventListener("DOMContentLoaded", () => {
//   // Timer elements
//   const minutesDisplay = document.getElementById("minutes")
//   const secondsDisplay = document.getElementById("seconds")
//   const timerSlider = document.getElementById("timer-slider")
//   const timerValue = document.getElementById("timer-value")
//   const startButton = document.getElementById("start-timer")
//   const pauseButton = document.getElementById("pause-timer")
//   const resetButton = document.getElementById("reset-timer")

//   // Music elements
//   const musicButtons = document.querySelectorAll(".music-btn")
//   const volumeControl = document.getElementById("volume")

//   let timerInterval
//   let currentSound = null
//   let audioPlayer = null

//   // Initialize timer display
//   chrome.storage.local.get(["timerDuration", "timerRemaining", "timerRunning"], (data) => {
//     if (data.timerDuration) {
//       timerSlider.value = Math.floor(data.timerDuration / 60)
//       timerValue.textContent = `${timerSlider.value} minutes`
//     }

//     if (data.timerRunning) {
//       const remaining = data.timerRemaining || data.timerDuration
//       updateTimerDisplay(remaining)
//       startButton.disabled = true
//       pauseButton.disabled = false
//       startTimer(remaining)
//     } else {
//       updateTimerDisplay(data.timerDuration || timerSlider.value * 60)
//     }
//   })

//   // Timer slider event
//   timerSlider.addEventListener("input", function () {
//     const minutes = Number.parseInt(this.value)
//     timerValue.textContent = `${minutes} minutes`
//     updateTimerDisplay(minutes * 60)

//     chrome.storage.local.set({ timerDuration: minutes * 60 })
//   })

//   // Start timer button
//   startButton.addEventListener("click", () => {
//     const duration = Number.parseInt(timerSlider.value) * 60

//     chrome.storage.local.set({
//       timerDuration: duration,
//       timerRemaining: duration,
//       timerRunning: true,
//       timerStartTime: Date.now(),
//       timerEndTime: Date.now() + duration * 1000,
//       focusState: "focused",
//     })

//     startTimer(duration)
//     startButton.disabled = true
//     pauseButton.disabled = false

//     // Update pet image
//     if (typeof updatePetImage === "function") {
//       updatePetImage("focused")
//     }

//     // Notify background script
//     chrome.runtime.sendMessage({
//       action: "startTimer",
//       duration: duration,
//     })
//   })

//   // Pause timer button
//   pauseButton.addEventListener("click", () => {
//     clearInterval(timerInterval)

//     chrome.storage.local.get(["timerRemaining"], (data) => {
//       chrome.storage.local.set({
//         timerRunning: false,
//         timerRemaining: data.timerRemaining,
//         focusState: "distracted",
//       })

//       startButton.disabled = false
//       pauseButton.disabled = true

//       // Update pet image
//       if (typeof updatePetImage === "function") {
//         updatePetImage("distracted")
//       }

//       // Notify background script
//       chrome.runtime.sendMessage({ action: "pauseTimer" })
//     })
//   })

//   // Reset timer button
//   resetButton.addEventListener("click", () => {
//     clearInterval(timerInterval)

//     const duration = Number.parseInt(timerSlider.value) * 60
//     updateTimerDisplay(duration)

//     chrome.storage.local.set({
//       timerRunning: false,
//       timerRemaining: duration,
//       focusState: "idle",
//     })

//     startButton.disabled = false
//     pauseButton.disabled = true

//     // Update pet image
//     if (typeof updatePetImage === "function") {
//       updatePetImage("idle")
//     }

//     // Notify background script
//     chrome.runtime.sendMessage({ action: "resetTimer" })
//   })

//   // Check for current sound and update UI
//   chrome.storage.local.get(["currentSound"], (data) => {
//     if (data.currentSound) {
//       const activeButton = document.querySelector(`.music-btn[data-sound="${data.currentSound}"]`)
//       if (activeButton) {
//         activeButton.classList.add("active")
//         currentSound = data.currentSound
//         // Try to play the current sound
//         playSound(data.currentSound)
//       }
//     }
//   })

//   // DIRECT AUDIO IMPLEMENTATION
//   // Music buttons with direct audio handling
//   musicButtons.forEach((button) => {
//     button.addEventListener("click", function () {
//       const sound = this.getAttribute("data-sound")
//       console.log(`Music button clicked: ${sound}`)

//       // Toggle active state
//       if (this.classList.contains("active")) {
//         // Stop sound
//         console.log(`Stopping sound: ${sound}`)
//         musicButtons.forEach((btn) => btn.classList.remove("active"))
//         stopSound()
//         currentSound = null
//         chrome.storage.local.set({ currentSound: null })
//       } else {
//         // Remove active class from all buttons
//         musicButtons.forEach((btn) => btn.classList.remove("active"))

//         // Add active class to clicked button
//         this.classList.add("active")
//         currentSound = sound
//         chrome.storage.local.set({ currentSound: sound })

//         // Play sound directly
//         playSound(sound)
//       }
//     })
//   })

//   // Direct audio playback functions
//   function playSound(sound) {
//     stopSound()
    
//     try {
//       console.log(`Playing sound: ${sound}`)
//       const soundUrl = chrome.runtime.getURL(`sounds/${sound}.mp3`)
//       console.log(`Sound URL: ${soundUrl}`)
      
//       // Create and configure audio element
//       audioPlayer = new Audio()
//       audioPlayer.src = soundUrl
//       audioPlayer.loop = true
//       audioPlayer.volume = volumeControl.value / 100
      
//       // Debug listeners
//       audioPlayer.addEventListener('canplay', () => {
//         console.log(`Sound ${sound} loaded and ready to play`)
//       })
      
//       audioPlayer.addEventListener('playing', () => {
//         console.log(`Sound ${sound} is now playing`)
//       })
      
//       audioPlayer.addEventListener('error', (e) => {
//         console.error(`Error with sound ${sound}:`, e)
//         console.error('Audio error code:', audioPlayer.error ? audioPlayer.error.code : 'unknown')
//       })
      
//       // Play the sound
//       audioPlayer.play()
//         .then(() => {
//           console.log(`Sound ${sound} playing successfully`)
//         })
//         .catch(err => {
//           console.error(`Failed to play ${sound}:`, err)
//           // Try an alternative approach
//           setTimeout(() => {
//             console.log(`Retrying playback for ${sound}`)
//             audioPlayer.play().catch(e => console.error(`Retry failed:`, e))
//           }, 500)
//         })
//     } catch (err) {
//       console.error(`Error setting up audio for ${sound}:`, err)
//     }
//   }

//   function stopSound() {
//     if (audioPlayer) {
//       try {
//         audioPlayer.pause()
//         audioPlayer.currentTime = 0
//         audioPlayer = null
//         console.log("Sound stopped")
//       } catch (err) {
//         console.error("Error stopping sound:", err)
//       }
//     }
//   }

//   // Volume control
//   volumeControl.addEventListener("input", function () {
//     const volume = this.value / 100
//     console.log(`Volume changed: ${volume}`)

//     chrome.storage.local.set({ volume: this.value })

//     if (audioPlayer) {
//       audioPlayer.volume = volume
//     }
//   })

//   // Start timer function
//   function startTimer(duration) {
//     let timer = duration

//     updateTimerDisplay(timer)

//     timerInterval = setInterval(() => {
//       timer--

//       if (timer < 0) {
//         clearInterval(timerInterval)
//         timerComplete()
//         return
//       }

//       updateTimerDisplay(timer)
//       chrome.storage.local.set({ timerRemaining: timer })
//     }, 1000)
//   }

//   // Timer complete function
//   function timerComplete() {
//     chrome.storage.local.set({
//       timerRunning: false,
//       focusState: "idle",
//     })

//     startButton.disabled = false
//     pauseButton.disabled = true

//     // Update pet image
//     if (typeof updatePetImage === "function") {
//       updatePetImage("idle")
//     }

//     // Update focus stats
//     updateFocusStats()

//     // Notify background script
//     chrome.runtime.sendMessage({ action: "timerComplete" })
//   }

//   // Update focus stats
//   function updateFocusStats() {
//     const today = new Date().toISOString().split("T")[0]
//     const duration = Number.parseInt(timerSlider.value)

//     chrome.storage.local.get(["focusStats"], (data) => {
//       const stats = data.focusStats || {}

//       if (!stats[today]) {
//         stats[today] = 0
//       }

//       stats[today] += duration / 60 // Convert to hours

//       chrome.storage.local.set({ focusStats: stats })
//     })
//   }

//   // Listen for messages from background script
//   chrome.runtime.onMessage.addListener((message) => {
//     if (message.action === "timerUpdated") {
//       updateTimerDisplay(message.remaining)
//     } else if (message.action === "timerComplete") {
//       clearInterval(timerInterval)
//       startButton.disabled = false
//       pauseButton.disabled = true
//       if (typeof updatePetImage === "function") {
//         updatePetImage("idle")
//       }
//     }
//   })

//   // Debug function to check audio files
//   function checkAudioFiles() {
//     const sounds = ["rain", "cafe", "study", "forest","Unstoppable"]
    
//     sounds.forEach(sound => {
//       const url = chrome.runtime.getURL(`sounds/${sound}.mp3`)
//       console.log(`Checking sound file: ${url}`)
      
//       fetch(url)
//         .then(response => {
//           if (response.ok) {
//             console.log(`✓ ${sound}.mp3 is accessible`)
//             return response.blob()
//           } else {
//             console.error(`✗ ${sound}.mp3 not found: ${response.status}`)
//             throw new Error(`File not found: ${response.status}`)
//           }
//         })
//         .then(blob => {
//           console.log(`${sound}.mp3 size: ${blob.size} bytes`)
//           if (blob.size === 0) {
//             console.warn(`${sound}.mp3 is empty!`)
//           }
//         })
//         .catch(err => {
//           console.error(`Error checking ${sound}.mp3:`, err)
//         })
//     })
//   }
  
//   // Run the check on load
//   checkAudioFiles()
// })

// // Update timer display
// function updateTimerDisplay(seconds) {
//   const minutesDisplay = document.getElementById("minutes")
//   const secondsDisplay = document.getElementById("seconds")

//   const mins = Math.floor(seconds / 60)
//   const secs = seconds % 60

//   minutesDisplay.textContent = mins.toString().padStart(2, "0")
//   secondsDisplay.textContent = secs.toString().padStart(2, "0")
// }

document.addEventListener("DOMContentLoaded", () => {
  // Timer elements
  const minutesDisplay = document.getElementById("minutes")
  const secondsDisplay = document.getElementById("seconds")
  const timerSlider = document.getElementById("timer-slider")
  const timerValue = document.getElementById("timer-value")
  const startButton = document.getElementById("start-timer")
  const pauseButton = document.getElementById("pause-timer")
  const resetButton = document.getElementById("reset-timer")

  // Music elements
  const musicButtons = document.querySelectorAll(".music-btn")
  const volumeControl = document.getElementById("volume")

  let timerInterval
  let currentSound = null

  // Initialize timer display
  chrome.storage.local.get(["timerDuration", "timerRemaining", "timerRunning"], (data) => {
    if (data.timerDuration) {
      timerSlider.value = Math.floor(data.timerDuration / 60)
      timerValue.textContent = `${timerSlider.value} minutes`
    }

    if (data.timerRunning) {
      const remaining = data.timerRemaining || data.timerDuration
      updateTimerDisplay(remaining)
      startButton.disabled = true
      pauseButton.disabled = false
      startTimer(remaining)
    } else {
      updateTimerDisplay(data.timerDuration || timerSlider.value * 60)
    }
  })

  // Timer slider event
  timerSlider.addEventListener("input", function () {
    const minutes = Number.parseInt(this.value)
    timerValue.textContent = `${minutes} minutes`
    updateTimerDisplay(minutes * 60)

    chrome.storage.local.set({ timerDuration: minutes * 60 })
  })

  // Start timer button
  startButton.addEventListener("click", () => {
    const duration = Number.parseInt(timerSlider.value) * 60

    chrome.storage.local.set({
      timerDuration: duration,
      timerRemaining: duration,
      timerRunning: true,
      timerStartTime: Date.now(),
      timerEndTime: Date.now() + duration * 1000,
      focusState: "focused",
    })

    startTimer(duration)
    startButton.disabled = true
    pauseButton.disabled = false

    // Update pet image
    if (typeof updatePetImage === "function") {
      updatePetImage("focused")
    }

    // Notify background script
    chrome.runtime.sendMessage({
      action: "startTimer",
      duration: duration,
    })
  })

  // Pause timer button
  pauseButton.addEventListener("click", () => {
    clearInterval(timerInterval)

    chrome.storage.local.get(["timerRemaining"], (data) => {
      chrome.storage.local.set({
        timerRunning: false,
        timerRemaining: data.timerRemaining,
        focusState: "distracted",
      })

      startButton.disabled = false
      pauseButton.disabled = true

      // Update pet image
      if (typeof updatePetImage === "function") {
        updatePetImage("distracted")
      }

      // Notify background script
      chrome.runtime.sendMessage({ action: "pauseTimer" })
    })
  })

  // Reset timer button
  resetButton.addEventListener("click", () => {
    clearInterval(timerInterval)

    const duration = Number.parseInt(timerSlider.value) * 60
    updateTimerDisplay(duration)

    chrome.storage.local.set({
      timerRunning: false,
      timerRemaining: duration,
      focusState: "idle",
    })

    startButton.disabled = false
    pauseButton.disabled = true

    // Update pet image
    if (typeof updatePetImage === "function") {
      updatePetImage("idle")
    }

    // Notify background script
    chrome.runtime.sendMessage({ action: "resetTimer" })
  })

  // Check for current sound and update UI
  chrome.storage.local.get(["currentSound"], (data) => {
    if (data.currentSound) {
      const activeButton = document.querySelector(`.music-btn[data-sound="${data.currentSound}"]`)
      if (activeButton) {
        activeButton.classList.add("active")
        currentSound = data.currentSound
      }
    }
  })

  // Improved Music buttons
  musicButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const sound = this.getAttribute("data-sound")
      console.log(`Music button clicked: ${sound}`)

      // Toggle active state
      if (this.classList.contains("active")) {
        // Stop sound
        console.log(`Stopping sound: ${sound}`)
        musicButtons.forEach((btn) => btn.classList.remove("active"))
        chrome.runtime.sendMessage({ action: "stopSound" }, (response) => {
          console.log("Stop sound response:", response)
        })
        currentSound = null
      } else {
        // Remove active class from all buttons
        musicButtons.forEach((btn) => btn.classList.remove("active"))

        // Add active class to clicked button
        this.classList.add("active")
        currentSound = sound

        // Play sound
        console.log(`Playing sound: ${sound} at volume: ${volumeControl.value / 100}`)
        chrome.runtime.sendMessage(
          {
            action: "playSound",
            sound: sound,
            volume: volumeControl.value / 100,
          },
          (response) => {
            console.log("Play sound response:", response)
          },
        )
      }
    })
  })

  // Volume control
  volumeControl.addEventListener("input", function () {
    const volume = this.value / 100
    console.log(`Volume changed: ${volume}`)

    chrome.storage.local.set({ volume: this.value })

    if (currentSound) {
      chrome.runtime.sendMessage(
        {
          action: "setVolume",
          volume: volume,
        },
        (response) => {
          console.log("Set volume response:", response)
        },
      )
    }
  })

  // Start timer function
  function startTimer(duration) {
    let timer = duration

    updateTimerDisplay(timer)

    timerInterval = setInterval(() => {
      timer--

      if (timer < 0) {
        clearInterval(timerInterval)
        timerComplete()
        return
      }

      updateTimerDisplay(timer)
      chrome.storage.local.set({ timerRemaining: timer })
    }, 1000)
  }

  // Timer complete function
  function timerComplete() {
    chrome.storage.local.set({
      timerRunning: false,
      focusState: "idle",
    })

    startButton.disabled = false
    pauseButton.disabled = true

    // Update pet image
    if (typeof updatePetImage === "function") {
      updatePetImage("idle")
    }

    // Don't update focus stats here - let background script handle it
    // Notify background script
    chrome.runtime.sendMessage({ action: "timerComplete" })
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "timerUpdated") {
      updateTimerDisplay(message.remaining)
    } else if (message.action === "timerComplete") {
      clearInterval(timerInterval)
      startButton.disabled = false
      pauseButton.disabled = true
      if (typeof updatePetImage === "function") {
        updatePetImage("idle")
      }
    }
  })

  // Check audio files on load
  chrome.runtime.sendMessage({ action: "checkAudioFiles" })
})

// Update timer display
function updateTimerDisplay(seconds) {
  const minutesDisplay = document.getElementById("minutes")
  const secondsDisplay = document.getElementById("seconds")

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  minutesDisplay.textContent = mins.toString().padStart(2, "0")
  secondsDisplay.textContent = secs.toString().padStart(2, "0")
}
