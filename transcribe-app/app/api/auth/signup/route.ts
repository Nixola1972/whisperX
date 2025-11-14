import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { id, email, fullName } = await req.json()

    // Create user in database
    const user = await db.user.create({
      data: {
        id,
        email,
        fullName,
      },
    })

    return NextResponse.json({ success: true, user })
  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    )
  }
}
