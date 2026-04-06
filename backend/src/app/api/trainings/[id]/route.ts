import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth'
import { trainingUpdateSchema } from '@/lib/validation'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateRequest(req)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  const training = await prisma.training.findFirst({
    where: { id, userId: auth.userId },
  })

  if (!training) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  return NextResponse.json({
    data: {
      ...training,
      hrZones: training.hrZones ? JSON.parse(training.hrZones) : null,
      intervalConfig: training.intervalConfig ? JSON.parse(training.intervalConfig) : null,
    },
  })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateRequest(req)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  // Verify ownership
  const existing = await prisma.training.findFirst({
    where: { id, userId: auth.userId },
  })
  if (!existing) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  try {
    const body = await req.json()
    const parsed = trainingUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { hrZones, intervalConfig, ...rest } = parsed.data

    const updateData: Record<string, unknown> = { ...rest }
    if (hrZones !== undefined) updateData.hrZones = hrZones ? JSON.stringify(hrZones) : null
    if (intervalConfig !== undefined) updateData.intervalConfig = intervalConfig ? JSON.stringify(intervalConfig) : null

    const training = await prisma.training.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      data: {
        ...training,
        hrZones: training.hrZones ? JSON.parse(training.hrZones) : null,
        intervalConfig: training.intervalConfig ? JSON.parse(training.intervalConfig) : null,
      },
    })
  } catch (error) {
    console.error('Update training error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateRequest(req)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  const existing = await prisma.training.findFirst({
    where: { id, userId: auth.userId },
  })
  if (!existing) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  await prisma.training.delete({ where: { id } })
  return NextResponse.json({ data: { deleted: true } })
}
