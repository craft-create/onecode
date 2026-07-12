import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import type { Request } from 'express';
import { FavoriteService } from './favorite.service';
import { getLocalUserId } from '@server/common/utils/auth.helper';
import type {
  FavoriteFolderListResponse,
  CreateFavoriteFolderRequest,
  CreateFavoriteFolderResponse,
  UpdateFavoriteFolderRequest,
  FavoriteFolderContentResponse,
  AddFavoriteItemRequest,
  AddFavoriteItemResponse,
} from '@shared/material.interface';

@Controller('api/favorites')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @NeedLogin()
  @Get('folders')
  async listFolders(
    @Req() req: Request,
  ): Promise<FavoriteFolderListResponse> {
    const userId = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.favoriteService.listFolders(userId);
  }

  @NeedLogin()
  @Post('folders')
  async createFolder(
    @Body() dto: CreateFavoriteFolderRequest,
    @Req() req: Request,
  ): Promise<CreateFavoriteFolderResponse> {
    const userId = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.favoriteService.createFolder(userId, dto);
  }

  @NeedLogin()
  @Put('folders/:id')
  async renameFolder(
    @Param('id') id: string,
    @Body() dto: UpdateFavoriteFolderRequest,
    @Req() req: Request,
  ): Promise<void> {
    const userId = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.favoriteService.renameFolder(id, userId, dto);
  }

  @NeedLogin()
  @Delete('folders/:id')
  async deleteFolder(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<void> {
    const userId = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.favoriteService.deleteFolder(id, userId);
  }

  @NeedLogin()
  @Post('folders/:id/items')
  async addItem(
    @Param('id') id: string,
    @Body() dto: AddFavoriteItemRequest,
    @Req() req: Request,
  ): Promise<AddFavoriteItemResponse> {
    const userId = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.favoriteService.addItem(id, userId, dto);
  }

  @NeedLogin()
  @Delete('folders/:id/items/:itemId')
  async removeItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Req() req: Request,
  ): Promise<void> {
    const userId = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.favoriteService.removeItem(id, userId, itemId);
  }

  @NeedLogin()
  @Get('folders/:id/items')
  async listItems(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<FavoriteFolderContentResponse> {
    const userId = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.favoriteService.listItems(id, userId);
  }
}
