# onecode

## 简介

`onecode` 是一个全栈应用：
- NestJS 后端 API（`server/`）
- React + Vite 前端（`client/`）

默认端口：
- 前端：`8080`
- 后端：`3000`

## 快速开始

### 1) 安装依赖

```bash
npm install
```

### 2) 配置环境变量

参考 `.env.example`，至少配置数据库：

- `SUDA_DATABASE_URL`（推荐）
- 或 `DATABASE_URL`

示例（仅本地）：

```bash
cp .env.example .env.local
# 编辑 SUDA_DATABASE_URL
```

### 3) 启动开发环境

```bash
npm run dev
```

> 说明：`npm run dev` 已适配 Linux 本地直接启动，不依赖飞书沙箱。

### 4) 访问

- 浏览器：`http://localhost:8080`
- 配置页：`http://localhost:8080/settings`

## 常用命令

- `npm run dev`：本地开发
- `npm run dev:server`：仅启动后端
- `npm run dev:client`：仅启动前端
- `npm run build`：打包
- `npm run start`：生产启动（需先 build）

## 目录结构

- `client/`：前端源码
- `server/`：后端源码
- `shared/`：前后端共享类型/接口定义
- `scripts/`：本地启动与构建脚本
- `server/modules/`：NestJS 功能模块

## 说明

- 数据库相关初始化与连接可在本地通过 `FORCE_FRAMEWORK_DISABLE_DATAPASS` 自动兜底。
- 运行前请确认 PostgreSQL 可用。

## 更多

更多开发说明见：
- [docs/SETUP.md](./docs/SETUP.md)
