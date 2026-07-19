import {
  BadRequestException,
  Injectable,
  Inject,
  Logger,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/common/compat/fullstack-nestjs-core';
import { and, count, desc, eq, gte, inArray, isNotNull, sql, type SQL } from 'drizzle-orm';
import { contentStat, material, scriptProject, userBehavior } from '@server/database/schema';
import type { AnalyticsContentStatsResponse, AnalyticsDashboardData, AnalyticsTrackRequest } from '@shared/types';

interface TrendPoint {
  date: string;
  views: number;
  likes: number;
  downloads: number;
  shares: number;
}

interface TopContentRow {
  resourceType: string | null;
  resourceId: string | null;
  views: number;
  likes: number;
  downloads: number;
  shares: number;
  total: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger: Logger = new Logger(AnalyticsService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async getDashboard(userId?: string): Promise<AnalyticsDashboardData> {
    const conditions = this.getUserConditions(userId);

    try {
      const [
        totalViews,
        totalLikes,
        totalDownloads,
        totalShares,
        totalFavorites,
        totalContents,
        weeklyRows,
        categoryRows,
        topRows,
      ] = await Promise.all([
        this.countAction(conditions, 'view'),
        this.countAction(conditions, 'like'),
        this.countAction(conditions, 'download'),
        this.countAction(conditions, 'share'),
        this.countAction(conditions, 'favorite'),
        this.getContentTypeCount(userId),
        this.getWeeklyBehaviorTrend(conditions),
        this.getCategoryDistribution(userId),
        this.getTopContents(conditions),
      ]);

      return {
        totalViews,
        totalLikes,
        totalDownloads,
        totalShares,
        totalFavorites,
        totalContents,
        weeklyTrend: weeklyRows,
        categoryDistribution: categoryRows,
        topContents: topRows,
      };
    } catch (error) {
      if (this.isRelationMissingError(error)) {
        this.logger.error(
          `analytics 仪表盘查询失败，回退到空报表: ${this.stringifyError(error)}`,
        );
        return this.buildEmptyDashboardData();
      }

      this.logger.error(`analytics 仪表盘查询失败: ${this.stringifyError(error)}`);
      throw error;
    }
  }

  private buildEmptyDashboardData(): AnalyticsDashboardData {
    return {
      totalViews: 0,
      totalLikes: 0,
      totalDownloads: 0,
      totalShares: 0,
      totalFavorites: 0,
      totalContents: 0,
      weeklyTrend: [],
      categoryDistribution: [],
      topContents: [],
    };
  }

  private isRelationMissingError(error: unknown): boolean {
    const candidate = error as { code?: string };
    return candidate?.code === '42P01';
  }

  private stringifyError(error: unknown): string {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}`;
    }
    if (typeof error === 'object' && error !== null) {
      return JSON.stringify(error);
    }
    return String(error);
  }

  async getContentStats(
    resourceType: string,
    resourceId: string,
    days: number,
  ): Promise<AnalyticsContentStatsResponse> {
    const normalizedDays = Number.isFinite(days) && days > 0 ? Math.floor(days) : 30;
    const since = new Date();
    since.setDate(since.getDate() - normalizedDays + 1);
    since.setHours(0, 0, 0, 0);

    const rows = await this.db
      .select({
        date: contentStat.date,
        views: contentStat.views,
        likes: contentStat.likes,
        favorites: contentStat.favorites,
        downloads: contentStat.downloads,
        shares: contentStat.shares,
        comments: contentStat.comments,
      })
      .from(contentStat)
      .where(
        and(
          eq(contentStat.resourceType, resourceType),
          eq(contentStat.resourceId, resourceId),
          gte(contentStat.createdAt, since),
        ),
      )
      .orderBy(contentStat.date);

    const timeline = this.normalizeContentTimeline(rows, normalizedDays);

    return {
      resourceType,
      resourceId,
      total: rows.reduce(
        (acc, row) => ({
          views: acc.views + Number(row.views || 0),
          likes: acc.likes + Number(row.likes || 0),
          favorites: acc.favorites + Number(row.favorites || 0),
          downloads: acc.downloads + Number(row.downloads || 0),
          shares: acc.shares + Number(row.shares || 0),
          comments: acc.comments + Number(row.comments || 0),
        }),
        {
          views: 0,
          likes: 0,
          favorites: 0,
          downloads: 0,
          shares: 0,
          comments: 0,
        },
      ),
      timeline,
    };
  }

  async track(
    data: AnalyticsTrackRequest,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const action = this.normalizeAction(data.action);
    const payload = this.buildTrackPayload(data, userId, ipAddress, userAgent, action);

    const inserted = await this.db
      .insert(userBehavior)
      .values(payload)
      .returning();

    return inserted[0] || null;
  }

  async findAll(_userId?: string) {
    return this.db
      .select({
        id: userBehavior.id,
        userId: userBehavior.userId,
        sessionId: userBehavior.sessionId,
        action: userBehavior.action,
        resourceType: userBehavior.resourceType,
        resourceId: userBehavior.resourceId,
        duration: userBehavior.duration,
        metadata: userBehavior.metadata,
        ipAddress: userBehavior.ipAddress,
        userAgent: userBehavior.userAgent,
      })
      .from(userBehavior)
      .orderBy(desc(userBehavior.id));
  }

  async findOne(id: string) {
    const result = await this.db
      .select()
      .from(userBehavior)
      .where(eq(userBehavior.id, id))
      .limit(1);

    return result[0] || null;
  }

  private getUserConditions(userId?: string): SQL<unknown>[] {
    const conditions: SQL<unknown>[] = [];
    if (userId) {
      conditions.push(sql`(${userBehavior.userId}).user_id = ${userId}`);
    }
    return conditions;
  }

  private async countAction(conditions: SQL<unknown>[], action: string): Promise<number> {
    const result = await this.db
      .select({ count: count() })
      .from(userBehavior)
      .where(this.andWhere(...conditions, eq(userBehavior.action, action)));

    return Number(result[0]?.count || 0);
  }

  private async getContentTypeCount(userId?: string): Promise<number> {
    if (!userId) {
      return 0;
    }

    const resourceTypeConditions = [
      sql`(${userBehavior.userId}).user_id = ${userId}`,
      isNotNull(userBehavior.resourceType),
      isNotNull(userBehavior.resourceId),
    ];

    const rows = await this.db
      .select({ resourceType: userBehavior.resourceType })
      .from(userBehavior)
      .where(and(...resourceTypeConditions));

    const unique = new Set<string>();

    rows.forEach((row: { resourceType: string | null }) => {
      if (row.resourceType) {
        unique.add(row.resourceType);
      }
    });

    return unique.size;
  }

  private async getWeeklyBehaviorTrend(conditions: SQL<unknown>[]): Promise<TrendPoint[]> {
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);

    const rows = await this.db
      .select({
        action: userBehavior.action,
        createdAt: userBehavior.createdAt,
      })
      .from(userBehavior)
      .where(this.andWhere(...conditions, gte(userBehavior.createdAt, since)))
      .orderBy(userBehavior.createdAt);

    const trend = new Map<string, TrendPoint>();
    const dates = this.getLastSevenDateKeys();

    dates.forEach((key: string) => {
      trend.set(key, { date: key, views: 0, likes: 0, downloads: 0, shares: 0 });
    });

    rows.forEach((row: { action: string | null; createdAt: Date | null }) => {
      if (!row.createdAt) {
        return;
      }

      const label = this.getWeekdayLabel(row.createdAt);
      const point = trend.get(label);
      if (!point) {
        return;
      }

      if (row.action === 'view') {
        point.views += 1;
      } else if (row.action === 'like') {
        point.likes += 1;
      } else if (row.action === 'download') {
        point.downloads += 1;
      } else if (row.action === 'share') {
        point.shares += 1;
      }
    });

    return dates.map((date: string): TrendPoint => trend.get(date) || {
      date,
      views: 0,
      likes: 0,
      downloads: 0,
      shares: 0,
    });
  }

  private async getCategoryDistribution(userId?: string): Promise<{ name: string; value: number }[]> {
    if (!userId) {
      return [];
    }

    const rows = await this.db
      .select({
        resourceType: userBehavior.resourceType,
        count: count(),
      })
      .from(userBehavior)
      .where(
        and(
          sql`(${userBehavior.userId}).user_id = ${userId}`,
          isNotNull(userBehavior.resourceType),
        ),
      )
      .groupBy(userBehavior.resourceType)
      .orderBy(desc(count()));

    const total = rows.reduce((acc, row) => acc + Number(row.count || 0), 0);
    if (total === 0) {
      return [];
    }

    return rows
      .map((row: { resourceType: string | null; count: number }) => {
        const value = Number(row.count || 0);
        if (value <= 0) {
          return null;
        }
        return {
          name: this.getResourceTypeName(row.resourceType),
          value,
        };
      })
      .filter((item): item is { name: string; value: number } => Boolean(item))
      .filter((item) => item.name.length > 0);
  }

  private async getTopContents(conditions: SQL<unknown>[]): Promise<{
    id: string;
    type: string;
    title: string;
    views: number;
    likes: number;
    downloads: number;
    shares: number;
    total: number;
  }[]> {
    const rows = await this.db
      .select({
        resourceType: userBehavior.resourceType,
        resourceId: userBehavior.resourceId,
        views: sql<number>`coalesce(sum(case when ${userBehavior.action} = 'view' then 1 else 0 end), 0)::integer`,
        likes: sql<number>`coalesce(sum(case when ${userBehavior.action} = 'like' then 1 else 0 end), 0)::integer`,
        downloads: sql<number>`coalesce(sum(case when ${userBehavior.action} = 'download' then 1 else 0 end), 0)::integer`,
        shares: sql<number>`coalesce(sum(case when ${userBehavior.action} = 'share' then 1 else 0 end), 0)::integer`,
        total: sql<number>`coalesce(count(*), 0)::integer`,
      })
      .from(userBehavior)
      .where(
        this.andWhere(
          ...conditions,
          isNotNull(userBehavior.resourceType),
          isNotNull(userBehavior.resourceId),
        ),
      )
      .groupBy(userBehavior.resourceType, userBehavior.resourceId)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(5);

    const normalizedRows = rows.filter(
      (row: TopContentRow): row is TopContentRow =>
        row.resourceType !== null && row.resourceId !== null,
    );

    const materialRowsPromise = normalizedRows.filter(
      (row): row is TopContentRow & { resourceType: 'material'; resourceId: string } =>
        row.resourceType === 'material' && typeof row.resourceId === 'string',
    );
    const scriptRowsPromise = normalizedRows.filter(
      (row): row is TopContentRow & { resourceType: 'script'; resourceId: string } =>
        row.resourceType === 'script' && typeof row.resourceId === 'string',
    );

    const materialIds = materialRowsPromise.map((row) => row.resourceId);
    const scriptIds = scriptRowsPromise.map((row) => row.resourceId);

    const [materialRows, scriptRows] = await Promise.all([
      materialIds.length > 0
        ? this.db
            .select({ id: material.id, title: material.title })
            .from(material)
            .where(inArray(material.id, materialIds))
        : Promise.resolve([] as { id: string; title: string | null }[]),
      scriptIds.length > 0
        ? this.db
            .select({ id: scriptProject.id, title: scriptProject.title })
            .from(scriptProject)
            .where(inArray(scriptProject.id, scriptIds))
        : Promise.resolve([] as { id: string; title: string | null }[]),
    ]);

    const materialTitleMap = new Map(
      materialRows.map((item: { id: string; title: string | null }) => [
        item.id,
        item.title ?? '未知素材',
      ]),
    );
    const scriptTitleMap = new Map(
      scriptRows.map((item: { id: string; title: string | null }) => [
        item.id,
        item.title ?? '未命名内容',
      ]),
    );

    return normalizedRows.map((row: TopContentRow) => {
      const resolvedId = row.resourceId ?? '';
      const title = row.resourceType === 'material'
        ? materialTitleMap.get(resolvedId)
        : row.resourceType === 'script'
          ? scriptTitleMap.get(resolvedId)
          : null;

      return {
        id: resolvedId,
        type: this.getResourceTypeName(row.resourceType),
        title: title ?? '未命名内容',
        views: Number(row.views || 0),
        likes: Number(row.likes || 0),
        downloads: Number(row.downloads || 0),
        shares: Number(row.shares || 0),
        total: Number(row.total || 0),
      };
    });
  }

  private andWhere(...conditions: SQL<unknown>[]): SQL<unknown> {
    if (conditions.length === 0) {
      return sql`TRUE`;
    }
    return and(...conditions) as SQL<unknown>;
  }

  private getResourceTypeName(resourceType: string | null): string {
    if (resourceType === 'material') {
      return '素材';
    }
    if (resourceType === 'script') {
      return '剧本';
    }
    return resourceType ? `内容(${resourceType})` : '内容';
  }

  private normalizeAction(action: string): string {
    const allowed = new Set(['view', 'like', 'favorite', 'download', 'share', 'comment', 'search']);
    const normalized = (action || '').toLowerCase().trim();

    if (!allowed.has(normalized)) {
      throw new BadRequestException(`不支持的行为类型: ${action}`);
    }

    return normalized;
  }

  private buildTrackPayload(
    data: AnalyticsTrackRequest,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    action?: string,
  ) {
    const payloadMetadata = this.normalizeMetadata(data.metadata);
    const duration = Number(data.duration);
    const recordDuration = Number.isFinite(duration) && duration > 0 ? Math.floor(duration) : undefined;

    return {
      userId,
      action: action || this.normalizeAction(data.action || ''),
      resourceType: data.resourceType ?? undefined,
      resourceId: data.resourceId ?? undefined,
      duration: recordDuration,
      metadata: payloadMetadata,
      ipAddress: ipAddress?.slice(0, 50),
      userAgent,
      createdAt: new Date(),
    };
  }

  private normalizeMetadata(metadata?: string): string | undefined {
    if (typeof metadata !== 'string') {
      return undefined;
    }

    const trimmed = metadata.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private getLastSevenDateKeys(): string[] {
    const dates: string[] = [];
    for (let index = 0; index < 7; index++) {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      dates.push(this.getWeekdayLabel(date));
    }
    return dates;
  }

  private getWeekdayLabel(date: Date): string {
    const labels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return labels[date.getDay()];
  }

  private normalizeContentTimeline(rows: Array<{ date: string; views: number; likes: number; downloads: number; shares: number; favorites: number; comments: number }>, days: number) {
    const map = new Map<string, { views: number; likes: number; downloads: number; shares: number; favorites: number; comments: number }>();

    rows.forEach((row) => {
      const key = row.date;
      map.set(key, {
        views: Number(row.views || 0),
        likes: Number(row.likes || 0),
        downloads: Number(row.downloads || 0),
        shares: Number(row.shares || 0),
        favorites: Number(row.favorites || 0),
        comments: Number(row.comments || 0),
      });
    });

    const timeline: Array<{
      date: string;
      views: number;
      likes: number;
      downloads: number;
      shares: number;
      favorites: number;
      comments: number;
    }> = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      const value = map.get(key) || {
        views: 0,
        likes: 0,
        downloads: 0,
        shares: 0,
        favorites: 0,
        comments: 0,
      };

      timeline.push({
        date: key,
        views: value.views,
        likes: value.likes,
        downloads: value.downloads,
        shares: value.shares,
        favorites: value.favorites,
        comments: value.comments,
      });
    }

    return timeline;
  }
}
