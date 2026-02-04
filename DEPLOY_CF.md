# Cloudflare Pages 部署指南

## 前置要求

1. 安装 Wrangler CLI
```bash
npm install -g wrangler
```

2. 登录 Cloudflare
```bash
wrangler login
```

## 步骤 1: 创建 D1 数据库

```bash
# 创建数据库
wrangler d1 create dfcf-crawler

# 记录输出的 database_id，更新到 wrangler.toml
```

输出示例:
```
✅ Successfully created DB 'dfcf-crawler'
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

将 `database_id` 复制到 `wrangler.toml` 的 `database_id` 字段。

## 步骤 2: 初始化数据库表

```bash
# 创建 schema.sql
cat > schema.sql << 'EOF'
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
EOF

# 执行 SQL
wrangler d1 execute dfcf-crawler --file=schema.sql
```

## 步骤 3: 修改代码使用 D1

需要修改以下文件中的数据库调用:

### app/api/crawl/route.ts
```typescript
import { getDatabase } from '@/lib/database-cf';

export async function POST(request: Request) {
  const db = getDatabase(request);
  // ... 其余代码
}
```

### app/api/posts/route.ts
```typescript
import { getDatabase } from '@/lib/database-cf';

export async function GET(request: Request) {
  const db = getDatabase(request);
  // ... 其余代码
}
```

### app/api/stats/route.ts
```typescript
import { getDatabase } from '@/lib/database-cf';

export async function GET(request: Request) {
  const db = getDatabase(request);
  // ... 其余代码
}
```

## 步骤 4: 安装依赖

```bash
npm install
```

## 步骤 5: 本地测试

```bash
# 使用 Wrangler 本地开发
npx wrangler pages dev --d1 DB=dfcf-crawler -- npm run dev
```

## 步骤 6: 构建和部署

```bash
# 构建
npm run pages:build

# 部署
npm run pages:deploy
```

或者直接:
```bash
npx @cloudflare/next-on-pages && wrangler pages deploy .vercel/output/static
```

## 步骤 7: 绑定 D1 到 Pages 项目

部署后，需要在 Cloudflare Dashboard 中绑定 D1:

1. 访问 Cloudflare Dashboard
2. 进入 Workers & Pages
3. 选择你的项目
4. 进入 Settings > Functions > D1 database bindings
5. 添加绑定:
   - Variable name: `DB`
   - D1 database: 选择 `dfcf-crawler`

## 注意事项

### 限制

1. **爬虫执行时间**: Cloudflare Workers 有 CPU 时间限制(免费版 10ms，付费版 50ms)，长时间爬取会超时
2. **解决方案**: 
   - 使用 Cloudflare Queues 异步处理
   - 或者将爬虫逻辑移到外部服务器，CF 只做数据展示

### 推荐架构

```
┌─────────────────┐
│  外部服务器/VPS  │  <- 运行爬虫任务
│  (定时任务)      │
└────────┬────────┘
         │ 写入数据
         ↓
┌─────────────────┐
│  Cloudflare D1  │  <- 数据存储
└────────┬────────┘
         │ 读取数据
         ↓
┌─────────────────┐
│ Cloudflare Pages│  <- 前端展示
│  (Next.js)      │
└─────────────────┘
```

## 替代方案: 仅部署前端

如果爬虫逻辑保留在本地/VPS:

1. 移除 `/api/crawl` 路由
2. 只部署数据查询和展示功能
3. 本地运行爬虫，直接写入 D1:

```bash
# 本地执行爬虫写入远程 D1
wrangler d1 execute dfcf-crawler --command "INSERT INTO posts ..."
```

## 环境变量

在 Cloudflare Dashboard 设置:
- Settings > Environment variables
- 添加需要的环境变量

## 域名绑定

1. Settings > Custom domains
2. 添加你的域名
3. 配置 DNS 记录

## 监控和日志

```bash
# 查看实时日志
wrangler pages deployment tail

# 查看 D1 数据
wrangler d1 execute dfcf-crawler --command "SELECT COUNT(*) FROM posts"
```
