import { Controller, Get, Post, Param, Req, UnauthorizedException } from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import type { Request } from 'express';
import { FollowService } from './follow.service';
import { getLocalUserId } from '@server/common/utils/auth.helper';
import type {
  FollowStatusResponse,
  FollowListResponse,
} from '@shared/follow.interface';

@Controller('api/follow')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @NeedLogin()
  @Post(':userId')
  async toggleFollow(
    @Param('userId') targetUserId: string,
    @Req() req: Request,
  ): Promise<FollowStatusResponse> {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }
    return this.followService.toggleFollow(userId, targetUserId);
  }

  @Get(':userId/status')
  async getFollowStatus(
    @Param('userId') targetUserId: string,
    @Req() req: Request,
  ): Promise<FollowStatusResponse> {
    const userId: string | undefined = getLocalUserId(req);
    return this.followService.getFollowStatus(userId, targetUserId);
  }

  @Get(':userId/followers')
  async getFollowers(
    @Param('userId') targetUserId: string,
  ): Promise<FollowListResponse> {
    return this.followService.getFollowers(targetUserId);
  }

  @Get(':userId/following')
  async getFollowing(
    @Param('userId') targetUserId: string,
  ): Promise<FollowListResponse> {
    return this.followService.getFollowing(targetUserId);
  }
}
