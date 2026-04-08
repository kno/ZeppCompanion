export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMResponse {
  content: string
}

type LLMProvider = 'openai' | 'anthropic' | 'openrouter' | 'custom'

function getConfig() {
  return {
    provider: (process.env.LLM_PROVIDER || 'openai') as LLMProvider,
    apiKey: process.env.LLM_API_KEY || '',
    model: process.env.LLM_MODEL || 'gpt-4o-mini',
    baseUrl: process.env.LLM_BASE_URL || '',
  }
}

function getBaseUrl(provider: LLMProvider, customUrl: string): string {
  if (customUrl) return customUrl
  switch (provider) {
    case 'openai':
      return 'https://api.openai.com/v1'
    case 'anthropic':
      return 'https://api.anthropic.com/v1'
    case 'openrouter':
      return 'https://openrouter.ai/api/v1'
    default:
      return 'https://api.openai.com/v1'
  }
}

async function callOpenAICompatible(
  messages: LLMMessage[],
  config: ReturnType<typeof getConfig>
): Promise<LLMResponse> {
  const baseUrl = getBaseUrl(config.provider, config.baseUrl)

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      ...(config.provider === 'openrouter' && {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'ZeppCompanion',
      }),
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.7,
      max_tokens: 150,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`LLM API error: ${response.status} - ${text}`)
  }

  const data = await response.json()
  return { content: data.choices[0].message.content }
}

async function callAnthropic(
  messages: LLMMessage[],
  config: ReturnType<typeof getConfig>
): Promise<LLMResponse> {
  const baseUrl = getBaseUrl(config.provider, config.baseUrl)

  // Extract system message
  const systemMsg = messages.find(m => m.role === 'system')
  const userMessages = messages.filter(m => m.role !== 'system')

  const response = await fetch(`${baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 150,
      temperature: 0.7,
      system: systemMsg?.content || '',
      messages: userMessages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Anthropic API error: ${response.status} - ${text}`)
  }

  const data = await response.json()
  return { content: data.content[0].text }
}

export async function generateCompletion(messages: LLMMessage[]): Promise<LLMResponse> {
  const config = getConfig()

  if (!config.apiKey) {
    throw new Error('LLM_API_KEY not configured')
  }

  switch (config.provider) {
    case 'anthropic':
      return callAnthropic(messages, config)
    case 'openai':
    case 'openrouter':
    case 'custom':
    default:
      return callOpenAICompatible(messages, config)
  }
}
