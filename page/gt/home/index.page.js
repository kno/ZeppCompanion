import * as hmUI from "@zos/ui";
import { log as Logger } from "@zos/utils";
import { push } from "@zos/router";
import {
  TITLE_STYLE,
  SUBTITLE_STYLE,
  CIRCLE_STYLE,
  CIRCLE_TEXT_STYLE,
  BUTTON_START_STYLE,
  BUTTON_HISTORY_STYLE,
  BUTTON_SETTINGS_STYLE,
} from "zosLoader:./index.page.[pf].layout.js";

const logger = Logger.getLogger("home");

Page({
  onInit() {
    logger.debug("home onInit");
  },
  build() {
    logger.debug("home build START");

    hmUI.createWidget(hmUI.widget.TEXT, TITLE_STYLE);
    hmUI.createWidget(hmUI.widget.TEXT, SUBTITLE_STYLE);
    hmUI.createWidget(hmUI.widget.CIRCLE, CIRCLE_STYLE);
    hmUI.createWidget(hmUI.widget.TEXT, CIRCLE_TEXT_STYLE);

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
        push({ url: "page/gt/settings/index.page" });
      },
    });

    logger.debug("home build DONE");
  },
  onDestroy() {
    logger.debug("home onDestroy");
  },
});
