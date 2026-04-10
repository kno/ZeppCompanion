import * as hmUI from "@zos/ui";
import { log as Logger } from "@zos/utils";
import { replace, push } from "@zos/router";
import {
  TITLE_STYLE,
  SUBTITLE_STYLE,
  MASCOT_STYLE,
  BUTTON_START_STYLE,
  BUTTON_HISTORY_STYLE,
  BUTTON_SETTINGS_STYLE,
} from "zosLoader:./index.page.[pf].layout.js";
import { createMascotWidget } from "../../../components/mascot-widget";

const logger = Logger.getLogger("home");

var mascot = null;

Page({
  onInit() {
    logger.debug("home onInit");
  },
  build() {
    logger.debug("home build START");

    hmUI.createWidget(hmUI.widget.TEXT, TITLE_STYLE);
    hmUI.createWidget(hmUI.widget.TEXT, SUBTITLE_STYLE);
    mascot = createMascotWidget({
      x: MASCOT_STYLE.x,
      y: MASCOT_STYLE.y,
      w: MASCOT_STYLE.w,
      h: MASCOT_STYLE.h,
      initialMood: 'neutro',
    });

    hmUI.createWidget(hmUI.widget.BUTTON, {
      ...BUTTON_START_STYLE,
      click_func: function () {
        logger.debug("Start tapped");
        push({ url: "page/gt/training-select/index.page" });
      },
    });

    hmUI.createWidget(hmUI.widget.BUTTON, {
      ...BUTTON_HISTORY_STYLE,
      click_func: function () {
        logger.debug("History tapped");
      },
    });

    hmUI.createWidget(hmUI.widget.BUTTON, {
      ...BUTTON_SETTINGS_STYLE,
      click_func: function () {
        logger.debug("Settings tapped");
        replace({ url: "page/gt/settings/index.page" });
      },
    });

    logger.debug("home build DONE");
  },
  onDestroy() {
    logger.debug("home onDestroy");
    if (mascot) {
      mascot.destroy();
      mascot = null;
    }
  },
});
