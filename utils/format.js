/**
 * Format milliseconds to MM:SS string
 * @param {number} ms - milliseconds
 * @returns {string} "MM:SS"
 */
export function formatTime(ms) {
  var totalSec = Math.floor(ms / 1000)
  var min = Math.floor(totalSec / 60)
  var sec = totalSec % 60
  return String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0')
}

/**
 * Format milliseconds to HH:MM:SS string
 * @param {number} ms - milliseconds
 * @returns {string} "HH:MM:SS"
 */
export function formatTimeLong(ms) {
  var totalSec = Math.floor(ms / 1000)
  var hrs = Math.floor(totalSec / 3600)
  var min = Math.floor((totalSec % 3600) / 60)
  var sec = totalSec % 60
  return String(hrs).padStart(2, '0') + ':' + String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0')
}

/**
 * Format pace from seconds per km to "M:SS /km" string
 * @param {number} secPerKm - seconds per kilometer
 * @returns {string} "M:SS /km"
 */
export function formatPace(secPerKm) {
  if (!secPerKm || secPerKm <= 0 || secPerKm > 3600) return '--:-- /km'
  var min = Math.floor(secPerKm / 60)
  var sec = Math.round(secPerKm % 60)
  return min + ':' + String(sec).padStart(2, '0') + ' /km'
}

/**
 * Format distance in meters to readable string
 * @param {number} meters
 * @returns {string} "X.XX km" or "X m"
 */
export function formatDistance(meters) {
  if (!meters || meters < 0) return '0 m'
  if (meters < 1000) return Math.round(meters) + ' m'
  return (meters / 1000).toFixed(2) + ' km'
}

/**
 * Format heart rate
 * @param {number} bpm
 * @returns {string} "XXX bpm"
 */
export function formatHR(bpm) {
  if (!bpm || bpm <= 0) return '-- bpm'
  return bpm + ' bpm'
}

/**
 * Calculate distance between two GPS points using Haversine formula
 * @param {number} lat1 - latitude point 1 (degrees)
 * @param {number} lon1 - longitude point 1 (degrees)
 * @param {number} lat2 - latitude point 2 (degrees)
 * @param {number} lon2 - longitude point 2 (degrees)
 * @returns {number} distance in meters
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  var R = 6371000 // Earth radius in meters
  var dLat = (lat2 - lat1) * Math.PI / 180
  var dLon = (lon2 - lon1) * Math.PI / 180
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Calculate pace from distance delta and time delta
 * @param {number} distanceMeters - distance covered
 * @param {number} timeMs - time taken in milliseconds
 * @returns {number} pace in seconds per km (0 if invalid)
 */
export function calculatePace(distanceMeters, timeMs) {
  if (!distanceMeters || distanceMeters <= 0 || !timeMs || timeMs <= 0) return 0
  var timeSec = timeMs / 1000
  var km = distanceMeters / 1000
  return Math.round(timeSec / km)
}

/**
 * Calculate progress percentage
 * @param {number} current - current value
 * @param {number} target - target value
 * @returns {number} progress 0.0 to 1.0
 */
export function calculateProgress(current, target) {
  if (!target || target <= 0) return 0
  var progress = current / target
  return progress > 1 ? 1 : progress
}

/**
 * Get training type display name
 * @param {string} type - training type constant
 * @returns {string} display name
 */
export function getTrainingTypeName(type) {
  var names = {
    'cardio_continuous': 'Cardio',
    'intervals': 'Intervalos',
    'free': 'Libre',
  }
  return names[type] || type
}
