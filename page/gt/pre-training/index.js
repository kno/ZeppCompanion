import * as hmUI from "@zos/ui"
import { log as Logger } from "@zos/utils"
import { px } from "@zos/utils"
import { getDeviceInfo } from "@zos/device"
import { push } from "@zos/router"

var logger = Logger.getLogger("pre-training")
var devInfo = getDeviceInfo()
var W = devInfo.width

var COLORS = {
  WHITE: 0xFFFFFF,
  TEXT_PRIMARY: 0xFFFFFF,
  TEXT_SECONDARY: 0x999999,
  PRIMARY: 0x4CAF50,
  PRIMARY_DARK: 0x388E3C,
  ERROR_RED: 0xEF5350,
  WARNING_YELLOW: 0xFFD54F,
}

var FONT = {
  MEDIUM: 28,
  BODY: 24,
  SMALL: 20,
  TINY: 16,
}

function getTrainingTypeName(type) {
  var names = {
    'cardio_continuous': 'Cardio',
    'intervals': 'Intervalos',
    'free': 'Libre',
  }
  return names[type] || type
}

function formatPace(secPerKm) {
  if (!secPerKm || secPerKm <= 0 || secPerKm > 3600) return '--:-- /km'
  var min = Math.floor(secPerKm / 60)
  var sec = Math.round(secPerKm % 60)
  return min + ':' + String(sec).padStart(2, '0') + ' /km'
}

Page({
  onInit: function () {
    logger.debug("pre-training onInit")
  },

  build: function () {
    logger.debug("pre-training build START")

    var app = getApp()
    var training = app.globalData.currentTraining

    if (!training) {
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(0),
        y: px(200),
        w: W,
        h: px(40),
        text: 'Error: sin entrenamiento',
        text_size: px(FONT.BODY),
        color: COLORS.ERROR_RED,
        align_h: hmUI.align.CENTER_H,
      })
      return
    }

    // Training name
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(0),
      y: px(50),
      w: W,
      h: px(40),
      text: training.name,
      text_size: px(FONT.MEDIUM),
      color: COLORS.WHITE,
      align_h: hmUI.align.CENTER_H,
    })

    // Type badge background
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: px(170),
      y: px(100),
      w: px(140),
      h: px(32),
      radius: px(16),
      color: COLORS.PRIMARY,
    })

    // Type badge label
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(170),
      y: px(104),
      w: px(140),
      h: px(24),
      text: getTrainingTypeName(training.type),
      text_size: px(FONT.TINY),
      color: COLORS.WHITE,
      align_h: hmUI.align.CENTER_H,
    })

    // Detail rows
    var detailY = px(155)

    if (training.durationMinutes) {
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(40),
        y: detailY,
        w: px(400),
        h: px(30),
        text: 'Duracion: ' + String(training.durationMinutes) + ' min',
        text_size: px(FONT.BODY),
        color: COLORS.TEXT_PRIMARY,
        align_h: hmUI.align.CENTER_H,
      })
      detailY = detailY + px(40)
    }

    if (training.distanceMeters) {
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(40),
        y: detailY,
        w: px(400),
        h: px(30),
        text: 'Distancia: ' + (training.distanceMeters / 1000).toFixed(1) + ' km',
        text_size: px(FONT.BODY),
        color: COLORS.TEXT_PRIMARY,
        align_h: hmUI.align.CENTER_H,
      })
      detailY = detailY + px(40)
    }

    if (training.paceGoalSecPerKm && training.paceGoalSecPerKm > 0) {
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(40),
        y: detailY,
        w: px(400),
        h: px(30),
        text: 'Ritmo objetivo: ' + formatPace(training.paceGoalSecPerKm),
        text_size: px(FONT.BODY),
        color: COLORS.TEXT_PRIMARY,
        align_h: hmUI.align.CENTER_H,
      })
      detailY = detailY + px(40)
    }

    // Encouraging message
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(0),
      y: detailY + px(10),
      w: W,
      h: px(30),
      text: 'Preparado para entrenar!',
      text_size: px(FONT.SMALL),
      color: COLORS.WARNING_YELLOW,
      align_h: hmUI.align.CENTER_H,
    })

    // COMENZAR button
    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: px(90),
      y: px(380),
      w: px(300),
      h: px(70),
      text: 'COMENZAR',
      text_size: px(FONT.MEDIUM),
      radius: px(35),
      normal_color: COLORS.PRIMARY,
      press_color: COLORS.PRIMARY_DARK,
      click_func: function () {
        var a = getApp()
        a.globalData.trainingSession = {
          status: 'running',
          startTimestamp: Date.now(),
          elapsedMs: 0,
          hrReadings: [],
          currentHR: 0,
          currentPace: 0,
          distanceMeters: 0,
          lastGpsLat: null,
          lastGpsLng: null,
          lastGpsTimestamp: 0,
          percentComplete: 0,
          eventsTriggered: {},
          pendingLlmRequest: false,
          lastCompanionMsg: '',
          lastCompanionTime: 0,
          failedSyncCount: 0,
          bleDisconnected: false,
        }
        push({ url: 'page/gt/active-training/index' })
      },
    })

    logger.debug("pre-training build DONE")
  },

  onDestroy: function () {
    logger.debug("pre-training onDestroy")
  },
})
