import { axiosForBackend } from '@/compat/client-toolkit/utils/getAxiosForBackend';
import type { SearchResponse } from '@shared/search.interface';

export async function globalSearch(params: {
  keyword: string;
  type?: string;
}): Promise<SearchResponse> {
  const queryParams = new URLSearchParams();
  queryParams.set('keyword', params.keyword);
  if (params.type) queryParams.set('type', params.type);

  const { data } = await axiosForBackend({
    url: `/api/search?${queryParams.toString()}`,
    method: 'GET',
  });
  return data;
}
