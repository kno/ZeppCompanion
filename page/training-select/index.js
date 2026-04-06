import { createWidget, widget, prop, align, text_style } from '@zos/ui'
import { push, back } from '@zos/router'
import { getApp } from '@zos/device'
import { BasePage } from '@zeppos/zml/base-page'
import { COLORS, FONT, SCREEN, LAYOUT } from '../../utils/constants'
import { getTrainingTypeName } from '../../utils/format'

var app = getApp()

// Mock data for initial development
var MOCK_TRAININGS = [
  { id: '1', name: 'Carrera suave 30min', type: 'cardio_continuous', durationMinutes: 30, paceGoalSecPerKm: 360 },
  { id: '2', name: 'Intervalos 4x400m', type: 'intervals', durationMinutes: 25, paceGoalSecPerKm: 270 },
  { id: '3', name: 'Trote libre', type: 'free', durationMinutes: 45, paceGoalSecPerKm: 0 },
]

Page(
  BasePage({
  state: {
    trainings: [],
  },

  onInit() {
    this.state.trainings = MOCK_TRAININGS
  },

  build() {
    // Title
    createWidget(widget.TEXT, {
      x: 0,
      y: 40,
      w: SCREEN.WIDTH,
      h: 40,
      text: 'Entrenamientos',
      text_size: FONT.MEDIUM,
      color: COLORS.WHITE,
      align_h: align.CENTER_H,
    })

    var trainings = this.state.trainings
    var startY = 100

    for (var i = 0; i < trainings.length; i++) {
      this._createTrainingItem(trainings[i], startY + i * (LAYOUT.LIST_ITEM_HEIGHT + 10))
    }

    // Empty state
    if (trainings.length === 0) {
      createWidget(widget.TEXT, {
        x: LAYOUT.CONTENT_LEFT,
        y: 200,
        w: LAYOUT.CONTENT_WIDTH,
        h: 80,
        text: 'No hay entrenamientos.\nCrea uno desde la web.',
        text_size: FONT.SMALL,
        color: COLORS.TEXT_SECONDARY,
        align_h: align.CENTER_H,
        text_style: text_style.WRAP,
      })
    }
  },

  _createTrainingItem(training, y) {
    // Card background
    createWidget(widget.FILL_RECT, {
      x: LAYOUT.CONTENT_LEFT,
      y: y,
      w: LAYOUT.CONTENT_WIDTH,
      h: LAYOUT.LIST_ITEM_HEIGHT,
      radius: LAYOUT.CARD_RADIUS,
      color: COLORS.BG_CARD,
    })

    // Training name
    createWidget(widget.TEXT, {
      x: LAYOUT.CONTENT_LEFT + 16,
      y: y + 10,
      w: LAYOUT.CONTENT_WIDTH - 32,
      h: 30,
      text: training.name,
      text_size: FONT.BODY,
      color: COLORS.WHITE,
    })

    // Type label
    var typeText = getTrainingTypeName(training.type)

    createWidget(widget.TEXT, {
      x: LAYOUT.CONTENT_LEFT + 16,
      y: y + 45,
      w: 200,
      h: 24,
      text: typeText,
      text_size: FONT.TINY,
      color: COLORS.TEXT_SECONDARY,
    })

    // Duration label
    var durationText = training.durationMinutes ? String(training.durationMinutes) + ' min' : ''

    createWidget(widget.TEXT, {
      x: LAYOUT.CONTENT_LEFT + LAYOUT.CONTENT_WIDTH - 100,
      y: y + 45,
      w: 84,
      h: 24,
      text: durationText,
      text_size: FONT.TINY,
      color: COLORS.ACCENT,
      align_h: align.RIGHT,
    })

    // Tap overlay button (transparent over the card)
    var _training = training
    createWidget(widget.BUTTON, {
      x: LAYOUT.CONTENT_LEFT,
      y: y,
      w: LAYOUT.CONTENT_WIDTH,
      h: LAYOUT.LIST_ITEM_HEIGHT,
      text: '',
      normal_color: 0x000000,
      press_color: COLORS.BG_CARD_HOVER,
      click_func: () => {
        app.globalData.currentTraining = _training
        push({ url: 'page/pre-training/index' })
      },
    })
  },
  })
)
