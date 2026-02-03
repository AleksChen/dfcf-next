import { Platform, CrawlerOptions, UnifiedPost } from '../types';
import { normalize } from '../normalizer';

/**
 * 爬虫基类
 */
export abstract class BaseCrawler {
  abstract platform: Platform;
  abstract delay: number; // 请求延迟(ms)

  /**
   * 抓取单页数据
   */
  abstract fetchPage(code: string, page: number): Promise<any[]>;

  /**
   * 执行爬取任务
   */
  async crawl(options: CrawlerOptions): Promise<UnifiedPost[]> {
    const { stockCode, pageStart, pageEnd } = options;
    console.log(`[${this.platform}] 开始采集 股票代码:${stockCode} 页码:${pageStart}-${pageEnd}`);

    let allRawData: any[] = [];

    for (let page = pageStart; page <= pageEnd; page++) {
      try {
        const pageData = await this.fetchPage(stockCode, page);
        allRawData = allRawData.concat(pageData);
        
        // 延迟避免请求过快
        if (page < pageEnd) {
          await this.sleep(this.delay);
        }
      } catch (error) {
        console.error(`[${this.platform}] 第 ${page} 页爬取失败:`, error);
      }
    }

    // 数据清洗
    const normalizedPosts = allRawData.map(raw => normalize(raw, this.platform));
    
    console.log(`[${this.platform}] 采集完成。共 ${normalizedPosts.length} 条数据。`);
    return normalizedPosts;
  }

  /**
   * 延迟工具函数
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
