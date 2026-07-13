import React from 'react';
import { logger } from '../logger';

export interface ErrorRenderProps {
  error: unknown;
  resetErrorBoundary?: () => void;
}

export const ErrorRender: React.FC<ErrorRenderProps> = ({
  error,
  resetErrorBoundary,
}) => {
  const message = error instanceof Error ? error.message : String(error);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="max-w-xl w-full rounded-lg border border-border p-6 space-y-4 bg-card">
        <h1 className="text-lg font-semibold text-destructive">页面渲染失败</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        {resetErrorBoundary ? (
          <button
            type="button"
            className="inline-flex rounded-md border border-border px-3 py-1 text-sm hover:bg-accent"
            onClick={() => {
              logger.error('resetErrorBoundary called');
              resetErrorBoundary();
            }}
          >
            重试
          </button>
        ) : null}
      </div>
    </div>
  );
};
