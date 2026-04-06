import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth'
import { sessionCompleteSchema } from '@/lib/validation'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateRequest(req)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  const session = await prisma.trainingSession.findFirst({
    where: { id, userId: auth.userId, status: 'ACTIVE' },
  })
  if (!session) {
    return NextResponse.json({ error: 'Sesion no encontrada o ya completada' }, { status: 404 })
  }

  try {
    const body = await req.json()
    const parsed = sessionCompleteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const updated = await prisma.trainingSession.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        ...parsed.data,
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Complete session error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
