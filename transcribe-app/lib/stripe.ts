import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true
})

export const STRIPE_PRICES = {
  STARTER_MONTHLY: process.env.STRIPE_PRICE_STARTER_MONTHLY!,
  STARTER_ANNUAL: process.env.STRIPE_PRICE_STARTER_ANNUAL!,
  PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY!,
  PRO_ANNUAL: process.env.STRIPE_PRICE_ANNUAL!,
  BUSINESS_MONTHLY: process.env.STRIPE_PRICE_BUSINESS_MONTHLY!,
  BUSINESS_ANNUAL: process.env.STRIPE_PRICE_BUSINESS_ANNUAL!
} as const

export type PlanType = 'starter' | 'pro' | 'business'
export type BillingCycle = 'monthly' | 'annual'

export const PLAN_LIMITS = {
  starter: {
    transcription_hours_monthly: 100,
    transcription_hours_daily: 5,
    ai_summaries_monthly: 0,
    ai_qa_monthly: 0,
    ai_insights_monthly: 0,
    retention_days: 90
  },
  pro: {
    transcription_hours_monthly: 250,
    transcription_hours_daily: 15,
    ai_summaries_monthly: 100,
    ai_qa_monthly: 200,
    ai_insights_monthly: 50,
    retention_days: 365
  },
  business: {
    transcription_hours_monthly: 500,
    transcription_hours_daily: 30,
    ai_summaries_monthly: 250,
    ai_qa_monthly: 500,
    ai_insights_monthly: 100,
    retention_days: -1 // unlimited
  }
} as const

// Create checkout session
export async function createCheckoutSession(
  userId: string,
  email: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId
    },
    subscription_data: {
      metadata: {
        userId
      }
    }
  })

  return session
}

// Create customer portal session
export async function createPortalSession(customerId: string, returnUrl: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl
  })

  return session
}

// Get plan from price ID
export function getPlanFromPriceId(priceId: string): { plan: PlanType; cycle: BillingCycle } {
  const priceMap: Record<string, { plan: PlanType; cycle: BillingCycle }> = {
    [STRIPE_PRICES.STARTER_MONTHLY]: { plan: 'starter', cycle: 'monthly' },
    [STRIPE_PRICES.STARTER_ANNUAL]: { plan: 'starter', cycle: 'annual' },
    [STRIPE_PRICES.PRO_MONTHLY]: { plan: 'pro', cycle: 'monthly' },
    [STRIPE_PRICES.PRO_ANNUAL]: { plan: 'pro', cycle: 'annual' },
    [STRIPE_PRICES.BUSINESS_MONTHLY]: { plan: 'business', cycle: 'monthly' },
    [STRIPE_PRICES.BUSINESS_ANNUAL]: { plan: 'business', cycle: 'annual' }
  }

  return priceMap[priceId] || { plan: 'starter', cycle: 'monthly' }
}
