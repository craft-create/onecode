import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/compat/fullstack-nestjs-core';
import { eq, desc } from 'drizzle-orm';
import { purchase } from '@server/database/schema';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async findAll(_userId?: string) {
    return this.db.select().from(purchase).orderBy(desc(purchase.createdAt));
  }

  async findOne(id: string) {
    const result = await this.db.select().from(purchase).where(eq(purchase.id, id)).limit(1);
    return result[0] || null;
  }

  async create(data: any) {
    const result = await this.db.insert(purchase).values(data).returning();
    return result[0];
  }

  async update(id: string, data: any) {
    const result = await this.db.update(purchase).set({ ...data, updatedAt: new Date() }).where(eq(purchase.id, id)).returning();
    return result[0] || null;
  }

  async delete(id: string) {
    await this.db.delete(purchase).where(eq(purchase.id, id));
  }
}
