import React from 'react';

export interface AppContainerProps {
  children: React.ReactNode;
  defaultTheme?: string;
  className?: string;
}

export const AppContainer: React.FC<AppContainerProps> = ({
  children,
  defaultTheme = 'light',
  className,
}) => {
  const safeClassName = `app-container app-container--theme-${defaultTheme}${
    className ? ` ${className}` : ''
  }`;

  return <div className={safeClassName}>{children}</div>;
};
