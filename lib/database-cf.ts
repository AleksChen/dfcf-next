// Cloudflare D1 数据库适配器
import type { Post } from './types';

interface Env {
  DB: D1Database;
}

export class DatabaseCF {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async init() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        stock_code TEXT NOT NULL,
        platform TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        author TEXT,
        read_count INTEGER DEFAULT 0,
        comment_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        post_time TEXT,
        url TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(platform, id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_stock_code ON posts(stock_code);
      CREATE INDEX IF NOT EXISTS idx_platform ON posts(platform);
      CREATE INDEX IF NOT EXISTS idx_post_time ON posts(post_time);
    `);
  }

  async insertPost(post: Post) {
    try {
      await this.db.prepare(`
        INSERT INTO posts (
          id, stock_code, platform, title, content, author,
          read_count, comment_count, like_count, post_time, url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(platform, id) DO UPDATE SET
          title = excluded.title,
          content = excluded.content,
          read_count = excluded.read_count,
          comment_count = excluded.comment_count,
          like_count = excluded.like_count
      `).bind(
        post.id,
        post.stockCode,
        post.platform,
        post.title,
        post.content || null,
        post.author || null,
        post.readCount || 0,
        post.commentCount || 0,
        post.likeCount || 0,
        post.postTime || null,
        post.url || null
      ).run();
      return true;
    } catch (error) {
      console.error('插入数据失败:', error);
      return false;
    }
  }

  async getPosts(filters: {
    stockCode?: string;
    platform?: string;
    limit?: number;
  } = {}) {
    const { stockCode, platform, limit = 100 } = filters;
    
    let query = 'SELECT * FROM posts WHERE 1=1';
    const params: any[] = [];

    if (stockCode) {
      query += ' AND stock_code = ?';
      params.push(stockCode);
    }
    if (platform) {
      query += ' AND platform = ?';
      params.push(platform);
    }

    query += ' ORDER BY post_time DESC LIMIT ?';
    params.push(limit);

    const result = await this.db.prepare(query).bind(...params).all();
    return result.results.map(row => this.rowToPost(row));
  }

  async getStats() {
    const totalResult = await this.db.prepare('SELECT COUNT(*) as count FROM posts').first();
    const platformResult = await this.db.prepare(
      'SELECT platform, COUNT(*) as count FROM posts GROUP BY platform'
    ).all();
    const stockResult = await this.db.prepare(
      'SELECT stock_code, COUNT(*) as count FROM posts GROUP BY stock_code'
    ).all();

    return {
      totalPosts: totalResult?.count || 0,
      byPlatform: Object.fromEntries(
        platformResult.results.map(r => [r.platform, r.count])
      ),
      byStock: Object.fromEntries(
        stockResult.results.map(r => [r.stock_code, r.count])
      ),
    };
  }

  private rowToPost(row: any): Post {
    return {
      id: row.id,
      stockCode: row.stock_code,
      platform: row.platform,
      title: row.title,
      content: row.content,
      author: row.author,
      readCount: row.read_count,
      commentCount: row.comment_count,
      likeCount: row.like_count,
      postTime: row.post_time,
      url: row.url,
    };
  }
}

// 获取数据库实例的辅助函数
export function getDatabase(request: Request): DatabaseCF {
  const env = (request as any).env as Env;
  if (!env?.DB) {
    throw new Error('D1 数据库未绑定');
  }
  return new DatabaseCF(env.DB);
}
