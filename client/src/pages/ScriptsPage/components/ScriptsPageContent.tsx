import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Film, AlertTriangle, RefreshCw } from 'lucide-react';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { Button } from '@/components/ui/button';
import ScriptProjectCard from './ScriptProjectCard';
import type { ScriptProjectItem } from '@shared/script.interface';

interface ScriptsPageContentProps {
  fetchError: string;
  loading: boolean;
  projects: ScriptProjectItem[];
  onRetry: () => void;
  onOpen: (projectId: string) => void;
  onDelete: (project: ScriptProjectItem) => void;
  canDelete: (project: ScriptProjectItem) => boolean;
  typeLabel: (type: string) => string;
  formatTime: (iso: string) => string;
}

const ScriptsPageContent: React.FC<ScriptsPageContentProps> = ({
  fetchError,
  loading,
  projects,
  onRetry,
  onOpen,
  onDelete,
  canDelete,
  typeLabel,
  formatTime,
}) => {
  if (fetchError && !loading) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 text-center">
        <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
        <p className="text-foreground text-sm mb-4">{fetchError}</p>
        <Button onClick={onRetry} className="app-btn-primary">
          <RefreshCw className="w-4 h-4" />
          重试
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg bg-[hsl(228_14%_12%)] animate-pulse h-64"
          />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Film className="size-6" />
          </EmptyMedia>
          <EmptyTitle>暂无剧本项目</EmptyTitle>
          <EmptyDescription>
            点击右上角「新建项目」开始创作
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      <AnimatePresence mode="popLayout">
        {projects.map((project, idx) => (
          <ScriptProjectCard
            key={project.id}
            project={project}
            index={idx}
            onOpen={onOpen}
            onDelete={onDelete}
            canDelete={canDelete(project)}
            typeLabel={typeLabel(project.type)}
            formatTime={formatTime}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ScriptsPageContent;

