import * as hmUI from "@zos/ui"
import { getDeviceInfo } from "@zos/device"
import { px } from "@zos/utils"
import { getColors, FONT_SIZE, RADII } from "../../../utils/theme"

export const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo()

export const TITLE_STYLE = {
  x: px(0),
  y: px(30),
  w: DEVICE_WIDTH,
  h: px(40),
  text_size: px(FONT_SIZE.TITLE),
  color: getColors().WHITE,
  align_h: hmUI.align.CENTER_H,
}

export const SUBTITLE_STYLE = {
  x: px(0),
  y: px(75),
  w: DEVICE_WIDTH,
  h: px(30),
  text_size: px(FONT_SIZE.SMALL),
  color: getColors().TEXT_SECONDARY,
  align_h: hmUI.align.CENTER_H,
}

export const TIME_VALUE_STYLE = {
  x: px(0),
  y: px(120),
  w: DEVICE_WIDTH,
  h: px(50),
  text_size: px(FONT_SIZE.DISPLAY),
  color: getColors().WHITE,
  align_h: hmUI.align.CENTER_H,
}

export const TIME_LABEL_STYLE = {
  x: px(0),
  y: px(170),
  w: DEVICE_WIDTH,
  h: px(24),
  text_size: px(FONT_SIZE.CAPTION),
  color: getColors().TEXT_SECONDARY,
  align_h: hmUI.align.CENTER_H,
}

export const METRIC_LEFT = {
  x: px(40),
  y: px(210),
  w: px(180),
  valueH: px(30),
  labelH: px(20),
  labelY: px(240),
}

export const METRIC_RIGHT = {
  x: px(260),
  y: px(210),
  w: px(180),
  valueH: px(30),
  labelH: px(20),
  labelY: px(240),
}

export const METRIC_VALUE_SIZE = px(FONT_SIZE.BODY)
export const METRIC_LABEL_SIZE = px(FONT_SIZE.CAPTION)

export const PACE_STYLE = {
  x: px(0),
  y: px(280),
  w: DEVICE_WIDTH,
  valueH: px(30),
  labelY: px(310),
  labelH: px(20),
}

export const CONGRATS_STYLE = {
  x: px(40),
  y: px(340),
  w: px(400),
  h: px(40),
  text_size: px(FONT_SIZE.SMALL),
  color: getColors().WARNING_YELLOW,
  align_h: hmUI.align.CENTER_H,
  text_style: hmUI.text_style.WRAP,
}

export const BUTTON_BACK_STYLE = {
  x: px(90),
  y: px(390),
  w: px(300),
  h: px(55),
  text_size: px(FONT_SIZE.BODY),
  radius: px(RADII.PILL - 2),
  color: getColors().WHITE,
  normal_color: getColors().BG_CARD,
  press_color: getColors().BG_CARD_HOVER,
}
