import { NextRequest, NextResponse } from 'next/server'
import { generateCompletion, LLMMessage } from '@/lib/llm'

export async function GET(req: NextRequest) {
  try {
    // Create abort controller with 10 second timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful assistant. Respond only with valid JSON.',
      },
      {
        role: 'user',
        content:
          'Respond with a JSON object containing: status (string), message (string), and model_responded (boolean). Keep the message short.',
      },
    ]

    const response = await generateCompletion(messages)
    clearTimeout(timeoutId)

    // Parse the LLM response as JSON
    let parsedResponse
    try {
      parsedResponse = JSON.parse(response.content)
    } catch {
      parsedResponse = {
        status: 'parsed_as_string',
        message: response.content,
        model_responded: true,
      }
    }

    return NextResponse.json({
      ok: true,
      llm_response: parsedResponse,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
