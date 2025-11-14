import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/transcripts/[id] - Get single transcript
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()

    const transcript = await db.transcript.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        aiSummaries: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript not found' },
        { status: 404 }
      )
    }

    // Convert BigInt to Number for JSON serialization
    const serializedTranscript = {
      ...transcript,
      fileSize: transcript.fileSize ? Number(transcript.fileSize) : null,
    }

    return NextResponse.json({ transcript: serializedTranscript })
  } catch (error: any) {
    console.error('Get transcript error:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch transcript' },
      { status: 500 }
    )
  }
}

// DELETE /api/transcripts/[id] - Delete transcript
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()

    const transcript = await db.transcript.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript not found' },
        { status: 404 }
      )
    }

    // Delete from database (will cascade to summaries)
    await db.transcript.delete({
      where: { id: params.id },
    })

    // TODO: Also delete from Supabase Storage

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete transcript error:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to delete transcript' },
      { status: 500 }
    )
  }
}
