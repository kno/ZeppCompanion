// Screen dimensions (Amazfit Balance)
export const SCREEN = {
  WIDTH: 480,
  HEIGHT: 480,
  CENTER_X: 240,
  CENTER_Y: 240,
  SAFE_INSET: 40, // safe area for round screen
}

// Colors (hex integers for Zepp OS)
export const COLORS = {
  // Primary
  PRIMARY: 0x4CAF50,      // green
  PRIMARY_DARK: 0x388E3C,
  ACCENT: 0x58D0FF,       // blue

  // Status
  HR_RED: 0xFC6950,
  PACE_BLUE: 0x58D0FF,
  PROGRESS_GREEN: 0x5BE7A9,
  WARNING_YELLOW: 0xFFD54F,
  ERROR_RED: 0xEF5350,

  // Neutrals
  WHITE: 0xFFFFFF,
  TEXT_PRIMARY: 0xFFFFFF,
  TEXT_SECONDARY: 0x999999,
  TEXT_DIMMED: 0x666666,
  BG_DARK: 0x000000,
  BG_CARD: 0x1A1A1A,
  BG_CARD_HOVER: 0x2A2A2A,

  // Progress arc
  ARC_BG: 0x333333,
  ARC_FILL: 0x5BE7A9,
}

// Typography sizes
export const FONT = {
  TITLE: 32,
  LARGE: 48,
  MEDIUM: 28,
  BODY: 24,
  SMALL: 20,
  TINY: 16,
}

// Common layout positions (centered for 480px round)
export const LAYOUT = {
  CONTENT_WIDTH: 400,    // 480 - 2*40 safe inset
  CONTENT_LEFT: 40,
  BUTTON_WIDTH: 300,
  BUTTON_HEIGHT: 60,
  BUTTON_LEFT: 90,       // (480 - 300) / 2
  BUTTON_RADIUS: 30,
  CARD_RADIUS: 12,
  LIST_ITEM_HEIGHT: 80,
}

// Mascot dimensions
export const MASCOT = {
  WIDTH: 130,
  HEIGHT: 130,
  X: 175, // (480 - 130) / 2
}
