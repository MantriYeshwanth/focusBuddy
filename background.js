// Background script - manages persistent audio via offscreen document
console.log("Background script loaded")

let offscreenDocumentCreated = false
let currentAudioState = {
  playing: false,
  sound: null,
  volume: 0.5,
}

// Create offscreen document for persistent audio
async function createOffscreenDocument() {
  if (offscreenDocumentCreated) {
    console.log("Offscreen document already exists")
    return
  }

  try {
    // Check if offscreen document already exists
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
    })

    if (existingContexts.length > 0) {
      console.log("Offscreen document already exists from previous session")
      offscreenDocumentCreated = true
      return
    }

    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["AUDIO_PLAYBACK"],
      justification: "Playing background music for focus sessions",
    })
    offscreenDocumentCreated = true
    console.log("✅ Offscreen document created successfully for PERSISTENT audio")

    // Test the connection
    setTimeout(async () => {
      try {
        await chrome.runtime.sendMessage({
          target: "offscreen",
          action: "getAudioStatus",
        })
        console.log("✅ Offscreen document communication test successful")
      } catch (err) {
        console.log("Offscreen document communication test - this is normal on startup")
      }
    }, 1000)
  } catch (err) {
    console.error("❌ Failed to create offscreen document:", err)
    offscreenDocumentCreated = false
  }
}

// Add this new function to check if offscreen document is working
async function checkOffscreenStatus() {
  try {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
    })
    console.log(`Offscreen contexts found: ${contexts.length}`)
    return contexts.length > 0
  } catch (err) {
    console.error("Error checking offscreen status:", err)
    return false
  }
}

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log("Extension installed")

  // Create offscreen document immediately
  await createOffscreenDocument()

  // Set default values
  chrome.storage.local.set({
    timerRunning: false,
    timerDuration: 25 * 60,
    timerRemaining: 25 * 60,
    focusState: "idle",
    blockerEnabled: false,
    blockedWebsites: [],
    todos: [],
    focusStats: {},
    reminders: ["Stay focused!", "You can do it!", "Keep going!"],
    reminderInterval: 15,
    currentSound: null,
    volume: 50,
  })

  // Create alarm for reminders
  chrome.alarms.create("reminderAlarm", { periodInMinutes: 15 })

  // Send a test notification on install
  sendNotificationToAllTabs("Focus Buddy Installed", "Extension has been installed successfully!")
})

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  console.log("Background received message:", message)

  // Ensure offscreen document exists for audio operations
  if (["playSound", "stopSound", "setVolume"].includes(message.action)) {
    await createOffscreenDocument()
  }

  switch (message.action) {
    case "startTimer":
      handleStartTimer(message.duration)
      sendResponse({ success: true })
      break
    case "pauseTimer":
      handlePauseTimer()
      sendResponse({ success: true })
      break
    case "resetTimer":
      handleResetTimer()
      sendResponse({ success: true })
      break
    case "playSound":
      await handlePlaySound(message.sound, message.volume)
      sendResponse({ success: true, playing: message.sound })
      break
    case "stopSound":
      await handleStopSound()
      sendResponse({ success: true, playing: null })
      break
    case "setVolume":
      await handleSetVolume(message.volume)
      sendResponse({ success: true, volume: message.volume })
      break
    case "enableBlocker":
      enableWebsiteBlocker()
      sendResponse({ success: true })
      break
    case "disableBlocker":
      disableWebsiteBlocker()
      sendResponse({ success: true })
      break
    case "updateReminderInterval":
      updateReminderInterval(message.interval)
      sendResponse({ success: true })
      break
    case "sendTestNotification":
      // Only send test notifications when explicitly requested from notifications tab
      sendNotificationToAllTabs("Test Notification", "This is a test notification from Focus Buddy!")
      sendResponse({ success: true })
      break
    case "getAudioStatus":
      sendResponse({
        success: true,
        playing: currentAudioState.sound,
        volume: currentAudioState.volume,
      })
      break
    case "audioStarted":
      // Offscreen document reports audio started successfully
      currentAudioState.playing = true
      currentAudioState.sound = message.sound
      sendResponse({ success: true })
      break
    case "audioStopped":
      // Offscreen document reports audio stopped
      currentAudioState.playing = false
      currentAudioState.sound = null
      sendResponse({ success: true })
      break
  }

  return true
})

// Audio handling functions - send to offscreen document
async function handlePlaySound(sound, volume) {
  console.log(`🎵 Background: Playing sound ${sound} at volume ${volume} via offscreen`)

  // Double-check offscreen document exists
  const offscreenExists = await checkOffscreenStatus()
  if (!offscreenExists) {
    console.log("Offscreen document missing, recreating...")
    await createOffscreenDocument()
  }

  currentAudioState = {
    playing: true,
    sound: sound,
    volume: volume,
  }

  chrome.storage.local.set({ currentSound: sound, volume: volume * 100 })

  try {
    const response = await chrome.runtime.sendMessage({
      target: "offscreen",
      action: "playSound",
      sound: sound,
      volume: volume,
    })
    console.log("✅ Offscreen play response:", response)
  } catch (err) {
    console.log("Offscreen message failed, this is normal - audio will still work:", err.message)
    // Try recreating offscreen document
    offscreenDocumentCreated = false
    await createOffscreenDocument()
    // Retry once
    try {
      await chrome.runtime.sendMessage({
        target: "offscreen",
        action: "playSound",
        sound: sound,
        volume: volume,
      })
      console.log("✅ Retry successful after recreating offscreen document")
    } catch (retryErr) {
      console.log("Retry also failed, but offscreen document should handle audio independently")
    }
  }
}

async function handleStopSound() {
  console.log("Background: Stopping sound via offscreen")

  currentAudioState = {
    playing: false,
    sound: null,
    volume: currentAudioState.volume,
  }

  chrome.storage.local.set({ currentSound: null })

  try {
    await chrome.runtime.sendMessage({
      target: "offscreen",
      action: "stopSound",
    })
  } catch (err) {
    console.log("Stop sound message failed, this is normal")
  }
}

async function handleSetVolume(volume) {
  console.log(`Background: Setting volume to ${volume} via offscreen`)

  currentAudioState.volume = volume
  chrome.storage.local.set({ volume: volume * 100 })

  try {
    await chrome.runtime.sendMessage({
      target: "offscreen",
      action: "setVolume",
      volume: volume,
    })
  } catch (err) {
    console.log("Set volume message failed, this is normal")
  }
}

// WEBSITE BLOCKING FUNCTIONALITY
function enableWebsiteBlocker() {
  console.log("Website blocker enabled")
  chrome.storage.local.set({ blockerEnabled: true })
}

function disableWebsiteBlocker() {
  console.log("Website blocker disabled")
  chrome.storage.local.set({ blockerEnabled: false })
}

// Listen for tab updates to check for blocked websites
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading" || changeInfo.status === "complete") {
    checkAndBlockWebsite(tabId, tab.url)
  }
})

chrome.tabs.onCreated.addListener((tab) => {
  if (tab.url) {
    checkAndBlockWebsite(tab.id, tab.url)
  }
})

function checkAndBlockWebsite(tabId, url) {
  if (!url) return

  chrome.storage.local.get(["blockerEnabled", "blockedWebsites"], (data) => {
    if (!data.blockerEnabled) {
      return
    }

    const blockedWebsites = data.blockedWebsites || []
    const currentUrl = url.toLowerCase()

    const isBlocked = blockedWebsites.some((blockedSite) => {
      const cleanBlockedSite = blockedSite
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
      const cleanCurrentUrl = currentUrl.replace(/^https?:\/\//, "").replace(/^www\./, "")

      return cleanCurrentUrl.includes(cleanBlockedSite)
    })

    if (isBlocked) {
      console.log(`Blocking access to: ${url}`)
      const blockedPageUrl = chrome.runtime.getURL("blocked.html")
      chrome.tabs.update(tabId, { url: blockedPageUrl })
      sendNotificationToAllTabs("Website Blocked", "This website has been blocked to help you stay focused!")
    }
  })
}

// Timer handling
let timerInterval = null

function handleStartTimer(duration) {
  console.log(`Starting timer for ${duration} seconds`)

  const endTime = Date.now() + duration * 1000

  chrome.storage.local.set({
    timerRunning: true,
    timerEndTime: endTime,
    focusState: "focused",
  })

  if (timerInterval) {
    clearInterval(timerInterval)
  }

  timerInterval = setInterval(() => {
    const now = Date.now()
    const remaining = Math.max(0, Math.floor((endTime - now) / 1000))

    chrome.storage.local.set({ timerRemaining: remaining })

    if (remaining <= 0) {
      handleTimerComplete()
    }
  }, 1000)
}

function handlePauseTimer() {
  console.log("Pausing timer")

  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }

  chrome.storage.local.set({
    timerRunning: false,
    focusState: "distracted",
  })

  // Stop music when timer is paused
  handleStopSound()
}

function handleResetTimer() {
  console.log("Resetting timer")

  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }

  chrome.storage.local.get(["timerDuration"], (data) => {
    chrome.storage.local.set({
      timerRunning: false,
      timerRemaining: data.timerDuration,
      focusState: "idle",
    })
  })

  // Stop music when timer is reset
  handleStopSound()
}

function handleTimerComplete() {
  console.log("Timer complete")

  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }

  chrome.storage.local.set({
    timerRunning: false,
    focusState: "idle",
  })

  // Stop music when timer completes
  handleStopSound()

  chrome.storage.local.get(["timerDuration", "focusStats"], (data) => {
    const stats = data.focusStats || {}
    const duration = data.timerDuration || 1500
    const hours = duration / 3600
    const today = new Date().toISOString().split("T")[0]

    console.log(`Adding ${hours.toFixed(2)} hours to focus stats for ${today}`)

    if (!stats[today]) {
      stats[today] = 0
    }

    stats[today] += hours

    chrome.storage.local.set({ focusStats: stats }, () => {
      console.log("Focus stats updated:", stats)
      sendNotificationToAllTabs(
        "Focus Timer Complete",
        `Great job! You focused for ${(duration / 60).toFixed(0)} minutes. Total today: ${stats[today].toFixed(1)} hours.`,
      )
    })
  })
}

// Reminder handling
function updateReminderInterval(interval) {
  console.log(`Updating reminder interval to ${interval} minutes`)

  chrome.alarms.clear("reminderAlarm", () => {
    chrome.alarms.create("reminderAlarm", {
      periodInMinutes: interval,
    })
  })
}

chrome.alarms.onAlarm.addListener((alarm) => {
  console.log(`Alarm fired: ${alarm.name}`)

  if (alarm.name === "reminderAlarm") {
    showRandomReminder()
  }
})

function showRandomReminder() {
  chrome.storage.local.get(["reminders", "timerRunning"], (data) => {
    if (!data.timerRunning) {
      console.log("Timer not running, skipping reminder")
      return
    }

    const reminders = data.reminders || []

    if (reminders.length > 0) {
      const randomIndex = Math.floor(Math.random() * reminders.length)
      const reminder = reminders[randomIndex]

      console.log(`Showing reminder: ${reminder}`)
      sendNotificationToAllTabs("Focus Reminder", reminder)
    }
  })
}

// Function to send notifications
function sendNotificationToAllTabs(title, message) {
  console.log(`Sending notification: ${title} - ${message}`)

  chrome.notifications.create(
    {
      type: "basic",
      iconUrl: "images/icon.png",
      title: title,
      message: message,
      priority: 2,
    },
    (notificationId) => {
      if (chrome.runtime.lastError) {
        console.error("Chrome notification error:", chrome.runtime.lastError)

        chrome.tabs.query({}, (tabs) => {
          if (tabs.length > 0) {
            for (const tab of tabs) {
              if (tab.active) {
                chrome.tabs
                  .sendMessage(tab.id, {
                    action: "showNotification",
                    title: title,
                    message: message,
                  })
                  .catch((err) => {
                    console.error(`Error sending message to tab ${tab.id}:`, err)
                  })
                return
              }
            }
          }
        })
      } else {
        console.log(`Chrome notification created with ID: ${notificationId}`)
      }
    },
  )
}

// Resume functionality on startup
chrome.runtime.onStartup.addListener(async () => {
  console.log("Extension starting up")

  // Create offscreen document
  await createOffscreenDocument()

  chrome.storage.local.get(["timerRunning", "timerEndTime", "currentSound", "volume"], async (data) => {
    if (data.timerRunning && data.timerEndTime) {
      const remaining = Math.max(0, Math.floor((data.timerEndTime - Date.now()) / 1000))

      if (remaining > 0) {
        console.log(`Resuming timer with ${remaining} seconds remaining`)
        handleStartTimer(remaining)

        // Resume audio if it was playing
        if (data.currentSound) {
          console.log(`Resuming audio: ${data.currentSound}`)
          await handlePlaySound(data.currentSound, (data.volume || 50) / 100)
        }
      } else {
        chrome.storage.local.set({
          timerRunning: false,
          focusState: "idle",
        })
      }
    } else if (data.currentSound) {
      // Resume audio even if timer isn't running
      console.log(`Resuming audio: ${data.currentSound}`)
      await handlePlaySound(data.currentSound, (data.volume || 50) / 100)
    }
  })
})
