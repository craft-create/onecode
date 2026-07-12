/**
 * 素材模块控制器
 * 功能：定义素材相关的HTTP接口路由，接收请求并调用Service层处理
 * 基础路径：/api/materials
 *
 * 接口清单：
 * GET    /                      素材列表（筛选+分页）
 * GET    /search                关键词搜索
 * GET    /filters               获取筛选条件
 * GET    /:id                   素材详情
 * GET    /:id/download          获取下载地址（+1下载数）
 * GET    /:id/related           相关素材推荐
 * POST   /                      创建素材（需登录）
 * DELETE /:id                   删除素材（需登录+作者校验）
 * GET    /:id/comments          评论列表
 * POST   /:id/comments          发表评论（需登录）
 * DELETE /:id/comments/:cid     删除评论（需登录+作者校验）
 * POST   /:id/like              切换点赞（需登录）
 * GET    /:id/like/status       点赞状态
 */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
// 平台内置的登录鉴权装饰器，标注的接口必须登录才能访问
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import type { Request } from 'express';
import { MaterialService } from './material.service';
import { getLocalUserId } from '@server/common/utils/auth.helper';
// 导入接口响应/请求的TypeScript类型定义
import type {
  MaterialListResponse,
  MaterialSearchResponse,
  MaterialFiltersResponse,
  MaterialDetail,
  MaterialDownloadResponse,
  MaterialRelatedResponse,
  CreateMaterialRequest,
  CreateMaterialResponse,
  MaterialCommentListResponse,
  CreateMaterialCommentRequest,
  CreateMaterialCommentResponse,
  MaterialLikeStatusResponse,
  UpdateMaterialRequest,
} from '@shared/material.interface';

@Controller('api/materials')
export class MaterialController {
  /**
   * 构造函数：注入素材服务
   */
  constructor(private readonly materialService: MaterialService) {}

  /**
   * GET /api/materials - 获取素材列表
   * 支持按类型、分辨率、时长、标签筛选，支持分页
   * @param type - 素材类型 video/audio/sound
   * @param resolution - 分辨率
   * @param durationMin - 最小时长（秒）
   * @param durationMax - 最大时长（秒）
   * @param tags - 标签，逗号分隔的字符串
   * @param page - 页码
   * @param pageSize - 每页数量
   */
  @Get()
  async list(
    @Query('type') type?: string,
    @Query('resolution') resolution?: string,
    @Query('durationMin') durationMin?: string,
    @Query('durationMax') durationMax?: string,
    @Query('tags') tags?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<MaterialListResponse> {
    // 将逗号分隔的标签字符串转为数组
    const parsedTags = tags ? tags.split(',').filter(Boolean) : undefined;
    return this.materialService.list({
      type,
      resolution,
      // 字符串参数转数字
      durationMin: durationMin ? parseInt(durationMin, 10) : undefined,
      durationMax: durationMax ? parseInt(durationMax, 10) : undefined,
      tags: parsedTags,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  /**
   * GET /api/materials/search - 素材关键词搜索
   * @param keyword - 搜索关键词
   * @param page - 页码
   * @param pageSize - 每页数量
   */
  @Get('search')
  async search(
    @Query('keyword') keyword: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<MaterialSearchResponse> {
    return this.materialService.search({
      keyword: keyword || '',
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  /**
   * GET /api/materials/filters - 获取所有筛选条件
   * 返回可用的分辨率列表、时长区间、标签列表
   * 用于前端筛选侧边栏的选项渲染
   */
  @Get('filters')
  async getFilters(): Promise<MaterialFiltersResponse> {
    return this.materialService.getFilters();
  }

  /**
   * GET /api/materials/:id - 获取素材详情
   * @param id - 素材ID（UUID）
   */
  @Get(':id')
  async getById(@Param('id') id: string): Promise<MaterialDetail> {
    return this.materialService.getById(id);
  }

  /**
   * GET /api/materials/:id/download - 获取下载地址
   * 副作用：调用一次下载数+1，同时记录下载历史
   * @param id - 素材ID
   */
  @Get(':id/download')
  async getDownloadUrl(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<MaterialDownloadResponse> {
    const userId: string | undefined = getLocalUserId(req);
    return this.materialService.getDownloadUrl(id, userId);
  }

  /**
   * GET /api/materials/:id/related - 相关素材推荐
   * 基于标签相似度匹配
   * @param id - 当前素材ID
   * @param page - 页码
   * @param pageSize - 推荐数量
   */
  @Get(':id/related')
  async getRelated(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<MaterialRelatedResponse> {
    return this.materialService.getRelated(
      id,
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
    );
  }

  /**
   * POST /api/materials - 创建新素材
   * 需要登录，创建者自动为当前登录用户（平台自动填充createdBy）
   * 同时在 user_material 表插入关联记录，标记素材归属
   * @param dto - 素材创建表单数据
   * @param req - Express请求对象，从中提取当前登录用户ID
   */
  @NeedLogin()
  @Post()
  async create(
    @Body() dto: CreateMaterialRequest,
    @Req() req: Request,
  ): Promise<CreateMaterialResponse> {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.materialService.create(dto, userId);
  }

  /**
   * DELETE /api/materials/:id - 删除素材
   * 需要登录 + 作者校验（只能删除自己上传的）
   * 删除时自动级联清理评论、点赞、收藏、用户关联等数据
   * @param id - 素材ID
   * @param req - Express请求对象，从中提取当前登录用户ID
   */
  @NeedLogin()
  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: Request): Promise<void> {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.materialService.delete(id, userId);
  }

  /**
   * PATCH /api/materials/:id - 更新素材（管理员可修改任意素材）
   */
  @NeedLogin()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMaterialRequest,
    @Req() req: Request,
  ): Promise<void> {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.materialService.update(id, userId, dto);
  }

  // ========================================
  // 评论相关接口
  // ========================================

  /**
   * GET /api/materials/:id/comments - 获取评论列表
   * 已登录用户会返回每条评论的点赞状态
   * @param id - 素材ID
   * @param req - 请求对象，可选获取当前用户ID
   */
  @Get(':id/comments')
  async getComments(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<MaterialCommentListResponse> {
    // 未登录时userId为undefined
    const userId: string | undefined = getLocalUserId(req);
    return this.materialService.getComments(id, userId);
  }

  /**
   * POST /api/materials/:id/comments - 发表评论
   * 需要登录，支持回复（传parent_id即为回复）
   * @param id - 素材ID
   * @param dto - 评论内容 + 父评论ID
   * @param req - 请求对象，提取当前用户ID
   */
  @NeedLogin()
  @Post(':id/comments')
  async createComment(
    @Param('id') id: string,
    @Body() dto: CreateMaterialCommentRequest,
    @Req() req: Request,
  ): Promise<CreateMaterialCommentResponse> {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.materialService.createComment(id, userId, dto);
  }

  /**
   * DELETE /api/materials/:id/comments/:commentId - 删除评论
   * 需要登录 + 作者校验（只能删自己的评论）
   * 删除父评论会同时删除其下的所有回复
   * @param id - 素材ID
   * @param commentId - 评论ID
   * @param req - 请求对象
   */
  @NeedLogin()
  @Delete(':id/comments/:commentId')
  async deleteComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Req() req: Request,
  ): Promise<void> {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.materialService.deleteComment(id, commentId, userId);
  }

  // ========================================
  // 点赞相关接口
  // ========================================

  /**
   * POST /api/materials/:id/like - 切换素材点赞状态
   * 点一下点赞，再点一下取消
   * 需要登录
   * @param id - 素材ID
   * @param req - 请求对象
   */
  @NeedLogin()
  @Post(':id/like')
  async toggleLike(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<MaterialLikeStatusResponse> {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.materialService.toggleMaterialLike(id, userId);
  }

  /**
   * GET /api/materials/:id/like/status - 查询点赞状态
   * 不需要登录，未登录只返回总数，已登录同时返回是否已点赞
   * @param id - 素材ID
   * @param req - 请求对象
   */
  @Get(':id/like/status')
  async getLikeStatus(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<MaterialLikeStatusResponse> {
    const userId: string | undefined = getLocalUserId(req);
    return this.materialService.getMaterialLikeStatus(id, userId);
  }
}
