import * as hmUI from "@zos/ui";
import { log as Logger } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";
import { replace } from "@zos/router";

const logger = Logger.getLogger("active-training");
const { width: W } = getDeviceInfo();

Page({
  onInit() {
    logger.debug("active-training onInit");
  },
  build() {
    logger.debug("active-training build START");

    var app = getApp();
    var training = app.globalData.currentTraining;
    var session = app.globalData.trainingSession;

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(0),
      y: px(60),
      w: W,
      h: px(40),
      text: training ? training.name : "Entrenamiento",
      text_size: px(22),
      color: 0xffffff,
      align_h: hmUI.align.CENTER_H,
    });

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(0),
      y: px(150),
      w: W,
      h: px(50),
      text: "00:00",
      text_size: px(38),
      color: 0xffffff,
      align_h: hmUI.align.CENTER_H,
    });

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(0),
      y: px(220),
      w: W,
      h: px(40),
      text: "-- bpm",
      text_size: px(28),
      color: 0xfc6950,
      align_h: hmUI.align.CENTER_H,
    });

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: (W - px(300)) / 2,
      y: px(350),
      w: px(300),
      h: px(58),
      text: "Terminar",
      text_size: px(20),
      radius: px(29),
      normal_color: 0xef5350,
      press_color: 0xc62828,
      click_func: function () {
        var a = getApp();
        if (a.globalData.trainingSession) {
          a.globalData.trainingSession.status = "finished";
          a.globalData.trainingSession.elapsedMs =
            Date.now() - a.globalData.trainingSession.startTimestamp;
        }
        replace({ url: "page/gt/training-summary/index.page" });
      },
    });

    logger.debug("active-training build DONE");
  },
  onDestroy() {
    logger.debug("active-training onDestroy");
  },
});
