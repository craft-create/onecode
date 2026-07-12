/**
 * 剧本模块控制器
 * 功能：定义剧本项目相关的HTTP接口路由
 * 基础路径：/api/script-projects
 *
 * 接口清单：
 * GET    /                      项目列表
 * GET    /search                搜索项目
 * POST   /                      创建项目（需登录）
 * GET    /:id                   项目详情
 * GET    /:id/content/latest    最新内容
 * POST   /:id/content           保存内容（生成新版本，需登录）
 * GET    /:id/outline           剧本大纲
 * GET    /:id/comments          评论列表
 * POST   /:id/comments          发表评论（需登录）
 * GET    /:id/versions          版本历史
 * POST   /:id/versions/revert   回退版本（需登录）
 * GET    /:id/analysis/roles    角色分析
 * POST   /:id/collaborators     邀请协作者（需登录）
 * POST   /:id/export            导出剧本（需登录）
 * GET    /:id/download          下载剧本
 * POST   /:id/like              切换点赞（需登录）
 * GET    /:id/like/status       点赞状态
 * DELETE /:id                   删除项目（需登录+作者校验）
 */
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Req,
  Res,
  ParseIntPipe,
  DefaultValuePipe,
  UnauthorizedException,
} from '@nestjs/common';
// 平台登录鉴权装饰器
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import type { Request, Response } from 'express';
import { ScriptService } from './script.service';
import { getLocalUserId } from '@server/common/utils/auth.helper';
// 导入类型定义
import type {
  CreateScriptProjectRequest,
  SaveScriptContentRequest,
  CreateScriptCommentRequest,
  RevertVersionRequest,
  InviteCollaboratorRequest,
  ExportScriptRequest,
  ScriptLikeStatusResponse,
} from '@shared/script.interface';

@Controller('api/script-projects')
export class ScriptController {
  /**
   * 构造函数：注入剧本服务
   */
  constructor(private readonly scriptService: ScriptService) {}

  /**
   * GET /api/script-projects - 获取剧本项目列表
   * @param sort - 排序方式，默认按更新时间倒序
   * @param page - 页码，默认1
   * @param pageSize - 每页数量，默认12
   * @param creatorId - 可选，筛选特定创建者的项目
   * @param req - 请求对象
   */
  @Get()
  async listProjects(
    @Query('sort', new DefaultValuePipe('updated')) sort: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(12), ParseIntPipe) pageSize: number,
    @Req() req: Request,
    @Query('creatorId') creatorId?: string,
  ) {
    const userId: string | undefined = getLocalUserId(req);
    return this.scriptService.listProjects(
      userId || '',
      sort,
      page,
      pageSize,
      creatorId,
    );
  }

  /**
   * GET /api/script-projects/my - 获取当前用户创建的剧本列表
   * 需要登录
   * @param sort - 排序方式
   * @param page - 页码
   * @param pageSize - 每页数量
   * @param req - 请求对象
   */
  @NeedLogin()
  @Get('my')
  async listMyProjects(
    @Query('sort', new DefaultValuePipe('updated')) sort: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(12), ParseIntPipe) pageSize: number,
    @Req() req: Request,
  ) {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.scriptService.listMyProjects(userId, sort, page, pageSize);
  }

  /**
   * GET /api/script-projects/search - 搜索剧本项目
   * 按标题和描述模糊搜索
   * @param keyword - 搜索关键词
   * @param page - 页码
   * @param pageSize - 每页数量
   */
  @Get('search')
  async searchProjects(
    @Query('keyword', new DefaultValuePipe('')) keyword: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(12), ParseIntPipe) pageSize: number,
  ) {
    return this.scriptService.searchProjects(keyword, page, pageSize);
  }

  /**
   * POST /api/script-projects - 创建新剧本项目
   * 需要登录，自动创建v1初始版本
   * @param dto - 项目表单数据
   */
  @NeedLogin()
  @Post()
  async createProject(@Body() dto: CreateScriptProjectRequest, @Req() req: Request) {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.scriptService.createProject(dto, userId);
  }

  /**
   * GET /api/script-projects/:id - 获取项目详情
   * @param id - 项目ID
   */
  @Get(':id')
  async getProjectDetail(@Param('id') id: string) {
    return this.scriptService.getProjectDetail(id);
  }

  /**
   * GET /api/script-projects/:id/content/latest - 获取最新剧本内容
   * 返回内容文本 + 版本号 + 字数/页数/场景数统计
   * @param id - 项目ID
   */
  @Get(':id/content/latest')
  async getLatestContent(@Param('id') id: string) {
    return this.scriptService.getLatestContent(id);
  }

  /**
   * GET /api/script-projects/:id/content/:versionId - 获取指定版本的内容
   * 用于版本历史预览
   * @param id - 项目ID
   * @param versionId - 内容版本记录ID
   */
  @Get(':id/content/:versionId')
  async getContentByVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.scriptService.getContentByVersion(id, versionId);
  }

  /**
   * POST /api/script-projects/:id/content - 保存剧本内容
   * 每次保存自动生成新版本，不覆盖历史
   * 需要登录
   * @param id - 项目ID
   * @param dto - 内容 + 版本摘要
   */
  @NeedLogin()
  @Post(':id/content')
  async saveContent(
    @Param('id') id: string,
    @Body() dto: SaveScriptContentRequest,
  ) {
    return this.scriptService.saveContent(id, dto);
  }

  /**
   * GET /api/script-projects/:id/outline - 获取剧本大纲
   * 自动从内容中提取场景标题生成大纲
   * @param id - 项目ID
   */
  @Get(':id/outline')
  async getOutline(@Param('id') id: string) {
    return this.scriptService.getOutline(id);
  }

  /**
   * GET /api/script-projects/:id/comments - 获取剧本评论（批注）
   * 剧本评论是定位到具体字符位置的批注
   * @param id - 项目ID
   */
  @Get(':id/comments')
  async getComments(@Param('id') id: string) {
    return this.scriptService.getComments(id);
  }

  /**
   * POST /api/script-projects/:id/comments - 添加评论（批注）
   * 需要登录
   * @param id - 项目ID
   * @param dto - 评论内容 + 位置
   * @param req - 请求对象
   */
  @NeedLogin()
  @Post(':id/comments')
  async createComment(
    @Param('id') id: string,
    @Body() dto: CreateScriptCommentRequest,
    @Req() req: Request,
  ) {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.scriptService.createComment(id, dto, userId);
  }

  /**
   * GET /api/script-projects/:id/versions - 版本历史列表
   * @param id - 项目ID
   * @param page - 页码
   * @param pageSize - 每页数量
   */
  @Get(':id/versions')
  async getVersions(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.scriptService.getVersions(id, page, pageSize);
  }

  /**
   * POST /api/script-projects/:id/versions/revert - 回退到指定版本
   * 不会删除历史，而是复制旧内容生成新版本
   * 需要登录
   * @param id - 项目ID
   * @param dto - 要回退的版本ID
   */
  @NeedLogin()
  @Post(':id/versions/revert')
  async revertVersion(
    @Param('id') id: string,
    @Body() dto: RevertVersionRequest,
  ) {
    return this.scriptService.revertVersion(id, dto.version_id);
  }

  /**
   * GET /api/script-projects/:id/analysis/roles - 角色分析
   * 自动识别剧本中的角色，统计出场次数和台词量
   * @param id - 项目ID
   */
  @Get(':id/analysis/roles')
  async getRoleAnalysis(@Param('id') id: string) {
    return this.scriptService.getRoleAnalysis(id);
  }

  /**
   * POST /api/script-projects/:id/collaborators - 邀请协作者
   * 需要登录
   * @param id - 项目ID
   * @param dto - 被邀请用户ID
   */
  @NeedLogin()
  @Post(':id/collaborators')
  async inviteCollaborator(
    @Param('id') id: string,
    @Body() dto: InviteCollaboratorRequest,
  ) {
    return this.scriptService.inviteCollaborator(id, dto.user_id);
  }

  /**
   * POST /api/script-projects/:id/export - 导出剧本
   * 返回下载链接，支持多种格式
   * 需要登录
   * @param id - 项目ID
   * @param dto - 导出格式
   */
  @NeedLogin()
  @Post(':id/export')
  async exportScript(
    @Param('id') id: string,
    @Body() dto: ExportScriptRequest,
  ) {
    return this.scriptService.exportScript(id, dto);
  }

  /**
   * GET /api/script-projects/:id/download - 下载剧本文件
   * 直接返回文件流，浏览器触发下载
   * @param id - 项目ID
   * @param format - 文件格式
   * @param res - Express响应对象，用于设置下载头
   */
  @Get(':id/download')
  async downloadScript(
    @Param('id') id: string,
    @Query('format') format: string,
    @Res() res: Response,
  ) {
    const result = await this.scriptService.downloadScript(id, format);
    // 设置响应头，触发浏览器下载
    res.set({
      'Content-Type': result.contentType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(result.filename)}"`,
    });
    res.send(result.content);
  }

  // ========================================
  // 点赞相关接口
  // ========================================

  /**
   * POST /api/script-projects/:id/like - 切换剧本点赞
   * 需要登录
   * @param id - 项目ID
   * @param req - 请求对象
   */
  @NeedLogin()
  @Post(':id/like')
  async toggleLike(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<ScriptLikeStatusResponse> {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.scriptService.toggleScriptLike(id, userId);
  }

  /**
   * GET /api/script-projects/:id/like/status - 查询点赞状态
   * 未登录只返回总数，已登录同时返回是否已点赞
   * @param id - 项目ID
   * @param req - 请求对象
   */
  @Get(':id/like/status')
  async getLikeStatus(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<ScriptLikeStatusResponse> {
    const userId: string | undefined = getLocalUserId(req);
    return this.scriptService.getScriptLikeStatus(id, userId);
  }

  /**
   * DELETE /api/script-projects/:id - 删除剧本项目
   * 需要登录 + 作者校验（只能删自己创建的）
   * 删除时自动级联清理内容版本、评论、点赞
   * @param id - 项目ID
   * @param req - 请求对象
   */
  @NeedLogin()
  @Delete(':id')
  async deleteProject(@Param('id') id: string, @Req() req: Request): Promise<void> {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.scriptService.deleteProject(id, userId);
  }
}
