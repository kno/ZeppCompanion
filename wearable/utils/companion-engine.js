import { MASCOT_STATES, MESSAGE_TONES } from '../shared/protocol'

// ============================================================
// Fallback message bank (used when LLM is unavailable)
// ============================================================

var MESSAGES = {
  motivational: [
    'Sigue asi, lo estas haciendo genial!',
    'Cada paso cuenta, no pares!',
    'Eres mas fuerte de lo que crees!',
    'Buen ritmo, mantente constante!',
    'Tu esfuerzo vale la pena!',
    'Estas en racha, no aflojes!',
    'Tu cuerpo puede, tu mente decide!',
    'Paso a paso llegaras lejos!',
    'Confia en tu entrenamiento!',
    'Hoy es tu dia, aprovechalo!',
    'La constancia hace al campeon!',
    'Respira profundo y sigue adelante!',
    'Cada kilometro te hace mas fuerte!',
    'Tu version de ayer estaria orgullosa!',
    'El dolor es temporal, el orgullo es eterno!',
  ],
  corrective_fast: [
    'Baja un poco el ritmo, guarda energia.',
    'Vas muy rapido, modera la velocidad.',
    'Cuidado con el ritmo, no te pases.',
    'Reduce la velocidad un poco.',
    'Mas lento, que aun queda camino.',
  ],
  corrective_slow: [
    'Puedes darle un poco mas, animo!',
    'Intenta subir el ritmo ligeramente.',
    'Acelera un poco, puedes hacerlo!',
    'Vamos, que puedes ir mas rapido!',
    'Sube la intensidad, tu puedes!',
  ],
  hr_warning: [
    'Tu corazon va muy alto, baja el ritmo.',
    'Respira profundo, tu FC esta elevada.',
    'Cuidado con la frecuencia cardiaca!',
    'Modera la intensidad, FC muy alta.',
    'Para un momento y recupera el aliento.',
  ],
  hr_low: [
    'Puedes subir la intensidad un poco.',
    'Tu corazon esta tranquilo, dale mas!',
    'Tienes margen, sube el ritmo.',
  ],
  milestone_25: [
    'Un cuarto completado, buen inicio!',
    'Llevas el 25%, sigue asi!',
    'Primer cuarto hecho, quedan tres!',
  ],
  milestone_50: [
    'Mitad del camino, eres imparable!',
    'El 50% esta hecho, sigue fuerte!',
    'Ya vas por la mitad, increible!',
  ],
  milestone_75: [
    'Tres cuartos completados, casi llegas!',
    '75% hecho, el final esta cerca!',
    'Solo queda un cuarto, dale todo!',
  ],
  milestone_final: [
    'Ultimo tramo, dalo todo!',
    'Ya casi terminas, sprint final!',
    'El final esta aqui, no te rindas!',
    'Ultimos metros, empuja fuerte!',
  ],
  finish: [
    'Gran trabajo! Has completado el entrenamiento!',
    'Excelente sesion! Descansa bien.',
    'Lo lograste! Eres una maquina!',
    'Entrenamiento completado, bien hecho!',
  ],
}

// Track last used index per category to avoid immediate repeats
var lastUsedIndex = {}

/**
 * Pick a random message from a category, avoiding the last one used
 * @param {string} category - message category key
 * @returns {string} message
 */
function pickMessage(category) {
  var pool = MESSAGES[category]
  if (!pool || pool.length === 0) return ''

  var lastIdx = lastUsedIndex[category]
  var idx
  if (pool.length === 1) {
    idx = 0
  } else {
    do {
      idx = Math.floor(Math.random() * pool.length)
    } while (idx === lastIdx)
  }
  lastUsedIndex[category] = idx
  return pool[idx]
}

/**
 * Evaluate local companion rules based on current training state
 * Returns a message + mascot state if a rule fires, or null if no rule applies
 *
 * @param {object} session - current training session state
 * @param {number} session.currentHR - current heart rate
 * @param {number} session.currentPace - current pace in sec/km
 * @param {number} session.percentComplete - progress 0.0 to 1.0
 * @param {number} session.elapsedMs - elapsed time in ms
 * @param {object} session.eventsTriggered - map of triggered event names
 * @param {object} training - training configuration
 * @param {number} [training.paceGoalSecPerKm] - target pace
 * @param {number} [training.hrZoneMax] - max heart rate zone
 * @param {number} [training.hrZoneMin] - min heart rate zone
 * @returns {object|null} { message, tone, mascotState } or null
 */
export function evaluateLocalRules(session, training) {
  if (!session || !training) return null

  var hr = session.currentHR || 0
  var pace = session.currentPace || 0
  var progress = session.percentComplete || 0
  var triggered = session.eventsTriggered || {}

  // ---- Priority 1: HR Safety ----
  var hrMax = training.hrZoneMax || 180
  if (hr > hrMax) {
    return {
      message: pickMessage('hr_warning'),
      tone: MESSAGE_TONES.WARNING,
      mascotState: MASCOT_STATES.WORRIED,
    }
  }

  // ---- Priority 2: Pace Correction ----
  var targetPace = training.paceGoalSecPerKm || 0
  if (targetPace > 0 && pace > 0) {
    // Too fast (pace lower = faster)
    if (pace < targetPace - 20) {
      return {
        message: pickMessage('corrective_fast'),
        tone: MESSAGE_TONES.CORRECTIVE,
        mascotState: MASCOT_STATES.TALKING,
      }
    }
    // Too slow (pace higher = slower)
    if (pace > targetPace + 20) {
      return {
        message: pickMessage('corrective_slow'),
        tone: MESSAGE_TONES.CORRECTIVE,
        mascotState: MASCOT_STATES.TALKING,
      }
    }
  }

  // ---- Priority 3: Milestone Events ----
  if (progress >= 0.80 && !triggered['final_push']) {
    triggered['final_push'] = true
    return {
      message: pickMessage('milestone_final'),
      tone: MESSAGE_TONES.CELEBRATORY,
      mascotState: MASCOT_STATES.CELEBRATING,
    }
  }

  if (progress >= 0.75 && !triggered['milestone_75']) {
    triggered['milestone_75'] = true
    return {
      message: pickMessage('milestone_75'),
      tone: MESSAGE_TONES.INFORMATIVE,
      mascotState: MASCOT_STATES.CELEBRATING,
    }
  }

  if (progress >= 0.50 && !triggered['milestone_50']) {
    triggered['milestone_50'] = true
    return {
      message: pickMessage('milestone_50'),
      tone: MESSAGE_TONES.CELEBRATORY,
      mascotState: MASCOT_STATES.CELEBRATING,
    }
  }

  if (progress >= 0.25 && !triggered['milestone_25']) {
    triggered['milestone_25'] = true
    return {
      message: pickMessage('milestone_25'),
      tone: MESSAGE_TONES.INFORMATIVE,
      mascotState: MASCOT_STATES.TALKING,
    }
  }

  // ---- Priority 4: HR Low (can push harder) ----
  var hrMin = training.hrZoneMin || 0
  if (hrMin > 0 && hr > 0 && hr < hrMin - 10) {
    return {
      message: pickMessage('hr_low'),
      tone: MESSAGE_TONES.MOTIVATIONAL,
      mascotState: MASCOT_STATES.TALKING,
    }
  }

  // No specific rule fired
  return null
}

/**
 * Get a generic motivational fallback message
 * Used when no local rule fires AND LLM is unavailable
 * @returns {object} { message, tone, mascotState }
 */
export function getFallbackMessage() {
  return {
    message: pickMessage('motivational'),
    tone: MESSAGE_TONES.MOTIVATIONAL,
    mascotState: MASCOT_STATES.TALKING,
  }
}

/**
 * Get a finish message for end of training
 * @returns {object} { message, tone, mascotState }
 */
export function getFinishMessage() {
  return {
    message: pickMessage('finish'),
    tone: MESSAGE_TONES.CELEBRATORY,
    mascotState: MASCOT_STATES.CELEBRATING,
  }
}

/**
 * Parse HR zones from training config
 * @param {object} training - training object from backend
 * @returns {object} { hrZoneMin, hrZoneMax }
 */
export function parseHRZones(training) {
  var hrZoneMin = 0
  var hrZoneMax = 180
  var zones = training.hrZones
  if (zones && zones.length > 0) {
    hrZoneMin = zones[0].min || 0
    hrZoneMax = zones[zones.length - 1].max || 180
  }
  return { hrZoneMin: hrZoneMin, hrZoneMax: hrZoneMax }
}
