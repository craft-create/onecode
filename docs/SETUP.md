# onecode 开发补充说明

## 开发运行

```bash
npm run dev
```

启动后会并发运行：
- `npm run dev:server`（NestJS）
- `npm run dev:client`（Vite）

日志写入 `logs/dev.std.log`。

## 环境变量

- `SERVER_HOST`（默认：`localhost`）
- `SERVER_PORT`（默认：`3000`）
- `CLIENT_DEV_PORT`（默认：`8080`）
- `LOG_DIR`（日志目录）
- `SUDA_DATABASE_URL` 或 `DATABASE_URL`

推荐 `.env.local` 内容示例：

```bash
SUDA_DATABASE_URL=postgresql://postgres:<DB_PASSWORD>@localhost:5432/app_db
SERVER_HOST=localhost
SERVER_PORT=3000
CLIENT_DEV_PORT=8080
LOG_DIR=logs
```

## 常见问题

1. 打开首页 8080 正常但接口报错
   - 检查 `npm run dev:server` 是否运行成功
   - 检查后端端口是否为 3000
   - 确认数据库连接环境变量

2. 路由 404
   - 前端请求默认走 `/api/...`
   - 注意后端接口前缀是否为 `/api`

3. 存储空间显示为 0B
   - 检查已上传素材/文件是否写入用户存储统计（已在后端修复统计逻辑）

