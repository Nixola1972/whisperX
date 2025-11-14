// Client for calling Modal.com transcription function

export interface TranscriptionResult {
  text: string
  language: string
  segments: Array<{
    start: number
    end: number
    text: string
    speaker?: string
    words?: Array<{
      word: string
      start: number
      end: number
    }>
  }>
  duration: number
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  options?: {
    language?: string
    computeType?: 'float16' | 'int8'
    batchSize?: number
  }
): Promise<TranscriptionResult> {
  const response = await fetch(process.env.MODAL_API_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Authorization': `Bearer ${process.env.MODAL_AUTH_TOKEN}`,
      'X-Language': options?.language || 'auto',
      'X-Compute-Type': options?.computeType || 'float16',
      'X-Batch-Size': String(options?.batchSize || 16)
    },
    body: audioBuffer
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Modal transcription failed: ${error}`)
  }

  return await response.json()
}

// Get transcription status (for async processing)
export async function getTranscriptionStatus(jobId: string) {
  const response = await fetch(`${process.env.MODAL_API_URL}/status/${jobId}`, {
    headers: {
      'Authorization': `Bearer ${process.env.MODAL_AUTH_TOKEN}`
    }
  })

  if (!response.ok) {
    throw new Error('Failed to get transcription status')
  }

  return await response.json()
}
