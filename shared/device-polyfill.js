// Zepp OS device-side polyfill
// Provides setTimeout/setInterval using @zos/timer

import { createTimer } from '@zos/timer'

if (typeof globalThis.setTimeout === 'undefined') {
  globalThis.setTimeout = function (callback, delay) {
    return createTimer(delay, Number.MAX_SAFE_INTEGER, callback)
  }
}

if (typeof globalThis.setInterval === 'undefined') {
  globalThis.setInterval = function (callback, interval) {
    return createTimer(interval, interval, callback)
  }
}
