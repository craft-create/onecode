import React from 'react';
import { motion } from 'framer-motion';
import { Check, Upload, Loader2, X } from 'lucide-react';
import {
  UploadEntryMediaPreview,
  getUploadFileIcon,
  isAudioFile,
  isImageFile,
  isVideoFile,
} from '@/components/media/MaterialUploadPreview';

export interface UploadEntryItemData {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  uploadedUrl?: string;
  localPreviewUrl?: string;
  thumbnailUrl?: string;
}

interface MaterialUploadEntryItemProps {
  entry: UploadEntryItemData;
  onOpenForm: (entry: UploadEntryItemData) => void;
  onRetry: (entry: UploadEntryItemData) => void;
  onRemove: (entryId: string) => void;
  formatSize: (bytes: number) => string;
}

const MaterialUploadEntryItem: React.FC<MaterialUploadEntryItemProps> = ({
  entry,
  onOpenForm,
  onRetry,
  onRemove,
  formatSize,
}) => {
  const showMediaPreview = isImageFile(entry.file) || isVideoFile(entry.file) || isAudioFile(entry.file);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
      <div className="w-14 h-14 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 overflow-hidden">
        {showMediaPreview ? (
          <UploadEntryMediaPreview entry={entry} />
        ) : (
          getUploadFileIcon(entry.file)
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{entry.file.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatSize(entry.file.size)}
          {entry.uploadedUrl && <span className="ml-2 text-success">· 已上传</span>}
        </p>
        {entry.status === 'uploading' && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-accent overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${entry.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {entry.progress}%
            </span>
          </div>
        )}
        {entry.status === 'error' && (
          <p className="text-xs text-destructive mt-1">上传失败，点击重试</p>
        )}
      </div>

      <div className="flex items-center gap-1">
        {entry.status === 'done' ? (
          <button
            onClick={(event) => {
              event.stopPropagation();
              onOpenForm(entry);
            }}
            title="填写素材信息"
            className="p-1.5 rounded-lg hover:bg-accent text-success hover:text-foreground transition-colors"
          >
            <Check className="w-4 h-4" />
          </button>
        ) : entry.status === 'uploading' ? (
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
        ) : entry.status === 'error' ? (
          <button
            onClick={(event) => {
              event.stopPropagation();
              onRetry(entry);
            }}
            className="p-1.5 rounded-lg hover:bg-accent text-destructive hover:text-foreground transition-colors"
          >
            <Upload className="w-4 h-4" />
          </button>
        ) : (
          <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
        )}
        <button
          onClick={(event) => {
            event.stopPropagation();
            onRemove(entry.id);
          }}
          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default MaterialUploadEntryItem;
