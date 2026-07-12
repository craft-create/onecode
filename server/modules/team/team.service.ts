import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { team } from '@server/database/schema';

@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async findAll(userId?: string) {
    return this.db.select().from(team).orderBy(desc(team.createdAt));
  }

  async findOne(id: string) {
    const result = await this.db.select().from(team).where(eq(team.id, id)).limit(1);
    return result[0] || null;
  }

  async create(data: any) {
    const result = await this.db.insert(team).values(data).returning();
    return result[0];
  }

  async update(id: string, data: any) {
    const result = await this.db.update(team).set({ ...data, updatedAt: new Date() }).where(eq(team.id, id)).returning();
    return result[0] || null;
  }

  async delete(id: string) {
    await this.db.delete(team).where(eq(team.id, id));
  }
}
