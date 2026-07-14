import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date')
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const isPublic = searchParams.get('public') === 'true'
    
    // Check authentication to allow admin to view drafts, but public only views active
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin_session')
    const isAdmin = !!sessionCookie

    let statusFilter: any = undefined
    if (isPublic || !isAdmin) {
      statusFilter = 'ACTIVE'
    }

    let where: any = {}
    if (dateStr) {
      const date = new Date(dateStr)
      const startOfDay = new Date(date.setHours(0, 0, 0, 0))
      const endOfDay = new Date(new Date(date).setHours(23, 59, 59, 999))
      
      where = {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      }
    } else if (month && year) {
      const startOfMonth = new Date(parseInt(year), parseInt(month), 1)
      const endOfMonth = new Date(parseInt(year), parseInt(month) + 1, 0, 23, 59, 59, 999)
      
      where = {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      }
    }

    if (statusFilter) {
      where.status = statusFilter
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        executive: true,
      },
      orderBy: [
        { executive: { order: 'asc' } },
        { startTime: 'asc' },
      ],
    })
    return NextResponse.json(schedules)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin_session')
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let session
    try {
      session = JSON.parse(sessionCookie.value)
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    // Update activity
    await prisma.user.update({
      where: { id: session.userId },
      data: { lastActive: new Date() }
    }).catch(err => console.error('Activity update failed:', err))

    const body = await request.json()
    const schedule = await prisma.schedule.create({
      data: {
        executiveId: body.executiveId,
        date: new Date(body.date),
        startTime: body.startTime,
        endTime: body.endTime,
        mission: body.mission,
        location: body.location,
        agency: body.agency,
        dressCode: body.dressCode,
        status: body.status || 'DRAFT', // Default to DRAFT so it doesn't show publicly immediately
      },
    })
    return NextResponse.json(schedule)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 })
  }
}
