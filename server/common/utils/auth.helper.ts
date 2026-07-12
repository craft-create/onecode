/**
 * 本地认证辅助工具
 * 提供从请求对象中安全提取本地认证用户ID的方法
 * 
 * 背景：平台中间件可能会覆盖 req.userContext，导致 userId 丢失。
 * 本工具从 AuthMiddleware 设置的备用属性 __localUserId 中读取，
 * 确保在本地认证模式下能正确获取用户ID。
 */
import type { Request } from 'express';

/**
 * 从请求对象中安全地获取本地认证的用户ID
 * 优先从 __localUserId 读取（不受平台中间件影响），
 * 回退到 req.userContext.userId
 * @param req - Express请求对象
 * @returns 用户ID字符串，未登录或无效时返回 undefined
 */
export function getLocalUserId(req: Request): string | undefined {
  const localId: string = (req as any).__localUserId;
  if (localId) {
    return localId;
  }
  // Fallback to userContext if __localUserId is not set
  const contextId: string | undefined = req.userContext?.userId;
  return contextId || undefined;
}
