import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  return NextResponse.json({ version: 'v1.0.1_thaiSmartBreak_fix' });
}
