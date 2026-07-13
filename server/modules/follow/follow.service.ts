import { Injectable, Logger, Inject } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/compat/fullstack-nestjs-core';
import { sql } from 'drizzle-orm';
import type {
  FollowStatusResponse,
  FollowUserItem,
  FollowListResponse,
} from '@shared/follow.interface';

@Injectable()
export class FollowService {
  private readonly logger = new Logger(FollowService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async toggleFollow(
    userId: string,
    targetUserId: string,
  ): Promise<FollowStatusResponse> {
    const existing = await this.db.execute<{ id: string }>(sql`
      SELECT id FROM user_follow
      WHERE (follower_id).user_id = ${userId}
        AND (following_id).user_id = ${targetUserId}
    `);

    if (existing.length > 0) {
      await this.db.execute(sql`
        DELETE FROM user_follow
        WHERE (follower_id).user_id = ${userId}
          AND (following_id).user_id = ${targetUserId}
      `);
      this.logger.log(`用户 ${userId} 取消关注 ${targetUserId}`);
    } else {
      await this.db.execute(sql`
        INSERT INTO user_follow (follower_id, following_id)
        VALUES (ROW(${userId})::user_profile, ROW(${targetUserId})::user_profile)
      `);
      this.logger.log(`用户 ${userId} 关注 ${targetUserId}`);
    }

    return this.getFollowStatus(userId, targetUserId);
  }

  async getFollowStatus(
    userId: string | undefined,
    targetUserId: string,
  ): Promise<FollowStatusResponse> {
    const [followerCountResult] = await this.db.execute<{ count: string }>(sql`
      SELECT COUNT(*)::text AS count FROM user_follow
      WHERE (following_id).user_id = ${targetUserId}
    `);

    const [followingCountResult] = await this.db.execute<{ count: string }>(sql`
      SELECT COUNT(*)::text AS count FROM user_follow
      WHERE (follower_id).user_id = ${targetUserId}
    `);

    let following = false;
    if (userId) {
      const [followRow] = await this.db.execute<{ id: string }>(sql`
        SELECT id FROM user_follow
        WHERE (follower_id).user_id = ${userId}
          AND (following_id).user_id = ${targetUserId}
      `);
      following = !!followRow;
    }

    return {
      is_following: following,
      follower_count: parseInt(followerCountResult.count, 10),
      following_count: parseInt(followingCountResult.count, 10),
    };
  }

  async getFollowers(targetUserId: string): Promise<FollowListResponse> {
    const rows = await this.db.execute<{
      follower_id: string;
      created_at: Date;
    }>(sql`
      SELECT
        (follower_id).user_id AS follower_id,
        _created_at AS created_at
      FROM user_follow
      WHERE (following_id).user_id = ${targetUserId}
      ORDER BY _created_at DESC
    `);

    const [countResult] = await this.db.execute<{ count: string }>(sql`
      SELECT COUNT(*)::text AS count FROM user_follow
      WHERE (following_id).user_id = ${targetUserId}
    `);

    const items = rows.map((row) => ({
      user_id: row.follower_id,
      created_at: row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
    }));

    // 批量查询用户昵称和头像
    const userMap = await this.fetchUserInfo(items.map(i => i.user_id));

    return {
      items: items.map((item) => ({
        ...item,
        name: userMap.get(item.user_id)?.nickname || item.user_id,
        avatar_url: userMap.get(item.user_id)?.avatarUrl || '',
        is_following: false,
      })) as FollowUserItem[],
      total: parseInt(countResult.count, 10),
    };
  }

  async getFollowing(targetUserId: string): Promise<FollowListResponse> {
    const rows = await this.db.execute<{
      following_id: string;
      created_at: Date;
    }>(sql`
      SELECT
        (following_id).user_id AS following_id,
        _created_at AS created_at
      FROM user_follow
      WHERE (follower_id).user_id = ${targetUserId}
      ORDER BY _created_at DESC
    `);

    const [countResult] = await this.db.execute<{ count: string }>(sql`
      SELECT COUNT(*)::text AS count FROM user_follow
      WHERE (follower_id).user_id = ${targetUserId}
    `);

    const items = rows.map((row) => ({
      user_id: row.following_id,
      created_at: row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
    }));

    // 批量查询用户昵称和头像
    const userMap = await this.fetchUserInfo(items.map(i => i.user_id));

    return {
      items: items.map((item) => ({
        ...item,
        name: userMap.get(item.user_id)?.nickname || item.user_id,
        avatar_url: userMap.get(item.user_id)?.avatarUrl || '',
        is_following: false,
      })) as FollowUserItem[],
      total: parseInt(countResult.count, 10),
    };
  }

  /**
   * 批量查询用户信息
   */
  private async fetchUserInfo(
    userIds: string[],
  ): Promise<Map<string, { nickname: string; avatarUrl: string | null }>> {
    if (userIds.length === 0) {
      return new Map();
    }
    const idList = userIds.map(id => `'${id.replace(/'/g, "''")}'::uuid`).join(', ');
    const userRows = await this.db.execute<{ id: string; nickname: string; avatarUrl: string | null }>(sql.raw(
      `SELECT id, nickname, avatar_url FROM local_users WHERE id IN (${idList})`
    ));
    return new Map(userRows.map((u) => [u.id, { nickname: u.nickname, avatarUrl: u.avatarUrl }]));
  }
}
