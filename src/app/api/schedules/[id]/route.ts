import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    const { id } = await params
    await prisma.schedule.delete({
      where: { id },
    })
    return NextResponse.json({ message: 'Schedule deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 })
  }
}
