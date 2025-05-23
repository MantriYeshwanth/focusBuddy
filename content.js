// Content script to handle notifications
console.log("Focus Buddy content script loaded")

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Content script received message:", message)

  if (message.action === "showNotification") {
    showNotification(message.title, message.message)
    sendResponse({ success: true })
  }

  return true // Keep the message channel open for async responses
})

// Function to show notification using the Web Notifications API
function showNotification(title, message) {
  console.log(`Content script showing notification: ${title} - ${message}`)

  // Check if notification permission is granted
  if (Notification.permission === "granted") {
    new Notification(title, {
      body: message,
      icon: chrome.runtime.getURL("images/icon128.png"),
    })
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification(title, {
          body: message,
          icon: chrome.runtime.getURL("images/icon128.png"),
        })
      }
    })
  }
}

// Request notification permission when content script loads
if (Notification.permission !== "granted" && Notification.permission !== "denied") {
  Notification.requestPermission().then((permission) => {
    console.log(`Notification permission: ${permission}`)
  })
}
