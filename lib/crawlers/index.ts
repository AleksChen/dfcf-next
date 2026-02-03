import { BaseCrawler } from "./base";
import { EastmoneyCrawler } from "./eastmoney";
import { XueqiuCrawler } from "./xueqiu";
import { Platform } from "../types";

/**
 * 爬虫工厂
 */
export class CrawlerFactory {
  private static crawlers: Map<Platform, BaseCrawler> = new Map<
    Platform,
    BaseCrawler
  >([
    [Platform.EASTMONEY, new EastmoneyCrawler()],
    [Platform.XUEQIU, new XueqiuCrawler()],
  ]);

  /**
   * 获取指定平台的爬虫实例
   */
  static getCrawler(platform: Platform): BaseCrawler {
    const crawler = this.crawlers.get(platform);
    if (!crawler) {
      throw new Error(`Unsupported platform: ${platform}`);
    }
    return crawler;
  }

  /**
   * 获取所有支持的平台
   */
  static getSupportedPlatforms(): Platform[] {
    return Array.from(this.crawlers.keys());
  }
}

// 导出所有爬虫类
export { BaseCrawler, EastmoneyCrawler, XueqiuCrawler };
