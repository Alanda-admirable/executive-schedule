import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'


export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const executive = await prisma.executive.update({
      where: { id },
      data: {
        name: body.name,
        title: body.title,
        imageUrl: body.imageUrl,
        color: body.color,
        order: body.order,
      },
    })
    return NextResponse.json(executive)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update executive' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.executive.delete({
      where: { id },
    })
    return NextResponse.json({ message: 'Executive deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete executive' }, { status: 500 })
  }
}
