import React from 'react';
import MaterialUploadEntryItem from '@client/src/components/material/MaterialUploadEntryItem';
import type { FileEntry } from '../MaterialUploadPage';

interface MaterialUploadFileListProps {
  entries: FileEntry[];
  formatSize: (size: number) => string;
  onOpenForm: (entry: FileEntry) => void;
  onRetry: (entry: FileEntry) => void;
  onRemove: (id: string) => void;
}

const MaterialUploadFileList: React.FC<MaterialUploadFileListProps> = ({
  entries,
  formatSize,
  onOpenForm,
  onRetry,
  onRemove,
}) => {
  return (
    <div className="mt-6 space-y-3">
      <h2 className="text-sm font-medium text-foreground">上传列表 ({entries.length})</h2>
      {entries.map((entry) => (
        <MaterialUploadEntryItem
          key={entry.id}
          entry={entry}
          formatSize={formatSize}
          onOpenForm={onOpenForm}
          onRetry={onRetry}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

export default MaterialUploadFileList;
