/**
 * 素材模块服务层
 * 功能：处理影音素材的所有业务逻辑
 * 包括：素材列表、搜索、筛选、详情、下载、相关推荐、创建、删除、评论、点赞等
 */
import { Injectable, Logger, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/compat/fullstack-nestjs-core';
// 导入数据库表定义：素材表、评论表、点赞表、收藏夹项表、用户素材关联表
import { material, materialComment, materialLike, favoriteFolderItem, userMaterial } from '@server/database/schema';
import { localUsers } from '@server/database/local-schema';
// 导入Drizzle ORM的查询操作符
import { eq, and, gte, lte, like, desc, count, sql } from 'drizzle-orm';
// 导入TypeScript类型定义
import type {
  MaterialItem,
  MaterialListResponse,
  MaterialSearchItem,
  MaterialSearchResponse,
  MaterialFiltersResponse,
  MaterialDetail,
  MaterialDownloadResponse,
  MaterialRelatedItem,
  MaterialRelatedResponse,
  CreateMaterialRequest,
  CreateMaterialResponse,
  MaterialCommentItem,
  MaterialCommentListResponse,
  CreateMaterialCommentRequest,
  CreateMaterialCommentResponse,
  MaterialLikeStatusResponse,
  CommentLikeStatusResponse,
  UpdateMaterialRequest,
} from '@shared/material.interface';

@Injectable()
export class MaterialService {
  // 日志记录器，用于输出调试和运行日志
  private readonly logger = new Logger(MaterialService.name);

  /**
   * 构造函数：注入数据库实例和用户素材服务
   */
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private toIsoDate(value: Date | string | null | undefined): string {
    return value instanceof Date ? value.toISOString() : String(value || '');
  }

  private toCountValue(rows: Array<{ count?: string | number | null | undefined; cnt?: string | number | null | undefined }>): number {
    const raw = rows[0]?.count ?? rows[0]?.cnt;
    if (typeof raw === 'number') {
      return raw;
    }
    return Number(raw || 0);
  }

  private mapMaterialItem(row: {
    id: string;
    title: string;
    type: MaterialItem['type'] | string | null;
    resolution: string | null;
    duration: number | null;
    coverUrl: string | null;
    previewUrl: string | null;
    tags: string[] | null;
  }): MaterialItem {
    return {
      id: row.id,
      title: row.title,
      type: row.type as MaterialItem['type'],
      resolution: row.resolution || '',
      duration: row.duration || 0,
      cover_url: row.coverUrl || '',
      preview_url: row.previewUrl || '',
      tags: row.tags || [],
    };
  }

  private mapMaterialSearchItem(row: {
    id: string;
    title: string;
    type: MaterialSearchItem['type'] | string | null;
    resolution: string | null;
    duration: number | null;
    coverUrl: string | null;
    previewUrl: string | null;
    tags: string[] | null;
  }): MaterialSearchItem {
    return {
      id: row.id,
      title: row.title,
      type: row.type as MaterialSearchItem['type'],
      resolution: row.resolution || '',
      duration: row.duration || 0,
      cover_url: row.coverUrl || '',
      preview_url: row.previewUrl || '',
      tags: row.tags || [],
    };
  }

  private mapRelatedItem(row: {
    id: string;
    title: string;
    coverUrl: string | null;
    duration: number | null;
  }): MaterialRelatedItem {
    return {
      id: row.id,
      title: row.title,
      cover_url: row.coverUrl || '',
      duration: row.duration || 0,
    };
  }

  private mapMaterialCommentItem(row: {
    id: string;
    material_id: string;
    parent_id: string | null;
    content: string;
    author: string;
    like_count: number;
    created_at: Date;
    is_liked: boolean;
  }): MaterialCommentItem {
    return {
      id: row.id,
      material_id: row.material_id,
      parent_id: row.parent_id,
      content: row.content,
      author: row.author,
      like_count: row.like_count,
      is_liked: Boolean(row.is_liked),
      replies: [],
      created_at: this.toIsoDate(row.created_at),
    };
  }

  private buildCommentTree(comments: MaterialCommentItem[]): {
    items: MaterialCommentItem[];
    total: number;
  } {
    const topLevel: MaterialCommentItem[] = [];
    const replyMap = new Map<string, MaterialCommentItem[]>();

    for (const comment of comments) {
      if (comment.parent_id) {
        const bucket = replyMap.get(comment.parent_id) || [];
        bucket.push(comment);
        replyMap.set(comment.parent_id, bucket);
      } else {
        topLevel.push(comment);
      }
    }

    for (const item of topLevel) {
      item.replies = replyMap.get(item.id) || [];
    }

    return {
      items: topLevel,
      total: comments.length,
    };
  }

  /**
   * 判断用户是否为超级账户
   * 超级账户（nickname 为 'zrc'）可绕过权限检查，删除/修改任何内容
   * @param userId - 用户ID
   * @returns 是否为超级账户
   */
  async isSuperUser(userId: string): Promise<boolean> {
    if (!userId) return false;
    const [user] = await this.db
      .select({ nickname: localUsers.nickname })
      .from(localUsers)
      .where(eq(localUsers.id, userId))
      .limit(1);
    return user?.nickname === 'zrc';
  }

  /**
   * 获取素材列表（支持多条件筛选和分页）
   * @param params.type - 素材类型（video视频/audio音频/sound音效）
   * @param params.resolution - 分辨率筛选
   * @param params.durationMin - 最小时长（秒）
   * @param params.durationMax - 最大时长（秒）
   * @param params.tags - 标签数组筛选
   * @param params.page - 页码，默认1
   * @param params.pageSize - 每页数量，默认20
   * @returns 素材列表数组 + 总数
   */
  async list(params: {
    type?: string;
    resolution?: string;
    durationMin?: number;
    durationMax?: number;
    tags?: string[];
    page?: number;
    pageSize?: number;
  }): Promise<MaterialListResponse> {
    // 分页参数处理
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const offset = (page - 1) * pageSize;

    // 动态构建查询条件数组
    const conditions: ReturnType<typeof eq>[] = [];
    if (params.type) conditions.push(eq(material.type, params.type));
    if (params.resolution) conditions.push(eq(material.resolution, params.resolution));
    // 时长范围筛选
    if (params.durationMin !== undefined) {
      conditions.push(gte(material.duration, params.durationMin));
    }
    if (params.durationMax !== undefined) {
      conditions.push(lte(material.duration, params.durationMax));
    }
    // 标签筛选：使用PostgreSQL的数组交集运算符 &&
    if (params.tags && params.tags.length > 0) {
      const tagPlaceholders = params.tags.map((t: string) => sql`${t}`);
      conditions.push(
        sql`${material.tags} && ARRAY[${sql.join(tagPlaceholders, sql`, `)}]::varchar[]`,
      );
    }

    // 将条件数组合并为AND查询条件，无条件则为undefined
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 并行执行：统计总数 + 查询当前页数据
    const [countResult, items] = await Promise.all([
      this.db.select({ count: count() }).from(material).where(whereClause),
      this.db
        .select({
          id: material.id,
          title: material.title,
          type: material.type,
          resolution: material.resolution,
          duration: material.duration,
          coverUrl: material.coverUrl,
          previewUrl: material.previewUrl,
          tags: material.tags,
        })
        .from(material)
        .where(whereClause)
        .orderBy(desc(material.createdAt)) // 按创建时间倒序
        .limit(pageSize)
        .offset(offset),
    ]);

    // 提取总数
    const total = this.toCountValue(countResult);

    // 字段名转换：数据库驼峰 -> 接口下划线
    const mappedItems: MaterialItem[] = items.map((item) =>
      this.mapMaterialItem(item),
    );

    return { items: mappedItems, total };
  }

  /**
   * 素材关键词搜索
   * @param params.keyword - 搜索关键词
   * @param params.page - 页码
   * @param params.pageSize - 每页数量
   * @returns 搜索结果列表 + 总数
   */
  async search(params: {
    keyword: string;
    page?: number;
    pageSize?: number;
  }): Promise<MaterialSearchResponse> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const offset = (page - 1) * pageSize;

    // 使用LIKE模糊匹配标题
    const whereClause = like(material.title, `%${params.keyword}%`);

    // 并行查询总数和数据
    const [countResult, items] = await Promise.all([
      this.db.select({ count: count() }).from(material).where(whereClause),
      this.db
        .select({
          id: material.id,
          title: material.title,
          type: material.type,
          resolution: material.resolution,
          duration: material.duration,
          coverUrl: material.coverUrl,
          previewUrl: material.previewUrl,
          tags: material.tags,
        })
        .from(material)
        .where(whereClause)
        .orderBy(desc(material.createdAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const total = this.toCountValue(countResult);

    // 字段名转换
    const mappedItems: MaterialSearchItem[] = items.map((item) =>
      this.mapMaterialSearchItem(item),
    );

    return { items: mappedItems, total };
  }

  /**
   * 获取素材筛选条件（用于侧边栏筛选器）
   * @returns 所有可用的分辨率、时长区间、标签
   */
  async getFilters(): Promise<MaterialFiltersResponse> {
    // 查询所有素材的筛选字段
    const allMaterials = await this.db
      .select({
        resolution: material.resolution,
        duration: material.duration,
        tags: material.tags,
      })
      .from(material);

    // 去重获取所有分辨率，排序
    const resolutions: string[] = [
      ...new Set(
        allMaterials
          .map((m) => m.resolution)
          .filter(Boolean) as string[],
      ),
    ].sort();

    // 预设时长区间选项
    const durations = [
      { label: '0-30秒', min: 0, max: 30 },
      { label: '30-60秒', min: 30, max: 60 },
      { label: '1-5分钟', min: 60, max: 300 },
      { label: '5-15分钟', min: 300, max: 900 },
      { label: '15分钟以上', min: 900, max: 999999 },
    ];

    // 收集所有标签并去重排序
    const allTags: string[] = [];
    for (const m of allMaterials) {
      if (m.tags && m.tags.length > 0) {
        allTags.push(...m.tags);
      }
    }
    const tags: string[] = [...new Set(allTags)].sort();

    return { resolutions, durations, tags };
  }

  /**
   * 获取素材详情
   * @param id - 素材ID（UUID）
   * @returns 素材完整详情信息
   * @throws NotFoundException 素材不存在时抛出404
   */
  async getById(id: string): Promise<MaterialDetail> {
    const [result] = await this.db
      .select({
        id: material.id,
        title: material.title,
        description: material.description,
        type: material.type,
        resolution: material.resolution,
        duration: material.duration,
        format: material.format,
        fileSize: material.fileSize,
        device: material.device,
        tags: material.tags,
        previewUrl: material.previewUrl,
        coverUrl: material.coverUrl,
        downloadCount: material.downloadCount,
        createdBy: sql<string>`(${material.createdBy}).user_id`,
        uploadCreatorId: sql<string | null>`
          (
            SELECT (user_id).user_id
            FROM user_material
            WHERE material_id = ${id}::uuid
              AND relation_type = 'upload'
            LIMIT 1
          )
        `,
      })
      .from(material)
      .where(eq(material.id, id));

    if (!result) {
      throw new NotFoundException('素材不存在');
    }

    const likeCountRows = await this.db.execute<{ count: string }>(sql`
      SELECT COUNT(*)::text AS count
      FROM material_like
      WHERE material_id = ${id}::uuid
    `);
    const likeCount = this.toCountValue(likeCountRows);
    const resolvedCreatorId = result.createdBy || result.uploadCreatorId || '';
    const creatorProfile = resolvedCreatorId
      ? await this.db
          .select({
            nickname: localUsers.nickname,
            avatarUrl: localUsers.avatarUrl,
          })
          .from(localUsers)
          .where(eq(localUsers.id, resolvedCreatorId))
          .limit(1)
      : [];
    const creatorProfileFirst = creatorProfile[0];

    // 字段名转换 + 默认值处理
    return {
      id: result.id,
      title: result.title,
      description: result.description || '',
      type: result.type,
      resolution: result.resolution || '',
      duration: result.duration || 0,
      format: result.format || '',
      file_size: result.fileSize || 0,
      device: result.device || '',
      tags: result.tags || [],
      preview_url: result.previewUrl || '',
      cover_url: result.coverUrl || '',
      download_count: result.downloadCount ?? 0,
      like_count: likeCount,
      creator_id: resolvedCreatorId,
      creator_name: creatorProfileFirst?.nickname || '',
      creator_avatar_url: creatorProfileFirst?.avatarUrl || '',
    };
  }

  /**
   * 获取素材下载地址（同时增加下载计数）
   * @param id - 素材ID
   * @param userId - 当前登录用户ID（可选，用于记录下载历史）
   * @returns 下载URL
   * @throws NotFoundException 素材不存在时抛出404
   */
  async getDownloadUrl(
    id: string,
    userId?: string,
  ): Promise<MaterialDownloadResponse> {
    const [result] = await this.db
      .select({ downloadUrl: material.downloadUrl })
      .from(material)
      .where(eq(material.id, id));

    if (!result) {
      throw new NotFoundException('素材不存在');
    }

    // 下载计数+1
    try {
      await this.db.execute(sql`
        UPDATE material SET download_count = COALESCE(download_count, 0) + 1
        WHERE id = ${id}::uuid
      `);
      if (userId) {
        await this.db.insert(userMaterial).values({
          userId: sql`ROW(${userId})::user_profile`,
          materialId: id,
          relationType: 'download',
        });
      }
    } catch (err: unknown) {
      this.logger.warn(`Failed to update material download count or record: ${String(err)}`);
    }

    return { download_url: result.downloadUrl || '' };
  }

  /**
   * 获取相关素材推荐（基于标签相似度）
   * @param id - 当前素材ID
   * @param page - 页码
   * @param pageSize - 推荐数量，默认6个
   * @returns 相关素材列表
   */
  async getRelated(
    id: string,
    page: number = 1,
    pageSize: number = 6,
  ): Promise<MaterialRelatedResponse> {
    // 先获取当前素材的标签
    const [source] = await this.db
      .select({ tags: material.tags })
      .from(material)
      .where(eq(material.id, id));

    // 没有标签则返回空列表
    if (!source || !source.tags || source.tags.length === 0) {
      return { items: [] };
    }

    // 使用标签数组交集匹配相关素材，排除当前素材自身
    const tagPlaceholders = source.tags.map((t: string) => sql`${t}`);
    const whereClause = and(
      sql`${material.tags} && ARRAY[${sql.join(tagPlaceholders, sql`, `)}]::varchar[]`,
      sql`${material.id} != ${id}`,
    );

    const offset = (page - 1) * pageSize;
    const items = await this.db
      .select({
        id: material.id,
        title: material.title,
        coverUrl: material.coverUrl,
        duration: material.duration,
      })
      .from(material)
      .where(whereClause)
      .orderBy(desc(material.createdAt))
      .limit(pageSize)
      .offset(offset);

    // 字段名转换
    const mappedItems: MaterialRelatedItem[] = items.map((item) =>
      this.mapRelatedItem(item),
    );

    return { items: mappedItems };
  }

  /**
   * 创建新素材（上传素材时调用）
   * 同时在 user_material 表插入关联记录，建立用户与素材的归属关系
   * @param dto - 素材创建请求数据
   * @param userId - 当前登录用户ID（从 req.userContext.userId 获取）
   * @returns 新创建的素材ID
   */
  async create(dto: CreateMaterialRequest, userId: string): Promise<CreateMaterialResponse> {
    const fileSize = Math.max(0, Number(dto.file_size || 0));

    // 插入素材记录，返回生成的ID
    const [result] = await this.db
      .insert(material)
      .values({
        title: dto.title,
        description: dto.description,
        type: dto.type,
        resolution: dto.resolution,
        duration: dto.duration,
        format: dto.format,
        fileSize,
        device: dto.device,
        tags: dto.tags,
        previewUrl: dto.preview_url,
        downloadUrl: dto.download_url,
        coverUrl: dto.cover_url,
      })
      .returning({ id: material.id });

    this.logger.log(`素材创建成功: ${result.id}`);

    // 同时往 user_material 表插入关联记录，标记该素材属于当前用户
    await this.db
      .insert(userMaterial)
      .values({
        materialId: result.id,
        userId: sql`ROW(${userId})::user_profile`,
        relationType: 'upload',
      });

    if (fileSize > 0) {
      await this.db.execute(sql`
        UPDATE local_users
        SET storage_used = COALESCE(storage_used, 0) + ${fileSize}
        WHERE id = ${userId}::uuid
      `);
    }

    this.logger.log(`用户 ${userId} 与素材 ${result.id} 关联记录已创建`);
    return { id: result.id };
  }

  /**
   * 删除素材（带权限校验 + 级联清理）
   * 安全机制：
   * 1. 校验素材是否存在
   * 2. 校验当前用户是否为素材创建者（只能删自己的）
   * 3. 级联删除所有关联数据（评论、点赞、收藏、用户关联）
   * @param id - 素材ID
   * @param userId - 当前操作用户ID
   * @throws NotFoundException 素材不存在
   * @throws ForbiddenException 无删除权限
   */
  async delete(id: string, userId: string): Promise<void> {
    // 查询素材并获取创建者ID（user_profile类型需要用SQL语法提取user_id）
    const [existing] = await this.db
      .select({
        id: material.id,
        createdBy: sql<string>`(${material.createdBy}).user_id`,
        fileSize: material.fileSize,
      })
      .from(material)
      .where(eq(material.id, id));

    // 校验：素材是否存在
    if (!existing) {
      throw new NotFoundException('素材不存在');
    }

    // 校验：超级账户跳过权限检查，普通用户检查 material.createdBy + user_material 表
    const isSuper = await this.isSuperUser(userId);
    if (!isSuper && existing.createdBy && existing.createdBy !== userId) {
      // createdBy 不匹配时，再检查 user_material 表是否有 upload 归属记录
      const umRows = await this.db.execute<{ cnt: string }>(sql`
        SELECT COUNT(*)::text AS cnt FROM user_material
        WHERE material_id = ${id}::uuid
          AND (user_id).user_id = ${userId}
          AND relation_type = 'upload'
      `);
      if (this.toCountValue(umRows) === 0) {
        throw new ForbiddenException('只能删除自己上传的素材');
      }
    }

    const [ownerRow] = await this.db
      .select({ userId: sql<string>`(user_id).user_id` })
      .from(userMaterial)
      .where(
        and(
          eq(userMaterial.materialId, id),
          eq(userMaterial.relationType, 'upload'),
        ),
      )
      .limit(1);

    // 级联删除关联数据（顺序：先删子表，后删主表）
    await this.db.delete(materialComment).where(eq(materialComment.materialId, id));
    await this.db.delete(materialLike).where(eq(materialLike.materialId, id));
    await this.db.delete(favoriteFolderItem).where(eq(favoriteFolderItem.materialId, id));
    await this.db.delete(userMaterial).where(eq(userMaterial.materialId, id));
    // 最后删除素材主记录
    await this.db.delete(material).where(eq(material.id, id));

    const fileSize = Number(existing.fileSize || 0);
    if (fileSize > 0) {
      const storageOwnerId = ownerRow?.userId || existing.createdBy || userId;
      await this.db.execute(sql`
        UPDATE local_users
        SET storage_used = GREATEST(COALESCE(storage_used, 0) - ${fileSize}, 0)
        WHERE id = ${storageOwnerId}::uuid
      `);
    }

    this.logger.log(`用户 ${userId} 删除素材 ${id} 及关联数据`);
  }

  /**
   * 更新素材（管理员可修改任意素材，普通用户只能修改自己的）
   */
  async update(id: string, userId: string, dto: UpdateMaterialRequest): Promise<void> {
    const [existing] = await this.db
      .select({
        id: material.id,
        createdBy: sql<string>`(${material.createdBy}).user_id`,
      })
      .from(material)
      .where(eq(material.id, id));

    if (!existing) {
      throw new NotFoundException('素材不存在');
    }

    const isSuper = await this.isSuperUser(userId);
    if (!isSuper && existing.createdBy && existing.createdBy !== userId) {
      throw new ForbiddenException('只能修改自己上传的素材');
    }

    const updateData: Record<string, any> = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.resolution !== undefined) updateData.resolution = dto.resolution;
    if (dto.duration !== undefined) updateData.duration = dto.duration;
    if (dto.format !== undefined) updateData.format = dto.format;
    if (dto.file_size !== undefined) updateData.fileSize = dto.file_size;
    if (dto.device !== undefined) updateData.device = dto.device;
    if (dto.tags !== undefined) updateData.tags = dto.tags;
    if (dto.preview_url !== undefined) updateData.previewUrl = dto.preview_url;
    if (dto.download_url !== undefined) updateData.downloadUrl = dto.download_url;
    if (dto.cover_url !== undefined) updateData.coverUrl = dto.cover_url;

    if (Object.keys(updateData).length > 0) {
      await this.db.update(material).set(updateData).where(eq(material.id, id));
      this.logger.log(`素材 ${id} 已更新，操作用户: ${userId}`);
    }
  }

  // ========================================
  // 评论相关方法
  // ========================================

  /**
   * 获取素材评论列表（支持二级回复嵌套）
   * @param materialId - 素材ID
   * @param userId - 当前用户ID（用于判断是否已点赞）
   * @returns 树形结构的评论列表 + 总数
   */
  async getComments(
    materialId: string,
    userId?: string,
  ): Promise<MaterialCommentListResponse> {
    // 原生SQL查询：关联查询点赞状态
    const rows = await this.db.execute<{
      id: string;
      material_id: string;
      parent_id: string | null;
      content: string;
      author: string;
      like_count: number;
      created_at: Date;
      is_liked: boolean;
    }>(sql`
      SELECT
        mc.id,
        mc.material_id,
        mc.parent_id,
        mc.content,
        (mc.author).user_id AS author,
        mc.like_count,
        mc._created_at AS created_at,
        -- 子查询判断当前用户是否点赞了这条评论
        COALESCE(
          (SELECT true FROM comment_like cl
           WHERE cl.comment_id = mc.id
             AND (cl.user_id).user_id = ${userId || ''}
           LIMIT 1),
          false
        ) AS is_liked
      FROM material_comment mc
      WHERE mc.material_id = ${materialId}::uuid
      ORDER BY mc._created_at ASC
    `);

    // 转换字段格式
    const allComments: MaterialCommentItem[] = rows.map((row) =>
      this.mapMaterialCommentItem(row),
    );

    return this.buildCommentTree(allComments);
  }

  /**
   * 发表素材评论（支持回复）
   * @param materialId - 素材ID
   * @param userId - 评论者用户ID
   * @param dto - 评论内容 + 父评论ID（可选，用于回复）
   * @returns 新评论ID
   */
  async createComment(
    materialId: string,
    userId: string,
    dto: CreateMaterialCommentRequest,
  ): Promise<CreateMaterialCommentResponse> {
    const parentId = dto.parent_id || null;
    // 原生SQL插入：使用ROW()构造user_profile类型
    const rows = await this.db.execute<{ id: string }>(sql`
      INSERT INTO material_comment (material_id, parent_id, content, author)
      VALUES (
        ${materialId}::uuid,
        ${parentId ? sql`${parentId}::uuid` : sql`NULL`},
        ${dto.content},
        ROW(${userId})::user_profile
      )
      RETURNING id
    `);
    const commentId: string = rows[0].id;
    this.logger.log(`用户 ${userId} 评论素材 ${materialId}: ${commentId}`);
    return { id: commentId };
  }

  /**
   * 删除评论（只能删自己的）
   * @param materialId - 素材ID
   * @param commentId - 评论ID
   * @param userId - 当前用户ID
   * @throws NotFoundException 评论不存在
   * @throws ForbiddenException 无删除权限
   */
  async deleteComment(
    materialId: string,
    commentId: string,
    userId: string,
  ): Promise<void> {
    // 查询评论作者
    const rows = await this.db.execute<{ author: string }>(sql`
      SELECT (author).user_id AS author
      FROM material_comment
      WHERE id = ${commentId}::uuid
        AND material_id = ${materialId}::uuid
    `);
    if (rows.length === 0) {
      throw new NotFoundException('评论不存在');
    }
    // 权限校验：超级账户跳过检查
    const isSuper = await this.isSuperUser(userId);
    if (!isSuper && rows[0].author !== userId) {
      throw new ForbiddenException('只能删除自己的评论');
    }
    // 先删除该评论的所有回复，再删除评论本身
    await this.db.execute(sql`
      DELETE FROM material_comment WHERE parent_id = ${commentId}::uuid
    `);
    await this.db.execute(sql`
      DELETE FROM material_comment WHERE id = ${commentId}::uuid
    `);
    this.logger.log(`用户 ${userId} 删除评论 ${commentId}`);
  }

  // ========================================
  // 素材点赞相关方法
  // ========================================

  /**
   * 切换素材点赞状态（点赞/取消点赞）
   * @param materialId - 素材ID
   * @param userId - 用户ID
   * @returns 当前点赞状态 + 点赞总数
   */
  async toggleMaterialLike(
    materialId: string,
    userId: string,
  ): Promise<MaterialLikeStatusResponse> {
    // 查询是否已点赞
    const existing = await this.db.execute<{ id: string }>(sql`
      SELECT id FROM material_like
      WHERE material_id = ${materialId}::uuid
        AND (user_id).user_id = ${userId}
    `);

    if (existing.length > 0) {
      // 已点赞 → 取消点赞
      await this.db.execute(sql`
        DELETE FROM material_like
        WHERE material_id = ${materialId}::uuid
          AND (user_id).user_id = ${userId}
      `);
    } else {
      // 未点赞 → 添加点赞
      await this.db.execute(sql`
        INSERT INTO material_like (material_id, user_id)
        VALUES (${materialId}::uuid, ROW(${userId})::user_profile)
      `);
    }

    // 重新统计点赞总数
    const countRows = await this.db.execute<{ count: string }>(sql`
      SELECT COUNT(*)::text AS count FROM material_like
      WHERE material_id = ${materialId}::uuid
    `);
    const likeCount = this.toCountValue(countRows);

    // 返回：是否已点赞（existing.length === 0 表示之前没点，现在点了）
    return { liked: existing.length === 0, like_count: likeCount };
  }

  /**
   * 获取素材点赞状态（仅查询，不切换）
   * @param materialId - 素材ID
   * @param userId - 当前用户ID（可选，未登录则只返回总数）
   * @returns 点赞状态 + 点赞总数
   */
  async getMaterialLikeStatus(
    materialId: string,
    userId?: string,
  ): Promise<MaterialLikeStatusResponse> {
    // 查询点赞总数
    const countRows = await this.db.execute<{ count: string }>(sql`
      SELECT COUNT(*)::text AS count FROM material_like
      WHERE material_id = ${materialId}::uuid
    `);
    const likeCount = this.toCountValue(countRows);

    // 如果用户已登录，查询是否已点赞
    let liked = false;
    if (userId) {
      const likeRows = await this.db.execute<{ id: string }>(sql`
        SELECT id FROM material_like
        WHERE material_id = ${materialId}::uuid
          AND (user_id).user_id = ${userId}
      `);
      liked = likeRows.length > 0;
    }

    return { liked, like_count: likeCount };
  }

  // ========================================
  // 评论点赞相关方法
  // ========================================

  /**
   * 切换评论点赞状态
   * 同时更新material_comment表的like_count字段
   * @param commentId - 评论ID
   * @param userId - 用户ID
   * @returns 当前点赞状态
   */
  async toggleCommentLike(
    commentId: string,
    userId: string,
  ): Promise<CommentLikeStatusResponse> {
    // 查询是否已点赞
    const existing = await this.db.execute<{ id: string }>(sql`
      SELECT id FROM comment_like
      WHERE comment_id = ${commentId}::uuid
        AND (user_id).user_id = ${userId}
    `);

    if (existing.length > 0) {
      // 取消点赞：删除点赞记录 + 计数-1
      await this.db.execute(sql`
        DELETE FROM comment_like
        WHERE comment_id = ${commentId}::uuid
          AND (user_id).user_id = ${userId}
      `);
      await this.db.execute(sql`
        UPDATE material_comment SET like_count = like_count - 1
        WHERE id = ${commentId}::uuid
      `);
      return { liked: false };
    } else {
      // 添加点赞：插入点赞记录 + 计数+1
      await this.db.execute(sql`
        INSERT INTO comment_like (comment_id, user_id)
        VALUES (${commentId}::uuid, ROW(${userId})::user_profile)
      `);
      await this.db.execute(sql`
        UPDATE material_comment SET like_count = like_count + 1
        WHERE id = ${commentId}::uuid
      `);
      return { liked: true };
    }
  }
}
