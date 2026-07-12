import { axiosForBackend } from '@client/compat/client-toolkit/utils/getAxiosForBackend';
import type {
  FollowStatusResponse,
  FollowListResponse,
} from '@shared/follow.interface';

export async function toggleFollow(
  userId: string,
): Promise<FollowStatusResponse> {
  const { data } = await axiosForBackend({
    url: `/api/follow/${userId}`,
    method: 'POST',
  });
  return data;
}

export async function getFollowStatus(
  userId: string,
): Promise<FollowStatusResponse> {
  const { data } = await axiosForBackend({
    url: `/api/follow/${userId}/status`,
    method: 'GET',
  });
  return data;
}

export async function getFollowers(
  userId: string,
): Promise<FollowListResponse> {
  const { data } = await axiosForBackend({
    url: `/api/follow/${userId}/followers`,
    method: 'GET',
  });
  return data;
}

export async function getFollowing(
  userId: string,
): Promise<FollowListResponse> {
  const { data } = await axiosForBackend({
    url: `/api/follow/${userId}/following`,
    method: 'GET',
  });
  return data;
}
