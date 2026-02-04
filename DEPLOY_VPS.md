# VPS + Cloudflare CDN 部署方案

## 架构

```
用户请求
  ↓
Cloudflare CDN (免费)
  ↓
VPS (Next.js + SQLite)
```

## 优势

- ✅ 全球 CDN 加速
- ✅ 自动 HTTPS
- ✅ DDoS 防护
- ✅ 无需修改代码
- ✅ 数据库在本地，无 API 限制

## 部署步骤

### 1. VPS 部署 (Docker)

```bash
# 克隆代码
git clone <your-repo>
cd dfcf-next

# 启动服务
docker-compose up -d

# 或使用 Docker
docker build -t dfcf-crawler .
docker run -d -p 3000:3000 -v $(pwd)/data:/app/data dfcf-crawler
```

### 2. 配置 Nginx 反向代理

```nginx
# /etc/nginx/sites-available/dfcf
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/dfcf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Cloudflare 配置

#### 3.1 添加域名到 Cloudflare

1. 登录 Cloudflare Dashboard
2. Add a Site
3. 输入你的域名
4. 修改域名 DNS 服务器为 Cloudflare 提供的

#### 3.2 配置 DNS 记录

```
Type: A
Name: @ (或 www)
IPv4 address: <你的 VPS IP>
Proxy status: Proxied (橙色云朵)
```

#### 3.3 SSL/TLS 设置

- SSL/TLS > Overview > Full (strict)
- Edge Certificates > Always Use HTTPS: On

#### 3.4 优化设置 (可选)

**Speed > Optimization**
- Auto Minify: 勾选 JavaScript, CSS, HTML
- Brotli: On

**Caching > Configuration**
- Caching Level: Standard
- Browser Cache TTL: 4 hours

**Page Rules** (针对静态资源):
```
URL: your-domain.com/_next/static/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
```

### 4. 自动化部署 (可选)

#### 4.1 GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to VPS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /path/to/dfcf-next
            git pull
            docker-compose down
            docker-compose up -d --build
```

#### 4.2 Watchtower (自动更新 Docker)

```yaml
# docker-compose.yml 添加
services:
  watchtower:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 300  # 每 5 分钟检查更新
```

### 5. 监控和维护

#### 5.1 日志查看

```bash
# Docker 日志
docker logs -f dfcf-crawler

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
```

#### 5.2 数据库备份

```bash
# 定时备份脚本
cat > /root/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp /path/to/dfcf-next/data/crawler.db /backup/crawler_$DATE.db
# 保留最近 7 天
find /backup -name "crawler_*.db" -mtime +7 -delete
EOF

chmod +x /root/backup-db.sh

# 添加到 crontab (每天凌晨 2 点)
crontab -e
0 2 * * * /root/backup-db.sh
```

#### 5.3 健康检查

```bash
# 使用 UptimeRobot 或 Cloudflare Health Checks
# 监控 https://your-domain.com/api/stats
```

## 成本估算

| 项目 | 费用 |
|------|------|
| VPS (2C2G) | $5-10/月 |
| 域名 | $10-15/年 |
| Cloudflare | 免费 |
| **总计** | **~$8/月** |

## 性能优化

### 1. 数据库优化

```typescript
// lib/database.ts 添加连接池
import Database from 'better-sqlite3';

const db = new Database('data/crawler.db', {
  readonly: false,
  fileMustExist: false,
  timeout: 5000,
});

// 性能优化
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000'); // 64MB
```

### 2. Next.js 缓存

```typescript
// app/api/posts/route.ts
export const revalidate = 60; // 60 秒缓存

export async function GET(request: Request) {
  // ...
}
```

### 3. Cloudflare Cache API

```typescript
// middleware.ts
export async function middleware(request: Request) {
  const cache = caches.default;
  let response = await cache.match(request);
  
  if (!response) {
    response = await fetch(request);
    await cache.put(request, response.clone());
  }
  
  return response;
}
```

## 故障排查

### 问题 1: 502 Bad Gateway
```bash
# 检查 Next.js 是否运行
docker ps
curl http://localhost:3000

# 检查 Nginx 配置
sudo nginx -t
```

### 问题 2: 数据库锁定
```bash
# 检查是否有进程占用
lsof data/crawler.db

# 重启服务
docker-compose restart
```

### 问题 3: 磁盘空间不足
```bash
# 清理 Docker
docker system prune -a

# 清理日志
sudo truncate -s 0 /var/log/nginx/*.log
```

## 安全建议

1. **防火墙**
```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

2. **限制 API 访问**
```typescript
// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request: Request) {
  const url = new URL(request.url);
  
  // 限制爬虫 API 只能本地访问
  if (url.pathname.startsWith('/api/crawl')) {
    const ip = request.headers.get('x-real-ip');
    if (ip !== 'YOUR_VPS_IP') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }
}
```

3. **定期更新**
```bash
# 系统更新
sudo apt update && sudo apt upgrade -y

# Docker 镜像更新
docker-compose pull
docker-compose up -d
```
