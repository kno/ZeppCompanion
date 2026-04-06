import * as hmUI from "@zos/ui"
import { log as Logger } from "@zos/utils"
import { px } from "@zos/utils"
import { getDeviceInfo } from "@zos/device"
import { back } from "@zos/router"

var logger = Logger.getLogger("settings")
var devInfo = getDeviceInfo()
var W = devInfo.width

var COLORS = {
  WHITE: 0xFFFFFF,
  TEXT_SECONDARY: 0x999999,
  TEXT_DIMMED: 0x666666,
  ACCENT: 0x58D0FF,
  PRIMARY: 0x4CAF50,
  BG_CARD: 0x1A1A1A,
  BG_CARD_HOVER: 0x2A2A2A,
}

var FONT = {
  MEDIUM: 28,
  BODY: 24,
  SMALL: 20,
  TINY: 16,
}

var MESSAGE_FREQUENCY = {
  HIGH: 60,
  MEDIUM: 90,
  LOW: 120,
}

// Module-level state so callbacks can reference it
var frequencyWidget = null
var currentFrequency = 90

function getFrequencyLabel(freq) {
  if (freq <= 60) return 'Alta (cada 60s)'
  if (freq <= 90) return 'Media (cada 90s)'
  return 'Baja (cada 120s)'
}

function setFrequency(freq) {
  currentFrequency = freq
  var app = getApp()
  if (app.globalData.userPreferences) {
    app.globalData.userPreferences.messageFrequency = freq
  }
  if (frequencyWidget) {
    frequencyWidget.setProperty(hmUI.prop.TEXT, getFrequencyLabel(freq))
  }
}

Page({
  onInit: function () {
    logger.debug("settings onInit")
    var app = getApp()
    if (app.globalData.userPreferences) {
      currentFrequency = app.globalData.userPreferences.messageFrequency || 90
    }
    frequencyWidget = null
  },

  build: function () {
    logger.debug("settings build START")

    // Title
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(0),
      y: px(50),
      w: W,
      h: px(40),
      text: 'Configuracion',
      text_size: px(FONT.MEDIUM),
      color: COLORS.WHITE,
      align_h: hmUI.align.CENTER_H,
    })

    // Section label
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(40),
      y: px(120),
      w: px(400),
      h: px(24),
      text: 'Frecuencia de mensajes',
      text_size: px(FONT.SMALL),
      color: COLORS.TEXT_SECONDARY,
    })

    // Current frequency display (updatable)
    frequencyWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(0),
      y: px(155),
      w: W,
      h: px(35),
      text: getFrequencyLabel(currentFrequency),
      text_size: px(FONT.BODY),
      color: COLORS.ACCENT,
      align_h: hmUI.align.CENTER_H,
    })

    // Alta button
    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: px(50),
      y: px(205),
      w: px(110),
      h: px(45),
      text: 'Alta',
      text_size: px(FONT.TINY),
      radius: px(22),
      normal_color: COLORS.BG_CARD,
      press_color: COLORS.PRIMARY,
      click_func: function () {
        setFrequency(MESSAGE_FREQUENCY.HIGH)
      },
    })

    // Media button
    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: px(185),
      y: px(205),
      w: px(110),
      h: px(45),
      text: 'Media',
      text_size: px(FONT.TINY),
      radius: px(22),
      normal_color: COLORS.BG_CARD,
      press_color: COLORS.PRIMARY,
      click_func: function () {
        setFrequency(MESSAGE_FREQUENCY.MEDIUM)
      },
    })

    // Baja button
    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: px(320),
      y: px(205),
      w: px(110),
      h: px(45),
      text: 'Baja',
      text_size: px(FONT.TINY),
      radius: px(22),
      normal_color: COLORS.BG_CARD,
      press_color: COLORS.PRIMARY,
      click_func: function () {
        setFrequency(MESSAGE_FREQUENCY.LOW)
      },
    })

    // Version info
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(0),
      y: px(380),
      w: W,
      h: px(24),
      text: 'ZeepCompanion v1.0.0',
      text_size: px(FONT.TINY),
      color: COLORS.TEXT_DIMMED,
      align_h: hmUI.align.CENTER_H,
    })

    // Back button
    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: px(90),
      y: px(415),
      w: px(300),
      h: px(50),
      text: 'Volver',
      text_size: px(FONT.BODY),
      radius: px(30),
      normal_color: COLORS.BG_CARD,
      press_color: COLORS.BG_CARD_HOVER,
      click_func: function () {
        back()
      },
    })

    logger.debug("settings build DONE")
  },

  onDestroy: function () {
    logger.debug("settings onDestroy")
    frequencyWidget = null
  },
})
