import { createWidget, widget, prop, align, text_style } from '@zos/ui'
import { replace } from '@zos/router'
import { getApp } from '@zos/device'
import { COLORS, FONT, SCREEN, LAYOUT } from '../../utils/constants'
import { formatTimeLong, formatPace, formatDistance, formatHR } from '../../utils/format'

var app = getApp()

Page({
  build() {
    var session = app.globalData.trainingSession
    var training = app.globalData.currentTraining

    // Title
    createWidget(widget.TEXT, {
      x: 0,
      y: 30,
      w: SCREEN.WIDTH,
      h: 40,
      text: 'Resumen',
      text_size: FONT.TITLE,
      color: COLORS.WHITE,
      align_h: align.CENTER_H,
    })

    // Training name subtitle
    createWidget(widget.TEXT, {
      x: 0,
      y: 75,
      w: SCREEN.WIDTH,
      h: 30,
      text: training ? training.name : 'Entrenamiento',
      text_size: FONT.SMALL,
      color: COLORS.TEXT_SECONDARY,
      align_h: align.CENTER_H,
    })

    // Compute averages
    var elapsedMs = session ? session.elapsedMs : 0
    var avgHR = 0

    if (session && session.hrReadings && session.hrReadings.length > 0) {
      var sum = 0
      for (var i = 0; i < session.hrReadings.length; i++) {
        sum = sum + session.hrReadings[i]
      }
      avgHR = Math.round(sum / session.hrReadings.length)
    }

    // Total time value
    createWidget(widget.TEXT, {
      x: 0,
      y: 120,
      w: SCREEN.WIDTH,
      h: 50,
      text: formatTimeLong(elapsedMs),
      text_size: FONT.LARGE,
      color: COLORS.WHITE,
      align_h: align.CENTER_H,
    })

    // Total time label
    createWidget(widget.TEXT, {
      x: 0,
      y: 170,
      w: SCREEN.WIDTH,
      h: 24,
      text: 'Tiempo total',
      text_size: FONT.TINY,
      color: COLORS.TEXT_SECONDARY,
      align_h: align.CENTER_H,
    })

    // --- Stats row: Distance (left column) ---
    createWidget(widget.TEXT, {
      x: 40,
      y: 210,
      w: 180,
      h: 30,
      text: formatDistance(session ? session.distanceMeters : 0),
      text_size: FONT.BODY,
      color: COLORS.ACCENT,
      align_h: align.CENTER_H,
    })

    createWidget(widget.TEXT, {
      x: 40,
      y: 240,
      w: 180,
      h: 20,
      text: 'Distancia',
      text_size: FONT.TINY,
      color: COLORS.TEXT_SECONDARY,
      align_h: align.CENTER_H,
    })

    // --- Stats row: Avg HR (right column) ---
    createWidget(widget.TEXT, {
      x: 260,
      y: 210,
      w: 180,
      h: 30,
      text: avgHR > 0 ? String(avgHR) + ' bpm' : '-- bpm',
      text_size: FONT.BODY,
      color: COLORS.HR_RED,
      align_h: align.CENTER_H,
    })

    createWidget(widget.TEXT, {
      x: 260,
      y: 240,
      w: 180,
      h: 20,
      text: 'FC Media',
      text_size: FONT.TINY,
      color: COLORS.TEXT_SECONDARY,
      align_h: align.CENTER_H,
    })

    // Avg Pace value
    createWidget(widget.TEXT, {
      x: 0,
      y: 280,
      w: SCREEN.WIDTH,
      h: 30,
      text: formatPace(session ? session.currentPace : 0),
      text_size: FONT.BODY,
      color: COLORS.PACE_BLUE,
      align_h: align.CENTER_H,
    })

    // Avg Pace label
    createWidget(widget.TEXT, {
      x: 0,
      y: 310,
      w: SCREEN.WIDTH,
      h: 20,
      text: 'Ritmo medio',
      text_size: FONT.TINY,
      color: COLORS.TEXT_SECONDARY,
      align_h: align.CENTER_H,
    })

    // Companion final message
    createWidget(widget.TEXT, {
      x: LAYOUT.CONTENT_LEFT,
      y: 345,
      w: LAYOUT.CONTENT_WIDTH,
      h: 50,
      text: 'Gran trabajo! Has completado tu entrenamiento.',
      text_size: FONT.SMALL,
      color: COLORS.WARNING_YELLOW,
      align_h: align.CENTER_H,
      text_style: text_style.WRAP,
    })

    // Volver button
    createWidget(widget.BUTTON, {
      x: LAYOUT.BUTTON_LEFT,
      y: 405,
      w: LAYOUT.BUTTON_WIDTH,
      h: 55,
      text: 'Volver al inicio',
      text_size: FONT.BODY,
      radius: LAYOUT.BUTTON_RADIUS,
      normal_color: COLORS.BG_CARD,
      press_color: COLORS.BG_CARD_HOVER,
      click_func: () => {
        app.globalData.trainingSession = null
        app.globalData.currentTraining = null
        replace({ url: 'page/home/index' })
      },
    })
  },
})
