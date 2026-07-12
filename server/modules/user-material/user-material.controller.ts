import { Controller, Get, Post, Query, Body, Req, Param, UnauthorizedException } from '@nestjs/common';
import { NeedLogin } from '@server/common/compat/fullstack-nestjs-core';
import { UserMaterialService } from './user-material.service';
import { getLocalUserId } from '@server/common/utils/auth.helper';
import type { Request } from 'express';
import type {
  UserMaterialListResponse,
  FavoriteMaterialListResponse,
  DownloadHistoryListResponse,
  FavoriteCategoryRequest,
  FavoriteCategoryResponse,
  FavoriteMaterialRequest,
  FavoriteMaterialResponse,
} from '@shared/material.interface';

@Controller('api/user')
export class UserMaterialController {
  constructor(
    private readonly userMaterialService: UserMaterialService,
  ) {}

  @NeedLogin()
  @Get('materials/upload')
  async getUploads(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<UserMaterialListResponse> {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.userMaterialService.getUploads(
      userId,
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
    );
  }

  @NeedLogin()
  @Get('users/:userId/materials/upload')
  async getUploadsByUserId(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<UserMaterialListResponse> {
    return this.userMaterialService.getUploadsByUserId(
      userId,
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
    );
  }

  @NeedLogin()
  @Get('materials/favorite')
  async getFavorites(
    @Req() req: Request,
    @Query('categoryId') categoryId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<FavoriteMaterialListResponse> {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.userMaterialService.getFavorites(
      userId,
      categoryId,
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
    );
  }

  @NeedLogin()
  @Get('materials/download')
  async getDownloads(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<DownloadHistoryListResponse> {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.userMaterialService.getDownloads(
      userId,
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
    );
  }

  @NeedLogin()
  @Get('favorite-categories')
  async getCategories(
    @Req() req: Request,
  ): Promise<{ id: string; name: string }[]> {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.userMaterialService.getCategories(userId);
  }

  @NeedLogin()
  @Post('materials/favorite')
  async toggleFavorite(
    @Req() req: Request,
    @Body() dto: FavoriteMaterialRequest,
  ): Promise<FavoriteMaterialResponse> {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.userMaterialService.toggleFavorite(userId, dto);
  }

  @NeedLogin()
  @Post('favorite-categories')
  async manageCategory(
    @Req() req: Request,
    @Body() dto: FavoriteCategoryRequest,
  ): Promise<FavoriteCategoryResponse> {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.userMaterialService.manageCategory(userId, dto);
  }
}
