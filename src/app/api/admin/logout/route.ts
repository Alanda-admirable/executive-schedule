import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('admin_session')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'An error occurred during logout' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('admin_session')
    const { origin } = new URL(request.url)
    return NextResponse.redirect(new URL('/', origin))
  } catch (error) {
    console.error('Logout redirect error:', error)
    return NextResponse.json({ error: 'An error occurred during logout' }, { status: 500 })
  }
}
