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

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={
        className ||
        'flex flex-wrap items-center justify-between gap-4'
      }
    >
      <div>
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        {description ? (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        ) : null}
      </div>
      {action ? action : null}
    </div>
  );
}

interface PageFrameProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  containerClassName?: string;
  contentClassName?: string;
  children: ReactNode;
}

export function PageFrame({
  title,
  description,
  action,
  className = 'min-h-screen bg-background',
  containerClassName = 'max-w-7xl mx-auto px-6 py-8',
  contentClassName = 'space-y-6',
  children,
}: PageFrameProps) {
  const hasHeader = Boolean(title || description || action);

  return (
    <PageShell className={className} containerClassName={containerClassName}>
      <div className={contentClassName}>
        {hasHeader ? <PageHeader title={title || ''} description={description} action={action} /> : null}
        {children}
      </div>
    </PageShell>
  );
}
