import React from 'react';

export const NotFoundRender: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="text-center space-y-3">
        <p className="text-2xl font-semibold">404</p>
        <p className="text-sm text-muted-foreground">抱歉，页面不存在。</p>
      </div>
    </div>
  );
};
