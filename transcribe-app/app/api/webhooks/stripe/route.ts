import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe, getPlanFromPriceId } from '@/lib/stripe'
import { db } from '@/lib/db'
import { resetUsageForPeriod } from '@/lib/usage-monitor'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = headers().get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId

        if (!userId) {
          console.error('No userId in session metadata')
          break
        }

        // Get subscription details
        const subscriptionId = session.subscription as string
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)

        const priceId = subscription.items.data[0].price.id
        const { plan, cycle } = getPlanFromPriceId(priceId)

        // Create or update subscription in DB
        await db.subscription.upsert({
          where: { userId },
          create: {
            userId,
            stripeCustomerId: subscription.customer as string,
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            status: subscription.status,
            plan,
            billingCycle: cycle,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000)
          },
          update: {
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            status: subscription.status,
            plan,
            billingCycle: cycle,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000)
          }
        })

        // Initialize usage tracking
        await db.usage.upsert({
          where: { userId },
          create: {
            userId,
            periodStart: new Date(subscription.current_period_start * 1000),
            periodEnd: new Date(subscription.current_period_end * 1000)
          },
          update: {
            periodStart: new Date(subscription.current_period_start * 1000),
            periodEnd: new Date(subscription.current_period_end * 1000)
          }
        })

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (!userId) {
          // Find by stripeSubscriptionId
          const existingSub = await db.subscription.findUnique({
            where: { stripeSubscriptionId: subscription.id }
          })

          if (!existingSub) break
        }

        const priceId = subscription.items.data[0].price.id
        const { plan, cycle } = getPlanFromPriceId(priceId)

        await db.subscription.update({
          where: userId ? { userId } : { stripeSubscriptionId: subscription.id },
          data: {
            stripePriceId: priceId,
            status: subscription.status,
            plan,
            billingCycle: cycle,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end
          }
        })

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        await db.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: 'canceled'
          }
        })

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string

        if (!subscriptionId) break

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const dbSub = await db.subscription.findUnique({
          where: { stripeSubscriptionId: subscriptionId }
        })

        if (!dbSub) break

        // Reset usage for new billing period
        await resetUsageForPeriod(dbSub.userId)

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string

        if (!subscriptionId) break

        await db.subscription.update({
          where: { stripeSubscriptionId: subscriptionId },
          data: { status: 'past_due' }
        })

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Log webhook event
    await db.webhookEvent.create({
      data: {
        type: event.type,
        payload: event as any,
        processed: true
      }
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
