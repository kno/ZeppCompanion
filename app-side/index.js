import { BaseSideService } from '@zeppos/zml/base-side'

var BASE_URL = 'http://localhost:3000'
var authToken = ''

AppSideService(
  BaseSideService({
    onInit() {
      console.log('[Side] ZeepCompanion side service started')
    },

    onRequest(req, res) {
      var type = req.type
      console.log('[Side] Request:', type)

      switch (type) {
        case 'fetch_trainings':
          return this.handleFetchTrainings(req, res)
        case 'start_training':
          return this.handleStartTraining(req, res)
        case 'training_update':
        case 'request_companion':
          return this.handleCompanion(req, res)
        case 'save_results':
          return this.handleSaveResults(req, res)
        case 'auth_login':
          return this.handleLogin(req, res)
        default:
          return this.handleGeneric(req, res)
      }
    },

    async handleFetchTrainings(req, res) {
      try {
        var result = await this.apiRequest('GET', '/trainings')
        res(null, result)
      } catch (e) {
        res({ error: e.message || 'fetch_trainings failed' })
      }
    },

    async handleStartTraining(req, res) {
      try {
        var result = await this.apiRequest('POST', '/sessions', {
          trainingId: req.trainingId,
        })
        res(null, result)
      } catch (e) {
        res({ error: e.message || 'start_training failed' })
      }
    },

    async handleCompanion(req, res) {
      try {
        var result = await this.apiRequest('POST', '/companion/message', {
          sessionId: req.sessionId,
          metrics: req.metrics,
        })
        res(null, result)
      } catch (e) {
        res({ error: e.message || 'companion failed' })
      }
    },

    async handleSaveResults(req, res) {
      try {
        var result = await this.apiRequest('POST', '/sessions/' + req.sessionId + '/complete', {
          totalDurationSec: req.totalDurationSec,
          totalDistanceM: req.totalDistanceM,
          avgHeartRate: req.avgHeartRate,
          maxHeartRate: req.maxHeartRate,
          avgPaceSecPerKm: req.avgPaceSecPerKm,
          caloriesBurned: req.caloriesBurned,
        })
        res(null, result)
      } catch (e) {
        res({ error: e.message || 'save_results failed' })
      }
    },

    async handleLogin(req, res) {
      try {
        var result = await this.apiRequest('POST', '/auth/login', {
          email: req.email,
          password: req.password,
        })
        if (result && result.data && result.data.accessToken) {
          authToken = result.data.accessToken
          console.log('[Side] Auth token stored')
        }
        res(null, result)
      } catch (e) {
        res({ error: e.message || 'login failed' })
      }
    },

    async handleGeneric(req, res) {
      var url = req.url || ''
      if (!url) return res({ error: 'No URL' })
      try {
        var result = await this.fetch({ url: url, method: req.method || 'GET' })
        var data = typeof result.body === 'string' ? JSON.parse(result.body) : result.body
        res(null, data)
      } catch (e) {
        res({ error: e.message || 'generic request failed' })
      }
    },

    async apiRequest(method, path, body) {
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

      var result = await this.fetch(options)
      return typeof result.body === 'string' ? JSON.parse(result.body) : result.body
    },

    onRun() {},

    onDestroy() {
      console.log('[Side] ZeepCompanion side service destroyed')
    },
  })
)
