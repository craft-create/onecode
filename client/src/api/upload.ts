/**
 * 文件上传API调用层
 * 功能：封装文件上传接口
 * 使用平台提供的axiosForBackend自动处理鉴权和跨域
 */
import { axiosForBackend } from '@client/compat/client-toolkit/utils/getAxiosForBackend';

/** 上传响应类型 */
export interface UploadResponse {
  url: string;
  thumbnailUrl?: string;
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
  const { data } = await axiosForBackend({
    url: '/api/upload',
    method: 'POST',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
