import { Controller, Post, Param, Req } from '@nestjs/common';
import { NeedLogin } from '@server/common/compat/fullstack-nestjs-core';
import type { Request } from 'express';
import { MaterialService } from './material.service';
import type { CommentLikeStatusResponse } from '@shared/material.interface';

@Controller('api/comments')
export class CommentController {
  constructor(private readonly materialService: MaterialService) {}

  @NeedLogin()
  @Post(':id/like')
  async toggleLike(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<CommentLikeStatusResponse> {
    const userId = req.userContext?.userId ?? '';
    return this.materialService.toggleCommentLike(id, userId);
  }
}
