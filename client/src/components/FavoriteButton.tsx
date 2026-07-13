import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Check, Plus, FolderOpen, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/compat/client-toolkit/logger';
import {
  getFavoriteFolders,
  createFavoriteFolder,
  addToFolder,
  removeFromFolder,
} from '@client/src/api/favorites';
import { useAuth } from '@client/src/hooks/useAuth';
import type { FavoriteFolderItem } from '@shared/material.interface';

interface FavoriteButtonProps {
  targetId: string;
  targetType: 'material' | 'script';
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  targetId,
  targetType,
}) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [folders, setFolders] = useState<FavoriteFolderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);
  const [favoritedFolderIds, setFavoritedFolderIds] = useState<Set<string>>(
    new Set(),
  );
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchFolders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getFavoriteFolders();
      setFolders(res.items);
    } catch (err: unknown) {
      logger.error('获取收藏夹失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchFolders();
    }
  }, [open, fetchFolders]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleToggleFolder = useCallback(
    async (folderId: string) => {
      const isFavorited = favoritedFolderIds.has(folderId);
      try {
        if (isFavorited) {
          await removeFromFolder(folderId, targetId);
          setFavoritedFolderIds((prev: Set<string>) => {
            const next = new Set(prev);
            next.delete(folderId);
            return next;
          });
          toast.success('已从收藏夹移除');
        } else {
          const dto: { material_id?: string; project_id?: string } = {};
          if (targetType === 'material') {
            dto.material_id = targetId;
          } else {
            dto.project_id = targetId;
          }
          await addToFolder(folderId, dto);
          setFavoritedFolderIds((prev: Set<string>) => {
            const next = new Set(prev);
            next.add(folderId);
            return next;
          });
          toast.success('已添加到收藏夹');
        }
      } catch (err: unknown) {
        logger.error('收藏操作失败:', err);
        toast.error('操作失败，请重试');
      }
    },
    [favoritedFolderIds, targetId, targetType],
  );

  const handleCreateFolder = useCallback(async () => {
    const name = newFolderName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await createFavoriteFolder({ name });
      setNewFolderName('');
      toast.success(`收藏夹「${name}」已创建`);
      await fetchFolders();
    } catch (err: unknown) {
      logger.error('创建收藏夹失败:', err);
      toast.error('创建失败，请重试');
    } finally {
      setCreating(false);
    }
  }, [newFolderName, fetchFolders]);

  const hasFavorites = favoritedFolderIds.size > 0;

  // 未登录时不渲染按钮
  if (!user) return null;

  return (
    <div className="relative inline-flex">
      <motion.button
        ref={buttonRef}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
          hasFavorites
            ? 'bg-primary/10 text-primary border border-primary/30'
            : 'text-muted-foreground border border-border hover:text-foreground hover:border-foreground/30'
        }`}
      >
        <Bookmark
          className="w-4 h-4"
          fill={hasFavorites ? 'currentColor' : 'none'}
        />
        <span>收藏</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute bottom-full mb-2 left-0 w-64 bg-card border border-border rounded-lg shadow-[0_4px_20px_-4px_rgba(0_0_0_0.5)] z-50 overflow-hidden"
          >
            <div className="p-2">
              <div className="flex items-center gap-2 px-2 py-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">
                  收藏到...
                </span>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : folders.length === 0 ? (
                <p className="text-xs text-muted-foreground px-2 py-3 text-center">
                  暂无收藏夹
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {folders.map((folder: FavoriteFolderItem) => {
                    const isChecked = favoritedFolderIds.has(folder.id);
                    return (
                      <button
                        key={folder.id}
                        type="button"
                        onClick={() => handleToggleFolder(folder.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
                          isChecked
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                      >
                        <span className="flex-1 text-left truncate">
                          {folder.name}
                        </span>
                        {isChecked && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-2 pt-2 border-t border-border">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewFolderName(e.target.value)
                    }
                    onKeyDown={(e: React.KeyboardEvent) => {
                      if (e.key === 'Enter') handleCreateFolder();
                    }}
                    placeholder="新建收藏夹..."
                    className="flex-1 h-8 px-2 rounded-md bg-accent text-xs text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleCreateFolder}
                    disabled={creating || !newFolderName.trim()}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {creating ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FavoriteButton;
