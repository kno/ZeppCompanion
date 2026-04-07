import * as hmUI from "@zos/ui";
import { log as Logger } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";
import { replace } from "@zos/router";

const logger = Logger.getLogger("training-summary");
const { width: W } = getDeviceInfo();

Page({
  onInit() {
    logger.debug("training-summary onInit");
  },
  build() {
    logger.debug("training-summary build START");

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(0),
      y: px(60),
      w: W,
      h: px(40),
      text: "Resumen",
      text_size: px(32),
      color: 0xffffff,
      align_h: hmUI.align.CENTER_H,
    });

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(0),
      y: px(180),
      w: W,
      h: px(50),
      text: "Gran trabajo!",
      text_size: px(20),
      color: 0xffd54f,
      align_h: hmUI.align.CENTER_H,
    });

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: (W - px(300)) / 2,
      y: px(320),
      w: px(300),
      h: px(55),
      text: "Volver al inicio",
      text_size: px(24),
      radius: px(30),
      normal_color: 0x1a1a1a,
      press_color: 0x2a2a2a,
      click_func: function () {
        var a = getApp();
        a.globalData.trainingSession = null;
        a.globalData.currentTraining = null;
        replace({ url: "page/gt/home/index.page" });
      },
    });

    logger.debug("training-summary build DONE");
  },
  onDestroy() {
    logger.debug("training-summary onDestroy");
  },
});
