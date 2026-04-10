import { BaseSideService } from "@zeppos/zml/base-side"

var DEFAULT_API_BASE = "http://192.168.1.100:3000"

function getApiBase() {
  var stored = settings.settingsStorage.getItem("apiBase")
  return stored || DEFAULT_API_BASE
}

function getAccessToken() {
  return settings.settingsStorage.getItem("accessToken") || ""
}

function setAccessToken(token) {
  settings.settingsStorage.setItem("accessToken", token)
}

function getRefreshToken() {
  return settings.settingsStorage.getItem("refreshToken") || ""
}

function setRefreshToken(token) {
  settings.settingsStorage.setItem("refreshToken", token)
}

function setAuthStatus(status, userName) {
  settings.settingsStorage.setItem("authStatus", status)
  if (userName) {
    settings.settingsStorage.setItem("userName", userName)
  }
}

/**
 * Generic API request to the backend.
 * All successful responses are wrapped in { data: ... } by the backend.
 */
var _refreshing = false

async function tryRefreshToken() {
  var rt = getRefreshToken()
  if (!rt) {
    console.log("[side] no refresh token stored, cannot refresh")
    return false
  }
  if (_refreshing) return false
  _refreshing = true

  try {
    var base = getApiBase()
    console.log("[side] attempting token refresh...")
    var response = await fetch({
      url: base + "/api/auth/refresh",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
    })

    var body =
      typeof response.body === "string"
        ? JSON.parse(response.body)
        : response.body

    if (response.status >= 400) {
      console.log("[side] token refresh failed: " + response.status)
      return false
    }

    var data = body && body.data !== undefined ? body.data : body
    if (data && data.accessToken) {
      setAccessToken(data.accessToken)
      if (data.refreshToken) {
        setRefreshToken(data.refreshToken)
      }
      console.log("[side] token refresh successful")
      return true
    }
    return false
  } catch (e) {
    console.log("[side] token refresh error: " + e.message)
    return false
  } finally {
    _refreshing = false
  }
}

async function apiRequest(path, options, _isRetry) {
  var opts = options || {}
  var base = getApiBase()
  var token = getAccessToken()

  var fetchOpts = {
    url: base + path,
    method: opts.method || "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }

  if (token) {
    fetchOpts.headers["Authorization"] = "Bearer " + token
  }

  if (opts.body) {
    fetchOpts.body = JSON.stringify(opts.body)
  }

  console.log("[side] " + fetchOpts.method + " " + fetchOpts.url)

  var response = await fetch(fetchOpts)
  var body =
    typeof response.body === "string"
      ? JSON.parse(response.body)
      : response.body

  // Auto-refresh on 401 (expired token) — retry once
  if (response.status === 401 && !_isRetry) {
    console.log("[side] got 401, trying token refresh...")
    var refreshed = await tryRefreshToken()
    if (refreshed) {
      return apiRequest(path, options, true)
    }
  }

  if (response.status >= 400) {
    var errorMsg = (body && body.error) || "Error " + response.status
    throw new Error(errorMsg)
  }

  // Backend wraps all responses in { data: ... }
  return body && body.data !== undefined ? body.data : body
}

/**
 * Authenticate with backend and store tokens
 */
async function handleLogin(params, res) {
  try {
    // apiRequest already unwraps .data, so result = { user, accessToken }
    var result = await apiRequest("/api/auth/login", {
      method: "POST",
      body: {
        email: params.email,
        password: params.password,
      },
    })

    setAccessToken(result.accessToken)
    if (result.refreshToken) {
      setRefreshToken(result.refreshToken)
    }
    var name =
      (result.user && result.user.name) ||
      (result.user && result.user.email) ||
      ""
    setAuthStatus("authenticated", name)

    res(null, { success: true, user: result.user })
  } catch (error) {
    setAuthStatus("error")
    res(null, { success: false, error: error.message })
  }
}

/**
 * Fetch user's trainings from backend
 */
async function handleFetchTrainings(params, res) {
  try {
    // result = array of trainings (unwrapped from .data)
    var result = await apiRequest("/api/trainings")
    res(null, { success: true, trainings: result })
  } catch (error) {
    res(null, { success: false, error: error.message })
  }
}

/**
 * Create a new training session on the backend
 */
async function handleStartTraining(params, res) {
  try {
    var result = await apiRequest("/api/sessions", {
      method: "POST",
      body: { trainingId: params.trainingId },
    })
    res(null, { success: true, session: result })
  } catch (error) {
    res(null, { success: false, error: error.message })
  }
}

/**
 * Send periodic training data update (fire-and-forget style)
 */
async function handleTrainingUpdate(params, res) {
  res(null, { success: true })
}

/**
 * Request an AI companion message from the backend LLM.
 * Backend expects: { sessionId, metrics: { heart_rate, pace_sec_per_km, elapsed_sec, distance_m, progress_pct } }
 */
async function handleRequestCompanion(params, res) {
  try {
    var elapsedSec = Math.round((params.elapsed || 0) / 1000)
    var body = {
      sessionId: params.sessionId,
      metrics: {
        heart_rate: Math.round(params.heartRate || 0),
        pace_sec_per_km: Math.round(params.pace || 0),
        elapsed_sec: elapsedSec,
        distance_m: Math.round(params.distance || 0),
        progress_pct: Math.min(1, Math.max(0, params.progress || 0)),
      },
    }
    console.log("[side][companion] POST /api/companion/message body=" + JSON.stringify(body))
    var result = await apiRequest("/api/companion/message", {
      method: "POST",
      body: body,
    })
    var audioLen = (result && result.audioBase64) ? result.audioBase64.length : 0
    console.log("[side][companion] response msg=" + (result && result.message || "") + " tone=" + (result && result.tone || "") + " hasAudio=" + !!(result && result.audioBase64))
    console.log("[side][companion] response audio=" + audioLen + " chars")
    // result = { message, tone, mascot_state, audioBase64 }
    res(null, { success: true, companion: result })
  } catch (error) {
    console.log("[side][companion] ERROR: " + error.message)
    res(null, { success: false, error: error.message })
  }
}

/**
 * Save training results to backend (mark session complete).
 * Backend expects: { totalDurationSec, totalDistanceM, avgHeartRate, maxHeartRate, avgPaceSecPerKm, caloriesBurned }
 */
async function handleSaveResults(params, res) {
  try {
    var durationSec = Math.round((params.durationMs || 0) / 1000)
    var result = await apiRequest(
      "/api/sessions/" + params.sessionId + "/complete",
      {
        method: "POST",
        body: {
          totalDurationSec: durationSec,
          totalDistanceM: Math.round(params.distanceMeters || 0),
          avgHeartRate: Math.round(params.avgHeartRate || 0),
          maxHeartRate: Math.round(params.maxHeartRate || 0),
          avgPaceSecPerKm: Math.round(params.avgPaceSecPerKm || 0),
          caloriesBurned: Math.round(params.caloriesBurned || 0),
        },
      }
    )
    res(null, { success: true, session: result })
  } catch (error) {
    res(null, { success: false, error: error.message })
  }
}

AppSideService(
  BaseSideService({
    onInit() {
      console.log("[side] Service initialized")

      // Listen for login triggers from the phone settings page.
      // The settings page runs in an HTTPS WebView and cannot make
      // HTTP requests directly (mixed content), so login goes through
      // the side service which has unrestricted network access.
      settings.settingsStorage.addListener("change", function (data) {
        if (data.key === "loginTrigger" && data.newValue) {
          try {
            var creds = JSON.parse(data.newValue)
            handleLogin(creds, function (err, result) {
              if (result && !result.success) {
                settings.settingsStorage.setItem("loginError", result.error || "Error desconocido")
              }
            })
          } catch (e) {
            console.log("[side] Failed to parse login trigger: " + e.message)
            settings.settingsStorage.setItem("authStatus", "error")
            settings.settingsStorage.setItem("loginError", e.message)
          }
          settings.settingsStorage.removeItem("loginTrigger")
        }
      })
    },

    onRequest(req, res) {
      console.log("[side] Request: " + req.method)
      var params = req.params || {}

      switch (req.method) {
        case "check_auth": {
          var accessToken = settings.settingsStorage.getItem("accessToken") || ""
          var authStatus = settings.settingsStorage.getItem("authStatus") || ""
          var userName = settings.settingsStorage.getItem("userName") || ""
          var authenticated = authStatus === "authenticated" && !!accessToken
          res(null, { success: true, authenticated: authenticated, userName: userName })
          break
        }
        case "auth_login":
          handleLogin(params, res)
          break
        case "fetch_trainings":
          handleFetchTrainings(params, res)
          break
        case "start_training":
          handleStartTraining(params, res)
          break
        case "training_update":
          handleTrainingUpdate(params, res)
          break
        case "request_companion":
          handleRequestCompanion(params, res)
          break
        case "save_results":
          handleSaveResults(params, res)
          break
        default:
          res(null, { error: "Unknown method: " + req.method })
      }
    },

    onRun() {},
    onDestroy() {},
  })
)
