import React from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ScriptsPageToolbarProps {
  keyword: string;
  onKeywordChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSortToggle: () => void;
  sortLabel: string;
}

const ScriptsPageToolbar: React.FC<ScriptsPageToolbarProps> = ({
  keyword,
  onKeywordChange,
  onSortToggle,
  sortLabel,
}) => {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[hsl(220_10%_55%)]" />
        <Input
          placeholder="搜索项目名称或描述..."
          value={keyword}
          onChange={onKeywordChange}
          className="pl-10 bg-[hsl(228_14%_12%)] border-[hsl(228_12%_18%)] text-[hsl(220_15%_90%)] placeholder:text-[hsl(220_10%_55%)]"
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onSortToggle}
        className="gap-2 border-[hsl(228_12%_18%)] text-[hsl(220_10%_55%)] hover:text-[hsl(220_15%_90%)]"
      >
        <ArrowUpDown className="size-3.5" />
        {sortLabel}
      </Button>
    </div>
  );
};

export default ScriptsPageToolbar;
