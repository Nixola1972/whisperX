'use client';

import Link from 'next/link';

export default function Dashboard2Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-8 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Torna alla Home
        </Link>

        {/* Header */}
        <div className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 rounded-2xl p-8 mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-200 to-fuchsia-200 mb-4">
            📊 Option 2: Visual Analytics
          </h1>
          <p className="text-slate-300 text-lg">
            Dashboard con grafici e analytics avanzate
          </p>
        </div>

        {/* Demo Content */}
        <div className="space-y-6">
          {/* Features */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-slate-100 mb-4">
              ✨ Features Uniche
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-200">Usage Chart</p>
                  <p className="text-sm text-slate-400">Grafico trend utilizzo temporale</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-200">Cost Tracker</p>
                  <p className="text-sm text-slate-400">Budget e proiezioni spese</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-200">Language Distribution</p>
                  <p className="text-sm text-slate-400">Pie chart lingue usate</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-200">Timeline View</p>
                  <p className="text-sm text-slate-400">Vista temporale trascrizioni</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-slate-100 mb-4">
              🛠️ Tech Stack Extra
            </h2>
            <div className="flex flex-wrap gap-2">
              {['Recharts', 'date-fns', 'Advanced Analytics'].map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-lg text-sm text-violet-300"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Implementation Note */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
            <h3 className="font-semibold text-blue-200 mb-2">
              📝 Nota Implementazione
            </h3>
            <p className="text-sm text-blue-300">
              Questa è una demo preview. Per implementare completamente questa dashboard,
              copia i file da <code className="px-2 py-1 bg-blue-500/20 rounded">frontend-proposals/option-2-analytics/</code> e
              installa le dipendenze extra: <code className="px-2 py-1 bg-blue-500/20 rounded">npm install recharts date-fns</code>
            </p>
          </div>

          {/* Code Example */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="font-semibold text-slate-100 mb-3">
              💻 Componenti Principali
            </h3>
            <div className="space-y-2 text-sm font-mono">
              <div className="text-slate-400">
                <span className="text-violet-400">import</span> {'{ UsageChart }'} <span className="text-violet-400">from</span> <span className="text-emerald-400">'@/components/UsageChart'</span>
              </div>
              <div className="text-slate-400">
                <span className="text-violet-400">import</span> {'{ CostTracker }'} <span className="text-violet-400">from</span> <span className="text-emerald-400">'@/components/CostTracker'</span>
              </div>
              <div className="text-slate-400">
                <span className="text-violet-400">import</span> {'{ LanguageDistribution }'} <span className="text-violet-400">from</span> <span className="text-emerald-400">'@/components/LanguageDistribution'</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
