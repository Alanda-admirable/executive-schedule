import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Please enter both username and password' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Incorrect username or password' }, { status: 401 })
    }

    // Update last active time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() }
    })

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('admin_session', JSON.stringify({
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      } 
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'An error occurred during login' }, { status: 500 })
  }
}
