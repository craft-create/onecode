import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/compat/fullstack-nestjs-core';
import { eq, desc } from 'drizzle-orm';
import { requirement } from '@server/database/schema';

@Injectable()
export class RequirementService {
  private readonly logger = new Logger(RequirementService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async findAll(_userId?: string) {
    return this.db.select().from(requirement).orderBy(desc(requirement.createdAt));
  }

  async findOne(id: string) {
    const result = await this.db.select().from(requirement).where(eq(requirement.id, id)).limit(1);
    return result[0] || null;
  }

  async create(data: any) {
    const result = await this.db.insert(requirement).values(data).returning();
    return result[0];
  }

  async update(id: string, data: any) {
    const result = await this.db.update(requirement).set({ ...data, updatedAt: new Date() }).where(eq(requirement.id, id)).returning();
    return result[0] || null;
  }

  async delete(id: string) {
    await this.db.delete(requirement).where(eq(requirement.id, id));
  }
}
