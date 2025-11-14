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

    // 6. Trigger Modal transcription (if configured)
    const modalUrl = process.env.MODAL_WEBHOOK_URL
    if (modalUrl) {
      try {
        console.log('Triggering Modal transcription for:', transcript.id)
        const modalResponse = await fetch(modalUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transcript_id: transcript.id,
            file_path: filePath,
            user_id: userId,
            language: null, // Auto-detect
            enable_diarization: true
          })
        })

        if (!modalResponse.ok) {
          console.error('Modal webhook failed:', await modalResponse.text())
        } else {
          console.log('Modal transcription queued successfully')
        }
      } catch (modalError) {
        console.error('Failed to trigger Modal:', modalError)
        // Don't fail the upload if Modal call fails
      }
    } else {
      console.log('Modal webhook not configured - transcript will remain pending')
    }

    // 7. Return success
    return NextResponse.json({
      transcriptId: transcript.id,
      status: modalUrl ? 'queued' : 'pending',
      fileName: file.name,
      message: modalUrl
        ? 'File uploaded successfully. Transcription started!'
        : 'File uploaded successfully. Configure Modal to enable transcription.'
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
