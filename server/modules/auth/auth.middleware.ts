import { Injectable, Inject, Logger, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { getAuthTokenFromRequest } from '@server/common/utils/auth.helper';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger: Logger = new Logger(AuthMiddleware.name);

  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      const token = getAuthTokenFromRequest(req);

      if (token) {
        const payload = await this.authService.validateToken(token);
        if (payload) {
          // Store in both req.userContext (for compatibility) and __localUserId (safe from platform overwrite)
          req.userContext = { ...req.userContext, userId: payload.userId, userName: payload.nickname };
          req.__localUserId = payload.userId;
        } else {
          req.userContext = { ...req.userContext, userId: '', userName: '' };
          req.__localUserId = '';
        }
      } else {
        req.userContext = { ...req.userContext, userId: '', userName: '' };
        req.__localUserId = '';
      }
    } catch (error) {
      this.logger.warn('Auth middleware 验证失败', error);
      req.userContext = { ...req.userContext, userId: '', userName: '' };
      req.__localUserId = '';
    }

    next();
  }
}
