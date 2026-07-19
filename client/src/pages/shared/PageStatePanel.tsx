import type { ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export function PageLoadingState({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

export function PageErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 text-center max-w-md mx-4">
        <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
        <p className="text-foreground text-sm mb-4">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="app-btn-primary"
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </button>
        )}
      </div>
    </div>
  );
}

export function PageEmptyState({
  message,
  description,
  action,
}: {
  message: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <p className="text-lg font-medium mb-1">{message}</p>
      {description ? <p className="text-sm">{description}</p> : null}
      {action}
    </div>
  );
}

