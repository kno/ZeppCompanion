import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth'
import { trainingCreateSchema } from '@/lib/validation'

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const trainings = await prisma.training.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: 'desc' },
  })

  // Parse JSON fields
  const data = trainings.map(t => ({
    ...t,
    hrZones: t.hrZones ? JSON.parse(t.hrZones) : null,
    intervalConfig: t.intervalConfig ? JSON.parse(t.intervalConfig) : null,
  }))

  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = trainingCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { hrZones, intervalConfig, ...rest } = parsed.data

    const training = await prisma.training.create({
      data: {
        ...rest,
        userId: auth.userId,
        hrZones: hrZones ? JSON.stringify(hrZones) : null,
        intervalConfig: intervalConfig ? JSON.stringify(intervalConfig) : null,
      },
    })

    return NextResponse.json({
      data: {
        ...training,
        hrZones: hrZones || null,
        intervalConfig: intervalConfig || null,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Create training error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
