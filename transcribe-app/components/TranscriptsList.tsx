'use client'

import { useState, useEffect } from 'react'

interface Transcript {
  id: string
  fileName: string
  status: string
  createdAt: string
  durationSeconds: number | null
  language: string | null
}

export default function TranscriptsList({ refreshTrigger }: { refreshTrigger?: number }) {
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTranscripts()
  }, [refreshTrigger])

  const fetchTranscripts = async () => {
    try {
      // For now, show mock data since we don't have auth yet
      setTranscripts([])
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch transcripts:', error)
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
      case 'processing':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
      case 'failed':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading transcripts...</p>
      </div>
    )
  }

  if (transcripts.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-xl font-semibold mb-2">No transcripts yet</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Upload your first audio file to get started
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {transcripts.map((transcript) => (
        <div
          key={transcript.id}
          className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">{transcript.fileName}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className={`px-2 py-1 rounded-full ${getStatusColor(transcript.status)}`}>
                  {transcript.status}
                </span>
                {transcript.language && (
                  <span>Language: {transcript.language}</span>
                )}
                {transcript.durationSeconds && (
                  <span>Duration: {formatDuration(transcript.durationSeconds)}</span>
                )}
                <span>
                  {new Date(transcript.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {transcript.status === 'completed' && (
                <>
                  <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    View
                  </button>
                  <button className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    Export
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
