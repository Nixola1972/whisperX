import { createServerSupabaseClient } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  return NextResponse.json({ success: true })
}
