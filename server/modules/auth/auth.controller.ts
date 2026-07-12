import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from './auth.service';
import { getLocalUserId } from '@server/common/utils/auth.helper';

interface AuthDto {
  nickname: string;
  password: string;
}

const AVATAR_ALLOWED_MIMES: string[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const AVATAR_MAX_SIZE: number = 5 * 1024 * 1024; // 5MB
const AVATAR_DIR: string = path.resolve(process.cwd(), 'output/uploads/avatars');

@Controller('api/auth')
export class AuthController {
  private readonly logger: Logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: AuthDto) {
    const { nickname, password } = body;
    return this.authService.register(nickname, password);
  }

  @Post('login')
  async login(@Body() body: AuthDto, @Res({ passthrough: true }) res: Response) {
    const { nickname, password } = body;
    const { token, user } = await this.authService.login(nickname, password);

    res.cookie('auth_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { user };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('auth_token');
    return { message: '已退出登录' };
  }

  @Get('me')
  async me(@Req() req: Request) {
    const token: string | undefined = req.cookies?.auth_token;
    if (!token) {
      return null;
    }

    const payload = await this.authService.validateToken(token);
    if (!payload) {
      return null;
    }

    const user = await this.authService.getUserById(payload.userId);
    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
    };
  }

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: AVATAR_MAX_SIZE },
      fileFilter: (_req: unknown, file: Express.Multer.File, callback: any) => {
        if (AVATAR_ALLOWED_MIMES.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new BadRequestException(`不支持的文件类型: ${file.mimetype}`), false);
        }
      },
    }),
  )
  async uploadAvatar(@Req() req: Request, @UploadedFile() file: Express.Multer.File) {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new UnauthorizedException('请先登录');
    }

    if (!file) {
      throw new BadRequestException('未提供文件');
    }

    // Ensure avatar directory exists
    if (!fs.existsSync(AVATAR_DIR)) {
      fs.mkdirSync(AVATAR_DIR, { recursive: true });
    }

    // Generate unique filename
    const ext: string = path.extname(file.originalname);
    const uniqueName: string = `${uuidv4()}${ext}`;
    const filePath: string = path.join(AVATAR_DIR, uniqueName);

    fs.writeFileSync(filePath, file.buffer);
    this.logger.log(`头像已保存: ${filePath}`);

    const avatarUrl: string = `/uploads/avatars/${uniqueName}`;
    await this.authService.updateAvatarUrl(userId, avatarUrl);

    return { avatarUrl };
  }
}
