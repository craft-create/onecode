import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/compat/fullstack-nestjs-core';
import { eq, desc } from 'drizzle-orm';
import { userBehavior } from '@server/database/schema';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async findAll(_userId?: string) {
    return this.db.select().from(userBehavior).orderBy(desc(userBehavior.createdAt));
  }

  async findOne(id: string) {
    const result = await this.db.select().from(userBehavior).where(eq(userBehavior.id, id)).limit(1);
    return result[0] || null;
  }

  async create(data: any) {
    const result = await this.db.insert(userBehavior).values(data).returning();
    return result[0];
  }

  async update(id: string, data: any) {
    const result = await this.db.update(userBehavior).set({ ...data, updatedAt: new Date() }).where(eq(userBehavior.id, id)).returning();
    return result[0] || null;
  }

  async delete(id: string) {
    await this.db.delete(userBehavior).where(eq(userBehavior.id, id));
  }
}
