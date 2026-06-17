import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

async function checkAuth() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('admin_session')
  if (!sessionCookie) return null

  try {
    const session = JSON.parse(sessionCookie.value)
    if (!session || !session.userId || !session.role) return null

    // Update activity
    await prisma.user.update({
      where: { id: session.userId },
      data: { lastActive: new Date() }
    }).catch(err => console.error('Activity update failed:', err))

    return session
  } catch {
    return null
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await checkAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const schedule = await prisma.schedule.update({
      where: { id },
      data: {
        executiveId: body.executiveId,
        date: body.date ? new Date(body.date) : undefined,
        startTime: body.startTime,
        endTime: body.endTime,
        mission: body.mission,
        location: body.location,
        agency: body.agency,
        dressCode: body.dressCode,
        status: body.status,
      },
    })
    return NextResponse.json(schedule)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await checkAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await prisma.schedule.delete({
      where: { id },
    })
    return NextResponse.json({ message: 'Schedule deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 })
  }
}
