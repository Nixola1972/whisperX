'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface NavbarProps {
  user?: {
    email: string
    fullName?: string
  } | null
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">WhisperX</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/pricing"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                >
                  Pricing
                </Link>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                      {user.fullName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                    </div>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium truncate">{user.fullName || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        disabled={loading}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        {loading ? 'Logging out...' : 'Logout'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/pricing"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                >
                  Pricing
                </Link>
                <Link
                  href="/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
