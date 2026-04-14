import * as hmUI from "@zos/ui"
import { px } from "@zos/utils"
import { replace } from "@zos/router"
import { getColors, applyBackground } from "../../../utils/theme"
import { createGpsStatusWidget } from "../../../components/gps-status-widget"
import {
  DEVICE_WIDTH,
  HEADER_STYLE,
  SEPARATOR_STYLE,
  CARD_DIMS,
  ACCENT_BAR,
  CARD_NAME_STYLE,
  CARD_TYPE_STYLE,
  CARD_DURATION_STYLE,
} from "zosLoader:./index.page.[pf].layout.js"
import { getTypeInfo } from "../../../utils/training-types"

var gpsWidget = null

var FALLBACK_TRAININGS = [
  { id: "1", name: "Carrera suave", type: "cardio_continuous", durationMinutes: 30 },
  { id: "2", name: "Intervalos 4x400m", type: "intervals", durationMinutes: 25 },
  { id: "3", name: "Trote libre", type: "free", durationMinutes: 45 },
]

Page({
  build() {
    var COLORS = getColors()
    applyBackground()

    // Header
    hmUI.createWidget(hmUI.widget.TEXT, {
      ...HEADER_STYLE,
      text: "Elige tu entreno",
    })

    // Separator
    hmUI.createWidget(hmUI.widget.FILL_RECT, SEPARATOR_STYLE)

    var app = getApp()
    var trainings = (app.globalData.trainings && app.globalData.trainings.length > 0)
      ? app.globalData.trainings
      : FALLBACK_TRAININGS

    for (var i = 0; i < trainings.length; i++) {
      var t = trainings[i]
      var cardY = CARD_DIMS.startY + i * (CARD_DIMS.h + CARD_DIMS.gap)
      var typeInfo = getTypeInfo(t.type)

      var cardBg = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: CARD_DIMS.x, y: cardY, w: CARD_DIMS.w, h: CARD_DIMS.h,
        radius: CARD_DIMS.radius, color: CARD_DIMS.color,
      })

      cardBg.addEventListener(hmUI.event.CLICK_UP, (function (tr) {
        return function () {
          var app = getApp()
          app.globalData.currentTraining = tr
          replace({ url: "page/gt/pre-training/index.page" })
        }
      })(t))

      // Colored accent bar
      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: CARD_DIMS.x + px(8), y: cardY + ACCENT_BAR.pad,
        w: ACCENT_BAR.w, h: CARD_DIMS.h - ACCENT_BAR.pad * 2,
        radius: ACCENT_BAR.radius, color: typeInfo.color,
      })

      // Training name
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: CARD_DIMS.x + CARD_NAME_STYLE.offsetX, y: cardY + CARD_NAME_STYLE.offsetY,
        w: CARD_DIMS.w - px(30) - px(60), h: CARD_NAME_STYLE.h,
        text: t.name, text_size: CARD_NAME_STYLE.text_size,
        color: CARD_NAME_STYLE.color, align_h: CARD_NAME_STYLE.align_h,
      })

      // Type label
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: CARD_DIMS.x + CARD_TYPE_STYLE.offsetX, y: cardY + CARD_TYPE_STYLE.offsetY,
        w: CARD_TYPE_STYLE.w, h: CARD_TYPE_STYLE.h,
        text: typeInfo.label, text_size: CARD_TYPE_STYLE.text_size,
        color: typeInfo.color, align_h: CARD_TYPE_STYLE.align_h,
      })

      // Duration (right-aligned)
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: CARD_DIMS.x + CARD_DIMS.w - CARD_DURATION_STYLE.offsetW, y: cardY + CARD_DURATION_STYLE.offsetY,
        w: CARD_DURATION_STYLE.w, h: CARD_DURATION_STYLE.h,
        text: (t.durationMinutes || "?") + " min",
        text_size: CARD_DURATION_STYLE.text_size, color: CARD_DURATION_STYLE.color,
        align_h: CARD_DURATION_STYLE.align_h,
      })
    }

    // Bottom padding spacer
    var lastCardBottom = CARD_DIMS.startY + trainings.length * (CARD_DIMS.h + CARD_DIMS.gap) + px(40)
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: lastCardBottom, w: 1, h: 1, color: COLORS.BG_DARK,
    })

    // GPS status indicator (created last for highest z-order)
    gpsWidget = createGpsStatusWidget()
  },

  onDestroy() {
    if (gpsWidget) {
      gpsWidget.destroy()
      gpsWidget = null
    }
  },
})
