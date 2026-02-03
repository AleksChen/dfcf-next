# 快速开始指南

## 🚀 30 秒启动

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 打开浏览器访问
# http://localhost:3000
```

就这么简单！

## 📝 使用步骤

### 1. 首页 - 数据分析

访问 `http://localhost:3000`，可以看到:
- 实时统计信息(总帖子数、各平台数量)
- 数据表格(支持搜索、排序、分页)
- 刷新和清除功能

### 2. 爬虫页面

点击顶部菜单 "爬虫任务" 或访问 `http://localhost:3000/crawler`:

1. 输入股票代码(如 `002085`)
2. 选择平台(东方财富/雪球)
3. 设置页码范围
4. 点击"开始爬取"

数据会自动保存到数据库,然后在首页查看。

## 🐳 Docker 部署

```bash
# 使用 Docker Compose (推荐)
docker-compose up -d

# 或者手动构建
docker build -t dfcf-crawler .
docker run -p 3000:3000 -v $(pwd)/data:/app/data dfcf-crawler
```

## 📊 测试数据

想要快速看到效果? 试试这些配置:

```
股票代码: 002085
平台: 东方财富
起始页码: 1
结束页码: 2
```

点击爬取后,返回首页即可看到新数据。

## ⚠️ 常见问题

### Q: 爬取雪球数据失败?

雪球有反爬虫机制,需要配置真实的 Cookie。参考 `lib/crawlers/xueqiu.ts` 中的注释。

### Q: 端口被占用?

```bash
PORT=3001 npm run dev
```

### Q: 数据库在哪里?

`data/crawler.db` (SQLite 文件)

## 🔥 生产部署

```bash
# 构建
npm run build

# 启动
npm start
```

推荐使用 PM2 或 Docker 部署。

## 📚 更多文档

- [完整 README](./README.md)
- [迁移指南](./MIGRATION.md)
- [API 文档](./README.md#api-文档)

## 🎯 下一步

- 添加更多爬虫平台
- 实现数据可视化图表
- 添加定时任务
- 导出数据为 Excel/CSV

祝使用愉快！
