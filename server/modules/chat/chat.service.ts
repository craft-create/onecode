import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/compat/fullstack-nestjs-core';
import {
  and,
  asc,
  desc,
  eq,
  lt,
  sql,
  type SQLWrapper,
  count,
} from 'drizzle-orm';
import { conversation, conversationMember, message } from '@server/database/schema';

type MessageFilter = {
  beforeId?: string;
  page?: number;
  limit?: number;
};

type MessagePayload = {
  conversationId: string;
  content?: string;
  type?: string;
  attachments?: string;
  replyToMessageId?: string;
  mentions?: string;
};

@Injectable()
export class ChatService {
  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async findAll(_userId?: string) {
    return this.db.select().from(conversation).orderBy(desc(conversation.createdAt));
  }

  async findOne(id: string) {
    const result = await this.db
      .select()
      .from(conversation)
      .where(eq(conversation.id, id))
      .limit(1);
    return result[0] || null;
  }

  async create(data: any, userId?: string) {
    const result = await this.db
      .insert(conversation)
      .values({ ...data, createdBy: userId })
      .returning();

    const created = result[0];
    if (!created) {
      return null;
    }

    const memberIds = new Set<string>();
    if (userId) {
      memberIds.add(userId);
    }
    if (Array.isArray(data?.memberIds)) {
      data.memberIds.forEach((memberId: unknown) => {
        if (typeof memberId === 'string' && memberId.trim()) {
          memberIds.add(memberId.trim());
        }
      });
    }

    const members = [...memberIds].map((memberId: string) => ({
      conversationId: created.id,
      userId: memberId,
      role: memberId === userId ? 'owner' : 'member',
    }));

    if (members.length > 0) {
      await this.db.insert(conversationMember).values(members);
    }

    return created;
  }

  async update(id: string, data: any) {
    const result = await this.db
      .update(conversation)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(conversation.id, id))
      .returning();
    return result[0] || null;
  }

  async delete(id: string) {
    await this.db.delete(conversation).where(eq(conversation.id, id));
  }

  async findMessages(conversationId: string, filters?: MessageFilter) {
    const conversationExists = await this.findOne(conversationId);
    if (!conversationExists) {
      throw new NotFoundException('会话不存在');
    }

    const limit = this.clampInt(filters?.limit, 50, 1, 200);
    const page = Math.max(1, this.clampInt(filters?.page, 1, 1, 100));
    const offset = (page - 1) * limit;

    const conditions: SQLWrapper[] = [
      eq(message.conversationId, conversationId),
      eq(message.isDeleted, 0),
    ];

    if (filters?.beforeId) {
      const beforeMessage = await this.db
        .select({ createdAt: message.createdAt })
        .from(message)
        .where(and(eq(message.id, filters.beforeId), eq(message.conversationId, conversationId)))
        .limit(1);
      if (beforeMessage.length > 0 && beforeMessage[0]?.createdAt) {
        conditions.push(lt(message.createdAt, beforeMessage[0].createdAt));
      }
    }

    return this.db
      .select()
      .from(message)
      .where(and(...conditions))
      .orderBy(asc(message.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async sendMessage(senderId: string | undefined, payload: MessagePayload) {
    if (!senderId) {
      throw new BadRequestException('未登录');
    }

    if (!payload?.conversationId) {
      throw new BadRequestException('会话ID不能为空');
    }

    const conversationExists = await this.findOne(payload.conversationId);
    if (!conversationExists) {
      throw new NotFoundException('会话不存在');
    }

    if (!payload.content?.trim() && payload.type !== 'image') {
      throw new BadRequestException('消息内容不能为空');
    }

    const [created] = await this.db
      .insert(message)
      .values({
        conversationId: payload.conversationId,
        senderId,
        content: payload.content,
        type: payload.type ?? 'text',
        attachments: payload.attachments,
        replyToMessageId: payload.replyToMessageId,
        mentions: payload.mentions,
      })
      .returning();

    if (!created) {
      throw new BadRequestException('发送失败');
    }

    await this.db
      .update(conversation)
      .set({
        lastMessageId: created.id,
        lastMessageAt: created.createdAt,
        updatedAt: new Date(),
      })
      .where(eq(conversation.id, payload.conversationId));

    return created;
  }

  async markConversationRead(conversationId: string, _userId?: string) {
    if (!conversationId) {
      throw new BadRequestException('会话ID不能为空');
    }
    return { conversationId, success: true };
  }

  async getUnreadCount(userId?: string) {
    if (!userId) {
      return 0;
    }

    const [row] = await this.db
      .select({ count: count() })
      .from(message)
      .where(and(eq(message.isDeleted, 0), sql`(${message.senderId}).user_id != ${userId}`));

    return Number(row?.count ?? 0);
  }

  async deleteMessage(messageId: string, userId?: string) {
    const conditions: SQLWrapper[] = [eq(message.id, messageId), eq(message.isDeleted, 0)];
    if (userId) {
      conditions.push(eq(message.senderId, userId));
    }

    const result = await this.db
      .update(message)
      .set({ isDeleted: 1, updatedAt: new Date() })
      .where(and(...conditions))
      .returning({ id: message.id });

    return result[0] || null;
  }

  async editMessage(messageId: string, userId: string | undefined, content?: string) {
    if (!content?.trim()) {
      throw new BadRequestException('消息内容不能为空');
    }

    const conditions: SQLWrapper[] = [eq(message.id, messageId), eq(message.isDeleted, 0)];
    if (userId) {
      conditions.push(eq(message.senderId, userId));
    }

    const result = await this.db
      .update(message)
      .set({ content, isEdited: 1, updatedAt: new Date() })
      .where(and(...conditions))
      .returning();

    return result[0] || null;
  }

  private clampInt(
    value: number | string | undefined,
    defaultValue: number,
    min: number,
    max: number,
  ): number {
    const parsed = typeof value === 'string' ? Number(value) : value;
    if (typeof parsed !== 'number' || !Number.isFinite(parsed)) {
      return defaultValue;
    }
    const safeValue = Math.floor(parsed);
    if (safeValue < min) {
      return min;
    }
    if (safeValue > max) {
      return max;
    }
    return safeValue;
  }
}
