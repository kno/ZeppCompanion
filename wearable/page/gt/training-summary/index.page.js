import * as hmUI from "@zos/ui";
import { log as Logger } from "@zos/utils";
import { px } from "@zos/utils";
import { replace } from "@zos/router";
import { getColors, applyBackground } from "../../../utils/theme";
import { createGpsStatusWidget } from "../../../components/gps-status-widget";
import {
  DEVICE_WIDTH,
  TITLE_STYLE,
  SUBTITLE_STYLE,
  TIME_VALUE_STYLE,
  TIME_LABEL_STYLE,
  METRIC_LEFT,
  METRIC_RIGHT,
  METRIC_VALUE_SIZE,
  METRIC_LABEL_SIZE,
  PACE_STYLE,
  CONGRATS_STYLE,
  BUTTON_BACK_STYLE,
} from "zosLoader:./index.page.[pf].layout.js"
import { formatTimeLong, formatSpeed, formatSpeedLabel, formatDistance } from "../../../utils/format"

const logger = Logger.getLogger("training-summary");

var pageState = {
  pageInstance: null,
  savedWidget: null,
  gpsWidget: null,
};

Page({
    onInit() {
      logger.debug("training-summary onInit");
      pageState.savedWidget = null;
      pageState.gpsWidget = null;
    },

    build() {
      logger.debug("training-summary build START");
      pageState.pageInstance = this;

      var COLORS = getColors()
      applyBackground()

      var app = getApp();
      var session = app.globalData.trainingSession;
      var training = app.globalData.currentTraining;

      // Title
      hmUI.createWidget(hmUI.widget.TEXT, {
        ...TITLE_STYLE,
        text: "Resumen",
      });

      // Training name subtitle
      hmUI.createWidget(hmUI.widget.TEXT, {
        ...SUBTITLE_STYLE,
        text: training ? training.name : "Entrenamiento",
      });

      // Compute averages
      var elapsedMs = session ? session.elapsedMs : 0;
      var avgHR = 0;

      if (session && session.hrReadings && session.hrReadings.length > 0) {
        var sum = 0;
        for (var i = 0; i < session.hrReadings.length; i++) {
          sum = sum + session.hrReadings[i];
        }
        avgHR = Math.round(sum / session.hrReadings.length);
      }
      // Use pre-computed avgHR if available
      if (session && session.avgHR) {
        avgHR = session.avgHR;
      }

      // Total time value
      hmUI.createWidget(hmUI.widget.TEXT, {
        ...TIME_VALUE_STYLE,
        text: formatTimeLong(elapsedMs),
      });

      // Total time label
      hmUI.createWidget(hmUI.widget.TEXT, {
        ...TIME_LABEL_STYLE,
        text: "Tiempo total",
      });

      // Distance
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: METRIC_LEFT.x, y: METRIC_LEFT.y,
        w: METRIC_LEFT.w, h: METRIC_LEFT.valueH,
        text: formatDistance(session ? session.distanceMeters : 0),
        text_size: METRIC_VALUE_SIZE,
        color: COLORS.ACCENT,
        align_h: hmUI.align.CENTER_H,
      });

      hmUI.createWidget(hmUI.widget.TEXT, {
        x: METRIC_LEFT.x, y: METRIC_LEFT.labelY,
        w: METRIC_LEFT.w, h: METRIC_LEFT.labelH,
        text: "Distancia",
        text_size: METRIC_LABEL_SIZE,
        color: COLORS.TEXT_SECONDARY,
        align_h: hmUI.align.CENTER_H,
      });

      // Avg HR
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: METRIC_RIGHT.x, y: METRIC_RIGHT.y,
        w: METRIC_RIGHT.w, h: METRIC_RIGHT.valueH,
        text: avgHR > 0 ? String(avgHR) + " bpm" : "-- bpm",
        text_size: METRIC_VALUE_SIZE,
        color: COLORS.HR_RED,
        align_h: hmUI.align.CENTER_H,
      });

      hmUI.createWidget(hmUI.widget.TEXT, {
        x: METRIC_RIGHT.x, y: METRIC_RIGHT.labelY,
        w: METRIC_RIGHT.w, h: METRIC_RIGHT.labelH,
        text: "FC Media",
        text_size: METRIC_LABEL_SIZE,
        color: COLORS.TEXT_SECONDARY,
        align_h: hmUI.align.CENTER_H,
      });

      // Avg Pace / Speed
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PACE_STYLE.x, y: PACE_STYLE.y,
        w: PACE_STYLE.w, h: PACE_STYLE.valueH,
        text: formatSpeed(session ? session.currentPace : 0),
        text_size: METRIC_VALUE_SIZE,
        color: COLORS.PACE_BLUE,
        align_h: hmUI.align.CENTER_H,
      });

      hmUI.createWidget(hmUI.widget.TEXT, {
        x: PACE_STYLE.x, y: PACE_STYLE.labelY,
        w: PACE_STYLE.w, h: PACE_STYLE.labelH,
        text: formatSpeedLabel(false),
        text_size: METRIC_LABEL_SIZE,
        color: COLORS.TEXT_SECONDARY,
        align_h: hmUI.align.CENTER_H,
      });

      // Congratulation message
      hmUI.createWidget(hmUI.widget.TEXT, {
        ...CONGRATS_STYLE,
        text: "Gran trabajo! Has completado tu entrenamiento.",
      });

      // Volver button
      hmUI.createWidget(hmUI.widget.BUTTON, {
        ...BUTTON_BACK_STYLE,
        text: "Volver al inicio",
        click_func: function () {
          var a = getApp()
          a.globalData.trainingSession = null
          a.globalData.currentTraining = null
          replace({ url: "page/gt/home/index.page" })
        },
      });

      // GPS status indicator (created last for highest z-order)
      pageState.gpsWidget = createGpsStatusWidget()

      logger.debug("training-summary build DONE");
    },

    onDestroy() {
      logger.debug("training-summary onDestroy");
      if (pageState.gpsWidget) {
        pageState.gpsWidget.destroy();
        pageState.gpsWidget = null;
      }
    },
});
