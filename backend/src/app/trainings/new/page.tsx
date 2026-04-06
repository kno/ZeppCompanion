'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function NewTrainingPage() {
  const router = useRouter()
  const { apiFetch } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    type: 'cardio_continuous',
    durationMinutes: '',
    distanceMeters: '',
    paceGoalSecPerKm: '',
    messageFrequency: 'MEDIUM',
    companionStyle: 'MOTIVATIONAL',
  })

  function updateForm(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const body: Record<string, unknown> = {
        name: form.name,
        type: form.type,
        messageFrequency: form.messageFrequency,
        companionStyle: form.companionStyle,
      }

      if (form.durationMinutes) body.durationMinutes = parseInt(form.durationMinutes)
      if (form.distanceMeters) body.distanceMeters = parseInt(form.distanceMeters)
      if (form.paceGoalSecPerKm) body.paceGoalSecPerKm = parseInt(form.paceGoalSecPerKm)

      const res = await apiFetch('/api/trainings', {
        method: 'POST',
        body: JSON.stringify(body),
      })

      if (res.error) {
        setError(res.error)
        return
      }

      router.push('/dashboard')
    } catch {
      setError('Error al crear entrenamiento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-8">Nuevo Entrenamiento</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
          <input
            type="text"
            value={form.name}
            onChange={e => updateForm('name', e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
            placeholder="Ej: Carrera suave 30min"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Tipo</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'cardio_continuous', label: 'Cardio' },
              { value: 'intervals', label: 'Intervalos' },
              { value: 'free', label: 'Libre' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateForm('type', opt.value)}
                className={`py-3 rounded-lg text-sm font-medium transition ${
                  form.type === opt.value
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Duracion (minutos)</label>
          <input
            type="number"
            value={form.durationMinutes}
            onChange={e => updateForm('durationMinutes', e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
            placeholder="30"
            min={1}
          />
        </div>

        {/* Distance */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Distancia objetivo (metros)</label>
          <input
            type="number"
            value={form.distanceMeters}
            onChange={e => updateForm('distanceMeters', e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
            placeholder="5000"
            min={100}
          />
        </div>

        {/* Pace goal */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Ritmo objetivo (seg/km)</label>
          <input
            type="number"
            value={form.paceGoalSecPerKm}
            onChange={e => updateForm('paceGoalSecPerKm', e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
            placeholder="360 (= 6:00/km)"
            min={60}
          />
        </div>

        {/* Companion Style */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Estilo del compañero</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'MOTIVATIONAL', label: 'Motivador' },
              { value: 'STRICT', label: 'Estricto' },
              { value: 'NEUTRAL', label: 'Neutro' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateForm('companionStyle', opt.value)}
                className={`py-3 rounded-lg text-sm font-medium transition ${
                  form.companionStyle === opt.value
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message Frequency */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Frecuencia de mensajes</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'HIGH', label: 'Alta (60s)' },
              { value: 'MEDIUM', label: 'Media (90s)' },
              { value: 'LOW', label: 'Baja (120s)' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateForm('messageFrequency', opt.value)}
                className={`py-3 rounded-lg text-sm font-medium transition ${
                  form.messageFrequency === opt.value
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-green-600 text-white rounded-lg font-semibold text-lg hover:bg-green-700 transition disabled:opacity-50"
        >
          {loading ? 'Creando...' : 'Crear Entrenamiento'}
        </button>
      </form>
    </div>
  )
}
