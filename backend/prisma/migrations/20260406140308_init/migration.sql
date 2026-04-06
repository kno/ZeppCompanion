-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Training" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'cardio_continuous',
    "durationMinutes" INTEGER,
    "distanceMeters" INTEGER,
    "paceGoalSecPerKm" INTEGER,
    "hrZones" TEXT,
    "intervalConfig" TEXT,
    "messageFrequency" TEXT NOT NULL DEFAULT 'MEDIUM',
    "companionStyle" TEXT NOT NULL DEFAULT 'MOTIVATIONAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Training_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrainingSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "totalDurationSec" INTEGER,
    "totalDistanceM" REAL,
    "avgHeartRate" INTEGER,
    "maxHeartRate" INTEGER,
    "avgPaceSecPerKm" INTEGER,
    "caloriesBurned" INTEGER,
    CONSTRAINT "TrainingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingSession_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionDataPoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "heartRate" INTEGER,
    "paceSecPerKm" INTEGER,
    "distanceM" REAL,
    "elapsedSec" INTEGER NOT NULL,
    "progressPct" REAL,
    CONSTRAINT "SessionDataPoint_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TrainingSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanionMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "mascotState" TEXT NOT NULL,
    "triggerData" TEXT,
    CONSTRAINT "CompanionMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TrainingSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "SessionDataPoint_sessionId_timestamp_idx" ON "SessionDataPoint"("sessionId", "timestamp");

-- CreateIndex
CREATE INDEX "CompanionMessage_sessionId_timestamp_idx" ON "CompanionMessage"("sessionId", "timestamp");
