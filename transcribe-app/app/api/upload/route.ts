import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { supabaseAdmin, STORAGE_BUCKETS } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { nanoid } from 'nanoid'

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const user = await requireAuth()
    const userId = user.id

    // 2. Get file from form data
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // 3. Validate file
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 100MB' },
        { status: 400 }
      )
    }

    const allowedTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/m4a',
      'audio/ogg',
      'video/mp4',
      'video/mpeg',
      'video/quicktime'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported: MP3, WAV, M4A, OGG, MP4, MOV' },
        { status: 400 }
      )
    }

    // 4. Upload to Supabase Storage (skip subscription check for now)
    const fileExt = file.name.split('.').pop()
    const fileName = `${nanoid()}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Storage not configured. Please set SUPABASE_SERVICE_ROLE_KEY in .env.local' },
        { status: 500 }
      )
    }

    // Convert File to Buffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKETS.AUDIO_TEMP)
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // 5. Create transcript record in DB
    const transcript = await db.transcript.create({
      data: {
        userId,
        fileName: file.name,
        filePath,
        fileSize: file.size,
        mimeType: file.type,
        status: 'pending'
      }
    })

    // TODO: Enqueue transcription job to Modal/Redis when configured
    // For now, just create the record

    // 6. Return success
    return NextResponse.json({
      transcriptId: transcript.id,
      status: 'pending',
      fileName: file.name,
      message: 'File uploaded successfully. Transcription system will be configured next.'
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const config = {
  api: {
    bodyParser: false
  }
}
