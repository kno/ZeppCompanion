import * as hmUI from "@zos/ui"
import { log as Logger } from "@zos/utils"
import { px } from "@zos/utils"
import { getDeviceInfo } from "@zos/device"
import { replace } from "@zos/router"
import { createTimer, stopTimer } from "@zos/timer"
import { HeartRate, Geolocation, Step } from "@zos/sensor"
import { pauseDropWristScreenOff, resetDropWristScreenOff, pausePalmScreenOff, resetPalmScreenOff, setPageBrightTime } from "@zos/display"
import { BasePage } from "@zeppos/zml/base-page"
import { evaluateLocalRules, getFallbackMessage, getFinishMessage, parseHRZones } from "../../../utils/companion-engine"
import { MASCOT_STATES } from "../../../shared/protocol"
import { createMascotWidget } from "../../../components/mascot-widget"
import { playCompanionAudio, destroyPlayer } from "../../../utils/audio-player"
import { getColors, applyBackground } from "../../../utils/theme"
import { createGpsStatusWidget } from "../../../components/gps-status-widget"

var logger = Logger.getLogger("active-training")
const { width: W } = getDeviceInfo()

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------
var COLORS = getColors()

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
  TIME_Y: px(30),
  TIME_SIZE: px(42),

  ARC_X: px(10),
  ARC_Y: px(10),
  ARC_SIZE: px(460),
  ARC_STROKE: px(6),

  HR_Y: px(90),
  HR_SIZE: px(FONT.MEDIUM),

  PACE_X: px(30),
  PACE_Y: px(135),
  PACE_W: px(200),

  DIST_X: px(250),
  DIST_Y: px(135),
  DIST_W: px(200),

  STAT_H: px(24),
  STAT_SIZE: px(FONT.SMALL),
  LABEL_SIZE: px(14),

  MASCOT_X: (W - px(150)) / 2,
  MASCOT_Y: px(178),
  MASCOT_W: px(150),
  MASCOT_H: px(98),

  STEPS_Y: px(278),

  MSG_X: px(60),
  MSG_Y: px(322),
  MSG_W: px(360),
  MSG_H: px(40),
  MSG_SIZE: px(FONT.TINY),

  BTN_Y: px(365),
  BTN_H: px(46),
  BTN_RADIUS: px(23),
  PAUSE_X: px(80),
  PAUSE_W: px(140),
  STOP_X: px(260),
  STOP_W: px(140),
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
  initialized: false,

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
  mascotComponent: null,
  mascotMood: 'neutro',
  pauseBtnWidget: null,

  stepSensor: null,
  stepCallback: null,
  stepBaseline: -1,
  totalSteps: 0,
  stepsWidget: null,

  hrSensor: null,
  hrCallback: null,
  hrPollTimerId: null,
  geoSensor: null,
  gpsTimerId: null,
  gpsStatusWidget: null,

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

  // Page instance for BLE requests
  pageInstance: null,
  // Track whether we have backend connectivity
  backendAvailable: false,
  // Prevent concurrent companion requests
  companionRequestPending: false,
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

  if (state.hrReadingsAll.length >= 1000) {
    state.hrReadingsAll.shift()
  }
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

function startGPS() {
  try {
    // Reuse global GPS sensor if available (started early in app.js)
    var app = getApp()
    if (app.globalData.geoSensor) {
      state.geoSensor = app.globalData.geoSensor
    } else {
      state.geoSensor = new Geolocation()
      state.geoSensor.start()
    }

    state.gpsTimerId = createTimer(3000, 3000, function () {
      try {
        if (state.paused) return
        if (!state.geoSensor) return

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
      } catch (e) {
        logger.debug("GPS timer error: " + e.message)
      }
    })
  } catch (e) {
    logger.debug("Geolocation sensor not available: " + e.message)
  }
}

function startSensors() {
  try {
    state.hrSensor = new HeartRate()
    state.hrCallback = function () {
      if (state.paused) return
      updateHR()
    }
    state.hrSensor.onCurrentChange(state.hrCallback)

    state.hrPollTimerId = createTimer(2000, 2000, function () {
      try {
        if (state.paused) return
        updateHR()
      } catch (e) {
        logger.debug("HR poll timer error: " + e.message)
      }
    })
  } catch (e) {
    logger.debug("HeartRate sensor not available: " + e.message)
  }

  // Step counter — uses onChange callback (getCurrent() only valid inside callback)
  try {
    state.stepSensor = new Step()
    state.stepCallback = function () {
      try {
        var current = state.stepSensor.getCurrent() || 0
        // Capture baseline on first callback fire (sensor was idle before training)
        if (state.stepBaseline < 0) {
          state.stepBaseline = current
          logger.debug("Step sensor baseline captured=" + state.stepBaseline)
        }
        if (!state.paused) {
          state.totalSteps = Math.max(0, current - state.stepBaseline)
          if (state.session) {
            state.session.totalSteps = state.totalSteps
          }
          if (state.stepsWidget) {
            state.stepsWidget.setProperty(hmUI.prop.TEXT, state.totalSteps + " pasos")
          }
          logger.debug("Step onChange: current=" + current + " baseline=" + state.stepBaseline + " delta=" + state.totalSteps)
        }
      } catch (e) {
        logger.debug("Step onChange error: " + e.message)
      }
    }
    state.stepSensor.onChange(state.stepCallback)
    logger.debug("Step sensor onChange registered")
  } catch (e) {
    logger.debug("Step sensor not available: " + e.message)
  }

  // Delay GPS init by 3 seconds to avoid simultaneous hardware startup
  createTimer(3000, 0, function () {
    startGPS()
  })
}

// ---------------------------------------------------------------------------
// Timer management
// ---------------------------------------------------------------------------
function startTimers() {
  // UI refresh: 1 second
  state.uiTimerId = createTimer(1000, 1000, function () {
    try {
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

      // Step count display — value is updated in stepCallback; just refresh the widget
      if (state.stepsWidget && state.stepSensor) {
        state.stepsWidget.setProperty(hmUI.prop.TEXT, state.totalSteps + " pasos")
      }
    } catch (e) {
      logger.debug("UI timer error: " + e.message)
    }
  })

  // Delay backend + companion + sync by 5 seconds to let UI and sensors stabilize
  logger.debug("[timer] scheduling delayed init (5s)...")
  createTimer(5000, 0, function () {
    logger.debug("[timer] delayed init fired — creating backend session + companion timer")
    // Try to create backend session if we don't have one yet
    createBackendSession()

    // Companion evaluation timer
    var app2 = getApp()
    var freqMs = ((app2.globalData.userPreferences && app2.globalData.userPreferences.messageFrequency) || 90) * 1000
    logger.debug("[timer] companion timer starting with freqMs=" + freqMs)
    state.companionTimerId = createTimer(freqMs, freqMs, function () {
      try {
        if (state.paused) return
        logger.debug("[timer] companion timer tick")
        evaluateCompanion()
      } catch (e) {
        logger.debug("Companion timer error: " + e.message)
      }
    })

    // Backend sync: every 30 seconds
    state.syncTimerId = createTimer(30000, 30000, function () {
      try {
        if (state.paused) return
        syncToBackend()
      } catch (e) {
        logger.debug("Sync timer error: " + e.message)
      }
    })
  })
}

// ---------------------------------------------------------------------------
// Backend session creation (deferred from pre-training for stability)
// ---------------------------------------------------------------------------
function createBackendSession() {
  if (!state.pageInstance || !state.training) return
  var session = state.session
  if (!session || session.backendSessionId) return

  state.pageInstance
    .request({
      method: "start_training",
      params: { trainingId: state.training.id },
    })
    .then(function (data) {
      if (data && data.success && data.session) {
        session.backendSessionId = data.session.id
        state.backendAvailable = true
        logger.debug("Backend session created: " + session.backendSessionId)
      }
    })
    .catch(function (err) {
      logger.debug("Backend session error (non-fatal): " + err)
      state.backendAvailable = false
    })
}

// ---------------------------------------------------------------------------
// Companion logic (local + backend LLM)
// ---------------------------------------------------------------------------
function evaluateCompanion() {
  var session = state.session
  var training = state.training

  // Check if companion messages are enabled
  var prefs = getApp().globalData.userPreferences
  if (prefs && prefs.enableCompanionMessages === false) {
    showCompanionMessage(getFallbackMessage())
    return
  }

  logger.debug("[companion] evaluateCompanion — backendSessionId=" + (session.backendSessionId || "NONE") + " pending=" + state.companionRequestPending)

  // Priority 1: Try backend LLM (with TTS audio)
  if (session.backendSessionId && !state.companionRequestPending) {
    logger.debug("[companion] requesting LLM from backend...")
    requestBackendCompanion(session)
    return
  }

  // Priority 2: Check local rules (HR safety, pace correction, milestones)
  var trainingConfig = {
    paceGoalSecPerKm: training.paceGoalSecPerKm || 0,
    hrZoneMin: state.hrZones ? state.hrZones.hrZoneMin : 0,
    hrZoneMax: state.hrZones ? state.hrZones.hrZoneMax : 180,
  }

  var localResult = evaluateLocalRules(session, trainingConfig)
  if (localResult) {
    logger.debug("[companion] local rule fired: " + localResult.message)
    showCompanionMessage(localResult)
    return
  }

  // Priority 3: Fallback local message
  logger.debug("[companion] using local fallback")
  showCompanionMessage(getFallbackMessage())
}

function requestBackendCompanion(session) {
  if (!state.pageInstance) {
    logger.debug("[companion] no pageInstance, using fallback")
    showCompanionMessage(getFallbackMessage())
    return
  }

  state.companionRequestPending = true
  var requestParams = {
    sessionId: session.backendSessionId,
    heartRate: session.currentHR || 0,
    pace: session.currentPace || 0,
    distance: session.distanceMeters || 0,
    elapsed: session.elapsedMs || 0,
    progress: session.percentComplete || 0,
  }
  logger.debug("[companion] BLE request params: " + JSON.stringify(requestParams))

  state.pageInstance
    .request({
      method: "request_companion",
      params: requestParams,
    })
    .then(function (data) {
      state.companionRequestPending = false
      logger.debug("[companion] BLE response: " + JSON.stringify(data))
      if (data && data.success && data.companion) {
        var companion = data.companion
        var mascotState = MASCOT_STATES.TALKING
        if (companion.mascot_state === "celebrating") {
          mascotState = MASCOT_STATES.CELEBRATING
        } else if (companion.mascot_state === "worried") {
          mascotState = MASCOT_STATES.WORRIED
        }
        showCompanionMessage({
          message: companion.message,
          tone: companion.tone || "motivational",
          mascotState: mascotState,
          audioBase64: companion.audioBase64 || null,
        })
        state.backendAvailable = true
      } else {
        showCompanionMessage(getFallbackMessage())
      }
    })
    .catch(function (err) {
      state.companionRequestPending = false
      logger.debug("[companion] BLE request FAILED: " + err)
      state.backendAvailable = false
      showCompanionMessage(getFallbackMessage())
    })
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
    if (state.mascotComponent) {
      state.mascotComponent.setMood(newMood)
    }
  }

  // Play audio if available and enabled
  var audioPrefs = getApp().globalData.userPreferences
  if (result.audioBase64 && (!audioPrefs || audioPrefs.enableAudioMessages !== false)) {
    playCompanionAudio(result.audioBase64)
  }
}

// ---------------------------------------------------------------------------
// Backend sync (fire-and-forget)
// ---------------------------------------------------------------------------
function syncToBackend() {
  if (!state.pageInstance || !state.session || !state.session.backendSessionId) return

  state.pageInstance
    .request({
      method: "training_update",
      params: {
        sessionId: state.session.backendSessionId,
        heartRate: state.session.currentHR || 0,
        pace: state.session.currentPace || 0,
        distance: state.session.distanceMeters || 0,
        elapsed: state.session.elapsedMs || 0,
        progress: state.session.percentComplete || 0,
      },
    })
    .then(function () {
      state.backendAvailable = true
    })
    .catch(function (err) {
      logger.debug("Sync error: " + err)
      state.backendAvailable = false
    })
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
    if (state.mascotComponent) {
      state.mascotComponent.setMood('triste')
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
    state.mascotMood = 'neutro'
    if (state.mascotComponent) {
      state.mascotComponent.setMood('neutro')
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

  // Save results to backend
  if (state.pageInstance && session.backendSessionId) {
    state.pageInstance
      .request({
        method: "save_results",
        params: {
          sessionId: session.backendSessionId,
          durationMs: session.elapsedMs,
          distanceMeters: session.distanceMeters || 0,
          avgHeartRate: avgHR,
          maxHeartRate: state.maxHR,
          avgPaceSecPerKm: session.currentPace || 0,
          caloriesBurned: 0,
          totalSteps: state.totalSteps || 0,
        },
      })
      .then(function (data) {
        logger.debug("Results saved: " + JSON.stringify(data))
      })
      .catch(function (err) {
        logger.debug("Save results error: " + err)
      })
  }

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
  // Clean up audio player and any temp files
  destroyPlayer()

  // Restore normal screen-off behavior
  resetDropWristScreenOff()
  resetPalmScreenOff()
  logger.debug("active-training: screen keep-alive disabled")

  if (state.mascotComponent) {
    state.mascotComponent.destroy()
    state.mascotComponent = null
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

  if (state.stepSensor && state.stepCallback) {
    state.stepSensor.offChange(state.stepCallback)
    state.stepCallback = null
  }
  state.stepSensor = null

  if (state.gpsTimerId !== null) {
    stopTimer(state.gpsTimerId)
    state.gpsTimerId = null
  }

  if (state.geoSensor) {
    // Don't stop — this is the global sensor managed by app.js
    state.geoSensor = null
  }

  if (state.gpsStatusWidget) {
    state.gpsStatusWidget.destroy()
    state.gpsStatusWidget = null
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
  COLORS = getColors()
  applyBackground()

  // Progress arc background
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

  // Elapsed time
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

  // Pace
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

  // Distance
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

  // Steps
  state.stepsWidget = hmUI.createWidget(hmUI.widget.TEXT, {
    x: 0,
    y: AT.STEPS_Y,
    w: W,
    h: AT.STAT_H,
    text: '0 pasos',
    text_size: AT.STAT_SIZE,
    color: COLORS.WARNING_YELLOW,
    align_h: hmUI.align.CENTER_H,
  })

  hmUI.createWidget(hmUI.widget.TEXT, {
    x: 0,
    y: AT.STEPS_Y + AT.STAT_H,
    w: W,
    h: px(18),
    text: 'Pasos',
    text_size: AT.LABEL_SIZE,
    color: COLORS.TEXT_DIMMED,
    align_h: hmUI.align.CENTER_H,
  })

  // Mascot
  state.mascotComponent = createMascotWidget({
    x: AT.MASCOT_X,
    y: AT.MASCOT_Y,
    w: AT.MASCOT_W,
    h: AT.MASCOT_H,
    initialMood: 'neutro',
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

  // GPS status indicator (created last for highest z-order)
  state.gpsStatusWidget = createGpsStatusWidget()
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
Page(
  BasePage({
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
      state.mascotComponent = null
      state.mascotMood = 'neutro'
      state.pauseBtnWidget = null
      state.stepSensor = null
      state.stepCallback = null
      state.stepBaseline = -1
      state.totalSteps = 0
      state.stepsWidget = null
      state.hrSensor = null
      state.hrCallback = null
      state.hrPollTimerId = null
      state.geoSensor = null
      state.gpsTimerId = null
      state.gpsStatusWidget = null
      state.hrReadingsAll = []
      state.maxHR = 0
      state.paused = false
      state.lastLat = null
      state.lastLng = null
      state.lastGpsTime = 0
      state.totalDistance = 0
      state.pageInstance = null
      state.backendAvailable = false
      state.companionRequestPending = false
      state.initialized = false

      var app = getApp()
      state.training = app.globalData.currentTraining
      state.session = app.globalData.trainingSession

      if (state.training) {
        state.hrZones = parseHRZones(state.training)
      }
    },

    build() {
      logger.debug("active-training build START")

      // Guard against double initialization (Zepp OS lifecycle can call build() twice)
      if (state.initialized) {
        logger.debug("active-training build skipped — already initialized")
        return
      }
      state.initialized = true

      // Store page instance for BLE requests from module-level functions
      state.pageInstance = this

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

      // Prevent OS from killing the page on wrist-down or palm-cover
      pauseDropWristScreenOff({ duration: 0 })
      pausePalmScreenOff({ duration: 0 })
      setPageBrightTime({ brightTime: 3600000 })
      logger.debug("active-training: screen keep-alive enabled")

      buildUI(training, session)
      startTimers()
      startSensors()

      logger.debug("active-training build DONE")
    },

    onDestroy() {
      logger.debug("active-training onDestroy")
      cleanup()
      state.pageInstance = null
    },
  })
)
