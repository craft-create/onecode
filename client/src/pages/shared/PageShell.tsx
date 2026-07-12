import type { ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
}

export function PageShell({
  children,
  className = 'min-h-screen bg-background',
  containerClassName,
}: PageShellProps) {
  if (containerClassName) {
    return (
      <div className={className}>
        <div className={containerClassName}>{children}</div>
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}

export function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <h1 className="text-3xl font-bold text-foreground">{title}</h1>
      {action}
    </div>
  );
}

