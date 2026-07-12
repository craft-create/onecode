import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Film, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Image } from '@client/src/components/ui/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import { useAuth } from '@client/src/hooks/useAuth';
import { getUserUploads } from '@client/src/api/user-materials';
import { deleteMaterial } from '@client/src/api/materials';
import type { UserMaterialItem } from '@shared/material.interface';

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.25 } },
};

const AccountMaterialsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<UserMaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<UserMaterialItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // 未登录时重定向到登录页
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await getUserUploads({ pageSize: 50 });
      setItems(res.items);
    } catch (err: unknown) {
      logger.error('Failed to fetch user materials:', err);
      setFetchError('加载我的素材失败，请检查网络后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMaterial(deleteTarget.material_id);
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      toast.success('素材已删除');
    } catch (err: unknown) {
      logger.error('Failed to delete material:', err);
      toast.error('删除失败，请重试');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const formatTime = (iso: string): string => {
    const d = new Date(iso);
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-['Space_Grotesk']">
              我的素材
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {items.length} 个素材
            </p>
          </div>
        </div>

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
              <div
                key={i}
                className="rounded-lg bg-card animate-pulse h-64"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Film className="size-6" />
              </EmptyMedia>
              <EmptyTitle>暂无上传素材</EmptyTitle>
              <EmptyDescription>
                前往素材库上传你的第一个素材
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            <AnimatePresence mode="popLayout">
              {items.map((item, idx) => (
                <motion.div
                  key={item.id}
                  layout
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.35, delay: idx * 0.04 }}
                  className="group relative bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-[0_4px_24px_-4px_rgba(124_92_255_0.2)] transition-all duration-300"
                >
                  <div
                    onClick={() => navigate(`/materials/${item.material_id}`)}
                    className="cursor-pointer"
                  >
                    <div className="aspect-[16/10] bg-accent/30 relative overflow-hidden">
                      {item.cover_url ? (
                        <Image
                          src={item.cover_url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="size-10 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground truncate text-sm mb-2">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-1 text-muted-foreground text-xs">
                        <Clock className="size-3" />
                        <span>{formatTime(item.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="size-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(item);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="bg-card border-border text-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              确定要删除素材「{deleteTarget?.title}」吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="border-border text-muted-foreground"
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountMaterialsPage;
