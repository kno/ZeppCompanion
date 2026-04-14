import * as hmUI from "@zos/ui"
import { getDeviceInfo } from "@zos/device"
import { px } from "@zos/utils"
import { getColors, FONT_SIZE, RADII } from "../../../utils/theme"

export const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo()

export const TITLE_STYLE = {
  x: px(0),
  y: px(50),
  w: DEVICE_WIDTH,
  h: px(40),
  text_size: px(FONT_SIZE.HEADING),
  color: getColors().WHITE,
  align_h: hmUI.align.CENTER_H,
}

export const SECTION_LABEL_STYLE = {
  x: px(40),
  w: px(400),
  h: px(24),
  text_size: px(FONT_SIZE.SMALL),
  color: getColors().TEXT_SECONDARY,
}

export const SECTION_Y = {
  VISUAL: px(120),
  MESSAGES: px(220),
  AUDIO: px(320),
  SPEED: px(420),
  FREQUENCY: px(520),
}

export const PILL_DIMS = {
  w: px(140),
  h: px(45),
  leftX: px(110),
  rightX: px(260),
  radius: px(22),
  pillOffsetY: px(35),
}

export const PILL_TRIPLE_DIMS = {
  w: px(110),
  h: px(45),
  x1: px(50),
  x2: px(185),
  x3: px(320),
  radius: px(22),
}

export const FREQ_LABEL_STYLE = {
  x: px(0),
  y: px(552),
  w: DEVICE_WIDTH,
  h: px(30),
  text_size: px(FONT_SIZE.BODY),
  color: getColors().ACCENT,
  align_h: hmUI.align.CENTER_H,
}

export const VERSION_STYLE = {
  x: px(0),
  y: px(660),
  w: DEVICE_WIDTH,
  h: px(24),
  text_size: px(FONT_SIZE.CAPTION),
  color: getColors().TEXT_DIMMED,
  align_h: hmUI.align.CENTER_H,
}

export const BACK_BUTTON = {
  x: px(90),
  y: px(695),
  w: px(300),
  h: px(50),
  radius: px(RADII.PILL - 2),
  text_size: px(FONT_SIZE.BODY),
}
