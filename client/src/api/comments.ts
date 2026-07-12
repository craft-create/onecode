import { axiosForBackend } from '@client/compat/client-toolkit/utils/getAxiosForBackend';
import type {
  MaterialCommentListResponse,
  MaterialCommentItem,
  CreateMaterialCommentRequest,
  CreateMaterialCommentResponse,
  CommentLikeStatusResponse,
} from '@shared/material.interface';

export async function getMaterialComments(
  materialId: string,
): Promise<MaterialCommentListResponse> {
  const { data } = await axiosForBackend({
    url: `/api/materials/${materialId}/comments`,
    method: 'GET',
  });
  return data;
}

export async function createMaterialComment(
  materialId: string,
  dto: CreateMaterialCommentRequest,
): Promise<MaterialCommentItem> {
  const { data } = await axiosForBackend({
    url: `/api/materials/${materialId}/comments`,
    method: 'POST',
    data: dto,
  });
  return data as MaterialCommentItem;
}

export async function deleteMaterialComment(
  materialId: string,
  commentId: string,
): Promise<void> {
  await axiosForBackend({
    url: `/api/materials/${materialId}/comments/${commentId}`,
    method: 'DELETE',
  });
}

export async function toggleCommentLike(
  commentId: string,
): Promise<CommentLikeStatusResponse> {
  const { data } = await axiosForBackend({
    url: `/api/comments/${commentId}/like`,
    method: 'POST',
  });
  return data;
}
