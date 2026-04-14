import { getDeviceInfo } from "@zos/device"
import { px } from "@zos/utils"
import { FONT_SIZE } from "../../../utils/theme"

var deviceInfo = getDeviceInfo()
export const DEVICE_WIDTH = deviceInfo.width
export const DEVICE_HEIGHT = deviceInfo.height

export const AT = {
  TIME_Y: px(30),
  TIME_SIZE: px(42),

  ARC_X: px(10),
  ARC_Y: px(10),
  ARC_SIZE: px(460),
  ARC_STROKE: px(6),

  HR_Y: px(90),
  HR_SIZE: px(FONT_SIZE.HEADING),

  PACE_X: px(30),
  PACE_Y: px(135),
  PACE_W: px(200),

  DIST_X: px(250),
  DIST_Y: px(135),
  DIST_W: px(200),

  STAT_H: px(24),
  STAT_SIZE: px(FONT_SIZE.SMALL),
  LABEL_SIZE: px(FONT_SIZE.TINY),

  MASCOT_X: (DEVICE_WIDTH - px(150)) / 2,
  MASCOT_Y: px(178),
  MASCOT_W: px(150),
  MASCOT_H: px(98),

  STEPS_Y: px(278),

  MSG_X: px(60),
  MSG_Y: px(322),
  MSG_W: px(360),
  MSG_H: px(40),
  MSG_SIZE: px(FONT_SIZE.CAPTION),

  BTN_Y: px(365),
  BTN_H: px(46),
  BTN_RADIUS: px(23),
  PAUSE_X: px(80),
  PAUSE_W: px(140),
  STOP_X: px(260),
  STOP_W: px(140),
}

export const AUDIO_TOGGLE = {
  size: 36,
  iconSize: 22,
  get iconOffset() { return (this.size - this.iconSize) / 2 },
  get x() { return 480 - this.size - 8 },
  get y() { return Math.round(deviceInfo.height / 2 - this.size / 2) },
}
