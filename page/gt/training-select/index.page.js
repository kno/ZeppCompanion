import * as hmUI from "@zos/ui";
import { log as Logger } from "@zos/utils";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";
import { push } from "@zos/router";

const logger = Logger.getLogger("training-select");
const { width: W, height: DEVICE_HEIGHT } = getDeviceInfo();

var MOCK_TRAININGS = [
  { id: "1", name: "Carrera suave", type: "cardio_continuous", durationMinutes: 30 },
  { id: "2", name: "Intervalos 4x400m", type: "intervals", durationMinutes: 25 },
  { id: "3", name: "Trote libre", type: "free", durationMinutes: 45 },
  { id: "4", name: "Fuerza tren superior", type: "strength", durationMinutes: 40 },
  { id: "5", name: "Recuperacion activa", type: "recovery", durationMinutes: 20 },
  { id: "6", name: "Tempo run", type: "cardio_continuous", durationMinutes: 35 },
  { id: "7", name: "HIIT express", type: "intervals", durationMinutes: 15 },
  { id: "8", name: "Caminata larga", type: "free", durationMinutes: 60 },
];

// Returns label and accent color for each training type
function getTypeInfo(type) {
  switch (type) {
    case "cardio_continuous":
      return { label: "Cardio", color: 0x4CAF50 };
    case "intervals":
      return { label: "Intervalos", color: 0xFF9800 };
    case "free":
      return { label: "Libre", color: 0x58D0FF };
    case "strength":
      return { label: "Fuerza", color: 0xE040FB };
    case "recovery":
      return { label: "Recuperacion", color: 0x5BE7A9 };
    default:
      return { label: "Entreno", color: 0x888888 };
  }
}

Page({
  onInit: function () {
    logger.debug("training-select onInit");
  },

  build: function () {
    logger.debug("training-select build START");

    // Enable scrolling for the full page
    hmUI.setScrollView(true);

    // --- Fixed header (will scroll with page, but placed at top) ---
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0,
      y: px(45),
      w: W,
      h: px(36),
      text: "Elige tu entreno",
      text_size: px(26),
      color: 0xFFFFFF,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
    });

    // --- Training cards ---
    var cardW = px(380);
    var cardH = px(80);
    var gap = px(12);
    var startY = px(100); // below header

    for (var i = 0; i < MOCK_TRAININGS.length; i++) {
      var training = MOCK_TRAININGS[i];
      var cardY = startY + i * (cardH + gap);
      var typeInfo = getTypeInfo(training.type);
      var cardX = (W - cardW) / 2;

      // Card background (also handles tap)
      var cardBg = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: cardX,
        y: cardY,
        w: cardW,
        h: cardH,
        radius: px(16),
        color: 0x1A1A1A,
      });

      cardBg.addEventListener(hmUI.event.CLICK_UP, (function (tr) {
        return function () {
          var app = getApp();
          app.globalData.currentTraining = tr;
          push({ url: "page/gt/pre-training/index.page" });
        };
      })(training));

      // Colored accent bar (left side of card)
      var accentPad = px(8);
      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: cardX + px(8),
        y: cardY + accentPad,
        w: px(4),
        h: cardH - accentPad * 2,
        radius: px(2),
        color: typeInfo.color,
      });

      // Training name
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: cardX + px(22),
        y: cardY + px(14),
        w: cardW - px(30) - px(60),
        h: px(26),
        text: training.name,
        text_size: px(20),
        color: 0xFFFFFF,
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
      });

      // Type label
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: cardX + px(22),
        y: cardY + px(44),
        w: px(120),
        h: px(20),
        text: typeInfo.label,
        text_size: px(14),
        color: typeInfo.color,
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
      });

      // Duration
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: cardX + cardW - px(70),
        y: cardY + px(30),
        w: px(60),
        h: px(20),
        text: training.durationMinutes + " min",
        text_size: px(14),
        color: 0x999999,
        align_h: hmUI.align.RIGHT,
        align_v: hmUI.align.CENTER_V,
      });
    }

    // Bottom padding widget so last card isn't flush against scroll end
    var lastCardBottom = startY + MOCK_TRAININGS.length * (cardH + gap) + px(40);
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: lastCardBottom,
      w: 1,
      h: 1,
      color: 0x000000,
    });

    logger.debug("training-select build DONE");
  },

  onDestroy: function () {
    logger.debug("training-select onDestroy");
  },
});
