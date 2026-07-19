import {
  Check,
  Clock,
  Download,
  FileAudio,
  FileType,
  FileVideo,
  HardDrive,
  Heart,
  Monitor,
  Tag,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { MaterialDetail } from '@shared/material.interface';
import { memo } from 'react';

interface MaterialDetailSidePanelProps {
  detail: MaterialDetail;
  isFavorited: boolean;
  downloading: boolean;
  downloadDone: boolean;
  onDownload: () => void;
  onFavorite: () => void;
  formatDuration: (seconds: number) => string;
  formatFileSize: (bytes: number) => string;
}

export const MaterialDetailSidePanel = memo(({
  detail,
  isFavorited,
  downloading,
  downloadDone,
  onDownload,
  onFavorite,
  formatDuration,
  formatFileSize,
}: MaterialDetailSidePanelProps) => {
  const formatIcon = () => {
    if (detail.type === 'video') {
      return <FileVideo className="w-3.5 h-3.5" />;
    }
    if (detail.type === 'audio' || detail.type === 'sound') {
      return <FileAudio className="w-3.5 h-3.5" />;
    }
    return <FileType className="w-3.5 h-3.5" />;
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <h1 className="text-lg font-semibold text-foreground mb-3">
          {detail.title}
        </h1>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onDownload}
            disabled={downloading}
            className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium transition-all ${
              downloadDone
                ? 'bg-success text-white'
                : 'bg-primary text-primary-foreground hover:shadow-[0_0_20px_-4px_rgba(139_92_246_0.4)]'
            }`}
          >
            {downloading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : downloadDone ? (
              <Check className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>
              {downloading ? '准备中...' : downloadDone ? '已完成' : '下载'}
            </span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onFavorite}
            className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all ${
              isFavorited
                ? 'border-red-500/40 bg-red-500/10 text-red-400'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
            }`}
          >
            <Heart className="w-4 h-4" fill={isFavorited ? 'currentColor' : 'none'} />
          </motion.button>
        </div>

        {detail.download_count > 0 && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <Download className="w-3 h-3" />
            <span>已下载 {detail.download_count.toLocaleString()} 次</span>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <h2 className="text-sm font-medium text-foreground mb-3">素材参数</h2>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5" />
              分辨率
            </span>
            <span className="text-foreground">{detail.resolution || '-'}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              时长
            </span>
            <span className="text-foreground">
              {detail.duration > 0 ? formatDuration(detail.duration) : '-'}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5" />
              大小
            </span>
            <span className="text-foreground">
              {detail.file_size > 0 ? formatFileSize(detail.file_size) : '-'}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              {formatIcon()}
              格式
            </span>
            <span className="text-foreground">{detail.format || '-'}</span>
          </div>

          {detail.device && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">设备</span>
              <span className="text-foreground">{detail.device}</span>
            </div>
          )}

          {detail.download_count > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                下载次数
              </span>
              <span className="text-foreground">{detail.download_count.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {detail.tags && detail.tags.length > 0 ? (
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-sm font-medium text-foreground mb-3 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            标签
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {detail.tags.map((tag: string) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full bg-accent text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
});

MaterialDetailSidePanel.displayName = 'MaterialDetailSidePanel';
