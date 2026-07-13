import { axiosForBackend } from '@/compat/client-toolkit/utils/getAxiosForBackend';
import type {
  FavoriteFolderListResponse,
  FavoriteFolderItem,
  CreateFavoriteFolderRequest,
  CreateFavoriteFolderResponse,
  UpdateFavoriteFolderRequest,
  FavoriteFolderContentItem,
  AddFavoriteItemRequest,
} from '@shared/material.interface';

export async function getFavoriteFolders(): Promise<FavoriteFolderListResponse> {
  const { data } = await axiosForBackend({
    url: '/api/favorites/folders',
    method: 'GET',
  });
  return data;
}

export async function createFavoriteFolder(
  dto: CreateFavoriteFolderRequest,
): Promise<FavoriteFolderItem> {
  const { data } = await axiosForBackend({
    url: '/api/favorites/folders',
    method: 'POST',
    data: dto,
  });
  return data as FavoriteFolderItem;
}

export async function updateFavoriteFolder(
  id: string,
  dto: UpdateFavoriteFolderRequest,
): Promise<void> {
  await axiosForBackend({
    url: `/api/favorites/folders/${id}`,
    method: 'PUT',
    data: dto,
  });
}

export async function deleteFavoriteFolder(id: string): Promise<void> {
  await axiosForBackend({
    url: `/api/favorites/folders/${id}`,
    method: 'DELETE',
  });
}

export async function addToFolder(
  folderId: string,
  dto: AddFavoriteItemRequest,
): Promise<void> {
  await axiosForBackend({
    url: `/api/favorites/folders/${folderId}/items`,
    method: 'POST',
    data: dto,
  });
}

export async function removeFromFolder(
  folderId: string,
  itemId: string,
): Promise<void> {
  await axiosForBackend({
    url: `/api/favorites/folders/${folderId}/items/${itemId}`,
    method: 'DELETE',
  });
}

export async function getFolderItems(
  folderId: string,
): Promise<FavoriteFolderContentItem[]> {
  const { data } = await axiosForBackend({
    url: `/api/favorites/folders/${folderId}/items`,
    method: 'GET',
  });
  return data;
}
