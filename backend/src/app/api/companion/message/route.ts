import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth'
import { companionRequestSchema } from '@/lib/validation'
import { generateCompletion } from '@/lib/llm'
import { buildCompanionSystemPrompt, buildCompanionUserPrompt } from '@/lib/prompts'

// Fallback messages when LLM fails
const FALLBACK_MESSAGES = [
  { message: 'Sigue asi, buen trabajo!', tone: 'encouraging', mascot_state: 'happy' },
  { message: 'Mantén el ritmo, vas bien!', tone: 'encouraging', mascot_state: 'happy' },
  { message: 'Cada paso cuenta, no pares!', tone: 'encouraging', mascot_state: 'cheering' },
  { message: 'Tu esfuerzo vale la pena!', tone: 'calm', mascot_state: 'neutral' },
]

function getFallback() {
  return FALLBACK_MESSAGES[Math.floor(Math.random() * FALLBACK_MESSAGES.length)]
}

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = companionRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { sessionId, metrics } = parsed.data

    // Get session with training info
    const session = await prisma.trainingSession.findFirst({
      where: { id: sessionId, userId: auth.userId },
      include: { training: true },
    })

    if (!session) {
      // If no session found, return fallback (watch may have stale session ID)
      return NextResponse.json({ data: getFallback() })
    }

    // Store data point
    await prisma.sessionDataPoint.create({
      data: {
        sessionId,
        heartRate: metrics.heart_rate,
        paceSecPerKm: metrics.pace_sec_per_km || null,
        distanceM: metrics.distance_m,
        elapsedSec: metrics.elapsed_sec,
        progressPct: metrics.progress_pct,
      },
    })

    // Get previous message to avoid repetition
    const lastMessage = await prisma.companionMessage.findFirst({
      where: { sessionId },
      orderBy: { timestamp: 'desc' },
    })

    // Build LLM prompt
    const training = session.training
    const context = {
      trainingName: training.name,
      trainingType: training.type,
      durationMinutes: training.durationMinutes,
      distanceMeters: training.distanceMeters,
      paceGoalSecPerKm: training.paceGoalSecPerKm,
      hrZones: training.hrZones ? JSON.parse(training.hrZones) : null,
      companionStyle: training.companionStyle,
      metrics,
      previousMessage: lastMessage?.message || '',
    }

    let result: { message: string; tone: string; mascot_state: string }

    try {
      // Call LLM with 5 second timeout
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)

      const systemPrompt = buildCompanionSystemPrompt(training.companionStyle)
      const userPrompt = buildCompanionUserPrompt(context)

      const response = await generateCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ])

      clearTimeout(timeout)

      // Parse JSON response from LLM
      result = JSON.parse(response.content)

      // Validate required fields
      if (!result.message || !result.tone || !result.mascot_state) {
        result = getFallback()
      }
    } catch (llmError) {
      console.error('LLM error, using fallback:', llmError)
      result = getFallback()
    }

    // Store companion message
    await prisma.companionMessage.create({
      data: {
        sessionId,
        message: result.message,
        tone: result.tone,
        mascotState: result.mascot_state,
        triggerData: JSON.stringify(metrics),
      },
    })

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Companion message error:', error)
    return NextResponse.json({ data: getFallback() })
  }
}
