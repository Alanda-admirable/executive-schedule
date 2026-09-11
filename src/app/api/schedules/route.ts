import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
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

    let statusFilter: string | undefined = undefined
    if (isPublic || !isAdmin) {
      statusFilter = 'ACTIVE'
    }

    let where: Prisma.ScheduleWhereInput = {}
    if (dateStr) {
      const parts = dateStr.split('T')[0].split('-').map(Number)
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        const [y, m, d] = parts
        // Thailand is UTC+7. Day runs from 17:00:00 UTC previous day to 16:59:59.999 UTC target day.
        const startOfDay = new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - 7 * 3600 * 1000)
        const endOfDay = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999) - 7 * 3600 * 1000)
        where = {
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        }
      } else {
        const date = new Date(dateStr)
        where = {
          date: {
            gte: new Date(date.setHours(0, 0, 0, 0)),
            lte: new Date(new Date(date).setHours(23, 59, 59, 999)),
          },
        }
      }
    } else if (month && year) {
      const y = parseInt(year)
      const m = parseInt(month)
      // Month start in Thailand (day 1 00:00:00 local = -7h UTC)
      const startOfMonth = new Date(Date.UTC(y, m, 1, 0, 0, 0) - 7 * 3600 * 1000)
      // Month end in Thailand (last day of month 23:59:59.999 local = -7h UTC)
      const endOfMonth = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999) - 7 * 3600 * 1000)
      
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
    let scheduleDate = new Date(body.date)
    if (typeof body.date === 'string' && body.date.includes('-')) {
      const parts = body.date.split('T')[0].split('-').map(Number)
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        scheduleDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0) - 7 * 3600 * 1000)
      }
    }

    const schedule = await prisma.schedule.create({
      data: {
        executiveId: body.executiveId,
        date: scheduleDate,
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
