import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AppContainer } from '@/compat/client-toolkit/components/AppContainer';
import { ErrorRender } from '@/compat/client-toolkit/components/ErrorRender';

import RoutesComponent from './app';
import { AuthProvider } from '@client/src/hooks/useAuth';
import './index.css';
import { createPortal } from 'react-dom';
import { Toaster } from '@client/src/components/ui/sonner';

const getEnv = (key: string, fallback: string): string => {
  const browserValue =
    (import.meta as ImportMeta & {
      env?: {
        [key: string]: string | undefined;
      };
    }).env?.[`VITE_${key}`];

  if (browserValue !== undefined && browserValue !== '') {
    return browserValue;
  }

  const viteEnv =
    (import.meta as ImportMeta & {
      env?: {
        [key: string]: string | undefined;
      };
    }).env;

  if (viteEnv) {
    return viteEnv[key] || fallback;
  }

  return fallback;
};

const CLIENT_BASE_PATH = getEnv('CLIENT_BASE_PATH', '/');
const APP_ID_FALLBACK = getEnv('CLIENT_APP_ID', getEnv('APP_ID', 'local-app'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

type WindowWithRuntime = Window & {
    appId?: string;
    __platform__?: {
      appId?: string;
    };
    __BASENAME__?: string;
  };

const win = window as WindowWithRuntime;
if (!win.__platform__) {
  win.__platform__ = {
    appId: APP_ID_FALLBACK,
  };
} else if (!win.__platform__.appId) {
  win.__platform__.appId = APP_ID_FALLBACK;
}
if (!win.appId) {
  win.appId = APP_ID_FALLBACK;
}

const runtimeBasePath = (window as Window & { __BASENAME__?: string })
  .__BASENAME__;
if (
  runtimeBasePath &&
  runtimeBasePath !== '/' &&
  window.location.pathname === '/'
) {
  window.location.replace(runtimeBasePath);
}

const MainApp = () => {
  return (
    <BrowserRouter basename={CLIENT_BASE_PATH}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <AppContainer defaultTheme="light">
            <ErrorBoundary
              fallbackRender={({ error, resetErrorBoundary }) => (
                <ErrorRender
                  error={error as Error}
                  resetErrorBoundary={resetErrorBoundary}
                />
              )}
            >
              <RoutesComponent />
              {createPortal(<Toaster />, document.body)}
            </ErrorBoundary>
          </AppContainer>
        </QueryClientProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

createRoot(document.getElementById('root')!).render(<MainApp />);
