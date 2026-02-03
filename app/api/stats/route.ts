import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET() {
  try {
    const stats = db.getStats();
    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Stats query failed:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
