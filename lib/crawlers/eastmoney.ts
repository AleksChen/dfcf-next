import { BaseCrawler } from './base';
import { Platform } from '../types';

/**
 * 东方财富爬虫
 */
export class EastmoneyCrawler extends BaseCrawler {
  platform = Platform.EASTMONEY;
  delay = 500;

  private readonly baseUrl = 'https://guba.eastmoney.com';
  private readonly headers = {
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "zh-CN,zh;q=0.9",
    "cache-control": "no-cache",
    pragma: "no-cache",
    "sec-ch-ua":
      '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "same-site",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    cookie:
      "mtp=1; sid=141075121; vtpst=|; quote_lt=1; qgqp_b_id=42a647b3687844144f9900d119b481cf; st_nvi=MU-GBwHKYGzfs-lEb86YAa50e; nid18=0f38fc1a4d417dd2a32a0335f8de07eb; nid18_create_time=1764317713689; gviem=_EkkaUmm3bziG0YFcaXb7c8e0; gviem_create_time=1764317713689; fullscreengg=1; fullscreengg2=1; st_si=09912164321819; st_pvi=76789916104585; st_sp=2025-10-28%2011%3A47%3A41; st_inirUrl=https%3A%2F%2Fwap.eastmoney.com%2F; st_sn=31; st_psi=20260105163642947-117001356556-8123932480; st_asi=delete",
  };

  /**
   * 获取页面URL
   */
  private getUrl(code: string, page: number): string {
    if (page === 1) {
      return `${this.baseUrl}/list,${code}.html`;
    }
    return `${this.baseUrl}/list,${code}_${page}.html`;
  }

  /**
   * 抓取单页数据
   */
  async fetchPage(code: string, page: number): Promise<any[]> {
    const url = this.getUrl(code, page);
    console.log(`[${this.platform}][${page}] 正在获取: ${url}`);

    try {
      const res = await fetch(url, {
        headers: this.headers,
        method: "GET",
      });

      if (!res.ok) {
        console.error(`[${this.platform}][${page}] 请求失败: ${res.status} ${res.statusText}`);
        return [];
      }

      const text = await res.text();
      
      // 提取 article_list 变量
      const match = text.match(/var\s+article_list\s*=\s*(\{[\s\S]*?\});\s*var/);

      if (match && match[1]) {
        const jsonData = JSON.parse(match[1]);
        const list = jsonData.re || [];
        console.log(`[${this.platform}][${page}] 获取到 ${list.length} 条数据`);
        return list;
      } else {
        console.warn(`[${this.platform}][${page}] 未匹配到 article_list 数据`);
        return [];
      }
    } catch (err) {
      console.error(`[${this.platform}][${page}] 发生错误:`, err);
      return [];
    }
  }
}
