import { HttpStatus } from '@nestjs/common';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { isIP } from 'node:net';
import type { NextFunction, Response } from 'express';
import type { Request } from 'express';
import { ResponseCode } from '@server/common/constants/api_response_code';

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

@Injectable()
export class ApiRateLimitMiddleware implements NestMiddleware {
  private readonly windows = new Map<string, RateLimitBucket>();

  private readonly windowMs = this.getPositiveInt(process.env.API_RATE_LIMIT_WINDOW_MS, 60_000);
  private readonly maxRequests = this.getPositiveInt(process.env.API_RATE_LIMIT_MAX_REQUESTS, 120);
  private readonly trustProxyHeaders = this.shouldTrustProxyHeaders(
    process.env.API_RATE_LIMIT_TRUST_PROXY_HEADERS,
  );
  private readonly defaultSkipPaths = ['/api/health', '/api/healthz', '/api/ping'];

  use(req: Request, res: Response, next: NextFunction): void {
    const requestPath = this.getRequestPath(req);

    if (!this.isApiPath(requestPath)) {
      next();
      return;
    }

    if (this.isSkippedPath(requestPath)) {
      next();
      return;
    }

    const now = Date.now();
    this.cleanupExpiredBuckets(now);
    const identifier = this.getIdentifier(req);
    const key = `${req.method}:${identifier}:${requestPath}`;
    const window = this.getOrCreateWindow(key, now);

    if (window.count > this.maxRequests) {
      const retryAfter = Math.max(1, Math.ceil((window.resetAt - now) / 1000));
      this.setRateLimitHeaders(
        res,
        this.maxRequests,
        Math.max(0, this.maxRequests - window.count + 1),
        window.resetAt,
      );
      res.setHeader('Retry-After', retryAfter);

      res.status(HttpStatus.TOO_MANY_REQUESTS).json({
        error: {
          code: ResponseCode.TOO_MANY_REQUESTS,
          message: '请求过于频繁，请稍后再试',
          details: `请在 ${retryAfter} 秒后重试`,
          timestamp: Date.now(),
        },
      });
      return;
    }

    this.setRateLimitHeaders(
      res,
      this.maxRequests,
      Math.max(0, this.maxRequests - window.count),
      window.resetAt,
    );
    next();
  }

  private getOrCreateWindow(key: string, now: number): RateLimitBucket {
    const existing = this.windows.get(key);
    if (!existing || existing.resetAt <= now) {
      const bucket: RateLimitBucket = {
        count: 1,
        resetAt: now + this.windowMs,
      };
      this.windows.set(key, bucket);
      return bucket;
    }

    existing.count += 1;
    return existing;
  }

  private cleanupExpiredBuckets(now: number): void {
    this.windows.forEach((window: RateLimitBucket, key: string): void => {
      if (window.resetAt <= now) {
        this.windows.delete(key);
      }
    });
  }

  private isSkippedPath(path: string): boolean {
    return this.defaultSkipPaths.includes(path);
  }

  private isApiPath(path: string): boolean {
    return path === '/api' || path.startsWith('/api/');
  }

  private getRequestPath(req: Request): string {
    const currentPath = req.path.startsWith('/api') ? req.path : req.originalUrl.split('?')[0];
    return currentPath;
  }

  private getPositiveInt(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }
    return Math.floor(parsed);
  }

  private getIdentifier(req: Request): string {
    const userId = req.__localUserId || req.userContext?.userId;
    if (typeof userId === 'string' && userId.length > 0) {
      return `user:${userId}`;
    }

    const directIp = this.extractIp(req.ip);
    if (directIp.length > 0) {
      return `ip:${directIp}`;
    }

    if (this.trustProxyHeaders) {
      const forwarded = req.headers['x-forwarded-for'];
      const forwardedIp = this.extractIpFromHeader(forwarded);
      if (forwardedIp.length > 0) {
        return `ip:${forwardedIp}`;
      }
    }

    const socketIp = this.extractIp(req.socket?.remoteAddress);
    if (socketIp.length > 0) {
      return `ip:${socketIp}`;
    }

    return 'ip:unknown';
  }

  private setRateLimitHeaders(
    res: Response,
    limit: number,
    remaining: number,
    resetAt: number,
  ): void {
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetAt / 1000));
  }

  private shouldTrustProxyHeaders(value: string | undefined): boolean {
    return value === '1' || value?.toLowerCase() === 'true';
  }

  private extractIpFromHeader(headerValue: string | string[] | undefined): string {
    if (typeof headerValue !== 'string') {
      return '';
    }

    const candidate = headerValue.split(',')[0]?.trim() || '';
    return this.extractIp(candidate);
  }

  private extractIp(value: string | undefined): string {
    if (!value) {
      return '';
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return '';
    }

    const normalized = trimmed.replace(/^::ffff:/, '');
    return isIP(normalized) ? normalized : '';
  }
}
