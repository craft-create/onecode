import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/compat/fullstack-nestjs-core';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { notification } from '@server/database/schema';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async findAll(
    userId?: string,
    filters?: {
      type?: string;
      isRead?: number;
    },
  ) {
    const conditions = [userId ? eq(notification.userId, userId) : undefined];
    if (filters?.type) {
      conditions.push(eq(notification.type, filters.type));
    }
    if (typeof filters?.isRead === 'number' && !Number.isNaN(filters.isRead)) {
      conditions.push(eq(notification.isRead, filters.isRead));
    }

    const items = await this.db
      .select()
      .from(notification)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(notification.createdAt));

    return {
      items,
      total: items.length,
    };
  }

  async getUnreadCount(userId?: string) {
    if (!userId) {
      return 0;
    }
    const [row] = await this.db
      .select({ count: count() })
      .from(notification)
      .where(and(eq(notification.userId, userId), eq(notification.isRead, 0)));

    return Number(row?.count ?? 0);
  }

  async getStatistics(userId?: string) {
    if (!userId) {
      return {
        total: 0,
        unread: 0,
        read: 0,
      };
    }
    const [row] = await this.db
      .select({ count: count() })
      .from(notification)
      .where(eq(notification.userId, userId));
    const [unreadRow] = await this.db
      .select({ count: count() })
      .from(notification)
      .where(and(eq(notification.userId, userId), eq(notification.isRead, 0)));

    const total = Number(row?.count ?? 0);
    const unread = Number(unreadRow?.count ?? 0);
    return {
      total,
      unread,
      read: total - unread,
    };
  }

  async markAllAsRead(userId?: string, filters?: { type?: string }) {
    if (!userId) {
      return { affected: 0 };
    }

    const conditions = [eq(notification.userId, userId), eq(notification.isRead, 0)];
    if (filters?.type) {
      conditions.push(eq(notification.type, filters.type));
    }

    const result = await this.db
      .update(notification)
      .set({ isRead: 1 })
      .where(and(...conditions))
      .returning({ id: notification.id });

    return { affected: result.length };
  }

  async markAsRead(userId: string | undefined, id: string) {
    if (!userId) {
      return null;
    }

    const result = await this.db
      .update(notification)
      .set({ isRead: 1, updatedAt: new Date() })
      .where(and(eq(notification.userId, userId), eq(notification.id, id)))
      .returning();
    return result[0] || null;
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
