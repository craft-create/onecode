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

    return (
      window.__platform__?.appId ||
      window.appId ||
      process.env.REACT_APP_APP_ID ||
      process.env.NEXT_PUBLIC_APP_ID ||
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
