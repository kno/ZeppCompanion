import { config } from 'dotenv'
import { resolve } from 'path'
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import bcrypt from 'bcryptjs'

// Load .env before reading DATABASE_URL
config()

function createPrisma(): PrismaClient {
  const rawUrl = process.env['DATABASE_URL'] ?? 'file:./dev.db'
  // Resolve relative file: paths to absolute so libsql can locate the database
  // regardless of the working directory when invoked via `npx prisma db seed`
  const url = rawUrl.startsWith('file:.')
    ? 'file:' + resolve(rawUrl.slice('file:'.length))
    : rawUrl
  // PrismaLibSql takes a libsql config object (same as createClient args)
  const adapter = new PrismaLibSql({ url })
  return new PrismaClient({ adapter })
}

async function main() {
  const prisma = createPrisma()

  try {
    console.log('Seeding database...')

    // Create test user
    const passwordHash = await bcrypt.hash('password123', 12)
    const user = await prisma.user.upsert({
      where: { email: 'test@ZeppCompanion.com' },
      update: {},
      create: {
        email: 'test@ZeppCompanion.com',
        passwordHash,
        name: 'Test User',
      },
    })

    console.log('Created user:', user.email)

    // Create sample trainings
    const trainings = [
      {
        userId: user.id,
        name: 'Carrera suave 30min',
        type: 'cardio_continuous',
        durationMinutes: 30,
        paceGoalSecPerKm: 360,
        messageFrequency: 'MEDIUM',
        companionStyle: 'MOTIVATIONAL',
      },
      {
        userId: user.id,
        name: 'Intervalos 4x400m',
        type: 'intervals',
        durationMinutes: 25,
        paceGoalSecPerKm: 270,
        intervalConfig: JSON.stringify({ workSeconds: 90, restSeconds: 60, sets: 4 }),
        messageFrequency: 'HIGH',
        companionStyle: 'STRICT',
      },
      {
        userId: user.id,
        name: 'Trote libre',
        type: 'free',
        durationMinutes: 45,
        messageFrequency: 'LOW',
        companionStyle: 'NEUTRAL',
      },
      {
        userId: user.id,
        name: 'Carrera 5K',
        type: 'cardio_continuous',
        durationMinutes: 30,
        distanceMeters: 5000,
        paceGoalSecPerKm: 330,
        hrZones: JSON.stringify([{ min: 140, max: 160 }]),
        messageFrequency: 'MEDIUM',
        companionStyle: 'MOTIVATIONAL',
      },
    ]

    for (const t of trainings) {
      await prisma.training.create({ data: t })
    }

    console.log(`Created ${trainings.length} trainings`)
    console.log('Seed complete!')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
