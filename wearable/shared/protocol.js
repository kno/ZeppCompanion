// Request types (device -> side service -> backend)
export const REQUEST_TYPES = {
  FETCH_TRAININGS: 'fetch_trainings',
  START_TRAINING: 'start_training',
  TRAINING_UPDATE: 'training_update',
  REQUEST_COMPANION: 'request_companion',
  SAVE_RESULTS: 'save_results',
  AUTH_LOGIN: 'auth_login',
}

// Mascot states
export const MASCOT_STATES = {
  IDLE: 'idle',
  TALKING: 'talking',
  CELEBRATING: 'celebrating',
  WORRIED: 'worried',
}

// Companion message tones
export const MESSAGE_TONES = {
  MOTIVATIONAL: 'motivational',
  CORRECTIVE: 'corrective',
  INFORMATIVE: 'informative',
  WARNING: 'warning',
  CELEBRATORY: 'celebratory',
}

// Training types
export const TRAINING_TYPES = {
  CARDIO: 'cardio_continuous',
  INTERVALS: 'intervals',
  FREE: 'free',
}

// Message frequency (seconds)
export const MESSAGE_FREQUENCY = {
  HIGH: 60,
  MEDIUM: 90,
  LOW: 120,
}

// Companion styles
export const COMPANION_STYLES = {
  MOTIVATIONAL: 'motivational',
  STRICT: 'strict',
  NEUTRAL: 'neutral',
}
