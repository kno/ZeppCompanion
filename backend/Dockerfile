FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci
RUN npx prisma generate
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app

# Install ffmpeg and Python for Piper TTS (optional but recommended)
RUN apk add --no-cache ffmpeg python3 py3-pip \
    && pip3 install --break-system-packages piper-tts

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/public ./public

# Copy Piper voice model if present
COPY --from=builder /app/piper ./piper

EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "start"]
