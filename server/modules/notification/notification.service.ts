import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { notification } from '@server/database/schema';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async findAll(userId?: string) {
    return this.db.select().from(notification).orderBy(desc(notification.createdAt));
  }

  async findOne(id: string) {
    const result = await this.db.select().from(notification).where(eq(notification.id, id)).limit(1);
    return result[0] || null;
  }

  async create(data: any) {
    const result = await this.db.insert(notification).values(data).returning();
    return result[0];
  }

  async update(id: string, data: any) {
    const result = await this.db.update(notification).set({ ...data, updatedAt: new Date() }).where(eq(notification.id, id)).returning();
    return result[0] || null;
  }

  async delete(id: string) {
    await this.db.delete(notification).where(eq(notification.id, id));
  }
}
