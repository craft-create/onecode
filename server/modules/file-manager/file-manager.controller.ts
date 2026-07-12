import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { NeedLogin } from '@server/common/compat/fullstack-nestjs-core';
import { FileManagerService } from './file-manager.service';
import { getLocalUserId } from '@server/common/utils/auth.helper';
import type { Request } from 'express';

@Controller('api/files')
export class FileManagerController {
  constructor(private readonly fileManagerService: FileManagerService) {}

  // ========== Folder Management ==========

  @Get('folders')
  @NeedLogin()
  async getFolders(@Req() req: Request, @Query('parentId') parentId?: string) {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new Error('Unauthorized');
    }
    return this.fileManagerService.getFolders(userId, parentId);
  }

  @Post('folders')
  @NeedLogin()
  async createFolder(@Req() req: Request, @Body() body: { name: string; parentId?: string; color?: string; icon?: string }) {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new Error('Unauthorized');
    }
    return this.fileManagerService.createFolder(userId, body);
  }

  @Patch('folders/:folderId')
  @NeedLogin()
  async updateFolder(@Req() req: Request, @Param('folderId') folderId: string, @Body() body: { name?: string; color?: string; icon?: string }) {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new Error('Unauthorized');
    }
    return this.fileManagerService.updateFolder(userId, folderId, body);
  }

  @Delete('folders/:folderId')
  @NeedLogin()
  async deleteFolder(@Req() req: Request, @Param('folderId') folderId: string) {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new Error('Unauthorized');
    }
    return this.fileManagerService.deleteFolder(userId, folderId);
  }

  // ========== File Management ==========

  @Get()
  @NeedLogin()
  async getFiles(
    @Req() req: Request,
    @Query('folderId') folderId?: string,
    @Query('starred') starred?: string,
    @Query('type') type?: string,
    @Query('tags') tags?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new Error('Unauthorized');
    }

    return this.fileManagerService.getFiles(userId, {
      folderId,
      starred: starred === 'true',
      type,
      tags: tags ? tags.split(',') : undefined,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
    });
  }

  @Post()
  @NeedLogin()
  async createFile(@Req() req: Request, @Body() body: any) {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new Error('Unauthorized');
    }
    return this.fileManagerService.createFile(userId, body);
  }

  @Patch(':fileId')
  @NeedLogin()
  async updateFile(@Req() req: Request, @Param('fileId') fileId: string, @Body() body: { name?: string; description?: string; tags?: string[]; folderId?: string }) {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new Error('Unauthorized');
    }
    return this.fileManagerService.updateFile(userId, fileId, body);
  }

  @Delete(':fileId')
  @NeedLogin()
  async deleteFile(@Req() req: Request, @Param('fileId') fileId: string) {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new Error('Unauthorized');
    }
    return this.fileManagerService.deleteFile(userId, fileId);
  }

  @Post('batch/delete')
  @NeedLogin()
  async batchDelete(@Req() req: Request, @Body() body: { fileIds: string[] }) {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new Error('Unauthorized');
    }
    return this.fileManagerService.batchDeleteFiles(userId, body.fileIds);
  }

  @Post('batch/move')
  @NeedLogin()
  async batchMove(@Req() req: Request, @Body() body: { fileIds: string[]; folderId?: string }) {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new Error('Unauthorized');
    }
    return this.fileManagerService.batchMoveFiles(userId, body.fileIds, body.folderId);
  }

  @Post(':fileId/star')
  @NeedLogin()
  async toggleStar(@Req() req: Request, @Param('fileId') fileId: string) {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new Error('Unauthorized');
    }
    return this.fileManagerService.toggleStar(userId, fileId);
  }

  // ========== File Sharing ==========

  @Post('share')
  @NeedLogin()
  async shareFile(@Req() req: Request, @Body() body: { fileId: string; expiresIn?: number; maxDownloads?: number; password?: string }) {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new Error('Unauthorized');
    }
    return this.fileManagerService.shareFile(userId, body);
  }

  @Get('share/:shareToken')
  async getSharedFile(@Param('shareToken') shareToken: string, @Query('password') password?: string) {
    return this.fileManagerService.getFileByShareToken(shareToken, password);
  }

  @Delete(':fileId/share')
  @NeedLogin()
  async unshareFile(@Req() req: Request, @Param('fileId') fileId: string) {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new Error('Unauthorized');
    }
    return this.fileManagerService.unshareFile(userId, fileId);
  }

  // ========== Recycle Bin ==========

  @Get('recycle-bin')
  @NeedLogin()
  async getRecycleBin(@Req() req: Request) {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new Error('Unauthorized');
    }
    return this.fileManagerService.getRecycleBin(userId);
  }

  @Post('recycle-bin/:recycleId/restore')
  @NeedLogin()
  async restoreFile(@Req() req: Request, @Param('recycleId') recycleId: string) {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new Error('Unauthorized');
    }
    return this.fileManagerService.restoreFile(userId, recycleId);
  }

  @Delete('recycle-bin/:recycleId')
  @NeedLogin()
  async permanentlyDelete(@Req() req: Request, @Param('recycleId') recycleId: string) {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new Error('Unauthorized');
    }
    return this.fileManagerService.permanentlyDelete(userId, recycleId);
  }

  @Delete('recycle-bin/clear')
  @NeedLogin()
  async clearRecycleBin(@Req() req: Request) {
    const userId: string | undefined = getLocalUserId(req);
    if (!userId) {
      throw new Error('Unauthorized');
    }
    return this.fileManagerService.clearRecycleBin(userId);
  }
}
