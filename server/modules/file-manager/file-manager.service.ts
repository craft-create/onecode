import { Injectable, Inject, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/compat/fullstack-nestjs-core';
import { eq, and, desc, sql, count } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import {
  fileFolder,
  fileItem,
  fileShare,
  fileRecycleBin,
} from '@server/database/schema';

export interface CreateFolderDto {
  name: string;
  parentId?: string;
  color?: string;
  icon?: string;
}

export interface UpdateFolderDto {
  name?: string;
  color?: string;
  icon?: string;
}

export interface CreateFileItemDto {
  name: string;
  originalName: string;
  type: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  description?: string;
  tags?: string[];
  folderId?: string;
}

export interface UpdateFileItemDto {
  name?: string;
  description?: string;
  tags?: string[];
  folderId?: string;
}

export interface ShareFileDto {
  fileId: string;
  expiresIn?: number; // hours
  maxDownloads?: number;
  password?: string;
}

@Injectable()
export class FileManagerService {
  private readonly logger = new Logger(FileManagerService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  // ========== Folder Management ==========

  /**
   * 获取用户的所有文件夹
   */
  async getFolders(userId: string, parentId?: string) {
    const conditions = [eq(fileFolder.userId, userId as any)];
    if (parentId) {
      conditions.push(eq(fileFolder.parentId, parentId as any));
    } else {
      conditions.push(sql`${fileFolder.parentId} IS NULL`);
    }

    return this.db
      .select()
      .from(fileFolder)
      .where(and(...conditions))
      .orderBy(fileFolder.createdAt);
  }

  /**
   * 创建文件夹
   */
  async createFolder(userId: string, data: CreateFolderDto) {
    const folder = await this.db
      .insert(fileFolder)
      .values({
        userId: userId as any,
        name: data.name,
        parentId: data.parentId || null,
        color: data.color || '#3b82f6',
        icon: data.icon,
        isStarred: 0,
        itemCount: 0,
      })
      .returning();

    this.logger.log(`用户 ${userId} 创建文件夹: ${data.name}`);
    return folder[0];
  }

  /**
   * 更新文件夹
   */
  async updateFolder(userId: string, folderId: string, data: UpdateFolderDto) {
    const [folder] = await this.db
      .update(fileFolder)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(fileFolder.id, folderId), eq(fileFolder.userId, userId as any)))
      .returning();

    if (!folder) {
      throw new NotFoundException('文件夹不存在');
    }

    return folder;
  }

  /**
   * 删除文件夹（移动到回收站）
   */
  async deleteFolder(userId: string, folderId: string) {
    // 获取文件夹信息
    const [folder] = await this.db
      .select()
      .from(fileFolder)
      .where(and(eq(fileFolder.id, folderId), eq(fileFolder.userId, userId as any)))
      .limit(1);

    if (!folder) {
      throw new NotFoundException('文件夹不存在');
    }

    // 移动到回收站
    await this.db.insert(fileRecycleBin).values({
      userId: userId as any,
      folderId,
      name: folder.name,
      type: 'folder',
      deletedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后永久删除
    });

    // 删除文件夹
    await this.db.delete(fileFolder).where(eq(fileFolder.id, folderId));

    this.logger.log(`用户 ${userId} 删除文件夹: ${folder.name}`);
    return { success: true };
  }

  // ========== File Management ==========

  /**
   * 获取文件列表
   */
  async getFiles(userId: string, options: {
    folderId?: string;
    starred?: boolean;
    type?: string;
    tags?: string[];
    page?: number;
    pageSize?: number;
  }) {
    const { folderId, starred, type, tags, page = 1, pageSize = 20 } = options;
    const offset = (page - 1) * pageSize;

    const conditions = [eq(fileItem.userId, userId as any)];

    if (folderId !== undefined) {
      if (folderId) {
        conditions.push(eq(fileItem.folderId, folderId as any));
      } else {
        conditions.push(sql`${fileItem.folderId} IS NULL`);
      }
    }

    if (starred !== undefined) {
      conditions.push(eq(fileItem.isStarred, starred ? 1 : 0));
    }

    if (type) {
      conditions.push(eq(fileItem.type, type));
    }

    if (tags && tags.length > 0) {
      conditions.push(sql`${fileItem.tags} @> ${tags}::varchar[]`);
    }

    const whereClause = and(...conditions);

    const [countResult, items] = await Promise.all([
      this.db.select({ count: count() }).from(fileItem).where(whereClause),
      this.db
        .select()
        .from(fileItem)
        .where(whereClause)
        .orderBy(desc(fileItem.createdAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    return {
      items,
      total: Number(countResult[0]?.count || 0),
      page,
      pageSize,
    };
  }

  /**
   * 创建文件记录
   */
  async createFile(userId: string, data: CreateFileItemDto) {
    const file = await this.db
      .insert(fileItem)
      .values({
        userId: userId as any,
        name: data.name,
        originalName: data.originalName,
        type: data.type,
        mimeType: data.mimeType,
        size: data.size,
        url: data.url,
        thumbnailUrl: data.thumbnailUrl,
        description: data.description,
        tags: data.tags || [],
        folderId: data.folderId || null,
        isStarred: 0,
        isShared: 0,
        downloadCount: 0,
        viewCount: 0,
      })
      .returning();

    // 更新用户存储使用量
    await this.db.execute(sql`
      UPDATE local_users
      SET storage_used = storage_used + ${data.size}
      WHERE id = ${userId}::uuid
    `);

    // 更新文件夹文件数量
    if (data.folderId) {
      await this.db.execute(sql`
        UPDATE file_folder
        SET item_count = item_count + 1
        WHERE id = ${data.folderId}::uuid
      `);
    }

    this.logger.log(`用户 ${userId} 上传文件: ${data.name}`);
    return file[0];
  }

  /**
   * 更新文件信息
   */
  async updateFile(userId: string, fileId: string, data: UpdateFileItemDto) {
    const [file] = await this.db
      .update(fileItem)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(fileItem.id, fileId), eq(fileItem.userId, userId as any)))
      .returning();

    if (!file) {
      throw new NotFoundException('文件不存在');
    }

    return file;
  }

  /**
   * 删除文件（移动到回收站）
   */
  async deleteFile(userId: string, fileId: string) {
    // 获取文件信息
    const [file] = await this.db
      .select()
      .from(fileItem)
      .where(and(eq(fileItem.id, fileId), eq(fileItem.userId, userId as any)))
      .limit(1);

    if (!file) {
      throw new NotFoundException('文件不存在');
    }

    // 移动到回收站
    await this.db.insert(fileRecycleBin).values({
      userId: userId as any,
      fileId,
      name: file.name,
      type: 'file',
      size: file.size,
      deletedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后永久删除
    });

    // 删除文件
    await this.db.delete(fileItem).where(eq(fileItem.id, fileId));

    // 更新用户存储使用量
    await this.db.execute(sql`
      UPDATE local_users
      SET storage_used = storage_used - ${Number(file.size)}
      WHERE id = ${userId}::uuid AND storage_used >= ${Number(file.size)}
    `);

    // 更新文件夹文件数量
    if (file.folderId) {
      await this.db.execute(sql`
        UPDATE file_folder
        SET item_count = item_count - 1
        WHERE id = ${file.folderId}::uuid AND item_count > 0
      `);
    }

    this.logger.log(`用户 ${userId} 删除文件: ${file.name}`);
    return { success: true };
  }

  /**
   * 批量删除文件
   */
  async batchDeleteFiles(userId: string, fileIds: string[]) {
    const files = await this.db
      .select()
      .from(fileItem)
      .where(and(eq(fileItem.userId, userId as any), sql`${fileItem.id} = ANY(${fileIds}::uuid[])`));

    if (files.length === 0) {
      throw new NotFoundException('未找到要删除的文件');
    }

    const totalSize = files.reduce((sum, f) => sum + Number(f.size), 0);

    // 批量移动到回收站
    const recycleItems = files.map(f => ({
      userId: userId as any,
      fileId: f.id,
      name: f.name,
      type: 'file' as const,
      size: f.size,
      deletedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }));

    await this.db.insert(fileRecycleBin).values(recycleItems);

    // 删除文件
    await this.db.delete(fileItem).where(and(eq(fileItem.userId, userId as any), sql`${fileItem.id} = ANY(${fileIds}::uuid[])`));

    // 更新存储使用量
    if (totalSize > 0) {
      await this.db.execute(sql`
        UPDATE local_users
        SET storage_used = storage_used - ${totalSize}
        WHERE id = ${userId}::uuid AND storage_used >= ${totalSize}
      `);
    }

    this.logger.log(`用户 ${userId} 批量删除 ${files.length} 个文件`);
    return { success: true, deletedCount: files.length };
  }

  /**
   * 移动文件到文件夹
   */
  async moveFile(userId: string, fileId: string, folderId?: string) {
    const [file] = await this.db
      .update(fileItem)
      .set({ folderId: folderId || null, updatedAt: new Date() })
      .where(and(eq(fileItem.id, fileId), eq(fileItem.userId, userId as any)))
      .returning();

    if (!file) {
      throw new NotFoundException('文件不存在');
    }

    return file;
  }

  /**
   * 批量移动文件
   */
  async batchMoveFiles(userId: string, fileIds: string[], folderId?: string) {
    const files = await this.db
      .update(fileItem)
      .set({ folderId: folderId || null, updatedAt: new Date() })
      .where(and(eq(fileItem.userId, userId as any), sql`${fileItem.id} = ANY(${fileIds}::uuid[])`))
      .returning();

    return { success: true, movedCount: files.length };
  }

  /**
   * 收藏/取消收藏文件
   */
  async toggleStar(userId: string, fileId: string) {
    const [file] = await this.db
      .select()
      .from(fileItem)
      .where(and(eq(fileItem.id, fileId), eq(fileItem.userId, userId as any)))
      .limit(1);

    if (!file) {
      throw new NotFoundException('文件不存在');
    }

    const newStarred = file.isStarred === 1 ? 0 : 1;

    const [updated] = await this.db
      .update(fileItem)
      .set({ isStarred: newStarred, updatedAt: new Date() })
      .where(eq(fileItem.id, fileId))
      .returning();

    return updated;
  }

  // ========== File Sharing ==========

  /**
   * 生成分享链接
   */
  async shareFile(userId: string, data: ShareFileDto) {
    const [file] = await this.db
      .select()
      .from(fileItem)
      .where(and(eq(fileItem.id, data.fileId), eq(fileItem.userId, userId as any)))
      .limit(1);

    if (!file) {
      throw new NotFoundException('文件不存在');
    }

    const shareToken = uuidv4().replace(/-/g, '').substring(0, 16);
    const expiresAt = data.expiresIn
      ? new Date(Date.now() + data.expiresIn * 60 * 60 * 1000)
      : null;

    // 更新文件分享状态
    await this.db
      .update(fileItem)
      .set({
        isShared: 1,
        shareToken,
        shareExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(fileItem.id, data.fileId));

    // 创建分享记录
    await this.db
      .insert(fileShare)
      .values({
        fileId: data.fileId,
        userId: userId as any,
        shareToken,
        password: data.password,
        expiresAt,
        maxDownloads: data.maxDownloads,
      })
      .returning();

    return {
      shareToken,
      shareUrl: `/share/${shareToken}`,
      expiresAt,
    };
  }

  /**
   * 通过分享令牌获取文件
   */
  async getFileByShareToken(shareToken: string, password?: string) {
    const [share] = await this.db
      .select()
      .from(fileShare)
      .where(
        and(
          eq(fileShare.shareToken, shareToken),
          eq(fileShare.isActive, 1)
        )
      )
      .limit(1);

    if (!share) {
      throw new NotFoundException('分享链接不存在或已失效');
    }

    // 检查是否过期
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      throw new BadRequestException('分享链接已过期');
    }

    // 检查下载次数限制
    if (share.maxDownloads && share.downloadCount >= share.maxDownloads) {
      throw new BadRequestException('分享链接已达到最大下载次数');
    }

    // 验证密码
    if (share.password && share.password !== password) {
      throw new BadRequestException('分享密码错误');
    }

    // 获取文件信息
    const [file] = await this.db
      .select()
      .from(fileItem)
      .where(eq(fileItem.id, share.fileId))
      .limit(1);

    if (!file) {
      throw new NotFoundException('文件不存在');
    }

    // 增加下载次数
    await this.db
      .update(fileShare)
      .set({ downloadCount: sql`download_count + 1` })
      .where(eq(fileShare.id, share.id));

    await this.db
      .update(fileItem)
      .set({ downloadCount: sql`download_count + 1` })
      .where(eq(fileItem.id, file.id));

    return file;
  }

  /**
   * 取消分享
   */
  async unshareFile(userId: string, fileId: string) {
    await this.db
      .update(fileItem)
      .set({ isShared: 0, shareToken: null, shareExpiresAt: null, updatedAt: new Date() })
      .where(and(eq(fileItem.id, fileId), eq(fileItem.userId, userId as any)));

    await this.db.delete(fileShare).where(eq(fileShare.fileId, fileId));

    return { success: true };
  }

  // ========== Recycle Bin ==========

  /**
   * 获取回收站文件列表
   */
  async getRecycleBin(userId: string) {
    return this.db
      .select()
      .from(fileRecycleBin)
      .where(eq(fileRecycleBin.userId, userId as any))
      .orderBy(desc(fileRecycleBin.deletedAt));
  }

  /**
   * 恢复文件
   */
  async restoreFile(userId: string, recycleId: string) {
    const [item] = await this.db
      .select()
      .from(fileRecycleBin)
      .where(and(eq(fileRecycleBin.id, recycleId), eq(fileRecycleBin.userId, userId as any)))
      .limit(1);

    if (!item) {
      throw new NotFoundException('回收站项目不存在');
    }

    // 恢复文件夹
    if (item.type === 'folder' && item.folderId) {
      await this.db
        .update(fileFolder)
        .set({ updatedAt: new Date() })
        .where(eq(fileFolder.id, item.folderId));
    }

    // 恢复文件
    if (item.type === 'file' && item.fileId) {
      await this.db
        .update(fileItem)
        .set({ updatedAt: new Date() })
        .where(eq(fileItem.id, item.fileId));
    }

    // 从回收站删除
    await this.db.delete(fileRecycleBin).where(eq(fileRecycleBin.id, recycleId));

    return { success: true };
  }

  /**
   * 永久删除文件
   */
  async permanentlyDelete(userId: string, recycleId: string) {
    const [item] = await this.db
      .select()
      .from(fileRecycleBin)
      .where(and(eq(fileRecycleBin.id, recycleId), eq(fileRecycleBin.userId, userId as any)))
      .limit(1);

    if (!item) {
      throw new NotFoundException('回收站项目不存在');
    }

    // 永久删除文件
    if (item.type === 'file' && item.fileId) {
      await this.db.delete(fileItem).where(eq(fileItem.id, item.fileId));

      // 更新存储使用量
      if (item.size) {
        await this.db.execute(sql`
          UPDATE local_users
          SET storage_used = storage_used - ${Number(item.size)}
          WHERE id = ${userId}::uuid AND storage_used >= ${Number(item.size)}
        `);
      }
    }

    // 永久删除文件夹
    if (item.type === 'folder' && item.folderId) {
      await this.db.delete(fileFolder).where(eq(fileFolder.id, item.folderId));
    }

    // 从回收站删除
    await this.db.delete(fileRecycleBin).where(eq(fileRecycleBin.id, recycleId));

    this.logger.log(`用户 ${userId} 永久删除: ${item.name}`);
    return { success: true };
  }

  /**
   * 清空回收站
   */
  async clearRecycleBin(userId: string) {
    const items = await this.db
      .select()
      .from(fileRecycleBin)
      .where(eq(fileRecycleBin.userId, userId as any));

    let totalSize = 0;

    for (const item of items) {
      if (item.type === 'file' && item.fileId && item.size) {
        await this.db.delete(fileItem).where(eq(fileItem.id, item.fileId));
        totalSize += Number(item.size);
      }
      if (item.type === 'folder' && item.folderId) {
        await this.db.delete(fileFolder).where(eq(fileFolder.id, item.folderId));
      }
    }

    // 更新存储使用量
    if (totalSize > 0) {
      await this.db.execute(sql`
        UPDATE local_users
        SET storage_used = storage_used - ${totalSize}
        WHERE id = ${userId}::uuid AND storage_used >= ${totalSize}
      `);
    }

    // 清空回收站
    await this.db.delete(fileRecycleBin).where(eq(fileRecycleBin.userId, userId as any));

    this.logger.log(`用户 ${userId} 清空回收站，删除了 ${items.length} 个项目`);
    return { success: true, deletedCount: items.length };
  }
}
