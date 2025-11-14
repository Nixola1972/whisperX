import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

export const QUEUE_KEYS = {
  TRANSCRIPTION: 'queue:transcription',
  AI_PROCESSING: 'queue:ai'
} as const

// Add job to transcription queue
export async function enqueueTranscription(job: {
  transcriptId: string
  filePath: string
  userId: string
  fileName: string
}) {
  await redis.lpush(QUEUE_KEYS.TRANSCRIPTION, JSON.stringify(job))
}

// Pop job from queue (blocking)
export async function dequeueTranscription() {
  const result = await redis.brpop(QUEUE_KEYS.TRANSCRIPTION, 0)
  if (!result) return null

  const [, jobData] = result
  return JSON.parse(jobData as string)
}

// Usage tracking
export async function trackUsage(
  userId: string,
  type: 'transcription' | 'summary' | 'qa' | 'insight',
  amount: number = 1
) {
  const key = `usage:${userId}:${new Date().toISOString().slice(0, 7)}` // YYYY-MM
  await redis.hincrby(key, type, amount)
  await redis.expire(key, 60 * 60 * 24 * 60) // 60 days
}

// Rate limiting
export async function checkRateLimit(
  userId: string,
  action: string,
  limit: number,
  windowSeconds: number = 3600
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `ratelimit:${userId}:${action}`
  const current = await redis.incr(key)

  if (current === 1) {
    await redis.expire(key, windowSeconds)
  }

  return {
    allowed: current <= limit,
    remaining: Math.max(0, limit - current)
  }
}
