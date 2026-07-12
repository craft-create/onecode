import { Injectable, Inject, Logger, ConflictException, UnauthorizedException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/compat/fullstack-nestjs-core';
import { eq, sql } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { localUsers } from '@server/database/local-schema';

const JWT_SECRET: string = process.env.JWT_SECRET ?? 'dev-secret-key';
const SALT_ROUNDS: number = 10;

interface JwtPayload {
  userId: string;
  nickname: string;
}

export interface UserInfo {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  createdAt: Date | null;
}

@Injectable()
export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async register(nickname: string, password: string): Promise<UserInfo> {
    try {
      const passwordHash: string = await bcrypt.hash(password, SALT_ROUNDS);

      const [user] = await this.db
        .insert(localUsers)
        .values({ nickname, passwordHash })
        .returning({
          id: localUsers.id,
          nickname: localUsers.nickname,
          avatarUrl: localUsers.avatarUrl,
          createdAt: localUsers.createdAt,
        });

      this.logger.log(`用户注册成功: ${nickname}`);
      return user;
    } catch (error) {
      this.logger.error(`用户注册失败: ${nickname}`, error);
      // PostgreSQL unique constraint violation
      // Error can be in error.message or error.cause.detail
      const errorMsg = error instanceof Error ? error.message : '';
      const causeDetail = (error as any)?.cause?.detail || '';
      const combinedError = `${errorMsg} ${causeDetail}`.toLowerCase();

      if (combinedError.includes('already exists') ||
          combinedError.includes('duplicate key') ||
          combinedError.includes('23505')) {
        throw new ConflictException('用户名已存在');
      }
      throw error;
    }
  }

  async login(nickname: string, password: string): Promise<{ token: string; user: UserInfo }> {
    const [user] = await this.db
      .select()
      .from(localUsers)
      .where(eq(localUsers.nickname, nickname))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const isPasswordValid: boolean = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('密码错误');
    }

    const payload: JwtPayload = { userId: user.id, nickname: user.nickname };
    const token: string = jwt.sign(payload, JWT_SECRET, { expiresIn: 7 * 24 * 60 * 60 });

    const userInfo: UserInfo = {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };

    this.logger.log(`用户登录成功: ${nickname}`);
    return { token, user: userInfo };
  }

  async validateToken(token: string): Promise<JwtPayload | null> {
    try {
      const decoded: JwtPayload = jwt.verify(token, JWT_SECRET) as JwtPayload;
      return { userId: decoded.userId, nickname: decoded.nickname };
    } catch {
      return null;
    }
  }

  async getUserById(userId: string): Promise<UserInfo | null> {
    const [user] = await this.db
      .select()
      .from(localUsers)
      .where(eq(localUsers.id, userId))
      .limit(1);

    if (!user) return null;

    return {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };
  }

  async updateAvatarUrl(userId: string, avatarUrl: string): Promise<string> {
    await this.db
      .update(localUsers)
      .set({ avatarUrl })
      .where(eq(localUsers.id, userId));
    return avatarUrl;
  }

  async isSuperUser(userId: string): Promise<boolean> {
    if (!userId) return false;
    const rows = await this.db.execute(
      sql`SELECT nickname FROM local_users WHERE id = ${userId}::uuid`
    );
    return rows[0]?.nickname === 'zrc';
  }
}
