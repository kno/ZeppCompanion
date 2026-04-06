import { HeartRate, Geolocation } from '@zos/sensor'
import { createTimer, stopTimer } from '@zos/timer'
import { haversineDistance } from './format'

/**
 * Creates a sensor manager for training sessions
 * @returns {object} sensor manager with start/stop methods
 */
export function createSensorManager() {
  var hrSensor = null
  var geoSensor = null
  var hrCallback = null
  var gpsTimerId = null

  var lastLat = null
  var lastLng = null
  var lastGpsTime = 0
  var totalDistance = 0

  return {
    /**
     * Start heart rate monitoring
     * @param {function} onUpdate - callback(bpm) called on each HR change
     */
    startHR: function (onUpdate) {
      hrSensor = new HeartRate()
      hrCallback = function () {
        var bpm = hrSensor.getCurrent()
        if (bpm > 0 && onUpdate) {
          onUpdate(bpm)
        }
      }
      hrSensor.onCurrentChange(hrCallback)
    },

    /**
     * Start GPS tracking with pace calculation
     * @param {number} intervalMs - polling interval in ms (recommended: 3000)
     * @param {function} onUpdate - callback({ lat, lng, distance, pace }) called on each GPS read
     */
    startGPS: function (intervalMs, onUpdate) {
      geoSensor = new Geolocation()
      geoSensor.start()

      gpsTimerId = createTimer(
        intervalMs,  // delay before first tick
        intervalMs,  // repeat interval
        function () {
          var status = geoSensor.getStatus()
          if (status !== 'A') return  // No GPS fix yet

          var lat = geoSensor.getLatitude()
          var lng = geoSensor.getLongitude()

          if (!lat || !lng) return

          var now = Date.now()
          var deltaDistance = 0
          var pace = 0

          if (lastLat !== null && lastLng !== null) {
            deltaDistance = haversineDistance(lastLat, lastLng, lat, lng)

            // Filter out GPS noise (< 2m movement in 3s is likely noise)
            if (deltaDistance < 2) {
              return
            }

            totalDistance = totalDistance + deltaDistance

            // Calculate instantaneous pace (sec per km)
            var deltaTimeMs = now - lastGpsTime
            if (deltaTimeMs > 0 && deltaDistance > 0) {
              var deltaTimeSec = deltaTimeMs / 1000
              var deltaKm = deltaDistance / 1000
              pace = Math.round(deltaTimeSec / deltaKm)
            }
          }

          lastLat = lat
          lastLng = lng
          lastGpsTime = now

          if (onUpdate) {
            onUpdate({
              lat: lat,
              lng: lng,
              distance: totalDistance,
              pace: pace,
              deltaDistance: deltaDistance,
            })
          }
        }
      )
    },

    /**
     * Get current total distance in meters
     * @returns {number}
     */
    getDistance: function () {
      return totalDistance
    },

    /**
     * Stop all sensors and clean up timers
     * MUST be called in page onDestroy()
     */
    stopAll: function () {
      if (hrSensor && hrCallback) {
        hrSensor.offCurrentChange(hrCallback)
        hrCallback = null
        hrSensor = null
      }

      if (gpsTimerId !== null) {
        stopTimer(gpsTimerId)
        gpsTimerId = null
      }

      if (geoSensor) {
        geoSensor.stop()
        geoSensor = null
      }

      lastLat = null
      lastLng = null
      lastGpsTime = 0
    },

    /**
     * Reset distance counter (useful for interval training)
     */
    resetDistance: function () {
      totalDistance = 0
    },
  }
}
