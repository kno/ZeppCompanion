export function formatPace(secPerKm) {
  if (!secPerKm || secPerKm <= 0 || secPerKm > 3600) return "--:-- /km"
  var min = Math.floor(secPerKm / 60)
  var sec = Math.round(secPerKm % 60)
  return min + ":" + String(sec).padStart(2, "0") + " /km"
}

export function formatSpeed(secPerKm) {
  var prefs = getApp().globalData.userPreferences
  if (prefs && prefs.speedUnit === "km_h") {
    if (!secPerKm || secPerKm <= 0 || secPerKm > 3600) return "-- km/h"
    var kmh = 3600 / secPerKm
    return kmh.toFixed(1) + " km/h"
  }
  return formatPace(secPerKm)
}

export function formatSpeedLabel(isGoal) {
  var prefs = getApp().globalData.userPreferences
  if (prefs && prefs.speedUnit === "km_h") {
    return isGoal ? "Velocidad objetivo" : "Velocidad"
  }
  return isGoal ? "Ritmo objetivo" : "Ritmo"
}

export function formatDistance(meters) {
  if (!meters || meters < 0) return "0 m"
  if (meters < 1000) return Math.round(meters) + " m"
  return (meters / 1000).toFixed(2) + " km"
}

export function formatTime(ms) {
  var totalSec = Math.floor(ms / 1000)
  var min = Math.floor(totalSec / 60)
  var sec = totalSec % 60
  return String(min).padStart(2, "0") + ":" + String(sec).padStart(2, "0")
}

export function formatTimeLong(ms) {
  var totalSec = Math.floor(ms / 1000)
  var hrs = Math.floor(totalSec / 3600)
  var min = Math.floor((totalSec % 3600) / 60)
  var sec = totalSec % 60
  return (
    String(hrs).padStart(2, "0") +
    ":" +
    String(min).padStart(2, "0") +
    ":" +
    String(sec).padStart(2, "0")
  )
}

export function formatHR(bpm) {
  if (!bpm || bpm <= 0) return "-- bpm"
  return bpm + " bpm"
}
