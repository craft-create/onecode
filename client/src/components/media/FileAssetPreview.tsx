import React from 'react';
import { File, Folder, Image, Film, Music, FileText, Archive } from 'lucide-react';

export type FileAssetKind = 'folder' | 'image' | 'video' | 'audio' | 'other';

export interface FileAssetSource {
  type: string;
  name: string;
  mimeType?: string;
  url: string;
  thumbnailUrl?: string;
}

export const getFileAssetMediaKind = (file: FileAssetSource): FileAssetKind => {
  if (file.type === 'folder') return 'folder';
  if (file.mimeType?.startsWith('image/') || file.type === 'image') return 'image';
  if (file.mimeType?.startsWith('video/') || file.type === 'video') return 'video';
  if (file.mimeType?.startsWith('audio/') || file.type === 'audio') return 'audio';
  return 'other';
};

export const getFileAssetIcon = (type: string, mimeType?: string) => {
  if (type === 'folder') return <Folder className="w-8 h-8 text-blue-500" />;
  if (type === 'audio') return <Music className="w-8 h-8 text-yellow-500" />;
  if (type === 'video' && !mimeType?.startsWith('video/')) {
    return <Film className="w-8 h-8 text-purple-500" />;
  }
  if (mimeType?.startsWith('image/')) return <Image className="w-8 h-8 text-green-500" />;
  if (mimeType?.startsWith('video/')) return <Film className="w-8 h-8 text-purple-500" />;
  if (mimeType?.startsWith('audio/')) return <Music className="w-8 h-8 text-yellow-500" />;
  if (mimeType?.includes('pdf') || mimeType?.includes('document')) {
    return <FileText className="w-8 h-8 text-red-500" />;
  }
  if (mimeType?.includes('zip') || mimeType?.includes('compressed')) {
    return <Archive className="w-8 h-8 text-orange-500" />;
  }
  return <File className="w-8 h-8 text-gray-500" />;
};

type FileAssetPreviewProps = {
  file: FileAssetSource;
  mode: 'grid' | 'list';
  stopMediaEvent?: boolean;
};

export const FileAssetPreview = ({ file, mode, stopMediaEvent }: FileAssetPreviewProps): React.ReactNode => {
  const kind = getFileAssetMediaKind(file);
  const mediaClassName =
    mode === 'grid'
      ? 'w-full h-full object-cover'
      : 'w-10 h-10 object-cover rounded';
  const videoClassName =
    mode === 'grid'
      ? 'w-full h-full object-cover'
      : 'w-20 h-10 rounded object-cover';
  const audioClassName =
    mode === 'grid'
      ? 'w-full px-3'
      : 'w-48';

  const commonProps = stopMediaEvent
    ? {
        onClick: (event: React.MouseEvent) => {
          event.stopPropagation();
        },
      }
    : undefined;

  if (kind === 'image') {
    const imageUrl = file.thumbnailUrl || file.url;
    return (
      <img
        src={imageUrl}
        alt={file.name}
        className={mediaClassName}
      />
    );
  }

  if (kind === 'video') {
    return (
      <video
        src={file.url}
        poster={file.thumbnailUrl || undefined}
        controls
        preload="metadata"
        className={videoClassName}
        {...commonProps}
      >
        您的浏览器不支持视频播放
      </video>
    );
  }

  if (kind === 'audio') {
    return (
      <audio
        src={file.url}
        controls
        preload="metadata"
        className={audioClassName}
        {...commonProps}
      >
        您的浏览器不支持音频播放
      </audio>
    );
  }

  return null;
};
