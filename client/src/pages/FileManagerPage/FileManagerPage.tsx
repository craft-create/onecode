/**
 * 文件管理器页面
 * 功能：文件夹浏览、文件上传、批量操作、分享、回收站
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { formatBytes } from '@/utils/formatBytes';
import { PageFrame } from '../shared/PageShell';
import { fileApi } from '@/api';
import FileManagerTopBar from './components/FileManagerTopBar';
import FileManagerExplorerContent from './components/FileManagerExplorerContent';
import FileManagerNewFolderDialog from './components/FileManagerNewFolderDialog';
import FileManagerShareDialog from './components/FileManagerShareDialog';

export type ViewMode = 'grid' | 'list';

export interface FileItem {
  id: string;
  name: string;
  type: string;
  mimeType?: string;
  size?: number;
  url: string;
  thumbnailUrl?: string;
  isStarred: number;
  isShared: number;
  createdAt: string;
  updatedAt: string;
}

export interface FolderItem {
  id: string;
  name: string;
  itemCount: number;
  isStarred: number;
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

const FileManagerPage: React.FC = () => {
  // ========== State ==========
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // ========== Dialogs ==========
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareItem, setShareItem] = useState<FileItem | null>(null);
  const [shareExpiresIn, setShareExpiresIn] = useState(24);
  const [sharePassword, setSharePassword] = useState('');
  // ========== Upload ==========
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isStarred = (value: number | boolean | string) => {
    return value === 1 || value === true || value === '1' || value === 'true';
  };

  // ========== Load Data ==========
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [foldersRes, filesRes] = await Promise.all([
        fileApi.getFolders(currentFolderId || undefined),
        fileApi.getFiles({ folderId: currentFolderId || undefined, pageSize: 100 }),
      ]);
      const foldersData = Array.isArray(foldersRes) ? foldersRes : [];
      const filesData = (filesRes as { items?: FileItem[] }) || {};

      setFolders(foldersData);
      setFiles(
        (filesData.items || []).map((file: FileItem) => ({
          ...file,
          isStarred: isStarred(file.isStarred) ? 1 : 0,
        })),
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('加载文件列表失败:', err);
      toast.error(`加载失败: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [currentFolderId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ========== Navigate to Folder ==========
  const navigateToFolder = (folder: FolderItem) => {
    setCurrentFolderId(folder.id);
    setBreadcrumbs((prev) => [...prev, folder]);
    setSelectedItems(new Set());
  };

  const navigateToRoot = () => {
    setCurrentFolderId(null);
    setBreadcrumbs([]);
    setSelectedItems(new Set());
  };

  // ========== Create Folder ==========
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('请输入文件夹名称');
      return;
    }

    try {
      await fileApi.createFolder({ name: newFolderName, parentId: currentFolderId || undefined });
      toast.success('文件夹创建成功');
      setNewFolderDialogOpen(false);
      setNewFolderName('');
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('创建文件夹失败:', err);
      toast.error(`创建失败: ${msg}`);
    }
  };

  // ========== Delete Item ==========
  const handleDelete = async (item: FileItem | FolderItem) => {
    if (!confirm(`确定要删除「${item.name}」吗？`)) return;

    try {
      if ('size' in item) {
        await fileApi.deleteFile(item.id);
      } else {
        await fileApi.deleteFolder(item.id);
      }
      toast.success('已移动到回收站');
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('删除失败:', err);
      toast.error(`删除失败: ${msg}`);
    }
  };

  // ========== Star/Unstar ==========
  const handleToggleStar = async (fileId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    const previousFiles = [...files];
    const nextFiles = files.map((file) =>
      file.id === fileId
        ? { ...file, isStarred: isStarred(file.isStarred) ? 0 : 1 }
        : file,
    );

    setFiles(nextFiles);

    try {
      await fileApi.toggleStar(fileId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFiles(previousFiles);
      toast.error(`操作失败: ${msg}`);
      await loadData();
    }
  };

  // ========== Share ==========
  const handleShare = async () => {
    if (!shareItem) return;

    try {
      const { data: shareRes } = await fileApi.shareFile({
        fileId: shareItem.id,
        expiresIn: shareExpiresIn,
        password: sharePassword || undefined,
      });
      const { shareUrl } = shareRes;
      toast.success('分享链接已生成', {
        description: shareUrl,
        action: {
          label: '复制',
          onClick: () => navigator.clipboard.writeText(window.location.origin + shareUrl),
        },
      });
      setShareDialogOpen(false);
      setShareItem(null);
      setSharePassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('分享失败:', err);
      toast.error(`分享失败: ${msg}`);
    }
  };

  // ========== Upload ==========
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    for (const file of Array.from(files)) {
      try {
        // 1. Upload to server
        const formData = new FormData();
        formData.append('file', file);
        let uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (uploadRes.status === 404) {
          uploadRes = await fetch('/upload', { method: 'POST', body: formData });
        }
        const uploadData = await uploadRes.json();

        // 2. Create file record
        await fileApi.createFile({
          name: file.name,
          originalName: file.name,
          type: file.type.startsWith('image/')
            ? 'image'
            : file.type.startsWith('video/')
              ? 'video'
              : file.type.startsWith('audio/')
                ? 'audio'
                : 'file',
          mimeType: file.type,
          size: uploadData.size,
          url: uploadData.url,
          thumbnailUrl: uploadData.thumbnailUrl,
          folderId: currentFolderId || undefined,
        });

        toast.success(`${file.name} 上传成功`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error('上传失败:', err);
        toast.error(`${file.name} 上传失败: ${msg}`);
      }
    }

    loadData();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ========== Selection ==========
  const toggleSelect = (id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    const allIds = new Set([...folders.map((f) => f.id), ...files.map((f) => f.id)]);
    setSelectedItems(allIds);
  };

  const clearSelection = () => setSelectedItems(new Set());

  // ========== Batch Delete ==========
  const handleBatchDelete = async () => {
    if (selectedItems.size === 0) return;

    if (!confirm(`确定要删除选中的 ${selectedItems.size} 个项目吗？`)) return;

    try {
      await fileApi.batchDelete(Array.from(selectedItems));
      toast.success(`已删除 ${selectedItems.size} 个项目`);
      clearSelection();
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('批量删除失败:', err);
      toast.error(`删除失败: ${msg}`);
    }
  };

  const handleShareItem = (file: FileItem) => {
    setShareItem(file);
    setShareDialogOpen(true);
  };

  return (
      <PageFrame
        title="文件管理器"
        description="管理你的所有文件"
        action={
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        }
        className="min-h-screen bg-background"
        containerClassName="app-container-shell"
        contentClassName="space-y-6"
      >
      <FileManagerTopBar
        breadcrumbs={breadcrumbs}
        selectedCount={selectedItems.size}
        viewMode={viewMode}
        onNavigateRoot={navigateToRoot}
        onNavigateCrumb={(crumb, idx) => {
          const newCrumbs = breadcrumbs.slice(0, idx + 1);
          setBreadcrumbs(newCrumbs);
          setCurrentFolderId(crumb.id);
          clearSelection();
        }}
        onNewFolder={() => setNewFolderDialogOpen(true)}
        onUpload={() => fileInputRef.current?.click()}
        onSelectAll={selectAll}
        onClearSelection={clearSelection}
        onBatchDelete={handleBatchDelete}
        onViewModeChange={setViewMode}
      />
      <FileManagerExplorerContent
        loading={loading}
        folders={folders}
        files={files}
        viewMode={viewMode}
        selectedItems={selectedItems}
        isStarred={isStarred}
        onNavigateFolder={navigateToFolder}
        onOpenFile={(targetFile) => window.open(targetFile.url, '_blank')}
        onToggleSelect={toggleSelect}
        onToggleStar={handleToggleStar}
        onShare={handleShareItem}
        onDownload={(file) => window.open(file.url, '_blank')}
        onDelete={handleDelete}
        formatSize={formatBytes}
      />

      {/* ===== New Folder Dialog ===== */}
      <FileManagerNewFolderDialog
        open={newFolderDialogOpen}
        onOpenChange={setNewFolderDialogOpen}
        value={newFolderName}
        onValueChange={setNewFolderName}
        onSubmit={handleCreateFolder}
      />

      {/* ===== Share Dialog ===== */}
      <FileManagerShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        shareItem={shareItem}
        shareExpiresIn={shareExpiresIn}
        sharePassword={sharePassword}
        onExpiresInChange={setShareExpiresIn}
        onPasswordChange={setSharePassword}
        onSubmit={handleShare}
      />
    </PageFrame>
  );
};

export default FileManagerPage;
