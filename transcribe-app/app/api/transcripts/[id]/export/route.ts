import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { exportTranscript, ExportFormat } from '@/lib/export'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Auth check
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session }
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const transcriptId = params.id

    // 2. Get format from query params
    const searchParams = req.nextUrl.searchParams
    const format = searchParams.get('format') as ExportFormat

    if (!format) {
      return NextResponse.json({ error: 'Format parameter required' }, { status: 400 })
    }

    const validFormats: ExportFormat[] = ['txt', 'md', 'pdf', 'docx', 'srt', 'vtt', 'json']
    if (!validFormats.includes(format)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
    }

    // 3. Get transcript
    const transcript = await db.transcript.findFirst({
      where: {
        id: transcriptId,
        userId
      },
      include: {
        aiSummaries: {
          where: { type: 'summary' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript not found' }, { status: 404 })
    }

    if (transcript.status !== 'completed') {
      return NextResponse.json(
        { error: 'Transcript not ready yet' },
        { status: 400 }
      )
    }

    // 4. Export
    const { blob, filename, mimeType } = await exportTranscript(format, {
      fileName: transcript.fileName,
      text: transcript.transcriptText || '',
      segments: transcript.segments as any,
      language: transcript.language || undefined,
      duration: transcript.durationSeconds || undefined,
      createdAt: transcript.createdAt.toISOString(),
      summary: transcript.aiSummaries[0]?.content
    })

    // 5. Return file
    return new NextResponse(blob, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
