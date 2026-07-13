import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/compat/fullstack-nestjs-core';
import { eq, desc } from 'drizzle-orm';
import { shareRecord } from '@server/database/schema';

@Injectable()
export class ShareService {
  private readonly logger = new Logger(ShareService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async findAll(_userId?: string) {
    return this.db.select().from(shareRecord).orderBy(desc(shareRecord.createdAt));
  }

  async findOne(id: string) {
    const result = await this.db.select().from(shareRecord).where(eq(shareRecord.id, id)).limit(1);
    return result[0] || null;
  }

  async create(data: any) {
    const result = await this.db.insert(shareRecord).values(data).returning();
    return result[0];
  }

  async update(id: string, data: any) {
    const result = await this.db.update(shareRecord).set({ ...data, updatedAt: new Date() }).where(eq(shareRecord.id, id)).returning();
    return result[0] || null;
  }

  async delete(id: string) {
    await this.db.delete(shareRecord).where(eq(shareRecord.id, id));
  }
}
