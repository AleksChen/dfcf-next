# 项目结构详解

本文档详细说明 Next.js 版本的项目结构和每个文件的作用。

## 📁 完整目录树

```
dfcf-next/
├── app/                          # Next.js App Router (核心应用)
│   ├── api/                      # API Routes (后端接口)
│   │   ├── crawl/
│   │   │   └── route.ts         # POST /api/crawl - 触发爬虫
│   │   ├── posts/
│   │   │   └── route.ts         # GET /api/posts - 查询帖子
│   │   └── stats/
│   │       └── route.ts         # GET /api/stats - 统计信息
│   ├── crawler/                  # 爬虫页面路由
│   │   └── page.tsx             # /crawler - 爬虫控制台
│   ├── page.tsx                 # / - 首页 (数据分析)
│   ├── layout.tsx               # 根布局 (HTML + Providers)
│   ├── providers.tsx            # 全局 Providers (Ant Design)
│   └── globals.css              # 全局样式
│
├── components/                   # 共享 UI 组件
│   └── MainLayout.tsx           # 主布局 (Header + Menu + Footer)
│
├── lib/                         # 核心业务逻辑 (服务端)
│   ├── crawlers/                # 爬虫实现
│   │   ├── base.ts              # 爬虫基类
│   │   ├── eastmoney.ts         # 东方财富爬虫
│   │   ├── xueqiu.ts            # 雪球爬虫
│   │   └── index.ts             # 爬虫工厂
│   ├── database.ts              # SQLite 数据库操作
│   ├── normalizer.ts            # 数据清洗与标准化
│   └── types.ts                 # TypeScript 类型定义
│
├── data/                        # 数据存储 (运行时生成)
│   └── crawler.db               # SQLite 数据库文件
│
├── public/                      # 静态资源
│   └── ...                      # 图片、图标等
│
├── node_modules/                # 依赖包
│
├── .next/                       # Next.js 构建产物 (自动生成)
│
├── next.config.ts               # Next.js 配置
├── tsconfig.json                # TypeScript 配置
├── tailwind.config.ts           # Tailwind CSS 配置
├── postcss.config.mjs           # PostCSS 配置
├── eslint.config.mjs            # ESLint 配置
├── package.json                 # 项目依赖和脚本
├── package-lock.json            # 依赖锁定文件
│
├── Dockerfile                   # Docker 镜像构建配置
├── docker-compose.yml           # Docker Compose 配置
├── .dockerignore                # Docker 忽略文件
├── .gitignore                   # Git 忽略文件
│
└── README.md                    # 项目说明
    QUICKSTART.md                # 快速开始指南
    MIGRATION.md                 # 迁移指南
    COMPARISON.md                # 架构对比
    PROJECT_STRUCTURE.md         # 本文档
```

## 🔍 核心文件详解

### 1. 应用入口层 (app/)

#### `app/layout.tsx` - 根布局
```typescript
// 全站通用的 HTML 结构和元数据
// - 配置 <html>, <head>, <body>
// - 集成全局 Providers (Ant Design)
// - 导入全局样式
```

#### `app/page.tsx` - 首页
```typescript
// 路由: /
// 功能: 数据分析视图
// - 展示统计信息
// - 数据表格 (搜索、排序、分页)
// - 调用 /api/posts 和 /api/stats
```

#### `app/crawler/page.tsx` - 爬虫页面
```typescript
// 路由: /crawler
// 功能: 爬虫控制台
// - 表单配置 (股票代码、平台、页码)
// - 调用 /api/crawl 触发爬虫
// - 显示执行结果
```

### 2. API 层 (app/api/)

#### `app/api/crawl/route.ts` - 爬虫触发接口
```typescript
// POST /api/crawl
// 功能: 触发爬虫任务
// 参数: { stockCode, platform, pageStart, pageEnd }
// 返回: { success, count, message }
// 
// 处理流程:
// 1. 验证参数
// 2. 获取爬虫实例
// 3. 执行爬取
// 4. 保存到数据库
// 5. 返回结果
```

#### `app/api/posts/route.ts` - 数据查询接口
```typescript
// GET /api/posts?stockCode=xxx&platform=xxx&limit=100
// 功能: 查询帖子数据
// 参数: stockCode?, platform?, limit?
// 返回: { success, count, data: Post[] }
```

#### `app/api/stats/route.ts` - 统计接口
```typescript
// GET /api/stats
// 功能: 获取数据统计
// 返回: { 
//   totalPosts,
//   byPlatform: { eastmoney, xueqiu },
//   byStock: { ... }
// }
```

### 3. 业务逻辑层 (lib/)

#### `lib/types.ts` - 类型定义
```typescript
// 定义核心数据类型:
// - Platform: 平台枚举
// - UnifiedPost: 统一的帖子数据模型
// - CrawlerOptions: 爬虫配置
// - CrawlResult: 爬虫结果
```

#### `lib/crawlers/base.ts` - 爬虫基类
```typescript
// 定义爬虫的通用行为:
// - crawl(): 执行爬取任务
// - fetchPage(): 抓取单页 (需子类实现)
// - sleep(): 延迟工具函数
```

#### `lib/crawlers/eastmoney.ts` - 东方财富爬虫
```typescript
// 实现东方财富股吧数据爬取:
// - 构造请求 URL
// - 解析 HTML 提取 JSON
// - 返回原始数据
```

#### `lib/crawlers/xueqiu.ts` - 雪球爬虫
```typescript
// 实现雪球数据爬取:
// - 构造 API 请求
// - 处理股票代码前缀 (SH/SZ/BJ)
// - 解析 JSON 响应
```

#### `lib/crawlers/index.ts` - 爬虫工厂
```typescript
// 管理所有爬虫实例:
// - getCrawler(platform): 获取指定平台爬虫
// - getSupportedPlatforms(): 获取支持的平台列表
```

#### `lib/normalizer.ts` - 数据清洗
```typescript
// 将不同平台的数据标准化:
// - normalizeEastmoney(): 清洗东方财富数据
// - normalizeXueqiu(): 清洗雪球数据
// - normalize(): 统一清洗入口
```

#### `lib/database.ts` - 数据库操作
```typescript
// SQLite 数据库封装:
// - init(): 初始化表结构和索引
// - insertPost/insertPosts(): 插入数据
// - query(): 多条件查询
// - getStats(): 获取统计信息
```

### 4. UI 组件层 (components/)

#### `components/MainLayout.tsx` - 主布局
```typescript
// 包含:
// - Header: 顶部导航栏
// - Menu: 路由菜单
// - Content: 页面内容区
// - Footer: 页脚
```

### 5. 配置文件

#### `next.config.ts` - Next.js 配置
```typescript
// 配置项:
// - output: 'standalone' (Docker 部署)
// - experimental.serverActions (服务端操作)
```

#### `tsconfig.json` - TypeScript 配置
```json
// 配置项:
// - paths: 路径别名 (@/*)
// - strict: 严格模式
// - jsx: React JSX 支持
```

#### `package.json` - 项目配置
```json
// 脚本:
// - dev: 开发服务器
// - build: 生产构建
// - start: 生产运行
// - lint: 代码检查
```

## 🔄 数据流向

### 爬虫数据流

```
用户点击"开始爬取"
    ↓
表单提交 (app/crawler/page.tsx)
    ↓
POST /api/crawl (app/api/crawl/route.ts)
    ↓
CrawlerFactory.getCrawler() (lib/crawlers/index.ts)
    ↓
crawler.crawl() (lib/crawlers/eastmoney.ts)
    ↓
normalize() (lib/normalizer.ts)
    ↓
db.insertPosts() (lib/database.ts)
    ↓
返回结果 → 前端显示
```

### 数据查询流

```
用户打开首页
    ↓
GET /api/posts (app/page.tsx)
    ↓
db.query() (lib/database.ts)
    ↓
返回数据 → 渲染表格
```

## 📦 文件职责矩阵

| 文件类型 | 位置 | 运行环境 | 职责 |
|---------|------|---------|------|
| **页面** | `app/*/page.tsx` | 客户端 | UI 渲染、用户交互 |
| **布局** | `app/layout.tsx` | 服务端 | HTML 结构、元数据 |
| **API** | `app/api/*/route.ts` | 服务端 | 处理请求、返回响应 |
| **业务逻辑** | `lib/*` | 服务端 | 爬虫、数据库、清洗 |
| **UI 组件** | `components/*` | 客户端 | 可复用组件 |
| **类型定义** | `lib/types.ts` | 通用 | 类型安全 |

## 🚦 添加新功能指南

### 添加新的爬虫平台

1. 创建爬虫类: `lib/crawlers/newplatform.ts`
2. 继承 `BaseCrawler` 并实现 `fetchPage()`
3. 在 `lib/crawlers/index.ts` 注册
4. 在 `lib/normalizer.ts` 添加清洗逻辑
5. 在前端页面添加选项

### 添加新的 API 端点

1. 创建路由文件: `app/api/newapi/route.ts`
2. 导出 HTTP 方法函数 (GET, POST 等)
3. 在前端调用: `fetch('/api/newapi')`

### 添加新页面

1. 创建页面文件: `app/newpage/page.tsx`
2. 导出默认组件
3. 在 `MainLayout.tsx` 添加菜单项

## 🎯 关键设计决策

### 为什么使用 App Router?

- ✅ 文件系统路由,直观简单
- ✅ 内置 API Routes,无需单独后端
- ✅ Server Components,更好的性能
- ✅ 统一的数据获取方式

### 为什么使用 SQLite?

- ✅ 零配置,单文件存储
- ✅ 适合小到中型数据量
- ✅ 支持 SQL 查询
- ✅ 无需外部数据库服务

### 为什么用 better-sqlite3?

- ✅ 同步 API,代码简洁
- ✅ 性能优于 async 版本
- ✅ 类型安全 (TypeScript)

### 为什么不用 Prisma/Drizzle?

- 项目简单,ORM 过重
- 直接使用 SQL 更灵活
- 减少依赖和构建时间

## 📚 延伸阅读

- [Next.js 官方文档](https://nextjs.org/docs)
- [App Router 指南](https://nextjs.org/docs/app)
- [Ant Design 文档](https://ant.design/)
- [better-sqlite3 文档](https://github.com/WiseLibs/better-sqlite3)

## 💡 最佳实践

1. **客户端组件** (`'use client'`)
   - 使用 Hooks (useState, useEffect)
   - 浏览器 API (localStorage, window)
   - 交互式组件

2. **服务端组件** (默认)
   - 数据获取
   - 数据库操作
   - 敏感信息处理

3. **API Routes**
   - 对外暴露的接口
   - 连接数据库
   - 调用爬虫

4. **lib/ 目录**
   - 可复用的业务逻辑
   - 不依赖 Next.js 的代码
   - 方便单元测试

---

希望这个文档能帮助你快速理解项目结构! 🎉
