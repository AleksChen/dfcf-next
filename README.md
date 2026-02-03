# DFCF Crawler - Next.js 版本

基于 Next.js 15 的东方财富与雪球数据爬虫及分析平台。

## 技术栈

- **框架**: Next.js 15 (App Router)
- **UI**: Ant Design 5 + Tailwind CSS
- **数据库**: SQLite (better-sqlite3)
- **语言**: TypeScript

## 项目结构

```
dfcf-next/
├── app/
│   ├── api/              # API Routes (后端接口)
│   │   ├── crawl/        # 爬虫触发接口
│   │   ├── posts/        # 数据查询接口
│   │   └── stats/        # 统计信息接口
│   ├── crawler/          # 爬虫控制页面
│   ├── page.tsx          # 数据分析页面(首页)
│   ├── layout.tsx        # 根布局
│   └── providers.tsx     # 全局Provider
├── components/
│   └── MainLayout.tsx    # 主布局组件
├── lib/
│   ├── crawlers/         # 爬虫核心逻辑
│   │   ├── base.ts       # 爬虫基类
│   │   ├── eastmoney.ts  # 东方财富爬虫
│   │   ├── xueqiu.ts     # 雪球爬虫
│   │   └── index.ts      # 爬虫工厂
│   ├── database.ts       # 数据库操作
│   ├── normalizer.ts     # 数据清洗
│   └── types.ts          # TypeScript 类型定义
└── data/
    └── crawler.db        # SQLite 数据库文件
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000` 即可使用。

### 3. 构建生产版本

```bash
npm run build
npm start
```

## 功能特性

### 爬虫功能

- ✅ 支持东方财富股吧数据采集
- ✅ 支持雪球股票论坛数据采集
- ✅ 自动数据清洗与标准化
- ✅ 数据持久化到 SQLite
- ✅ 分页采集控制

### 数据分析

- ✅ 实时数据统计
- ✅ 多维度数据筛选
- ✅ 表格排序与搜索
- ✅ 平台数据对比

## API 文档

### POST /api/crawl

触发爬虫任务

**请求体:**
```json
{
  "stockCode": "002085",
  "platform": "eastmoney",
  "pageStart": 1,
  "pageEnd": 5
}
```

**响应:**
```json
{
  "success": true,
  "count": 50,
  "platform": "eastmoney",
  "message": "成功爬取 50 条数据"
}
```

### GET /api/posts

查询帖子数据

**查询参数:**
- `stockCode`: 股票代码(可选)
- `platform`: 平台(eastmoney/xueqiu)(可选)
- `limit`: 返回数量(默认100)

**响应:**
```json
{
  "success": true,
  "count": 100,
  "data": [...]
}
```

### GET /api/stats

获取统计信息

**响应:**
```json
{
  "success": true,
  "data": {
    "totalPosts": 1000,
    "byPlatform": {
      "eastmoney": 600,
      "xueqiu": 400
    },
    "byStock": {
      "002085": 500,
      "000001": 300
    }
  }
}
```

## 部署说明

### 本地部署

适合在本地或 VPS 上运行:

```bash
npm run build
npm start
```

### Docker 部署 (推荐)

```bash
# 构建镜像
docker build -t dfcf-crawler .

# 运行容器
docker run -p 3000:3000 -v $(pwd)/data:/app/data dfcf-crawler
```

### 注意事项

- **不建议部署到 Vercel** 等 Serverless 平台(有执行时长限制)
- 推荐部署到自己的服务器或 Docker 环境
- 数据库文件存储在 `data/crawler.db`
- 需要确保 `data` 目录有写权限

## 相比原架构的优势

| 特性 | 原架构 (Vite + Express) | Next.js 版本 |
|------|-------------------------|--------------|
| 进程管理 | 需要启动两个服务 | **单一服务** |
| 端口 | Frontend: 5173, Backend: 3001 | **统一 3000** |
| 跨域 | 需要配置代理 | **无跨域问题** |
| 部署 | 需分别构建前后端 | **一次构建** |
| 类型共享 | 手动维护 | **天然共享** |
| 开发体验 | 需要切换终端 | **统一开发** |

## License

MIT
