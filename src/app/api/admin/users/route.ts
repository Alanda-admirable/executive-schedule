import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

async function checkAdminAuth() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('admin_session')
  if (!sessionCookie) return null

  try {
    const session = JSON.parse(sessionCookie.value)
    if (session.role !== 'ADMIN') return null

    // Update activity
    await prisma.user.update({
      where: { id: session.userId },
      data: { lastActive: new Date() }
    }).catch(err => console.error('Activity update failed in users API:', err))

    return session
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const session = await checkAdminAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized or Forbidden' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        lastActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await checkAdminAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized or Forbidden' }, { status: 401 })
    }

    const body = await request.json()
    const { username, password, name, role } = body

    if (!username || !password || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })
    if (existingUser) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 })
    }

    const newUser = await prisma.user.create({
      data: {
        username,
        password, // In a real app we would hash this, but we preserve current simple password storage style
        name,
        role,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      }
    })

    return NextResponse.json(newUser)
  } catch (error) {
    console.error('Failed to create user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await checkAdminAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized or Forbidden' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })
    }

    // Prevent deleting self
    if (id === session.userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    console.error('Failed to delete user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
