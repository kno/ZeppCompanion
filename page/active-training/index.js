import { createWidget, widget, prop, align, text_style } from '@zos/ui'
import { replace } from '@zos/router'
import { getApp } from '@zos/device'
import { createTimer, stopTimer } from '@zos/timer'
import { BasePage } from '@zeppos/zml/base-page'
import { COLORS, FONT, SCREEN, LAYOUT, MASCOT } from '../../utils/constants'
import { formatTime, formatPace, formatHR, calculateProgress } from '../../utils/format'
import { createSensorManager } from '../../utils/sensor-manager'
import { createMascotController } from '../../utils/mascot'
import { evaluateLocalRules, getFallbackMessage, getFinishMessage, parseHRZones } from '../../utils/companion-engine'
import { MASCOT_STATES, REQUEST_TYPES } from '../../shared/protocol'

var app = getApp()

// ---------------------------------------------------------------------------
// Layout constants for 480px round screen
// Active training layout (top to bottom):
//
//   y=18   elapsed time (large, centered)
//   y=70   progress arc ring (x:30, 420x420 frame, 8px track)
//   y=88   HR value (48px, centered)
//   y=145  pace value (28px, centered)
//   y=175  distance value (20px, centered)
//   y=200  mascot circle placeholder (center 240,240, r=52)
//   y=220  "ZEEP" label inside mascot
//   y=298  companion message (wrap, 2 lines, 20px)
//   y=385  pause / finish buttons side by side
// ---------------------------------------------------------------------------

var AT = {
  // Elapsed time widget
  TIME_X: 0,
  TIME_Y: 18,
  TIME_W: SCREEN.WIDTH,
  TIME_H: 50,
  TIME_SIZE: 38,

  // Progress arc ring
  ARC_X: 30,
  ARC_Y: 70,
  ARC_SIZE: 420,
  ARC_STROKE: 8,

  // Metrics column (stacked, centered)
  HR_X: 0,
  HR_Y: 88,
  HR_W: SCREEN.WIDTH,
  HR_H: 52,
  HR_SIZE: FONT.LARGE,  // 48

  PACE_X: 0,
  PACE_Y: 150,
  PACE_W: SCREEN.WIDTH,
  PACE_H: 34,
  PACE_SIZE: FONT.MEDIUM,  // 28

  DIST_X: 0,
  DIST_Y: 190,
  DIST_W: SCREEN.WIDTH,
  DIST_H: 26,
  DIST_SIZE: FONT.SMALL,  // 20

  // Mascot placeholder circle
  MASCOT_CX: SCREEN.CENTER_X,     // 240
  MASCOT_CY: 232,
  MASCOT_R: 52,

  MASCOT_LABEL_X: 0,
  MASCOT_LABEL_Y: 218,
  MASCOT_LABEL_W: SCREEN.WIDTH,
  MASCOT_LABEL_H: 28,

  // Companion message
  MSG_X: LAYOUT.CONTENT_LEFT,    // 40
  MSG_Y: 295,
  MSG_W: LAYOUT.CONTENT_WIDTH,   // 400
  MSG_H: 65,
  MSG_SIZE: FONT.SMALL,          // 20

  // BLE disconnect banner (top, hidden by default via empty text)
  BLE_X: 0,
  BLE_Y: 4,
  BLE_W: SCREEN.WIDTH,
  BLE_H: 18,
  BLE_SIZE: 14,

  // Pause / Finish buttons
  BTN_Y: 383,
  BTN_H: 58,
  BTN_RADIUS: 29,
  PAUSE_X: 58,
  PAUSE_W: 162,
  STOP_X: 260,
  STOP_W: 162,
}

Page(
  BasePage({
    state: {
      // Timer IDs
      uiTimerId: null,
      companionTimerId: null,
      syncTimerId: null,

      // Widget references
      timeWidget: null,
      hrWidget: null,
      paceWidget: null,
      distWidget: null,
      progressArcWidget: null,
      messageWidget: null,
      disconnectWidget: null,
      mascotWidget: null,
      pauseBtnWidget: null,

      // Controllers
      sensorManager: null,
      mascotController: null,

      // Training data
      training: null,
      session: null,
      hrZones: null,

      // Aggregated stats (accumulated here to avoid mutating session too often)
      hrReadingsAll: [],
      maxHR: 0,

      // Paused flag
      paused: false,
    },

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    onInit() {
      this.state.training = app.globalData.currentTraining
      this.state.session = app.globalData.trainingSession

      if (this.state.training) {
        this.state.hrZones = parseHRZones(this.state.training)
      }
    },

    build() {
      var session = this.state.session
      var training = this.state.training

      // Guard: missing session
      if (!session || !training) {
        createWidget(widget.TEXT, {
          x: 0,
          y: 200,
          w: SCREEN.WIDTH,
          h: 40,
          text: 'Error: sin sesion activa',
          text_size: FONT.BODY,
          color: COLORS.ERROR_RED,
          align_h: align.CENTER_H,
        })
        return
      }

      this._buildUI(training, session)
      this._startSensors()
      this._startTimers()
    },

    onDestroy() {
      this._cleanup()
    },

    // -------------------------------------------------------------------------
    // UI construction
    // -------------------------------------------------------------------------

    _buildUI(training, session) {
      // --- Black background fill (AMOLED battery saving) ---
      createWidget(widget.FILL_RECT, {
        x: 0,
        y: 0,
        w: SCREEN.WIDTH,
        h: SCREEN.HEIGHT,
        color: COLORS.BG_DARK,
      })

      // --- BLE disconnect banner (empty = invisible) ---
      this.state.disconnectWidget = createWidget(widget.TEXT, {
        x: AT.BLE_X,
        y: AT.BLE_Y,
        w: AT.BLE_W,
        h: AT.BLE_H,
        text: '',
        text_size: AT.BLE_SIZE,
        color: COLORS.ERROR_RED,
        align_h: align.CENTER_H,
      })

      // --- Training name (small, top, dimmed) ---
      createWidget(widget.TEXT, {
        x: 0,
        y: AT.TIME_Y - 4,
        w: SCREEN.WIDTH,
        h: 18,
        text: training.name || 'Entrenamiento',
        text_size: 14,
        color: COLORS.TEXT_DIMMED,
        align_h: align.CENTER_H,
      })

      // --- Elapsed time ---
      this.state.timeWidget = createWidget(widget.TEXT, {
        x: AT.TIME_X,
        y: AT.TIME_Y + 18,
        w: AT.TIME_W,
        h: AT.TIME_H,
        text: '00:00',
        text_size: AT.TIME_SIZE,
        color: COLORS.WHITE,
        align_h: align.CENTER_H,
      })

      // --- Progress arc: background track ---
      createWidget(widget.ARC, {
        x: AT.ARC_X,
        y: AT.ARC_Y,
        w: AT.ARC_SIZE,
        h: AT.ARC_SIZE,
        start_angle: -90,
        end_angle: 270,
        color: COLORS.ARC_BG,
        line_width: AT.ARC_STROKE,
      })

      // --- Progress arc: fill (starts empty at -90) ---
      this.state.progressArcWidget = createWidget(widget.ARC, {
        x: AT.ARC_X,
        y: AT.ARC_Y,
        w: AT.ARC_SIZE,
        h: AT.ARC_SIZE,
        start_angle: -90,
        end_angle: -90,
        color: COLORS.ARC_FILL,
        line_width: AT.ARC_STROKE,
      })

      // --- Heart rate ---
      this.state.hrWidget = createWidget(widget.TEXT, {
        x: AT.HR_X,
        y: AT.HR_Y,
        w: AT.HR_W,
        h: AT.HR_H,
        text: '-- bpm',
        text_size: AT.HR_SIZE,
        color: COLORS.HR_RED,
        align_h: align.CENTER_H,
      })

      // --- Pace ---
      this.state.paceWidget = createWidget(widget.TEXT, {
        x: AT.PACE_X,
        y: AT.PACE_Y,
        w: AT.PACE_W,
        h: AT.PACE_H,
        text: '--:-- /km',
        text_size: AT.PACE_SIZE,
        color: COLORS.PACE_BLUE,
        align_h: align.CENTER_H,
      })

      // --- Distance ---
      this.state.distWidget = createWidget(widget.TEXT, {
        x: AT.DIST_X,
        y: AT.DIST_Y,
        w: AT.DIST_W,
        h: AT.DIST_H,
        text: '0.00 km',
        text_size: AT.DIST_SIZE,
        color: COLORS.TEXT_SECONDARY,
        align_h: align.CENTER_H,
      })

      // --- Mascot placeholder circle ---
      // Color encodes mascot state: green=idle, cyan=talking, lime=celebrating, red=worried
      this.state.mascotWidget = createWidget(widget.CIRCLE, {
        center_x: AT.MASCOT_CX,
        center_y: AT.MASCOT_CY,
        radius: AT.MASCOT_R,
        color: COLORS.PRIMARY,
      })

      // Mascot inner label
      createWidget(widget.TEXT, {
        x: AT.MASCOT_LABEL_X,
        y: AT.MASCOT_LABEL_Y,
        w: AT.MASCOT_LABEL_W,
        h: AT.MASCOT_LABEL_H,
        text: 'ZEEP',
        text_size: FONT.BODY,
        color: COLORS.WHITE,
        align_h: align.CENTER_H,
      })

      // --- Companion message ---
      this.state.messageWidget = createWidget(widget.TEXT, {
        x: AT.MSG_X,
        y: AT.MSG_Y,
        w: AT.MSG_W,
        h: AT.MSG_H,
        text: 'Vamos, comienza tu entrenamiento!',
        text_size: AT.MSG_SIZE,
        color: COLORS.WARNING_YELLOW,
        align_h: align.CENTER_H,
        text_style: text_style.WRAP,
      })

      // --- Pause button ---
      this.state.pauseBtnWidget = createWidget(widget.BUTTON, {
        x: AT.PAUSE_X,
        y: AT.BTN_Y,
        w: AT.PAUSE_W,
        h: AT.BTN_H,
        text: 'Pausa',
        text_size: FONT.SMALL,
        radius: AT.BTN_RADIUS,
        normal_color: COLORS.BG_CARD,
        press_color: COLORS.BG_CARD_HOVER,
        click_func: () => {
          this._togglePause()
        },
      })

      // --- Finish button ---
      createWidget(widget.BUTTON, {
        x: AT.STOP_X,
        y: AT.BTN_Y,
        w: AT.STOP_W,
        h: AT.BTN_H,
        text: 'Terminar',
        text_size: FONT.SMALL,
        radius: AT.BTN_RADIUS,
        normal_color: COLORS.ERROR_RED,
        press_color: 0xC62828,
        click_func: () => {
          this._finishTraining()
        },
      })
    },

    // -------------------------------------------------------------------------
    // Sensor management
    // -------------------------------------------------------------------------

    _startSensors() {
      var self = this
      this.state.sensorManager = createSensorManager()

      // Heart rate
      this.state.sensorManager.startHR(function (bpm) {
        if (self.state.paused) return

        var session = self.state.session
        session.currentHR = bpm

        // Accumulate for average/max
        self.state.hrReadingsAll.push(bpm)
        if (bpm > self.state.maxHR) {
          self.state.maxHR = bpm
        }

        // Sliding window of last 60 readings for recent-average use
        if (session.hrReadings.length >= 60) {
          session.hrReadings.shift()
        }
        session.hrReadings.push(bpm)

        // Update widget
        if (self.state.hrWidget) {
          self.state.hrWidget.setProperty(prop.TEXT, formatHR(bpm))
        }
      })

      // GPS
      this.state.sensorManager.startGPS(3000, function (data) {
        if (self.state.paused) return

        var session = self.state.session
        session.distanceMeters = data.distance

        if (data.pace > 0) {
          session.currentPace = data.pace
          if (self.state.paceWidget) {
            self.state.paceWidget.setProperty(prop.TEXT, formatPace(data.pace))
          }
        }

        session.lastGpsLat = data.lat
        session.lastGpsLng = data.lng
        session.lastGpsTimestamp = Date.now()

        // Update distance widget (convert meters to km, 2 decimals)
        if (self.state.distWidget) {
          var km = (data.distance / 1000).toFixed(2)
          self.state.distWidget.setProperty(prop.TEXT, km + ' km')
        }
      })
    },

    // -------------------------------------------------------------------------
    // Timer management
    // -------------------------------------------------------------------------

    _startTimers() {
      var self = this

      // -- UI refresh: 1 second tick --
      // Updates elapsed time display and progress arc
      this.state.uiTimerId = createTimer(1000, 1000, function () {
        if (self.state.paused) return

        var session = self.state.session
        var training = self.state.training

        session.elapsedMs = Date.now() - session.startTimestamp

        // Update elapsed time widget
        if (self.state.timeWidget) {
          self.state.timeWidget.setProperty(prop.TEXT, formatTime(session.elapsedMs))
        }

        // Update progress arc if a duration target exists
        if (training && training.durationMinutes) {
          var targetMs = training.durationMinutes * 60 * 1000
          session.percentComplete = calculateProgress(session.elapsedMs, targetMs)

          if (self.state.progressArcWidget) {
            // Map 0.0-1.0 progress to -90 to 270 degrees (full circle = 360deg sweep)
            var endAngle = -90 + (session.percentComplete * 360)
            if (endAngle > 270) endAngle = 270
            self.state.progressArcWidget.setProperty(prop.MORE, {
              end_angle: endAngle,
            })
          }

          // Auto-finish when duration target is reached
          if (session.percentComplete >= 1.0 && session.status === 'running') {
            self._finishTraining()
          }
        }
      })

      // -- Companion evaluation timer --
      // Frequency driven by user preference (default 90s)
      var freqMs = ((app.globalData.userPreferences && app.globalData.userPreferences.messageFrequency) || 90) * 1000
      this.state.companionTimerId = createTimer(freqMs, freqMs, function () {
        if (self.state.paused) return
        self._evaluateCompanion()
      })

      // -- Backend sync timer: every 30 seconds --
      this.state.syncTimerId = createTimer(30000, 30000, function () {
        if (self.state.paused) return
        self._syncToBackend()
      })
    },

    // -------------------------------------------------------------------------
    // Companion logic
    // -------------------------------------------------------------------------

    _evaluateCompanion() {
      var session = this.state.session
      var training = this.state.training

      // Assemble HR zone config for rule evaluator
      var trainingConfig = {
        paceGoalSecPerKm: training.paceGoalSecPerKm || 0,
        hrZoneMin: this.state.hrZones ? this.state.hrZones.hrZoneMin : 0,
        hrZoneMax: this.state.hrZones ? this.state.hrZones.hrZoneMax : 180,
      }

      // Try local rule engine first (fast, no network)
      var localResult = evaluateLocalRules(session, trainingConfig)
      if (localResult) {
        this._showCompanionMessage(localResult)
        return
      }

      // Attempt LLM companion request via BasePage messaging
      if (!session.pendingLlmRequest) {
        session.pendingLlmRequest = true
        var self = this

        this.request({
          type: REQUEST_TYPES.REQUEST_COMPANION,
          sessionId: session.sessionId || '',
          metrics: {
            heart_rate: session.currentHR,
            pace_sec_per_km: session.currentPace,
            elapsed_sec: Math.floor(session.elapsedMs / 1000),
            distance_m: session.distanceMeters,
            progress_pct: session.percentComplete,
          },
        }).then(function (response) {
          session.pendingLlmRequest = false

          if (response && response.data && response.data.data) {
            var msg = response.data.data
            if (msg && msg.message) {
              self._showCompanionMessage({
                message: msg.message,
                tone: msg.tone || 'encouraging',
                mascotState: msg.mascot_state || MASCOT_STATES.TALKING,
              })
            }
          }
        })

        // Intentionally fire-and-forget: no error branch needed here.
        // If BLE drops the request, next tick shows a fallback.
        return
      }

      // Fallback: no network, no matching local rule
      this._showCompanionMessage(getFallbackMessage())
    },

    _showCompanionMessage(result) {
      if (!result || !result.message) return

      var session = this.state.session
      session.lastCompanionMsg = result.message
      session.lastCompanionTime = Date.now()

      // Update message text
      if (this.state.messageWidget) {
        this.state.messageWidget.setProperty(prop.TEXT, result.message)
      }

      // Update mascot placeholder color to reflect emotional state
      // CIRCLE widget supports prop.MORE for color update
      if (this.state.mascotWidget) {
        var mascotColor = COLORS.PRIMARY  // idle = green
        if (result.mascotState === MASCOT_STATES.TALKING) {
          mascotColor = COLORS.ACCENT            // cyan
        } else if (result.mascotState === MASCOT_STATES.CELEBRATING) {
          mascotColor = COLORS.PROGRESS_GREEN    // bright lime-green
        } else if (result.mascotState === MASCOT_STATES.WORRIED) {
          mascotColor = COLORS.ERROR_RED         // red
        }
        this.state.mascotWidget.setProperty(prop.MORE, { color: mascotColor })
      }
    },

    // -------------------------------------------------------------------------
    // Backend sync
    // -------------------------------------------------------------------------

    _syncToBackend() {
      var session = this.state.session

      this.request({
        type: REQUEST_TYPES.TRAINING_UPDATE,
        sessionId: session.sessionId || '',
        metrics: {
          heart_rate: session.currentHR,
          pace_sec_per_km: session.currentPace,
          elapsed_sec: Math.floor(session.elapsedMs / 1000),
          distance_m: session.distanceMeters,
          progress_pct: session.percentComplete,
        },
      }).then(function () {
        session.failedSyncCount = 0
        if (session.bleDisconnected) {
          session.bleDisconnected = false
        }
      })
      // Failure handling: BLE drop is silent; failedSyncCount tracks retries
      // elsewhere. The disconnect banner updates when the app-side fires
      // a disconnect event (future integration point).
    },

    // -------------------------------------------------------------------------
    // Pause / resume
    // -------------------------------------------------------------------------

    _togglePause() {
      this.state.paused = !this.state.paused
      var session = this.state.session

      if (this.state.paused) {
        session.status = 'paused'
        if (this.state.messageWidget) {
          this.state.messageWidget.setProperty(prop.TEXT, 'Pausado')
        }
        if (this.state.mascotWidget) {
          this.state.mascotWidget.setProperty(prop.MORE, { color: COLORS.TEXT_DIMMED })
        }
      } else {
        session.status = 'running'
        // Shift start timestamp forward to exclude the paused interval
        session.startTimestamp = Date.now() - session.elapsedMs
        if (this.state.messageWidget) {
          this.state.messageWidget.setProperty(prop.TEXT, 'Continuamos!')
        }
        if (this.state.mascotWidget) {
          this.state.mascotWidget.setProperty(prop.MORE, { color: COLORS.PRIMARY })
        }
      }
    },

    // -------------------------------------------------------------------------
    // Finish training
    // -------------------------------------------------------------------------

    _finishTraining() {
      var session = this.state.session
      if (session.status === 'finished') return  // guard against double-tap

      session.status = 'finished'
      session.elapsedMs = Date.now() - session.startTimestamp

      // Calculate average HR from full reading history
      var avgHR = 0
      var readings = this.state.hrReadingsAll
      if (readings.length > 0) {
        var sum = 0
        for (var i = 0; i < readings.length; i++) {
          sum = sum + readings[i]
        }
        avgHR = Math.round(sum / readings.length)
      }

      session.avgHR = avgHR
      session.maxHR = this.state.maxHR

      // Stop sensors and timers immediately
      this._cleanup()

      // Show finish message via companion engine
      var finishResult = getFinishMessage()
      this._showCompanionMessage(finishResult)

      // Persist session back to globalData for summary page
      app.globalData.trainingSession = session

      // Send final results to backend
      this.request({
        type: REQUEST_TYPES.SAVE_RESULTS,
        sessionId: session.sessionId || '',
        totalDurationSec: Math.floor(session.elapsedMs / 1000),
        totalDistanceM: session.distanceMeters,
        avgHeartRate: avgHR,
        maxHeartRate: this.state.maxHR,
        avgPaceSecPerKm: session.currentPace,
      })

      // Navigate to summary after 2 seconds so user sees the finish message
      var navTimerId = createTimer(2000, 0, function () {
        stopTimer(navTimerId)
        replace({ url: 'page/training-summary/index' })
      })
    },

    // -------------------------------------------------------------------------
    // Cleanup: stop all timers and sensors
    // Safe to call multiple times (guards with null checks)
    // -------------------------------------------------------------------------

    _cleanup() {
      // Stop sensors
      if (this.state.sensorManager) {
        this.state.sensorManager.stopAll()
        this.state.sensorManager = null
      }

      // Stop mascot controller (clears its internal revert timer)
      if (this.state.mascotController) {
        this.state.mascotController.destroy()
        this.state.mascotController = null
      }

      // Stop UI refresh timer
      if (this.state.uiTimerId !== null) {
        stopTimer(this.state.uiTimerId)
        this.state.uiTimerId = null
      }

      // Stop companion message timer
      if (this.state.companionTimerId !== null) {
        stopTimer(this.state.companionTimerId)
        this.state.companionTimerId = null
      }

      // Stop backend sync timer
      if (this.state.syncTimerId !== null) {
        stopTimer(this.state.syncTimerId)
        this.state.syncTimerId = null
      }
    },
  })
)
