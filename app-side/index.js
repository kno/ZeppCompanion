import { MessageBuilder } from '../shared/message-side'

const messageBuilder = new MessageBuilder()

// Configure these via settings storage or hardcode for dev
const BASE_URL = 'http://localhost:3000'
let authToken = ''

async function handleRequest(ctx) {
  var payload = messageBuilder.buf2Json(ctx.request.payload)
  console.log('[Side] Request:', payload.type)

  try {
    switch (payload.type) {
      case 'fetch_trainings':
        return await handleFetchTrainings(ctx)

      case 'start_training':
        return await handleStartTraining(ctx, payload)

      case 'training_update':
        return await handleTrainingUpdate(ctx, payload)

      case 'request_companion':
        return await handleRequestCompanion(ctx, payload)

      case 'save_results':
        return await handleSaveResults(ctx, payload)

      case 'auth_login':
        return await handleLogin(ctx, payload)

      default:
        // Legacy: generic HTTP proxy
        return await handleGenericRequest(ctx, payload)
    }
  } catch (error) {
    console.log('[Side] Error:', error.message || error)
    ctx.response({
      data: { error: error.message || 'Unknown error' },
    })
  }
}

async function apiRequest(method, path, body) {
  var options = {
    url: BASE_URL + '/api' + path,
    method: method,
    headers: {
      'Content-Type': 'application/json',
    },
  }

  if (authToken) {
    options.headers['Authorization'] = 'Bearer ' + authToken
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  var res = await fetch(options)
  var data = typeof res.body === 'string' ? JSON.parse(res.body) : res.body
  return data
}

async function handleFetchTrainings(ctx) {
  var result = await apiRequest('GET', '/trainings')
  ctx.response({ data: result })
}

async function handleStartTraining(ctx, payload) {
  var result = await apiRequest('POST', '/sessions', {
    trainingId: payload.trainingId,
  })
  ctx.response({ data: result })
}

async function handleTrainingUpdate(ctx, payload) {
  var result = await apiRequest('POST', '/companion/message', {
    sessionId: payload.sessionId,
    metrics: payload.metrics,
  })
  ctx.response({ data: result })
}

async function handleRequestCompanion(ctx, payload) {
  var result = await apiRequest('POST', '/companion/message', {
    sessionId: payload.sessionId,
    metrics: payload.metrics,
  })
  ctx.response({ data: result })
}

async function handleSaveResults(ctx, payload) {
  var result = await apiRequest('POST', '/sessions/' + payload.sessionId + '/complete', {
    totalDurationSec: payload.totalDurationSec,
    totalDistanceM: payload.totalDistanceM,
    avgHeartRate: payload.avgHeartRate,
    maxHeartRate: payload.maxHeartRate,
    avgPaceSecPerKm: payload.avgPaceSecPerKm,
    caloriesBurned: payload.caloriesBurned,
  })
  ctx.response({ data: result })
}

async function handleLogin(ctx, payload) {
  var result = await apiRequest('POST', '/auth/login', {
    email: payload.email,
    password: payload.password,
  })
  if (result.data && result.data.accessToken) {
    authToken = result.data.accessToken
    console.log('[Side] Auth token stored')
  }
  ctx.response({ data: result })
}

async function handleGenericRequest(ctx, payload) {
  var url = payload.url || payload.params?.url
  if (!url) {
    ctx.response({ data: { error: 'No URL provided' } })
    return
  }
  var res = await fetch({ url: url, method: payload.method || 'GET' })
  var data = typeof res.body === 'string' ? JSON.parse(res.body) : res.body
  ctx.response({ data: data })
}

AppSideService({
  onInit() {
    console.log('[Side] ZeppCompanion side service started')
    messageBuilder.listen(() => {})
    messageBuilder.on('request', (ctx) => {
      handleRequest(ctx)
    })
  },
  onRun() {},
  onDestroy() {
    console.log('[Side] ZeppCompanion side service destroyed')
  },
})
