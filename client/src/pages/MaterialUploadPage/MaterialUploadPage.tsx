import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  File,
  X,
  Plus,
  Check,
  Image,
  Film,
  Music,
  Loader2,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { createMaterial } from '@client/src/api/materials';
import { uploadFile } from '@client/src/api/upload';
import { useAuth } from '@client/src/hooks/useAuth';
import type { CreateMaterialRequest } from '@shared/material.interface';

interface FileEntry {
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
      // 为图片/视频创建本地预览 URL
      const localPreviewUrl =
        file.type.startsWith('image/') || file.type.startsWith('video/')
          ? URL.createObjectURL(file)
          : undefined;
      if (localPreviewUrl) objectUrlsRef.current.add(localPreviewUrl);
      return { id, file, progress: 0, status: 'pending' as const, localPreviewUrl };
    });

    setFiles((prev) => [...prev, ...entries]);

    // 立即对每个文件发起上传（异步，不阻塞 UI）
    entries.forEach((entry) => {
      void doUpload(entry);
    });
  }, []);

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
            ? { ...f, progress: 100, status: 'done' as const, uploadedUrl: res.url, thumbnailUrl: res.thumbnailUrl }
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
    const isImage = file.file.type.startsWith('image/');
    const isVideo = file.file.type.startsWith('video/');
    const url = file.uploadedUrl || '';
    const autoCoverUrl = isImage ? url : file.thumbnailUrl || '';

    // 释放旧封面预览
    if (coverPreviewUrlRef.current) {
      URL.revokeObjectURL(coverPreviewUrlRef.current);
      coverPreviewUrlRef.current = '';
    }

    setFormData({
      title: file.file.name.replace(/\.[^.]+$/, ''),
      description: '',
      type: isVideo ? 'video' : file.file.type.startsWith('audio/') ? 'audio' : 'sound',
      resolution: '',
      duration: 0,
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

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('video/')) return Film;
    if (file.type.startsWith('audio/')) return Music;
    if (file.type.startsWith('image/')) return Image;
    return File;
  };

  /** 判断是否为图片文件 */
  const isImageFile = (file: File): boolean => file.type.startsWith('image/');
  /** 判断是否为视频文件 */
  const isVideoFile = (file: File): boolean => file.type.startsWith('video/');

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold text-foreground mb-6">
          上传素材
        </h1>

        {/* Drop Zone */}
        <motion.div
          animate={
            isDragOver
              ? { borderColor: 'hsl(252 85% 60%)', scale: 1.01 }
              : { borderColor: 'hsl(228 12% 18%)', scale: 1 }
          }
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-foreground/20'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/*,audio/*,image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <motion.div
            animate={isDragOver ? { y: -4 } : { y: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                isDragOver ? 'bg-primary/20' : 'bg-accent'
              }`}
            >
              <Upload
                className={`w-7 h-7 ${
                  isDragOver ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {isDragOver
                  ? '释放以上传文件'
                  : '拖拽文件到此处或点击选择'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                支持视频、音频、图片格式，文件将自动上传
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-6 space-y-3">
            <h2 className="text-sm font-medium text-foreground">
              上传列表 ({files.length})
            </h2>
            {files.map((entry) => {
              const FileIcon = getFileIcon(entry.file);
              const isImg = isImageFile(entry.file);
              const isVid = isVideoFile(entry.file);
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border"
                >
                  {/* 预览区域：图片缩略图 / 视频首帧 / 文件图标 */}
                  <div className="w-14 h-14 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {entry.status === 'done' && entry.localPreviewUrl && isImg ? (
                      <img
                        src={entry.localPreviewUrl}
                        alt={entry.file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : entry.status === 'done' && isVid && entry.thumbnailUrl ? (
                      <img
                        src={entry.thumbnailUrl}
                        alt={entry.file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : entry.status === 'done' && entry.localPreviewUrl && isVid ? (
                      <video
                        src={entry.localPreviewUrl}
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      <FileIcon className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">
                      {entry.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(entry.file.size)}
                      {entry.uploadedUrl && (
                        <span className="ml-2 text-success">· 已上传</span>
                      )}
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
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openForm(entry);
                          }}
                          title="填写素材信息"
                          className="p-1.5 rounded-lg hover:bg-accent text-success hover:text-foreground transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </>
                    ) : entry.status === 'uploading' ? (
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    ) : entry.status === 'error' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFiles((prev) =>
                            prev.map((f) =>
                              f.id === entry.id ? { ...f, status: 'pending' as const, progress: 0 } : f,
                            ),
                          );
                          void doUpload(entry);
                        }}
                        className="p-1.5 rounded-lg hover:bg-accent text-destructive hover:text-foreground transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                    ) : (
                      <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(entry.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Form Dialog */}
      <AnimatePresence>
        {showForm && editingFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg mx-4 bg-card border border-border rounded-xl p-6 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-foreground">
                  素材信息
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 文件预览区 */}
              {editingFile.localPreviewUrl && isImageFile(editingFile.file) && (
                <div className="mb-4 rounded-lg overflow-hidden border border-border bg-accent/30">
                  <img
                    src={editingFile.localPreviewUrl}
                    alt="预览"
                    className="w-full max-h-48 object-contain"
                  />
                </div>
              )}
              {editingFile.localPreviewUrl && isVideoFile(editingFile.file) && (
                <div className="mb-4 rounded-lg overflow-hidden border border-border bg-accent/30">
                  <video
                    src={editingFile.localPreviewUrl}
                    controls
                    className="w-full max-h-48"
                  />
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    标题
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData((p) => ({ ...p, title: e.target.value }));
                      if (e.target.value.trim()) {
                        setFormErrors((prev) => ({ ...prev, title: undefined }));
                      }
                    }}
                    className={`w-full h-9 px-3 rounded-lg bg-background border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 ${
                      formErrors.title
                        ? 'border-destructive ring-1 ring-destructive'
                        : 'border-border'
                    }`}
                  />
                  {formErrors.title && (
                    <p className="text-xs text-destructive mt-1">
                      {formErrors.title}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      类型
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => {
                        setFormData((p) => ({ ...p, type: e.target.value }));
                        if (e.target.value) {
                          setFormErrors((prev) => ({ ...prev, type: undefined }));
                        }
                      }}
                      className={`w-full h-9 px-3 rounded-lg bg-background border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 ${
                        formErrors.type
                          ? 'border-destructive ring-1 ring-destructive'
                          : 'border-border'
                      }`}
                    >
                      <option value="video">视频</option>
                      <option value="audio">音频</option>
                      <option value="sound">音效</option>
                    </select>
                    {formErrors.type && (
                      <p className="text-xs text-destructive mt-1">
                        {formErrors.type}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      分辨率
                    </label>
                    <input
                      type="text"
                      value={formData.resolution}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          resolution: e.target.value,
                        }))
                      }
                      placeholder="如 1920x1080"
                      className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    标签（逗号分隔）
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, tags: e.target.value }))
                    }
                    placeholder="如 风景, 城市, 航拍"
                    className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>

                {/* 封面上传 */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    封面图片（视频素材已自动截取，可按需更换）
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 h-9 px-3 rounded-lg bg-background border border-border text-sm text-foreground cursor-pointer hover:border-primary/50 transition-colors flex items-center">
                      <Image className="w-4 h-4 mr-2 text-muted-foreground" />
                      {coverFile || formData.cover_url ? '更换封面' : '选择封面图片'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverSelect}
                        className="hidden"
                      />
                    </label>
                    {(coverPreviewUrl || formData.cover_url) && (
                      <img
                        src={coverPreviewUrl || formData.cover_url}
                        alt="封面预览"
                        className="w-9 h-9 rounded object-cover border border-border"
                      />
                    )}
                  </div>
                </div>

                {/* 文件 URL 信息（只读展示） */}
                {editingFile.uploadedUrl && (
                  <div className="rounded-lg bg-accent/30 border border-border p-3">
                    <p className="text-xs text-muted-foreground mb-1">文件地址（上传成功）</p>
                    <p className="text-xs text-foreground break-all font-mono">
                      {editingFile.uploadedUrl}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 h-10 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !formData.title.trim()}
                  className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:shadow-[0_0_20px_-4px_rgba(139_92_246_0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      确认创建
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MaterialUploadPage;
