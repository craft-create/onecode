import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

/**
 * JWT 认证 Guard
 * 使用 AuthMiddleware 进行认证
 */
@Injectable()
export class JwtAuthGuard {
  constructor(private readonly moduleRef: ModuleRef) {}

  async canActivate(context: any): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 检查是否有用户上下文
    const userContext = request.userContext;
    if (!userContext || !userContext.userId) {
      return false;
    }

    // 将用户信息添加到请求对象
    request.user = {
      userId: userContext.userId,
      nickname: userContext.userName,
    };

    return true;
  }
}
