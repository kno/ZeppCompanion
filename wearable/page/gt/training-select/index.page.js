import * as hmUI from "@zos/ui"
import { px } from "@zos/utils"
import { getDeviceInfo } from "@zos/device"
import { replace } from "@zos/router"
import { getColors, applyBackground } from "../../../utils/theme"

const { width: W } = getDeviceInfo()

var FALLBACK_TRAININGS = [
  { id: "1", name: "Carrera suave", type: "cardio_continuous", durationMinutes: 30 },
  { id: "2", name: "Intervalos 4x400m", type: "intervals", durationMinutes: 25 },
  { id: "3", name: "Trote libre", type: "free", durationMinutes: 45 },
]

function getTypeInfo(type) {
  switch (type) {
    case "cardio_continuous":
      return { label: "Cardio", color: 0x4CAF50 }
    case "intervals":
      return { label: "Intervalos", color: 0xFF9800 }
    case "free":
      return { label: "Libre", color: 0x58D0FF }
    case "strength":
      return { label: "Fuerza", color: 0xE040FB }
    case "recovery":
      return { label: "Recuperacion", color: 0x5BE7A9 }
    default:
      return { label: "Entreno", color: 0x888888 }
  }
}

Page({
  build() {
    var COLORS = getColors()
    applyBackground()

    // Header
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0, y: px(20), w: W, h: px(30),
      text: "Elige tu entreno",
      text_size: px(24), color: COLORS.PRIMARY,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
    })

    // Separator
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: (W - px(120)) / 2, y: px(54),
      w: px(120), h: px(2),
      radius: px(1), color: COLORS.SEPARATOR,
    })

    var cardW = px(380)
    var cardH = px(76)
    var gap = px(8)
    var startY = px(68)
    var cardX = (W - cardW) / 2

    var app = getApp()
    var trainings = (app.globalData.trainings && app.globalData.trainings.length > 0)
      ? app.globalData.trainings
      : FALLBACK_TRAININGS

    for (var i = 0; i < trainings.length; i++) {
      var t = trainings[i]
      var cardY = startY + i * (cardH + gap)
      var typeInfo = getTypeInfo(t.type)

      var cardBg = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: cardX, y: cardY, w: cardW, h: cardH,
        radius: px(16), color: COLORS.BG_CARD,
      })

      cardBg.addEventListener(hmUI.event.CLICK_UP, (function (tr) {
        return function () {
          var app = getApp()
          app.globalData.currentTraining = tr
          replace({ url: "page/gt/pre-training/index.page" })
        }
      })(t))

      // Colored accent bar
      var accentPad = px(8)
      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: cardX + px(8), y: cardY + accentPad,
        w: px(4), h: cardH - accentPad * 2,
        radius: px(2), color: typeInfo.color,
      })

      // Training name
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: cardX + px(22), y: cardY + px(14),
        w: cardW - px(30) - px(60), h: px(26),
        text: t.name, text_size: px(20),
        color: COLORS.WHITE, align_h: hmUI.align.LEFT,
      })

      // Type label
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: cardX + px(22), y: cardY + px(44),
        w: px(120), h: px(20),
        text: typeInfo.label, text_size: px(14),
        color: typeInfo.color, align_h: hmUI.align.LEFT,
      })

      // Duration (right-aligned)
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: cardX + cardW - px(70), y: cardY + px(30),
        w: px(60), h: px(20),
        text: (t.durationMinutes || "?") + " min",
        text_size: px(14), color: COLORS.TEXT_SECONDARY,
        align_h: hmUI.align.RIGHT,
      })
    }

    // Bottom padding spacer
    var lastCardBottom = startY + trainings.length * (cardH + gap) + px(40)
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: lastCardBottom, w: 1, h: 1, color: COLORS.BG_DARK,
    })
  },
})
