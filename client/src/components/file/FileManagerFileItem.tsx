import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import FileManagerFileActionsMenu from './FileManagerFileActionsMenu';
import {
  FileAssetPreview,
  getFileAssetIcon,
  getFileAssetMediaKind,
} from '@/components/media/FileAssetPreview';

export interface FileItemData {
  id: string;
  name: string;
  type: string;
  mimeType?: string;
  size?: number;
  url: string;
  thumbnailUrl?: string;
}

interface FileManagerFileItemProps {
  file: FileItemData;
  viewMode: 'grid' | 'list';
  selected: boolean;
  onOpen: (file: FileItemData) => void;
  onToggleSelect: (fileId: string) => void;
  onToggleStar: (event: React.MouseEvent) => void;
  onShare: (event: React.MouseEvent) => void;
  onDownload: (event: React.MouseEvent) => void;
  onDelete: (event: React.MouseEvent) => void;
  formatSize: (bytes?: number) => string;
  isStarred: boolean;
}

const FileManagerFileItem: React.FC<FileManagerFileItemProps> = ({
  file,
  viewMode,
  selected,
  onOpen,
  onToggleSelect,
  onToggleStar,
  onShare,
  onDownload,
  onDelete,
  formatSize,
  isStarred,
}) => {
  const mediaKind = getFileAssetMediaKind(file);
  const canPreviewMedia =
    mediaKind === 'image' || mediaKind === 'video' || mediaKind === 'audio';

  if (viewMode === 'grid') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative group"
      >
        <Card className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md overflow-hidden">
          <CardContent className="p-0">
            <div
              className="aspect-square bg-accent/30 flex items-center justify-center relative"
              onClick={() => onOpen(file)}
            >
              {canPreviewMedia ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileAssetPreview file={file} mode="grid" stopMediaEvent />
                </div>
              ) : (
                getFileAssetIcon(file.type, file.mimeType)
              )}
              {isStarred && (
                <Star className="absolute top-2 right-2 w-4 h-4 text-yellow-500 fill-yellow-500" />
              )}
            </div>
            <div className="p-3">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
            </div>
          </CardContent>
        </Card>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelect(file.id)}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <FileManagerFileActionsMenu
            isStarred={isStarred}
            triggerVariant="secondary"
            onToggleStar={onToggleStar}
            onShare={onShare}
            onDownload={onDownload}
            onDelete={onDelete}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <Card
      className="cursor-pointer hover:border-primary/50 transition-all"
      onClick={() => onOpen(file)}
    >
      <CardContent className="p-3 flex items-center gap-3">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleSelect(file.id)}
          onClick={(event) => event.stopPropagation()}
        />
        {canPreviewMedia ? (
          <FileAssetPreview file={file} mode="list" stopMediaEvent />
        ) : (
          getFileAssetIcon(file.type, file.mimeType)
        )}
        <span className="flex-1 font-medium truncate">{file.name}</span>
        <span className="text-sm text-muted-foreground">{formatSize(file.size)}</span>
        <FileManagerFileActionsMenu
          isStarred={isStarred}
          triggerVariant="ghost"
          onToggleStar={onToggleStar}
          onShare={onShare}
          onDownload={onDownload}
          onDelete={onDelete}
        />
      </CardContent>
    </Card>
  );
};

export default FileManagerFileItem;
