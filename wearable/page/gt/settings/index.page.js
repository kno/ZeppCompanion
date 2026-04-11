import * as hmUI from "@zos/ui"
import { log as Logger } from "@zos/utils"
import { px } from "@zos/utils"
import { getDeviceInfo } from "@zos/device"
import { back } from "@zos/router"
import { getColors, applyBackground } from "../../../utils/theme"
import { savePreferences } from "../../../utils/preferences"
import { createGpsStatusWidget } from "../../../components/gps-status-widget"

const logger = Logger.getLogger("settings")
const { width: W } = getDeviceInfo()

const FONT = {
  MEDIUM: 28,
  BODY: 24,
  SMALL: 20,
  TINY: 16,
}

const MESSAGE_FREQUENCY = {
  HIGH: 60,
  MEDIUM: 90,
  LOW: 120,
}

let COLORS = {}

// Widget references for dynamic color updates
let toggleWidgets = []

function getFrequencyLabel(freq) {
  if (freq <= 60) return "Alta (cada 60s)"
  if (freq <= 90) return "Media (cada 90s)"
  return "Baja (cada 120s)"
}

// Create a pill-shaped button using FILL_RECT + TEXT + click handler
// Returns { bg, text } widget references
function createPillButton(x, y, w, h, label, isActive, onClick) {
  var bg = hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: px(x),
    y: px(y),
    w: px(w),
    h: px(h),
    radius: px(h / 2),
    color: isActive ? COLORS.PRIMARY : COLORS.BG_CARD,
  })

  var txt = hmUI.createWidget(hmUI.widget.TEXT, {
    x: px(x),
    y: px(y),
    w: px(w),
    h: px(h),
    text: label,
    text_size: px(FONT.TINY),
    color: COLORS.WHITE,
    align_h: hmUI.align.CENTER_H,
    align_v: hmUI.align.CENTER_V,
  })

  bg.addEventListener(hmUI.event.CLICK_UP, onClick)
  txt.addEventListener(hmUI.event.CLICK_UP, onClick)

  return { bg: bg }
}

function setActive(activeBtn, inactiveBtn) {
  if (activeBtn) activeBtn.bg.setProperty(hmUI.prop.COLOR, COLORS.PRIMARY)
  if (inactiveBtn) inactiveBtn.bg.setProperty(hmUI.prop.COLOR, COLORS.BG_CARD)
}

function setActiveFreq(activeBtn, others) {
  if (activeBtn) activeBtn.bg.setProperty(hmUI.prop.COLOR, COLORS.PRIMARY)
  for (var i = 0; i < others.length; i++) {
    others[i].bg.setProperty(hmUI.prop.COLOR, COLORS.BG_CARD)
  }
}

// GPS status widget reference
var gpsWidget = null

// Store all pill button references for cleanup
var darkOnPill = null, darkOffPill = null
var msgOnPill = null, msgOffPill = null
var audioOnPill = null, audioOffPill = null
var freqHighPill = null, freqMedPill = null, freqLowPill = null
var freqLabelWidget = null

Page({
  onInit() {
    logger.debug("settings onInit")
  },

  build() {
    logger.debug("settings build START")

    COLORS = getColors()
    applyBackground()
    gpsWidget = createGpsStatusWidget()
    var app = getApp()
    var prefs = app.globalData.userPreferences || {}

    // ── Title ────────────────────────────────────────────────────────────
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(0),
      y: px(50),
      w: W,
      h: px(40),
      text: "Configuracion",
      text_size: px(FONT.MEDIUM),
      color: COLORS.WHITE,
      align_h: hmUI.align.CENTER_H,
    })

    // ── Section: Modo visual ─────────────────────────────────────────────
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(40), y: px(120), w: px(400), h: px(24),
      text: "Modo visual",
      text_size: px(FONT.SMALL),
      color: COLORS.TEXT_SECONDARY,
    })

    darkOnPill = createPillButton(110, 155, 140, 45, "Oscuro", prefs.darkMode !== false, function () {
      var a = getApp()
      a.globalData.userPreferences.darkMode = true
      savePreferences(a.globalData.userPreferences)
      COLORS = getColors()
      setActive(darkOnPill, darkOffPill)
    })
    darkOffPill = createPillButton(260, 155, 140, 45, "Claro", prefs.darkMode === false, function () {
      var a = getApp()
      a.globalData.userPreferences.darkMode = false
      savePreferences(a.globalData.userPreferences)
      COLORS = getColors()
      setActive(darkOffPill, darkOnPill)
    })

    // ── Section: Mensajes motivadores ─────────────────────────────────────
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(40), y: px(220), w: px(400), h: px(24),
      text: "Mensajes motivadores",
      text_size: px(FONT.SMALL),
      color: COLORS.TEXT_SECONDARY,
    })

    msgOnPill = createPillButton(110, 255, 140, 45, "ON", prefs.enableCompanionMessages !== false, function () {
      var a = getApp()
      a.globalData.userPreferences.enableCompanionMessages = true
      savePreferences(a.globalData.userPreferences)
      setActive(msgOnPill, msgOffPill)
    })
    msgOffPill = createPillButton(260, 255, 140, 45, "OFF", prefs.enableCompanionMessages === false, function () {
      var a = getApp()
      a.globalData.userPreferences.enableCompanionMessages = false
      savePreferences(a.globalData.userPreferences)
      setActive(msgOffPill, msgOnPill)
    })

    // ── Section: Audio ────────────────────────────────────────────────────
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(40), y: px(320), w: px(400), h: px(24),
      text: "Audio de companero",
      text_size: px(FONT.SMALL),
      color: COLORS.TEXT_SECONDARY,
    })

    audioOnPill = createPillButton(110, 355, 140, 45, "ON", prefs.enableAudioMessages !== false, function () {
      var a = getApp()
      a.globalData.userPreferences.enableAudioMessages = true
      savePreferences(a.globalData.userPreferences)
      setActive(audioOnPill, audioOffPill)
    })
    audioOffPill = createPillButton(260, 355, 140, 45, "OFF", prefs.enableAudioMessages === false, function () {
      var a = getApp()
      a.globalData.userPreferences.enableAudioMessages = false
      savePreferences(a.globalData.userPreferences)
      setActive(audioOffPill, audioOnPill)
    })

    // ── Section: Frecuencia ───────────────────────────────────────────────
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(40), y: px(420), w: px(400), h: px(24),
      text: "Frecuencia de mensajes",
      text_size: px(FONT.SMALL),
      color: COLORS.TEXT_SECONDARY,
    })

    freqLabelWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(0), y: px(452), w: W, h: px(30),
      text: getFrequencyLabel(prefs.messageFrequency || 90),
      text_size: px(FONT.BODY),
      color: COLORS.ACCENT,
      align_h: hmUI.align.CENTER_H,
    })

    var currentFreq = prefs.messageFrequency || 90

    freqHighPill = createPillButton(50, 492, 110, 45, "Alta", currentFreq <= 60, function () {
      var a = getApp()
      a.globalData.userPreferences.messageFrequency = MESSAGE_FREQUENCY.HIGH
      savePreferences(a.globalData.userPreferences)
      freqLabelWidget.setProperty(hmUI.prop.TEXT, getFrequencyLabel(MESSAGE_FREQUENCY.HIGH))
      setActiveFreq(freqHighPill, [freqMedPill, freqLowPill])
    })
    freqMedPill = createPillButton(185, 492, 110, 45, "Media", currentFreq > 60 && currentFreq <= 90, function () {
      var a = getApp()
      a.globalData.userPreferences.messageFrequency = MESSAGE_FREQUENCY.MEDIUM
      savePreferences(a.globalData.userPreferences)
      freqLabelWidget.setProperty(hmUI.prop.TEXT, getFrequencyLabel(MESSAGE_FREQUENCY.MEDIUM))
      setActiveFreq(freqMedPill, [freqHighPill, freqLowPill])
    })
    freqLowPill = createPillButton(320, 492, 110, 45, "Baja", currentFreq > 90, function () {
      var a = getApp()
      a.globalData.userPreferences.messageFrequency = MESSAGE_FREQUENCY.LOW
      savePreferences(a.globalData.userPreferences)
      freqLabelWidget.setProperty(hmUI.prop.TEXT, getFrequencyLabel(MESSAGE_FREQUENCY.LOW))
      setActiveFreq(freqLowPill, [freqHighPill, freqMedPill])
    })

    // ── Version ───────────────────────────────────────────────────────────
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(0), y: px(560), w: W, h: px(24),
      text: "ZeppCompanion v1.0.0",
      text_size: px(FONT.TINY),
      color: COLORS.TEXT_DIMMED,
      align_h: hmUI.align.CENTER_H,
    })

    // ── Back button ───────────────────────────────────────────────────────
    var backBg = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: px(90), y: px(595), w: px(300), h: px(50),
      radius: px(30),
      color: COLORS.BG_CARD,
    })
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(90), y: px(595), w: px(300), h: px(50),
      text: "Volver",
      text_size: px(FONT.BODY),
      color: COLORS.WHITE,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
    }).addEventListener(hmUI.event.CLICK_UP, function () { back() })
    backBg.addEventListener(hmUI.event.CLICK_UP, function () { back() })

    logger.debug("settings build DONE")
  },

  onDestroy() {
    logger.debug("settings onDestroy")
    if (gpsWidget) {
      gpsWidget.destroy()
      gpsWidget = null
    }
    darkOnPill = null
    darkOffPill = null
    msgOnPill = null
    msgOffPill = null
    audioOnPill = null
    audioOffPill = null
    freqHighPill = null
    freqMedPill = null
    freqLowPill = null
    freqLabelWidget = null
  },
})
