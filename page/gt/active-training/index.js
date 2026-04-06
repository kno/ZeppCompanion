import * as hmUI from "@zos/ui"
import { log as Logger } from "@zos/utils"
import { px } from "@zos/utils"
import { getDeviceInfo } from "@zos/device"
import { replace } from "@zos/router"
import { createTimer, stopTimer } from "@zos/timer"
import { HeartRate, Geolocation } from "@zos/sensor"
import { evaluateLocalRules, getFallbackMessage, getFinishMessage, parseHRZones } from "../../../utils/companion-engine"
import { MASCOT_STATES, REQUEST_TYPES, MESSAGE_FREQUENCY } from "../../../shared/protocol"

var logger = Logger.getLogger("active-training")
var devInfo = getDeviceInfo()
var W = devInfo.width

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------
var COLORS = {
  PRIMARY: 0x4CAF50,
  ACCENT: 0x58D0FF,
  HR_RED: 0xFC6950,
  PACE_BLUE: 0x58D0FF,
  PROGRESS_GREEN: 0x5BE7A9,
  WARNING_YELLOW: 0xFFD54F,
  ERROR_RED: 0xEF5350,
  WHITE: 0xFFFFFF,
  TEXT_SECONDARY: 0x999999,
  TEXT_DIMMED: 0x666666,
  BG_DARK: 0x000000,
  BG_CARD: 0x1A1A1A,
  BG_CARD_HOVER: 0x2A2A2A,
  ARC_BG: 0x333333,
  ARC_FILL: 0x5BE7A9,
}

var FONT = {
  LARGE: 48,
  MEDIUM: 28,
  BODY: 24,
  SMALL: 20,
  TINY: 16,
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
var AT = {
  TIME_X: 0,
  TIME_Y: px(36),
  TIME_W: W,
  TIME_H: px(50),
  TIME_SIZE: px(38),

  ARC_X: px(30),
  ARC_Y: px(70),
  ARC_SIZE: px(420),
  ARC_STROKE: px(8),

  HR_X: 0,
  HR_Y: px(88),
  HR_W: W,
  HR_H: px(52),
  HR_SIZE: px(FONT.LARGE),

  PACE_X: 0,
  PACE_Y: px(150),
  PACE_W: W,
  PACE_H: px(34),
  PACE_SIZE: px(FONT.MEDIUM),

  DIST_X: 0,
  DIST_Y: px(190),
  DIST_W: W,
  DIST_H: px(26),
  DIST_SIZE: px(FONT.SMALL),

  MASCOT_CX: W / 2,
  MASCOT_CY: px(232),
  MASCOT_R: px(52),

  MASCOT_LABEL_X: 0,
  MASCOT_LABEL_Y: px(218),
  MASCOT_LABEL_W: W,
  MASCOT_LABEL_H: px(28),

  MSG_X: px(40),
  MSG_Y: px(295),
  MSG_W: px(400),
  MSG_H: px(65),
  MSG_SIZE: px(FONT.SMALL),

  BLE_X: 0,
  BLE_Y: px(4),
  BLE_W: W,
  BLE_H: px(18),
  BLE_SIZE: px(14),

  BTN_Y: px(383),
  BTN_H: px(58),
  BTN_RADIUS: px(29),
  PAUSE_X: px(58),
  PAUSE_W: px(162),
  STOP_X: px(260),
  STOP_W: px(162),
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------
function formatTime(ms) {
  var totalSec = Math.floor(ms / 1000)
  var min = Math.floor(totalSec / 60)
  var sec = totalSec % 60
  return String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0')
}

function formatPace(secPerKm) {
  if (!secPerKm || secPerKm <= 0 || secPerKm > 3600) return '--:-- /km'
  var min = Math.floor(secPerKm / 60)
  var sec = Math.round(secPerKm % 60)
  return min + ':' + String(sec).padStart(2, '0') + ' /km'
}

function formatHR(bpm) {
  if (!bpm || bpm <= 0) return '-- bpm'
  return bpm + ' bpm'
}

function calculateProgress(current, target) {
  if (!target || target <= 0) return 0
  var p = current / target
  return p > 1 ? 1 : p
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  var R = 6371000
  var dLat = (lat2 - lat1) * Math.PI / 180
  var dLon = (lon2 - lon1) * Math.PI / 180
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// ---------------------------------------------------------------------------
// Page state (module-level to avoid `this` issues in callbacks)
// ---------------------------------------------------------------------------
var state = {
  uiTimerId: null,
  companionTimerId: null,
  syncTimerId: null,

  timeWidget: null,
  hrWidget: null,
  paceWidget: null,
  distWidget: null,
  progressArcWidget: null,
  messageWidget: null,
  disconnectWidget: null,
  mascotWidget: null,
  pauseBtnWidget: null,

  hrSensor: null,
  hrCallback: null,
  geoSensor: null,
  gpsTimerId: null,

  training: null,
  session: null,
  hrZones: null,

  hrReadingsAll: [],
  maxHR: 0,
  paused: false,

  lastLat: null,
  lastLng: null,
  lastGpsTime: 0,
  totalDistance: 0,
}

// ---------------------------------------------------------------------------
// Sensor management
// ---------------------------------------------------------------------------
function startSensors() {
  // Heart rate
  state.hrSensor = new HeartRate()
  state.hrCallback = function () {
    if (state.paused) return
    var bpm = state.hrSensor.getCurrent()
    if (bpm <= 0) return

    var session = state.session
    session.currentHR = bpm

    state.hrReadingsAll.push(bpm)
    if (bpm > state.maxHR) {
      state.maxHR = bpm
    }

    if (session.hrReadings.length >= 60) {
      session.hrReadings.shift()
    }
    session.hrReadings.push(bpm)

    if (state.hrWidget) {
      state.hrWidget.setProperty(hmUI.prop.TEXT, formatHR(bpm))
    }
  }
  state.hrSensor.onCurrentChange(state.hrCallback)

  // GPS
  state.geoSensor = new Geolocation()
  state.geoSensor.start()

  state.gpsTimerId = createTimer(3000, 3000, function () {
    if (state.paused) return
    var geoStatus = state.geoSensor.getStatus()
    if (geoStatus !== 'A') return

    var lat = state.geoSensor.getLatitude()
    var lng = state.geoSensor.getLongitude()
    if (!lat || !lng) return

    var now = Date.now()
    var deltaDistance = 0
    var pace = 0

    if (state.lastLat !== null && state.lastLng !== null) {
      deltaDistance = haversineDistance(state.lastLat, state.lastLng, lat, lng)
      if (deltaDistance < 2) return

      state.totalDistance = state.totalDistance + deltaDistance

      var deltaTimeMs = now - state.lastGpsTime
      if (deltaTimeMs > 0 && deltaDistance > 0) {
        var deltaTimeSec = deltaTimeMs / 1000
        var deltaKm = deltaDistance / 1000
        pace = Math.round(deltaTimeSec / deltaKm)
      }
    }

    state.lastLat = lat
    state.lastLng = lng
    state.lastGpsTime = now

    var session = state.session
    session.distanceMeters = state.totalDistance

    if (pace > 0) {
      session.currentPace = pace
      if (state.paceWidget) {
        state.paceWidget.setProperty(hmUI.prop.TEXT, formatPace(pace))
      }
    }

    session.lastGpsLat = lat
    session.lastGpsLng = lng
    session.lastGpsTimestamp = now

    if (state.distWidget) {
      var km = (state.totalDistance / 1000).toFixed(2)
      state.distWidget.setProperty(hmUI.prop.TEXT, km + ' km')
    }
  })
}

// ---------------------------------------------------------------------------
// Timer management
// ---------------------------------------------------------------------------
function startTimers() {
  // UI refresh: 1 second
  state.uiTimerId = createTimer(1000, 1000, function () {
    if (state.paused) return

    var session = state.session
    var training = state.training

    session.elapsedMs = Date.now() - session.startTimestamp

    if (state.timeWidget) {
      state.timeWidget.setProperty(hmUI.prop.TEXT, formatTime(session.elapsedMs))
    }

    if (training && training.durationMinutes) {
      var targetMs = training.durationMinutes * 60 * 1000
      session.percentComplete = calculateProgress(session.elapsedMs, targetMs)

      if (state.progressArcWidget) {
        var endAngle = -90 + (session.percentComplete * 360)
        if (endAngle > 270) endAngle = 270
        state.progressArcWidget.setProperty(hmUI.prop.MORE, {
          end_angle: endAngle,
        })
      }

      if (session.percentComplete >= 1.0 && session.status === 'running') {
        finishTraining()
      }
    }
  })

  // Companion evaluation timer
  var app = getApp()
  var freqMs = ((app.globalData.userPreferences && app.globalData.userPreferences.messageFrequency) || 90) * 1000
  state.companionTimerId = createTimer(freqMs, freqMs, function () {
    if (state.paused) return
    evaluateCompanion()
  })

  // Backend sync: every 30 seconds
  state.syncTimerId = createTimer(30000, 30000, function () {
    if (state.paused) return
    syncToBackend()
  })
}

// ---------------------------------------------------------------------------
// Companion logic
// ---------------------------------------------------------------------------
function evaluateCompanion() {
  var session = state.session
  var training = state.training

  var trainingConfig = {
    paceGoalSecPerKm: training.paceGoalSecPerKm || 0,
    hrZoneMin: state.hrZones ? state.hrZones.hrZoneMin : 0,
    hrZoneMax: state.hrZones ? state.hrZones.hrZoneMax : 180,
  }

  var localResult = evaluateLocalRules(session, trainingConfig)
  if (localResult) {
    showCompanionMessage(localResult)
    return
  }

  // Fallback: motivational message
  showCompanionMessage(getFallbackMessage())
}

function showCompanionMessage(result) {
  if (!result || !result.message) return

  var session = state.session
  session.lastCompanionMsg = result.message
  session.lastCompanionTime = Date.now()

  if (state.messageWidget) {
    state.messageWidget.setProperty(hmUI.prop.TEXT, result.message)
  }

  if (state.mascotWidget) {
    var mascotColor = COLORS.PRIMARY
    if (result.mascotState === MASCOT_STATES.TALKING) {
      mascotColor = COLORS.ACCENT
    } else if (result.mascotState === MASCOT_STATES.CELEBRATING) {
      mascotColor = COLORS.PROGRESS_GREEN
    } else if (result.mascotState === MASCOT_STATES.WORRIED) {
      mascotColor = COLORS.ERROR_RED
    }
    state.mascotWidget.setProperty(hmUI.prop.MORE, { color: mascotColor })
  }
}

// ---------------------------------------------------------------------------
// Backend sync (fire-and-forget, BLE drops are silent)
// ---------------------------------------------------------------------------
function syncToBackend() {
  // No-op in device page — BasePage.request() not available here.
  // Sync is handled via app-side when BLE is connected.
}

// ---------------------------------------------------------------------------
// Pause / resume
// ---------------------------------------------------------------------------
function togglePause() {
  state.paused = !state.paused
  var session = state.session

  if (state.paused) {
    session.status = 'paused'
    if (state.messageWidget) {
      state.messageWidget.setProperty(hmUI.prop.TEXT, 'Pausado')
    }
    if (state.mascotWidget) {
      state.mascotWidget.setProperty(hmUI.prop.MORE, { color: COLORS.TEXT_DIMMED })
    }
    if (state.pauseBtnWidget) {
      state.pauseBtnWidget.setProperty(hmUI.prop.TEXT, 'Reanudar')
    }
  } else {
    session.status = 'running'
    session.startTimestamp = Date.now() - session.elapsedMs
    if (state.messageWidget) {
      state.messageWidget.setProperty(hmUI.prop.TEXT, 'Continuamos!')
    }
    if (state.mascotWidget) {
      state.mascotWidget.setProperty(hmUI.prop.MORE, { color: COLORS.PRIMARY })
    }
    if (state.pauseBtnWidget) {
      state.pauseBtnWidget.setProperty(hmUI.prop.TEXT, 'Pausa')
    }
  }
}

// ---------------------------------------------------------------------------
// Finish training
// ---------------------------------------------------------------------------
function finishTraining() {
  var session = state.session
  if (session.status === 'finished') return

  session.status = 'finished'
  session.elapsedMs = Date.now() - session.startTimestamp

  var avgHR = 0
  var readings = state.hrReadingsAll
  if (readings.length > 0) {
    var sum = 0
    for (var i = 0; i < readings.length; i++) {
      sum = sum + readings[i]
    }
    avgHR = Math.round(sum / readings.length)
  }

  session.avgHR = avgHR
  session.maxHR = state.maxHR

  cleanup()

  var finishResult = getFinishMessage()
  showCompanionMessage(finishResult)

  var app = getApp()
  app.globalData.trainingSession = session

  var navTimerId = createTimer(2000, 0, function () {
    stopTimer(navTimerId)
    replace({ url: 'page/gt/training-summary/index' })
  })
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------
function cleanup() {
  if (state.hrSensor && state.hrCallback) {
    state.hrSensor.offCurrentChange(state.hrCallback)
    state.hrCallback = null
    state.hrSensor = null
  }

  if (state.gpsTimerId !== null) {
    stopTimer(state.gpsTimerId)
    state.gpsTimerId = null
  }

  if (state.geoSensor) {
    state.geoSensor.stop()
    state.geoSensor = null
  }

  if (state.uiTimerId !== null) {
    stopTimer(state.uiTimerId)
    state.uiTimerId = null
  }

  if (state.companionTimerId !== null) {
    stopTimer(state.companionTimerId)
    state.companionTimerId = null
  }

  if (state.syncTimerId !== null) {
    stopTimer(state.syncTimerId)
    state.syncTimerId = null
  }
}

// ---------------------------------------------------------------------------
// UI construction
// ---------------------------------------------------------------------------
function buildUI(training, session) {
  // Black background
  hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: 0,
    y: 0,
    w: W,
    h: W,
    color: COLORS.BG_DARK,
  })

  // BLE disconnect banner (empty = invisible)
  state.disconnectWidget = hmUI.createWidget(hmUI.widget.TEXT, {
    x: AT.BLE_X,
    y: AT.BLE_Y,
    w: AT.BLE_W,
    h: AT.BLE_H,
    text: '',
    text_size: AT.BLE_SIZE,
    color: COLORS.ERROR_RED,
    align_h: hmUI.align.CENTER_H,
  })

  // Training name (small, top, dimmed)
  hmUI.createWidget(hmUI.widget.TEXT, {
    x: 0,
    y: AT.TIME_Y - px(4),
    w: W,
    h: px(18),
    text: training.name || 'Entrenamiento',
    text_size: px(14),
    color: COLORS.TEXT_DIMMED,
    align_h: hmUI.align.CENTER_H,
  })

  // Elapsed time
  state.timeWidget = hmUI.createWidget(hmUI.widget.TEXT, {
    x: AT.TIME_X,
    y: AT.TIME_Y + px(18),
    w: AT.TIME_W,
    h: AT.TIME_H,
    text: '00:00',
    text_size: AT.TIME_SIZE,
    color: COLORS.WHITE,
    align_h: hmUI.align.CENTER_H,
  })

  // Progress arc background track
  hmUI.createWidget(hmUI.widget.ARC, {
    x: AT.ARC_X,
    y: AT.ARC_Y,
    w: AT.ARC_SIZE,
    h: AT.ARC_SIZE,
    start_angle: -90,
    end_angle: 270,
    color: COLORS.ARC_BG,
    line_width: AT.ARC_STROKE,
  })

  // Progress arc fill
  state.progressArcWidget = hmUI.createWidget(hmUI.widget.ARC, {
    x: AT.ARC_X,
    y: AT.ARC_Y,
    w: AT.ARC_SIZE,
    h: AT.ARC_SIZE,
    start_angle: -90,
    end_angle: -90,
    color: COLORS.ARC_FILL,
    line_width: AT.ARC_STROKE,
  })

  // Heart rate
  state.hrWidget = hmUI.createWidget(hmUI.widget.TEXT, {
    x: AT.HR_X,
    y: AT.HR_Y,
    w: AT.HR_W,
    h: AT.HR_H,
    text: '-- bpm',
    text_size: AT.HR_SIZE,
    color: COLORS.HR_RED,
    align_h: hmUI.align.CENTER_H,
  })

  // Pace
  state.paceWidget = hmUI.createWidget(hmUI.widget.TEXT, {
    x: AT.PACE_X,
    y: AT.PACE_Y,
    w: AT.PACE_W,
    h: AT.PACE_H,
    text: '--:-- /km',
    text_size: AT.PACE_SIZE,
    color: COLORS.PACE_BLUE,
    align_h: hmUI.align.CENTER_H,
  })

  // Distance
  state.distWidget = hmUI.createWidget(hmUI.widget.TEXT, {
    x: AT.DIST_X,
    y: AT.DIST_Y,
    w: AT.DIST_W,
    h: AT.DIST_H,
    text: '0.00 km',
    text_size: AT.DIST_SIZE,
    color: COLORS.TEXT_SECONDARY,
    align_h: hmUI.align.CENTER_H,
  })

  // Mascot placeholder circle
  state.mascotWidget = hmUI.createWidget(hmUI.widget.CIRCLE, {
    center_x: AT.MASCOT_CX,
    center_y: AT.MASCOT_CY,
    radius: AT.MASCOT_R,
    color: COLORS.PRIMARY,
  })

  // Mascot inner label
  hmUI.createWidget(hmUI.widget.TEXT, {
    x: AT.MASCOT_LABEL_X,
    y: AT.MASCOT_LABEL_Y,
    w: AT.MASCOT_LABEL_W,
    h: AT.MASCOT_LABEL_H,
    text: 'ZEEP',
    text_size: px(FONT.BODY),
    color: COLORS.WHITE,
    align_h: hmUI.align.CENTER_H,
  })

  // Companion message
  state.messageWidget = hmUI.createWidget(hmUI.widget.TEXT, {
    x: AT.MSG_X,
    y: AT.MSG_Y,
    w: AT.MSG_W,
    h: AT.MSG_H,
    text: 'Vamos, comienza tu entrenamiento!',
    text_size: AT.MSG_SIZE,
    color: COLORS.WARNING_YELLOW,
    align_h: hmUI.align.CENTER_H,
    text_style: hmUI.text_style.WRAP,
  })

  // Pause button
  state.pauseBtnWidget = hmUI.createWidget(hmUI.widget.BUTTON, {
    x: AT.PAUSE_X,
    y: AT.BTN_Y,
    w: AT.PAUSE_W,
    h: AT.BTN_H,
    text: 'Pausa',
    text_size: px(FONT.SMALL),
    radius: AT.BTN_RADIUS,
    normal_color: COLORS.BG_CARD,
    press_color: COLORS.BG_CARD_HOVER,
    click_func: function () {
      togglePause()
    },
  })

  // Finish button
  hmUI.createWidget(hmUI.widget.BUTTON, {
    x: AT.STOP_X,
    y: AT.BTN_Y,
    w: AT.STOP_W,
    h: AT.BTN_H,
    text: 'Terminar',
    text_size: px(FONT.SMALL),
    radius: AT.BTN_RADIUS,
    normal_color: COLORS.ERROR_RED,
    press_color: 0xC62828,
    click_func: function () {
      finishTraining()
    },
  })
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
Page({
  onInit: function () {
    logger.debug("active-training onInit")

    // Reset module state for clean start
    state.uiTimerId = null
    state.companionTimerId = null
    state.syncTimerId = null
    state.timeWidget = null
    state.hrWidget = null
    state.paceWidget = null
    state.distWidget = null
    state.progressArcWidget = null
    state.messageWidget = null
    state.disconnectWidget = null
    state.mascotWidget = null
    state.pauseBtnWidget = null
    state.hrSensor = null
    state.hrCallback = null
    state.geoSensor = null
    state.gpsTimerId = null
    state.hrReadingsAll = []
    state.maxHR = 0
    state.paused = false
    state.lastLat = null
    state.lastLng = null
    state.lastGpsTime = 0
    state.totalDistance = 0

    var app = getApp()
    state.training = app.globalData.currentTraining
    state.session = app.globalData.trainingSession

    if (state.training) {
      state.hrZones = parseHRZones(state.training)
    }
  },

  build: function () {
    logger.debug("active-training build START")

    var session = state.session
    var training = state.training

    if (!session || !training) {
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: px(200),
        w: W,
        h: px(40),
        text: 'Error: sin sesion activa',
        text_size: px(FONT.BODY),
        color: COLORS.ERROR_RED,
        align_h: hmUI.align.CENTER_H,
      })
      return
    }

    buildUI(training, session)
    startSensors()
    startTimers()

    logger.debug("active-training build DONE")
  },

  onDestroy: function () {
    logger.debug("active-training onDestroy")
    cleanup()
  },
})
