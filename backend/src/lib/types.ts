// API response types
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}

// Training types matching Prisma models
export interface TrainingResponse {
  id: string
  name: string
  type: string
  durationMinutes: number | null
  distanceMeters: number | null
  paceGoalSecPerKm: number | null
  hrZones: { min: number; max: number }[] | null
  intervalConfig: { workSeconds: number; restSeconds: number; sets: number } | null
  messageFrequency: string
  companionStyle: string
  createdAt: string
  updatedAt: string
}

// Companion message response (sent to watch)
export interface CompanionResponse {
  message: string
  tone: 'encouraging' | 'warning' | 'celebratory' | 'calm'
  mascot_state: 'idle' | 'talking' | 'celebrating' | 'worried'
}

// Session with related data
export interface SessionDetailResponse {
  id: string
  trainingId: string
  training: TrainingResponse
  status: string
  startedAt: string
  completedAt: string | null
  totalDurationSec: number | null
  totalDistanceM: number | null
  avgHeartRate: number | null
  maxHeartRate: number | null
  avgPaceSecPerKm: number | null
  caloriesBurned: number | null
  dataPoints: DataPointResponse[]
  messages: CompanionMessageResponse[]
}

export interface DataPointResponse {
  timestamp: string
  heartRate: number | null
  paceSecPerKm: number | null
  distanceM: number | null
  elapsedSec: number
  progressPct: number | null
}

export interface CompanionMessageResponse {
  timestamp: string
  message: string
  tone: string
  mascotState: string
}

// Stats response
export interface StatsResponse {
  totalSessions: number
  completedSessions: number
  totalDistanceM: number
  totalDurationSec: number
  avgPaceSecPerKm: number | null
  avgHeartRate: number | null
}
