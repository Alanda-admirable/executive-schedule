import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin_session')
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    let session
    try {
      session = JSON.parse(sessionCookie.value)
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    return NextResponse.json({
      id: session.userId,
      username: session.username,
      name: session.name,
      role: session.role
    })
  } catch (error) {
    console.error('Me API error:', error)
    return NextResponse.json({ error: 'Failed to retrieve current user info' }, { status: 500 })
  }
}
