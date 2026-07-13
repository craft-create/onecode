import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { configureApp } from '@server/common/compat/fullstack-nestjs-core';
import { join } from 'path';
import { __express as hbsExpressEngine } from 'hbs';
import { existsSync } from 'node:fs';

import type { NestExpressApplication } from '@nestjs/platform-express/interfaces/nest-express-application.interface';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    abortOnError: process.env.NODE_ENV !== 'development',
  });
  await configureApp(app, { 
    disableSwagger: true,
  });
  const logger = new Logger('Bootstrap');
  const host = process.env.SERVER_HOST || 'localhost';
  const port = Number(process.env.SERVER_PORT || '3000');
  const distDir = process.cwd().endsWith('/dist') ? process.cwd() : join(process.cwd(), 'dist');
  const candidateViewDir = existsSync(join(distDir, 'dist', 'client'))
    ? join(distDir, 'dist', 'client')
    : join(distDir, 'client');
  const candidateStaticDir = existsSync(join(distDir, 'client'))
    ? join(distDir, 'client')
    : join(distDir, 'dist', 'client');

  // 注册视图引擎, 渲染 client 目录下的 html 文件
  app.useStaticAssets(candidateStaticDir);
  app.setBaseViewsDir(candidateViewDir);
  app.setViewEngine('html');
  app.engine('html', hbsExpressEngine);

  await app.listen(port, host);
  logger.log(`Server running on ${host}:${port}`);
  logger.log(`API endpoints ready at http://${host}:${port}/api`);
}

bootstrap();
