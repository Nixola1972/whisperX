import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import { getUser } from '@/lib/auth'
import { db } from '@/lib/db'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WhisperX Transcription - AI-Powered Audio Transcription',
  description: 'Professional audio transcription with speaker diarization, AI summaries, and multi-format export',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authUser = await getUser()

  let user = null
  if (authUser) {
    const dbUser = await db.user.findUnique({
      where: { id: authUser.id },
      select: { email: true, fullName: true },
    })
    user = dbUser
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar user={user} />
        {children}
      </body>
    </html>
  )
}
