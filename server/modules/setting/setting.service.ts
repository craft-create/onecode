import { Injectable, Inject, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, sql } from 'drizzle-orm';
import { localUsers } from '@server/database/local-schema';
import { userSetting } from '@server/database/schema';

export interface UserProfileData {
  nickname?: string;
  email?: string;
  phone?: string;
  bio?: string;
  gender?: string;
  birthday?: string;
  avatarUrl?: string;
}

export interface UserPasswordData {
  currentPassword: string;
  newPassword: string;
}

@Injectable()
export class SettingService {
  private readonly logger = new Logger(SettingService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  // ========== User Setting CRUD ==========

  async findAll(userId?: string) {
    const query = this.db.select().from(userSetting);
    if (userId) {
      return query.where(eq(userSetting.userId, userId as any)).orderBy(sql`created_at DESC`);
    }
    return query.orderBy(sql`created_at DESC`);
  }

  async findOne(id: string) {
    const result = await this.db.select().from(userSetting).where(eq(userSetting.id, id)).limit(1);
    return result[0] || null;
  }

  async create(data: any) {
    const result = await this.db.insert(userSetting).values(data).returning();
    return result[0];
  }

  async update(id: string, data: any) {
    const result = await this.db.update(userSetting).set({ ...data, updatedAt: new Date() }).where(eq(userSetting.id, id)).returning();
    return result[0] || null;
  }

  async delete(id: string) {
    await this.db.delete(userSetting).where(eq(userSetting.id, id));
  }

  // ========== User Profile Management ==========

  /**
   * 获取用户完整信息
   */
  async getUserProfile(userId: string): Promise<any> {
    const [user] = await this.db
      .select()
      .from(localUsers)
      .where(eq(localUsers.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return {
      id: user.id,
      nickname: user.nickname,
      email: user.email,
      phone: user.phone,
      bio: user.bio,
      gender: user.gender,
      birthday: user.birthday?.toISOString() || null,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isVerified: user.isVerified,
      storageQuota: user.storageQuota,
      storageUsed: user.storageUsed,
      createdAt: user.createdAt?.toISOString(),
    };
  }

  /**
   * 更新用户个人信息
   */
  async updateProfile(userId: string, data: UserProfileData): Promise<any> {
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };

    // 如果更新昵称，检查是否已存在
    if (data.nickname) {
      const [existing] = await this.db
        .select({ id: localUsers.id })
        .from(localUsers)
        .where(
          and(
            eq(localUsers.nickname, data.nickname),
            sql`${localUsers.id} != ${userId}::uuid`
          )
        )
        .limit(1);

      if (existing) {
        throw new BadRequestException('昵称已被使用');
      }
    }

    const [user] = await this.db
      .update(localUsers)
      .set(updateData)
      .where(eq(localUsers.id, userId))
      .returning({
        id: localUsers.id,
        nickname: localUsers.nickname,
        email: localUsers.email,
        phone: localUsers.phone,
        bio: localUsers.bio,
        gender: localUsers.gender,
        birthday: localUsers.birthday,
        avatarUrl: localUsers.avatarUrl,
        role: localUsers.role,
        isVerified: localUsers.isVerified,
        storageQuota: localUsers.storageQuota,
        storageUsed: localUsers.storageUsed,
        updatedAt: localUsers.updatedAt,
      });

    this.logger.log(`用户 ${userId} 更新了个人资料`);
    return user;
  }

  /**
   * 修改密码
   */
  async changePassword(userId: string, data: UserPasswordData): Promise<{ success: boolean }> {
    const [user] = await this.db
      .select()
      .from(localUsers)
      .where(eq(localUsers.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 验证当前密码
    const bcrypt = await import('bcrypt');
    const isCurrentPasswordValid = await bcrypt.compare(data.currentPassword, user.passwordHash);

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('当前密码错误');
    }

    // 哈希新密码
    const SALT_ROUNDS = 10;
    const newPasswordHash = await bcrypt.hash(data.newPassword, SALT_ROUNDS);

    await this.db
      .update(localUsers)
      .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
      .where(eq(localUsers.id, userId));

    this.logger.log(`用户 ${userId} 修改了密码`);
    return { success: true };
  }

  /**
   * 获取用户存储统计
   */
  async getStorageStats(userId: string): Promise<any> {
    const [user] = await this.db
      .select({
        storageQuota: localUsers.storageQuota,
        storageUsed: localUsers.storageUsed,
      })
      .from(localUsers)
      .where(eq(localUsers.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const used = Number(user.storageUsed || 0);
    const quota = Number(user.storageQuota || 10737418240); // 10GB default
    const remaining = quota - used;
    const usagePercent = (used / quota) * 100;

    return {
      used,
      quota,
      remaining,
      usagePercent: Math.min(100, Math.max(0, usagePercent)),
      formattedUsed: this.formatBytes(used),
      formattedQuota: this.formatBytes(quota),
      formattedRemaining: this.formatBytes(remaining),
    };
  }

  /**
   * 更新存储使用量
   */
  async updateStorageUsage(userId: string, sizeChange: number): Promise<void> {
    await this.db
      .update(localUsers)
      .set({
        storageUsed: sql`storage_used + ${sizeChange}`,
        updatedAt: new Date(),
      })
      .where(eq(localUsers.id, userId));
  }

  /**
   * 检查用户是否为管理员
   */
  async isAdmin(userId: string): Promise<boolean> {
    const [user] = await this.db
      .select({ role: localUsers.role })
      .from(localUsers)
      .where(eq(localUsers.id, userId))
      .limit(1);

    return user?.role === 'admin';
  }

  /**
   * 格式化字节大小
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}
