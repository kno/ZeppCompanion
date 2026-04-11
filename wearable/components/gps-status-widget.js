import * as hmUI from "@zos/ui"
import { px } from "@zos/utils"
import { getDeviceInfo } from "@zos/device"
import { createTimer, stopTimer } from "@zos/timer"

var GPS_SIZE = 36
var ICON_SIZE = 22
var ICON_OFFSET = (GPS_SIZE - ICON_SIZE) / 2

// Position: left edge, vertically centered on round display
var deviceInfo = getDeviceInfo()
var GPS_X = 8
var GPS_Y = Math.round(deviceInfo.height / 2 - GPS_SIZE / 2)

// Colors
var COLOR_RED = 0xEF5350
var COLOR_GREEN = 0x4CAF50
var COLOR_BLINK_DARK = 0xFFFFFF   // inverse of dark bg (0x000000)
var COLOR_BLINK_LIGHT = 0x111111  // inverse of light bg (0xF5F5F5)

export function createGpsStatusWidget() {
  var app = getApp()
  var prefs = app.globalData.userPreferences
  var isDark = !prefs || prefs.darkMode !== false
  var blinkColor = isDark ? COLOR_BLINK_DARK : COLOR_BLINK_LIGHT

  // Circle background
  var circleBg = hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: px(GPS_X),
    y: px(GPS_Y),
    w: px(GPS_SIZE),
    h: px(GPS_SIZE),
    radius: px(GPS_SIZE / 2),
    color: COLOR_RED,
  })

  // Satellite icon on top (pre-resized to 22x22)
  var iconWidget = hmUI.createWidget(hmUI.widget.IMG, {
    x: px(GPS_X + ICON_OFFSET),
    y: px(GPS_Y + ICON_OFFSET),
    w: px(ICON_SIZE),
    h: px(ICON_SIZE),
    src: 'icon_satellite.png',
  })

  // Blink timer — also polls GPS status since app-level timers don't fire in Zepp OS
  var blinkOn = false
  var timerId = createTimer(500, 500, function () {
    try {
      var appData = getApp().globalData
      // Poll GPS status from the sensor (app-level timers can't do this)
      if (appData.geoSensor) {
        try {
          var status = appData.geoSensor.getStatus()
          var wasFix = appData.gpsFixed
          appData.gpsFixed = (status === 'A')
          if (!wasFix) {
            console.log("[GPS] poll status=" + status + " fixed=" + appData.gpsFixed)
          }
        } catch (e) {
          console.log("[GPS] Poll error: " + e.message)
        }
      } else {
        console.log("[GPS] No geoSensor in globalData")
      }

      if (appData.gpsFixed === true) {
        circleBg.setProperty(hmUI.prop.COLOR, COLOR_GREEN)
        return
      }
      blinkOn = !blinkOn
      circleBg.setProperty(hmUI.prop.COLOR, blinkOn ? COLOR_RED : blinkColor)
    } catch (e) {
      // Widget may have been destroyed
    }
  })

  return {
    destroy: function () {
      if (timerId !== null) {
        stopTimer(timerId)
        timerId = null
      }
    }
  }
}
