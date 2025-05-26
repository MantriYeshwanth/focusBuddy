// 


document.addEventListener("DOMContentLoaded", () => {
  loadFocusStats()

  // Refresh stats when summary tab is clicked
  const summaryTab = document.querySelector('[data-tab="summary"]')
  if (summaryTab) {
    summaryTab.addEventListener("click", () => {
      console.log("Summary tab clicked, refreshing stats...")
      setTimeout(loadFocusStats, 100) // Small delay to ensure tab is active
    })
  }

  function loadFocusStats() {
    console.log("Loading focus stats...")

    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["focusStats"], (data) => {
        console.log("Raw focus stats from storage:", data.focusStats)
        const stats = data.focusStats || {}

        // Get last 7 days
        const today = new Date()
        const last7Days = []

        for (let i = 6; i >= 0; i--) {
          const date = new Date(today)
          date.setDate(today.getDate() - i)
          const dateString = date.toISOString().split("T")[0]
          last7Days.push({
            date: dateString,
            label: formatDate(date),
            hours: stats[dateString] || 0,
          })
        }

        console.log("Processed last 7 days data:", last7Days)

        // Update stats display
        updateStatsDisplay(stats, last7Days)

        // Create simple chart
        createSimpleChart(last7Days)
      })
    } else {
      // Handle the case where chrome.storage is not available
      console.warn("Chrome storage API is not available. Running with mock data.")
      const mockStats = {
        "2024-01-01": 1.5,
        "2024-01-02": 2.0,
        "2024-01-03": 0.5,
        "2024-01-04": 3.0,
        "2024-01-05": 1.0,
        "2024-01-06": 2.5,
        "2024-01-07": 1.8,
      }

      const today = new Date()
      const last7Days = []

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(today.getDate() - i)
        const dateString = date.toISOString().split("T")[0]
        last7Days.push({
          date: dateString,
          label: formatDate(date),
          hours: mockStats[dateString] || 0,
        })
      }

      updateStatsDisplay(mockStats, last7Days)
      createSimpleChart(last7Days)
    }
  }

  function updateStatsDisplay(stats, last7Days) {
    const todayHours = document.getElementById("today-hours")
    const weekHours = document.getElementById("week-hours")
    const totalHours = document.getElementById("total-hours")

    // Today's hours
    const today = new Date().toISOString().split("T")[0]
    todayHours.textContent = (stats[today] || 0).toFixed(1)

    // Week's hours
    const weekTotal = last7Days.reduce((sum, day) => sum + day.hours, 0)
    weekHours.textContent = weekTotal.toFixed(1)

    // Total hours
    const allTimeTotal = Object.values(stats).reduce((sum, hours) => sum + hours, 0)
    totalHours.textContent = allTimeTotal.toFixed(1)
  }

  function createSimpleChart(data) {
    const canvas = document.getElementById("focus-chart")
    const ctx = canvas.getContext("2d")

    // Set canvas size
    canvas.width = 350
    canvas.height = 200

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Chart settings
    const padding = 40
    const chartWidth = canvas.width - padding * 2
    const chartHeight = canvas.height - padding * 2
    const barWidth = chartWidth / data.length
    const maxHours = Math.max(...data.map((d) => d.hours), 1) // Minimum 1 to avoid division by zero

    // Draw background
    ctx.fillStyle = "#f8f9fa"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw bars
    data.forEach((day, index) => {
      const barHeight = (day.hours / maxHours) * chartHeight
      const x = padding + index * barWidth + barWidth * 0.1
      const y = padding + chartHeight - barHeight
      const width = barWidth * 0.8

      // Draw bar
      ctx.fillStyle = "#3498db"
      ctx.fillRect(x, y, width, barHeight)

      // Draw bar border
      ctx.strokeStyle = "#2980b9"
      ctx.lineWidth = 1
      ctx.strokeRect(x, y, width, barHeight)

      // Draw day label
      ctx.fillStyle = "#333"
      ctx.font = "12px Arial"
      ctx.textAlign = "center"
      ctx.fillText(day.label, x + width / 2, canvas.height - 10)

      // Draw hours value on top of bar if there's data
      if (day.hours > 0) {
        ctx.fillStyle = "#2c3e50"
        ctx.font = "10px Arial"
        ctx.fillText(day.hours.toFixed(1), x + width / 2, y - 5)
      }
    })

    // Draw Y-axis
    ctx.strokeStyle = "#ddd"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, padding + chartHeight)
    ctx.stroke()

    // Draw X-axis
    ctx.beginPath()
    ctx.moveTo(padding, padding + chartHeight)
    ctx.lineTo(padding + chartWidth, padding + chartHeight)
    ctx.stroke()

    // Draw Y-axis labels
    ctx.fillStyle = "#666"
    ctx.font = "10px Arial"
    ctx.textAlign = "right"
    for (let i = 0; i <= 5; i++) {
      const value = (maxHours / 5) * i
      const y = padding + chartHeight - (chartHeight / 5) * i
      ctx.fillText(value.toFixed(1), padding - 5, y + 3)

      // Draw grid lines
      if (i > 0) {
        ctx.strokeStyle = "#eee"
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.moveTo(padding, y)
        ctx.lineTo(padding + chartWidth, y)
        ctx.stroke()
      }
    }

    // Draw title
    ctx.fillStyle = "#2c3e50"
    ctx.font = "14px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Focus Hours (Last 7 Days)", canvas.width / 2, 20)

    // Draw Y-axis title
    ctx.save()
    ctx.translate(15, canvas.height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.font = "12px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Hours", 0, 0)
    ctx.restore()
  }

  function formatDate(date) {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    return days[date.getDay()]
  }

  // Add a test button to manually add focus data for testing
  function addTestData() {
    const today = new Date().toISOString().split("T")[0]
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["focusStats"], (data) => {
        const stats = data.focusStats || {}
        if (!stats[today]) {
          stats[today] = 0
        }
        stats[today] += 0.5 // Add 30 minutes

        chrome.storage.local.set({ focusStats: stats }, () => {
          console.log("Test data added:", stats)
          loadFocusStats() // Refresh the display
        })
      })
    } else {
      console.warn("Chrome storage API is not available. Cannot add test data.")
    }
  }

  // Add test button (remove this in production)
  const testButton = document.createElement("button")
  testButton.textContent = "Add Test Data"
  testButton.style.margin = "10px"
  testButton.onclick = addTestData
  document.getElementById("summary").appendChild(testButton)
})
