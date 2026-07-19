import { Module, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/compat/fullstack-nestjs-core';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';

@Module({
  providers: [ChatService],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule implements OnModuleInit {
  private readonly logger: Logger = new Logger(ChatModule.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async onModuleInit(): Promise<void> {
    try {
      const drizzle = await import('drizzle-orm');
      const { sql } = drizzle;

      await this.db.execute(sql`
        CREATE TABLE IF NOT EXISTS chat_request (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          from_user_id user_profile NOT NULL,
          to_user_id user_profile NOT NULL,
          reason text,
          status varchar(50) NOT NULL DEFAULT 'pending',
          conversation_id uuid,
          _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          _created_by user_profile,
          _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          _updated_by user_profile
        )
      `);

      await this.db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_chat_request_from ON chat_request (((from_user_id).user_id))
      `);
      await this.db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_chat_request_to ON chat_request (((to_user_id).user_id))
      `);
      await this.db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_chat_request_status ON chat_request (status)
      `);

      await this.db.execute(sql`
        CREATE TABLE IF NOT EXISTS conversation (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          title varchar(255),
          type varchar(50) NOT NULL DEFAULT 'private',
          last_message_id uuid,
          last_message_at timestamptz(3),
          _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          _created_by user_profile,
          _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          _updated_by user_profile
        )
      `);

      await this.db.execute(sql`
        CREATE TABLE IF NOT EXISTS conversation_member (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id uuid NOT NULL,
          user_id user_profile NOT NULL,
          role varchar(50) NOT NULL DEFAULT 'member',
          last_read_message_id uuid,
          unread_count integer NOT NULL DEFAULT 0,
          is_muted integer NOT NULL DEFAULT 0,
          _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          _created_by user_profile,
          _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          _updated_by user_profile
        )
      `);

      await this.db.execute(sql`
        CREATE TABLE IF NOT EXISTS message (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id uuid NOT NULL,
          sender_id user_profile NOT NULL,
          content text,
          type varchar(50) NOT NULL DEFAULT 'text',
          attachments text,
          reply_to_message_id uuid,
          mentions text,
          is_edited integer NOT NULL DEFAULT 0,
          is_deleted integer NOT NULL DEFAULT 0,
          _created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          _created_by user_profile,
          _updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          _updated_by user_profile
        )
      `);

      await this.db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_conversation_member_conversation ON conversation_member(conversation_id)
      `);
      await this.db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_conversation_member_user ON conversation_member(((user_id).user_id))
      `);
      await this.db.execute(sql`
        CREATE UNIQUE INDEX IF NOT EXISTS uq_conversation_member ON conversation_member(conversation_id, ((user_id).user_id))
      `);
      await this.db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_message_conversation ON message(conversation_id)
      `);
      await this.db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_conversation_updated_at ON conversation(_updated_at)
      `);

      this.logger.log('聊天相关表初始化完成');
    } catch (error) {
      this.logger.error('创建聊天相关表失败', error);
    }
  }
}
