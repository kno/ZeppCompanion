import * as hmUI from "@zos/ui";
import { log as Logger } from "@zos/utils";
import { px } from "@zos/utils";
import { replace } from "@zos/router";
import { createMascotWidget } from "../../../components/mascot-widget";
import { getColors, applyBackground } from "../../../utils/theme";
import { createGpsStatusWidget } from "../../../components/gps-status-widget";
import {
  DEVICE_WIDTH,
  MASCOT_STYLE,
  NAME_STYLE,
  BADGE_STYLE,
  CARD_STYLE,
  CARD_ACCENT,
  ROW_DIMS,
  ROW_LABEL_STYLE,
  ROW_VALUE_STYLE,
  STATUS_STYLE,
  BUTTON_START_STYLE,
  ERROR_STYLE,
} from "zosLoader:./index.page.[pf].layout.js"
import { getTypeInfo } from "../../../utils/training-types"
import { formatSpeed, formatSpeedLabel } from "../../../utils/format"

const logger = Logger.getLogger("pre-training");

var pageState = {
  mascot: null,
  startBtnWidget: null,
  startingTraining: false,
  gpsWidget: null,
};

function startTraining(training) {
  if (pageState.startingTraining) return;
  pageState.startingTraining = true;
  navigateToTraining(training);
}

function navigateToTraining(training) {
  var a = getApp();
  a.globalData.trainingSession = {
    backendSessionId: null,
    status: "running",
    startTimestamp: Date.now(),
    elapsedMs: 0,
    hrReadings: [],
    currentHR: 0,
    currentPace: 0,
    distanceMeters: 0,
    lastGpsLat: null,
    lastGpsLng: null,
    lastGpsTimestamp: 0,
    percentComplete: 0,
    totalSteps: 0,
    eventsTriggered: {},
    pendingLlmRequest: false,
    lastCompanionMsg: "",
    lastCompanionTime: 0,
    failedSyncCount: 0,
    bleDisconnected: false,
  };
  replace({ url: "page/gt/active-training/index.page" });
}

Page({
  onInit() {
    logger.debug("pre-training onInit");
    pageState.mascot = null;
    pageState.startBtnWidget = null;
    pageState.startingTraining = false;
    pageState.gpsWidget = null;
  },

  build() {
    logger.debug("pre-training build START");

    var COLORS = getColors()
    applyBackground()

    var app = getApp();
    var training = app.globalData.currentTraining;

    if (!training) {
      hmUI.createWidget(hmUI.widget.TEXT, {
        ...ERROR_STYLE,
        text: "Error: sin entrenamiento",
      });
      return;
    }

    var typeInfo = getTypeInfo(training.type);

    // ── Mascot (top, centered, feliz mood) ─────────────────────────────────
    pageState.mascot = createMascotWidget({
      x: MASCOT_STYLE.x,
      y: MASCOT_STYLE.y,
      w: MASCOT_STYLE.w,
      h: MASCOT_STYLE.h,
      initialMood: "feliz",
    });

    // ── Training name ───────────────────────────────────────────────────────
    var nameY = MASCOT_STYLE.y + MASCOT_STYLE.h + px(4);

    hmUI.createWidget(hmUI.widget.TEXT, {
      ...NAME_STYLE,
      y: nameY,
      text: training.name,
    });

    // ── Type badge ──────────────────────────────────────────────────────────
    var badgeX = (DEVICE_WIDTH - BADGE_STYLE.w) / 2;
    var badgeY = nameY + px(34);

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: badgeX, y: badgeY,
      w: BADGE_STYLE.w, h: BADGE_STYLE.h,
      radius: BADGE_STYLE.radius,
      color: typeInfo.color,
    });

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: badgeX, y: badgeY,
      w: BADGE_STYLE.w, h: BADGE_STYLE.h,
      text: typeInfo.label,
      text_size: BADGE_STYLE.text_size,
      color: BADGE_STYLE.textColor,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
    });

    // ── Details card ────────────────────────────────────────────────────────
    var cardW = CARD_STYLE.w;
    var cardX = (DEVICE_WIDTH - cardW) / 2;
    var cardY = badgeY + BADGE_STYLE.h + px(10);

    var rowH = ROW_DIMS.h;
    var rowGap = ROW_DIMS.gap;

    var rowCount = 0;
    if (training.durationMinutes) rowCount++;
    if (training.distanceMeters) rowCount++;
    if (training.paceGoalSecPerKm && training.paceGoalSecPerKm > 0) rowCount++;

    var cardH = ROW_DIMS.padV * 2 + rowCount * rowH + (rowCount > 1 ? (rowCount - 1) * rowGap : 0);
    if (cardH < px(44)) cardH = px(44);

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: cardX, y: cardY,
      w: cardW, h: cardH,
      radius: CARD_STYLE.radius,
      color: CARD_STYLE.color,
    });

    // Colored left accent bar
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: cardX + CARD_ACCENT.offsetX,
      y: cardY + CARD_ACCENT.offsetY,
      w: CARD_ACCENT.w,
      h: cardH - px(16),
      radius: CARD_ACCENT.radius,
      color: typeInfo.color,
    });

    var rowY = cardY + ROW_DIMS.padV;
    var labelX = cardX + ROW_DIMS.labelX;
    var innerW = cardW - ROW_DIMS.labelX - px(12);

    if (training.durationMinutes) {
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: labelX, y: rowY, w: px(100), h: rowH,
        text: "Duracion",
        ...ROW_LABEL_STYLE,
      });
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: labelX, y: rowY, w: innerW, h: rowH,
        text: String(training.durationMinutes) + " min",
        ...ROW_VALUE_STYLE,
      });
      rowY += rowH + rowGap;
    }

    if (training.distanceMeters) {
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: labelX, y: rowY, w: px(100), h: rowH,
        text: "Distancia",
        ...ROW_LABEL_STYLE,
      });
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: labelX, y: rowY, w: innerW, h: rowH,
        text: (training.distanceMeters / 1000).toFixed(1) + " km",
        ...ROW_VALUE_STYLE,
      });
      rowY += rowH + rowGap;
    }

    if (training.paceGoalSecPerKm && training.paceGoalSecPerKm > 0) {
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: labelX, y: rowY, w: px(120), h: rowH,
        text: formatSpeedLabel(true),
        ...ROW_LABEL_STYLE,
      });
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: labelX, y: rowY, w: innerW, h: rowH,
        text: formatSpeed(training.paceGoalSecPerKm),
        ...ROW_VALUE_STYLE,
      });
    }

    // ── "Preparado!" status ─────────────────────────────────────────────────
    var statusY = cardY + cardH + px(6);

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(0), y: statusY,
      w: DEVICE_WIDTH,
      ...STATUS_STYLE,
      text: "Preparado!",
    });

    // ── COMENZAR button ─────────────────────────────────────────────────────
    // Place dynamically after content, capped at safe zone for round display
    var btnW = BUTTON_START_STYLE.w;
    var btnH = BUTTON_START_STYLE.h;
    var btnX = (DEVICE_WIDTH - btnW) / 2;
    var desiredBtnY = statusY + px(28);
    var maxBtnY = px(345);
    var btnY = desiredBtnY < maxBtnY ? desiredBtnY : maxBtnY;

    pageState.startBtnWidget = hmUI.createWidget(hmUI.widget.BUTTON, {
      x: btnX, y: btnY, w: btnW, h: btnH,
      text: "COMENZAR",
      text_size: BUTTON_START_STYLE.text_size,
      radius: BUTTON_START_STYLE.radius,
      normal_color: BUTTON_START_STYLE.normal_color,
      press_color: BUTTON_START_STYLE.press_color,
      click_func: function () { startTraining(training) },
    });

    // GPS status indicator (created last for highest z-order)
    pageState.gpsWidget = createGpsStatusWidget()

    logger.debug("pre-training build DONE");
  },

  onDestroy() {
    logger.debug("pre-training onDestroy");
    if (pageState.mascot) {
      pageState.mascot.destroy();
      pageState.mascot = null;
    }
    if (pageState.gpsWidget) {
      pageState.gpsWidget.destroy();
      pageState.gpsWidget = null;
    }
  },
});
