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

const CLIENT_BASE_PATH = process.env.CLIENT_BASE_PATH || '/';
const APP_ID_FALLBACK = process.env.CLIENT_APP_ID || process.env.APP_ID || 'local-app';

type WindowWithRuntime = Window &
  Readonly<{}>
  & {
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
