import { MessageBuilder } from '../shared/message-side'

const messageBuilder = new MessageBuilder()

AppSideService({
  onInit() {
    messageBuilder.listen(() => {})

    messageBuilder.on('request', async (ctx) => {
      const payload = messageBuilder.buf2Json(ctx.request.payload)
      const { method, url, params } = payload

      try {
        if (method === 'GET' && url) {
          const res = await fetch({ url, method: 'GET' })
          const body = typeof res.body === 'string' ? JSON.parse(res.body) : res.body
          ctx.response({ data: { result: body } })
        } else {
          ctx.response({ data: { error: 'Unknown request' } })
        }
      } catch (error) {
        ctx.response({ data: { error: error.message || 'Request failed' } })
      }
    })

    console.log('Side service initialized')
  },

  onRun() {},

  onDestroy() {
    console.log('Side service destroyed')
  },
})
