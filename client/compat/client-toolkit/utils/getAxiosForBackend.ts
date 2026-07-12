import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';

export interface ToolkitAxiosConfig<T = unknown> extends AxiosRequestConfig<T> {}

const withBackendBase = <T,>(config: ToolkitAxiosConfig<T>): ToolkitAxiosConfig<T> => {
  const normalizedConfig: ToolkitAxiosConfig<T> = {
    ...config,
    withCredentials: true,
    headers: {
      ...config.headers,
      'X-Requested-With': 'XMLHttpRequest',
    },
  };

  const rawUrl = config.url;
  const token =
    typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    normalizedConfig.headers = {
      ...normalizedConfig.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  if (typeof rawUrl === 'string' && rawUrl.length > 0) {
    if (rawUrl.startsWith('/api/')) {
      normalizedConfig.url = rawUrl;
    } else if (rawUrl.startsWith('/')) {
      normalizedConfig.url = `/api${rawUrl}`;
    } else {
      normalizedConfig.url = `/api/${rawUrl}`;
    }
  }

  return normalizedConfig;
};

export const axiosForBackend = async <T = unknown>(
  config: ToolkitAxiosConfig,
): Promise<AxiosResponse<T>> => {
  return axios.request<T>(withBackendBase(config));
};
