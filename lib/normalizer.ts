import { Platform, UnifiedPost } from "./types";

/**
 * 东方财富原始数据格式
 */
interface EastmoneyRawPost {
  post_id: number;
  post_title: string;
  stockbar_code: string;
  user_id: string;
  user_nickname: string;
  post_click_count: number;
  post_comment_count: number;
  post_publish_time: string;
  [key: string]: any;
}

/**
 * 将东方财富数据转换为统一格式
 */
export function normalizeEastmoney(raw: EastmoneyRawPost): UnifiedPost {
  return {
    id: `eastmoney_${raw.post_id}`,
    title: raw.post_title || "",
    content: undefined,
    author: {
      id: raw.user_id || "",
      nickname: raw.user_nickname || "匿名",
    },
    stockCode: raw.stockbar_code || "",
    publishTime: convertToISO8601(raw.post_publish_time),
    clickCount: raw.post_click_count || 0,
    commentCount: raw.post_comment_count || 0,
    source: Platform.EASTMONEY,
    rawData: raw,
    createdAt: new Date().toISOString(),
  };
}

/**
 * 雪球原始数据格式
 */
interface XueqiuRawPost {
  id: number;
  title?: string;
  text?: string;
  description?: string;
  user?: {
    id: number;
    screen_name: string;
  };
  symbol?: string;
  created_at?: number; // 时间戳(毫秒)
  view_count?: number;
  reply_count?: number;
  [key: string]: any;
}

/**
 * 将雪球数据转换为统一格式
 */
export function normalizeXueqiu(raw: XueqiuRawPost): UnifiedPost {
  return {
    id: `xueqiu_${raw.id}`,
    title: raw.title || raw.text?.substring(0, 50) || "",
    content: raw.text || raw.description,
    author: {
      id: raw.user?.id?.toString() || "",
      nickname: raw.user?.screen_name || "匿名",
    },
    stockCode: raw.symbol || "",
    publishTime: raw.created_at
      ? new Date(raw.created_at).toISOString()
      : new Date().toISOString(),
    clickCount: raw.view_count || 0,
    commentCount: raw.reply_count || 0,
    source: Platform.XUEQIU,
    rawData: raw,
    createdAt: new Date().toISOString(),
  };
}

/**
 * 统一数据清洗入口
 */
export function normalize(raw: any, platform: Platform): UnifiedPost {
  switch (platform) {
    case Platform.EASTMONEY:
      return normalizeEastmoney(raw);
    case Platform.XUEQIU:
      return normalizeXueqiu(raw);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * 将东方财富的时间格式转换为 ISO 8601
 * 输入格式: "2026-01-06 17:46:04"
 * 输出格式: "2026-01-06T17:46:04.000Z"
 */
function convertToISO8601(timeStr: string): string {
  if (!timeStr) {
    return new Date().toISOString();
  }

  try {
    // 东方财富使用的是中国时区 (UTC+8)
    const date = new Date(timeStr + " GMT+0800");
    return date.toISOString();
  } catch (error) {
    console.warn(`Failed to parse time: ${timeStr}`, error);
    return new Date().toISOString();
  }
}
