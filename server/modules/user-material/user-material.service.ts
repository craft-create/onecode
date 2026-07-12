import {
  Injectable,
  Logger,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/compat/fullstack-nestjs-core';
import { material, userMaterial, favoriteCategory } from '@server/database/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import type {
  UserMaterialItem,
  UserMaterialListResponse,
  FavoriteMaterialItem,
  FavoriteMaterialListResponse,
  DownloadHistoryItem,
  DownloadHistoryListResponse,
  FavoriteCategoryRequest,
  FavoriteCategoryResponse,
  FavoriteMaterialRequest,
  FavoriteMaterialResponse,
} from '@shared/material.interface';

@Injectable()
export class UserMaterialService {
  private readonly logger = new Logger(UserMaterialService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getUploads(
    userId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<UserMaterialListResponse> {
    return this.getUploadsByUserId(userId, page, pageSize);
  }

  async getUploadsByUserId(
    userId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<UserMaterialListResponse> {
    const offset = (page - 1) * pageSize;
    const whereClause = and(
      eq(userMaterial.userId, userId),
      eq(userMaterial.relationType, 'upload'),
    );

    const [countResult, items] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(userMaterial)
        .where(whereClause),
      this.db
        .select({
          id: userMaterial.id,
          materialId: userMaterial.materialId,
          createdAt: userMaterial.createdAt,
          title: material.title,
          coverUrl: material.coverUrl,
        })
        .from(userMaterial)
        .innerJoin(material, eq(userMaterial.materialId, material.id))
        .where(whereClause)
        .orderBy(desc(userMaterial.createdAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const total = Number(countResult[0]?.count || 0);

    const mappedItems: UserMaterialItem[] = items.map((item) => ({
      id: item.id,
      material_id: item.materialId,
      title: item.title,
      cover_url: item.coverUrl || '',
      created_at: item.createdAt.toISOString(),
    }));

    return { items: mappedItems, total };
  }

  async getFavorites(
    userId: string,
    categoryId?: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<FavoriteMaterialListResponse> {
    const offset = (page - 1) * pageSize;
    const conditions: ReturnType<typeof eq>[] = [
      eq(userMaterial.userId, userId),
      eq(userMaterial.relationType, 'favorite'),
    ];
    if (categoryId) {
      conditions.push(eq(userMaterial.categoryId, categoryId));
    }
    const whereClause = and(...conditions);

    const [countResult, items] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(userMaterial)
        .where(whereClause),
      this.db
        .select({
          id: userMaterial.id,
          materialId: userMaterial.materialId,
          title: material.title,
          coverUrl: material.coverUrl,
          categoryName: favoriteCategory.name,
          createdAt: userMaterial.createdAt,
        })
        .from(userMaterial)
        .innerJoin(material, eq(userMaterial.materialId, material.id))
        .leftJoin(
          favoriteCategory,
          eq(userMaterial.categoryId, favoriteCategory.id),
        )
        .where(whereClause)
        .orderBy(desc(userMaterial.createdAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const total = Number(countResult[0]?.count || 0);

    const mappedItems: FavoriteMaterialItem[] = items.map((item) => ({
      id: item.id,
      material_id: item.materialId,
      title: item.title,
      cover_url: item.coverUrl || '',
      category_name: item.categoryName || '未分类',
      created_at: item.createdAt.toISOString(),
    }));

    return { items: mappedItems, total };
  }

  async getDownloads(
    userId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<DownloadHistoryListResponse> {
    const offset = (page - 1) * pageSize;
    const whereClause = and(
      eq(userMaterial.userId, userId),
      eq(userMaterial.relationType, 'download'),
    );

    const [countResult, items] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(userMaterial)
        .where(whereClause),
      this.db
        .select({
          id: userMaterial.id,
          materialId: userMaterial.materialId,
          title: material.title,
          format: material.format,
          fileSize: material.fileSize,
          downloadUrl: material.downloadUrl,
          createdAt: userMaterial.createdAt,
        })
        .from(userMaterial)
        .innerJoin(material, eq(userMaterial.materialId, material.id))
        .where(whereClause)
        .orderBy(desc(userMaterial.createdAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const total = Number(countResult[0]?.count || 0);

    const mappedItems: DownloadHistoryItem[] = items.map((item) => ({
      id: item.id,
      material_id: item.materialId,
      title: item.title,
      format: item.format || '',
      file_size: item.fileSize || 0,
      download_url: item.downloadUrl || '',
      created_at: item.createdAt.toISOString(),
    }));

    return { items: mappedItems, total };
  }

  async getCategories(
    userId: string,
  ): Promise<{ id: string; name: string }[]> {
    const categories = await this.db
      .select({
        id: favoriteCategory.id,
        name: favoriteCategory.name,
      })
      .from(favoriteCategory)
      .where(eq(favoriteCategory.userId, userId))
      .orderBy(favoriteCategory.createdAt);

    return categories;
  }

  async toggleFavorite(
    userId: string,
    dto: FavoriteMaterialRequest,
  ): Promise<FavoriteMaterialResponse> {
    if (dto.action === 'add') {
      const [existing] = await this.db
        .select({ id: userMaterial.id })
        .from(userMaterial)
        .where(
          and(
            eq(userMaterial.userId, userId),
            eq(userMaterial.materialId, dto.material_id),
            eq(userMaterial.relationType, 'favorite'),
          ),
        );

      if (!existing) {
        await this.db.insert(userMaterial).values({
          userId,
          materialId: dto.material_id,
          relationType: 'favorite',
          categoryId: dto.category_id || null,
        });
        this.logger.log(
          `用户 ${userId} 收藏素材 ${dto.material_id}`,
        );
      }
    } else if (dto.action === 'remove') {
      await this.db
        .delete(userMaterial)
        .where(
          and(
            eq(userMaterial.userId, userId),
            eq(userMaterial.materialId, dto.material_id),
            eq(userMaterial.relationType, 'favorite'),
          ),
        );
      this.logger.log(
        `用户 ${userId} 取消收藏素材 ${dto.material_id}`,
      );
    }

    return { success: true };
  }

  async recordDownload(
    userId: string,
    materialId: string,
  ): Promise<void> {
    await this.db.insert(userMaterial).values({
      userId,
      materialId,
      relationType: 'download',
    });
    this.logger.log(`用户 ${userId} 下载素材 ${materialId}`);
  }

  async manageCategory(
    userId: string,
    dto: FavoriteCategoryRequest,
  ): Promise<FavoriteCategoryResponse> {
    if (dto.action === 'create') {
      if (!dto.name) {
        throw new BadRequestException('分类名称不能为空');
      }
      await this.db.insert(favoriteCategory).values({
        name: dto.name,
        userId,
      });
      this.logger.log(`用户 ${userId} 创建收藏分类: ${dto.name}`);
    } else if (dto.action === 'update') {
      if (!dto.id || !dto.name) {
        throw new BadRequestException('分类ID和名称不能为空');
      }
      await this.db
        .update(favoriteCategory)
        .set({ name: dto.name })
        .where(
          and(
            eq(favoriteCategory.id, dto.id),
            eq(favoriteCategory.userId, userId),
          ),
        );
      this.logger.log(`用户 ${userId} 更新收藏分类: ${dto.id}`);
    } else if (dto.action === 'delete') {
      if (!dto.id) {
        throw new BadRequestException('分类ID不能为空');
      }
      await this.db
        .delete(favoriteCategory)
        .where(
          and(
            eq(favoriteCategory.id, dto.id),
            eq(favoriteCategory.userId, userId),
          ),
        );
      this.logger.log(`用户 ${userId} 删除收藏分类: ${dto.id}`);
    }

    return { success: true };
  }
}
