import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";

export const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

export const TITLE_STYLE = {
  text: "ZeppCompanion",
  x: px(0),
  y: px(60),
  w: DEVICE_WIDTH,
  h: px(50),
  color: 0xffffff,
  text_size: px(32),
  align_h: hmUI.align.CENTER_H,
};

export const SUBTITLE_STYLE = {
  text: "Tu companero de entrenamiento",
  x: px(0),
  y: px(120),
  w: DEVICE_WIDTH,
  h: px(30),
  color: 0x999999,
  text_size: px(16),
  align_h: hmUI.align.CENTER_H,
};

export const CIRCLE_STYLE = {
  center_x: DEVICE_WIDTH / 2,
  center_y: px(210),
  radius: px(50),
  color: 0x4CAF50,
};

export const CIRCLE_TEXT_STYLE = {
  text: "Zepp",
  x: px(0),
  y: px(195),
  w: DEVICE_WIDTH,
  h: px(30),
  color: 0xffffff,
  text_size: px(18),
  align_h: hmUI.align.CENTER_H,
};

export const BUTTON_START_STYLE = {
  x: (DEVICE_WIDTH - px(300)) / 2,
  y: px(285),
  w: px(300),
  h: px(60),
  text: "Iniciar Entrenamiento",
  text_size: px(22),
  radius: px(30),
  normal_color: 0x4CAF50,
  press_color: 0x388E3C,
};

export const BUTTON_HISTORY_STYLE = {
  x: (DEVICE_WIDTH - px(300)) / 2,
  y: px(360),
  w: px(300),
  h: px(50),
  text: "Historial",
  text_size: px(20),
  radius: px(25),
  normal_color: 0x1A1A1A,
  press_color: 0x2A2A2A,
};

export const BUTTON_SETTINGS_STYLE = {
  x: (DEVICE_WIDTH - px(300)) / 2,
  y: px(420),
  w: px(300),
  h: px(50),
  text: "Configuracion",
  text_size: px(20),
  radius: px(25),
  normal_color: 0x1A1A1A,
  press_color: 0x2A2A2A,
};
