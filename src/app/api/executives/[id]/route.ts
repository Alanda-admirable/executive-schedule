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
    const session = await checkAdminAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized or Forbidden' }, { status: 401 })
    }

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
    const session = await checkAdminAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized or Forbidden' }, { status: 401 })
    }

    const { id } = await params
    await prisma.executive.delete({
      where: { id },
    })
    return NextResponse.json({ message: 'Executive deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete executive' }, { status: 500 })
  }
}
