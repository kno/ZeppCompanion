import * as hmUI from "@zos/ui";
import { log as Logger } from "@zos/utils";
import { getText } from "@zos/i18n";
import { replace, push } from "@zos/router";
import { BasePage } from "@zeppos/zml/base-page";
import { px } from "@zos/utils";
import {
  DEVICE_WIDTH,
  ICON_BG_SIZE,
  TITLE_STYLE,
  SUBTITLE_STYLE,
  MASCOT_STYLE,
  BUTTON_START_STYLE,
  BUTTON_ICON_HISTORY_STYLE,
  BUTTON_ICON_SETTINGS_STYLE,
} from "zosLoader:./index.page.[pf].layout.js";
import { createMascotWidget } from "../../../components/mascot-widget";
import { getColors, applyBackground } from "../../../utils/theme";
import { createGpsStatusWidget } from "../../../components/gps-status-widget";

const logger = Logger.getLogger("home");

var mascot = null;
var loadingWidgets = [];
var gpsWidget = null;

function clearLoadingWidgets() {
  for (var i = 0; i < loadingWidgets.length; i++) {
    hmUI.deleteWidget(loadingWidgets[i]);
  }
  loadingWidgets = [];
}

function showConfigUI() {
  clearLoadingWidgets();

  if (mascot) {
    mascot.setMood("triste");
  }

  hmUI.createWidget(hmUI.widget.TEXT, {
    x: 0,
    y: TITLE_STYLE.y,
    w: DEVICE_WIDTH,
    h: TITLE_STYLE.h,
    text: "ZeppCompanion",
    text_size: TITLE_STYLE.text_size,
    color: TITLE_STYLE.color,
    align_h: hmUI.align.CENTER_H,
  });

  hmUI.createWidget(hmUI.widget.TEXT, {
    x: DEVICE_WIDTH * 0.1,
    y: mascot.getPosition().y + MASCOT_STYLE.h + 12,
    w: DEVICE_WIDTH * 0.8,
    h: 60,
    text: "Configura tu cuenta en la app Zepp del telefono",
    text_size: SUBTITLE_STYLE.text_size,
    color: SUBTITLE_STYLE.color,
    align_h: hmUI.align.CENTER_H,
    wrap_h: 1,
  });

  hmUI.createWidget(hmUI.widget.BUTTON, {
    x: (DEVICE_WIDTH - 240) / 2,
    y: mascot.getPosition().y + MASCOT_STYLE.h + 82,
    w: 240,
    h: 48,
    text: "Reintentar",
    text_size: SUBTITLE_STYLE.text_size,
    radius: 24,
    normal_color: getColors().BG_CARD,
    press_color: getColors().BG_CARD_HOVER,
    click_func: function () {
      replace({ url: "page/gt/home/index.page" });
    },
  });
}

function showHomeUI(page) {
  clearLoadingWidgets();

  if (mascot) {
    mascot.setMood("neutro");
  }

  hmUI.createWidget(hmUI.widget.TEXT, TITLE_STYLE);
  hmUI.createWidget(hmUI.widget.TEXT, SUBTITLE_STYLE);

  // Icon background circles (visible in light mode for white icons)
  var colors = getColors();
  var iconPad = px(4);
  hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: BUTTON_ICON_HISTORY_STYLE.x - iconPad,
    y: BUTTON_ICON_HISTORY_STYLE.y - iconPad,
    w: ICON_BG_SIZE + iconPad * 2,
    h: ICON_BG_SIZE + iconPad * 2,
    radius: (ICON_BG_SIZE + iconPad * 2) / 2,
    color: colors.ICON_BG,
  });
  hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: BUTTON_ICON_SETTINGS_STYLE.x - iconPad,
    y: BUTTON_ICON_SETTINGS_STYLE.y - iconPad,
    w: ICON_BG_SIZE + iconPad * 2,
    h: ICON_BG_SIZE + iconPad * 2,
    radius: (ICON_BG_SIZE + iconPad * 2) / 2,
    color: colors.ICON_BG,
  });

  hmUI.createWidget(hmUI.widget.BUTTON, {
    ...BUTTON_ICON_HISTORY_STYLE,
    click_func: function () {
      logger.debug("History tapped");
    },
  });

  hmUI.createWidget(hmUI.widget.BUTTON, {
    ...BUTTON_ICON_SETTINGS_STYLE,
    click_func: function () {
      logger.debug("Settings tapped");
      push({ url: "page/gt/settings/index.page" });
    },
  });

  hmUI.createWidget(hmUI.widget.BUTTON, {
    ...BUTTON_START_STYLE,
    text: getText("start_training"),
    click_func: function () {
      logger.debug("Start tapped");
      push({ url: "page/gt/training-select/index.page" });
    },
  });

  // Background fetch of trainings
  try {
    page.request({ method: "fetch_trainings" }).then(function (result) {
      if (result && result.success && result.trainings) {
        getApp().globalData.trainings = result.trainings;
        logger.debug("Trainings fetched: " + result.trainings.length);
      }
    }).catch(function (err) {
      logger.debug("fetch_trainings failed: " + err);
    });
  } catch (e) {
    logger.debug("fetch_trainings request error: " + e);
  }
}

Page(
  BasePage({
    onInit() {
      logger.debug("home onInit");
    },

    build() {
      logger.debug("home build START");

      applyBackground()

      // GPS status indicator (created after background, destroyed in onDestroy)
      gpsWidget = createGpsStatusWidget()

      // Loading state: title + mascot
      var titleWidget = hmUI.createWidget(hmUI.widget.TEXT, TITLE_STYLE);
      loadingWidgets.push(titleWidget);

      mascot = createMascotWidget({
        x: MASCOT_STYLE.x,
        y: MASCOT_STYLE.y - 30,
        w: MASCOT_STYLE.w,
        h: MASCOT_STYLE.h,
        initialMood: "neutro",
      });

      var self = this;

      try {
        this.request({ method: "check_auth" })
          .then(function (result) {
            if (result && result.success && result.authenticated) {
              mascot.setPosition({
                x: MASCOT_STYLE.x,
                y: MASCOT_STYLE.y,
              })

              showHomeUI(self);
            } else {
              showConfigUI();
            }
          })
          .catch(function (err) {
            logger.debug("check_auth failed: " + err);
            showConfigUI();
          });
      } catch (e) {
        logger.debug("check_auth request error: " + e);
        showConfigUI();
      }

      logger.debug("home build DONE");
    },

    onDestroy() {
      logger.debug("home onDestroy");
      if (mascot) {
        mascot.destroy();
        mascot = null;
      }
      if (gpsWidget) {
        gpsWidget.destroy();
        gpsWidget = null;
      }
      loadingWidgets = [];
    },
  })
);
