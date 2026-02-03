import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { UnifiedPost, Platform } from './types';

/**
 * 数据库管理类
 */
export class PostDatabase {
  private db: Database.Database;
  private dbPath: string;

  constructor(dbPath: string = path.join(process.cwd(), 'data', 'crawler.db')) {
    this.dbPath = dbPath;
    
    // 确保数据目录存在
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.init();
  }

  /**
   * 初始化数据库表
   */
  private init(): void {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        author_id TEXT,
        author_nickname TEXT,
        stock_code TEXT NOT NULL,
        publish_time TEXT NOT NULL,
        click_count INTEGER DEFAULT 0,
        comment_count INTEGER DEFAULT 0,
        source TEXT NOT NULL,
        raw_data TEXT,
        created_at TEXT NOT NULL
      )
    `;

    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_stock_code ON posts(stock_code)',
      'CREATE INDEX IF NOT EXISTS idx_source ON posts(source)',
      'CREATE INDEX IF NOT EXISTS idx_publish_time ON posts(publish_time)',
      'CREATE INDEX IF NOT EXISTS idx_stock_source ON posts(stock_code, source)'
    ];

    this.db.exec(createTableSQL);
    createIndexes.forEach(sql => this.db.exec(sql));
    
    console.log(`Database initialized at: ${this.dbPath}`);
  }

  /**
   * 插入单条帖子
   */
  insertPost(post: UnifiedPost): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO posts (
        id, title, content, author_id, author_nickname,
        stock_code, publish_time, click_count, comment_count,
        source, raw_data, created_at
      ) VALUES (
        @id, @title, @content, @authorId, @authorNickname,
        @stockCode, @publishTime, @clickCount, @commentCount,
        @source, @rawData, @createdAt
      )
    `);

    stmt.run({
      id: post.id,
      title: post.title,
      content: post.content || null,
      authorId: post.author.id,
      authorNickname: post.author.nickname,
      stockCode: post.stockCode,
      publishTime: post.publishTime,
      clickCount: post.clickCount,
      commentCount: post.commentCount,
      source: post.source,
      rawData: JSON.stringify(post.rawData),
      createdAt: post.createdAt
    });
  }

  /**
   * 批量插入帖子
   */
  insertPosts(posts: UnifiedPost[]): number {
    const insert = this.db.prepare(`
      INSERT OR REPLACE INTO posts (
        id, title, content, author_id, author_nickname,
        stock_code, publish_time, click_count, comment_count,
        source, raw_data, created_at
      ) VALUES (
        @id, @title, @content, @authorId, @authorNickname,
        @stockCode, @publishTime, @clickCount, @commentCount,
        @source, @rawData, @createdAt
      )
    `);

    const insertMany = this.db.transaction((posts: UnifiedPost[]) => {
      for (const post of posts) {
        insert.run({
          id: post.id,
          title: post.title,
          content: post.content || null,
          authorId: post.author.id,
          authorNickname: post.author.nickname,
          stockCode: post.stockCode,
          publishTime: post.publishTime,
          clickCount: post.clickCount,
          commentCount: post.commentCount,
          source: post.source,
          rawData: JSON.stringify(post.rawData),
          createdAt: post.createdAt
        });
      }
    });

    insertMany(posts);
    return posts.length;
  }

  /**
   * 根据股票代码查询
   */
  queryByStock(stockCode: string, limit: number = 100): UnifiedPost[] {
    const stmt = this.db.prepare(`
      SELECT * FROM posts 
      WHERE stock_code = ? 
      ORDER BY publish_time DESC 
      LIMIT ?
    `);
    
    const rows = stmt.all(stockCode, limit) as any[];
    return rows.map(this.rowToPost);
  }

  /**
   * 根据平台查询
   */
  queryByPlatform(platform: Platform, limit: number = 100): UnifiedPost[] {
    const stmt = this.db.prepare(`
      SELECT * FROM posts 
      WHERE source = ? 
      ORDER BY publish_time DESC 
      LIMIT ?
    `);
    
    const rows = stmt.all(platform, limit) as any[];
    return rows.map(this.rowToPost);
  }

  /**
   * 组合查询
   */
  query(options: {
    stockCode?: string;
    platform?: Platform;
    limit?: number;
  }): UnifiedPost[] {
    let sql = 'SELECT * FROM posts WHERE 1=1';
    const params: any[] = [];

    if (options.stockCode) {
      sql += ' AND stock_code = ?';
      params.push(options.stockCode);
    }

    if (options.platform) {
      sql += ' AND source = ?';
      params.push(options.platform);
    }

    sql += ' ORDER BY publish_time DESC LIMIT ?';
    params.push(options.limit || 100);

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];
    return rows.map(this.rowToPost);
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalPosts: number;
    byPlatform: Record<string, number>;
    byStock: Record<string, number>;
  } {
    const total = this.db.prepare('SELECT COUNT(*) as count FROM posts').get() as any;
    
    const byPlatform = this.db.prepare(`
      SELECT source, COUNT(*) as count 
      FROM posts 
      GROUP BY source
    `).all() as any[];

    const byStock = this.db.prepare(`
      SELECT stock_code, COUNT(*) as count 
      FROM posts 
      GROUP BY stock_code
      ORDER BY count DESC
      LIMIT 10
    `).all() as any[];

    return {
      totalPosts: total.count,
      byPlatform: Object.fromEntries(byPlatform.map(r => [r.source, r.count])),
      byStock: Object.fromEntries(byStock.map(r => [r.stock_code, r.count]))
    };
  }

  /**
   * 将数据库行转换为 UnifiedPost
   */
  private rowToPost(row: any): UnifiedPost {
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      author: {
        id: row.author_id,
        nickname: row.author_nickname
      },
      stockCode: row.stock_code,
      publishTime: row.publish_time,
      clickCount: row.click_count,
      commentCount: row.comment_count,
      source: row.source as Platform,
      rawData: JSON.parse(row.raw_data || '{}'),
      createdAt: row.created_at
    };
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    this.db.close();
  }
}

// 导出单例
export const db = new PostDatabase();
