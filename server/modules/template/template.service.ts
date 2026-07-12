import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/compat/fullstack-nestjs-core';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { scriptTemplate } from '@server/database/schema';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async findAll(userId?: string) {
    return this.db.select().from(scriptTemplate).orderBy(desc(scriptTemplate.createdAt));
  }

  async findOne(id: string) {
    const result = await this.db.select().from(scriptTemplate).where(eq(scriptTemplate.id, id)).limit(1);
    return result[0] || null;
  }

  async create(data: any) {
    const result = await this.db.insert(scriptTemplate).values(data).returning();
    return result[0];
  }

  async update(id: string, data: any) {
    const result = await this.db.update(scriptTemplate).set({ ...data, updatedAt: new Date() }).where(eq(scriptTemplate.id, id)).returning();
    return result[0] || null;
  }

  async delete(id: string) {
    await this.db.delete(scriptTemplate).where(eq(scriptTemplate.id, id));
  }
}
