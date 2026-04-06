'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

interface Session {
  id: string
  status: string
  startedAt: string
  completedAt: string | null
  totalDurationSec: number | null
  totalDistanceM: number | null
  avgHeartRate: number | null
  avgPaceSecPerKm: number | null
  training: { name: string; type: string }
}

export default function HistoryPage() {
  const { apiFetch } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch('/api/sessions')
        setSessions(res.data || [])
      } catch (e) {
        console.error('History load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [apiFetch])

  if (loading) return <div className="text-gray-400 text-center py-20">Cargando...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Historial de Entrenamientos</h1>

      {sessions.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p>No hay sesiones registradas aun</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(s => (
            <Link
              key={s.id}
              href={`/history/${s.id}`}
              className="block bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">{s.training.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {new Date(s.startedAt).toLocaleDateString('es-ES', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded ${
                    s.status === 'COMPLETED'
                      ? 'bg-green-900/50 text-green-400'
                      : s.status === 'ACTIVE'
                      ? 'bg-yellow-900/50 text-yellow-400'
                      : 'bg-gray-800 text-gray-500'
                  }`}>
                    {s.status === 'COMPLETED' ? 'Completado' : s.status === 'ACTIVE' ? 'Activo' : 'Abandonado'}
                  </span>
                  <div className="text-gray-400 text-sm mt-2 flex gap-4 justify-end">
                    {s.totalDurationSec && (
                      <span>{Math.floor(s.totalDurationSec / 60)} min</span>
                    )}
                    {s.totalDistanceM && (
                      <span>{(s.totalDistanceM / 1000).toFixed(1)} km</span>
                    )}
                    {s.avgHeartRate && (
                      <span>{s.avgHeartRate} bpm</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
