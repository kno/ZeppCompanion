import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth'
import { sessionCreateSchema } from '@/lib/validation'

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const sessions = await prisma.trainingSession.findMany({
    where: { userId: auth.userId },
    include: { training: { select: { name: true, type: true } } },
    orderBy: { startedAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ data: sessions })
}

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = sessionCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    // Verify training belongs to user
    const training = await prisma.training.findFirst({
      where: { id: parsed.data.trainingId, userId: auth.userId },
    })
    if (!training) {
      return NextResponse.json({ error: 'Entrenamiento no encontrado' }, { status: 404 })
    }

    const session = await prisma.trainingSession.create({
      data: {
        userId: auth.userId,
        trainingId: parsed.data.trainingId,
      },
    })

    return NextResponse.json({ data: session }, { status: 201 })
  } catch (error) {
    console.error('Create session error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
