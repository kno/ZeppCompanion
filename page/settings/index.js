import { createWidget, widget, prop, align, text_style } from '@zos/ui'
import { back } from '@zos/router'
import { getApp } from '@zos/device'
import { COLORS, FONT, SCREEN, LAYOUT } from '../../utils/constants'
import { MESSAGE_FREQUENCY } from '../../shared/protocol'

var app = getApp()

Page({
  state: {
    frequencyWidget: null,
    currentFrequency: 90,
  },

  onInit() {
    this.state.currentFrequency = app.globalData.userPreferences.messageFrequency || 90
  },

  build() {
    // Title
    createWidget(widget.TEXT, {
      x: 0,
      y: 50,
      w: SCREEN.WIDTH,
      h: 40,
      text: 'Configuracion',
      text_size: FONT.MEDIUM,
      color: COLORS.WHITE,
      align_h: align.CENTER_H,
    })

    // Section label
    createWidget(widget.TEXT, {
      x: LAYOUT.CONTENT_LEFT,
      y: 120,
      w: LAYOUT.CONTENT_WIDTH,
      h: 24,
      text: 'Frecuencia de mensajes',
      text_size: FONT.SMALL,
      color: COLORS.TEXT_SECONDARY,
    })

    // Current frequency display (updatable)
    this.state.frequencyWidget = createWidget(widget.TEXT, {
      x: 0,
      y: 155,
      w: SCREEN.WIDTH,
      h: 35,
      text: this._getFrequencyLabel(this.state.currentFrequency),
      text_size: FONT.BODY,
      color: COLORS.ACCENT,
      align_h: align.CENTER_H,
    })

    // Alta button
    createWidget(widget.BUTTON, {
      x: 50,
      y: 205,
      w: 110,
      h: 45,
      text: 'Alta',
      text_size: FONT.TINY,
      radius: 22,
      normal_color: COLORS.BG_CARD,
      press_color: COLORS.PRIMARY,
      click_func: () => {
        this._setFrequency(MESSAGE_FREQUENCY.HIGH)
      },
    })

    // Media button
    createWidget(widget.BUTTON, {
      x: 185,
      y: 205,
      w: 110,
      h: 45,
      text: 'Media',
      text_size: FONT.TINY,
      radius: 22,
      normal_color: COLORS.BG_CARD,
      press_color: COLORS.PRIMARY,
      click_func: () => {
        this._setFrequency(MESSAGE_FREQUENCY.MEDIUM)
      },
    })

    // Baja button
    createWidget(widget.BUTTON, {
      x: 320,
      y: 205,
      w: 110,
      h: 45,
      text: 'Baja',
      text_size: FONT.TINY,
      radius: 22,
      normal_color: COLORS.BG_CARD,
      press_color: COLORS.PRIMARY,
      click_func: () => {
        this._setFrequency(MESSAGE_FREQUENCY.LOW)
      },
    })

    // Version info
    createWidget(widget.TEXT, {
      x: 0,
      y: 380,
      w: SCREEN.WIDTH,
      h: 24,
      text: 'ZeppCompanion v1.0.0',
      text_size: FONT.TINY,
      color: COLORS.TEXT_DIMMED,
      align_h: align.CENTER_H,
    })

    // Back button
    createWidget(widget.BUTTON, {
      x: LAYOUT.BUTTON_LEFT,
      y: 415,
      w: LAYOUT.BUTTON_WIDTH,
      h: 50,
      text: 'Volver',
      text_size: FONT.BODY,
      radius: LAYOUT.BUTTON_RADIUS,
      normal_color: COLORS.BG_CARD,
      press_color: COLORS.BG_CARD_HOVER,
      click_func: () => {
        back()
      },
    })
  },

  _setFrequency(freq) {
    this.state.currentFrequency = freq
    app.globalData.userPreferences.messageFrequency = freq
    if (this.state.frequencyWidget) {
      this.state.frequencyWidget.setProperty(prop.TEXT, this._getFrequencyLabel(freq))
    }
  },

  _getFrequencyLabel(freq) {
    if (freq <= 60) return 'Alta (cada 60s)'
    if (freq <= 90) return 'Media (cada 90s)'
    return 'Baja (cada 120s)'
  },
})
