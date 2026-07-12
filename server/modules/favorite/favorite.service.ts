import {
  Injectable,
  Logger,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import {
  favoriteFolder,
  favoriteFolderItem,
  material,
  scriptProject,
} from '@server/database/schema';
import { eq, and, count, desc, sql } from 'drizzle-orm';
import type {
  FavoriteFolderItem,
  FavoriteFolderListResponse,
  CreateFavoriteFolderRequest,
  CreateFavoriteFolderResponse,
  UpdateFavoriteFolderRequest,
  FavoriteFolderContentItem,
  FavoriteFolderContentResponse,
  AddFavoriteItemRequest,
  AddFavoriteItemResponse,
} from '@shared/material.interface';

@Injectable()
export class FavoriteService {
  private readonly logger = new Logger(FavoriteService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async listFolders(userId: string): Promise<FavoriteFolderListResponse> {
    const folders = await this.db
      .select({
        id: favoriteFolder.id,
        name: favoriteFolder.name,
        createdAt: favoriteFolder.createdAt,
      })
      .from(favoriteFolder)
      .where(
        sql`(${favoriteFolder.userId}).user_id = ${userId}`,
      )
      .orderBy(desc(favoriteFolder.createdAt));

    const items: FavoriteFolderItem[] = await Promise.all(
      folders.map(async (f) => {
        const [countResult] = await this.db
          .select({ count: count() })
          .from(favoriteFolderItem)
          .where(eq(favoriteFolderItem.folderId, f.id));
        return {
          id: f.id,
          name: f.name,
          item_count: Number(countResult.count),
          created_at: f.createdAt instanceof Date
            ? f.createdAt.toISOString()
            : String(f.createdAt),
        };
      }),
    );

    return { items };
  }

  async createFolder(
    userId: string,
    dto: CreateFavoriteFolderRequest,
  ): Promise<CreateFavoriteFolderResponse> {
    const [result] = await this.db
      .insert(favoriteFolder)
      .values({
        name: dto.name,
        userId,
      })
      .returning({ id: favoriteFolder.id });

    this.logger.log(`用户 ${userId} 创建收藏夹: ${result.id}`);
    return { id: result.id };
  }

  async renameFolder(
    folderId: string,
    userId: string,
    dto: UpdateFavoriteFolderRequest,
  ): Promise<void> {
    const [folder] = await this.db
      .select({ userId: favoriteFolder.userId })
      .from(favoriteFolder)
      .where(eq(favoriteFolder.id, folderId));

    if (!folder) {
      throw new NotFoundException('收藏夹不存在');
    }
    if (folder.userId !== userId) {
      throw new ForbiddenException('只能修改自己的收藏夹');
    }

    await this.db
      .update(favoriteFolder)
      .set({ name: dto.name })
      .where(eq(favoriteFolder.id, folderId));

    this.logger.log(`收藏夹 ${folderId} 重命名为 ${dto.name}`);
  }

  async deleteFolder(folderId: string, userId: string): Promise<void> {
    const [folder] = await this.db
      .select({ userId: favoriteFolder.userId })
      .from(favoriteFolder)
      .where(eq(favoriteFolder.id, folderId));

    if (!folder) {
      throw new NotFoundException('收藏夹不存在');
    }
    if (folder.userId !== userId) {
      throw new ForbiddenException('只能删除自己的收藏夹');
    }

    await this.db
      .delete(favoriteFolderItem)
      .where(eq(favoriteFolderItem.folderId, folderId));
    await this.db
      .delete(favoriteFolder)
      .where(eq(favoriteFolder.id, folderId));

    this.logger.log(`收藏夹 ${folderId} 已删除`);
  }

  async addItem(
    folderId: string,
    userId: string,
    dto: AddFavoriteItemRequest,
  ): Promise<AddFavoriteItemResponse> {
    const [folder] = await this.db
      .select({ userId: favoriteFolder.userId })
      .from(favoriteFolder)
      .where(eq(favoriteFolder.id, folderId));

    if (!folder) {
      throw new NotFoundException('收藏夹不存在');
    }
    if (folder.userId !== userId) {
      throw new ForbiddenException('只能向自己的收藏夹添加内容');
    }

    if (!dto.material_id && !dto.project_id) {
      throw new ForbiddenException('必须指定 material_id 或 project_id');
    }

    const [result] = await this.db
      .insert(favoriteFolderItem)
      .values({
        folderId,
        materialId: dto.material_id || null,
        projectId: dto.project_id || null,
      })
      .returning({ id: favoriteFolderItem.id });

    this.logger.log(`向收藏夹 ${folderId} 添加项目: ${result.id}`);
    return { id: result.id };
  }

  async removeItem(
    folderId: string,
    itemId: string,
    userId: string,
  ): Promise<void> {
    const [folder] = await this.db
      .select({ userId: favoriteFolder.userId })
      .from(favoriteFolder)
      .where(eq(favoriteFolder.id, folderId));

    if (!folder) {
      throw new NotFoundException('收藏夹不存在');
    }
    if (folder.userId !== userId) {
      throw new ForbiddenException('只能从自己的收藏夹移除内容');
    }

    const [item] = await this.db
      .select({ id: favoriteFolderItem.id })
      .from(favoriteFolderItem)
      .where(
        and(
          eq(favoriteFolderItem.id, itemId),
          eq(favoriteFolderItem.folderId, folderId),
        ),
      );

    if (!item) {
      throw new NotFoundException('收藏项不存在');
    }

    await this.db
      .delete(favoriteFolderItem)
      .where(eq(favoriteFolderItem.id, itemId));

    this.logger.log(`从收藏夹 ${folderId} 移除项目: ${itemId}`);
  }

  async listItems(
    folderId: string,
    userId: string,
  ): Promise<FavoriteFolderContentResponse> {
    const [folder] = await this.db
      .select({ userId: favoriteFolder.userId })
      .from(favoriteFolder)
      .where(eq(favoriteFolder.id, folderId));

    if (!folder) {
      throw new NotFoundException('收藏夹不存在');
    }
    if (folder.userId !== userId) {
      throw new ForbiddenException('只能查看自己的收藏夹内容');
    }

    const rows = await this.db.execute<{
      id: string;
      material_id: string | null;
      project_id: string | null;
      title: string;
      cover_url: string;
      type: string;
      created_at: Date;
    }>(sql`
      SELECT
        ffi.id,
        ffi.material_id,
        ffi.project_id,
        COALESCE(m.title, sp.title, '') AS title,
        COALESCE(m.cover_url, sp.cover_url, '') AS cover_url,
        CASE
          WHEN ffi.material_id IS NOT NULL THEN 'material'
          ELSE 'project'
        END AS type,
        ffi._created_at AS created_at
      FROM favorite_folder_item ffi
      LEFT JOIN material m ON ffi.material_id = m.id
      LEFT JOIN script_project sp ON ffi.project_id = sp.id
      WHERE ffi.folder_id = ${folderId}::uuid
      ORDER BY ffi._created_at DESC
    `);

    const items: FavoriteFolderContentItem[] = rows.map((row) => ({
      id: row.id,
      material_id: row.material_id,
      project_id: row.project_id,
      title: row.title,
      cover_url: row.cover_url,
      type: row.type as 'material' | 'project',
      created_at: row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
    }));

    return { items };
  }
}
