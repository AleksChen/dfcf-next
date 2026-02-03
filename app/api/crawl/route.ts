import { NextResponse } from 'next/server';
import { CrawlerFactory } from '@/lib/crawlers';
import { db } from '@/lib/database';
import { Platform } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { stockCode, pageStart, pageEnd, platform } = body;

    if (!stockCode) {
      return NextResponse.json(
        { error: 'Missing stockCode' },
        { status: 400 }
      );
    }

    // 验证平台参数
    const validPlatforms = ['eastmoney', 'xueqiu'];
    const selectedPlatform = platform || 'eastmoney';

    if (!validPlatforms.includes(selectedPlatform)) {
      return NextResponse.json(
        { error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` },
        { status: 400 }
      );
    }

    // 获取对应平台的爬虫
    const crawler = CrawlerFactory.getCrawler(selectedPlatform as Platform);

    // 执行爬取
    const posts = await crawler.crawl({
      stockCode,
      pageStart: Number(pageStart) || 1,
      pageEnd: Number(pageEnd) || 1,
    });

    // 保存到数据库
    if (posts.length > 0) {
      const count = db.insertPosts(posts);
      console.log(`已保存 ${count} 条数据到数据库`);
    }

    return NextResponse.json({
      success: true,
      count: posts.length,
      platform: selectedPlatform,
      message: `成功爬取 ${posts.length} 条数据`,
    });
  } catch (error: any) {
    console.error('Crawl failed:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
