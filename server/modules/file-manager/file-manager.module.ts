import { Module, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/compat/fullstack-nestjs-core';
import { FileManagerController } from './file-manager.controller';
import { FileManagerService } from './file-manager.service';

@Module({
  controllers: [FileManagerController],
  providers: [FileManagerService],
  exports: [FileManagerService],
})
export class FileManagerModule implements OnModuleInit {
  private readonly logger: Logger = new Logger(FileManagerModule.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async onModuleInit(): Promise<void> {
    try {
      // 创建 file_folder 表（使用 uuid 类型）
      await this.db.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('drizzle-orm')).sql`
          CREATE TABLE IF NOT EXISTS file_folder (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid NOT NULL,
            name varchar(255) NOT NULL,
            parent_id uuid,
            color varchar(50) DEFAULT '#3b82f6',
            icon varchar(50),
            is_starred integer NOT NULL DEFAULT 0,
            item_count integer NOT NULL DEFAULT 0,
            _created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
            _updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `
      );

      // 创建 file_item 表（使用 uuid 类型）
      await this.db.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('drizzle-orm')).sql`
          CREATE TABLE IF NOT EXISTS file_item (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid NOT NULL,
            folder_id uuid,
            name varchar(255) NOT NULL,
            original_name varchar(255),
            type varchar(50) NOT NULL,
            mime_type varchar(100),
            size bigint,
            url text NOT NULL,
            thumbnail_url text,
            description text,
            tags varchar(255)[] DEFAULT '{}',
            is_starred integer NOT NULL DEFAULT 0,
            is_shared integer NOT NULL DEFAULT 0,
            share_token varchar(100) UNIQUE,
            share_expires_at timestamptz,
            download_count integer NOT NULL DEFAULT 0,
            view_count integer NOT NULL DEFAULT 0,
            _created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
            _updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `
      );

      // 创建 file_share 表（使用 uuid 类型）
      await this.db.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('drizzle-orm')).sql`
          CREATE TABLE IF NOT EXISTS file_share (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            file_id uuid NOT NULL,
            user_id uuid NOT NULL,
            share_token varchar(100) UNIQUE NOT NULL,
            password varchar(255),
            expires_at timestamptz,
            max_downloads integer,
            download_count integer NOT NULL DEFAULT 0,
            is_active integer NOT NULL DEFAULT 1,
            _created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `
      );

      // 创建 file_recycle_bin 表（使用 uuid 类型）
      await this.db.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('drizzle-orm')).sql`
          CREATE TABLE IF NOT EXISTS file_recycle_bin (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid NOT NULL,
            file_id uuid,
            folder_id uuid,
            name varchar(255) NOT NULL,
            type varchar(50) NOT NULL,
            size bigint,
            deleted_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
            expires_at timestamptz
          )
        `
      );

      // 创建索引
      await this.db.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('drizzle-orm')).sql`
          CREATE INDEX IF NOT EXISTS idx_file_folder_user ON file_folder(user_id)
        `
      );
      await this.db.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('drizzle-orm')).sql`
          CREATE INDEX IF NOT EXISTS idx_file_folder_parent ON file_folder(parent_id)
        `
      );
      await this.db.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('drizzle-orm')).sql`
          CREATE INDEX IF NOT EXISTS idx_file_item_user ON file_item(user_id)
        `
      );
      await this.db.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('drizzle-orm')).sql`
          CREATE INDEX IF NOT EXISTS idx_file_item_folder ON file_item(folder_id)
        `
      );
      await this.db.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('drizzle-orm')).sql`
          CREATE INDEX IF NOT EXISTS idx_file_share_token ON file_share(share_token)
        `
      );
      await this.db.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('drizzle-orm')).sql`
          CREATE INDEX IF NOT EXISTS idx_recycle_bin_user ON file_recycle_bin(user_id)
        `
      );

      this.logger.log('文件管理相关表初始化完成');
    } catch (error) {
      this.logger.error('创建文件管理表失败', error);
    }
  }
}
