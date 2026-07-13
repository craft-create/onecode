import {
  UserService,
  type AccountType,
  type SearchUsersParams,
  type SearchUsersResponse,
  type BatchGetUsersResponse,
  type ConvertExternalContactResponse,
} from '@/compat/client-toolkit/tools/services';

const userService = new UserService();

/**
 * 搜索用户
 */
export async function searchUsers(
  params: SearchUsersParams,
): Promise<SearchUsersResponse> {
  return userService.searchUsers({ ...params, searchExternalContact: true });
}

/**
 * 批量根据用户 ID 查询用户信息
 */
export async function listUsersByIds(
  userIds: string[],
): Promise<BatchGetUsersResponse> {
  const normalizedIds = userIds
    .map((id) => String(id).trim())
    .filter(Boolean);
  return userService.listUsersByIds(normalizedIds);
}

/**
 * 调用开户接口，将外部联系人 ID 转换为已注册用户
 */
export async function convertExternalContact(
  externalUserId: string,
): Promise<ConvertExternalContactResponse> {
  return userService.convertExternalContact(externalUserId);
}

export type { AccountType, SearchUsersParams, SearchUsersResponse, BatchGetUsersResponse, ConvertExternalContactResponse };
