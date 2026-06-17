import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin_session')
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let sessionData
    try {
      sessionData = JSON.parse(sessionCookie.value)
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    if (sessionData && sessionData.userId) {
      await prisma.user.update({
        where: { id: sessionData.userId },
        data: { lastActive: new Date() }
      }).catch(err => console.error('Failed to update activity:', err))
    }

    // Active users in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const activeUsers = await prisma.user.findMany({
      where: {
        lastActive: {
          gte: fiveMinutesAgo
        }
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        lastActive: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(activeUsers)
  } catch (error) {
    console.error('Active sessions error:', error)
    return NextResponse.json({ error: 'Failed to fetch active users' }, { status: 500 })
  }
}
