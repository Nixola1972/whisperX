export default function Pricing() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 text-center">Pricing Plans</h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-12">
          Choose the perfect plan for your transcription needs
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Starter Plan */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-2">Starter</h2>
            <div className="mb-6">
              <span className="text-4xl font-bold">€6-9</span>
              <span className="text-gray-600 dark:text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>100 hours transcription/month</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Speaker diarization</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>7 export formats</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Word-level timestamps</span>
              </li>
            </ul>
            <button className="w-full rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition-colors">
              Get Started
            </button>
          </div>

          {/* Pro Plan */}
          <div className="border-2 border-blue-600 rounded-lg p-8 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
              Popular
            </div>
            <h2 className="text-2xl font-bold mb-2">Pro</h2>
            <div className="mb-6">
              <span className="text-4xl font-bold">€18-22</span>
              <span className="text-gray-600 dark:text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>250 hours transcription/month</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>100 AI summaries/month</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>MCP server access</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Priority processing</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>API access</span>
              </li>
            </ul>
            <button className="w-full rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition-colors">
              Get Started
            </button>
          </div>

          {/* Business Plan */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-2">Business</h2>
            <div className="mb-6">
              <span className="text-4xl font-bold">€39-49</span>
              <span className="text-gray-600 dark:text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>500 hours transcription/month</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>250 AI summaries/month</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Team collaboration</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Custom integrations</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Priority support</span>
              </li>
            </ul>
            <button className="w-full rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition-colors">
              Get Started
            </button>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>All plans include 98+ languages, speaker diarization, and word-level timestamps</p>
          <p className="mt-2">Save up to 25% with annual billing</p>
        </div>
      </div>
    </div>
  )
}
