import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { tag } from '@server/database/schema';

@Injectable()
export class TagService {
  private readonly logger = new Logger(TagService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async findAll(userId?: string) {
    return this.db.select().from(tag).orderBy(desc(tag.createdAt));
  }

  async findOne(id: string) {
    const result = await this.db.select().from(tag).where(eq(tag.id, id)).limit(1);
    return result[0] || null;
  }

  async create(data: any) {
    const result = await this.db.insert(tag).values(data).returning();
    return result[0];
  }

  async update(id: string, data: any) {
    const result = await this.db.update(tag).set({ ...data, updatedAt: new Date() }).where(eq(tag.id, id)).returning();
    return result[0] || null;
  }

  async delete(id: string) {
    await this.db.delete(tag).where(eq(tag.id, id));
  }
}
