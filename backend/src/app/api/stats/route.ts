import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const [totalSessions, completedSessions] = await Promise.all([
    prisma.trainingSession.count({ where: { userId: auth.userId } }),
    prisma.trainingSession.count({ where: { userId: auth.userId, status: 'COMPLETED' } }),
  ])

  const completed = await prisma.trainingSession.findMany({
    where: { userId: auth.userId, status: 'COMPLETED' },
    select: {
      totalDurationSec: true,
      totalDistanceM: true,
      avgPaceSecPerKm: true,
      avgHeartRate: true,
    },
  })

  let totalDistanceM = 0
  let totalDurationSec = 0
  let paceSum = 0
  let paceCount = 0
  let hrSum = 0
  let hrCount = 0

  for (const s of completed) {
    totalDistanceM += s.totalDistanceM || 0
    totalDurationSec += s.totalDurationSec || 0
    if (s.avgPaceSecPerKm) { paceSum += s.avgPaceSecPerKm; paceCount++ }
    if (s.avgHeartRate) { hrSum += s.avgHeartRate; hrCount++ }
  }

  return NextResponse.json({
    data: {
      totalSessions,
      completedSessions,
      totalDistanceM: Math.round(totalDistanceM),
      totalDurationSec,
      avgPaceSecPerKm: paceCount > 0 ? Math.round(paceSum / paceCount) : null,
      avgHeartRate: hrCount > 0 ? Math.round(hrSum / hrCount) : null,
    },
  })
}
