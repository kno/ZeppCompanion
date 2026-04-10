import { log as Logger } from "@zos/utils"
import { writeFileSync, rmSync } from "@zos/fs"

var logger = Logger.getLogger("audio-player")

var player = null
var media = null
var tempFileWritten = false
var TEMP_AUDIO_PATH = "companion_audio.mp3"
var prepareListener = null

// Base64 decoder (atob not available in Zepp OS)
var B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
var B64_LOOKUP = {}
for (var ci = 0; ci < B64_CHARS.length; ci++) {
  B64_LOOKUP[B64_CHARS.charAt(ci)] = ci
}

function base64ToArrayBuffer(base64) {
  var str = base64.replace(/=+$/, "")
  var len = str.length
  var outLen = (len * 3) >> 2
  var bytes = new Uint8Array(outLen)
  var p = 0
  for (var i = 0; i < len; i += 4) {
    var a = B64_LOOKUP[str.charAt(i)] || 0
    var b = B64_LOOKUP[str.charAt(i + 1)] || 0
    var c = B64_LOOKUP[str.charAt(i + 2)] || 0
    var d = B64_LOOKUP[str.charAt(i + 3)] || 0
    bytes[p++] = (a << 2) | (b >> 4)
    if (p < outLen) bytes[p++] = ((b & 15) << 4) | (c >> 2)
    if (p < outLen) bytes[p++] = ((c & 3) << 6) | d
  }
  return bytes.buffer
}

function cleanupTempFile() {
  if (!tempFileWritten) return
  try {
    rmSync({ path: TEMP_AUDIO_PATH })
    tempFileWritten = false
  } catch (e) {}
}

function ensureMedia() {
  if (media) return true
  try {
    media = require("@zos/media")
    if (!media || !media.create || !media.id) {
      media = null
      return false
    }
    return true
  } catch (e) {
    return false
  }
}

function ensurePlayer() {
  if (player) return player
  if (!ensureMedia()) return null
  try {
    player = media.create(media.id.PLAYER)
    logger.debug("[audio] player created")
    return player
  } catch (e) {
    logger.debug("[audio] create player err: " + e.message)
    return null
  }
}

/**
 * Play companion audio from base64-encoded MP3 data.
 * Reuses a single Player instance: stop → write file → setSource → prepare → start
 */
export function playCompanionAudio(base64Data) {
  if (!base64Data) return

  try {
    var p = ensurePlayer()
    if (!p) return

    // Stop current playback
    try { p.stop() } catch (e) {}

    // Write new audio file
    cleanupTempFile()
    var audioBuffer = base64ToArrayBuffer(base64Data)
    writeFileSync({ path: TEMP_AUDIO_PATH, data: audioBuffer })
    tempFileWritten = true
    logger.debug("[audio] wrote " + audioBuffer.byteLength + "B")

    // Remove old PREPARE listener if any, add fresh one
    if (prepareListener) {
      try { p.removeEventListener(p.event.PREPARE, prepareListener) } catch (e) {}
    }
    prepareListener = function (result) {
      if (result) {
        logger.debug("[audio] PREPARE ok, start")
        p.start()
      } else {
        logger.debug("[audio] PREPARE fail")
      }
    }
    p.addEventListener(p.event.PREPARE, prepareListener)

    // Set source and prepare
    p.setSource(p.source.FILE, { file: "data://" + TEMP_AUDIO_PATH })
    p.prepare()
  } catch (e) {
    logger.debug("[audio] play error: " + e.message)
  }
}

/**
 * Debug version - returns status string for on-screen display
 */
export function testAudioDebug(base64Data) {
  if (!base64Data) return "ERR: no data"

  try {
    if (!ensureMedia()) return "ERR: no media"

    var audioBuffer = null
    try {
      audioBuffer = base64ToArrayBuffer(base64Data)
    } catch (e) {
      return "ERR: decode " + e.message
    }

    try {
      cleanupTempFile()
      writeFileSync({ path: TEMP_AUDIO_PATH, data: audioBuffer })
      tempFileWritten = true
    } catch (e) {
      return "ERR: write " + e.message
    }

    var p = ensurePlayer()
    if (!p) return "ERR: no player"

    try { p.stop() } catch (e) {}

    try {
      if (prepareListener) {
        try { p.removeEventListener(p.event.PREPARE, prepareListener) } catch (e) {}
      }
      prepareListener = function (result) {
        if (result) {
          p.start()
        }
      }
      p.addEventListener(p.event.PREPARE, prepareListener)
      p.setSource(p.source.FILE, { file: "data://" + TEMP_AUDIO_PATH })
      p.prepare()
    } catch (e) {
      return "ERR: prep " + e.message
    }

    return "OK: " + Math.round(audioBuffer.byteLength / 1024) + "KB"
  } catch (e) {
    return "ERR: " + e.message
  }
}

export function stopAudio() {
  if (!player) return
  try { player.stop() } catch (e) {}
}

export function destroyPlayer() {
  if (player) {
    try { player.stop() } catch (e) {}
    // Do NOT destroy — Zepp OS cannot recreate after destroy()
    // Just stop and leave the singleton alive for reuse
  }
  prepareListener = null
  cleanupTempFile()
}
