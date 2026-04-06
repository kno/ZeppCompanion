import { widget, prop } from '@zos/ui'
import { createTimer, stopTimer } from '@zos/timer'
import { MASCOT_STATES } from '../shared/protocol'

// Animation config per state
var ANIM_CONFIG = {}
ANIM_CONFIG[MASCOT_STATES.IDLE] = {
  prefix: 'idle_',
  frames: 8,
  fps: 12,
  loop: true,
}
ANIM_CONFIG[MASCOT_STATES.TALKING] = {
  prefix: 'talk_',
  frames: 6,
  fps: 12,
  loop: true,
}
ANIM_CONFIG[MASCOT_STATES.CELEBRATING] = {
  prefix: 'celebrate_',
  frames: 8,
  fps: 15,
  loop: false,
}
ANIM_CONFIG[MASCOT_STATES.WORRIED] = {
  prefix: 'worried_',
  frames: 6,
  fps: 10,
  loop: true,
}

/**
 * Creates a mascot controller for managing animation states
 * @param {object} animWidget - The IMG_ANIM widget reference
 * @returns {object} mascot controller
 */
export function createMascotController(animWidget) {
  var currentState = MASCOT_STATES.IDLE
  var revertTimerId = null

  return {
    /**
     * Get current mascot state
     * @returns {string}
     */
    getState: function () {
      return currentState
    },

    /**
     * Set mascot to a new animation state
     * @param {string} state - one of MASCOT_STATES values
     * @param {number} [revertAfterMs] - auto-revert to IDLE after this many ms (0 = no revert)
     */
    setState: function (state, revertAfterMs) {
      if (!animWidget) return
      if (!ANIM_CONFIG[state]) return

      // Clear any pending revert timer
      if (revertTimerId !== null) {
        stopTimer(revertTimerId)
        revertTimerId = null
      }

      var config = ANIM_CONFIG[state]
      currentState = state

      // Stop current animation
      animWidget.setProperty(prop.ANIM_STATUS, widget.anim_status.STOP)

      // Update animation properties
      animWidget.setProperty(prop.MORE, {
        anim_prefix: config.prefix,
        anim_ext: 'png',
        anim_fps: config.fps,
        anim_size: config.frames,
        repeat_count: config.loop ? 0 : 1,
        anim_status: widget.anim_status.START,
      })

      // Auto-revert to IDLE after duration
      if (revertAfterMs && revertAfterMs > 0 && state !== MASCOT_STATES.IDLE) {
        var self = this
        revertTimerId = createTimer(
          revertAfterMs,
          0,  // no repeat
          function () {
            revertTimerId = null
            self.setState(MASCOT_STATES.IDLE, 0)
          }
        )
      }
    },

    /**
     * Convenience: show talking state with auto-revert
     * @param {number} [durationMs=5000] - how long to show talking
     */
    talk: function (durationMs) {
      this.setState(MASCOT_STATES.TALKING, durationMs || 5000)
    },

    /**
     * Convenience: show celebrating state with auto-revert
     * @param {number} [durationMs=4000]
     */
    celebrate: function (durationMs) {
      this.setState(MASCOT_STATES.CELEBRATING, durationMs || 4000)
    },

    /**
     * Convenience: show worried state with auto-revert
     * @param {number} [durationMs=6000]
     */
    worry: function (durationMs) {
      this.setState(MASCOT_STATES.WORRIED, durationMs || 6000)
    },

    /**
     * Return to idle state immediately
     */
    idle: function () {
      this.setState(MASCOT_STATES.IDLE, 0)
    },

    /**
     * Clean up timers - call from onDestroy()
     */
    destroy: function () {
      if (revertTimerId !== null) {
        stopTimer(revertTimerId)
        revertTimerId = null
      }
      if (animWidget) {
        animWidget.setProperty(prop.ANIM_STATUS, widget.anim_status.STOP)
      }
      animWidget = null
    },
  }
}

// Re-export states for convenience
export { MASCOT_STATES }
