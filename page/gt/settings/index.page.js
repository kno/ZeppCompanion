import * as hmUI from "@zos/ui";
import { log as Logger } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";
import { back } from "@zos/router";

const logger = Logger.getLogger("settings");
const { width: W } = getDeviceInfo();

Page({
  onInit() {
    logger.debug("settings onInit");
  },
  build() {
    logger.debug("settings build START");

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(0),
      y: px(80),
      w: W,
      h: px(40),
      text: "Configuracion",
      text_size: px(28),
      color: 0xffffff,
      align_h: hmUI.align.CENTER_H,
    });

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(0),
      y: px(180),
      w: W,
      h: px(40),
      text: "ZeepCompanion v1.0.0",
      text_size: px(16),
      color: 0x666666,
      align_h: hmUI.align.CENTER_H,
    });

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: (W - px(300)) / 2,
      y: px(300),
      w: px(300),
      h: px(50),
      text: "Volver",
      text_size: px(24),
      radius: px(25),
      normal_color: 0x1a1a1a,
      press_color: 0x2a2a2a,
      click_func: function () {
        back();
      },
    });

    logger.debug("settings build DONE");
  },
  onDestroy() {
    logger.debug("settings onDestroy");
  },
});
