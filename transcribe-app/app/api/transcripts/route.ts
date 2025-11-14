import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/transcripts - List user's transcripts
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()

    const transcripts = await db.transcript.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        status: true,
        language: true,
        durationSeconds: true,
        fileSize: true,
        createdAt: true,
        processedAt: true,
      },
    })

    return NextResponse.json({ transcripts })
  } catch (error: any) {
    console.error('List transcripts error:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch transcripts' },
      { status: 500 }
    )
  }
}
