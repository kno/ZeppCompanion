interface CompanionContext {
  trainingName: string
  trainingType: string
  durationMinutes: number | null
  distanceMeters: number | null
  paceGoalSecPerKm: number | null
  hrZones: { min: number; max: number }[] | null
  companionStyle: string
  metrics: {
    heart_rate: number
    pace_sec_per_km?: number
    elapsed_sec: number
    distance_m: number
    progress_pct: number
  }
  previousMessage: string
}

function formatPace(secPerKm: number): string {
  if (!secPerKm || secPerKm <= 0) return 'N/A'
  const min = Math.floor(secPerKm / 60)
  const sec = Math.round(secPerKm % 60)
  return `${min}:${String(sec).padStart(2, '0')}/km`
}

function formatTime(sec: number): string {
  const min = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function buildCompanionSystemPrompt(style: string): string {
  const personalities: Record<string, string> = {
    MOTIVATIONAL: `You are an upbeat, encouraging training companion. Use positive reinforcement, celebrate milestones, and keep the runner motivated. Be energetic but not annoying.`,
    STRICT: `You are a direct, no-nonsense training coach. Focus on hitting targets, call out when falling behind, and push for performance. Be firm but respectful.`,
    NEUTRAL: `You are a calm, factual training companion. State progress without emotional coloring. Provide clear, informative updates about performance metrics.`,
  }

  return `You are a real-time training companion for a runner wearing a smartwatch. Generate short coaching messages during their workout.

Personality: ${personalities[style] || personalities.MOTIVATIONAL}

RULES:
1. Maximum 2 short sentences. Keep it very brief.
2. Reference specific numbers from the metrics when relevant (HR, pace, distance).
3. If heart rate exceeds the max zone, prioritize a safety message.
4. Vary your messages - never repeat the same phrasing as the previous message.
5. Write in Spanish.
6. Respond ONLY with valid JSON: {"message": "...", "tone": "...", "mascot_state": "..."}
   - tone: one of "encouraging", "warning", "celebratory", "calm"
   - mascot_state: one of "happy", "cheering", "concerned", "neutral"
7. Do NOT include any text outside the JSON object.`
}

export function buildCompanionUserPrompt(ctx: CompanionContext): string {
  const hrZonesStr = ctx.hrZones && ctx.hrZones.length > 0
    ? ctx.hrZones.map(z => `${z.min}-${z.max} bpm`).join(', ')
    : 'No definidas'

  return `Entrenamiento: ${ctx.trainingName} (${ctx.trainingType})
Objetivos: duracion=${ctx.durationMinutes || 'libre'}min, distancia=${ctx.distanceMeters ? (ctx.distanceMeters / 1000).toFixed(1) + 'km' : 'libre'}, ritmo_objetivo=${ctx.paceGoalSecPerKm ? formatPace(ctx.paceGoalSecPerKm) : 'libre'}
Zonas FC: ${hrZonesStr}

Metricas actuales:
- Frecuencia cardiaca: ${ctx.metrics.heart_rate} bpm
- Ritmo actual: ${ctx.metrics.pace_sec_per_km ? formatPace(ctx.metrics.pace_sec_per_km) : 'N/A'}
- Tiempo transcurrido: ${formatTime(ctx.metrics.elapsed_sec)}
- Distancia: ${(ctx.metrics.distance_m / 1000).toFixed(2)} km
- Progreso: ${Math.round(ctx.metrics.progress_pct * 100)}%

Mensaje anterior (no repetir): "${ctx.previousMessage}"

Genera el siguiente mensaje del companero.`
}
