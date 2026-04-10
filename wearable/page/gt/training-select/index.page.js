import * as hmUI from "@zos/ui"
import { px } from "@zos/utils"
import { getDeviceInfo } from "@zos/device"
import { replace } from "@zos/router"

const { width: W } = getDeviceInfo()

var FALLBACK_TRAININGS = [
  { id: "1", name: "Carrera suave", type: "cardio_continuous", durationMinutes: 30 },
  { id: "2", name: "Intervalos 4x400m", type: "intervals", durationMinutes: 25 },
  { id: "3", name: "Trote libre", type: "free", durationMinutes: 45 },
]

Page({
  build() {
    // Header
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0,
      y: px(20),
      w: W,
      h: px(30),
      text: "Elige tu entreno",
      text_size: px(24),
      color: 0x4CAF50,
      align_h: hmUI.align.CENTER_H,
    })

    // Render cards
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

      var cardBg = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: cardX,
        y: cardY,
        w: cardW,
        h: cardH,
        radius: px(16),
        color: 0x1A1A1A,
      })

      cardBg.addEventListener(hmUI.event.CLICK_UP, (function (tr) {
        return function () {
          var app = getApp()
          app.globalData.currentTraining = tr
          replace({ url: "page/gt/pre-training/index.page" })
        }
      })(t))

      hmUI.createWidget(hmUI.widget.TEXT, {
        x: cardX + px(22),
        y: cardY + px(14),
        w: cardW - px(90),
        h: px(26),
        text: t.name,
        text_size: px(20),
        color: 0xFFFFFF,
        align_h: hmUI.align.LEFT,
      })

      hmUI.createWidget(hmUI.widget.TEXT, {
        x: cardX + px(22),
        y: cardY + px(44),
        w: px(120),
        h: px(20),
        text: t.durationMinutes + " min",
        text_size: px(14),
        color: 0x999999,
        align_h: hmUI.align.LEFT,
      })
    }
  },
})
