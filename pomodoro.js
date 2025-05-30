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

  // Music buttons - send messages to background script
  musicButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const sound = this.getAttribute("data-sound")
      console.log(`Music button clicked: ${sound}`)

      // Toggle active state
      if (this.classList.contains("active")) {
        // Stop sound
        console.log(`Stopping sound: ${sound}`)
        musicButtons.forEach((btn) => btn.classList.remove("active"))

        // Send stop message to background script
        chrome.runtime.sendMessage({ action: "stopSound" }, (response) => {
          if (chrome.runtime.lastError) {
            console.log("Stop sound message error:", chrome.runtime.lastError.message)
          } else {
            console.log("Stop sound response:", response)
          }
        })

        currentSound = null
      } else {
        // Remove active class from all buttons
        musicButtons.forEach((btn) => btn.classList.remove("active"))

        // Add active class to clicked button
        this.classList.add("active")
        currentSound = sound

        // Send play message to background script
        const volume = volumeControl.value / 100
        console.log(`Playing sound: ${sound} at volume: ${volume}`)

        chrome.runtime.sendMessage(
          {
            action: "playSound",
            sound: sound,
            volume: volume,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.log("Play sound message error:", chrome.runtime.lastError.message)
              // Don't show notification, just log the error
            } else {
              console.log("Play sound response:", response)
              if (!response || !response.success) {
                console.warn("Audio failed to start, but offscreen document should handle it")
                // No notification needed - offscreen document handles audio
              }
            }
          },
        )
      }
    })
  })

  // Volume control - send to background script
  volumeControl.addEventListener("input", function () {
    const volume = this.value / 100
    console.log(`Volume changed: ${volume}`)

    if (currentSound) {
      chrome.runtime.sendMessage(
        {
          action: "setVolume",
          volume: volume,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.log("Set volume message error:", chrome.runtime.lastError.message)
          } else {
            console.log("Set volume response:", response)
          }
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
