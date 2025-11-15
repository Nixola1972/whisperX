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

    // Convert BigInt to Number for JSON serialization
    const serializedTranscripts = transcripts.map(t => ({
      ...t,
      fileSize: t.fileSize ? Number(t.fileSize) : null,
    }))

    return NextResponse.json({ transcripts: serializedTranscripts })
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
