import { BaseCrawler } from "./base";
import { Platform } from "../types";

/**
 * 雪球爬虫
 * 爬取股票论坛帖子数据
 */
export class XueqiuCrawler extends BaseCrawler {
  platform = Platform.XUEQIU;
  delay = 1000; // 雪球限流较严格,增加延迟

  private readonly baseUrl = "https://xueqiu.com";
  private readonly apiUrl =
    "https://xueqiu.com/query/v1/symbol/search/status.json";

  /**
   * 根据股票代码判断交易所并添加前缀
   * 深交所(SZ): 000xxx, 001xxx, 002xxx, 003xxx, 300xxx
   * 上交所(SH): 600xxx, 601xxx, 603xxx, 605xxx, 688xxx
   * 北交所(BJ): 4xxxxx, 8xxxxx
   */
  private getStockSymbol(code: string): string {
    const prefix = code.substring(0, 3);
    const firstChar = code.charAt(0);

    // 北交所 (优先判断,因为只需要看第一位)
    if (firstChar === "4" || firstChar === "8") {
      return `BJ${code}`;
    }

    // 深交所
    if (["000", "001", "002", "003", "300"].includes(prefix)) {
      return `SZ${code}`;
    }

    // 上交所
    if (["600", "601", "603", "605", "688"].includes(prefix)) {
      return `SH${code}`;
    }

    // 默认返回原代码(可能是其他市场或格式)
    console.warn(
      `[${this.platform}] 未识别的股票代码前缀: ${prefix}, 使用原代码: ${code}`
    );
    return code;
  }

  // 雪球需要的请求头
  private readonly headers = {
    accept: "application/json, text/plain, */*",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
    "cache-control": "no-cache",
    pragma: "no-cache",
    referer: "https://xueqiu.com/", // 添加 Referer
    "sec-ch-ua":
      '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
    // 添加基础 Cookie - 用户需要从浏览器中获取真实的 Cookie
    // 可以通过访问 xueqiu.com 并在开发者工具中复制 Cookie
    cookie:
      "device_id=your_device_id; xq_a_token=your_token; xq_r_token=your_refresh_token; xq_id_token=your_id_token",
  };

  /**
   * 设置自定义 Cookie (可选)
   * 用户可以通过此方法设置从浏览器获取的真实 Cookie
   */
  setCookie(cookie: string) {
    (this.headers as any).cookie = cookie;
  }

  /**
   * 获取API URL
   */
  private getUrl(code: string, page: number): string {
    const symbol = this.getStockSymbol(code); // 添加交易所前缀
    const params = new URLSearchParams({
      count: "10", // 每页数量
      comment: "0", // 不包含评论
      symbol: symbol, // 股票代码(带交易所前缀)
      hl: "0", // 不高亮
      source: "all", // 所有来源
      sort: "time", // 按时间排序
      page: page.toString(), // 页码
      q: "", // 搜索关键词(空)
      type: "11", // 类型: 11表示帖子
    });

    return `${this.apiUrl}?${params.toString()}`;
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

      console.log("@@@res", res);
      console.log("@@@content-type", res.headers.get("content-type"));

      if (!res.ok) {
        console.error(
          `[${this.platform}][${page}] 请求失败: ${res.status} ${res.statusText}`
        );
        return [];
      }

      // 先获取文本内容,检查是否是 JSON
      const text = await res.text();
      console.log(
        "@@@response text (first 500 chars):",
        text.substring(0, 500)
      );

      // 检查是否返回了 HTML (反爬虫)
      if (text.trim().startsWith("<")) {
        console.error(
          `[${this.platform}][${page}] 返回了 HTML 而不是 JSON,可能遇到反爬虫机制`
        );
        console.log("HTML 内容:", text.substring(0, 200));
        return [];
      }

      const jsonData = JSON.parse(text);

      // 雪球API返回格式: { list: [...], count: number, page: number, ... }
      if (jsonData && jsonData.list && Array.isArray(jsonData.list)) {
        const list = jsonData.list;
        console.log(`[${this.platform}][${page}] 获取到 ${list.length} 条数据`);
        return list;
      } else {
        console.warn(`[${this.platform}][${page}] 响应数据格式异常`);
        console.log("响应数据:", JSON.stringify(jsonData).substring(0, 200));
        return [];
      }
    } catch (err) {
      console.log("@@@err", err);
      console.error(`[${this.platform}][${page}] 发生错误:`, err);
      return [];
    }
  }
}
