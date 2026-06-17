import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'


export async function GET() {
  try {
    const executives = await prisma.executive.findMany({
      orderBy: {
        order: 'asc',
      },
    })
    return NextResponse.json(executives)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch executives' }, { status: 500 })
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

    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update activity
    await prisma.user.update({
      where: { id: session.userId },
      data: { lastActive: new Date() }
    }).catch(err => console.error('Activity update failed:', err))

    const body = await request.json()
    const executive = await prisma.executive.create({
      data: {
        name: body.name,
        title: body.title,
        imageUrl: body.imageUrl,
        color: body.color,
        order: body.order || 0,
      },
    })
    return NextResponse.json(executive)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create executive' }, { status: 500 })
  }
}
