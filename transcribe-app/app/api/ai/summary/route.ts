import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { generateSummary } from '@/lib/gemini'
import { checkUsageLimits, trackUsage } from '@/lib/usage-monitor'

export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session }
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // 2. Get transcript ID
    const { transcriptId } = await req.json()

    if (!transcriptId) {
      return NextResponse.json({ error: 'transcriptId required' }, { status: 400 })
    }

    // 3. Check usage limits
    const usageCheck = await checkUsageLimits(userId, 'summary')

    if (!usageCheck.allowed) {
      return NextResponse.json(
        { error: usageCheck.message, reason: usageCheck.reason },
        { status: 429 }
      )
    }

    // 4. Get transcript
    const transcript = await db.transcript.findFirst({
      where: { id: transcriptId, userId }
    })

    if (!transcript || transcript.status !== 'completed') {
      return NextResponse.json({ error: 'Transcript not found or not ready' }, { status: 404 })
    }

    // 5. Check if summary already exists
    const existingSummary = await db.aiSummary.findFirst({
      where: {
        transcriptId,
        type: 'summary'
      }
    })

    if (existingSummary) {
      return NextResponse.json({
        summary: existingSummary.content,
        cached: true
      })
    }

    // 6. Generate summary
    const summaryContent = await generateSummary(transcript.transcriptText || '')

    // 7. Save to DB
    const summary = await db.aiSummary.create({
      data: {
        transcriptId,
        type: 'summary',
        content: summaryContent
      }
    })

    // 8. Track usage
    await trackUsage(userId, 'summary', 1)

    return NextResponse.json({
      summary: summary.content,
      cached: false
    })
  } catch (error) {
    console.error('Summary generation error:', error)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
  }
}
