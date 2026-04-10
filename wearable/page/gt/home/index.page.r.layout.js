import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";

export const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

export const TITLE_STYLE = {
  text: "ZeppCompanion",
  x: px(0),
  y: px(50),
  w: DEVICE_WIDTH,
  h: px(40),
  color: 0xffffff,
  text_size: px(30),
  align_h: hmUI.align.CENTER_H,
};

export const SUBTITLE_STYLE = {
  text: "Tu companero de entrenamiento",
  x: px(0),
  y: px(95),
  w: DEVICE_WIDTH,
  h: px(25),
  color: 0x999999,
  text_size: px(16),
  align_h: hmUI.align.CENTER_H,
};

export const MASCOT_STYLE = {
  x: (DEVICE_WIDTH - px(150)) / 2,
  y: px(130),
  w: px(150),
  h: px(98),
};

export const BUTTON_START_STYLE = {
  x: (DEVICE_WIDTH - px(280)) / 2,
  y: px(245),
  w: px(280),
  h: px(56),
  text: "Iniciar Entrenamiento v4",
  text_size: px(21),
  radius: px(28),
  normal_color: 0x4CAF50,
  press_color: 0x388E3C,
};

export const BUTTON_HISTORY_STYLE = {
  x: (DEVICE_WIDTH - px(240)) / 2,
  y: px(314),
  w: px(240),
  h: px(44),
  text: "Historial",
  text_size: px(18),
  radius: px(22),
  normal_color: 0x1A1A1A,
  press_color: 0x2A2A2A,
};

export const BUTTON_SETTINGS_STYLE = {
  x: (DEVICE_WIDTH - px(240)) / 2,
  y: px(370),
  w: px(240),
  h: px(44),
  text: "Configuracion",
  text_size: px(18),
  radius: px(22),
  normal_color: 0x1A1A1A,
  press_color: 0x2A2A2A,
};
