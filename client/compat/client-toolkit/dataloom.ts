import { axiosForBackend } from './utils/getAxiosForBackend';
import { getDefaultBucketId } from './tools/storage';

export interface DataloomUploadResponse {
  data: {
    id: string;
    file_path: string;
    bucket_id: string;
    download_url: string;
  };
  error?: Error;
}

export interface DataloomBucket {
  uploadFile: (file: File) => Promise<DataloomUploadResponse>;
}

export interface DataloomClient {
  storage: {
    from: (bucketId: string) => DataloomBucket;
  };
}

interface UploadResultFromBackend {
  url?: string;
  filename?: string;
  size?: number;
  mimeType?: string;
  thumbnailUrl?: string;
}

async function requestUpload(file: File): Promise<UploadResultFromBackend> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axiosForBackend<UploadResultFromBackend>({
    method: 'POST',
    url: '/api/upload',
    data: formData,
  });

  return response.data;
}

function buildDownloadUrl(path: string): string {
  if (path.startsWith('http')) return path;
  if (typeof window === 'undefined') return path;
  const current = window.location;
  return `${current.origin}${path.startsWith('/') ? '' : '/'}${path}`;
}

const toDataloomResponse = (payload: UploadResultFromBackend): Omit<DataloomUploadResponse['data'], never> => {
  const filePath = payload.url || '';
  return {
    id: payload.filename || crypto.randomUUID(),
    file_path: filePath,
    bucket_id: getDefaultBucketId(),
    download_url: buildDownloadUrl(filePath || `/${payload.filename || ''}`),
  };
};

export async function getDataloom(): Promise<DataloomClient> {
  return {
    storage: {
      from: (_bucketId: string) => ({
        uploadFile: async (file: File) => {
          try {
            const payload = await requestUpload(file);
            return {
              data: toDataloomResponse(payload),
            };
          } catch (error) {
            return {
              data: {
                id: crypto.randomUUID(),
                file_path: '',
                bucket_id: getDefaultBucketId(),
                download_url: '',
              },
              error: error as Error,
            };
          }
        },
      }),
    },
  };
}
