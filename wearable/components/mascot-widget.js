import * as hmUI from "@zos/ui"
import { createTimer, stopTimer } from "@zos/timer"

var MASCOT_FRAMES = {
  neutro: [
    'mascot/mascota_neutro_f01.png',
    'mascot/mascota_neutro_f02.png',
    'mascot/mascota_neutro_f03.png',
    'mascot/mascota_neutro_f04.png',
    'mascot/mascota_neutro_f05.png',
  ],
  hablar: [
    'mascot/mascota_hablar_f01.png',
    'mascot/mascota_hablar_f02.png',
    'mascot/mascota_hablar_f03.png',
    'mascot/mascota_hablar_f04.png',
    'mascot/mascota_hablar_f05.png',
    'mascot/mascota_hablar_f06.png',
    'mascot/mascota_hablar_f07.png',
  ],
  feliz: [
    'mascot/mascota_feliz_f01.png',
    'mascot/mascota_feliz_f02.png',
    'mascot/mascota_feliz_f03.png',
    'mascot/mascota_feliz_f04.png',
    'mascot/mascota_feliz_f05.png',
    'mascot/mascota_feliz_f06.png',
    'mascot/mascota_feliz_f07.png',
  ],
  triste: [
    'mascot/mascota_triste_f01.png',
    'mascot/mascota_triste_f02.png',
    'mascot/mascota_triste_f03.png',
    'mascot/mascota_triste_f04.png',
    'mascot/mascota_triste_f05.png',
    'mascot/mascota_triste_f06.png',
    'mascot/mascota_triste_f07.png',
  ],
}

export function createMascotWidget(options) {
  var x = options.x
  var y = options.y
  var w = options.w
  var h = options.h
  var mood = options.initialMood || 'neutro'
  var frameIdx = 0
  var timerId = null

  var imgWidget = hmUI.createWidget(hmUI.widget.IMG, {
    x: x,
    y: y,
    w: w,
    h: h,
    src: MASCOT_FRAMES[mood][0],
  })

  timerId = createTimer(400, 400, function () {
    var frames = MASCOT_FRAMES[mood]
    frameIdx = (frameIdx + 1) % frames.length
    if (imgWidget) {
      imgWidget.setProperty(hmUI.prop.SRC, frames[frameIdx])
    }
  })

  return {
    setMood: function (newMood) {
      if (!MASCOT_FRAMES[newMood]) return
      mood = newMood
      frameIdx = 0
      if (imgWidget) {
        imgWidget.setProperty(hmUI.prop.SRC, MASCOT_FRAMES[mood][0])
      }
    },
    destroy: function () {
      if (timerId !== null) {
        stopTimer(timerId)
        timerId = null
      }
    },
    getWidget: function () {
      return imgWidget
    },
  }
}
