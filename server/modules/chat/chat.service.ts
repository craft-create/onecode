import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { conversation } from '@server/database/schema';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async findAll(userId?: string) {
    return this.db.select().from(conversation).orderBy(desc(conversation.createdAt));
  }

  async findOne(id: string) {
    const result = await this.db.select().from(conversation).where(eq(conversation.id, id)).limit(1);
    return result[0] || null;
  }

  async create(data: any) {
    const result = await this.db.insert(conversation).values(data).returning();
    return result[0];
  }

  async update(id: string, data: any) {
    const result = await this.db.update(conversation).set({ ...data, updatedAt: new Date() }).where(eq(conversation.id, id)).returning();
    return result[0] || null;
  }

  async delete(id: string) {
    await this.db.delete(conversation).where(eq(conversation.id, id));
  }
}
