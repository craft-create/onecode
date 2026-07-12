/**
 * 剧本模块服务层
 * 功能：处理剧本项目的所有业务逻辑
 * 包括：项目列表、搜索、创建、删除、详情、内容保存、版本管理、
 *       大纲、评论、角色分析、协作者、导出、下载、点赞等
 */
import { Injectable, Logger, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/compat/fullstack-nestjs-core';
// 导入Drizzle ORM操作符
import { and, desc, eq, ilike, or, count, sql } from 'drizzle-orm';
// 导入数据库表定义
import { localUsers } from '@server/database/local-schema';
import {
  scriptProject,    // 剧本项目表
  scriptContent,    // 剧本内容版本表
  scriptComment,    // 剧本评论表
  scriptLike,       // 剧本点赞表
} from '@server/database/schema';
// 导入TypeScript类型定义
import type {
  ScriptProjectItem,
  ScriptProjectListResponse,
  CreateScriptProjectRequest,
  CreateScriptProjectResponse,
  ScriptProjectSearchItem,
  ScriptProjectSearchResponse,
  ScriptCollaborator,
  ScriptProjectDetail,
  ScriptContentLatest,
  SaveScriptContentRequest,
  SaveScriptContentResponse,
  ScriptOutlineItem,
  ScriptOutlineResponse,
  ScriptCommentItem,
  ScriptCommentListResponse,
  CreateScriptCommentRequest,
  CreateScriptCommentResponse,
  ScriptVersionItem,
  ScriptVersionListResponse,
  RevertVersionResponse,
  RoleAnalysisItem,
  RoleAnalysisResponse,
  InviteCollaboratorResponse,
  ExportScriptRequest,
  ExportScriptResponse,
  ScriptLikeStatusResponse,
} from '@shared/script.interface';

@Injectable()
export class ScriptService {
  // 日志记录器
  private readonly logger = new Logger(ScriptService.name);

  /**
   * 构造函数：注入数据库实例
   */
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

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
   * 获取剧本项目列表
   * @param userId - 当前用户ID（预留，未来可用于只看自己的）
   * @param sort - 排序方式：updated(按更新时间) / title(按标题)
   * @param page - 页码
   * @param pageSize - 每页数量
   * @param creatorId - 可选，筛选特定创建者的项目
   * @returns 项目列表 + 总数
   */
  async listProjects(
    userId: string,
    sort: string,
    page: number,
    pageSize: number,
    creatorId?: string,
  ): Promise<ScriptProjectListResponse> {
    // 根据排序参数决定排序字段
    const orderBy = sort === 'title'
      ? [scriptProject.title]
      : [desc(scriptProject.updatedAt)];

    // 构建查询条件
    let whereClause;
    if (creatorId) {
      whereClause = sql`(${scriptProject.createdBy}).user_id = ${creatorId}`;
    }

    // 查询当前页数据
    const projects = await this.db
      .select({
        id: scriptProject.id,
        title: scriptProject.title,
        type: scriptProject.type,
        description: scriptProject.description,
        coverUrl: scriptProject.coverUrl,
        // 协作者数量：使用PostgreSQL的array_length函数
        collaboratorCount: sql<number>`COALESCE(array_length(${scriptProject.collaborators}, 1), 0)`,
        updatedAt: scriptProject.updatedAt,
      })
      .from(scriptProject)
      .where(whereClause)
      .orderBy(...orderBy)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // 查询总数
    const totalResult = await this.db
      .select({ count: count() })
      .from(scriptProject)
      .where(whereClause);

    const total = Number(totalResult[0].count);

    // 字段名转换 + 日期格式化
    const items: ScriptProjectItem[] = projects.map((p) => ({
      id: p.id,
      title: p.title,
      type: p.type || '',
      description: p.description || '',
      cover_url: p.coverUrl || '',
      collaborator_count: Number(p.collaboratorCount),
      updated_at: p.updatedAt instanceof Date
        ? p.updatedAt.toISOString()
        : String(p.updatedAt),
    }));

    return { items, total };
  }

  /**
   * 获取当前用户创建的剧本项目列表
   * @param userId - 当前用户ID
   * @param sort - 排序方式
   * @param page - 页码
   * @param pageSize - 每页数量
   * @returns 项目列表 + 总数
   */
  async listMyProjects(
    userId: string,
    sort: string,
    page: number,
    pageSize: number,
  ): Promise<ScriptProjectListResponse> {
    const orderBy = sort === 'title'
      ? [scriptProject.title]
      : [desc(scriptProject.updatedAt)];

    const userFilter = sql`(${scriptProject.createdBy}).user_id = ${userId}`;

    const [projects, totalResult] = await Promise.all([
      this.db
        .select({
          id: scriptProject.id,
          title: scriptProject.title,
          type: scriptProject.type,
          description: scriptProject.description,
          coverUrl: scriptProject.coverUrl,
          collaboratorCount: sql<number>`COALESCE(array_length(${scriptProject.collaborators}, 1), 0)`,
          updatedAt: scriptProject.updatedAt,
        })
        .from(scriptProject)
        .where(userFilter)
        .orderBy(...orderBy)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      this.db
        .select({ count: count() })
        .from(scriptProject)
        .where(userFilter),
    ]);

    const total = Number(totalResult[0].count);

    const items: ScriptProjectItem[] = projects.map((p) => ({
      id: p.id,
      title: p.title,
      type: p.type || '',
      description: p.description || '',
      cover_url: p.coverUrl || '',
      collaborator_count: Number(p.collaboratorCount),
      updated_at: p.updatedAt instanceof Date
        ? p.updatedAt.toISOString()
        : String(p.updatedAt),
    }));

    return { items, total };
  }

  /**
   * 搜索剧本项目
   * 匹配范围：标题 + 描述（不区分大小写）
   * @param keyword - 搜索关键词
   * @param page - 页码
   * @param pageSize - 每页数量
   * @returns 搜索结果 + 总数
   */
  async searchProjects(
    keyword: string,
    page: number,
    pageSize: number,
  ): Promise<ScriptProjectSearchResponse> {
    // 使用ilike进行不区分大小写的模糊匹配，标题或描述命中即可
    const projects = await this.db
      .select({
        id: scriptProject.id,
        title: scriptProject.title,
        coverUrl: scriptProject.coverUrl,
        updatedAt: scriptProject.updatedAt,
      })
      .from(scriptProject)
      .where(
        or(
          ilike(scriptProject.title, `%${keyword}%`),
          ilike(scriptProject.description, `%${keyword}%`),
        ),
      )
      .orderBy(desc(scriptProject.updatedAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // 统计总数（同样的条件）
    const totalResult = await this.db
      .select({ count: count() })
      .from(scriptProject)
      .where(
        or(
          ilike(scriptProject.title, `%${keyword}%`),
          ilike(scriptProject.description, `%${keyword}%`),
        ),
      );

    const total = Number(totalResult[0].count);

    // 字段名转换
    const items: ScriptProjectSearchItem[] = projects.map((p) => ({
      id: p.id,
      title: p.title,
      cover_url: p.coverUrl || '',
      updated_at: p.updatedAt instanceof Date
        ? p.updatedAt.toISOString()
        : String(p.updatedAt),
    }));

    return { items, total };
  }

  /**
   * 创建新剧本项目
   * 创建时自动生成第一个空内容版本 v1
   * @param dto - 项目创建表单数据
   * @param userId - 创建者用户ID
   * @returns 新项目ID
   */
  async createProject(
    dto: CreateScriptProjectRequest,
    userId: string,
  ): Promise<CreateScriptProjectResponse> {
    // 插入项目主记录，显式设置创建者
    const [project] = await this.db
      .insert(scriptProject)
      .values({
        title: dto.title,
        type: dto.type,
        description: dto.description,
        coverUrl: dto.cover_url || null,
        createdBy: sql`ROW(${userId})::user_profile`,
      })
      .returning({ id: scriptProject.id });

    // 自动创建初始版本（v1，空内容）
    await this.db.insert(scriptContent).values({
      projectId: project.id,
      content: '',
      version: 'v1',
      snapshotSummary: '初始版本',
    });

    this.logger.log(`Created script project: ${project.id}`);
    return { id: project.id };
  }

  /**
   * 删除剧本项目（带权限校验 + 级联清理）
   * 安全机制：
   * 1. 校验项目是否存在
   * 2. 校验当前用户是否为创建者（只能删自己的）
   * 3. 级联删除：内容版本、评论、点赞
   * @param id - 项目ID
   * @param userId - 当前操作用户ID
   * @throws NotFoundException 项目不存在
   * @throws ForbiddenException 无删除权限
   */
  async deleteProject(id: string, userId: string): Promise<void> {
    // 查询项目并提取创建者ID
    const [existing] = await this.db
      .select({
        id: scriptProject.id,
        createdBy: sql<string>`(${scriptProject.createdBy}).user_id`,
      })
      .from(scriptProject)
      .where(eq(scriptProject.id, id));

    if (!existing) {
      throw new NotFoundException('剧本项目不存在');
    }

    // 权限校验：超级账户跳过检查，普通用户只能删除自己创建的
    const isSuper = await this.isSuperUser(userId);
    if (!isSuper && existing.createdBy && existing.createdBy !== userId) {
      throw new ForbiddenException('只能删除自己创建的剧本');
    }

    // 级联删除（顺序：先子表后主表）
    await this.db.delete(scriptContent).where(eq(scriptContent.projectId, id));
    await this.db.delete(scriptComment).where(eq(scriptComment.projectId, id));
    await this.db.delete(scriptLike).where(eq(scriptLike.projectId, id));
    await this.db.delete(scriptProject).where(eq(scriptProject.id, id));

    this.logger.log(`用户 ${userId} 删除剧本项目 ${id} 及关联数据`);
  }

  /**
   * 获取剧本项目详情
   * @param id - 项目ID
   * @returns 项目基本信息 + 协作者列表
   * @throws NotFoundException 项目不存在
   */
  async getProjectDetail(id: string): Promise<ScriptProjectDetail> {
    const [project] = await this.db
      .select({
        id: scriptProject.id,
        title: scriptProject.title,
        type: scriptProject.type,
        description: scriptProject.description,
        coverUrl: scriptProject.coverUrl,
        collaborators: scriptProject.collaborators,
      })
      .from(scriptProject)
      .where(eq(scriptProject.id, id))
      .limit(1);

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    // 协作者ID数组转换为对象数组
    const collaboratorIds: string[] = project.collaborators || [];

    // 批量查询协作者信息
    const collaboratorIdList = collaboratorIds
      .map(id => `'${id.replace(/'/g, "''")}'::uuid`)
      .join(', ');
    const userRows = await this.db.execute<{ id: string; nickname: string }>(
      sql.raw(`SELECT id, nickname FROM local_users WHERE id IN (${collaboratorIdList})`),
    );
    const userMap = new Map(userRows.map((u) => [u.id, u.nickname]));

    const collaborators: ScriptCollaborator[] = collaboratorIds.map(
      (uid: string) => ({
        id: uid,
        name: userMap.get(uid) || uid,
        avatar_url: '',
      }),
    );

    return {
      id: project.id,
      title: project.title,
      type: project.type || '',
      description: project.description || '',
      cover_url: project.coverUrl || '',
      collaborators,
    };
  }

  /**
   * 获取最新版本的剧本内容
   * 同时计算字数、页数、场景数等统计信息
   * @param projectId - 项目ID
   * @returns 最新内容 + 版本号 + 统计数据
   */
  async getLatestContent(projectId: string): Promise<ScriptContentLatest> {
    // 按创建时间倒序取第一条，即最新版本
    const [content] = await this.db
      .select({
        id: scriptContent.id,
        content: scriptContent.content,
        version: scriptContent.version,
      })
      .from(scriptContent)
      .where(eq(scriptContent.projectId, projectId))
      .orderBy(desc(scriptContent.createdAt))
      .limit(1);

    // 没有内容时返回默认空值
    if (!content) {
      return {
        id: '',
        content: '',
        version: 'v0',
        word_count: 0,
        page_count: 0,
        scene_count: 0,
      };
    }

    // 统计计算
    const text = content.content || '';
    // 字数：去掉所有空白字符后的长度
    const wordCount = text.replace(/\s+/g, '').length;
    // 页数：按每页250字估算
    const pageCount = Math.ceil(wordCount / 250);
    // 场景数：匹配 "数字. 标题" 格式的行数（如 "1. 开场"）
    const sceneCount = (text.match(/^\d+\.\s+.+$/gm) || []).length;

    return {
      id: content.id,
      content: text,
      version: content.version,
      word_count: wordCount,
      page_count: pageCount,
      scene_count: sceneCount,
    };
  }

  /**
   * 保存剧本内容（自动生成新版本）
   * 每次保存都创建一个新版本记录，不覆盖旧版本，实现版本历史
   * @param projectId - 项目ID
   * @param dto - 内容 + 版本摘要
   * @returns 新版本号
   */
  async saveContent(
    projectId: string,
    dto: SaveScriptContentRequest,
  ): Promise<SaveScriptContentResponse> {
    // 查询最新版本号
    const latest = await this.db
      .select({ version: scriptContent.version })
      .from(scriptContent)
      .where(eq(scriptContent.projectId, projectId))
      .orderBy(desc(scriptContent.createdAt))
      .limit(1);

    // 版本号递增：v1 → v2 → v3 ...
    const currentVer = latest.length > 0
      ? parseInt(latest[0].version.replace('v', ''), 10)
      : 0;
    const newVersion = `v${currentVer + 1}`;

    // 插入新版本记录（INSERT而非UPDATE，保留历史）
    await this.db.insert(scriptContent).values({
      projectId,
      content: dto.content,
      version: newVersion,
      snapshotSummary: dto.snapshot_summary || null,
    });

    this.logger.log(
      `Saved content for project ${projectId}, version ${newVersion}`,
    );
    return { version: newVersion };
  }

  /**
   * 获取指定版本的内容
   * @param projectId - 项目ID
   * @param versionId - 内容版本记录ID
   * @returns 该版本的内容文本
   */
  async getContentByVersion(
    projectId: string,
    versionId: string,
  ): Promise<{ content: string }> {
    const [content] = await this.db
      .select({ content: scriptContent.content })
      .from(scriptContent)
      .where(
        and(
          eq(scriptContent.projectId, projectId),
          eq(scriptContent.id, versionId),
        ),
      )
      .limit(1);

    if (!content) {
      return { content: '' };
    }

    return { content: content.content };
  }

  /**
   * 获取剧本大纲
   * 从内容中自动提取场景标题（"数字. 标题"格式）
   * @param projectId - 项目ID
   * @returns 大纲条目列表（序号 + 场景标题 + 位置偏移）
   */
  async getOutline(projectId: string): Promise<ScriptOutlineResponse> {
    // 获取最新内容
    const [content] = await this.db
      .select({ content: scriptContent.content })
      .from(scriptContent)
      .where(eq(scriptContent.projectId, projectId))
      .orderBy(desc(scriptContent.createdAt))
      .limit(1);

    if (!content || !content.content) {
      return { items: [] };
    }

    // 逐行解析，提取场景标题
    const lines = content.content.split('\n');
    const items: ScriptOutlineItem[] = [];
    let position = 0; // 字符位置偏移，用于编辑器跳转定位

    lines.forEach((line: string, idx: number) => {
      // 匹配格式：数字. 场景标题 （如 "1. 开场 日外"）
      const match = line.match(/^(\d+)\.\s+(.+)$/);
      if (match) {
        items.push({
          index: parseInt(match[1], 10),
          scene_header: match[2].trim(),
          duration: 0,
          position,
        });
      }
      // 累加位置偏移（+1是换行符）
      position += line.length + 1;
    });

    return { items };
  }

  /**
   * 获取剧本评论列表
   * 剧本评论是定位到具体字符位置的批注式评论
   * @param projectId - 项目ID
   * @returns 评论列表（按位置排序）
   */
  async getComments(projectId: string): Promise<ScriptCommentListResponse> {
    const comments = await this.db
      .select({
        id: scriptComment.id,
        position: scriptComment.position,
        comment: scriptComment.comment,
        author: scriptComment.author,
        status: scriptComment.status,
        createdAt: scriptComment.createdAt,
      })
      .from(scriptComment)
      .where(eq(scriptComment.projectId, projectId))
      .orderBy(scriptComment.position); // 按在文本中的位置排序

    // 字段名转换
    // 查询作者显示名称
    const commentAuthorIds = comments
      .map((c) => c.author)
      .filter((id) => !!id);
    const commentAuthorNames: Map<string, string> = new Map();
    if (commentAuthorIds.length > 0) {
      const commentAuthorIdList = commentAuthorIds
        .map(id => `'${id.replace(/'/g, "''")}'::uuid`)
        .join(', ');
      const userRows = await this.db.execute<{ id: string; nickname: string }>(
        sql.raw(`SELECT id, nickname FROM local_users WHERE id IN (${commentAuthorIdList})`),
      );
      userRows.forEach((u) => commentAuthorNames.set(u.id, u.nickname));
    }

    const items: ScriptCommentItem[] = comments.map((c) => ({
      id: c.id,
      position: c.position,
      comment: c.comment,
      author_name: c.author ? (commentAuthorNames.get(c.author) || c.author) : '',
      author_avatar: '',
      status: c.status,
      created_at: c.createdAt instanceof Date
        ? c.createdAt.toISOString()
        : String(c.createdAt),
    }));

    return { items };
  }

  /**
   * 创建剧本评论（批注）
   * @param projectId - 项目ID
   * @param dto - 评论内容 + 字符位置
   * @param userId - 评论者ID
   * @returns 新评论ID
   */
  async createComment(
    projectId: string,
    dto: CreateScriptCommentRequest,
    userId: string,
  ): Promise<CreateScriptCommentResponse> {
    const [comment] = await this.db
      .insert(scriptComment)
      .values({
        projectId,
        position: dto.position,
        comment: dto.comment,
        author: userId,
        status: 'open', // 初始状态：未解决
      })
      .returning({ id: scriptComment.id });

    this.logger.log(
      `Created comment ${comment.id} on project ${projectId}`,
    );
    return { id: comment.id };
  }

  /**
   * 获取版本历史列表
   * @param projectId - 项目ID
   * @param page - 页码
   * @param pageSize - 每页数量
   * @returns 版本列表 + 总数
   */
  async getVersions(
    projectId: string,
    page: number,
    pageSize: number,
  ): Promise<ScriptVersionListResponse> {
    const versions = await this.db
      .select({
        id: scriptContent.id,
        version: scriptContent.version,
        snapshotSummary: scriptContent.snapshotSummary,
        createdBy: scriptContent.createdBy,
        createdAt: scriptContent.createdAt,
      })
      .from(scriptContent)
      .where(eq(scriptContent.projectId, projectId))
      .orderBy(desc(scriptContent.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // 统计总版本数
    const totalResult = await this.db
      .select({ count: count() })
      .from(scriptContent)
      .where(eq(scriptContent.projectId, projectId));

    const total = Number(totalResult[0].count);

    // 字段名转换
    // 批量查询作者显示名称
    const authorIds = versions
      .map((v) => v.createdBy)
      .filter((id) => !!id);
    const authorNames: Map<string, string> = new Map();
    if (authorIds.length > 0) {
      const authorIdList = authorIds
        .map(id => `'${id.replace(/'/g, "''")}'::uuid`)
        .join(', ');
      const userRows = await this.db.execute<{ id: string; nickname: string }>(
        sql.raw(`SELECT id, nickname FROM local_users WHERE id IN (${authorIdList})`),
      );
      userRows.forEach((u) => authorNames.set(u.id, u.nickname));
    }

    const items: ScriptVersionItem[] = versions.map((v) => ({
      id: v.id,
      version: v.version,
      snapshot_summary: v.snapshotSummary || '',
      author_name: v.createdBy ? (authorNames.get(v.createdBy) || v.createdBy) : '',
      created_at: v.createdAt instanceof Date
        ? v.createdAt.toISOString()
        : String(v.createdAt),
    }));

    return { items, total };
  }

  /**
   * 回退到指定历史版本
   * 不删除现有版本，而是将目标版本的内容复制为一个新版本
   * @param projectId - 项目ID
   * @param versionId - 要回退的版本ID
   * @returns 新生成的版本号
   * @throws NotFoundException 版本不存在
   */
  async revertVersion(
    projectId: string,
    versionId: string,
  ): Promise<RevertVersionResponse> {
    // 查询目标版本的内容
    const [target] = await this.db
      .select({
        content: scriptContent.content,
        version: scriptContent.version,
      })
      .from(scriptContent)
      .where(eq(scriptContent.id, versionId))
      .limit(1);

    if (!target) {
      throw new NotFoundException(`Version ${versionId} not found`);
    }

    // 获取当前最新版本号
    const latest = await this.db
      .select({ version: scriptContent.version })
      .from(scriptContent)
      .where(eq(scriptContent.projectId, projectId))
      .orderBy(desc(scriptContent.createdAt))
      .limit(1);

    const currentVer = latest.length > 0
      ? parseInt(latest[0].version.replace('v', ''), 10)
      : 0;
    const newVersion = `v${currentVer + 1}`;

    // 以旧内容创建新版本（保留版本历史的完整性）
    await this.db.insert(scriptContent).values({
      projectId,
      content: target.content,
      version: newVersion,
      snapshotSummary: `回退至版本 ${target.version}`,
    });

    this.logger.log(
      `Reverted project ${projectId} to version ${target.version}, new: ${newVersion}`,
    );
    return { new_version: newVersion };
  }

  /**
   * 角色分析
   * 从剧本内容中自动识别角色名，统计每个角色的场景数和台词量
   * 识别规则：全大写英文字母的独立行（标准剧本格式）
   * @param projectId - 项目ID
   * @returns 角色统计列表（按台词量排序）
   */
  async getRoleAnalysis(projectId: string): Promise<RoleAnalysisResponse> {
    // 获取最新内容
    const [content] = await this.db
      .select({ content: scriptContent.content })
      .from(scriptContent)
      .where(eq(scriptContent.projectId, projectId))
      .orderBy(desc(scriptContent.createdAt))
      .limit(1);

    if (!content || !content.content) {
      return { items: [] };
    }

    const lines = content.content.split('\n');
    // Map: 角色名 → {场景数, 台词行数}
    const roleStats = new Map<
      string,
      { sceneCount: number; lineCount: number }
    >();
    let totalLines = 0;

    // 逐行扫描识别角色
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // 角色名判断：3-40字符、全大写字母和空格、不以数字开头、排除场景标记关键字
      if (
        line.length >= 3 &&
        line.length <= 40 &&
        /^[A-Z\s]+$/.test(line) &&
        !/^\d/.test(line) &&
        line !== 'INT' &&       // 内景
        line !== 'EXT' &&       // 外景
        line !== 'INT/EXT' &&   // 内外景
        line !== 'DAY' &&       // 日
        line !== 'NIGHT'        // 夜
      ) {
        const role = line;
        // 初始化角色统计
        if (!roleStats.has(role)) {
          roleStats.set(role, { sceneCount: 0, lineCount: 0 });
        }
        const stats = roleStats.get(role)!;
        stats.sceneCount += 1; // 出场次数+1

        // 统计该角色后面的台词行数（直到下一个角色名或空行）
        let j = i + 1;
        while (j < lines.length && lines[j].trim() !== '') {
          const dialogueLine = lines[j].trim();
          // 遇到下一个角色名就停止
          if (
            dialogueLine.length >= 3 &&
            dialogueLine.length <= 40 &&
            /^[A-Z\s]+$/.test(dialogueLine) &&
            !/^\d/.test(dialogueLine)
          ) {
            break;
          }
          stats.lineCount += 1;
          totalLines += 1;
          j++;
        }
      }
    }

    // 转换为数组并按台词量降序排序
    const items: RoleAnalysisItem[] = Array.from(roleStats.entries())
      .map(([roleName, stats]) => ({
        role_name: roleName,
        scene_count: stats.sceneCount,
        line_count: stats.lineCount,
        line_ratio:
          totalLines > 0
            ? Math.round((stats.lineCount / totalLines) * 10000) / 100
            : 0, // 百分比，保留两位小数
      }))
      .sort((a, b) => b.line_count - a.line_count);

    return { items };
  }

  /**
   * 邀请协作者
   * 将用户添加到项目的协作者数组中（去重）
   * @param projectId - 项目ID
   * @param userId - 要邀请的用户ID
   * @returns 成功状态
   * @throws NotFoundException 项目不存在
   */
  async inviteCollaborator(
    projectId: string,
    userId: string,
  ): Promise<InviteCollaboratorResponse> {
    // 查询当前协作者列表
    const [project] = await this.db
      .select({ collaborators: scriptProject.collaborators })
      .from(scriptProject)
      .where(eq(scriptProject.id, projectId))
      .limit(1);

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    // 已存在则不重复添加
    const currentCollaborators: string[] = project.collaborators || [];
    if (!currentCollaborators.includes(userId)) {
      const newCollaborators = [...currentCollaborators, userId];
      await this.db
        .update(scriptProject)
        .set({ collaborators: newCollaborators })
        .where(eq(scriptProject.id, projectId));
    }

    this.logger.log(
      `Invited collaborator ${userId} to project ${projectId}`,
    );
    return { success: true };
  }

  /**
   * 导出剧本（生成下载链接）
   * 支持多种格式：pdf/word/fountain/txt/storyboard/call-sheet
   * @param projectId - 项目ID
   * @param dto - 导出格式
   * @returns 下载URL + 文件名
   */
  async exportScript(
    projectId: string,
    dto: ExportScriptRequest,
  ): Promise<ExportScriptResponse> {
    // 查询项目标题用于文件名
    const [project] = await this.db
      .select({ title: scriptProject.title })
      .from(scriptProject)
      .where(eq(scriptProject.id, projectId))
      .limit(1);

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    // 各格式对应的文件扩展名
    const extMap: Record<string, string> = {
      pdf: '.pdf',
      word: '.docx',
      fountain: '.fountain',
      txt: '.txt',
      storyboard: '.pdf',
      'call-sheet': '.pdf',
    };

    const ext = extMap[dto.format] || '.pdf';
    const filename = `${project.title}_${dto.format}${ext}`;
    // 下载接口地址（由download接口处理实际文件生成）
    const downloadUrl = `/api/script-projects/${projectId}/download?format=${dto.format}`;

    this.logger.log(`Export script ${projectId} as ${dto.format}`);
    return { download_url: downloadUrl, filename };
  }

  /**
   * 下载剧本文件
   * 目前txt格式为真实内容，其他格式为占位实现（返回纯文本内容）
   * @param projectId - 项目ID
   * @param format - 导出格式
   * @returns 文件内容 + MIME类型 + 文件名
   */
  async downloadScript(
    projectId: string,
    format: string,
  ): Promise<{ content: string; contentType: string; filename: string }> {
    const [project] = await this.db
      .select({ title: scriptProject.title })
      .from(scriptProject)
      .where(eq(scriptProject.id, projectId))
      .limit(1);

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    // 获取最新剧本内容
    const [content] = await this.db
      .select({ content: scriptContent.content })
      .from(scriptContent)
      .where(eq(scriptContent.projectId, projectId))
      .orderBy(desc(scriptContent.createdAt))
      .limit(1);

    const text = content?.content || '';

    // TXT格式直接返回
    if (format === 'txt') {
      const filename = `${project.title}.txt`;
      this.logger.log(`Download script ${projectId} as TXT`);
      return { content: text, contentType: 'text/plain; charset=utf-8', filename };
    }

    // 其他格式目前为占位实现，后续可接入专业的格式转换库
    const extMap: Record<string, string> = {
      pdf: '.pdf',
      word: '.docx',
      fountain: '.fountain',
    };
    const ext = extMap[format] || '.txt';
    const filename = `${project.title}${ext}`;
    // 各格式对应的Content-Type
    const contentTypeMap: Record<string, string> = {
      pdf: 'application/pdf',
      word: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fountain: 'text/plain; charset=utf-8',
    };

    return {
      content: text,
      contentType: contentTypeMap[format] || 'application/octet-stream',
      filename,
    };
  }

  // ========================================
  // 剧本点赞相关方法
  // ========================================

  /**
   * 切换剧本点赞状态（点赞/取消点赞）
   * @param projectId - 项目ID
   * @param userId - 用户ID
   * @returns 当前点赞状态 + 点赞总数
   */
  async toggleScriptLike(
    projectId: string,
    userId: string,
  ): Promise<ScriptLikeStatusResponse> {
    // 查询是否已点赞
    const existing = await this.db.execute<{ id: string }>(sql`
      SELECT id FROM script_like
      WHERE project_id = ${projectId}::uuid
        AND (user_id).user_id = ${userId}
    `);

    if (existing.length > 0) {
      // 取消点赞
      await this.db.execute(sql`
        DELETE FROM script_like
        WHERE project_id = ${projectId}::uuid
          AND (user_id).user_id = ${userId}
      `);
    } else {
      // 添加点赞
      await this.db.execute(sql`
        INSERT INTO script_like (project_id, user_id)
        VALUES (${projectId}::uuid, ROW(${userId})::user_profile)
      `);
    }

    // 统计点赞总数
    const countRows = await this.db.execute<{ count: string }>(sql`
      SELECT COUNT(*)::text AS count FROM script_like
      WHERE project_id = ${projectId}::uuid
    `);
    const likeCount: number = parseInt(countRows[0].count, 10);

    return { liked: existing.length === 0, like_count: likeCount };
  }

  /**
   * 获取剧本点赞状态
   * @param projectId - 项目ID
   * @param userId - 当前用户ID（可选）
   * @returns 点赞状态 + 总数
   */
  async getScriptLikeStatus(
    projectId: string,
    userId?: string,
  ): Promise<ScriptLikeStatusResponse> {
    // 查询总数
    const countRows = await this.db.execute<{ count: string }>(sql`
      SELECT COUNT(*)::text AS count FROM script_like
      WHERE project_id = ${projectId}::uuid
    `);
    const likeCount: number = parseInt(countRows[0].count, 10);

    // 已登录则查询是否点过赞
    let liked = false;
    if (userId) {
      const likeRows = await this.db.execute<{ id: string }>(sql`
        SELECT id FROM script_like
        WHERE project_id = ${projectId}::uuid
          AND (user_id).user_id = ${userId}
      `);
      liked = likeRows.length > 0;
    }

    return { liked, like_count: likeCount };
  }
}
