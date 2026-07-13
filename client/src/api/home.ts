/**
 * 首页API调用层
 * 功能：封装首页相关的后端接口调用
 */
import { api } from '@client/src/api';
import type {
  FeaturedMaterial,
  HomeListResponse,
  PlatformStatistics,
  PopularScript,
  TopCreator,
} from '@shared/home.interface';

/**
 * 获取精选素材列表（首页轮播用）
 * @returns 精选素材数组（最多5条）
 */
export async function getFeaturedMaterials(): Promise<HomeListResponse<FeaturedMaterial>> {
  return api.get('/home/featured-materials');
}

/**
 * 获取热门剧本列表（首页展示）
 * @returns 热门剧本数组（最多4条）
 */
export async function getPopularScripts(): Promise<HomeListResponse<PopularScript>> {
  return api.get('/home/popular-scripts');
}

/**
 * 获取优秀创作者排行榜（首页展示）
 * @returns 创作者数组（最多6人）
 */
export async function getTopCreators(): Promise<HomeListResponse<TopCreator>> {
  return api.get('/home/top-creators');
}

/**
 * 获取平台统计数据
 * @returns 素材数、剧本数、创作者数
 */
export async function getStatistics(): Promise<PlatformStatistics> {
  return api.get('/home/statistics');
}
