#!/usr/bin/env node
// ============================================================================
// 本地开发启动脚本（Linux 直接运行）
// Stack: nestjs-react-fullstack
//
// 流程:
//   1. action-plugin init —— 装 user app 在 package.json.actionPlugins 里声明的插件
//   2. dotenv 加载 .env / .env.local 到 process.env（含 SUDA_WEBUSER 适配）
//   3. concurrently 并发起 dev:server + dev:client,整体 stdout/stderr tee 到
//      logs/dev.std.log;server / client 输出靠 concurrently 自带 [server]/[client] 前缀区分
//
// 关键设计：本脚本在 spawn 子进程之前先把 .env / .env.local 加载到 process.env，
// 然后 spawn 的 server / client 进程通过 env 继承直接拿到——SDK（fullstack-nestjs-core
// / fullstack-vite-preset / fullstack-rspack-preset）无需自己 require('dotenv')。
//
// SUDA_WEBUSER 适配：沙箱 env pull 下发到 .env.local 的形态是
// `SUDA_WEBUSER="{\"user_id\":\"...\"}"`（shell-quoted JSON），dotenv@17 剥外层引号后
// 保留内部 `\"` 转义不还原，导致 process.env.SUDA_WEBUSER 是 `{\"user_id\":\"...\"}` 这种
// 带反斜杠字符串，下游 JSON.parse 直接挂。这里做一次「直接 parse 失败则 unescape
// 后重 parse」兜底，把容错收敛在启动期单点，下游拿到干净 JSON 字符串。
// ============================================================================
const fs = require('node:fs');
const path = require('node:path');
const { execSync, spawn } = require('node:child_process');

process.chdir(path.resolve(__dirname, '..'));

function warn(msg) {
  if (process.stderr.isTTY) process.stderr.write(`\x1b[33mWARNING: ${msg}\x1b[0m\n`);
  else process.stderr.write(`WARNING: ${msg}\n`);
}

// 先建 logs/,防止任何步骤(尤其是 spawn 子进程前的 shell redirect)因父目录不存在挂掉
const LOG_DIR = process.env.LOG_DIR || 'logs';
fs.mkdirSync(LOG_DIR, { recursive: true });

// 1. action-plugin init —— 装 user app 在 package.json.actionPlugins 里声明的插件
console.log('[dev-local] (1/3) action-plugin init...');
try {
  execSync('npx -y @lark-apaas/fullstack-cli@latest action-plugin init', { stdio: 'inherit' });
} catch {
  warn('action-plugin init 失败，继续启动');
}

// 2. 加载 .env / .env.local 到 process.env
// dotenv 默认 override:false，先到先得 → 先 .env.local 让它优先于 .env；
// shell env 已在 process.env，两次 config 都不会覆盖。
console.log('[dev-local] (2/3) loading .env / .env.local...');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

if (
  !process.env.FORCE_FRAMEWORK_DISABLE_DATAPASS &&
  !process.env.SUDA_DATABASE_URL &&
  !process.env.DATABASE_URL
) {
  process.env.FORCE_FRAMEWORK_DISABLE_DATAPASS = 'true';
  warn('未检测到 SUDA_DATABASE_URL / DATABASE_URL，已自动启用本地数据库兜底（FORCE_FRAMEWORK_DISABLE_DATAPASS=true）');
}

// SUDA_WEBUSER 适配（详见文件头注释）
if (process.env.SUDA_WEBUSER) {
  const raw = process.env.SUDA_WEBUSER;
  try {
    JSON.parse(raw);
  } catch {
    try {
      const unescaped = raw.replace(/\\"/g, '"');
      JSON.parse(unescaped);
      process.env.SUDA_WEBUSER = unescaped;
    } catch {
      warn(`SUDA_WEBUSER 解析失败,值头部: ${raw.slice(0, 80)}...`);
    }
  }
}

// 3. 并发起前后端 dev server,整体 tee 到 logs/dev.std.log
const devLogPath = path.join(LOG_DIR, 'dev.std.log');
console.log('[dev-local] (3/3) 并发起 dev:server + dev:client');
console.log(`[dev-local] 日志: ${devLogPath}`);

const logFd = fs.openSync(devLogPath, 'a');
const child = spawn(
  'npx',
  [
    '--no-install',
    'concurrently',
    '--names',
    'server,client',
    '--prefix-colors',
    'blue,green',
    '--kill-others-on-fail',
    'npm run dev:server',
    'npm run dev:client',
  ],
  { stdio: ['ignore', 'pipe', 'pipe'], env: process.env },
);

const tee = (src) =>
  src.on('data', (chunk) => {
    try {
      process.stdout.write(chunk);
    } catch {
      /* terminal gone */
    }
    try {
      fs.writeSync(logFd, chunk);
    } catch {
      /* log fd closed */
    }
  });
tee(child.stdout);
tee(child.stderr);

// 外部 SIGTERM/SIGHUP 转发给 concurrently,避免本进程死了 server/client 变孤儿
// (SIGINT 在 TTY 下 shell 直接发给整个前台进程组,不需要转发)
const forward = (sig) => () => {
  try {
    child.kill(sig);
  } catch {
    /* already gone */
  }
};
process.on('SIGTERM', forward('SIGTERM'));
process.on('SIGHUP', forward('SIGHUP'));

// 'close' 而非 'exit':等 child 的 stdio stream drain 完才触发,
// 保证 tee 把最后一批 chunk 写进 logFd 再关闭,不丢尾。
child.on('close', (code) => {
  try {
    fs.closeSync(logFd);
  } catch {
    /* already closed */
  }
  process.exit(code ?? 0);
});
child.on('error', (err) => {
  console.error('[dev-local] 启动失败:', err.message);
  console.error('[dev-local] 如缺 concurrently,运行: npm install');
  process.exit(1);
});
