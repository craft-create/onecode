import { type FC, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAsyncState } from '@client/src/hooks/useAsyncState';
import { logger } from '@/utils/logger';
import { useAuth } from '@client/src/hooks/useAuth';
import { PageFrame } from '../shared/PageShell';
import { FavoriteFolderSidebar } from './components/FavoriteFolderSidebar';
import { FavoriteItemsPanel } from './components/FavoriteItemsPanel';
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

const FavoritesPage: FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const {
    data: folders,
    loading: foldersLoading,
    error: foldersError,
    run: runFetchFolders,
    setData: setFolders,
  } = useAsyncState<FavoriteFolderItem[]>({
    initialData: [],
    defaultError: '获取收藏夹失败',
  });

  const {
    data: items,
    loading: itemsLoading,
    error: itemsError,
    run: runFetchItems,
    setData: setItems,
  } = useAsyncState<FavoriteFolderContentItem[]>({
    initialData: [],
    defaultError: '获取收藏内容失败',
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showNewInput, setShowNewInput] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  const fetchFolders = useCallback(async () => {
    await runFetchFolders(async () => {
      const data = await getFavoriteFolders();
      if (data.items.length > 0 && !selectedId) {
        setSelectedId(data.items[0].id);
      }
      return data.items;
    });
  }, [runFetchFolders, selectedId]);

  const fetchItems = useCallback(async (folderId: string) => {
    await runFetchItems(() => getFolderItems(folderId));
  }, [runFetchItems]);

  useEffect(() => {
    if (foldersError) {
      logger.error('获取收藏夹失败:', foldersError);
      toast.error(foldersError);
    }
  }, [foldersError]);

  useEffect(() => {
    if (itemsError) {
      logger.error('获取收藏内容失败:', itemsError);
      toast.error(itemsError);
    }
  }, [itemsError]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

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
  }, [newFolderName, setFolders]);

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
    [editName, setFolders],
  );

  const handleDeleteFolder = useCallback(
    async (folderId: string) => {
      try {
        await deleteFavoriteFolder(folderId);
        setFolders((prev: FavoriteFolderItem[]) =>
          prev.filter((f: FavoriteFolderItem) => f.id !== folderId),
        );

        if (selectedId === folderId) {
          const nextFolder = folders.find((item: FavoriteFolderItem) => item.id !== folderId);
          setSelectedId(nextFolder ? nextFolder.id : null);
          setItems([]);
        }

        setMenuOpenId(null);
        toast.success('收藏夹已删除');
      } catch (err: unknown) {
        logger.error('删除收藏夹失败:', err);
        toast.error('删除失败，请重试');
      }
    },
    [folders, selectedId, setFolders, setItems],
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
    [selectedId, setFolders, setItems],
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
    <PageFrame
      className="min-h-screen bg-[hsl(228_15%_8%)]"
      containerClassName="max-w-7xl mx-auto px-6 py-8"
      contentClassName=""
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[hsl(220_15%_90%)] font-['Space_Grotesk']">
          我的收藏
        </h1>
        <p className="text-[hsl(220_10%_55%)] mt-1 text-sm">
          管理你的收藏夹和收藏内容
        </p>
      </div>

      <div className="flex gap-6">
        <FavoriteFolderSidebar
          folders={folders}
          loading={foldersLoading}
          selectedId={selectedId}
          menuOpenId={menuOpenId}
          editingId={editingId}
          showNewInput={showNewInput}
          creating={creating}
          editName={editName}
          newFolderName={newFolderName}
          onSetSelectedId={setSelectedId}
          onSetEditingId={setEditingId}
          onSetEditName={setEditName}
          onSetMenuOpenId={setMenuOpenId}
          onSetShowNewInput={setShowNewInput}
          onSetNewFolderName={setNewFolderName}
          onCreateFolder={handleCreateFolder}
          onRename={handleRename}
          onDelete={handleDeleteFolder}
        />

        <div className="flex-1 min-w-0">
          <FavoriteItemsPanel
            selectedId={selectedId}
            selectedFolder={selectedFolder}
            itemsLoading={itemsLoading}
            items={items}
            onItemClick={handleItemClick}
            onRemoveItem={handleRemoveItem}
          />
        </div>
      </div>
    </PageFrame>
  );
};

export default FavoritesPage;
