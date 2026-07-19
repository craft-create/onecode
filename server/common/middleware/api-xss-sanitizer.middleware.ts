import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

type PlainObject = Record<string, unknown>;

@Injectable()
export class ApiXssSanitizerMiddleware implements NestMiddleware {
  private readonly dangerousFields = this.parseProtectedFields(
    process.env.API_XSS_PROTECT_FIELDS,
    ['url', 'callback', 'returnUrl', 'return_url', 'redirect', 'redirectUrl', 'next', 'html'],
  );

  private readonly dangerPattern = /<\s*script\b|javascript:\s*|on[a-z]+\s*=|<\s*iframe\b|<\s*object\b|<\s*embed\b/i;

  use(req: Request, _res: Response, next: NextFunction): void {
    const requestPath = this.getRequestPath(req);
    if (!this.shouldProtect(requestPath)) {
      next();
      return;
    }

    this.checkPayload(req.body);
    this.checkPayload(req.query);
    this.checkPayload(req.params);

    next();
  }

  private shouldProtect(path: string): boolean {
    return path === '/api' || path.startsWith('/api/');
  }

  private getRequestPath(req: Request): string {
    const currentPath = req.path.startsWith('/api') ? req.path : req.originalUrl.split('?')[0];
    return currentPath;
  }

  private checkPayload(payload: unknown): void {
    if (payload === undefined || payload === null) {
      return;
    }

    const suspiciousField = this.findSuspiciousField(payload, '', false);
    if (suspiciousField.length > 0) {
      throw new BadRequestException(`请求参数 ${suspiciousField} 包含不安全内容`);
    }
  }

  private findSuspiciousField(payload: unknown, prefix: string, inspectValue: boolean): string {
    if (typeof payload === 'string') {
      return inspectValue && this.isDangerous(payload) ? prefix : '';
    }

    if (Array.isArray(payload)) {
      for (let index = 0; index < payload.length; index++) {
        const value = payload[index];
        const nextPrefix = `${prefix}[${index}]`;
        const nested = this.findSuspiciousField(value, nextPrefix, inspectValue);
        if (nested.length > 0) {
          return nested;
        }
      }

      return '';
    }

    if (typeof payload !== 'object') {
      return '';
    }

    const records = payload as PlainObject;
    for (const [key, value] of Object.entries(records)) {
      const nextPrefix = prefix.length > 0 ? `${prefix}.${key}` : key;
      const isTargetField = this.shouldInspectField(key);
      const suspicious = this.findSuspiciousField(value, nextPrefix, inspectValue || isTargetField);
      if (suspicious.length > 0) {
        return suspicious;
      }
    }

    return '';
  }

  private shouldInspectField(fieldName: string): boolean {
    return this.dangerousFields.has(fieldName.toLowerCase());
  }

  private parseProtectedFields(rawValue: string | undefined, fallback: string[]): Set<string> {
    const fields = rawValue ? rawValue.split(',') : fallback;
    return new Set(fields.map((field: string): string => field.trim().toLowerCase()).filter(Boolean));
  }

  private isDangerous(value: string): boolean {
    const normalized = value.toLowerCase();
    return this.dangerPattern.test(normalized) || this.dangerPattern.test(this.safeDecode(normalized));
  }

  private safeDecode(value: string): string {
    try {
      return decodeURIComponent(value);
    } catch (_error) {
      return value;
    }
  }
}
