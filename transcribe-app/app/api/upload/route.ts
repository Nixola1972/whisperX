import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { supabaseAdmin, STORAGE_BUCKETS } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { nanoid } from 'nanoid'

export async function POST(req: NextRequest) {
  try {
    console.log('[DEBUG] Upload API called')

    // 1. Auth check
    const user = await requireAuth()
    const userId = user.id
    console.log('[DEBUG] User authenticated:', userId)

    // 2. Get file from form data
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('[DEBUG] File received:', file.name, 'Size:', file.size, 'Type:', file.type)

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

    console.log('[DEBUG] Uploading to Supabase Storage:', filePath)

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

    console.log('[DEBUG] File uploaded successfully to Supabase')

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

    console.log('[DEBUG] Transcript record created:', transcript.id)

    // 6. Trigger Modal transcription (if configured)
    console.log('[DEBUG] About to check Modal URL...')
    const modalUrl = process.env.MODAL_WEBHOOK_URL
    console.log('[DEBUG] modalUrl value:', modalUrl)
    console.log('[DEBUG] modalUrl type:', typeof modalUrl)
    console.log('[DEBUG] modalUrl truthy?', !!modalUrl)

    if (modalUrl) {
      console.log('[DEBUG] ✓ INSIDE if block - modalUrl is truthy')
      try {
        console.log('========================================')
        console.log('Triggering Modal transcription for:', transcript.id)
        console.log('Modal URL:', modalUrl)
        console.log('Payload:', JSON.stringify({
          transcript_id: transcript.id,
          file_path: filePath,
          user_id: userId,
          language: null,
          enable_diarization: true
        }, null, 2))
        console.log('========================================')

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

        console.log('[DEBUG] Modal response status:', modalResponse.status)

        if (!modalResponse.ok) {
          const errorText = await modalResponse.text()
          console.error('Modal webhook failed with status', modalResponse.status, ':', errorText)
        } else {
          const responseData = await modalResponse.json()
          console.log('✓ Modal transcription queued successfully:', responseData)
        }
      } catch (modalError) {
        console.error('Failed to trigger Modal (exception):', modalError)
        // Don't fail the upload if Modal call fails
      }
    } else {
      console.log('[DEBUG] ✗ NOT inside if block - modalUrl is falsy')
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
