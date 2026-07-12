import { Injectable, Logger, Inject } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { material, scriptProject } from '@server/database/schema';
import { like, ilike, or, desc, sql } from 'drizzle-orm';
import type { MaterialItem } from '@shared/material.interface';
import type { ScriptProjectItem } from '@shared/script.interface';
import type { TopCreator } from '@shared/home.interface';
import type { SearchResponse } from '@shared/search.interface';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async search(params: {
    keyword: string;
    type: string;
  }): Promise<SearchResponse> {
    const { keyword, type } = params;
    const searchType = type || 'all';

    const [materials, scripts] = await Promise.all([
      searchType === 'all' || searchType === 'material'
        ? this.searchMaterials(keyword)
        : Promise.resolve([] as MaterialItem[]),
      searchType === 'all' || searchType === 'script'
        ? this.searchScripts(keyword)
        : Promise.resolve([] as ScriptProjectItem[]),
    ]);

    return { materials, scripts, creators: [] };
  }

  private async searchMaterials(
    keyword: string,
  ): Promise<MaterialItem[]> {
    const rows = await this.db
      .select({
        id: material.id,
        title: material.title,
        type: material.type,
        resolution: material.resolution,
        duration: material.duration,
        coverUrl: material.coverUrl,
        previewUrl: material.previewUrl,
        tags: material.tags,
      })
      .from(material)
      .where(
        or(
          like(material.title, `%${keyword}%`),
          like(material.description, `%${keyword}%`),
        ),
      )
      .orderBy(desc(material.createdAt))
      .limit(5);

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      type: row.type as MaterialItem['type'],
      resolution: row.resolution || '',
      duration: row.duration || 0,
      cover_url: row.coverUrl || '',
      preview_url: row.previewUrl || '',
      tags: row.tags || [],
    }));
  }

  private async searchScripts(
    keyword: string,
  ): Promise<ScriptProjectItem[]> {
    const rows = await this.db
      .select({
        id: scriptProject.id,
        title: scriptProject.title,
        type: scriptProject.type,
        description: scriptProject.description,
        coverUrl: scriptProject.coverUrl,
        collaboratorCount: sql<number>`COALESCE(array_length(${scriptProject.collaborators}, 1), 0)`,
        updatedAt: scriptProject.updatedAt,
      })
      .from(scriptProject)
      .where(
        or(
          ilike(scriptProject.title, `%${keyword}%`),
          ilike(scriptProject.description, `%${keyword}%`),
        ),
      )
      .orderBy(desc(scriptProject.updatedAt))
      .limit(5);

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      type: row.type || '',
      description: row.description || '',
      cover_url: row.coverUrl || '',
      collaborator_count: Number(row.collaboratorCount),
      updated_at: row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : String(row.updatedAt),
    }));
  }

  private async searchCreators(
    keyword: string,
  ): Promise<TopCreator[]> {
    const rows = await this.db
      .select({
        userId: sql<string>`(${material.createdBy}).user_id`,
        latestTitle: material.title,
      })
      .from(material)
      .where(
        sql`(${material.createdBy}).user_id IS NOT NULL AND (${material.createdBy}).user_id ILIKE ${`%${keyword}%`}`,
      )
      .orderBy(desc(material.createdAt))
      .limit(5);

    const seen = new Set<string>();
    const creators: TopCreator[] = [];

    for (const row of rows) {
      if (seen.has(row.userId)) continue;
      seen.add(row.userId);
      creators.push({
        id: row.userId,
        name: row.userId,
        avatar_url: '',
        representative_work: row.latestTitle || '',
      });
    }

    return creators;
  }
}
