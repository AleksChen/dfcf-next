import { NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { Platform } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stockCode = searchParams.get('stockCode');
    const platform = searchParams.get('platform');
    const limit = searchParams.get('limit');

    const posts = db.query({
      stockCode: stockCode || undefined,
      platform: platform as Platform || undefined,
      limit: limit ? Number(limit) : 100,
    });

    return NextResponse.json({
      success: true,
      count: posts.length,
      data: posts,
    });
  } catch (error: any) {
    console.error('Query failed:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
