import { createWidget, widget, prop, align, text_style } from '@zos/ui'
import { push, back } from '@zos/router'
import { getApp } from '@zos/device'
import { BasePage } from '@zeppos/zml/base-page'
import { COLORS, FONT, SCREEN, LAYOUT } from '../../utils/constants'
import { formatPace, getTrainingTypeName } from '../../utils/format'

var app = getApp()

Page(
  BasePage({
  build() {
    var training = app.globalData.currentTraining

    if (!training) {
      createWidget(widget.TEXT, {
        x: 0,
        y: 200,
        w: SCREEN.WIDTH,
        h: 40,
        text: 'Error: sin entrenamiento',
        text_size: FONT.BODY,
        color: COLORS.ERROR_RED,
        align_h: align.CENTER_H,
      })
      return
    }

    // Training name
    createWidget(widget.TEXT, {
      x: 0,
      y: 50,
      w: SCREEN.WIDTH,
      h: 40,
      text: training.name,
      text_size: FONT.MEDIUM,
      color: COLORS.WHITE,
      align_h: align.CENTER_H,
    })

    // Type badge background
    createWidget(widget.FILL_RECT, {
      x: 170,
      y: 100,
      w: 140,
      h: 32,
      radius: 16,
      color: COLORS.PRIMARY,
    })

    // Type badge label
    createWidget(widget.TEXT, {
      x: 170,
      y: 104,
      w: 140,
      h: 24,
      text: getTrainingTypeName(training.type),
      text_size: FONT.TINY,
      color: COLORS.WHITE,
      align_h: align.CENTER_H,
    })

    // Detail rows — rendered sequentially, y tracked manually
    var detailY = 155

    if (training.durationMinutes) {
      createWidget(widget.TEXT, {
        x: LAYOUT.CONTENT_LEFT,
        y: detailY,
        w: LAYOUT.CONTENT_WIDTH,
        h: 30,
        text: 'Duracion: ' + String(training.durationMinutes) + ' min',
        text_size: FONT.BODY,
        color: COLORS.TEXT_PRIMARY,
        align_h: align.CENTER_H,
      })
      detailY = detailY + 40
    }

    if (training.distanceMeters) {
      createWidget(widget.TEXT, {
        x: LAYOUT.CONTENT_LEFT,
        y: detailY,
        w: LAYOUT.CONTENT_WIDTH,
        h: 30,
        text: 'Distancia: ' + (training.distanceMeters / 1000).toFixed(1) + ' km',
        text_size: FONT.BODY,
        color: COLORS.TEXT_PRIMARY,
        align_h: align.CENTER_H,
      })
      detailY = detailY + 40
    }

    if (training.paceGoalSecPerKm && training.paceGoalSecPerKm > 0) {
      createWidget(widget.TEXT, {
        x: LAYOUT.CONTENT_LEFT,
        y: detailY,
        w: LAYOUT.CONTENT_WIDTH,
        h: 30,
        text: 'Ritmo objetivo: ' + formatPace(training.paceGoalSecPerKm),
        text_size: FONT.BODY,
        color: COLORS.TEXT_PRIMARY,
        align_h: align.CENTER_H,
      })
      detailY = detailY + 40
    }

    // Encouraging message
    createWidget(widget.TEXT, {
      x: 0,
      y: detailY + 10,
      w: SCREEN.WIDTH,
      h: 30,
      text: 'Preparado para entrenar!',
      text_size: FONT.SMALL,
      color: COLORS.WARNING_YELLOW,
      align_h: align.CENTER_H,
    })

    // COMENZAR button
    createWidget(widget.BUTTON, {
      x: LAYOUT.BUTTON_LEFT,
      y: 380,
      w: LAYOUT.BUTTON_WIDTH,
      h: 70,
      text: 'COMENZAR',
      text_size: FONT.MEDIUM,
      radius: 35,
      normal_color: COLORS.PRIMARY,
      press_color: COLORS.PRIMARY_DARK,
      click_func: () => {
        app.globalData.trainingSession = {
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
        push({ url: 'page/active-training/index' })
      },
    })
  },
  })
)
