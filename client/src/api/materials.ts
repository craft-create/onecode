/**
 * 素材API调用层
 * 功能：封装影音素材相关的所有后端接口调用
 * 使用平台提供的axiosForBackend自动处理鉴权和跨域
 */
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  MaterialListResponse,
  MaterialSearchResponse,
  MaterialFiltersResponse,
  MaterialDetail,
  MaterialDownloadResponse,
  MaterialRelatedResponse,
  CreateMaterialRequest,
  CreateMaterialResponse,
  MaterialLikeStatusResponse,
} from '@shared/material.interface';

/**
 * 获取素材列表（支持筛选和分页）
 * @param params.type - 素材类型 video/audio/sound
 * @param params.resolution - 分辨率筛选
 * @param params.durationMin - 最小时长（秒）
 * @param params.durationMax - 最大时长（秒）
 * @param params.tags - 标签数组
 * @param params.page - 页码
 * @param params.pageSize - 每页数量
 */
export async function listMaterials(params: {
  type?: string;
  resolution?: string;
  durationMin?: number;
  durationMax?: number;
  tags?: string[];
  page?: number;
  pageSize?: number;
}): Promise<MaterialListResponse> {
  // 构建URL查询参数
  const queryParams = new URLSearchParams();
  if (params.type) queryParams.set('type', params.type);
  if (params.resolution) queryParams.set('resolution', params.resolution);
  if (params.durationMin !== undefined) {
    queryParams.set('durationMin', String(params.durationMin));
  }
  if (params.durationMax !== undefined) {
    queryParams.set('durationMax', String(params.durationMax));
  }
  // 标签数组转逗号分隔字符串
  if (params.tags && params.tags.length > 0) {
    queryParams.set('tags', params.tags.join(','));
  }
  if (params.page) queryParams.set('page', String(params.page));
  if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));

  const qs = queryParams.toString();
  const { data } = await axiosForBackend({
    url: `/api/materials${qs ? `?${qs}` : ''}`,
    method: 'GET',
  });
  return data;
}

/**
 * 关键词搜索素材
 * @param params.keyword - 搜索关键词
 * @param params.page - 页码
 * @param params.pageSize - 每页数量
 */
export async function searchMaterials(params: {
  keyword: string;
  page?: number;
  pageSize?: number;
}): Promise<MaterialSearchResponse> {
  const queryParams = new URLSearchParams();
  queryParams.set('keyword', params.keyword);
  if (params.page) queryParams.set('page', String(params.page));
  if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));

  const { data } = await axiosForBackend({
    url: `/api/materials/search?${queryParams.toString()}`,
    method: 'GET',
  });
  return data;
}

/**
 * 获取素材筛选条件（分辨率、时长区间、所有标签）
 * 用于素材库侧边栏筛选器的选项数据
 */
export async function getMaterialFilters(): Promise<MaterialFiltersResponse> {
  const { data } = await axiosForBackend({
    url: '/api/materials/filters',
    method: 'GET',
  });
  return data;
}

/**
 * 获取素材详情
 * @param id - 素材ID
 */
export async function getMaterialById(
  id: string,
): Promise<MaterialDetail> {
  const { data } = await axiosForBackend({
    url: `/api/materials/${id}`,
    method: 'GET',
  });
  return data;
}

/**
 * 获取素材下载地址（调用一次下载数+1）
 * @param id - 素材ID
 */
export async function getMaterialDownloadUrl(
  id: string,
): Promise<MaterialDownloadResponse> {
  const { data } = await axiosForBackend({
    url: `/api/materials/${id}/download`,
    method: 'GET',
  });
  return data;
}

/**
 * 获取相关素材推荐（基于标签相似度）
 * @param id - 当前素材ID
 * @param page - 页码
 * @param pageSize - 推荐数量
 */
export async function getRelatedMaterials(
  id: string,
  page?: number,
  pageSize?: number,
): Promise<MaterialRelatedResponse> {
  const queryParams = new URLSearchParams();
  if (page) queryParams.set('page', String(page));
  if (pageSize) queryParams.set('pageSize', String(pageSize));

  const qs = queryParams.toString();
  const { data } = await axiosForBackend({
    url: `/api/materials/${id}/related${qs ? `?${qs}` : ''}`,
    method: 'GET',
  });
  return data;
}

/**
 * 创建新素材（上传素材后调用）
 * 需要登录
 * @param dto - 素材表单数据
 */
export async function createMaterial(
  dto: CreateMaterialRequest,
): Promise<CreateMaterialResponse> {
  const { data } = await axiosForBackend({
    url: '/api/materials',
    method: 'POST',
    data: dto,
  });
  return data;
}

/**
 * 删除素材
 * 需要登录 + 作者校验（只能删自己的）
 * 删除时自动级联清理评论、点赞、收藏等关联数据
 * @param id - 素材ID
 */
export async function deleteMaterial(id: string): Promise<void> {
  await axiosForBackend({
    url: `/api/materials/${id}`,
    method: 'DELETE',
  });
}

/**
 * 切换素材点赞状态（点赞/取消点赞）
 * 需要登录
 * @param materialId - 素材ID
 */
export async function toggleMaterialLike(
  materialId: string,
): Promise<MaterialLikeStatusResponse> {
  const { data } = await axiosForBackend({
    url: `/api/materials/${materialId}/like`,
    method: 'POST',
  });
  return data;
}

/**
 * 查询素材点赞状态
 * 未登录只返回总数，已登录同时返回是否已点赞
 * @param materialId - 素材ID
 */
export async function getMaterialLikeStatus(
  materialId: string,
): Promise<MaterialLikeStatusResponse> {
  const { data } = await axiosForBackend({
    url: `/api/materials/${materialId}/like/status`,
    method: 'GET',
  });
  return data;
}
