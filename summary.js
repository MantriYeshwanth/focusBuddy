import { Chart } from "@/components/ui/chart"
document.addEventListener("DOMContentLoaded", () => {
  // Load Chart.js from CDN
  const script = document.createElement("script")
  script.src = "https://cdn.jsdelivr.net/npm/chart.js"
  document.head.appendChild(script)

  script.onload = () => {
    loadFocusStats()
  }

  function loadFocusStats() {
    chrome.storage.local.get(["focusStats"], (data) => {
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

      // Update stats display
      updateStatsDisplay(stats, last7Days)

      // Create chart
      createChart(last7Days)
    })
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

  function createChart(data) {
    const ctx = document.getElementById("focus-chart").getContext("2d")

    // Destroy existing chart if it exists
    if (window.focusChart) {
      window.focusChart.destroy()
    }

    window.focusChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.map((day) => day.label),
        datasets: [
          {
            label: "Focus Hours",
            data: data.map((day) => day.hours),
            backgroundColor: "#3498db",
            borderColor: "#2980b9",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Hours",
            },
          },
        },
      },
    })
  }

  function formatDate(date) {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    return days[date.getDay()]
  }
})
