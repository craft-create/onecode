import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScriptsPageHeaderProps {
  total: number;
  canCreate: boolean;
  onCreate: () => void;
}

const ScriptsPageHeader: React.FC<ScriptsPageHeaderProps> = ({
  total,
  canCreate,
  onCreate,
}) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(220_15%_90%)] font-['Space_Grotesk']">
          剧本项目
        </h1>
        <p className="text-[hsl(220_10%_55%)] mt-1 text-sm">
          {total} 个项目
        </p>
      </div>
      {canCreate ? (
        <Button
          onClick={onCreate}
          className="app-btn-primary gap-2 shadow-[0_0_20px_-4px_rgba(124_92_255_0.4)]"
        >
          <Plus className="size-4" />
          新建项目
        </Button>
      ) : null}
    </div>
  );
};

export default ScriptsPageHeader;

