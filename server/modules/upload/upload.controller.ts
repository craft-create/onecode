import {
  Controller,
  Post,
  Get,
  Delete,
  Req,
  HttpException,
  Res,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { UploadService } from './upload.service';
import { AuthService } from '../auth/auth.service';
import { getLocalUserId } from '@server/common/utils/auth.helper';

const ALLOWED_MIME_TYPES: string[] = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

const MAX_FILE_SIZE: number = 512 * 1024 * 1024; // 512MB

@Controller()
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly authService: AuthService,
  ) {}

  @Post('api/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req: any, file: Express.Multer.File, callback: any) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new BadRequestException(`Unsupported file type: ${file.mimetype}`), false);
        }
      },
    }),
  )
  async uploadFile(@Req() req: Request, @UploadedFile() file: Express.Multer.File) {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new HttpException('请先登录', 401);
    }
    return this.handleUpload(file);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req: any, file: Express.Multer.File, callback: any) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new BadRequestException(`Unsupported file type: ${file.mimetype}`), false);
        }
      },
    }),
  )
  async uploadCompatFile(@Req() req: Request, @UploadedFile() file: Express.Multer.File) {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new HttpException('请先登录', 401);
    }
    return this.handleUpload(file);
  }

  async handleUpload(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const result = await this.uploadService.saveFile(file);
    return result;
  }

  @Get('uploads/*')
  async serveFile(@Req() req: Request, @Res() res: Response) {
    const relativePath: string = req.params[0] || req.url.replace(/^\/uploads\//, '');
    const filePath: string = path.resolve(process.cwd(), 'output/uploads', relativePath);
    const uploadsBase: string = path.resolve(process.cwd(), 'output/uploads');

    // Prevent path traversal
    if (!filePath.startsWith(uploadsBase)) {
      throw new BadRequestException('Invalid file path');
    }

    if (!fs.existsSync(filePath)) {
      throw new BadRequestException('File not found');
    }

    res.sendFile(filePath);
  }

  @Delete('api/upload')
  async deleteFile(@Req() req: Request, @Query('url') url?: string): Promise<{ success: boolean }> {
    return this.handleDelete(req, url);
  }

  @Delete('upload')
  async deleteCompatFile(@Req() req: Request, @Query('url') url?: string): Promise<{ success: boolean }> {
    return this.handleDelete(req, url);
  }

  private async handleDelete(@Req() req: Request, @Query('url') url?: string): Promise<{ success: boolean }> {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new ForbiddenException('请先登录');
    }

    if (!url) {
      throw new BadRequestException('请提供文件URL');
    }

    const isAdmin = await this.authService.isSuperUser(userId);
    if (!isAdmin) {
      throw new ForbiddenException('仅管理员可删除文件');
    }

    const result = await this.uploadService.deleteFile(url);
    return { success: result };
  }
}
