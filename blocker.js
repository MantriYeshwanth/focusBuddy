document.addEventListener("DOMContentLoaded", () => {
    const blockUrlInput = document.getElementById("block-url")
    const addBlockButton = document.getElementById("add-block")
    const blockedList = document.getElementById("blocked-list")
    const enableBlockerButton = document.getElementById("enable-blocker")
    const disableBlockerButton = document.getElementById("disable-blocker")
  
    // Load blocked websites
    loadBlockedWebsites()
  
    // Add block button
    addBlockButton.addEventListener("click", () => {
      const url = blockUrlInput.value.trim()
  
      if (url) {
        chrome.storage.local.get(["blockedWebsites"], (data) => {
          const blockedWebsites = data.blockedWebsites || []
  
          // Check if URL already exists
          if (!blockedWebsites.includes(url)) {
            blockedWebsites.push(url)
  
            chrome.storage.local.set({ blockedWebsites: blockedWebsites }, () => {
              blockUrlInput.value = ""
              loadBlockedWebsites()
            })
          } else {
            alert("This website is already blocked.")
          }
        })
      }
    })
  
    // Enable blocker button
    enableBlockerButton.addEventListener("click", () => {
      chrome.storage.local.set({ blockerEnabled: true }, () => {
        enableBlockerButton.disabled = true
        disableBlockerButton.disabled = false
  
        // Notify background script
        chrome.runtime.sendMessage({ action: "enableBlocker" })
      })
    })
  
    // Disable blocker button
    disableBlockerButton.addEventListener("click", () => {
      chrome.storage.local.set({ blockerEnabled: false }, () => {
        enableBlockerButton.disabled = false
        disableBlockerButton.disabled = true
  
        // Notify background script
        chrome.runtime.sendMessage({ action: "disableBlocker" })
      })
    })
  
    // Load blocked websites function
    function loadBlockedWebsites() {
      chrome.storage.local.get(["blockedWebsites"], (data) => {
        const blockedWebsites = data.blockedWebsites || []
  
        blockedList.innerHTML = ""
  
        if (blockedWebsites.length === 0) {
          const li = document.createElement("li")
          li.textContent = "No websites blocked"
          blockedList.appendChild(li)
          return
        }
  
        blockedWebsites.forEach((website, index) => {
          const li = document.createElement("li")
          li.innerHTML = `
            <span>${website}</span>
            <button class="remove-block" data-index="${index}">×</button>
          `
          blockedList.appendChild(li)
        })
  
        // Add event listeners to remove buttons
        document.querySelectorAll(".remove-block").forEach((button) => {
          button.addEventListener("click", function () {
            const index = Number.parseInt(this.getAttribute("data-index"))
  
            chrome.storage.local.get(["blockedWebsites"], (data) => {
              const blockedWebsites = data.blockedWebsites || []
              blockedWebsites.splice(index, 1)
  
              chrome.storage.local.set({ blockedWebsites: blockedWebsites }, () => {
                loadBlockedWebsites()
              })
            })
          })
        })
      })
    }
  
    // Check blocker status
    chrome.storage.local.get(["blockerEnabled"], (data) => {
      if (data.blockerEnabled) {
        enableBlockerButton.disabled = true
        disableBlockerButton.disabled = false
      } else {
        enableBlockerButton.disabled = false
        disableBlockerButton.disabled = true
      }
    })
  })
  