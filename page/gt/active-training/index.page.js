import * as hmUI from "@zos/ui"
import { log as Logger } from "@zos/utils"
import { px } from "@zos/utils"
import { getDeviceInfo } from "@zos/device"
import { replace } from "@zos/router"
import { createTimer, stopTimer } from "@zos/timer"
import { HeartRate, Geolocation } from "@zos/sensor"
import { evaluateLocalRules, getFallbackMessage, getFinishMessage, parseHRZones } from "../../../utils/companion-engine"
import { MASCOT_STATES } from "../../../shared/protocol"

var logger = Logger.getLogger("active-training")
const { width: W } = getDeviceInfo()

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
  // Timer is the hero metric
  TIME_Y: px(30),
  TIME_SIZE: px(42),

  // Progress arc around the edge
  ARC_X: px(10),
  ARC_Y: px(10),
  ARC_SIZE: px(460),
  ARC_STROKE: px(6),

  // HR prominent but not huge
  HR_Y: px(90),
  HR_SIZE: px(FONT.MEDIUM),

  // Pace and distance side by side
  PACE_X: px(30),
  PACE_Y: px(135),
  PACE_W: px(200),

  DIST_X: px(250),
  DIST_Y: px(135),
  DIST_W: px(200),

  STAT_H: px(24),
  STAT_SIZE: px(FONT.SMALL),
  LABEL_SIZE: px(14),

  // Mascot image (150x98)
  MASCOT_X: (W - px(150)) / 2,
  MASCOT_Y: px(178),
  MASCOT_W: px(150),
  MASCOT_H: px(98),

  // Companion message
  MSG_X: px(60),
  MSG_Y: px(280),
  MSG_W: px(360),
  MSG_H: px(45),
  MSG_SIZE: px(FONT.TINY),

  // Buttons (must fit within round screen at this y)
  BTN_Y: px(335),
  BTN_H: px(46),
  BTN_RADIUS: px(23),
  PAUSE_X: px(80),
  PAUSE_W: px(140),
  STOP_X: px(260),
  STOP_W: px(140),
}

// ---------------------------------------------------------------------------
// Mascot animation frames
// ---------------------------------------------------------------------------
var MASCOT_FRAMES = {
  neutro: [
    'mascot/mascota_neutro_f01.png',
    'mascot/mascota_neutro_f02.png',
    'mascot/mascota_neutro_f03.png',
    'mascot/mascota_neutro_f04.png',
    'mascot/mascota_neutro_f05.png',
  ],
  hablar: [
    'mascot/mascota_hablar_f01.png',
    'mascot/mascota_hablar_f02.png',
    'mascot/mascota_hablar_f03.png',
    'mascot/mascota_hablar_f04.png',
    'mascot/mascota_hablar_f05.png',
    'mascot/mascota_hablar_f06.png',
    'mascot/mascota_hablar_f07.png',
  ],
  feliz: [
    'mascot/mascota_feliz_f01.png',
    'mascot/mascota_feliz_f02.png',
    'mascot/mascota_feliz_f03.png',
    'mascot/mascota_feliz_f04.png',
    'mascot/mascota_feliz_f05.png',
    'mascot/mascota_feliz_f06.png',
    'mascot/mascota_feliz_f07.png',
  ],
  triste: [
    'mascot/mascota_triste_f01.png',
    'mascot/mascota_triste_f02.png',
    'mascot/mascota_triste_f03.png',
    'mascot/mascota_triste_f04.png',
    'mascot/mascota_triste_f05.png',
    'mascot/mascota_triste_f06.png',
    'mascot/mascota_triste_f07.png',
  ],
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
  mascotAnimTimerId: null,
  mascotFrameIdx: 0,
  mascotMood: 'neutro',
  pauseBtnWidget: null,

  hrSensor: null,
  hrCallback: null,
  hrPollTimerId: null,
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
function updateHR() {
  if (!state.hrSensor) return
  var bpm = state.hrSensor.getCurrent()
  if (!bpm || bpm <= 0) {
    bpm = state.hrSensor.getLast()
  }
  if (!bpm || bpm <= 0) return

  var session = state.session
  if (!session) return
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

function startSensors() {
  // Heart rate (may fail in emulator)
  try {
    state.hrSensor = new HeartRate()
    state.hrCallback = function () {
      if (state.paused) return
      updateHR()
    }
    state.hrSensor.onCurrentChange(state.hrCallback)

    // Polling fallback: some emulators don't fire onCurrentChange
    state.hrPollTimerId = createTimer(2000, 2000, function () {
      if (state.paused) return
      updateHR()
    })
  } catch (e) {
    logger.debug("HeartRate sensor not available: " + e.message)
  }

  // GPS (may fail in emulator)
  try {
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
  } catch (e) {
    logger.debug("Geolocation sensor not available: " + e.message)
  }
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

  // Change mascot mood animation
  var newMood = 'neutro'
  if (result.mascotState === MASCOT_STATES.CELEBRATING) {
    newMood = 'feliz'
  } else if (result.mascotState === MASCOT_STATES.TALKING) {
    newMood = 'hablar'
  } else if (result.mascotState === MASCOT_STATES.WORRIED) {
    newMood = 'triste'
  }
  if (newMood !== state.mascotMood) {
    state.mascotMood = newMood
    state.mascotFrameIdx = 0
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
    state.mascotMood = 'triste'
    state.mascotFrameIdx = 0
    if (state.pauseBtnWidget) {
      state.pauseBtnWidget.setProperty(hmUI.prop.TEXT, 'Reanudar')
    }
  } else {
    session.status = 'running'
    session.startTimestamp = Date.now() - session.elapsedMs
    if (state.messageWidget) {
      state.messageWidget.setProperty(hmUI.prop.TEXT, 'Continuamos!')
    }
    state.mascotMood = 'neutro'
    state.mascotFrameIdx = 0
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
    replace({ url: 'page/gt/training-summary/index.page' })
  })
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------
function cleanup() {
  if (state.mascotAnimTimerId !== null) {
    stopTimer(state.mascotAnimTimerId)
    state.mascotAnimTimerId = null
  }

  if (state.hrPollTimerId !== null) {
    stopTimer(state.hrPollTimerId)
    state.hrPollTimerId = null
  }

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
  // Progress arc background (near screen edge)
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

  // Elapsed time (hero metric)
  state.timeWidget = hmUI.createWidget(hmUI.widget.TEXT, {
    x: 0,
    y: AT.TIME_Y,
    w: W,
    h: px(50),
    text: '00:00',
    text_size: AT.TIME_SIZE,
    color: COLORS.WHITE,
    align_h: hmUI.align.CENTER_H,
  })

  // Heart rate
  state.hrWidget = hmUI.createWidget(hmUI.widget.TEXT, {
    x: 0,
    y: AT.HR_Y,
    w: W,
    h: px(34),
    text: '-- bpm',
    text_size: AT.HR_SIZE,
    color: COLORS.HR_RED,
    align_h: hmUI.align.CENTER_H,
  })

  // Pace (left column)
  state.paceWidget = hmUI.createWidget(hmUI.widget.TEXT, {
    x: AT.PACE_X,
    y: AT.PACE_Y,
    w: AT.PACE_W,
    h: AT.STAT_H,
    text: '--:-- /km',
    text_size: AT.STAT_SIZE,
    color: COLORS.PACE_BLUE,
    align_h: hmUI.align.CENTER_H,
  })

  // Pace label
  hmUI.createWidget(hmUI.widget.TEXT, {
    x: AT.PACE_X,
    y: AT.PACE_Y + AT.STAT_H,
    w: AT.PACE_W,
    h: px(18),
    text: 'Ritmo',
    text_size: AT.LABEL_SIZE,
    color: COLORS.TEXT_DIMMED,
    align_h: hmUI.align.CENTER_H,
  })

  // Distance (right column)
  state.distWidget = hmUI.createWidget(hmUI.widget.TEXT, {
    x: AT.DIST_X,
    y: AT.DIST_Y,
    w: AT.DIST_W,
    h: AT.STAT_H,
    text: '0.00 km',
    text_size: AT.STAT_SIZE,
    color: COLORS.TEXT_SECONDARY,
    align_h: hmUI.align.CENTER_H,
  })

  // Distance label
  hmUI.createWidget(hmUI.widget.TEXT, {
    x: AT.DIST_X,
    y: AT.DIST_Y + AT.STAT_H,
    w: AT.DIST_W,
    h: px(18),
    text: 'Distancia',
    text_size: AT.LABEL_SIZE,
    color: COLORS.TEXT_DIMMED,
    align_h: hmUI.align.CENTER_H,
  })

  // Mascot image
  state.mascotWidget = hmUI.createWidget(hmUI.widget.IMG, {
    x: AT.MASCOT_X,
    y: AT.MASCOT_Y,
    w: AT.MASCOT_W,
    h: AT.MASCOT_H,
    src: MASCOT_FRAMES.neutro[0],
  })

  // Start mascot animation
  state.mascotFrameIdx = 0
  state.mascotMood = 'neutro'
  state.mascotAnimTimerId = createTimer(400, 400, function () {
    var frames = MASCOT_FRAMES[state.mascotMood]
    state.mascotFrameIdx = (state.mascotFrameIdx + 1) % frames.length
    if (state.mascotWidget) {
      state.mascotWidget.setProperty(hmUI.prop.SRC, frames[state.mascotFrameIdx])
    }
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
  onInit() {
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
    state.mascotAnimTimerId = null
    state.mascotFrameIdx = 0
    state.mascotMood = 'neutro'
    state.pauseBtnWidget = null
    state.hrSensor = null
    state.hrCallback = null
    state.hrPollTimerId = null
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

  build() {
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
    startTimers()
    startSensors()

    logger.debug("active-training build DONE")
  },

  onDestroy() {
    logger.debug("active-training onDestroy")
    cleanup()
  },
})
