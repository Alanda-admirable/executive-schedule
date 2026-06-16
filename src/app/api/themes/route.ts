import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'


export async function GET() {
  try {
    const themes = await prisma.dayTheme.findMany({
      orderBy: { dayIndex: 'asc' }
    })
    return NextResponse.json(themes)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch themes' }, { status: 500 })
  }
}
