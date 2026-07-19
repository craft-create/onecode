import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/utils/logger';
import { formatBytes } from '@/utils/formatBytes';
import { createMaterial } from '@client/src/api/materials';
import { uploadFile } from '@client/src/api/upload';
import { useAuth } from '@client/src/hooks/useAuth';
import type { CreateMaterialRequest } from '@shared/material.interface';
import { PageFrame } from '../shared/PageShell';
import {
  UploadFormMediaPreview,
  getMaterialType,
  isAudioFile,
  isImageFile,
  isVideoFile,
} from '@client/src/components/media/MaterialUploadPreview';
import MaterialUploadFormDialog from '@client/src/components/material/MaterialUploadFormDialog';
import MaterialUploadDropZone from './components/MaterialUploadDropZone';
import MaterialUploadFileList from './components/MaterialUploadFileList';

export interface FileEntry {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  /** 本地预览 URL（图片缩略图 / 视频播放器） */
  localPreviewUrl?: string;
  /** 上传成功后服务端返回的文件 URL */
  uploadedUrl?: string;
  /** 视频上传成功后服务端生成的封面 URL */
  thumbnailUrl?: string;
  /** 视频时长（秒） */
  duration?: number;
  /** 视频分辨率（如 1920x1080） */
  resolution?: string;
}

const MaterialUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingFile, setEditingFile] = useState<FileEntry | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'video' as string,
    resolution: '',
    duration: 0,
    format: '',
    file_size: 0,
    device: '',
    tags: '',
    preview_url: '',
    download_url: '',
    cover_url: '',
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ title?: string; type?: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());
  const coverPreviewUrlRef = useRef<string>('');

  // 组件卸载时释放本地预览 URL，防止内存泄漏。不要在 files 变化时释放，否则上传进度更新会让 blob 预览失效。
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
      if (coverPreviewUrlRef.current) URL.revokeObjectURL(coverPreviewUrlRef.current);
    };
  }, []);

  // 未登录时重定向到登录页
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  /**
   * 添加文件并立即触发上传
   */
  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray: File[] = Array.from(newFiles);

    const entries: FileEntry[] = fileArray.map((file) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      // 为图片/音频/视频创建本地预览 URL
      const localPreviewUrl =
        isImageFile(file) || isVideoFile(file) || isAudioFile(file)
          ? URL.createObjectURL(file)
          : undefined;
      if (localPreviewUrl) objectUrlsRef.current.add(localPreviewUrl);
      return { id, file, progress: 0, status: 'pending' as const, localPreviewUrl };
    });

    setFiles((prev) => [...prev, ...entries]);

    // 立即对每个文件发起上传（异步，不阻塞 UI）
    entries.forEach((entry) => {
      if (isVideoFile(entry.file)) {
        void fillVideoPreviewInfo(entry);
      }
      void doUpload(entry);
    });
  }, []);

  const fillVideoPreviewInfo = useCallback(async (entry: FileEntry): Promise<void> => {
    try {
      const metadata = await extractVideoMetadata(entry.file);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === entry.id
            ? {
                ...f,
                duration: metadata.duration ?? f.duration,
                resolution: metadata.resolution ?? f.resolution,
                thumbnailUrl: f.thumbnailUrl || metadata.thumbnailUrl,
              }
            : f,
        ),
      );
    } catch (_error) {
      logger.error(`本地视频元数据读取失败: ${entry.file.name}`);
    }
  }, []);

  const extractVideoMetadata = async (
    file: File,
  ): Promise<{
    duration?: number;
    resolution?: string;
    thumbnailUrl?: string;
  }> => {
    const objectUrl: string = URL.createObjectURL(file);
    const video = document.createElement('video');
    const pending = (ms: number): Promise<void> =>
      new Promise((resolve) => setTimeout(resolve, ms));

    try {
      const metadata = await new Promise<{ duration: number; width: number; height: number }>((resolve, reject) => {
        const onMetadata = (): void => {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            const duration = Number.isFinite(video.duration) && video.duration > 0
              ? Math.round(video.duration)
              : undefined;
            resolve({ duration: duration || 0, width: video.videoWidth, height: video.videoHeight });
          } else {
            reject(new Error('无效视频信息'));
          }
        };
        const onError = (): void => {
          reject(new Error('视频元数据读取失败'));
        };

        video.addEventListener('loadedmetadata', onMetadata, { once: true });
        video.addEventListener('error', onError, { once: true });
        video.preload = 'metadata';
        video.muted = true;
        video.src = objectUrl;
        video.load();
      });

      let thumbnailUrl: string | undefined;
      try {
        await new Promise<void>((resolve, reject) => {
          const seekTarget = Math.min(0.2, Math.max(0.001, metadata.duration > 0 ? 0.2 : 0));
          const onSeeked = (): void => resolve();
          const onError = (): void => reject(new Error('视频封面提取失败'));
          video.addEventListener('seeked', onSeeked, { once: true });
          video.addEventListener('error', onError, { once: true });
          video.currentTime = seekTarget;
        });

        const maxWidth = 640;
        const maxHeight = 360;
        const scale = Math.min(1, maxWidth / metadata.width, maxHeight / metadata.height);
        const drawWidth = Math.max(1, Math.round(metadata.width * scale));
        const drawHeight = Math.max(1, Math.round(metadata.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = drawWidth;
        canvas.height = drawHeight;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(video, 0, 0, drawWidth, drawHeight);
          thumbnailUrl = canvas.toDataURL('image/jpeg', 0.82);
        }
      } catch (_error) {
        await pending(200);
      }

      return {
        duration: metadata.duration || undefined,
        resolution: `${metadata.width}x${metadata.height}`,
        thumbnailUrl,
      };
    } finally {
      video.pause();
      video.src = '';
      URL.revokeObjectURL(objectUrl);
    }
  };

  /**
   * 执行文件上传
   */
  const doUpload = async (entry: FileEntry): Promise<void> => {
    // 标记为上传中
    setFiles((prev) =>
      prev.map((f) => (f.id === entry.id ? { ...f, status: 'uploading' as const, progress: 10 } : f)),
    );

    // 模拟进度推进（每 300ms 增加一点，最高到 85%）
    const progressTimer = setInterval(() => {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id !== entry.id) return f;
          const next = Math.min(f.progress + 12, 85);
          return { ...f, progress: next };
        }),
      );
    }, 300);

    try {
      const res = await uploadFile(entry.file);
      clearInterval(progressTimer);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === entry.id
            ? {
                ...f,
                progress: 100,
                status: 'done' as const,
                uploadedUrl: res.url,
                thumbnailUrl: res.thumbnailUrl || f.thumbnailUrl,
                duration: res.duration ?? f.duration,
                resolution: res.resolution ?? f.resolution,
              }
            : f,
        ),
      );
      logger.info(`文件上传成功: ${entry.file.name} → ${res.url}`);
    } catch (err: unknown) {
      clearInterval(progressTimer);
      logger.error(`文件上传失败: ${entry.file.name}`, err);
      setFiles((prev) =>
        prev.map((f) => (f.id === entry.id ? { ...f, status: 'error' as const } : f)),
      );
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.localPreviewUrl) {
        URL.revokeObjectURL(target.localPreviewUrl);
        objectUrlsRef.current.delete(target.localPreviewUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  /**
   * 打开素材信息表单，自动根据文件类型预填 URL 字段
   */
  const openForm = (file: FileEntry) => {
    if (file.status !== 'done') return;

    setEditingFile(file);
    const isImage = isImageFile(file.file);
    const isVideo = isVideoFile(file.file);
    const url = file.uploadedUrl || '';
    const autoCoverUrl = isImage ? url : file.thumbnailUrl || '';
    const videoDuration: number = isVideo ? Math.round(file.duration || 0) : 0;
    const videoResolution: string = isVideo ? file.resolution || '' : '';

    // 释放旧封面预览
    if (coverPreviewUrlRef.current) {
      URL.revokeObjectURL(coverPreviewUrlRef.current);
      coverPreviewUrlRef.current = '';
    }

    setFormData({
      title: file.file.name.replace(/\.[^.]+$/, ''),
      description: '',
      type: getMaterialType(file.file),
      resolution: videoResolution,
      duration: videoDuration,
      format: file.file.name.split('.').pop() || '',
      file_size: file.file.size,
      device: '',
      tags: '',
      preview_url: url,
      download_url: url,
      cover_url: autoCoverUrl,
    });
    setCoverFile(null);
    setCoverPreviewUrl('');
    setFormErrors({});
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!editingFile || submitting) return;

    const errors: { title?: string; type?: string } = {};
    if (!formData.title.trim()) {
      errors.title = '请输入素材标题';
    }
    if (!formData.type) {
      errors.type = '请选择素材类型';
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setSubmitting(true);

    try {
      let coverUrl = formData.cover_url;
      // 如果有封面上传，先上传封面文件
      if (coverFile) {
        const coverRes = await uploadFile(coverFile);
        coverUrl = coverRes.url;
      }

      const dto: CreateMaterialRequest = {
        title: formData.title || editingFile.file.name,
        description: formData.description,
        type: formData.type,
        resolution: formData.resolution,
        duration: formData.duration,
        format: formData.format,
        file_size: formData.file_size,
        device: formData.device || undefined,
        tags: formData.tags
          ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
        preview_url: formData.preview_url || '',
        download_url: formData.download_url || '',
        cover_url: coverUrl || '',
      };

      await createMaterial(dto);

      setFiles((prev) =>
        prev.map((f) =>
          f.id === editingFile.id
            ? { ...f, progress: 100, status: 'done' as const }
            : f,
        ),
      );
      setShowForm(false);
      setEditingFile(null);
      navigate('/materials');
    } catch (err: unknown) {
      logger.error('素材创建失败:', err);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === editingFile.id
            ? { ...f, status: 'error' as const }
            : f,
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (coverPreviewUrlRef.current) URL.revokeObjectURL(coverPreviewUrlRef.current);
      const nextUrl = URL.createObjectURL(file);
      coverPreviewUrlRef.current = nextUrl;
      setCoverFile(file);
      setCoverPreviewUrl(nextUrl);
    }
  };

  const handleRetryUpload = (entry: FileEntry) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === entry.id ? { ...f, status: 'pending' as const, progress: 0 } : f,
      ),
    );
    void doUpload(entry);
  };

  return (
    <PageFrame
      title="上传素材"
      description="将文件拖拽或选择上传"
      className="min-h-screen bg-background"
      containerClassName="app-container-shell"
    >
      <div className="max-w-3xl">
        <h1 className="text-xl font-semibold text-foreground mb-6">上传素材</h1>

        {/* Drop Zone */}
        <MaterialUploadDropZone
          isDragOver={isDragOver}
          fileInputRef={fileInputRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onSelectFile={handleFileSelect}
        />

        {/* File List */}
        {files.length > 0 && (
          <MaterialUploadFileList
            entries={files}
            formatSize={formatBytes}
            onOpenForm={openForm}
            onRetry={handleRetryUpload}
            onRemove={removeFile}
          />
        )}
      </div>

      {/* Upload Form Dialog */}
      <MaterialUploadFormDialog
        open={showForm}
        previewNode={editingFile ? <UploadFormMediaPreview entry={editingFile} /> : null}
        showSubmitPreviewUrl={editingFile?.uploadedUrl}
        formData={{
          title: formData.title,
          description: formData.description,
          type: formData.type,
          resolution: formData.resolution,
          duration: formData.duration,
          tags: formData.tags,
          cover_url: formData.cover_url,
        }}
        formErrors={formErrors}
        submitting={submitting}
        coverPreviewUrl={coverPreviewUrl}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
        onTitleChange={(title) => {
          setFormData((p) => ({ ...p, title }));
          if (title.trim()) {
            setFormErrors((prev) => ({ ...prev, title: undefined }));
          }
        }}
        onDescriptionChange={(description) => {
          setFormData((p) => ({ ...p, description }));
        }}
        onTypeChange={(type) => {
          setFormData((p) => ({ ...p, type }));
          if (type) {
            setFormErrors((prev) => ({ ...prev, type: undefined }));
          }
        }}
        onResolutionChange={(resolution) => {
          setFormData((p) => ({ ...p, resolution }));
        }}
        onDurationChange={(duration) => {
          setFormData((p) => ({ ...p, duration }));
        }}
        onTagsChange={(tags) => {
          setFormData((p) => ({ ...p, tags }));
        }}
        onCoverSelect={handleCoverSelect}
      />
    </PageFrame>
  );
};

export default MaterialUploadPage;
