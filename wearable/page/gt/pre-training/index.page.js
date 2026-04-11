import * as hmUI from "@zos/ui";
import { log as Logger } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";
import { replace } from "@zos/router";
import { createMascotWidget } from "../../../components/mascot-widget";

const logger = Logger.getLogger("pre-training");
const { width: W } = getDeviceInfo();

const COLORS = {
  WHITE: 0xffffff,
  TEXT_PRIMARY: 0xffffff,
  TEXT_SECONDARY: 0x999999,
  PRIMARY: 0x4caf50,
  PRIMARY_DARK: 0x388e3c,
  ERROR_RED: 0xef5350,
  WARNING_YELLOW: 0xffd54f,
  CARD_BG: 0x1a1a1a,
  SEPARATOR: 0x333333,
  READY_GREEN: 0x69f0ae,
};

const FONT = {
  LARGE: 34,
  MEDIUM: 28,
  BODY: 22,
  SMALL: 18,
  TINY: 15,
};

var pageState = {
  mascot: null,
  startBtnWidget: null,
  startingTraining: false,
};

function getTypeInfo(type) {
  switch (type) {
    case "cardio_continuous":
      return { label: "Cardio", color: 0x4caf50 };
    case "intervals":
      return { label: "Intervalos", color: 0xff9800 };
    case "free":
      return { label: "Libre", color: 0x58d0ff };
    case "strength":
      return { label: "Fuerza", color: 0xe040fb };
    case "recovery":
      return { label: "Recuperacion", color: 0x5be7a9 };
    default:
      return { label: "Entreno", color: 0x888888 };
  }
}

function formatPace(secPerKm) {
  if (!secPerKm || secPerKm <= 0 || secPerKm > 3600) return "--:-- /km";
  var min = Math.floor(secPerKm / 60);
  var sec = Math.round(secPerKm % 60);
  return min + ":" + String(sec).padStart(2, "0") + " /km";
}

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
  },

  build() {
    logger.debug("pre-training build START");

    var app = getApp();
    var training = app.globalData.currentTraining;

    if (!training) {
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(0),
        y: px(200),
        w: W,
        h: px(50),
        text: "Error: sin entrenamiento",
        text_size: px(FONT.BODY),
        color: COLORS.ERROR_RED,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
      });
      return;
    }

    var typeInfo = getTypeInfo(training.type);

    // ── Mascot (top, centered, feliz mood) ─────────────────────────────────
    var mascotW = px(150);
    var mascotH = px(98);
    var mascotX = (W - mascotW) / 2;
    var mascotY = px(42);

    pageState.mascot = createMascotWidget({
      x: mascotX,
      y: mascotY,
      w: mascotW,
      h: mascotH,
      initialMood: "feliz",
    });

    // ── Training name ───────────────────────────────────────────────────────
    var nameY = mascotY + mascotH + px(4);

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(40),
      y: nameY,
      w: W - px(80),
      h: px(32),
      text: training.name,
      text_size: px(FONT.MEDIUM),
      color: COLORS.WHITE,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
    });

    // ── Type badge ──────────────────────────────────────────────────────────
    var badgeW = px(110);
    var badgeH = px(24);
    var badgeX = (W - badgeW) / 2;
    var badgeY = nameY + px(34);

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: badgeX,
      y: badgeY,
      w: badgeW,
      h: badgeH,
      radius: px(12),
      color: typeInfo.color,
    });

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: badgeX,
      y: badgeY,
      w: badgeW,
      h: badgeH,
      text: typeInfo.label,
      text_size: px(FONT.TINY),
      color: COLORS.WHITE,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
    });

    // ── Details card ────────────────────────────────────────────────────────
    var cardW = px(340);
    var cardX = (W - cardW) / 2;
    var cardY = badgeY + badgeH + px(10);
    var cardPadV = px(10);
    var rowH = px(24);
    var rowGap = px(4);

    var rowCount = 0;
    if (training.durationMinutes) rowCount++;
    if (training.distanceMeters) rowCount++;
    if (training.paceGoalSecPerKm && training.paceGoalSecPerKm > 0) rowCount++;

    var cardH = cardPadV * 2 + rowCount * rowH + (rowCount > 1 ? (rowCount - 1) * rowGap : 0);
    if (cardH < px(44)) cardH = px(44);

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: cardX,
      y: cardY,
      w: cardW,
      h: cardH,
      radius: px(14),
      color: COLORS.CARD_BG,
    });

    // Colored left accent bar
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: cardX + px(8),
      y: cardY + px(8),
      w: px(3),
      h: cardH - px(16),
      radius: px(2),
      color: typeInfo.color,
    });

    var rowY = cardY + cardPadV;
    var labelX = cardX + px(22);
    var innerW = cardW - px(22) - px(12);

    if (training.durationMinutes) {
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: labelX,
        y: rowY,
        w: px(100),
        h: rowH,
        text: "Duracion",
        text_size: px(FONT.TINY),
        color: COLORS.TEXT_SECONDARY,
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
      });
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: labelX,
        y: rowY,
        w: innerW,
        h: rowH,
        text: String(training.durationMinutes) + " min",
        text_size: px(FONT.SMALL),
        color: COLORS.WHITE,
        align_h: hmUI.align.RIGHT,
        align_v: hmUI.align.CENTER_V,
      });
      rowY += rowH + rowGap;
    }

    if (training.distanceMeters) {
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: labelX,
        y: rowY,
        w: px(100),
        h: rowH,
        text: "Distancia",
        text_size: px(FONT.TINY),
        color: COLORS.TEXT_SECONDARY,
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
      });
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: labelX,
        y: rowY,
        w: innerW,
        h: rowH,
        text: (training.distanceMeters / 1000).toFixed(1) + " km",
        text_size: px(FONT.SMALL),
        color: COLORS.WHITE,
        align_h: hmUI.align.RIGHT,
        align_v: hmUI.align.CENTER_V,
      });
      rowY += rowH + rowGap;
    }

    if (training.paceGoalSecPerKm && training.paceGoalSecPerKm > 0) {
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: labelX,
        y: rowY,
        w: px(120),
        h: rowH,
        text: "Ritmo objetivo",
        text_size: px(FONT.TINY),
        color: COLORS.TEXT_SECONDARY,
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
      });
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: labelX,
        y: rowY,
        w: innerW,
        h: rowH,
        text: formatPace(training.paceGoalSecPerKm),
        text_size: px(FONT.SMALL),
        color: COLORS.WHITE,
        align_h: hmUI.align.RIGHT,
        align_v: hmUI.align.CENTER_V,
      });
    }

    // ── "Preparado!" status ─────────────────────────────────────────────────
    var statusY = cardY + cardH + px(6);

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: px(0),
      y: statusY,
      w: W,
      h: px(22),
      text: "Preparado!",
      text_size: px(FONT.TINY),
      color: COLORS.READY_GREEN,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
    });

    // ── COMENZAR button ─────────────────────────────────────────────────────
    // Place dynamically after content, capped at safe zone for round display
    var btnW = px(300);
    var btnH = px(64);
    var btnX = (W - btnW) / 2;
    var desiredBtnY = statusY + px(28);
    var maxBtnY = px(345);
    var btnY = desiredBtnY < maxBtnY ? desiredBtnY : maxBtnY;

    pageState.startBtnWidget = hmUI.createWidget(hmUI.widget.BUTTON, {
      x: btnX,
      y: btnY,
      w: btnW,
      h: btnH,
      text: "COMENZAR",
      text_size: px(FONT.MEDIUM),
      radius: px(32),
      normal_color: COLORS.PRIMARY,
      press_color: COLORS.PRIMARY_DARK,
      click_func: function () {
        startTraining(training);
      },
    });

    logger.debug("pre-training build DONE");
  },

  onDestroy() {
    logger.debug("pre-training onDestroy");
    if (pageState.mascot) {
      pageState.mascot.destroy();
      pageState.mascot = null;
    }
  },
});
