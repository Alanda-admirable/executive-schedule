import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

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
