import { createWidget, widget, prop, align, text_style } from '@zos/ui'
import { push } from '@zos/router'
import { BasePage } from '@zeppos/zml/base-page'
import { COLORS, FONT, SCREEN, LAYOUT } from '../../utils/constants'

Page(
  BasePage({
  build() {
    // Title
    createWidget(widget.TEXT, {
      x: 0,
      y: 60,
      w: SCREEN.WIDTH,
      h: 50,
      text: 'ZeppCompanion',
      text_size: FONT.TITLE,
      color: COLORS.WHITE,
      align_h: align.CENTER_H,
    })

    // Subtitle
    createWidget(widget.TEXT, {
      x: 0,
      y: 110,
      w: SCREEN.WIDTH,
      h: 30,
      text: 'Tu companero de entrenamiento',
      text_size: FONT.TINY,
      color: COLORS.TEXT_SECONDARY,
      align_h: align.CENTER_H,
    })

    // Mascot placeholder circle (will be IMG_ANIM later)
    createWidget(widget.CIRCLE, {
      center_x: SCREEN.CENTER_X,
      center_y: 200,
      radius: 50,
      color: COLORS.PRIMARY,
    })

    // Paw icon label inside circle
    createWidget(widget.TEXT, {
      x: 0,
      y: 182,
      w: SCREEN.WIDTH,
      h: 36,
      text: 'ZEEP',
      text_size: FONT.TINY,
      color: COLORS.WHITE,
      align_h: align.CENTER_H,
    })

    // Button: Iniciar Entrenamiento
    createWidget(widget.BUTTON, {
      x: LAYOUT.BUTTON_LEFT,
      y: 275,
      w: LAYOUT.BUTTON_WIDTH,
      h: LAYOUT.BUTTON_HEIGHT,
      text: 'Iniciar Entrenamiento',
      text_size: FONT.BODY,
      radius: LAYOUT.BUTTON_RADIUS,
      normal_color: COLORS.PRIMARY,
      press_color: COLORS.PRIMARY_DARK,
      click_func: () => {
        push({ url: 'page/training-select/index' })
      },
    })

    // Button: Historial
    createWidget(widget.BUTTON, {
      x: LAYOUT.BUTTON_LEFT,
      y: 350,
      w: LAYOUT.BUTTON_WIDTH,
      h: 50,
      text: 'Historial',
      text_size: FONT.SMALL,
      radius: LAYOUT.BUTTON_RADIUS,
      normal_color: COLORS.BG_CARD,
      press_color: COLORS.BG_CARD_HOVER,
      click_func: () => {
        console.log('Historial - coming soon')
      },
    })

    // Button: Configuracion
    createWidget(widget.BUTTON, {
      x: LAYOUT.BUTTON_LEFT,
      y: 410,
      w: LAYOUT.BUTTON_WIDTH,
      h: 50,
      text: 'Configuracion',
      text_size: FONT.SMALL,
      radius: LAYOUT.BUTTON_RADIUS,
      normal_color: COLORS.BG_CARD,
      press_color: COLORS.BG_CARD_HOVER,
      click_func: () => {
        push({ url: 'page/settings/index' })
      },
    })
  },
  })
)
