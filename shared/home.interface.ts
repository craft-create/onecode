/**
 * 首页模块 - 共享类型定义
 * 说明：这些类型是前后端共用的接口契约
 * 位置：shared/home.interface.ts
 * 用途：首页相关API的请求/响应数据结构定义
 */

/**
 * 精选素材类型（首页轮播 + 热门素材板块共用）
 */
export interface FeaturedMaterial {
  /** 素材唯一ID（UUID） */
  id: string;
  /** 素材标题 */
  title: string;
  /** 封面图URL */
  cover_url: string;
  /** 素材描述 */
  description: string;
}

/**
 * 热门剧本类型（首页展示）
 */
export interface PopularScript {
  /** 剧本项目ID */
  id: string;
  /** 剧本标题 */
  title: string;
  /** 剧本类型（如：短片、长片、广告等） */
  type: string;
  /** 封面图URL */
  cover_url: string;
  /** 点赞数量 */
  like_count: number;
  /** 作者ID */
  author_id?: string;
  /** 作者名称/ID */
  author_name: string;
  /** 作者头像 */
  author_avatar_url?: string;
}

/**
 * 优秀创作者类型（首页排行榜）
 */
export interface TopCreator {
  /** 用户ID */
  id: string;
  /** 用户名称 */
  name: string;
  /** 头像URL */
  avatar_url: string;
  /** 代表作品名称 */
  representative_work: string;
}

/**
 * 平台统计数据（首页数据栏）
 */
export interface PlatformStatistics {
  /** 素材总数量 */
  material_count: number;
  /** 剧本总数量 */
  script_count: number;
  /** 创作者总数量（去重） */
  creator_count: number;
}

/**
 * 首页API响应包装（列表数据）
 * 通用的列表响应格式
 */
export interface HomeListResponse<T> {
  /** 数据项数组 */
  items: T[];
}
