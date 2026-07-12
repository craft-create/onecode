import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

import { AppContainer } from '@client/compat/client-toolkit/components/AppContainer';
import { ErrorRender } from '@client/compat/client-toolkit/components/ErrorRender';

import RoutesComponent from './app.tsx';
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
      </AuthProvider>
    </BrowserRouter>
  );
};

createRoot(document.getElementById('root')!).render(<MainApp />);
