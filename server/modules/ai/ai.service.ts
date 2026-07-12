import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/compat/fullstack-nestjs-core';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { aiGeneration } from '@server/database/schema';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async findAll(userId?: string) {
    return this.db.select().from(aiGeneration).orderBy(desc(aiGeneration.createdAt));
  }

  async findOne(id: string) {
    const result = await this.db.select().from(aiGeneration).where(eq(aiGeneration.id, id)).limit(1);
    return result[0] || null;
  }

  async create(data: any) {
    const result = await this.db.insert(aiGeneration).values(data).returning();
    return result[0];
  }

  async update(id: string, data: any) {
    const result = await this.db.update(aiGeneration).set({ ...data, updatedAt: new Date() }).where(eq(aiGeneration.id, id)).returning();
    return result[0] || null;
  }

  async delete(id: string) {
    await this.db.delete(aiGeneration).where(eq(aiGeneration.id, id));
  }
}
