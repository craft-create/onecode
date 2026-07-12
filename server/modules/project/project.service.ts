import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/compat/fullstack-nestjs-core';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { project } from '@server/database/schema';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async findAll(userId?: string) {
    return this.db.select().from(project).orderBy(desc(project.createdAt));
  }

  async findOne(id: string) {
    const result = await this.db.select().from(project).where(eq(project.id, id)).limit(1);
    return result[0] || null;
  }

  async create(data: any) {
    const result = await this.db.insert(project).values(data).returning();
    return result[0];
  }

  async update(id: string, data: any) {
    const result = await this.db.update(project).set({ ...data, updatedAt: new Date() }).where(eq(project.id, id)).returning();
    return result[0] || null;
  }

  async delete(id: string) {
    await this.db.delete(project).where(eq(project.id, id));
  }
}
