const DARK = {
  PRIMARY: 0x4CAF50,
  PRIMARY_DARK: 0x388E3C,
  ACCENT: 0x58D0FF,
  WHITE: 0xFFFFFF,
  TEXT_SECONDARY: 0x999999,
  TEXT_DIMMED: 0x666666,
  BG_DARK: 0x000000,
  BG_CARD: 0x1A1A1A,
  BG_CARD_HOVER: 0x2A2A2A,
  HR_RED: 0xFC6950,
  PACE_BLUE: 0x58D0FF,
  PROGRESS_GREEN: 0x5BE7A9,
  WARNING_YELLOW: 0xFFD54F,
  ERROR_RED: 0xEF5350,
  ARC_BG: 0x333333,
  ARC_FILL: 0x5BE7A9,
  SEPARATOR: 0x333333,
  READY_GREEN: 0x69F0AE,
  ICON_BG: 0x1A1A1A,
}

const LIGHT = {
  PRIMARY: 0x388E3C,
  PRIMARY_DARK: 0x1B5E20,
  ACCENT: 0x0288D1,
  WHITE: 0x111111,
  TEXT_SECONDARY: 0x555555,
  TEXT_DIMMED: 0x888888,
  BG_DARK: 0xF5F5F5,
  BG_CARD: 0xE0E0E0,
  BG_CARD_HOVER: 0xCCCCCC,
  HR_RED: 0xD32F2F,
  PACE_BLUE: 0x0277BD,
  PROGRESS_GREEN: 0x2E7D32,
  WARNING_YELLOW: 0xF9A825,
  ERROR_RED: 0xC62828,
  ARC_BG: 0xBDBDBD,
  ARC_FILL: 0x2E7D32,
  SEPARATOR: 0xCCCCCC,
  READY_GREEN: 0x2E7D32,
  ICON_BG: 0x444444,
}

export function getColors() {
  var prefs = getApp().globalData.userPreferences
  return prefs && prefs.darkMode !== false ? DARK : LIGHT
}

export function applyBackground() {
  var hmUI = require("@zos/ui")
  var device = require("@zos/device")
  var info = device.getDeviceInfo()
  var colors = getColors()
  hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: 0,
    y: 0,
    w: info.width,
    h: info.height * 3,
    color: colors.BG_DARK,
  })
}
