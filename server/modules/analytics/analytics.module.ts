import { Module, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/compat/fullstack-nestjs-core';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule implements OnModuleInit {
  private readonly logger: Logger = new Logger(AnalyticsModule.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async onModuleInit(): Promise<void> {
    try {
      // 创建 user_behavior 表（分析行为记录）
      await this.db.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('drizzle-orm')).sql`
          CREATE TABLE IF NOT EXISTS user_behavior (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id user_profile,
            session_id character varying(255),
            action character varying(100) NOT NULL,
            resource_type character varying(50),
            resource_id uuid,
            duration integer,
            metadata text,
            ip_address character varying(50),
            user_agent text,
            _created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `
      );

      await this.db.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('drizzle-orm')).sql`
          CREATE INDEX IF NOT EXISTS idx_user_behavior_action ON user_behavior(action)
        `
      );
      await this.db.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('drizzle-orm')).sql`
          CREATE INDEX IF NOT EXISTS idx_user_behavior_created_at ON user_behavior(_created_at)
        `
      );
      await this.db.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('drizzle-orm')).sql`
          CREATE INDEX IF NOT EXISTS idx_user_behavior_resource ON user_behavior(resource_type, resource_id)
        `
      );
      await this.db.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('drizzle-orm')).sql`
          CREATE INDEX IF NOT EXISTS idx_user_behavior_user ON user_behavior((user_behavior.user_id).user_id)
        `
      );

      // 创建 content_stat 表（内容统计）
      await this.db.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('drizzle-orm')).sql`
          CREATE TABLE IF NOT EXISTS content_stat (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            resource_type character varying(50) NOT NULL,
            resource_id uuid NOT NULL,
            date character varying(10) NOT NULL,
            views integer NOT NULL DEFAULT 0,
            likes integer NOT NULL DEFAULT 0,
            favorites integer NOT NULL DEFAULT 0,
            downloads integer NOT NULL DEFAULT 0,
            shares integer NOT NULL DEFAULT 0,
            comments integer NOT NULL DEFAULT 0,
            _created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
            _updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `
      );

      await this.db.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('drizzle-orm')).sql`
          CREATE UNIQUE INDEX IF NOT EXISTS uq_content_stat ON content_stat(resource_type, resource_id, date)
        `
      );
      await this.db.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (await import('drizzle-orm')).sql`
          CREATE INDEX IF NOT EXISTS idx_content_stat_date ON content_stat(date)
        `
      );

      this.logger.log('analytics 表初始化完成');
    } catch (error) {
      this.logger.error('创建 analytics 表失败', error);
    }
  }
}
