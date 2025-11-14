'use client'

import { useState } from 'react'
import FileUpload from '@/components/FileUpload'
import TranscriptsList from '@/components/TranscriptsList'
import Link from 'next/link'

export default function Dashboard() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Upload audio files and manage your transcriptions
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ← Home
          </Link>
        </div>

        {/* Setup Status Banner */}
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-3">⚙️ System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>Database configured</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>Authentication active</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>File upload working</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>WhisperX transcription (Modal.com)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-600 dark:text-yellow-400">⏳</span>
              <span>AI features (Gemini - optional)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-600 dark:text-yellow-400">⏳</span>
              <span>Stripe payments (optional)</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded text-sm border border-green-200 dark:border-green-800">
            <p className="font-semibold mb-1 text-green-700 dark:text-green-400">🎉 Ready to Transcribe!</p>
            <p className="text-gray-600 dark:text-gray-400">
              Upload an audio file and it will be automatically transcribed with WhisperX on GPU.
              Speaker diarization is enabled by default.
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Upload New File</h2>
          <FileUpload onUploadSuccess={handleUploadSuccess} />
        </div>

        {/* Transcripts List */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Your Transcriptions</h2>
          <TranscriptsList refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  )
}
