import * as hmUI from "@zos/ui";
import { log as Logger } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";
import { push } from "@zos/router";

const logger = Logger.getLogger("training-select");
const { width: W } = getDeviceInfo();

var MOCK_TRAININGS = [
  { id: "1", name: "Carrera suave 30min", type: "cardio_continuous", durationMinutes: 30 },
  { id: "2", name: "Intervalos 4x400m", type: "intervals", durationMinutes: 25 },
  { id: "3", name: "Trote libre", type: "free", durationMinutes: 45 },
];

Page({
  onInit() {
    logger.debug("training-select onInit");
  },
  build() {
    logger.debug("training-select build START");

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(0),
      y: px(40),
      w: W,
      h: px(40),
      text: "Entrenamientos",
      text_size: px(28),
      color: 0xffffff,
      align_h: hmUI.align.CENTER_H,
    });

    var startY = px(100);
    var itemH = px(80);
    var gap = px(10);

    for (var i = 0; i < MOCK_TRAININGS.length; i++) {
      var training = MOCK_TRAININGS[i];
      var y = startY + i * (itemH + gap);

      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(40),
        y: y,
        w: px(400),
        h: itemH,
        text: training.name,
        text_size: px(22),
        radius: px(12),
        normal_color: 0x1a1a1a,
        press_color: 0x2a2a2a,
        click_func: (function (tr) {
          return function () {
            var app = getApp();
            app.globalData.currentTraining = tr;
            push({ url: "page/gt/pre-training/index.page" });
          };
        })(training),
      });
    }

    logger.debug("training-select build DONE");
  },
  onDestroy() {
    logger.debug("training-select onDestroy");
  },
});
