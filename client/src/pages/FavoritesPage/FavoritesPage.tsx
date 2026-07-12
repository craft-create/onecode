import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  X,
  MoreHorizontal,
  Film,
  FileText,
  Bookmark,
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@client/compat/client-toolkit/logger';
import { useAuth } from '@client/src/hooks/useAuth';
import {
  getFavoriteFolders,
  createFavoriteFolder,
  updateFavoriteFolder,
  deleteFavoriteFolder,
  getFolderItems,
  removeFromFolder,
} from '@client/src/api/favorites';
import type {
  FavoriteFolderItem,
  FavoriteFolderContentItem,
} from '@shared/material.interface';

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [folders, setFolders] = useState<FavoriteFolderItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState<FavoriteFolderContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showNewInput, setShowNewInput] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // 未登录时重定向到登录页
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  const fetchFolders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getFavoriteFolders();
      setFolders(res.items);
      if (res.items.length > 0 && !selectedId) {
        setSelectedId(res.items[0].id);
      }
    } catch (err: unknown) {
      logger.error('获取收藏夹失败:', err);
      toast.error('加载收藏夹失败');
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  const fetchItems = useCallback(async (folderId: string) => {
    setItemsLoading(true);
    try {
      const data = await getFolderItems(folderId);
      setItems(data);
    } catch (err: unknown) {
      logger.error('获取收藏夹内容失败:', err);
    } finally {
      setItemsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchItems(selectedId);
    }
  }, [selectedId, fetchItems]);

  const handleCreateFolder = useCallback(async () => {
    const name = newFolderName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const folder = await createFavoriteFolder({ name });
      setFolders((prev: FavoriteFolderItem[]) => [...prev, folder]);
      setNewFolderName('');
      setShowNewInput(false);
      setSelectedId(folder.id);
      toast.success(`收藏夹「${name}」已创建`);
    } catch (err: unknown) {
      logger.error('创建收藏夹失败:', err);
      toast.error('创建失败，请重试');
    } finally {
      setCreating(false);
    }
  }, [newFolderName]);

  const handleRename = useCallback(
    async (folderId: string) => {
      const name = editName.trim();
      if (!name) {
        setEditingId(null);
        return;
      }
      try {
        await updateFavoriteFolder(folderId, { name });
        setFolders((prev: FavoriteFolderItem[]) =>
          prev.map((f: FavoriteFolderItem) =>
            f.id === folderId ? { ...f, name } : f,
          ),
        );
        setEditingId(null);
        toast.success('已重命名');
      } catch (err: unknown) {
        logger.error('重命名失败:', err);
        toast.error('重命名失败，请重试');
      }
    },
    [editName],
  );

  const handleDeleteFolder = useCallback(
    async (folderId: string) => {
      try {
        await deleteFavoriteFolder(folderId);
        setFolders((prev: FavoriteFolderItem[]) =>
          prev.filter((f: FavoriteFolderItem) => f.id !== folderId),
        );
        if (selectedId === folderId) {
          setSelectedId(null);
          setItems([]);
        }
        setMenuOpenId(null);
        toast.success('收藏夹已删除');
      } catch (err: unknown) {
        logger.error('删除收藏夹失败:', err);
        toast.error('删除失败，请重试');
      }
    },
    [selectedId],
  );

  const handleRemoveItem = useCallback(
    async (itemId: string) => {
      if (!selectedId) return;
      try {
        await removeFromFolder(selectedId, itemId);
        setItems((prev: FavoriteFolderContentItem[]) =>
          prev.filter((i: FavoriteFolderContentItem) => i.id !== itemId),
        );
        setFolders((prev: FavoriteFolderItem[]) =>
          prev.map((f: FavoriteFolderItem) =>
            f.id === selectedId
              ? { ...f, item_count: Math.max(0, f.item_count - 1) }
              : f,
          ),
        );
        toast.success('已从收藏夹移除');
      } catch (err: unknown) {
        logger.error('移除收藏失败:', err);
        toast.error('操作失败，请重试');
      }
    },
    [selectedId],
  );

  const handleItemClick = (item: FavoriteFolderContentItem) => {
    if (item.type === 'material' && item.material_id) {
      navigate(`/materials/${item.material_id}`);
    } else if (item.type === 'project' && item.project_id) {
      navigate(`/scripts/${item.project_id}`);
    }
  };

  const selectedFolder = folders.find(
    (f: FavoriteFolderItem) => f.id === selectedId,
  );

  return (
    <div className="min-h-screen bg-[hsl(228_15%_8%)]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[hsl(220_15%_90%)] font-['Space_Grotesk']">
            我的收藏
          </h1>
          <p className="text-[hsl(220_10%_55%)] mt-1 text-sm">
            管理你的收藏夹和收藏内容
          </p>
        </div>

        <div className="flex gap-6">
          {/* Left sidebar - folder list */}
          <div className="w-64 shrink-0">
            <div className="bg-[hsl(228_14%_12%)] border border-[hsl(228_12%_18%)] rounded-lg overflow-hidden">
              <div className="p-3 border-b border-[hsl(228_12%_18%)]">
                <h2 className="text-xs font-medium text-[hsl(220_10%_55%)] uppercase tracking-wider">
                  收藏夹
                </h2>
              </div>

              {loading ? (
                <div className="p-3 space-y-2">
                  {Array.from({ length: 3 }).map((_, i: number) => (
                    <div
                      key={i}
                      className="h-9 bg-[hsl(228_12%_18%)] rounded-md animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="p-2 max-h-[60vh] overflow-y-auto">
                  <AnimatePresence>
                    {folders.map((folder: FavoriteFolderItem) => (
                      <motion.div
                        key={folder.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        className="relative group"
                      >
                        {editingId === folder.id ? (
                          <div className="flex items-center gap-1 px-2 py-1">
                            <input
                              type="text"
                              value={editName}
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>,
                              ) => setEditName(e.target.value)}
                              onKeyDown={(
                                e: React.KeyboardEvent<HTMLInputElement>,
                              ) => {
                                if (e.key === 'Enter')
                                  handleRename(folder.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              onBlur={() => handleRename(folder.id)}
                              autoFocus
                              className="flex-1 h-7 px-2 rounded-md bg-[hsl(228_15%_8%)] border border-primary/50 text-xs text-[hsl(220_15%_90%)] outline-none"
                            />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedId(folder.id)}
                            onDoubleClick={() => {
                              setEditingId(folder.id);
                              setEditName(folder.name);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                              selectedId === folder.id
                                ? 'bg-primary/10 text-primary'
                                : 'text-[hsl(220_10%_55%)] hover:bg-[hsl(228_12%_18%)] hover:text-[hsl(220_15%_90%)]'
                            }`}
                          >
                            <FolderOpen className="w-4 h-4 shrink-0" />
                            <span className="flex-1 text-left truncate">
                              {folder.name}
                            </span>
                            <span className="text-xs text-[hsl(220_10%_40%)]">
                              {folder.item_count}
                            </span>

                            {/* More menu */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  setMenuOpenId(
                                    menuOpenId === folder.id
                                      ? null
                                      : folder.id,
                                  );
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[hsl(228_12%_18%)] transition-all"
                              >
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </button>
                              <AnimatePresence>
                                {menuOpenId === folder.id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute left-0 top-full mt-1 w-32 bg-[hsl(228_14%_12%)] border border-[hsl(228_12%_18%)] rounded-lg shadow-xl z-50 py-1"
                                  >
                                    <button
                                      type="button"
                                      onClick={(
                                        e: React.MouseEvent,
                                      ) => {
                                        e.stopPropagation();
                                        setEditingId(folder.id);
                                        setEditName(folder.name);
                                        setMenuOpenId(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[hsl(220_10%_55%)] hover:bg-[hsl(228_12%_18%)] hover:text-[hsl(220_15%_90%)] transition-colors"
                                    >
                                      <Pencil className="w-3 h-3" />
                                      重命名
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(
                                        e: React.MouseEvent,
                                      ) => {
                                        e.stopPropagation();
                                        handleDeleteFolder(folder.id);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      删除
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {folders.length === 0 && (
                    <p className="text-xs text-[hsl(220_10%_55%)] text-center py-4">
                      暂无收藏夹
                    </p>
                  )}
                </div>
              )}

              {/* New folder input */}
              <div className="p-2 border-t border-[hsl(228_12%_18%)]">
                <AnimatePresence>
                  {showNewInput ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={newFolderName}
                          onChange={(
                            e: React.ChangeEvent<HTMLInputElement>,
                          ) => setNewFolderName(e.target.value)}
                          onKeyDown={(
                            e: React.KeyboardEvent<HTMLInputElement>,
                          ) => {
                            if (e.key === 'Enter') handleCreateFolder();
                            if (e.key === 'Escape') {
                              setShowNewInput(false);
                              setNewFolderName('');
                            }
                          }}
                          placeholder="收藏夹名称..."
                          autoFocus
                          className="flex-1 h-8 px-2 rounded-md bg-[hsl(228_15%_8%)] border border-[hsl(228_12%_18%)] text-xs text-[hsl(220_15%_90%)] placeholder:text-[hsl(220_10%_55%)] outline-none focus:border-primary/50"
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
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewInput(false);
                            setNewFolderName('');
                          }}
                          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-[hsl(220_10%_55%)] hover:text-[hsl(220_15%_90%)] transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowNewInput(true)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[hsl(220_10%_55%)] hover:bg-[hsl(228_12%_18%)] hover:text-[hsl(220_15%_90%)] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      新建收藏夹
                    </button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right content area */}
          <div className="flex-1 min-w-0">
            {!selectedId ? (
              <div className="bg-[hsl(228_14%_12%)] border border-[hsl(228_12%_18%)] rounded-lg flex flex-col items-center justify-center py-20">
                <Bookmark className="w-12 h-12 text-[hsl(220_10%_30%)] mb-4" />
                <p className="text-[hsl(220_10%_55%)] text-sm">
                  选择一个收藏夹查看内容
                </p>
              </div>
            ) : itemsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i: number) => (
                  <div
                    key={i}
                    className="rounded-lg bg-[hsl(228_14%_12%)] border border-[hsl(228_12%_18%)] animate-pulse h-48"
                  />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="bg-[hsl(228_14%_12%)] border border-[hsl(228_12%_18%)] rounded-lg flex flex-col items-center justify-center py-20">
                <FolderOpen className="w-12 h-12 text-[hsl(220_10%_30%)] mb-4" />
                <p className="text-[hsl(220_10%_55%)] text-sm">
                  收藏夹为空，去发现精彩内容吧
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-[hsl(220_15%_90%)]">
                    {selectedFolder?.name}
                  </h2>
                  <p className="text-xs text-[hsl(220_10%_55%)] mt-0.5">
                    {items.length} 个项目
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence mode="popLayout">
                    {items.map(
                      (item: FavoriteFolderContentItem, idx: number) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                          className="group relative rounded-lg bg-[hsl(228_14%_12%)] border border-[hsl(228_12%_18%)] overflow-hidden hover:border-primary/30 hover:shadow-[0_4px_24px_-4px_rgba(124_92_255_0.2)] transition-all duration-300 cursor-pointer"
                          onClick={() => handleItemClick(item)}
                        >
                          {/* Cover */}
                          <div className="aspect-video bg-gradient-to-br from-[hsl(228_14%_18%)] to-[hsl(228_14%_8%)] flex items-center justify-center">
                            {item.cover_url ? (
                              <img
                                src={item.cover_url}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            ) : item.type === 'material' ? (
                              <Film className="w-10 h-10 text-[hsl(220_10%_30%)]" />
                            ) : (
                              <FileText className="w-10 h-10 text-[hsl(220_10%_30%)]" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="p-3">
                            <h3 className="text-sm font-medium text-[hsl(220_15%_90%)] truncate">
                              {item.title}
                            </h3>
                            <p className="text-[11px] text-[hsl(220_10%_55%)] mt-0.5">
                              {item.type === 'material' ? '素材' : '剧本'}
                            </p>
                          </div>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleRemoveItem(item.id);
                            }}
                            className="absolute top-2 right-2 size-7 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/80"
                          >
                            <X className="w-3.5 h-3.5 text-white" />
                          </button>
                        </motion.div>
                      ),
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FavoritesPage;
