import { db } from './db'
import { PLAN_LIMITS, PlanType } from './stripe'

export type UsageType = 'transcribe' | 'summary' | 'qa' | 'insight'

export interface UsageCheckResult {
  allowed: boolean
  reason?: string
  message?: string
  currentUsage?: number
  limit?: number
}

// Check if user can perform action
export async function checkUsageLimits(
  userId: string,
  operation: UsageType,
  amount: number = 1
): Promise<UsageCheckResult> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      subscription: true,
      usage: true
    }
  })

  if (!user?.subscription) {
    return {
      allowed: false,
      reason: 'no_subscription',
      message: 'Nessun abbonamento attivo'
    }
  }

  const plan = user.subscription.plan as PlanType
  const limits = PLAN_LIMITS[plan]
  const usage = user.usage

  if (!usage) {
    // Create usage record if doesn't exist
    await db.usage.create({
      data: {
        userId,
        periodStart: user.subscription.currentPeriodStart,
        periodEnd: user.subscription.currentPeriodEnd
      }
    })
    return { allowed: true }
  }

  // Check based on operation type
  switch (operation) {
    case 'transcribe':
      // Check monthly limit
      if (usage.transcriptionHoursMonth >= limits.transcription_hours_monthly) {
        return {
          allowed: false,
          reason: 'monthly_limit_reached',
          message: `Hai raggiunto il limite di ${limits.transcription_hours_monthly} ore/mese`,
          currentUsage: Number(usage.transcriptionHoursMonth),
          limit: limits.transcription_hours_monthly
        }
      }

      // Check daily limit
      if (usage.transcriptionHoursToday >= limits.transcription_hours_daily) {
        return {
          allowed: false,
          reason: 'daily_limit_reached',
          message: `Hai raggiunto il limite di ${limits.transcription_hours_daily} ore/giorno`,
          currentUsage: Number(usage.transcriptionHoursToday),
          limit: limits.transcription_hours_daily
        }
      }
      break

    case 'summary':
      if (usage.aiSummariesMonth >= limits.ai_summaries_monthly) {
        return {
          allowed: false,
          reason: 'ai_limit_reached',
          message: `Limite riassunti raggiunto (${limits.ai_summaries_monthly}/mese). Upgrade per continuare.`,
          currentUsage: usage.aiSummariesMonth,
          limit: limits.ai_summaries_monthly
        }
      }
      break

    case 'qa':
      if (usage.aiQuestionsMonth >= limits.ai_qa_monthly) {
        return {
          allowed: false,
          reason: 'ai_limit_reached',
          message: `Limite domande raggiunto (${limits.ai_qa_monthly}/mese). Upgrade per continuare.`,
          currentUsage: usage.aiQuestionsMonth,
          limit: limits.ai_qa_monthly
        }
      }
      break

    case 'insight':
      if (usage.aiInsightsMonth >= limits.ai_insights_monthly) {
        return {
          allowed: false,
          reason: 'ai_limit_reached',
          message: `Limite insights raggiunto (${limits.ai_insights_monthly}/mese). Upgrade per continuare.`,
          currentUsage: usage.aiInsightsMonth,
          limit: limits.ai_insights_monthly
        }
      }
      break
  }

  // Check cost-based fair use (prevent abuse)
  const costThisMonth = await calculateUserCost(userId)
  const revenue = getPlanRevenue(plan, user.subscription.billingCycle as 'monthly' | 'annual')

  if (costThisMonth > revenue * 1.5) {
    // User costs 50% more than they pay - send warning
    await sendUsageWarning(userId, 'warning', {
      cost: costThisMonth,
      revenue,
      percentage: Math.round((costThisMonth / revenue) * 100)
    })

    if (costThisMonth > revenue * 2) {
      // User costs double - soft block
      return {
        allowed: false,
        reason: 'fair_use_violation',
        message: 'Hai superato i limiti di fair use. Contatta il supporto.'
      }
    }
  }

  return { allowed: true }
}

// Track usage after operation
export async function trackUsage(
  userId: string,
  operation: UsageType,
  amount: number
): Promise<void> {
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  let usage = await db.usage.findUnique({ where: { userId } })

  if (!usage) {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    })

    if (!user?.subscription) return

    usage = await db.usage.create({
      data: {
        userId,
        periodStart: user.subscription.currentPeriodStart,
        periodEnd: user.subscription.currentPeriodEnd
      }
    })
  }

  // Reset daily counter if new day
  const lastTranscriptDate = usage.lastTranscriptDate
  if (lastTranscriptDate && lastTranscriptDate.toISOString().split('T')[0] !== today) {
    await db.usage.update({
      where: { userId },
      data: { transcriptionHoursToday: 0 }
    })
  }

  // Update usage
  const updates: any = { lastTranscriptDate: now }

  switch (operation) {
    case 'transcribe':
      updates.transcriptionHoursMonth = { increment: amount }
      updates.transcriptionHoursToday = { increment: amount }
      break
    case 'summary':
      updates.aiSummariesMonth = { increment: 1 }
      break
    case 'qa':
      updates.aiQuestionsMonth = { increment: 1 }
      break
    case 'insight':
      updates.aiInsightsMonth = { increment: 1 }
      break
  }

  await db.usage.update({
    where: { userId },
    data: updates
  })

  // Update estimated cost
  const newCost = await calculateUserCost(userId)
  await db.usage.update({
    where: { userId },
    data: { estimatedCostMonth: newCost }
  })

  // Check if approaching limits (send warnings at 80%, 95%)
  await checkAndSendWarnings(userId)
}

// Calculate actual cost for user this month
async function calculateUserCost(userId: string): Promise<number> {
  const usage = await db.usage.findUnique({ where: { userId } })
  if (!usage) return 0

  const transcriptionCost = Number(usage.transcriptionHoursMonth) * 0.016 // Modal cost per hour
  const aiCost =
    usage.aiSummariesMonth * 0.002 + // ~€0.002 per summary
    usage.aiQuestionsMonth * 0.001   // ~€0.001 per Q&A

  return transcriptionCost + aiCost
}

// Get plan revenue (monthly normalized)
function getPlanRevenue(plan: PlanType, cycle: 'monthly' | 'annual'): number {
  const prices: Record<PlanType, { monthly: number; annual: number }> = {
    starter: { monthly: 9, annual: 6 },
    pro: { monthly: 22, annual: 18 },
    business: { monthly: 49, annual: 39 }
  }

  return prices[plan][cycle]
}

// Send usage warning
async function sendUsageWarning(
  userId: string,
  level: 'info' | 'warning' | 'critical' | 'block',
  data: any
): Promise<void> {
  const messages = {
    info: `Hai usato ${data.percentage}% del tuo piano.`,
    warning: `⚠️ Attenzione! Stai per raggiungere i limiti del tuo piano.`,
    critical: `🚫 Limite raggiunto. Considera l'upgrade.`,
    block: `⛔ Account temporaneamente limitato per superamento fair use.`
  }

  await db.usageWarning.create({
    data: {
      userId,
      level,
      type: data.type || 'fair_use',
      message: messages[level],
      metadata: data
    }
  })

  // TODO: Send email notification
  console.log(`[USAGE WARNING] ${level} for user ${userId}:`, messages[level])
}

// Check and send warnings at thresholds
async function checkAndSendWarnings(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { subscription: true, usage: true }
  })

  if (!user?.subscription || !user.usage) return

  const plan = user.subscription.plan as PlanType
  const limits = PLAN_LIMITS[plan]
  const usage = user.usage

  const transcriptionPercentage =
    (Number(usage.transcriptionHoursMonth) / limits.transcription_hours_monthly) * 100

  // Send warning at 80% and 95%
  if (transcriptionPercentage >= 95) {
    await sendUsageWarning(userId, 'critical', {
      type: 'transcription_limit',
      percentage: Math.round(transcriptionPercentage),
      used: Number(usage.transcriptionHoursMonth),
      limit: limits.transcription_hours_monthly
    })
  } else if (transcriptionPercentage >= 80) {
    await sendUsageWarning(userId, 'warning', {
      type: 'transcription_limit',
      percentage: Math.round(transcriptionPercentage),
      used: Number(usage.transcriptionHoursMonth),
      limit: limits.transcription_hours_monthly
    })
  }
}

// Reset usage at end of billing period
export async function resetUsageForPeriod(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { subscription: true }
  })

  if (!user?.subscription) return

  await db.usage.update({
    where: { userId },
    data: {
      periodStart: user.subscription.currentPeriodStart,
      periodEnd: user.subscription.currentPeriodEnd,
      transcriptionHoursMonth: 0,
      aiSummariesMonth: 0,
      aiQuestionsMonth: 0,
      aiInsightsMonth: 0,
      estimatedCostMonth: 0
    }
  })
}
