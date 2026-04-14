import * as hmUI from "@zos/ui"
import { getDeviceInfo } from "@zos/device"
import { px } from "@zos/utils"
import { getColors, FONT_SIZE, SPACING, RADII, COMPONENT } from "../../../utils/theme"

export const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo()

export const MASCOT_STYLE = {
  x: (DEVICE_WIDTH - px(COMPONENT.MASCOT_W)) / 2,
  y: px(42),
  w: px(COMPONENT.MASCOT_W),
  h: px(COMPONENT.MASCOT_H),
}

export const NAME_STYLE = {
  x: px(40),
  w: DEVICE_WIDTH - px(80),
  h: px(32),
  text_size: px(FONT_SIZE.HEADING),
  color: getColors().WHITE,
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
}

export const BADGE_STYLE = {
  w: px(COMPONENT.BADGE_W),
  h: px(COMPONENT.BADGE_H),
  radius: px(RADII.MD),
  text_size: px(FONT_SIZE.TINY),
  textColor: getColors().WHITE,
}

export const CARD_STYLE = {
  w: px(340),
  radius: px(14),
  color: getColors().BG_CARD,
}

export const CARD_ACCENT = {
  offsetX: px(SPACING.SM),
  offsetY: px(SPACING.SM),
  w: px(3),
  radius: px(RADII.SM),
}

export const ROW_DIMS = {
  padV: px(10),
  h: px(24),
  gap: px(4),
  labelX: px(22),
  labelW: px(120),
}

export const ROW_LABEL_STYLE = {
  text_size: px(FONT_SIZE.TINY),
  color: getColors().TEXT_SECONDARY,
  align_h: hmUI.align.LEFT,
  align_v: hmUI.align.CENTER_V,
}

export const ROW_VALUE_STYLE = {
  text_size: px(FONT_SIZE.CAPTION),
  color: getColors().WHITE,
  align_h: hmUI.align.RIGHT,
  align_v: hmUI.align.CENTER_V,
}

export const STATUS_STYLE = {
  h: px(22),
  text_size: px(FONT_SIZE.TINY),
  color: getColors().READY_GREEN,
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
}

export const BUTTON_START_STYLE = {
  w: px(300),
  h: px(64),
  text_size: px(FONT_SIZE.HEADING),
  radius: px(RADII.PILL),
  normal_color: getColors().PRIMARY,
  press_color: getColors().PRIMARY_DARK,
}

export const ERROR_STYLE = {
  x: px(0),
  y: px(200),
  w: DEVICE_WIDTH,
  h: px(50),
  text_size: px(FONT_SIZE.BODY),
  color: getColors().ERROR_RED,
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
}
