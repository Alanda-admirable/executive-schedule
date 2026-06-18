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

    // Fetch top 15 most frequent locations
    const rawLocations = await prisma.schedule.groupBy({
      by: ['location'],
      _count: { location: true },
      where: { location: { not: '' } },
      orderBy: { _count: { location: 'desc' } },
      take: 15,
    })

    // Fetch top 15 most frequent agencies
    const rawAgencies = await prisma.schedule.groupBy({
      by: ['agency'],
      _count: { agency: true },
      where: { agency: { not: '' } },
      orderBy: { _count: { agency: 'desc' } },
      take: 15,
    })

    // Fetch top 15 most frequent dress codes
    const rawDressCodes = await prisma.schedule.groupBy({
      by: ['dressCode'],
      _count: { dressCode: true },
      where: { dressCode: { not: null } },
      orderBy: { _count: { dressCode: 'desc' } },
      take: 15,
    })

    // Fetch top 20 most recent unique missions
    const rawMissions = await prisma.schedule.findMany({
      select: { mission: true },
      distinct: ['mission'],
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({
      locations: rawLocations.map(item => item.location),
      agencies: rawAgencies.map(item => item.agency),
      dressCodes: rawDressCodes.map(item => item.dressCode).filter(Boolean),
      missions: rawMissions.map(item => item.mission),
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 })
  }
}
