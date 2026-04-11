import * as hmUI from "@zos/ui"
import { px } from "@zos/utils"
import { createTimer, stopTimer } from "@zos/timer"

// Position: bottom-left of 480px round display
var GPS_X = 38
var GPS_Y = 400
var GPS_SIZE = 36
var ICON_SIZE = 22
var ICON_OFFSET = (GPS_SIZE - ICON_SIZE) / 2

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

  // Satellite icon on top
  var iconWidget = hmUI.createWidget(hmUI.widget.IMG, {
    x: px(GPS_X + ICON_OFFSET),
    y: px(GPS_Y + ICON_OFFSET),
    w: px(ICON_SIZE),
    h: px(ICON_SIZE),
    src: 'icon_satellite.png',
    auto_scale: true,
  })

  // Blink timer
  var blinkOn = false
  var timerId = createTimer(500, 500, function () {
    try {
      var gpsFixed = getApp().globalData.gpsFixed === true
      if (gpsFixed) {
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
