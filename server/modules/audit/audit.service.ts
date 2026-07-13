import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/compat/fullstack-nestjs-core';
import { eq, desc } from 'drizzle-orm';
import { report } from '@server/database/schema';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async findAll(_userId?: string) {
    return this.db.select().from(report).orderBy(desc(report.createdAt));
  }

  async findOne(id: string) {
    const result = await this.db.select().from(report).where(eq(report.id, id)).limit(1);
    return result[0] || null;
  }

  async create(data: any) {
    const result = await this.db.insert(report).values(data).returning();
    return result[0];
  }

  async update(id: string, data: any) {
    const result = await this.db.update(report).set({ ...data, updatedAt: new Date() }).where(eq(report.id, id)).returning();
    return result[0] || null;
  }

  async delete(id: string) {
    await this.db.delete(report).where(eq(report.id, id));
  }
}
