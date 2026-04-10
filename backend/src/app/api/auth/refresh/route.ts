import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    // Accept refresh token from body (wearable) or cookie (web)
    let refreshToken = req.cookies.get('refreshToken')?.value
    try {
      const body = await req.json()
      if (body.refreshToken) refreshToken = body.refreshToken
    } catch {
      // No body, use cookie
    }
    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 })
    }

    const payload = verifyRefreshToken(refreshToken)

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 })
    }

    const newPayload = { userId: user.id, email: user.email }
    const newAccessToken = signAccessToken(newPayload)
    const newRefreshToken = signRefreshToken(newPayload)

    const response = NextResponse.json({
      data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
    })

    response.cookies.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Refresh error:', error)
    return NextResponse.json({ error: 'Token invalido' }, { status: 401 })
  }
}
