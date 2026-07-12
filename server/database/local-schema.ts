import { sql } from 'drizzle-orm';
import { pgTable, uuid, varchar, text, timestamp, integer, bigint } from 'drizzle-orm/pg-core';

export const localUsers = pgTable('local_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  nickname: varchar('nickname', { length: 100 }).unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  avatarUrl: text('avatar_url'),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  bio: text('bio'),
  gender: varchar('gender', { length: 20 }), // male, female, other, prefer_not_to_say
  birthday: timestamp('birthday', { withTimezone: true }),
  role: varchar('role', { length: 50 }).notNull().default('user'), // admin, user, premium
  isVerified: integer('is_verified').notNull().default(0), // 0: not verified, 1: verified
  storageQuota: bigint('storage_quota', { mode: 'number' }).default(10737418240), // 10GB default
  storageUsed: bigint('storage_used', { mode: 'number' }).default(0),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`),
});
