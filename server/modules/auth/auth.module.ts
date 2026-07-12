import { Module, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule implements OnModuleInit {
  private readonly logger: Logger = new Logger(AuthModule.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async onModuleInit(): Promise<void> {
    try {
      // 创建 local_users 表（如果不存在）
      await this.db.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('drizzle-orm')).sql`
          CREATE TABLE IF NOT EXISTS local_users (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            nickname varchar(100) UNIQUE NOT NULL,
            password_hash text NOT NULL,
            avatar_url text,
            created_at timestamptz DEFAULT CURRENT_TIMESTAMP
          )
        `
      );

      // 扩展 local_users 表：添加缺失的列
      await this.db.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('drizzle-orm')).sql`
          ALTER TABLE local_users ADD COLUMN IF NOT EXISTS email varchar(255)
        `
      );
      await this.db.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('drizzle-orm')).sql`
          ALTER TABLE local_users ADD COLUMN IF NOT EXISTS phone varchar(50)
        `
      );
      await this.db.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('drizzle-orm')).sql`
          ALTER TABLE local_users ADD COLUMN IF NOT EXISTS bio text
        `
      );
      await this.db.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('drizzle-orm')).sql`
          ALTER TABLE local_users ADD COLUMN IF NOT EXISTS gender varchar(20)
        `
      );
      await this.db.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('drizzle-orm')).sql`
          ALTER TABLE local_users ADD COLUMN IF NOT EXISTS birthday timestamptz
        `
      );
      await this.db.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('drizzle-orm')).sql`
          ALTER TABLE local_users ADD COLUMN IF NOT EXISTS role varchar(50) NOT NULL DEFAULT 'user'
        `
      );
      await this.db.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('drizzle-orm')).sql`
          ALTER TABLE local_users ADD COLUMN IF NOT EXISTS is_verified integer NOT NULL DEFAULT 0
        `
      );
      await this.db.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('drizzle-orm')).sql`
          ALTER TABLE local_users ADD COLUMN IF NOT EXISTS storage_quota bigint DEFAULT 10737418240
        `
      );
      await this.db.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('drizzle-orm')).sql`
          ALTER TABLE local_users ADD COLUMN IF NOT EXISTS storage_used bigint DEFAULT 0
        `
      );
      await this.db.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('drizzle-orm')).sql`
          ALTER TABLE local_users ADD COLUMN IF NOT EXISTS last_login_at timestamptz
        `
      );
      await this.db.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('drizzle-orm')).sql`
          ALTER TABLE local_users ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
        `
      );

      this.logger.log('local_users 表初始化完成（包括扩展字段）');
    } catch (error) {
      this.logger.error('创建 local_users 表失败', error);
    }
  }
}
