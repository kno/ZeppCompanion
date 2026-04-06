import * as hmUI from "@zos/ui"
import { log as Logger } from "@zos/utils"
import { px } from "@zos/utils"
import { getDeviceInfo } from "@zos/device"
import { push } from "@zos/router"

var logger = Logger.getLogger("training-select")
var devInfo = getDeviceInfo()
var W = devInfo.width

// Inline helpers (no module imports that break the pattern)
var COLORS = {
  WHITE: 0xFFFFFF,
  TEXT_SECONDARY: 0x999999,
  ACCENT: 0x58D0FF,
  BG_CARD: 0x1A1A1A,
  BG_CARD_HOVER: 0x2A2A2A,
}

var FONT = {
  MEDIUM: 28,
  BODY: 24,
  SMALL: 20,
  TINY: 16,
}

var MOCK_TRAININGS = [
  { id: '1', name: 'Carrera suave 30min', type: 'cardio_continuous', durationMinutes: 30, paceGoalSecPerKm: 360 },
  { id: '2', name: 'Intervalos 4x400m', type: 'intervals', durationMinutes: 25, paceGoalSecPerKm: 270 },
  { id: '3', name: 'Trote libre', type: 'free', durationMinutes: 45, paceGoalSecPerKm: 0 },
]

function getTrainingTypeName(type) {
  var names = {
    'cardio_continuous': 'Cardio',
    'intervals': 'Intervalos',
    'free': 'Libre',
  }
  return names[type] || type
}

function createTrainingItem(training, y) {
  // Card background
  hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: px(40),
    y: y,
    w: px(400),
    h: px(80),
    radius: px(12),
    color: COLORS.BG_CARD,
  })

  // Training name
  hmUI.createWidget(hmUI.widget.TEXT, {
    x: px(56),
    y: y + px(10),
    w: px(368),
    h: px(30),
    text: training.name,
    text_size: px(FONT.BODY),
    color: COLORS.WHITE,
  })

  // Type label
  hmUI.createWidget(hmUI.widget.TEXT, {
    x: px(56),
    y: y + px(45),
    w: px(200),
    h: px(24),
    text: getTrainingTypeName(training.type),
    text_size: px(FONT.TINY),
    color: COLORS.TEXT_SECONDARY,
  })

  // Duration label
  var durationText = training.durationMinutes ? String(training.durationMinutes) + ' min' : ''
  hmUI.createWidget(hmUI.widget.TEXT, {
    x: px(340),
    y: y + px(45),
    w: px(100),
    h: px(24),
    text: durationText,
    text_size: px(FONT.TINY),
    color: COLORS.ACCENT,
    align_h: hmUI.align.RIGHT,
  })

  // Tap overlay button
  var _training = training
  hmUI.createWidget(hmUI.widget.BUTTON, {
    x: px(40),
    y: y,
    w: px(400),
    h: px(80),
    text: '',
    normal_color: 0x000000,
    press_color: COLORS.BG_CARD_HOVER,
    click_func: function () {
      var app = getApp()
      app.globalData.currentTraining = _training
      push({ url: 'page/gt/pre-training/index' })
    },
  })
}

Page({
  onInit: function () {
    logger.debug("training-select onInit")
  },

  build: function () {
    logger.debug("training-select build START")

    // Title
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(0),
      y: px(40),
      w: W,
      h: px(40),
      text: 'Entrenamientos',
      text_size: px(FONT.MEDIUM),
      color: COLORS.WHITE,
      align_h: hmUI.align.CENTER_H,
    })

    var trainings = MOCK_TRAININGS
    var startY = px(100)
    var itemHeight = px(80)
    var gap = px(10)

    for (var i = 0; i < trainings.length; i++) {
      createTrainingItem(trainings[i], startY + i * (itemHeight + gap))
    }

    if (trainings.length === 0) {
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(40),
        y: px(200),
        w: px(400),
        h: px(80),
        text: 'No hay entrenamientos.\nCrea uno desde la web.',
        text_size: px(FONT.SMALL),
        color: COLORS.TEXT_SECONDARY,
        align_h: hmUI.align.CENTER_H,
        text_style: hmUI.text_style.WRAP,
      })
    }

    logger.debug("training-select build DONE")
  },

  onDestroy: function () {
    logger.debug("training-select onDestroy")
  },
})
