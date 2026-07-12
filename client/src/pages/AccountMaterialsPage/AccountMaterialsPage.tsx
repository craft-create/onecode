import { type FC, useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Film, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { useAuth } from '@client/src/hooks/useAuth';
import { deleteMaterial } from '@client/src/api/materials';
import { getUserUploads } from '@client/src/api/user-materials';
import { useAsyncState } from '@client/src/hooks/useAsyncState';
import { PageFrame } from '../shared/PageShell';
import { AccountMaterialCard } from './components/AccountMaterialCard';
import type { UserMaterialItem } from '@shared/material.interface';
import { AccountMaterialsDeleteDialog } from './components/AccountMaterialsDeleteDialog';

const errorMessages = {
  fetch: '加载我的素材失败，请检查网络后重试',
  delete: '删除失败，请重试',
};

const AccountMaterialsPage: FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    data: items,
    loading,
    error: fetchError,
    run: runFetchItems,
    setData: setItems,
    setError: setFetchError,
  } = useAsyncState<UserMaterialItem[]>({
    initialData: [],
    defaultError: errorMessages.fetch,
  });

  const [deleteTarget, setDeleteTarget] = useState<UserMaterialItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  const fetchItems = useCallback(async () => {
    await runFetchItems(async () => {
      const res = await getUserUploads({ pageSize: 50 });
      return res.items;
    });
  }, [runFetchItems]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMaterial(deleteTarget.material_id);
      setItems((prev: UserMaterialItem[]) => prev.filter((i) => i.id !== deleteTarget.id));
      toast.success('素材已删除');
    } catch (err: unknown) {
      logger.error('Failed to delete material:', err);
      setFetchError(errorMessages.delete);
      toast.error(errorMessages.delete);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, setItems, setFetchError]);

  return (
    <PageFrame
      className="min-h-screen bg-background"
      containerClassName="max-w-7xl mx-auto px-6 py-8"
      title="我的素材"
      description={`${items.length} 个素材`}
    >
      {fetchError && !loading ? (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <p className="text-foreground text-sm mb-4">{fetchError}</p>
          <button
            onClick={fetchItems}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-card animate-pulse h-64" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Film className="size-6" />
            </EmptyMedia>
            <EmptyTitle>暂无上传素材</EmptyTitle>
            <EmptyDescription>前往素材库上传你的第一个素材</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <AnimatePresence mode="popLayout">
            {items.map((item, idx) => (
              <AccountMaterialCard
                key={item.id}
                item={item}
                index={idx}
                onClick={() => navigate(`/materials/${item.material_id}`)}
                onDelete={() => {
                  setDeleteTarget(item);
                }}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AccountMaterialsDeleteDialog
        item={deleteTarget}
        deleting={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </PageFrame>
  );
};

export default AccountMaterialsPage;
