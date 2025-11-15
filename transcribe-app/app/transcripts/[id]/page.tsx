'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Transcript {
  id: string
  fileName: string
  filePath: string
  status: string
  language: string | null
  durationSeconds: number | null
  fileSize: number
  transcriptText: string | null
  segments: any
  createdAt: string
  processedAt: string | null
}

export default function TranscriptDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [transcript, setTranscript] = useState<Transcript | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchTranscript()
  }, [params.id])

  const fetchTranscript = async () => {
    try {
      const response = await fetch(`/api/transcripts/${params.id}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError('Transcript not found')
        } else {
          throw new Error('Failed to fetch transcript')
        }
        return
      }
      const data = await response.json()
      setTranscript(data.transcript)
    } catch (err: any) {
      setError(err.message || 'Failed to load transcript')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: string) => {
    setExporting(true)
    try {
      const response = await fetch(`/api/transcripts/${params.id}/export?format=${format}`)
      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transcript-${transcript?.fileName}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      alert('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this transcript?')) return

    try {
      const response = await fetch(`/api/transcripts/${params.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Delete failed')
      }
      router.push('/dashboard')
    } catch (err) {
      alert('Failed to delete transcript')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading transcript...</p>
        </div>
      </div>
    )
  }

  if (error || !transcript) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'Transcript not found'}</p>
          <Link href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2">{transcript.fileName}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span className={`px-3 py-1 rounded-full ${
              transcript.status === 'completed' ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
              transcript.status === 'processing' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
              transcript.status === 'failed' ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
              'bg-gray-100 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400'
            }`}>
              {transcript.status}
            </span>
            <span>Size: {formatFileSize(transcript.fileSize)}</span>
            {transcript.durationSeconds && <span>Duration: {formatDuration(transcript.durationSeconds)}</span>}
            {transcript.language && <span>Language: {transcript.language.toUpperCase()}</span>}
            <span>Uploaded: {new Date(transcript.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-8 flex gap-3">
          <button
            onClick={() => handleExport('txt')}
            disabled={exporting || transcript.status !== 'completed'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {exporting ? 'Exporting...' : 'Export TXT'}
          </button>
          <button
            onClick={() => handleExport('srt')}
            disabled={exporting || transcript.status !== 'completed'}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export SRT
          </button>
          <button
            onClick={() => handleExport('json')}
            disabled={exporting || transcript.status !== 'completed'}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export JSON
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 ml-auto"
          >
            Delete
          </button>
        </div>

        {/* Transcript Content */}
        {transcript.status === 'completed' && transcript.transcriptText ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold mb-4">Transcript</h2>
            <div className="prose dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed">{transcript.transcriptText}</pre>
            </div>
          </div>
        ) : transcript.status === 'processing' ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Processing in progress...</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your audio is being transcribed. This may take a few minutes.
            </p>
          </div>
        ) : transcript.status === 'failed' ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-12 text-center">
            <h3 className="text-lg font-semibold mb-2 text-red-600 dark:text-red-400">Transcription Failed</h3>
            <p className="text-gray-600 dark:text-gray-400">
              There was an error processing your audio file. Please try uploading again.
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Waiting to process</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your file is in the queue and will be processed soon.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
