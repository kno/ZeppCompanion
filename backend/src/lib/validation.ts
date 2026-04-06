import { z } from 'zod'

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Minimo 6 caracteres'),
  name: z.string().min(1).max(100).optional(),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// Training schemas
export const trainingCreateSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  type: z.enum(['cardio_continuous', 'intervals', 'free']).default('cardio_continuous'),
  durationMinutes: z.number().int().positive().optional().nullable(),
  distanceMeters: z.number().int().positive().optional().nullable(),
  paceGoalSecPerKm: z.number().int().positive().optional().nullable(),
  hrZones: z.array(z.object({
    min: z.number().int().positive(),
    max: z.number().int().positive(),
  })).optional().nullable(),
  intervalConfig: z.object({
    workSeconds: z.number().int().positive(),
    restSeconds: z.number().int().positive(),
    sets: z.number().int().positive(),
  }).optional().nullable(),
  messageFrequency: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  companionStyle: z.enum(['MOTIVATIONAL', 'STRICT', 'NEUTRAL']).default('MOTIVATIONAL'),
})

export const trainingUpdateSchema = trainingCreateSchema.partial()

// Session schemas
export const sessionCreateSchema = z.object({
  trainingId: z.string().min(1),
})

export const sessionCompleteSchema = z.object({
  totalDurationSec: z.number().int().nonnegative().optional(),
  totalDistanceM: z.number().nonnegative().optional(),
  avgHeartRate: z.number().int().nonnegative().optional(),
  maxHeartRate: z.number().int().nonnegative().optional(),
  avgPaceSecPerKm: z.number().int().nonnegative().optional(),
  caloriesBurned: z.number().int().nonnegative().optional(),
})

// Companion schemas
export const companionRequestSchema = z.object({
  sessionId: z.string().min(1),
  metrics: z.object({
    heart_rate: z.number().int().nonnegative(),
    pace_sec_per_km: z.number().int().nonnegative().optional(),
    elapsed_sec: z.number().int().nonnegative(),
    distance_m: z.number().nonnegative(),
    progress_pct: z.number().min(0).max(1),
  }),
})

// Types inferred from schemas
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type TrainingCreateInput = z.infer<typeof trainingCreateSchema>
export type TrainingUpdateInput = z.infer<typeof trainingUpdateSchema>
export type SessionCreateInput = z.infer<typeof sessionCreateSchema>
export type SessionCompleteInput = z.infer<typeof sessionCompleteSchema>
export type CompanionRequestInput = z.infer<typeof companionRequestSchema>
