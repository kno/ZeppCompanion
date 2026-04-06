'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'

interface User {
  id: string
  email: string
  name: string | null
}

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = sessionStorage.getItem('accessToken')
    const storedUser = sessionStorage.getItem('user')

    if (!storedToken || !storedUser) {
      router.push('/login')
      return
    }

    setToken(storedToken)
    setUser(JSON.parse(storedUser))
    setLoading(false)
  }, [router])

  const logout = useCallback(() => {
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('user')
    router.push('/login')
  }, [router])

  const apiFetch = useCallback(async (path: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    }
    const res = await fetch(path, { ...options, headers })
    if (res.status === 401) {
      logout()
      throw new Error('Unauthorized')
    }
    return res.json()
  }, [token, logout])

  return { user, token, loading, logout, apiFetch }
}
