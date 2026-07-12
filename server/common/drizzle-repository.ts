/**
 * Drizzle ORM 通用 Repository 基类（简化版）
 */
import { DRIZZLE_DATABASE } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc, sql, inArray, SQL } from 'drizzle-orm';
import type { PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';

export class BaseRepository<T = any> {
  constructor(
    protected readonly db: PostgresJsDatabase,
    protected readonly table: any,
  ) {}

  async findMany(where?: any, options?: { orderBy?: any; limit?: number; offset?: number }): Promise<T[]> {
    let query: any = this.db.select().from(this.table);

    if (where) {
      const conditions = this.buildConditions(where);
      if (conditions) {
        query = query.where(conditions);
      }
    }

    if (options?.orderBy) {
      query = query.orderBy(options.orderBy);
    } else {
      query = query.orderBy(desc(this.table.createdAt));
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    return query;
  }

  async findOne(where: any): Promise<T | null> {
    const conditions = this.buildConditions(where);
    if (!conditions) return null;

    const result = await this.db.select().from(this.table).where(conditions).limit(1);
    return result[0] || null;
  }

  async findById(id: string): Promise<T | null> {
    return this.findOne({ id });
  }

  async create(data: any): Promise<T> {
    const result = await this.db.insert(this.table).values(data).returning();
    return result[0];
  }

  async update(id: string, data: any): Promise<T | null> {
    const result = await this.db
      .update(this.table)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(this.table.id, id))
      .returning();
    return result[0] || null;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(this.table).where(eq(this.table.id, id));
  }

  async count(where?: any): Promise<number> {
    let query: any = this.db.select({ count: sql<number>`count(*)` }).from(this.table);

    if (where) {
      const conditions = this.buildConditions(where);
      if (conditions) {
        query = query.where(conditions);
      }
    }

    const result = await query;
    return Number(result[0]?.count || 0);
  }

  private buildConditions(where: any): any {
    if (!where) return null;

    const conditions: any[] = [];

    Object.entries(where).forEach(([key, value]: [string, any]) => {
      if (['OR', 'AND', 'relations', 'select', 'limit', 'offset', 'orderBy'].includes(key)) {
        return;
      }

      if (value === null || value === undefined) {
        conditions.push(sql`${this.table[key]} IS NULL`);
      } else if (typeof value === 'object' && value !== null) {
        if (value.$ne !== undefined) {
          conditions.push(sql`${this.table[key]} != ${value.$ne}`);
        } else if (value.$gt !== undefined) {
          conditions.push(sql`${this.table[key]} > ${value.$gt}`);
        } else if (value.$gte !== undefined) {
          conditions.push(sql`${this.table[key]} >= ${value.$gte}`);
        } else if (value.$lt !== undefined) {
          conditions.push(sql`${this.table[key]} < ${value.$lt}`);
        } else if (value.$lte !== undefined) {
          conditions.push(sql`${this.table[key]} <= ${value.$lte}`);
        } else if (value.$in !== undefined && Array.isArray(value.$in)) {
          conditions.push(inArray(this.table[key], value.$in));
        }
      } else {
        conditions.push(eq(this.table[key], value));
      }
    });

    if (conditions.length === 0) return null;
    if (conditions.length === 1) return conditions[0];

    return and(...conditions);
  }
}
