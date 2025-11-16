'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Dashboard3Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-200 mb-8 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Torna alla Home
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-8 mb-8"
        >
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-200 to-teal-200 mb-4">
            🎴 Option 3: Card-based Modern
          </h1>
          <p className="text-gray-300 text-lg">
            UI moderna con animazioni e multiple views
          </p>
        </motion.div>

        {/* Demo Content */}
        <div className="space-y-6">
          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold text-gray-100 mb-4">
              ✨ Features Uniche
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-start gap-3 p-4 bg-gray-800/30 rounded-lg"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">⊞</span>
                </div>
                <div>
                  <p className="font-medium text-gray-200">Grid View</p>
                  <p className="text-sm text-gray-400">Cards responsive con hover effects</p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-start gap-3 p-4 bg-gray-800/30 rounded-lg"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">☰</span>
                </div>
                <div>
                  <p className="font-medium text-gray-200">List View</p>
                  <p className="text-sm text-gray-400">Vista compatta sortable</p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-start gap-3 p-4 bg-gray-800/30 rounded-lg"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">⚏</span>
                </div>
                <div>
                  <p className="font-medium text-gray-200">Kanban View</p>
                  <p className="text-sm text-gray-400">Drag & drop per stati</p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-start gap-3 p-4 bg-gray-800/30 rounded-lg"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">✨</span>
                </div>
                <div>
                  <p className="font-medium text-gray-200">Animations</p>
                  <p className="text-sm text-gray-400">Framer Motion smooth</p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Tech Stack */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold text-gray-100 mb-4">
              🛠️ Tech Stack Extra
            </h2>
            <div className="flex flex-wrap gap-2">
              {['Framer Motion', 'React Beautiful DnD', 'Keyboard Shortcuts', 'Modal Views'].map((tech) => (
                <motion.span
                  key={tech}
                  whileHover={{ scale: 1.05 }}
                  className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-300"
                >
                  {tech}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Animation Demo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/20 rounded-xl p-6"
          >
            <h3 className="font-semibold text-emerald-200 mb-4">
              🎭 Esempio Animazioni
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -8, rotate: 2 }}
                  whileTap={{ scale: 0.95 }}
                  className="h-24 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl border border-emerald-500/30 flex items-center justify-center cursor-pointer"
                >
                  <span className="text-2xl">🎴</span>
                </motion.div>
              ))}
            </div>
            <p className="text-sm text-emerald-300 mt-4">
              Passa il mouse sopra le cards per vedere le animazioni! 🪄
            </p>
          </motion.div>

          {/* Implementation Note */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6"
          >
            <h3 className="font-semibold text-blue-200 mb-2">
              📝 Nota Implementazione
            </h3>
            <p className="text-sm text-blue-300">
              Questa è una demo preview. Per implementare completamente questa dashboard,
              copia i file da <code className="px-2 py-1 bg-blue-500/20 rounded">frontend-proposals/option-3-cards/</code> e
              installa le dipendenze extra: <code className="px-2 py-1 bg-blue-500/20 rounded">npm install framer-motion react-beautiful-dnd</code>
            </p>
          </motion.div>

          {/* Code Example */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
          >
            <h3 className="font-semibold text-gray-100 mb-3">
              💻 Componenti Principali
            </h3>
            <div className="space-y-2 text-sm font-mono">
              <div className="text-gray-400">
                <span className="text-emerald-400">import</span> {'{ TranscriptionGrid }'} <span className="text-emerald-400">from</span> <span className="text-blue-400">'@/components/TranscriptionGrid'</span>
              </div>
              <div className="text-gray-400">
                <span className="text-emerald-400">import</span> {'{ TranscriptionKanban }'} <span className="text-emerald-400">from</span> <span className="text-blue-400">'@/components/TranscriptionKanban'</span>
              </div>
              <div className="text-gray-400">
                <span className="text-emerald-400">import</span> {'{ motion }'} <span className="text-emerald-400">from</span> <span className="text-blue-400">'framer-motion'</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
