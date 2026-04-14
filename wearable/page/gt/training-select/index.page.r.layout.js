import * as hmUI from "@zos/ui"
import { getDeviceInfo } from "@zos/device"
import { px } from "@zos/utils"
import { getColors, FONT_SIZE, SPACING, RADII } from "../../../utils/theme"

export const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo()

export const HEADER_STYLE = {
  x: 0,
  y: px(20),
  w: DEVICE_WIDTH,
  h: px(30),
  text_size: px(FONT_SIZE.BODY),
  color: getColors().PRIMARY,
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
}

export const SEPARATOR_STYLE = {
  x: (DEVICE_WIDTH - px(120)) / 2,
  y: px(54),
  w: px(120),
  h: px(2),
  radius: px(1),
  color: getColors().SEPARATOR,
}

export const CARD_DIMS = {
  w: px(380),
  h: px(76),
  gap: px(SPACING.SM),
  startY: px(68),
  x: (DEVICE_WIDTH - px(380)) / 2,
  radius: px(RADII.LG),
  color: getColors().BG_CARD,
}

export const ACCENT_BAR = {
  pad: px(SPACING.SM),
  w: px(4),
  radius: px(RADII.SM),
}

export const CARD_NAME_STYLE = {
  offsetX: px(22),
  offsetY: px(14),
  h: px(26),
  text_size: px(FONT_SIZE.SMALL),
  color: getColors().WHITE,
  align_h: hmUI.align.LEFT,
}

export const CARD_TYPE_STYLE = {
  offsetX: px(22),
  offsetY: px(44),
  w: px(120),
  h: px(20),
  text_size: px(FONT_SIZE.TINY),
  align_h: hmUI.align.LEFT,
}

export const CARD_DURATION_STYLE = {
  offsetW: px(70),
  offsetY: px(30),
  w: px(60),
  h: px(20),
  text_size: px(FONT_SIZE.TINY),
  color: getColors().TEXT_SECONDARY,
  align_h: hmUI.align.RIGHT,
}
