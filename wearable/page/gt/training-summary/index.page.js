import * as hmUI from "@zos/ui";
import { log as Logger } from "@zos/utils";
import { px } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";
import { replace } from "@zos/router";

const logger = Logger.getLogger("training-summary");
const { width: W } = getDeviceInfo();

const COLORS = {
  WHITE: 0xffffff,
  TEXT_SECONDARY: 0x999999,
  ACCENT: 0x58d0ff,
  HR_RED: 0xfc6950,
  PACE_BLUE: 0x58d0ff,
  WARNING_YELLOW: 0xffd54f,
  BG_CARD: 0x1a1a1a,
  BG_CARD_HOVER: 0x2a2a2a,
  PRIMARY: 0x4caf50,
};

const FONT = {
  TITLE: 32,
  LARGE: 48,
  BODY: 24,
  SMALL: 20,
  TINY: 16,
};

var pageState = {
  pageInstance: null,
  savedWidget: null,
};

function formatTimeLong(ms) {
  var totalSec = Math.floor(ms / 1000);
  var hrs = Math.floor(totalSec / 3600);
  var min = Math.floor((totalSec % 3600) / 60);
  var sec = totalSec % 60;
  return (
    String(hrs).padStart(2, "0") +
    ":" +
    String(min).padStart(2, "0") +
    ":" +
    String(sec).padStart(2, "0")
  );
}

function formatPace(secPerKm) {
  if (!secPerKm || secPerKm <= 0 || secPerKm > 3600) return "--:-- /km";
  var min = Math.floor(secPerKm / 60);
  var sec = Math.round(secPerKm % 60);
  return min + ":" + String(sec).padStart(2, "0") + " /km";
}

function formatDistance(meters) {
  if (!meters || meters < 0) return "0 m";
  if (meters < 1000) return Math.round(meters) + " m";
  return (meters / 1000).toFixed(2) + " km";
}

Page({
    onInit() {
      logger.debug("training-summary onInit");
      pageState.savedWidget = null;
    },

    build() {
      logger.debug("training-summary build START");
      pageState.pageInstance = this;

      var app = getApp();
      var session = app.globalData.trainingSession;
      var training = app.globalData.currentTraining;

      // Title
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(0),
        y: px(30),
        w: W,
        h: px(40),
        text: "Resumen",
        text_size: px(FONT.TITLE),
        color: COLORS.WHITE,
        align_h: hmUI.align.CENTER_H,
      });

      // Training name subtitle
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(0),
        y: px(75),
        w: W,
        h: px(30),
        text: training ? training.name : "Entrenamiento",
        text_size: px(FONT.SMALL),
        color: COLORS.TEXT_SECONDARY,
        align_h: hmUI.align.CENTER_H,
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
        x: px(0),
        y: px(120),
        w: W,
        h: px(50),
        text: formatTimeLong(elapsedMs),
        text_size: px(FONT.LARGE),
        color: COLORS.WHITE,
        align_h: hmUI.align.CENTER_H,
      });

      // Total time label
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(0),
        y: px(170),
        w: W,
        h: px(24),
        text: "Tiempo total",
        text_size: px(FONT.TINY),
        color: COLORS.TEXT_SECONDARY,
        align_h: hmUI.align.CENTER_H,
      });

      // Distance
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(40),
        y: px(210),
        w: px(180),
        h: px(30),
        text: formatDistance(session ? session.distanceMeters : 0),
        text_size: px(FONT.BODY),
        color: COLORS.ACCENT,
        align_h: hmUI.align.CENTER_H,
      });

      hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(40),
        y: px(240),
        w: px(180),
        h: px(20),
        text: "Distancia",
        text_size: px(FONT.TINY),
        color: COLORS.TEXT_SECONDARY,
        align_h: hmUI.align.CENTER_H,
      });

      // Avg HR
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(260),
        y: px(210),
        w: px(180),
        h: px(30),
        text: avgHR > 0 ? String(avgHR) + " bpm" : "-- bpm",
        text_size: px(FONT.BODY),
        color: COLORS.HR_RED,
        align_h: hmUI.align.CENTER_H,
      });

      hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(260),
        y: px(240),
        w: px(180),
        h: px(20),
        text: "FC Media",
        text_size: px(FONT.TINY),
        color: COLORS.TEXT_SECONDARY,
        align_h: hmUI.align.CENTER_H,
      });

      // Avg Pace
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(0),
        y: px(280),
        w: W,
        h: px(30),
        text: formatPace(session ? session.currentPace : 0),
        text_size: px(FONT.BODY),
        color: COLORS.PACE_BLUE,
        align_h: hmUI.align.CENTER_H,
      });

      hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(0),
        y: px(310),
        w: W,
        h: px(20),
        text: "Ritmo medio",
        text_size: px(FONT.TINY),
        color: COLORS.TEXT_SECONDARY,
        align_h: hmUI.align.CENTER_H,
      });

      // Congratulation message
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(40),
        y: px(340),
        w: px(400),
        h: px(40),
        text: "Gran trabajo! Has completado tu entrenamiento.",
        text_size: px(FONT.SMALL),
        color: COLORS.WARNING_YELLOW,
        align_h: hmUI.align.CENTER_H,
        text_style: hmUI.text_style.WRAP,
      });

      // Volver button
      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(90),
        y: px(390),
        w: px(300),
        h: px(55),
        text: "Volver al inicio",
        text_size: px(FONT.BODY),
        radius: px(30),
        normal_color: COLORS.BG_CARD,
        press_color: COLORS.BG_CARD_HOVER,
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
