# 迁移指南

本文档说明如何从旧架构 (Vite + Express) 迁移到新的 Next.js 架构。

## 架构对比

### 旧架构
```
dfcf-crawler/
├── crawler/              # 后端服务 (Express)
│   ├── server.ts         # API 服务器 (端口 3001)
│   ├── index.ts          # 爬虫入口
│   └── src/              # 爬虫逻辑
└── dashboard/            # 前端应用 (Vite)
    └── src/              # React 组件 (端口 5173)
```

### 新架构
```
dfcf-next/                # 单一 Next.js 应用
├── app/
│   ├── api/              # API Routes (服务端)
│   ├── page.tsx          # 首页 (客户端)
│   └── crawler/page.tsx  # 爬虫页面 (客户端)
├── lib/                  # 服务端逻辑
│   └── crawlers/         # 爬虫核心
└── components/           # 客户端组件
```

## 迁移步骤

### 1. 数据迁移 (可选)

如果需要保留旧数据:

```bash
# 复制数据库文件
cp ../crawler/data/crawler.db ./data/

# 或者导出为 JSON 后重新导入
```

### 2. 环境变量配置 (可选)

如果需要自定义配置,创建 `.env.local`:

```env
# 数据库路径 (默认: ./data/crawler.db)
DATABASE_PATH=./data/crawler.db

# 端口 (默认: 3000)
PORT=3000
```

### 3. 启动新服务

```bash
cd dfcf-next
npm install
npm run dev
```

访问 `http://localhost:3000`

## 代码变化说明

### API 端点变化

| 功能 | 旧端点 | 新端点 |
|------|--------|--------|
| 触发爬虫 | `POST http://localhost:3001/api/crawl` | `POST http://localhost:3000/api/crawl` |
| 查询数据 | `GET http://localhost:3001/api/posts` | `GET http://localhost:3000/api/posts` |
| 统计信息 | `GET http://localhost:3001/api/stats` | `GET http://localhost:3000/api/stats` |

**变化**: 所有接口统一到一个端口 (3000),无需跨域配置。

### 组件迁移

#### 旧代码 (Vite + React Router)

```tsx
// dashboard/src/App.tsx
import { Routes, Route } from 'react-router-dom';

const App = () => (
  <Routes>
    <Route path="/" element={<AnalysisView />} />
    <Route path="/crawler" element={<CrawlerView />} />
  </Routes>
);
```

#### 新代码 (Next.js App Router)

```tsx
// app/page.tsx
export default function AnalysisView() {
  return <div>数据分析</div>;
}

// app/crawler/page.tsx
export default function CrawlerView() {
  return <div>爬虫控制台</div>;
}
```

**变化**: 
- 使用文件系统路由,无需 `react-router-dom`
- 页面组件需要添加 `'use client'` 指令 (如果使用客户端特性)

### API 调用变化

#### 旧代码

```tsx
// 需要配置 Vite Proxy 或使用完整 URL
fetch('http://localhost:3001/api/crawl', { ... })
```

#### 新代码

```tsx
// 同源请求,无需完整 URL
fetch('/api/crawl', { ... })
```

**变化**: 无需跨域配置,API 和页面在同一域下。

### 后端逻辑迁移

#### 旧代码 (Express)

```ts
// crawler/server.ts
app.post('/api/crawl', async (req, res) => {
  const { stockCode, platform } = req.body;
  const result = await crawl({ stockCode, platform });
  res.json(result);
});
```

#### 新代码 (Next.js Route Handler)

```ts
// app/api/crawl/route.ts
export async function POST(request: Request) {
  const { stockCode, platform } = await request.json();
  const result = await crawl({ stockCode, platform });
  return NextResponse.json(result);
}
```

**变化**: 
- 使用 Next.js Route Handler 替代 Express 路由
- 使用 `NextResponse.json()` 替代 `res.json()`

## 优势总结

### 开发体验

| 项目 | 旧架构 | 新架构 |
|------|--------|--------|
| 启动命令 | `npm run start` (启动两个服务) | `npm run dev` (单一命令) |
| 端口数量 | 2 个 (3001 + 5173) | 1 个 (3000) |
| 跨域配置 | 需要 | 不需要 |
| 类型共享 | 手动 | 自动 |
| HMR | 仅前端 | 全栈 |

### 部署体验

| 项目 | 旧架构 | 新架构 |
|------|--------|--------|
| 构建步骤 | 2 次 (前端 + 后端) | 1 次 |
| 部署文件 | 2 个目录 | 1 个目录 |
| 反向代理 | 需要配置 | 可选 |
| 进程管理 | 需要 PM2 等工具管理多个进程 | 单一进程 |

### 代码维护

| 项目 | 旧架构 | 新架构 |
|------|--------|--------|
| 项目结构 | 分离的前后端 | 统一的全栈应用 |
| 依赖管理 | 3 个 package.json | 1 个 package.json |
| 类型定义 | 需要同步维护 | 自动共享 |
| API 文档 | 需要手动维护 | 类型即文档 |

## 常见问题

### Q: 如何在生产环境运行?

```bash
npm run build
npm start
```

### Q: 如何修改端口?

```bash
# 开发环境
PORT=3001 npm run dev

# 生产环境
PORT=3001 npm start
```

### Q: 数据库文件在哪里?

默认在 `data/crawler.db`,可以通过环境变量修改。

### Q: 如何添加新的爬虫平台?

1. 在 `lib/crawlers/` 创建新的爬虫类
2. 在 `lib/crawlers/index.ts` 注册
3. 在 `lib/normalizer.ts` 添加数据清洗逻辑
4. 在前端页面添加选项

### Q: 能部署到 Vercel 吗?

不推荐。因为:
1. Serverless 有执行时长限制 (10-60秒)
2. 文件系统是临时的,数据库无法持久化

推荐部署到:
- 自己的 VPS
- Docker 容器
- 云服务器 (AWS EC2, 阿里云 ECS 等)

## 回滚方案

如果迁移后遇到问题,可以继续使用旧架构:

```bash
cd ../
npm run crawler:server  # 启动后端
npm run dashboard:dev   # 启动前端
```

两个架构可以并存,互不干扰。
