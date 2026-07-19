import React from 'react';
import { File, Film, Image, Music } from 'lucide-react';

export type UploadMediaKind = 'video' | 'audio' | 'image' | 'other';

export interface UploadEntryPreviewData {
  file: File;
  localPreviewUrl?: string;
  uploadedUrl?: string;
  thumbnailUrl?: string;
  status?: 'pending' | 'uploading' | 'done' | 'error';
}

export const getUploadMediaKind = (file: File): UploadMediaKind => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'other';
};

export const isImageFile = (file: File): boolean => getUploadMediaKind(file) === 'image';
export const isVideoFile = (file: File): boolean => getUploadMediaKind(file) === 'video';
export const isAudioFile = (file: File): boolean => getUploadMediaKind(file) === 'audio';

export const getMaterialType = (file: File): 'video' | 'audio' | 'sound' => {
  if (isVideoFile(file)) return 'video';
  if (isAudioFile(file)) return 'audio';
  return 'sound';
};

export const getUploadFileIcon = (file: File) => {
  const kind = getUploadMediaKind(file);
  if (kind === 'video') return <Film className="w-6 h-6 text-muted-foreground" />;
  if (kind === 'audio') return <Music className="w-6 h-6 text-muted-foreground" />;
  if (kind === 'image') return <Image className="w-6 h-6 text-muted-foreground" />;
  return <File className="w-6 h-6 text-muted-foreground" />;
};

export const UploadEntryMediaPreview = ({
  entry,
}: {
  entry: UploadEntryPreviewData;
}): React.ReactNode => {
  if (isImageFile(entry.file)) {
    if (!entry.localPreviewUrl) return null;
    return (
      <img
        src={entry.localPreviewUrl}
        alt={entry.file.name}
        className="w-full h-full object-cover"
      />
    );
  }

  if (isVideoFile(entry.file)) {
    if (entry.thumbnailUrl) {
      return (
        <img
          src={entry.thumbnailUrl}
          alt={entry.file.name}
          className="w-full h-full object-cover"
        />
      );
    }

    if (entry.localPreviewUrl) {
      return (
        <video
          src={entry.localPreviewUrl}
          className="w-full h-full object-cover"
          muted
          controls={entry.status === 'done'}
          playsInline
        />
      );
    }
  }

  if (isAudioFile(entry.file)) {
    const previewSrc = entry.status === 'done' ? entry.uploadedUrl || entry.localPreviewUrl : entry.localPreviewUrl;
    if (previewSrc) {
      return (
        <audio
          src={previewSrc}
          controls
          className="w-full"
          preload="metadata"
        >
          您的浏览器不支持音频播放
        </audio>
      );
    }
  }

  return null;
};

export const UploadFormMediaPreview = ({
  entry,
  className = 'w-full max-h-48',
}: {
  entry: UploadEntryPreviewData;
  className?: string;
}): React.ReactNode => {
  if (isImageFile(entry.file) && entry.localPreviewUrl) {
    return (
      <div className="mb-4 rounded-lg overflow-hidden border border-border bg-accent/30">
        <img
          src={entry.localPreviewUrl}
          alt="预览"
          className={`${className} object-contain`}
        />
      </div>
    );
  }

  if (isVideoFile(entry.file)) {
    if (entry.thumbnailUrl) {
      return (
        <div className="mb-4 rounded-lg overflow-hidden border border-border bg-accent/30">
          <img
            src={entry.thumbnailUrl}
            alt="视频封面"
            className={`${className} object-cover`}
          />
        </div>
      );
    }

    if (entry.localPreviewUrl) {
      return (
        <div className="mb-4 rounded-lg overflow-hidden border border-border bg-accent/30">
          <video src={entry.localPreviewUrl} controls className={className} />
        </div>
      );
    }
  }

  if (isAudioFile(entry.file) && entry.localPreviewUrl) {
    return (
      <div className="mb-4 rounded-lg border border-border bg-accent/30 p-3">
        <audio
          src={entry.localPreviewUrl}
          controls
          preload="metadata"
          className="w-full"
        >
          您的浏览器不支持音频播放
        </audio>
      </div>
    );
  }

  return null;
};
