/**
 * 文件上传API调用层
 * 功能：封装文件上传接口
 * 上传请求会自动带 token 与跨域凭据
 */
import axios from 'axios';

/** 上传响应类型 */
export interface UploadResponse {
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  resolution?: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
}

/**
 * 上传文件
 * @param file - 要上传的文件对象
 */
export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData: FormData = new FormData();
  formData.append('file', file);

  const headers: Record<string, string> = {
    'Content-Type': 'multipart/form-data',
    'X-Requested-With': 'XMLHttpRequest',
  };
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const requestConfig = {
    headers,
    withCredentials: true,
  };

  try {
    const { data } = await axios.post('/api/upload', formData, requestConfig);
    return data as UploadResponse;
  } catch (error: unknown) {
    const axiosError: any = error as any;
    if (axiosError?.response?.status === 404) {
      const { data } = await axios.post('/upload', formData, requestConfig);
      return data as UploadResponse;
    }
    throw error;
  }
}
