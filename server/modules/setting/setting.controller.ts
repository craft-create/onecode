import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UnauthorizedException } from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { SettingService, UserProfileData, UserPasswordData } from './setting.service';
import { getLocalUserId } from '@server/common/utils/auth.helper';
import type { Request } from 'express';

@Controller('settings')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  // ========== User Setting CRUD ==========

  // ========== User Profile Management ==========

  @Get('profile')
  @NeedLogin()
  async getProfile(@Req() req: Request) {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.settingService.getUserProfile(userId);
  }

  @Patch('profile')
  @NeedLogin()
  async updateProfile(@Req() req: Request, @Body() data: UserProfileData) {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.settingService.updateProfile(userId, data);
  }

  @Post('password')
  @NeedLogin()
  async changePassword(@Req() req: Request, @Body() data: UserPasswordData) {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.settingService.changePassword(userId, data);
  }

  @Get('storage/stats')
  @NeedLogin()
  async getStorageStats(@Req() req: Request) {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.settingService.getStorageStats(userId);
  }

  @Get()
  @NeedLogin()
  findAll(@Req() req: Request) {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.settingService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.settingService.findOne(id);
  }

  @Post()
  @NeedLogin()
  create(@Body() data: any, @Req() req: Request) {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.settingService.create({ ...data, createdBy: userId });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.settingService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.settingService.delete(id);
  }
}
