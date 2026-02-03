/**
 * 平台枚举
 */
export enum Platform {
  EASTMONEY = "eastmoney", // 东方财富
  XUEQIU = "xueqiu", // 雪球
}

/**
 * 作者信息
 */
export interface Author {
  id: string;
  nickname: string;
}

/**
 * 统一的帖子数据模型
 */
export interface UnifiedPost {
  id: string; // 帖子唯一ID
  title: string; // 标题
  content?: string; // 内容
  author: Author; // 作者信息
  stockCode: string; // 股票代码
  publishTime: string; // 发布时间 ISO 8601
  clickCount: number; // 点击数
  commentCount: number; // 评论数
  source: Platform; // 数据来源平台
  rawData: any; // 原始数据
  createdAt: string; // 入库时间
}

/**
 * 爬虫配置选项
 */
export interface CrawlerOptions {
  stockCode: string;
  pageStart: number;
  pageEnd: number;
}

/**
 * 爬虫结果
 */
export interface CrawlResult {
  success: boolean;
  count: number;
  posts: UnifiedPost[];
  platform: Platform;
}
