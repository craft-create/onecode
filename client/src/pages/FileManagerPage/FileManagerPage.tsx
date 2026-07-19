/**
 * 文件管理器页面
 * 功能：文件夹浏览、文件上传、批量操作、分享、回收站
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, Plus, Upload, Home, Grid3X3, List, Loader2, Trash2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { formatBytes } from '@/utils/formatBytes';
import { PageFrame } from '../shared/PageShell';
import { fileApi } from '@/api';
import FileManagerFileItem from '@/components/file/FileManagerFileItem';
import FileManagerFolderItem from '@/components/file/FileManagerFolderItem';

type ViewMode = 'grid' | 'list';

interface FileItem {
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

interface FolderItem {
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

  return (
    <PageFrame
      title="文件管理器"
      description="管理你的所有文件"
      action={
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setNewFolderDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新建文件夹
          </Button>
          <Button size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            上传文件
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      }
      className="min-h-screen bg-background"
      containerClassName="app-container-shell"
      contentClassName="space-y-6"
    >
      {/* ===== Breadcrumbs & Actions ===== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={navigateToRoot}>
            <Home className="w-4 h-4" />
          </Button>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.id}>
              <span className="text-muted-foreground">/</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newCrumbs = breadcrumbs.slice(0, idx + 1);
                  setBreadcrumbs(newCrumbs);
                  setCurrentFolderId(crumb.id);
                  clearSelection();
                }}
              >
                {crumb.name}
              </Button>
            </React.Fragment>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {selectedItems.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">已选 {selectedItems.size} 项</span>
              <Button variant="destructive" size="sm" onClick={handleBatchDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                删除
              </Button>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                取消选择
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={selectAll}>
            全选
          </Button>
          <div className="border-l pl-2 flex gap-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ===== Content ===== */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {folders.length === 0 && files.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <Folder className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">此文件夹为空</p>
              <Button className="mt-4" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                上传文件
              </Button>
            </motion.div>
          ) : (
            <>
              {/* Folders */}
                  {folders.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-3">文件夹</h2>
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {folders.map((folder) => (
                        <FileManagerFolderItem
                          key={folder.id}
                          folder={folder}
                          viewMode={viewMode}
                          selected={selectedItems.has(folder.id)}
                          onNavigate={navigateToFolder}
                          onToggleSelect={toggleSelect}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {folders.map((folder) => (
                        <FileManagerFolderItem
                          key={folder.id}
                          folder={folder}
                          viewMode={viewMode}
                          selected={selectedItems.has(folder.id)}
                          onNavigate={navigateToFolder}
                          onToggleSelect={toggleSelect}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Files */}
              {files.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-3">文件</h2>
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {files.map((file) => (
                        <FileManagerFileItem
                          key={file.id}
                          file={file}
                          viewMode={viewMode}
                          selected={selectedItems.has(file.id)}
                          onOpen={(targetFile) => window.open(targetFile.url, '_blank')}
                          onToggleSelect={toggleSelect}
                          onToggleStar={(event) => handleToggleStar(file.id, event)}
                          onShare={(event) => {
                            event.stopPropagation();
                            setShareItem(file);
                            setShareDialogOpen(true);
                          }}
                          onDownload={(event) => {
                            event.stopPropagation();
                            window.open(file.url, '_blank');
                          }}
                          onDelete={(event) => {
                            event.stopPropagation();
                            handleDelete(file);
                          }}
                          formatSize={formatBytes}
                          isStarred={isStarred(file.isStarred)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {files.map((file) => (
                        <FileManagerFileItem
                          key={file.id}
                          file={file}
                          viewMode={viewMode}
                          selected={selectedItems.has(file.id)}
                          onOpen={(targetFile) => window.open(targetFile.url, '_blank')}
                          onToggleSelect={toggleSelect}
                          onToggleStar={(event) => handleToggleStar(file.id, event)}
                          onShare={(event) => {
                            event.stopPropagation();
                            setShareItem(file);
                            setShareDialogOpen(true);
                          }}
                          onDownload={(event) => {
                            event.stopPropagation();
                            window.open(file.url, '_blank');
                          }}
                          onDelete={(event) => {
                            event.stopPropagation();
                            handleDelete(file);
                          }}
                          formatSize={formatBytes}
                          isStarred={isStarred(file.isStarred)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </AnimatePresence>
      )}

      {/* ===== New Folder Dialog ===== */}
      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建文件夹</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folderName">文件夹名称</Label>
              <Input
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="输入文件夹名称"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateFolder}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Share Dialog ===== */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>分享文件</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>分享文件</Label>
              <p className="text-sm text-muted-foreground">{shareItem?.name}</p>
            </div>
            <div className="space-y-2">
              <Label>有效期（小时）</Label>
              <Input
                type="number"
                value={shareExpiresIn}
                onChange={(e) => setShareExpiresIn(parseInt(e.target.value))}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label>分享密码（可选）</Label>
              <Input
                type="password"
                value={sharePassword}
                onChange={(e) => setSharePassword(e.target.value)}
                placeholder="留空则公开访问"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              生成分享链接
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageFrame>
  );
};

export default FileManagerPage;
