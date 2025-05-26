// // Simple background script focused on making notifications work
// console.log("Background script loaded")

// // Audio player
// let audioPlayer = null

// // Initialize on install
// chrome.runtime.onInstalled.addListener(() => {
//   console.log("Extension installed")

//   // Set default values
//   chrome.storage.local.set({
//     timerRunning: false,
//     timerDuration: 25 * 60,
//     timerRemaining: 25 * 60,
//     focusState: "idle",
//     blockerEnabled: false,
//     blockedWebsites: [],
//     todos: [],
//     focusStats: {},
//     reminders: ["Stay focused!", "You can do it!", "Keep going!"],
//     reminderInterval: 15,
//     currentSound: null,
//     volume: 50,
//   })

//   // Create alarm for reminders
//   chrome.alarms.create("reminderAlarm", { periodInMinutes: 1 })

//   // Send a test notification on install
//   sendNotificationToAllTabs("Focus Buddy Installed", "Extension has been installed successfully!")
// })

// // Handle messages from popup
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   console.log("Background received message:", message)

//   switch (message.action) {
//     case "startTimer":
//       handleStartTimer(message.duration)
//       break
//     case "pauseTimer":
//       handlePauseTimer()
//       break
//     case "resetTimer":
//       handleResetTimer()
//       break
//     case "playSound":
//       playSound(message.sound, message.volume)
//       break
//     case "stopSound":
//       stopSound()
//       break
//     case "setVolume":
//       setVolume(message.volume)
//       break
//     case "updateReminderInterval":
//       updateReminderInterval(message.interval)
//       break
//     case "sendTestNotification":
//       sendNotificationToAllTabs("Test Notification", "This is a test notification from Focus Buddy!")
//       sendResponse({ success: true })
//       break
//   }

//   return true // Keep the message channel open for async responses
// })

// // Timer handling
// let timerInterval = null

// function handleStartTimer(duration) {
//   console.log(`Starting timer for ${duration} seconds`)

//   const endTime = Date.now() + duration * 1000

//   chrome.storage.local.set({
//     timerRunning: true,
//     timerEndTime: endTime,
//     focusState: "focused",
//   })

//   if (timerInterval) {
//     clearInterval(timerInterval)
//   }

//   timerInterval = setInterval(() => {
//     const now = Date.now()
//     const remaining = Math.max(0, Math.floor((endTime - now) / 1000))

//     chrome.storage.local.set({ timerRemaining: remaining })

//     if (remaining <= 0) {
//       handleTimerComplete()
//     }
//   }, 1000)
// }

// function handlePauseTimer() {
//   console.log("Pausing timer")

//   if (timerInterval) {
//     clearInterval(timerInterval)
//     timerInterval = null
//   }

//   chrome.storage.local.set({
//     timerRunning: false,
//     focusState: "distracted",
//   })
// }

// function handleResetTimer() {
//   console.log("Resetting timer")

//   if (timerInterval) {
//     clearInterval(timerInterval)
//     timerInterval = null
//   }

//   chrome.storage.local.get(["timerDuration"], (data) => {
//     chrome.storage.local.set({
//       timerRunning: false,
//       timerRemaining: data.timerDuration,
//       focusState: "idle",
//     })
//   })
// }

// function handleTimerComplete() {
//   console.log("Timer complete")

//   if (timerInterval) {
//     clearInterval(timerInterval)
//     timerInterval = null
//   }

//   chrome.storage.local.set({
//     timerRunning: false,
//     focusState: "idle",
//   })

//   // Update focus stats
//   updateFocusStats()

//   // Show notification
//   sendNotificationToAllTabs("Focus Timer Complete", "Great job! Your focus session is complete.")
// }

// function updateFocusStats() {
//   const today = new Date().toISOString().split("T")[0]

//   chrome.storage.local.get(["timerDuration", "focusStats"], (data) => {
//     const stats = data.focusStats || {}
//     const duration = data.timerDuration / 3600 // Convert seconds to hours

//     if (!stats[today]) {
//       stats[today] = 0
//     }

//     stats[today] += duration

//     chrome.storage.local.set({ focusStats: stats })
//   })
// }

// // Sound handling
// function playSound(sound, volume) {
//   console.log(`Playing sound: ${sound} at volume: ${volume}`)

//   stopSound()

//   try {
//     audioPlayer = new Audio(chrome.runtime.getURL(`sounds/${sound}.mp3`))
//     audioPlayer.loop = true
//     audioPlayer.volume = volume || 0.5

//     const playPromise = audioPlayer.play()

//     if (playPromise !== undefined) {
//       playPromise
//         .then(() => {
//           console.log(`Sound ${sound} playing successfully`)
//           chrome.storage.local.set({ currentSound: sound })
//         })
//         .catch((err) => {
//           console.error("Error playing audio:", err)
//         })
//     }
//   } catch (err) {
//     console.error("Error creating audio:", err)
//   }
// }

// function stopSound() {
//   if (audioPlayer) {
//     try {
//       audioPlayer.pause()
//       audioPlayer = null
//       chrome.storage.local.set({ currentSound: null })
//     } catch (err) {
//       console.error("Error stopping sound:", err)
//     }
//   }
// }

// function setVolume(volume) {
//   if (audioPlayer) {
//     try {
//       audioPlayer.volume = volume
//     } catch (err) {
//       console.error("Error setting volume:", err)
//     }
//   }
// }

// // Reminder handling
// function updateReminderInterval(interval) {
//   console.log(`Updating reminder interval to ${interval} minutes`)

//   chrome.alarms.clear("reminderAlarm", () => {
//     chrome.alarms.create("reminderAlarm", {
//       periodInMinutes: interval,
//     })
//   })
// }

// chrome.alarms.onAlarm.addListener((alarm) => {
//   console.log(`Alarm fired: ${alarm.name}`)

//   if (alarm.name === "reminderAlarm") {
//     showRandomReminder()
//   }
// })

// function showRandomReminder() {
//   chrome.storage.local.get(["reminders", "timerRunning"], (data) => {
//     if (!data.timerRunning) {
//       console.log("Timer not running, skipping reminder")
//       return
//     }

//     const reminders = data.reminders || []

//     if (reminders.length > 0) {
//       const randomIndex = Math.floor(Math.random() * reminders.length)
//       const reminder = reminders[randomIndex]

//       console.log(`Showing reminder: ${reminder}`)
//       sendNotificationToAllTabs("Focus Reminder", reminder)
//     }
//   })
// }

// // THIS WAS MISSING - Function to send notifications via content script
// function sendNotificationToAllTabs(title, message) {
//   console.log(`Sending notification to all tabs: ${title} - ${message}`)

//   // First try using Chrome's notification API
//   chrome.notifications.create(
//     {
//       type: "basic",
//       iconUrl: "images/icon.png",
//       title: title,
//       message: message,
//       priority: 2,
//     },
//     (notificationId) => {
//       if (chrome.runtime.lastError) {
//         console.error("Chrome notification error:", chrome.runtime.lastError)

//         // Fallback to content script notifications
//         chrome.tabs.query({}, (tabs) => {
//           console.log(`Found ${tabs.length} tabs to send notifications to`)

//           if (tabs.length > 0) {
//             // Send to the first active tab
//             for (const tab of tabs) {
//               if (tab.active) {
//                 console.log(`Sending notification to active tab ${tab.id}`)
//                 chrome.tabs
//                   .sendMessage(tab.id, {
//                     action: "showNotification",
//                     title: title,
//                     message: message,
//                   })
//                   .catch((err) => {
//                     console.error(`Error sending message to tab ${tab.id}:`, err)
//                   })
//                 return
//               }
//             }

//             // If no active tab, send to the first tab
//             console.log(`Sending notification to first tab ${tabs[0].id}`)
//             chrome.tabs
//               .sendMessage(tabs[0].id, {
//                 action: "showNotification",
//                 title: title,
//                 message: message,
//               })
//               .catch((err) => {
//                 console.error(`Error sending message to tab ${tabs[0].id}:`, err)
//               })
//           }
//         })
//       } else {
//         console.log(`Chrome notification created with ID: ${notificationId}`)
//       }
//     },
//   )
// }

// // Check timer status when browser starts
// chrome.runtime.onStartup.addListener(() => {
//   console.log("Extension starting up")

//   chrome.storage.local.get(["timerRunning", "timerEndTime"], (data) => {
//     if (data.timerRunning && data.timerEndTime) {
//       const remaining = Math.max(0, Math.floor((data.timerEndTime - Date.now()) / 1000))

//       if (remaining > 0) {
//         // Resume timer
//         console.log(`Resuming timer with ${remaining} seconds remaining`)
//         handleStartTimer(remaining)
//       } else {
//         // Timer should have completed
//         chrome.storage.local.set({
//           timerRunning: false,
//           focusState: "idle",
//         })
//       }
//     }
//   })

//   // Resume sound if it was playing
//   chrome.storage.local.get(["currentSound", "volume"], (data) => {
//     if (data.currentSound) {
//       console.log(`Resuming sound: ${data.currentSound}`)
//       playSound(data.currentSound, (data.volume || 50) / 100)
//     }
//   })
// })



//new version
// Complete background script with website blocking functionality
// console.log("Background script loaded")

// // Audio player
// let audioPlayer = null

// // Initialize on install
// chrome.runtime.onInstalled.addListener(() => {
//   console.log("Extension installed")

//   // Set default values
//   chrome.storage.local.set({
//     timerRunning: false,
//     timerDuration: 25 * 60,
//     timerRemaining: 25 * 60,
//     focusState: "idle",
//     blockerEnabled: false,
//     blockedWebsites: [],
//     todos: [],
//     focusStats: {},
//     reminders: ["Stay focused!", "You can do it!", "Keep going!"],
//     reminderInterval: 15,
//     currentSound: null,
//     volume: 50,
//   })

//   // Create alarm for reminders
//   chrome.alarms.create("reminderAlarm", { periodInMinutes: 15 })

//   // Send a test notification on install
//   sendNotificationToAllTabs("Focus Buddy Installed", "Extension has been installed successfully!")
// })

// // Handle messages from popup
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   console.log("Background received message:", message)

//   switch (message.action) {
//     case "startTimer":
//       handleStartTimer(message.duration)
//       break
//     case "pauseTimer":
//       handlePauseTimer()
//       break
//     case "resetTimer":
//       handleResetTimer()
//       break
//     case "playSound":
//       playSound(message.sound, message.volume)
//       break
//     case "stopSound":
//       stopSound()
//       break
//     case "setVolume":
//       setVolume(message.volume)
//       break
//     case "enableBlocker":
//       enableWebsiteBlocker()
//       break
//     case "disableBlocker":
//       disableWebsiteBlocker()
//       break
//     case "updateReminderInterval":
//       updateReminderInterval(message.interval)
//       break
//     case "sendTestNotification":
//       sendNotificationToAllTabs("Test Notification", "This is a test notification from Focus Buddy!")
//       sendResponse({ success: true })
//       break
//   }

//   return true // Keep the message channel open for async responses
// })

// // WEBSITE BLOCKING FUNCTIONALITY
// function enableWebsiteBlocker() {
//   console.log("Website blocker enabled")
//   chrome.storage.local.set({ blockerEnabled: true })
// }

// function disableWebsiteBlocker() {
//   console.log("Website blocker disabled")
//   chrome.storage.local.set({ blockerEnabled: false })
// }

// // Listen for tab updates to check for blocked websites
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   // Only check when the page is loading or complete
//   if (changeInfo.status === "loading" || changeInfo.status === "complete") {
//     checkAndBlockWebsite(tabId, tab.url)
//   }
// })

// // Listen for new tab creation
// chrome.tabs.onCreated.addListener((tab) => {
//   if (tab.url) {
//     checkAndBlockWebsite(tab.id, tab.url)
//   }
// })

// // Function to check if a website should be blocked
// function checkAndBlockWebsite(tabId, url) {
//   if (!url) return

//   chrome.storage.local.get(["blockerEnabled", "blockedWebsites"], (data) => {
//     if (!data.blockerEnabled) {
//       console.log("Blocker is disabled, allowing access")
//       return
//     }

//     const blockedWebsites = data.blockedWebsites || []
//     const currentUrl = url.toLowerCase()

//     // Check if current URL contains any blocked website
//     const isBlocked = blockedWebsites.some((blockedSite) => {
//       const cleanBlockedSite = blockedSite
//         .toLowerCase()
//         .replace(/^https?:\/\//, "")
//         .replace(/^www\./, "")
//       const cleanCurrentUrl = currentUrl.replace(/^https?:\/\//, "").replace(/^www\./, "")

//       return cleanCurrentUrl.includes(cleanBlockedSite)
//     })

//     if (isBlocked) {
//       console.log(`Blocking access to: ${url}`)

//       // Redirect to blocked page
//       const blockedPageUrl = chrome.runtime.getURL("blocked.html")
//       chrome.tabs.update(tabId, { url: blockedPageUrl })

//       // Show notification
//       sendNotificationToAllTabs("Website Blocked", "This website has been blocked to help you stay focused!")
//     }
//   })
// }

// // Timer handling
// let timerInterval = null

// function handleStartTimer(duration) {
//   console.log(`Starting timer for ${duration} seconds`)

//   const endTime = Date.now() + duration * 1000

//   chrome.storage.local.set({
//     timerRunning: true,
//     timerEndTime: endTime,
//     focusState: "focused",
//   })

//   if (timerInterval) {
//     clearInterval(timerInterval)
//   }

//   timerInterval = setInterval(() => {
//     const now = Date.now()
//     const remaining = Math.max(0, Math.floor((endTime - now) / 1000))

//     chrome.storage.local.set({ timerRemaining: remaining })

//     if (remaining <= 0) {
//       handleTimerComplete()
//     }
//   }, 1000)
// }

// function handlePauseTimer() {
//   console.log("Pausing timer")

//   if (timerInterval) {
//     clearInterval(timerInterval)
//     timerInterval = null
//   }

//   chrome.storage.local.set({
//     timerRunning: false,
//     focusState: "distracted",
//   })
// }

// function handleResetTimer() {
//   console.log("Resetting timer")

//   if (timerInterval) {
//     clearInterval(timerInterval)
//     timerInterval = null
//   }

//   chrome.storage.local.get(["timerDuration"], (data) => {
//     chrome.storage.local.set({
//       timerRunning: false,
//       timerRemaining: data.timerDuration,
//       focusState: "idle",
//     })
//   })
// }

// function handleTimerComplete() {
//   console.log("Timer complete")

//   if (timerInterval) {
//     clearInterval(timerInterval)
//     timerInterval = null
//   }

//   chrome.storage.local.set({
//     timerRunning: false,
//     focusState: "idle",
//   })

//   // Update focus stats
//   updateFocusStats()

//   // Show notification
//   sendNotificationToAllTabs("Focus Timer Complete", "Great job! Your focus session is complete.")
// }

// function updateFocusStats() {
//   const today = new Date().toISOString().split("T")[0]

//   chrome.storage.local.get(["timerDuration", "focusStats"], (data) => {
//     const stats = data.focusStats || {}
//     const duration = data.timerDuration / 3600 // Convert seconds to hours

//     if (!stats[today]) {
//       stats[today] = 0
//     }

//     stats[today] += duration

//     chrome.storage.local.set({ focusStats: stats })
//   })
// }

// // Sound handling
// function playSound(sound, volume) {
//   console.log(`Playing sound: ${sound} at volume: ${volume}`)

//   stopSound()

//   try {
//     audioPlayer = new Audio(chrome.runtime.getURL(`sounds/${sound}.mp3`))
//     audioPlayer.loop = true
//     audioPlayer.volume = volume || 0.5

//     const playPromise = audioPlayer.play()

//     if (playPromise !== undefined) {
//       playPromise
//         .then(() => {
//           console.log(`Sound ${sound} playing successfully`)
//           chrome.storage.local.set({ currentSound: sound })
//         })
//         .catch((err) => {
//           console.error("Error playing audio:", err)
//         })
//     }
//   } catch (err) {
//     console.error("Error creating audio:", err)
//   }
// }

// function stopSound() {
//   if (audioPlayer) {
//     try {
//       audioPlayer.pause()
//       audioPlayer = null
//       chrome.storage.local.set({ currentSound: null })
//     } catch (err) {
//       console.error("Error stopping sound:", err)
//     }
//   }
// }

// function setVolume(volume) {
//   if (audioPlayer) {
//     try {
//       audioPlayer.volume = volume
//     } catch (err) {
//       console.error("Error setting volume:", err)
//     }
//   }
// }

// // Reminder handling
// function updateReminderInterval(interval) {
//   console.log(`Updating reminder interval to ${interval} minutes`)

//   chrome.alarms.clear("reminderAlarm", () => {
//     chrome.alarms.create("reminderAlarm", {
//       periodInMinutes: interval,
//     })
//   })
// }

// chrome.alarms.onAlarm.addListener((alarm) => {
//   console.log(`Alarm fired: ${alarm.name}`)

//   if (alarm.name === "reminderAlarm") {
//     showRandomReminder()
//   }
// })

// function showRandomReminder() {
//   chrome.storage.local.get(["reminders", "timerRunning"], (data) => {
//     if (!data.timerRunning) {
//       console.log("Timer not running, skipping reminder")
//       return
//     }

//     const reminders = data.reminders || []

//     if (reminders.length > 0) {
//       const randomIndex = Math.floor(Math.random() * reminders.length)
//       const reminder = reminders[randomIndex]

//       console.log(`Showing reminder: ${reminder}`)
//       sendNotificationToAllTabs("Focus Reminder", reminder)
//     }
//   })
// }

// // Function to send notifications via content script
// function sendNotificationToAllTabs(title, message) {
//   console.log(`Sending notification to all tabs: ${title} - ${message}`)

//   // First try using Chrome's notification API
//   chrome.notifications.create(
//     {
//       type: "basic",
//       iconUrl: "images/icon.png",
//       title: title,
//       message: message,
//       priority: 2,
//     },
//     (notificationId) => {
//       if (chrome.runtime.lastError) {
//         console.error("Chrome notification error:", chrome.runtime.lastError)

//         // Fallback to content script notifications
//         chrome.tabs.query({}, (tabs) => {
//           console.log(`Found ${tabs.length} tabs to send notifications to`)

//           if (tabs.length > 0) {
//             // Send to the first active tab
//             for (const tab of tabs) {
//               if (tab.active) {
//                 console.log(`Sending notification to active tab ${tab.id}`)
//                 chrome.tabs
//                   .sendMessage(tab.id, {
//                     action: "showNotification",
//                     title: title,
//                     message: message,
//                   })
//                   .catch((err) => {
//                     console.error(`Error sending message to tab ${tab.id}:`, err)
//                   })
//                 return
//               }
//             }

//             // If no active tab, send to the first tab
//             console.log(`Sending notification to first tab ${tabs[0].id}`)
//             chrome.tabs
//               .sendMessage(tabs[0].id, {
//                 action: "showNotification",
//                 title: title,
//                 message: message,
//               })
//               .catch((err) => {
//                 console.error(`Error sending message to tab ${tabs[0].id}:`, err)
//               })
//           }
//         })
//       } else {
//         console.log(`Chrome notification created with ID: ${notificationId}`)
//       }
//     },
//   )
// }

// // Check timer status when browser starts
// chrome.runtime.onStartup.addListener(() => {
//   console.log("Extension starting up")

//   chrome.storage.local.get(["timerRunning", "timerEndTime"], (data) => {
//     if (data.timerRunning && data.timerEndTime) {
//       const remaining = Math.max(0, Math.floor((data.timerEndTime - Date.now()) / 1000))

//       if (remaining > 0) {
//         // Resume timer
//         console.log(`Resuming timer with ${remaining} seconds remaining`)
//         handleStartTimer(remaining)
//       } else {
//         // Timer should have completed
//         chrome.storage.local.set({
//           timerRunning: false,
//           focusState: "idle",
//         })
//       }
//     }
//   })

//   // Resume sound if it was playing
//   chrome.storage.local.get(["currentSound", "volume"], (data) => {
//     if (data.currentSound) {
//       console.log(`Resuming sound: ${data.currentSound}`)
//       playSound(data.currentSound, (data.volume || 50) / 100)
//     }
//   })
// })

// Complete background script with website blocking functionality
console.log("Background script loaded")

// Audio player
let audioPlayer = null

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed")

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

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message)

  switch (message.action) {
    case "startTimer":
      handleStartTimer(message.duration)
      break
    case "pauseTimer":
      handlePauseTimer()
      break
    case "resetTimer":
      handleResetTimer()
      break
    case "playSound":
      playSound(message.sound, message.volume)
      break
    case "stopSound":
      stopSound()
      break
    case "setVolume":
      setVolume(message.volume)
      break
    case "enableBlocker":
      enableWebsiteBlocker()
      break
    case "disableBlocker":
      disableWebsiteBlocker()
      break
    case "updateReminderInterval":
      updateReminderInterval(message.interval)
      break
    case "sendTestNotification":
      sendNotificationToAllTabs("Test Notification", "This is a test notification from Focus Buddy!")
      sendResponse({ success: true })
      break
  }

  return true // Keep the message channel open for async responses
})

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
  // Only check when the page is loading or complete
  if (changeInfo.status === "loading" || changeInfo.status === "complete") {
    checkAndBlockWebsite(tabId, tab.url)
  }
})

// Listen for new tab creation
chrome.tabs.onCreated.addListener((tab) => {
  if (tab.url) {
    checkAndBlockWebsite(tab.id, tab.url)
  }
})

// Function to check if a website should be blocked
function checkAndBlockWebsite(tabId, url) {
  if (!url) return

  chrome.storage.local.get(["blockerEnabled", "blockedWebsites"], (data) => {
    if (!data.blockerEnabled) {
      console.log("Blocker is disabled, allowing access")
      return
    }

    const blockedWebsites = data.blockedWebsites || []
    const currentUrl = url.toLowerCase()

    // Check if current URL contains any blocked website
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

      // Redirect to blocked page
      const blockedPageUrl = chrome.runtime.getURL("blocked.html")
      chrome.tabs.update(tabId, { url: blockedPageUrl })

      // Show notification
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

  // Update focus stats with proper data
  chrome.storage.local.get(["timerDuration", "focusStats"], (data) => {
    const stats = data.focusStats || {}
    const duration = data.timerDuration || 1500 // Default 25 minutes
    const hours = duration / 3600 // Convert seconds to hours
    const today = new Date().toISOString().split("T")[0]

    console.log(`Adding ${hours.toFixed(2)} hours to focus stats for ${today}`)

    if (!stats[today]) {
      stats[today] = 0
    }

    stats[today] += hours

    chrome.storage.local.set({ focusStats: stats }, () => {
      console.log("Focus stats updated:", stats)
      // Show notification
      sendNotificationToAllTabs(
        "Focus Timer Complete",
        `Great job! You focused for ${(duration / 60).toFixed(0)} minutes. Total today: ${stats[today].toFixed(1)} hours.`,
      )
    })
  })
}

// Sound handling
function playSound(sound, volume) {
  console.log(`Playing sound: ${sound} at volume: ${volume}`)

  stopSound()

  try {
    audioPlayer = new Audio(chrome.runtime.getURL(`sounds/${sound}.mp3`))
    audioPlayer.loop = true
    audioPlayer.volume = volume || 0.5

    const playPromise = audioPlayer.play()

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log(`Sound ${sound} playing successfully`)
          chrome.storage.local.set({ currentSound: sound })
        })
        .catch((err) => {
          console.error("Error playing audio:", err)
        })
    }
  } catch (err) {
    console.error("Error creating audio:", err)
  }
}

function stopSound() {
  if (audioPlayer) {
    try {
      audioPlayer.pause()
      audioPlayer = null
      chrome.storage.local.set({ currentSound: null })
    } catch (err) {
      console.error("Error stopping sound:", err)
    }
  }
}

function setVolume(volume) {
  if (audioPlayer) {
    try {
      audioPlayer.volume = volume
    } catch (err) {
      console.error("Error setting volume:", err)
    }
  }
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

// Function to send notifications via content script
function sendNotificationToAllTabs(title, message) {
  console.log(`Sending notification to all tabs: ${title} - ${message}`)

  // First try using Chrome's notification API
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

        // Fallback to content script notifications
        chrome.tabs.query({}, (tabs) => {
          console.log(`Found ${tabs.length} tabs to send notifications to`)

          if (tabs.length > 0) {
            // Send to the first active tab
            for (const tab of tabs) {
              if (tab.active) {
                console.log(`Sending notification to active tab ${tab.id}`)
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

            // If no active tab, send to the first tab
            console.log(`Sending notification to first tab ${tabs[0].id}`)
            chrome.tabs
              .sendMessage(tabs[0].id, {
                action: "showNotification",
                title: title,
                message: message,
              })
              .catch((err) => {
                console.error(`Error sending message to tab ${tabs[0].id}:`, err)
              })
          }
        })
      } else {
        console.log(`Chrome notification created with ID: ${notificationId}`)
      }
    },
  )
}

// Check timer status when browser starts
chrome.runtime.onStartup.addListener(() => {
  console.log("Extension starting up")

  chrome.storage.local.get(["timerRunning", "timerEndTime"], (data) => {
    if (data.timerRunning && data.timerEndTime) {
      const remaining = Math.max(0, Math.floor((data.timerEndTime - Date.now()) / 1000))

      if (remaining > 0) {
        // Resume timer
        console.log(`Resuming timer with ${remaining} seconds remaining`)
        handleStartTimer(remaining)
      } else {
        // Timer should have completed
        chrome.storage.local.set({
          timerRunning: false,
          focusState: "idle",
        })
      }
    }
  })

  // Resume sound if it was playing
  chrome.storage.local.get(["currentSound", "volume"], (data) => {
    if (data.currentSound) {
      console.log(`Resuming sound: ${data.currentSound}`)
      playSound(data.currentSound, (data.volume || 50) / 100)
    }
  })
})
