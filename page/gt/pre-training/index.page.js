import * as hmUI from "@zos/ui";
import { log as Logger } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";
import { push } from "@zos/router";

const logger = Logger.getLogger("pre-training");
const { width: W } = getDeviceInfo();

Page({
  onInit() {
    logger.debug("pre-training onInit");
  },
  build() {
    logger.debug("pre-training build START");

    var app = getApp();
    var training = app.globalData.currentTraining;

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(0),
      y: px(60),
      w: W,
      h: px(40),
      text: training ? training.name : "Sin entrenamiento",
      text_size: px(28),
      color: 0xffffff,
      align_h: hmUI.align.CENTER_H,
    });

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(0),
      y: px(160),
      w: W,
      h: px(30),
      text: "Preparado para entrenar!",
      text_size: px(20),
      color: 0xffd54f,
      align_h: hmUI.align.CENTER_H,
    });

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: (W - px(300)) / 2,
      y: px(280),
      w: px(300),
      h: px(70),
      text: "COMENZAR",
      text_size: px(28),
      radius: px(35),
      normal_color: 0x4caf50,
      press_color: 0x388e3c,
      click_func: function () {
        var a = getApp();
        a.globalData.trainingSession = {
          status: "running",
          startTimestamp: Date.now(),
          elapsedMs: 0,
          hrReadings: [],
          currentHR: 0,
          currentPace: 0,
          distanceMeters: 0,
          percentComplete: 0,
          eventsTriggered: {},
          lastCompanionMsg: "",
          lastCompanionTime: 0,
        };
        push({ url: "page/gt/active-training/index.page" });
      },
    });

    logger.debug("pre-training build DONE");
  },
  onDestroy() {
    logger.debug("pre-training onDestroy");
  },
});
