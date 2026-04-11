import { localStorage } from "@zos/storage"

const PREFS_KEY = "user_prefs"

const DEFAULT_PREFERENCES = {
  darkMode: true,
  enableCompanionMessages: true,
  enableAudioMessages: true,
  messageFrequency: 90,
  speedUnit: 'min_km',
}

export function loadPreferences() {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return { ...DEFAULT_PREFERENCES }
    const stored = JSON.parse(raw)
    return { ...DEFAULT_PREFERENCES, ...stored }
  } catch (e) {
    return { ...DEFAULT_PREFERENCES }
  }
}

export function savePreferences(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch (e) {
    // ignore
  }
}
