import Link from 'next/link'
import { getUser } from '@/lib/auth'

export default async function Home() {
  const user = await getUser()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4">
            WhisperX Transcription
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            AI-Powered Audio Transcription with Speaker Diarization
          </p>
          <div className="flex gap-4 justify-center">
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
                <Link
                  href="/login"
                  className="rounded-lg border border-gray-300 dark:border-gray-700 px-6 py-3 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Login
                </Link>
              </>
            )}
            <Link
              href="/pricing"
              className="rounded-lg border border-gray-300 dark:border-gray-700 px-6 py-3 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-semibold mb-3">Fast Transcription</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Powered by WhisperX for lightning-fast, accurate transcription in 98+ languages
            </p>
          </div>

          <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-semibold mb-3">Speaker Diarization</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Automatically identify and separate different speakers in your audio
            </p>
          </div>

          <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-semibold mb-3">AI Summaries</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Get intelligent summaries, insights, and Q&A powered by Gemini AI
            </p>
          </div>

          <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-semibold mb-3">Multiple Formats</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Export to TXT, MD, PDF, DOCX, SRT, VTT, or JSON formats
            </p>
          </div>

          <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-semibold mb-3">MCP Integration</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Connect with Claude Desktop via Model Context Protocol
            </p>
          </div>

          <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-semibold mb-3">Affordable Pricing</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Plans starting from €6/month with generous usage limits
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-3">
                1
              </div>
              <h4 className="font-semibold mb-2">Upload Audio</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upload your audio or video file
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-3">
                2
              </div>
              <h4 className="font-semibold mb-2">AI Processing</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                WhisperX transcribes with diarization
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-3">
                3
              </div>
              <h4 className="font-semibold mb-2">Review & Edit</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Review transcript with timestamps
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-3">
                4
              </div>
              <h4 className="font-semibold mb-2">Export</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Download in your preferred format
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center text-sm text-gray-500">
          <p>Setup Status: Database ✓ | Authentication ✓ | File Upload ✓ | Transcription → Next</p>
        </div>
      </div>
    </main>
  )
}
