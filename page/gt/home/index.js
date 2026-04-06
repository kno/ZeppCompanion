import * as hmUI from "@zos/ui"
import { log as Logger } from "@zos/utils"
import { px } from "@zos/utils"
import { getDeviceInfo } from "@zos/device"
import { push } from "@zos/router"

var logger = Logger.getLogger("home")
var devInfo = getDeviceInfo()
var W = devInfo.width

Page({
  onInit: function () {
    logger.debug("home onInit")
  },

  build: function () {
    logger.debug("home build START")

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(0),
      y: px(60),
      w: W,
      h: px(50),
      text: "ZeepCompanion",
      text_size: px(32),
      color: 0xFFFFFF,
      align_h: hmUI.align.CENTER_H,
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(0),
      y: px(120),
      w: W,
      h: px(30),
      text: "Tu companero de entrenamiento",
      text_size: px(16),
      color: 0x999999,
      align_h: hmUI.align.CENTER_H,
    })

    hmUI.createWidget(hmUI.widget.CIRCLE, {
      center_x: W / 2,
      center_y: px(210),
      radius: px(50),
      color: 0x4CAF50,
    })

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(0),
      y: px(195),
      w: W,
      h: px(30),
      text: "ZEEP",
      text_size: px(18),
      color: 0xFFFFFF,
      align_h: hmUI.align.CENTER_H,
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: (W - px(300)) / 2,
      y: px(285),
      w: px(300),
      h: px(60),
      text: "Iniciar Entrenamiento",
      text_size: px(22),
      radius: px(30),
      normal_color: 0x4CAF50,
      press_color: 0x388E3C,
      click_func: function () {
        logger.debug("Start tapped")
        push({ url: "page/gt/training-select/index" })
      },
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: (W - px(300)) / 2,
      y: px(360),
      w: px(300),
      h: px(50),
      text: "Historial",
      text_size: px(20),
      radius: px(25),
      normal_color: 0x1A1A1A,
      press_color: 0x2A2A2A,
      click_func: function () {
        logger.debug("History tapped")
      },
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: (W - px(300)) / 2,
      y: px(420),
      w: px(300),
      h: px(50),
      text: "Configuracion",
      text_size: px(20),
      radius: px(25),
      normal_color: 0x1A1A1A,
      press_color: 0x2A2A2A,
      click_func: function () {
        logger.debug("Settings tapped")
        push({ url: "page/gt/settings/index" })
      },
    })

    logger.debug("home build DONE")
  },

  onDestroy: function () {
    logger.debug("home onDestroy")
  },
})
