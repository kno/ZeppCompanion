import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateRequest(req)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  const session = await prisma.trainingSession.findFirst({
    where: { id, userId: auth.userId },
    include: {
      training: true,
      dataPoints: { orderBy: { timestamp: 'asc' } },
      messages: { orderBy: { timestamp: 'asc' } },
    },
  })

  if (!session) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  return NextResponse.json({
    data: {
      ...session,
      training: {
        ...session.training,
        hrZones: session.training.hrZones ? JSON.parse(session.training.hrZones) : null,
        intervalConfig: session.training.intervalConfig ? JSON.parse(session.training.intervalConfig) : null,
      },
    },
  })
}
