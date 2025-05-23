document.addEventListener("DOMContentLoaded", () => {
  console.log("Popup loaded")

  // Request notification permission when popup opens
  if (Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      console.log(`Notification permission: ${permission}`)
    })
  }

  // Tab switching functionality
  const tabButtons = document.querySelectorAll(".tab-btn")
  const tabContents = document.querySelectorAll(".tab-content")

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabName = button.getAttribute("data-tab")

      // Update active tab button
      tabButtons.forEach((btn) => btn.classList.remove("active"))
      button.classList.add("active")

      // Show selected tab content
      tabContents.forEach((content) => {
        content.classList.remove("active")
        if (content.id === tabName) {
          content.classList.add("active")
        }
      })
    })
  })

  // Check timer status on popup open
  chrome.storage.local.get(["timerRunning", "timerEndTime", "timerDuration", "timerRemaining"], (data) => {
    if (data.timerRunning) {
      updateTimerDisplay(data.timerRemaining || data.timerDuration)
      document.getElementById("start-timer").disabled = true
      document.getElementById("pause-timer").disabled = false
    }
  })

  // Check pet status
  chrome.storage.local.get(["focusState"], (data) => {
    updatePetImage(data.focusState || "idle")
  })

  // Check music status
  chrome.storage.local.get(["currentSound", "volume"], (data) => {
    if (data.currentSound) {
      const musicBtn = document.querySelector(`.music-btn[data-sound="${data.currentSound}"]`)
      if (musicBtn) {
        musicBtn.classList.add("active")
      }
    }

    if (data.volume !== undefined) {
      document.getElementById("volume").value = data.volume
    }
  })

  // Initialize blocker status
  chrome.storage.local.get(["blockerEnabled"], (data) => {
    const enableBtn = document.getElementById("enable-blocker")
    const disableBtn = document.getElementById("disable-blocker")

    if (data.blockerEnabled) {
      enableBtn.disabled = true
      disableBtn.disabled = false
    } else {
      enableBtn.disabled = false
      disableBtn.disabled = true
    }
  })

  // Load reminder interval
  chrome.storage.local.get(["reminderInterval"], (data) => {
    if (data.reminderInterval) {
      document.getElementById("reminder-interval").value = data.reminderInterval
    }
  })

  // Update reminder interval when changed
  document.getElementById("reminder-interval").addEventListener("change", function () {
    const interval = Number.parseInt(this.value)
    chrome.storage.local.set({ reminderInterval: interval })

    // Update the alarm
    chrome.runtime.sendMessage({ action: "updateReminderInterval", interval: interval })
  })

  // Add reminder
  document.getElementById("add-reminder").addEventListener("click", () => {
    const reminderInput = document.getElementById("reminder-input")
    const reminderText = reminderInput.value.trim()

    if (reminderText) {
      chrome.storage.local.get(["reminders"], (data) => {
        const reminders = data.reminders || []
        reminders.push(reminderText)

        chrome.storage.local.set({ reminders: reminders }, () => {
          reminderInput.value = ""
          loadReminders()
        })
      })
    }
  })

  // Load reminders
  function loadReminders() {
    const reminderList = document.getElementById("reminder-list")

    chrome.storage.local.get(["reminders"], (data) => {
      const reminders = data.reminders || []

      reminderList.innerHTML = ""

      reminders.forEach((reminder, index) => {
        const li = document.createElement("li")
        li.innerHTML = `
          <span>${reminder}</span>
          <button class="remove-reminder" data-index="${index}">×</button>
        `
        reminderList.appendChild(li)
      })

      // Add event listeners to remove buttons
      document.querySelectorAll(".remove-reminder").forEach((button) => {
        button.addEventListener("click", function () {
          const index = Number.parseInt(this.getAttribute("data-index"))

          chrome.storage.local.get(["reminders"], (data) => {
            const reminders = data.reminders || []
            reminders.splice(index, 1)

            chrome.storage.local.set({ reminders: reminders }, () => {
              loadReminders()
            })
          })
        })
      })
    })
  }

  // Initial load of reminders
  loadReminders()
}) // <-- This closing brace was missing!

// Function to update pet image based on focus state
function updatePetImage(state) {
  const petImage = document.getElementById("pet-image")

  switch (state) {
    case "focused":
      petImage.src = "images/pet-happy.png"
      break
    case "distracted":
      petImage.src = "images/pet-sad.png"
      break
    default:
      petImage.src = "images/pet-neutral.png" // Changed from pet-neutral.png to pet-idle.png
      break
  }
}

function updateTimerDisplay(timeRemaining) {
  const minutes = Math.floor(timeRemaining / 60)
  const seconds = Math.floor(timeRemaining % 60)

  const minutesDisplay = document.getElementById("minutes")
  const secondsDisplay = document.getElementById("seconds")

  if (minutesDisplay && secondsDisplay) {
    minutesDisplay.textContent = minutes.toString().padStart(2, "0")
    secondsDisplay.textContent = seconds.toString().padStart(2, "0")
  }
}