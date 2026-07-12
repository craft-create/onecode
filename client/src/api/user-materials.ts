import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  UserMaterialListResponse,
  FavoriteMaterialListResponse,
  DownloadHistoryListResponse,
  FavoriteCategoryRequest,
  FavoriteCategoryResponse,
  FavoriteMaterialRequest,
  FavoriteMaterialResponse,
} from '@shared/material.interface';

export async function getUserUploads(params: {
  page?: number;
  pageSize?: number;
}): Promise<UserMaterialListResponse> {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', String(params.page));
  if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));

  const qs = queryParams.toString();
  const { data } = await axiosForBackend({
    url: `/api/user/materials/upload${qs ? `?${qs}` : ''}`,
    method: 'GET',
  });
  return data;
}

export async function getUserUploadsByUserId(params: {
  userId: string;
  page?: number;
  pageSize?: number;
}): Promise<UserMaterialListResponse> {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', String(params.page));
  if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));

  const qs = queryParams.toString();
  const { data } = await axiosForBackend({
    url: `/api/user/users/${params.userId}/materials/upload${qs ? `?${qs}` : ''}`,
    method: 'GET',
  });
  return data;
}

export async function getUserFavorites(params: {
  categoryId?: string;
  page?: number;
  pageSize?: number;
}): Promise<FavoriteMaterialListResponse> {
  const queryParams = new URLSearchParams();
  if (params.categoryId) queryParams.set('categoryId', params.categoryId);
  if (params.page) queryParams.set('page', String(params.page));
  if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));

  const qs = queryParams.toString();
  const { data } = await axiosForBackend({
    url: `/api/user/materials/favorite${qs ? `?${qs}` : ''}`,
    method: 'GET',
  });
  return data;
}

export async function getUserDownloads(params: {
  page?: number;
  pageSize?: number;
}): Promise<DownloadHistoryListResponse> {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', String(params.page));
  if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));

  const qs = queryParams.toString();
  const { data } = await axiosForBackend({
    url: `/api/user/materials/download${qs ? `?${qs}` : ''}`,
    method: 'GET',
  });
  return data;
}

export async function getFavoriteCategories(): Promise<
  { id: string; name: string }[]
> {
  const { data } = await axiosForBackend({
    url: '/api/user/favorite-categories',
    method: 'GET',
  });
  return data;
}

export async function toggleFavorite(
  dto: FavoriteMaterialRequest,
): Promise<FavoriteMaterialResponse> {
  const { data } = await axiosForBackend({
    url: '/api/user/materials/favorite',
    method: 'POST',
    data: dto,
  });
  return data;
}

export async function manageFavoriteCategory(
  dto: FavoriteCategoryRequest,
): Promise<FavoriteCategoryResponse> {
  const { data } = await axiosForBackend({
    url: '/api/user/favorite-categories',
    method: 'POST',
    data: dto,
  });
  return data;
}
