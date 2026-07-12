/**
 * 首页API调用层
 * 功能：封装首页相关的后端接口调用
 * 使用平台提供的axiosForBackend自动处理鉴权和跨域
 */
import { axiosForBackend } from '@client/compat/client-toolkit/utils/getAxiosForBackend';
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
  const res = await axiosForBackend({
    url: '/api/home/featured-materials',
    method: 'GET',
  });
  return res.data;
}

/**
 * 获取热门剧本列表（首页展示）
 * @returns 热门剧本数组（最多4条）
 */
export async function getPopularScripts(): Promise<HomeListResponse<PopularScript>> {
  const res = await axiosForBackend({
    url: '/api/home/popular-scripts',
    method: 'GET',
  });
  return res.data;
}

/**
 * 获取优秀创作者排行榜（首页展示）
 * @returns 创作者数组（最多6人）
 */
export async function getTopCreators(): Promise<HomeListResponse<TopCreator>> {
  const res = await axiosForBackend({
    url: '/api/home/top-creators',
    method: 'GET',
  });
  return res.data;
}

/**
 * 获取平台统计数据
 * @returns 素材数、剧本数、创作者数
 */
export async function getStatistics(): Promise<PlatformStatistics> {
  const res = await axiosForBackend({
    url: '/api/home/statistics',
    method: 'GET',
  });
  return res.data;
}
