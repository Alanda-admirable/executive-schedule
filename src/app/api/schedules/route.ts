import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date')
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    
    let where = {}
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
        status: body.status || 'ACTIVE',
      },
    })
    return NextResponse.json(schedule)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 })
  }
}
