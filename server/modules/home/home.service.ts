/**
 * 首页模块服务层
 * 功能：提供首页展示所需的所有数据
 * 包括：精选素材轮播、热门剧本、优秀创作者、平台统计数据
 */
import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@server/common/compat/fullstack-nestjs-core';
// 导入数据库表
import { material, scriptProject } from '@server/database/schema';
// 导入Drizzle ORM操作符
import { desc, count, sql } from 'drizzle-orm';
// 导入类型定义
import type {
  FeaturedMaterial,
  PopularScript,
  TopCreator,
  PlatformStatistics,
} from '@shared/home.interface';

@Injectable()
export class HomeService {
  // 日志记录器
  private readonly logger = new Logger(HomeService.name);
  private readonly isDataPaasDisabled =
    process.env.FORCE_FRAMEWORK_DISABLE_DATAPASS === 'true';

  /**
   * 构造函数：注入数据库实例
   */
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  /**
   * 获取精选素材（用于首页顶部轮播）
   * 取最新创建的5条素材
   * @returns 精选素材数组（最多5条）
   */
  async getFeaturedMaterials(): Promise<FeaturedMaterial[]> {
    if (this.isDataPaasDisabled) return [];

    const rows = await this.db
      .select({
        id: material.id,
        title: material.title,
        coverUrl: material.coverUrl,
        description: material.description,
      })
      .from(material)
      .orderBy(desc(material.createdAt)) // 按创建时间倒序，最新的在前
      .limit(5);

    // 字段名转换
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      cover_url: row.coverUrl ?? '',
      description: row.description ?? '',
    }));
  }

  /**
   * 获取热门剧本（首页展示）
   * 取最近更新的4个剧本项目
   * @returns 热门剧本数组（最多4条）
   */
  async getPopularScripts(): Promise<PopularScript[]> {
    if (this.isDataPaasDisabled) return [];

    const rows = await this.db
      .select({
        id: scriptProject.id,
        title: scriptProject.title,
        type: scriptProject.type,
        coverUrl: scriptProject.coverUrl,
        // 提取创建者的user_id（user_profile类型需要特殊SQL语法）
        authorId: sql<string>`(${scriptProject.createdBy}).user_id`,
      })
      .from(scriptProject)
      // 过滤掉创建者为空的记录
      .where(sql`(${scriptProject.createdBy}).user_id IS NOT NULL`)
      .orderBy(desc(scriptProject.updatedAt)) // 按更新时间倒序
      .limit(4);

    // 字段名转换
    const authorIds = rows
      .map((row) => row.authorId)
      .filter((id): id is string => !!id);
    if (authorIds.length === 0) {
      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        type: row.type ?? '',
        cover_url: row.coverUrl ?? '',
        like_count: 0,
        author_id: row.authorId,
        author_name: '',
      }));
    }
    const idList = authorIds.map(id => `'${id.replace(/'/g, "''")}'::uuid`).join(', ');
    const userRows = await this.db.execute<{ id: string; nickname: string; avatarUrl: string | null }>(sql.raw(
      `SELECT id, nickname, avatar_url FROM local_users WHERE id IN (${idList})`
    ));
    const userMap = new Map(userRows.map((u) => [u.id, { nickname: u.nickname, avatarUrl: u.avatarUrl }]));

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      type: row.type ?? '',
      cover_url: row.coverUrl ?? '',
      like_count: 0, // 预留字段，目前暂未统计点赞数
      author_id: row.authorId,
      author_name: row.authorId
        ? userMap.get(row.authorId)?.nickname || '未知用户'
        : '',
      author_avatar_url: row.authorId ? userMap.get(row.authorId)?.avatarUrl || '' : '',
    }));
  }

  /**
   * 获取优秀创作者排行榜（首页展示）
   * 按上传素材数量排序，取前6名
   * 同时查询每个创作者的最新代表作
   * @returns 创作者列表（最多6人）
   */
  async getTopCreators(): Promise<TopCreator[]> {
    if (this.isDataPaasDisabled) return [];

    // 按创建者分组统计上传数量，取前6
    const topCreators = await this.db
      .select({
        id: sql<string>`(${material.createdBy}).user_id`,
        uploadCount: count(),
      })
      .from(material)
      .where(sql`(${material.createdBy}).user_id IS NOT NULL`)
      .groupBy(sql`(${material.createdBy}).user_id`)
      .orderBy(sql`count(*) DESC`) // 按上传数倒序
      .limit(6);

    // 并行查询每个创作者的最新作品名称 + 用户信息
    const creatorIds = topCreators.map((c) => c.id);
    if (creatorIds.length === 0) return [];
    const creatorIdList = creatorIds.map(id => `'${id.replace(/'/g, "''")}'::uuid`).join(', ');
    const userRows = await this.db.execute<{ id: string; nickname: string; avatarUrl: string | null }>(sql.raw(
      `SELECT id, nickname, avatar_url FROM local_users WHERE id IN (${creatorIdList})`
    ));
    const userMap = new Map(userRows.map((u) => [u.id, { nickname: u.nickname, avatarUrl: u.avatarUrl }]));

    const result = await Promise.all(
      topCreators.map(async (creator) => {
        const [latest] = await this.db
          .select({ title: material.title })
          .from(material)
          .where(
            sql`(${material.createdBy}).user_id = ${creator.id}`,
          )
          .orderBy(desc(material.createdAt))
          .limit(1);

        const userInfo = userMap.get(creator.id);
        return {
          id: creator.id,
          name: userInfo?.nickname || '',
          avatar_url: userInfo?.avatarUrl || '',
          representative_work: latest?.title ?? '',
        };
      }),
    );

    return result;
  }

  /**
   * 获取平台统计数据（首页数据展示栏）
   * 统计：素材总数、剧本总数、创作者总数
   * @returns 三项统计数据
   */
  async getStatistics(): Promise<PlatformStatistics> {
    if (this.isDataPaasDisabled) {
      return {
        material_count: 0,
        script_count: 0,
        creator_count: 0,
      };
    }

    // 素材总数
    const [materialRow] = await this.db
      .select({ count: count() })
      .from(material);

    // 剧本总数
    const [scriptRow] = await this.db
      .select({ count: count() })
      .from(scriptProject);

    // 创作者总数（去重统计有上传过素材的用户数）
    const [creatorRow] = await this.db
      .select({
        count: sql<number>`count(DISTINCT (${material.createdBy}).user_id)`,
      })
      .from(material);

    return {
      material_count: Number(materialRow.count),
      script_count: Number(scriptRow.count),
      creator_count: Number(creatorRow.count),
    };
  }
}
