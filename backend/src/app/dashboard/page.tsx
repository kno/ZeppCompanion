'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

interface Training {
  id: string
  name: string
  type: string
  durationMinutes: number | null
  messageFrequency: string
  companionStyle: string
}

interface Stats {
  totalSessions: number
  completedSessions: number
  totalDistanceM: number
  totalDurationSec: number
  avgPaceSecPerKm: number | null
  avgHeartRate: number | null
}

function formatPace(sec: number | null): string {
  if (!sec) return '--:--'
  const min = Math.floor(sec / 60)
  const s = sec % 60
  return `${min}:${String(s).padStart(2, '0')} /km`
}

function formatDistance(m: number): string {
  return (m / 1000).toFixed(1) + ' km'
}

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m} min`
}

const typeLabels: Record<string, string> = {
  cardio_continuous: 'Cardio',
  intervals: 'Intervalos',
  free: 'Libre',
}

export default function DashboardPage() {
  const { apiFetch } = useAuth()
  const [trainings, setTrainings] = useState<Training[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [tRes, sRes] = await Promise.all([
          apiFetch('/api/trainings'),
          apiFetch('/api/stats'),
        ])
        setTrainings(tRes.data || [])
        setStats(sRes.data || null)
      } catch (e) {
        console.error('Dashboard load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [apiFetch])

  if (loading) {
    return <div className="text-gray-400 text-center py-20">Cargando...</div>
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Sesiones" value={String(stats.completedSessions)} />
          <StatCard label="Distancia total" value={formatDistance(stats.totalDistanceM)} />
          <StatCard label="Tiempo total" value={formatDuration(stats.totalDurationSec)} />
          <StatCard label="Ritmo medio" value={formatPace(stats.avgPaceSecPerKm)} />
        </div>
      )}

      {/* Trainings Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Mis Entrenamientos</h2>
        <Link
          href="/trainings/new"
          className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition text-sm"
        >
          + Crear nuevo
        </Link>
      </div>

      {/* Training Cards */}
      {trainings.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No tienes entrenamientos aun</p>
          <p className="text-sm mt-2">Crea tu primer entrenamiento para comenzar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trainings.map(t => (
            <Link
              key={t.id}
              href={`/trainings/${t.id}`}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-semibold">{t.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {typeLabels[t.type] || t.type}
                    {t.durationMinutes ? ` • ${t.durationMinutes} min` : ''}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded">
                  {t.companionStyle}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-gray-500 text-xs uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  )
}
