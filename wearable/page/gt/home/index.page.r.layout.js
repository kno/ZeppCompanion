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
  y: px(180),
  w: px(150),
  h: px(98),
};

export const BUTTON_START_STYLE = {
  x: (DEVICE_WIDTH - px(350)) / 2,
  y: px(310),
  w: px(350),
  h: px(82),
  text_size: px(32),
  radius: px(36),
  normal_color: 0x4CAF50,
  press_color: 0x388E3C,
};

export const BUTTON_ICON_HISTORY_STYLE = {
  x: px(97),
  y: px(205),
  w: -1,
  h: -1,
  normal_src: "icon_history.png",
  press_src: "icon_history_press.png",
};

export const BUTTON_ICON_SETTINGS_STYLE = {
  x: px(335),
  y: px(205),
  w: -1,
  h: -1,
  normal_src: "icon_settings.png",
  press_src: "icon_settings_press.png",
};
