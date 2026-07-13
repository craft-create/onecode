import { useMemo } from 'react';

export interface AppInfo {
  appName: string;
  appId: string;
}

export function useAppInfo(): AppInfo {
  const appId = useMemo<string>(() => {
    if (typeof window === 'undefined') {
      return 'local-app';
    }

    const viteEnv =
      (import.meta as { env?: Record<string, string> }).env || {};

    return (
      window.__platform__?.appId ||
      window.appId ||
      viteEnv.VITE_CLIENT_APP_ID ||
      viteEnv.VITE_APP_ID ||
      'local-app'
    );
  }, []);

  const appName = useMemo<string>(() => {
    if (typeof document !== 'undefined' && document.title) {
      return document.title;
    }

    return '光影工坊';
  }, []);

  return {
    appName,
    appId,
  };
}
