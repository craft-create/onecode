/**
 * 认证API调用层
 * 功能：封装用户注册、登录、登出、获取当前用户等接口
 * 使用平台提供的axiosForBackend自动处理鉴权和跨域
 */
import { axiosForBackend } from '@/compat/client-toolkit/utils/getAxiosForBackend';

/** 用户信息类型 */
export interface UserInfo {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  createdAt: string | null;
}

/** 当前用户信息类型（/me 接口返回） */
export interface CurrentUser {
  userId: string;
  nickname: string;
  avatarUrl: string | null;
}
export interface LoginResponse {
  token: string;
  user: UserInfo;
}

/**
 * 用户注册
 * @param nickname - 用户昵称
 * @param password - 密码
 */
export async function register(
  nickname: string,
  password: string,
): Promise<UserInfo> {
  const { data } = await axiosForBackend({
    url: '/api/auth/register',
    method: 'POST',
    data: { nickname, password },
  });
  return data;
}

/**
 * 用户登录
 * 登录成功后服务端会设置httpOnly cookie
 * @param nickname - 用户昵称
 * @param password - 密码
 */
export async function login(
  nickname: string,
  password: string,
): Promise<LoginResponse> {
  const { data } = await axiosForBackend({
    url: '/api/auth/login',
    method: 'POST',
    data: { nickname, password },
  });
  return data;
}

/**
 * 获取当前登录用户信息
 * 未登录时返回 null
 */
export async function getMe(): Promise<CurrentUser | null> {
  const token = localStorage.getItem('token');
  const { data } = await axiosForBackend({
    url: '/api/auth/me',
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return data;
}

/**
 * 退出登录
 * 服务端会清除auth_token cookie
 */
export async function logout(): Promise<{ message: string }> {
  const { data } = await axiosForBackend({
    url: '/api/auth/logout',
    method: 'POST',
  });
  return data;
}

/**
 * 上传用户头像
 * @param file - 图片文件（jpg/png/gif/webp，最大5MB）
 */
export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await axiosForBackend({
    url: '/api/auth/avatar',
    method: 'POST',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
