import React from 'react';
import { Button } from '@/components/ui/button';
import { Grid3X3, Home, List, Plus, Trash2, Upload } from 'lucide-react';
import type { FolderItem, ViewMode } from '../FileManagerPage';

interface FileManagerTopBarProps {
  breadcrumbs: FolderItem[];
  selectedCount: number;
  viewMode: ViewMode;
  onNavigateRoot: () => void;
  onNavigateCrumb: (crumb: FolderItem, index: number) => void;
  onNewFolder: () => void;
  onUpload: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBatchDelete: () => void;
  onViewModeChange: (viewMode: ViewMode) => void;
}

const FileManagerTopBar: React.FC<FileManagerTopBarProps> = ({
  breadcrumbs,
  selectedCount,
  viewMode,
  onNavigateRoot,
  onNavigateCrumb,
  onNewFolder,
  onUpload,
  onSelectAll,
  onClearSelection,
  onBatchDelete,
  onViewModeChange,
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onNavigateRoot}>
          <Home className="w-4 h-4" />
        </Button>
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb.id}>
            <span className="text-muted-foreground">/</span>
            <Button variant="ghost" size="sm" onClick={() => onNavigateCrumb(crumb, idx)}>
              {crumb.name}
            </Button>
          </React.Fragment>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <>
            <span className="text-sm text-muted-foreground">已选 {selectedCount} 项</span>
            <Button variant="destructive" size="sm" onClick={onBatchDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              删除
            </Button>
            <Button variant="outline" size="sm" onClick={onClearSelection}>
              取消选择
            </Button>
          </>
        )}
        <Button variant="ghost" size="sm" onClick={onUpload}>
          <Upload className="w-4 h-4 mr-2" />
          上传文件
        </Button>
        <Button variant="ghost" size="sm" onClick={onNewFolder}>
          <Plus className="w-4 h-4 mr-2" />
          新建文件夹
        </Button>
        <Button variant="ghost" size="sm" onClick={onSelectAll}>
          全选
        </Button>
        <div className="border-l pl-2 flex gap-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FileManagerTopBar;
